// ── Trade agreement evaluation (sales) ──────────────────────────────────
//
// Mirrors how Dynamics 365 F&SC resolves a sales price and line discount from
// trade agreement journal lines, so the Price Simulator can show *why* a
// customer pays what it pays.
//
// Price (sales)
//   Searched account-first: Table (the customer) → Group (customer price
//   group) → All, item code Table. Every valid line found while "Find next" is
//   on is a candidate; the LOWEST price wins. A valid line with Find next off
//   ends the search after its level. Nothing found → the item's base price.
//
// Line discount (sales)
//   Searched over the nine account × item combinations in this order:
//   Table/Table, Table/Group, Table/All, Group/Table, … All/All, where the
//   item Group is the item's line discount group. Valid lines ADD together
//   (the AR parameter "Line discount" = sum of found lines) until a valid line
//   with Find next off is reached, which stops the search.
//
// A line is valid when From ≤ qty < To (To 0 = no limit) and the price date
// falls inside its From/To dates (blank = open). Net unit price =
//   (price − discount amounts) × (1 − Σ discount % / 100).

export type CodeType = 'Table' | 'Group' | 'All'
export type AgreementRelation = 'price' | 'lineDiscount'

export interface TradeAgreementLine {
  id: string
  relation: AgreementRelation
  accountCode: CodeType
  /** Customer account (Table), group code (Group), '' (All). */
  accountSelection: string
  itemCode: CodeType
  /** Item number (Table), item line discount group (Group), '' (All). */
  itemSelection: string
  /** Quantity break, From ≤ qty < To. To 0 = no upper limit. */
  fromQty: number
  toQty: number
  fromDate?: string
  toDate?: string
  /** Price (price lines) or discount amount per unit (discount lines). */
  amount: number
  discountPct: number
  findNext: boolean
  /** Journal / program the line came from, shown as a tooltip. */
  note?: string
}

export interface SimItem {
  itemNumber: string
  name: string
  unit: string
  /** Item sales price — used when no price agreement is found. */
  basePrice: number
  unitCost: number
  /** Item line discount group (the "Group" item code on discount lines). */
  lineDiscountGroup: string
}

export interface SimCustomer {
  account: string
  name: string
  /** Who they are, in the prospect's terms (Fleet operator, …). */
  type: string
  priceGroup?: string
  lineDiscountGroup?: string
  /** Intercompany and similar: priced at transfer price, margin floor n/a. */
  floorExempt?: boolean
  /** Item numbers this customer buys — the product dropdown. */
  items: string[]
}

export interface SimulatorData {
  lede: string
  priceGroups: Record<string, string>
  lineDiscountGroups: Record<string, string>
  itemDiscountGroups: Record<string, string>
  customers: SimCustomer[]
  items: SimItem[]
  agreements: TradeAgreementLine[]
  defaults: { customer: string; item: string; qty: number }
}

export type LineStatus =
  | 'applied' // used in the price
  | 'superseded' // valid price line, but a lower price was found
  | 'qty' // right customer and item, quantity outside the break
  | 'date' // right customer and item, outside its dates
  | 'stopped' // never reached — an earlier line had Find next off
  | 'otherAccount' // a line for this item that belongs to someone else

export interface EvaluatedLine {
  line: TradeAgreementLine
  status: LineStatus
}

export interface SearchStep {
  relation: AgreementRelation
  accountCode: CodeType
  itemCode: CodeType
  /** What was looked up at this level ('' when the customer has no such group). */
  accountSelection: string
  itemSelection: string
  outcome: 'found' | 'none' | 'notSearched' | 'noGroup'
  found: number
}

export interface PriceResult {
  basePrice: number
  price: number
  priceLine: TradeAgreementLine | null
  discounts: TradeAgreementLine[]
  discountPct: number
  discountAmount: number
  netUnit: number
  netAmount: number
  unitCost: number
  marginPct: number
  /** A customer-specific (Table) price with a group/All discount stacked on it. */
  stacked: boolean
  lines: EvaluatedLine[]
  steps: SearchStep[]
}

const CODES: CodeType[] = ['Table', 'Group', 'All']

function accountSel(code: CodeType, rel: AgreementRelation, c: SimCustomer): string | undefined {
  if (code === 'Table') return c.account
  if (code === 'Group') return rel === 'price' ? c.priceGroup : c.lineDiscountGroup
  return ''
}

