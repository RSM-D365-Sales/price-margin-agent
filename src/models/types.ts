// ── Alvin's Island · Pricing & Margin Agent · domain types ──────────────
// Two pricing modes:
//   Retail — alvinsisland.com + the store estate. Alvin's Island sets the price.
//   Vendor — inbound brand programs (Quiksilver, Roxy, Volcom, …). The brand
//            sets a MAP floor and funds part of the markdown; margin is a
//            negotiation, not a decision.

export type ProductCategory =
  | 'Swimwear'
  | 'Boardshorts'
  | 'Tees & Tanks'
  | 'Hoodies & Fleece'
  | 'Dry-Fit'
  | 'Headwear'
  | 'Footwear'
  | 'Beach Accessories'
  | 'Souvenirs'

export type Channel = 'Ecommerce' | 'Store' | 'Vendor Program'

export type PricingMode = 'Retail' | 'Vendor'

/** Own-label souvenir/beach goods carry very different economics to branded surf. */
export type ProductLine = 'Own label' | 'Branded'

// ═══ Price override audit ═══════════════════════════════════════════════

export type OverrideReasonCode =
  | 'Price Match'
  | 'Damaged / Sun-Faded'
  | 'Group / Tour Rate'
  | 'Manager Discretion'
  | 'Display Sample'
  | 'Event Promotion'

export interface PriceOverride {
  id: string
  orderNumber: string
  orderDate: string // ISO
  channel: Channel
  storeOrSite: string
  styleName: string
  itemNumber: string
  category: ProductCategory
  productLine: ProductLine
  colorSize: string
  unitCost: number
  originalPrice: number
  overridePrice: number
  reasonCode: OverrideReasonCode
  overriddenBy: string
  overriddenByEmail: string
  /** Vendor MAP floor, when the item is branded and covered by a program. */
  mapFloor?: number
}

export function overrideMarginPct(o: PriceOverride): number {
  if (o.overridePrice <= 0) return -100
  return ((o.overridePrice - o.unitCost) / o.overridePrice) * 100
}

/** Selling a MAP-covered item below the floor is a vendor-agreement breach. */
export function overrideBreachesMap(o: PriceOverride): boolean {
  return o.mapFloor !== undefined && o.overridePrice < o.mapFloor - 0.005
}

// ═══ Margin threshold test (pricing setup) ══════════════════════════════

export interface DiscountTier {
  label: string // "1–5 units" or "$0–$500"
  discountPct: number
}

export interface DiscountDetail {
  name: string
  type: 'Line' | 'Threshold' | 'Quantity' | 'Mix and match'
  validFrom: string
  validTo: string
  tiers?: DiscountTier[]
}

export interface PricingSetupLine {
  id: string
  mode: PricingMode
  channel: Channel
  /** Site, store group, or vendor program the price applies to. */
  channelDetail: string
  /** Vendor mode: the brand's account number in D365. */
  vendorAccount?: string
  /** Vendor mode: the program / price group the line belongs to. */
  vendorProgram?: string
  styleName: string
  itemNumber: string
  category: ProductCategory
  productLine: ProductLine
  colorSize: string
  quantity: number // editable in the grid
  basePrice: number // base price / trade agreement
  marginComponent: number // $ added on top of base
  discountPct: number // effective discount at the current qty
  discount?: DiscountDetail // present for threshold / quantity discounts
  autoCharge: number // $ per line
  unitCost: number
  /**
   * Vendor co-op / markdown allowance as a % of cost. The brand funds part of
   * the promotion, so the margin the business actually earns is measured
   * against a reduced effective cost — see lineEffectiveCost.
   */
  vendorAllowancePct?: number
  /** Minimum advertised price the vendor program enforces. */
  mapFloor?: number
  /**
   * End of the vendor-approved markdown window. Pricing below MAP inside this
   * window is agreed; outside it — or with no waiver at all — it is a breach
   * of the vendor agreement.
   */
  mapWaiverUntil?: string
  validFrom: string
  validTo: string
}

// sales price = (base + margin component) * (1 - discount) + auto charge
export function lineSalesPrice(l: PricingSetupLine): number {
  return (l.basePrice + l.marginComponent) * (1 - l.discountPct / 100) + l.autoCharge
}

/** Unit cost after any vendor allowance is applied. */
export function lineEffectiveCost(l: PricingSetupLine): number {
  return l.unitCost * (1 - (l.vendorAllowancePct ?? 0) / 100)
}

export function lineMarginPct(l: PricingSetupLine): number {
  const sp = lineSalesPrice(l)
  if (sp <= 0) return -100
  return ((sp - lineEffectiveCost(l)) / sp) * 100
}

/** Margin before the vendor allowance — what the P&L looks like unfunded. */
export function lineUnfundedMarginPct(l: PricingSetupLine): number {
  const sp = lineSalesPrice(l)
  if (sp <= 0) return -100
  return ((sp - l.unitCost) / sp) * 100
}

/** True when the line prices below MAP at all — waiver or not. */
export function lineBelowMap(l: PricingSetupLine): boolean {
  return l.mapFloor !== undefined && lineSalesPrice(l) < l.mapFloor - 0.005
}

/**
 * True when the line prices below MAP *without* an active vendor waiver —
 * i.e. an actual breach of the vendor agreement rather than an agreed markdown.
 */
export function lineBreachesMap(l: PricingSetupLine, asOf: string): boolean {
  if (!lineBelowMap(l)) return false
  return !(l.mapWaiverUntil !== undefined && asOf <= l.mapWaiverUntil)
}

export type PriceComponentTarget = 'basePrice' | 'marginComponent' | 'discountPct'

// ═══ Price history audit ════════════════════════════════════════════════

export interface PriceHistoryEntry {
  id: string
  price: number
  activeFrom: string
  activeTo: string | null // null = open-ended / current
  changedBy: string
  changeType:
    | 'Initial'
    | 'Season set'
    | 'Markdown'
    | 'Manual update'
    | 'MAP update'
    | 'Agent reprice'
  note?: string
}

/**
 * A price scope is whatever the price is set against: the retail list price,
 * a single channel, a store cluster, or a vendor program's MAP schedule.
 */
export interface PriceHistoryRecord {
  productKey: string // itemNumber + variant + scope
  styleName: string
  itemNumber: string
  category: ProductCategory
  productLine: ProductLine
  colorSize: string
  scopeId: string // 'RETAIL', 'ECOM', 'ST-PCB', 'VP-QUIK', …
  scopeName: string // human label shown in the picker
  entries: PriceHistoryEntry[] // newest first
}

// ═══ AI recommendations ═════════════════════════════════════════════════

export type RecAudience = 'Retail' | 'Vendor'

export type RecKind =
  | 'Increase price'
  | 'Delay markdown'
  | 'Markdown timing'
  | 'Optimize promotion'
  | 'Inventory-driven'
  | 'Store-specific pricing'
  | 'Margin protection'
  | 'Product mix'
  | 'Vendor terms'
  | 'MAP compliance'

export interface Recommendation {
  id: string
  audience: RecAudience
  kind: RecKind
  title: string
  detail: string
  bullets?: string[]
  impact?: string // "+$185K margin"
  confidence: 'High' | 'Medium' | 'Low'
  status: 'Open' | 'Accepted' | 'Dismissed'
}

export interface KpiMonitor {
  label: string
  value: string
  trend?: 'up' | 'down' | 'flat'
}

// ═══ Store estate ═══════════════════════════════════════════════════════

export interface StoreLocation {
  code: string
  name: string
  state: 'FL' | 'AL'
}