function itemSel(code: CodeType, item: SimItem): string {
  if (code === 'Table') return item.itemNumber
  if (code === 'Group') return item.lineDiscountGroup
  return ''
}

/** Does this line apply to this item at all (any customer)? */
function forItem(l: TradeAgreementLine, item: SimItem): boolean {
  return l.itemSelection === itemSel(l.itemCode, item)
}

function inQty(l: TradeAgreementLine, qty: number): boolean {
  return qty >= l.fromQty && (l.toQty === 0 || qty < l.toQty)
}

function inDate(l: TradeAgreementLine, date: string): boolean {
  return (!l.fromDate || date >= l.fromDate) && (!l.toDate || date <= l.toDate)
}

export function evaluatePrice(
  data: SimulatorData,
  customer: SimCustomer,
  item: SimItem,
  qty: number,
  date: string,
): PriceResult {
  const status = new Map<string, LineStatus>()
  const steps: SearchStep[] = []

  function search(rel: AgreementRelation, itemCodes: CodeType[]): TradeAgreementLine[] {
    const valid: TradeAgreementLine[] = []
    let stopped = false
    for (const ac of CODES) {
      for (const ic of itemCodes) {
        const aSel = accountSel(ac, rel, customer)
        const iSel = itemSel(ic, item)
        const base = { relation: rel, accountCode: ac, itemCode: ic, accountSelection: aSel ?? '', itemSelection: iSel }
        const candidates =
          aSel === undefined
            ? []
            : data.agreements.filter(
                (l) =>
                  l.relation === rel &&
                  l.accountCode === ac &&
                  l.itemCode === ic &&
                  l.accountSelection === aSel &&
                  l.itemSelection === iSel,
              )
        if (stopped) {
          candidates.forEach((l) => status.set(l.id, 'stopped'))
          steps.push({ ...base, outcome: aSel === undefined ? 'noGroup' : 'notSearched', found: 0 })
          continue
        }
        if (aSel === undefined) {
          steps.push({ ...base, outcome: 'noGroup', found: 0 })
          continue
        }
        const ok = candidates.filter((l) => {
          if (!inQty(l, qty)) return status.set(l.id, 'qty'), false
          if (!inDate(l, date)) return status.set(l.id, 'date'), false
          return true
        })
        ok.forEach((l) => status.set(l.id, 'applied'))
        valid.push(...ok)
        steps.push({ ...base, outcome: ok.length ? 'found' : 'none', found: ok.length })
        if (ok.some((l) => !l.findNext)) stopped = true
      }
    }
    return valid
  }

  // Price: lowest valid price wins; the rest are superseded.
  const prices = search('price', ['Table'])
  const priceLine = prices.length ? prices.reduce((a, b) => (b.amount < a.amount ? b : a)) : null
  prices.forEach((l) => l !== priceLine && status.set(l.id, 'superseded'))
  const price = priceLine ? priceLine.amount : item.basePrice

  // Line discounts: every valid line adds.
  const discounts = search('lineDiscount', CODES)
  const discountPct = discounts.reduce((s, l) => s + l.discountPct, 0)
  const discountAmount = discounts.reduce((s, l) => s + l.amount, 0)
  const netUnit = Math.max(0, (price - discountAmount) * (1 - discountPct / 100))

  // Every journal line for this item, in journal order, with its fate.
  const lines: EvaluatedLine[] = data.agreements
    .filter((l) => forItem(l, item))
    .map((l) => ({ line: l, status: status.get(l.id) ?? 'otherAccount' }))

  return {
    basePrice: item.basePrice,
    price,
    priceLine,
    discounts,
    discountPct,
    discountAmount,
    netUnit,
    netAmount: netUnit * qty,
    unitCost: item.unitCost,
    marginPct: netUnit > 0 ? ((netUnit - item.unitCost) / netUnit) * 100 : -100,
    stacked: priceLine?.accountCode === 'Table' && discounts.some((d) => d.accountCode !== 'Table'),
    lines,
    steps,
  }
}

export const RELATION_LABEL: Record<AgreementRelation, string> = {
  price: 'Price (sales)',
  lineDiscount: 'Line discount (Sales)',
}
