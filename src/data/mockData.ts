// ── Pricing & Margin Workspace · dataset façade ──────────────────────────
//
// The dataset itself lives in the active scenario (src/scenarios/<key>/
// data.ts, aliased as `@scenario`) — that file is the single source of truth
// for the demo, and every figure in it is synthetic. This module re-exports
// it under the names the pages use and owns the logic every scenario shares:
// the customer hierarchy, the seeded shipment generator, and the
// reconciliation printout.

import { scenario } from '@scenario'
import { iso, AS_OF, COPY, LINES } from '../lib/config'
import type { PricingSetupLine, ItemPerformance, OrgNode } from '../models/types'
import { lineMarginPct, lineBreachesFloor } from '../models/types'

const { data } = scenario
const { shipments } = data

// ═══════════════════════════════════════════════════════════════════════
// 0 · Customers
// ═══════════════════════════════════════════════════════════════════════

export const CUSTOMERS = data.customers

/** Every retail ship-to the Price Updates page can scope to. */
export const LOCATIONS: { code: string; name: string; region: string }[] = CUSTOMERS.map((c) => ({
  code: c.code,
  name: c.name,
  region: c.segment,
}))

/**
 * Customer hierarchy. Price updates roll out against a node here — pick a
 * segment and the change applies to the customers under it.
 */
export const ORG_HIERARCHY: OrgNode = {
  code: 'ALL',
  name: COPY.orgRootName,
  children: data.segments.map((s) => ({
    code: s.code,
    name: s.name,
    children: CUSTOMERS.filter((c) => c.segment === s.code).map((c) => ({ code: c.code, name: c.name })),
  })),
}

/** Contracts the foodservice (contract) book is priced under. */
export const FOODSERVICE_CONTRACTS = data.contracts

// ═══════════════════════════════════════════════════════════════════════
// 1–4 · Overrides, pricing setup, price history, recommendations
// ═══════════════════════════════════════════════════════════════════════

export const PRICE_OVERRIDES = data.overrides
export const PRICING_SETUP = data.pricingSetup
export const PRICE_HISTORY = data.priceHistory
export const RECOMMENDATIONS = data.recommendations
export const RETAIL_KPIS = data.retailKpis
export const FOODSERVICE_KPIS = data.foodserviceKpis

/** Category list for filters. */
export const CATEGORIES = data.categories

/** Trade agreement journal for the Price Simulator — undefined hides the page. */
export const SIMULATOR = data.simulator

// ═══════════════════════════════════════════════════════════════════════
// 5 · Shipment performance (seeded, deterministic)
// ═══════════════════════════════════════════════════════════════════════
// Shipments are generated rather than listed, because the Price Updates page
// needs an arbitrary date window and 11 items x 11 customers x 200 days is
// not something to hand-write. The generator is seeded off (item, customer,
// day), so it is fully reproducible — the same demo shows the same numbers
// twice — and any date range sums the same way every time. The curve shapes,
// item profiles and customer weights come from the scenario.

/** Days of shipment history available before AS_OF. */
export const PERFORMANCE_DAYS = 200

const MS_PER_DAY = 86_400_000

/** FNV-1a — stable string hash for seeding. */
function hashStr(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** mulberry32 — small seeded PRNG. */
function rand(seed: number): number {
  let a = seed | 0
  a = (a + 0x6d2b79f5) | 0
  let t = Math.imul(a ^ (a >>> 15), 1 | a)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/** Life in days the item's cover is measured against, when it is profiled. */
export function shelfLifeFor(itemNumber: string): number | undefined {
  return shipments.itemProfile[itemNumber]?.shelfLifeDays
}

/** Units shipped of one item to one customer on one day. Deterministic. */
function unitsOnDay(itemNumber: string, customer: string, date: Date): number {
  const p = shipments.itemProfile[itemNumber]
  const weight = shipments.customerWeight[customer]
  if (p === undefined || weight === undefined) return 0
  const curve = shipments.seasonCurves[p.season]
  if (curve === undefined) {
    throw new Error(`Scenario '${scenario.key}': item ${itemNumber} uses unknown season curve '${p.season}'.`)
  }
  const seed = hashStr(`${itemNumber}|${customer}|${date.toISOString().slice(0, 10)}`)
  const noise = 0.7 + rand(seed) * 0.6
  return Math.round(p.base * weight * curve[date.getMonth()] * shipments.dowFactor[date.getDay()] * noise)
}

/**
 * Days of cover is only meaningful against a *recent* run rate — a shipper
 * plans forward on how the item is moving now. 28 days is four whole weeks,
 * so day-of-week effects average out.
 */
export const RECENT_RATE_DAYS = 28

/** Mean daily units over the trailing RECENT_RATE_DAYS. */
function recentDailyRate(itemNumber: string, customer: string): number {
  const end = new Date(AS_OF + 'T00:00:00').getTime()
  let total = 0
  for (let i = 0; i < RECENT_RATE_DAYS; i++) {
    total += unitsOnDay(itemNumber, customer, new Date(end - i * MS_PER_DAY))
  }
  return total / RECENT_RATE_DAYS
}

/**
 * Units allocated on hand at AS_OF, sized so the item carries its target days
 * of cover *at the recent run rate*. That keeps the grid, the cover figure and
 * the inventory recommendation telling the same story.
 */
function onHandAt(itemNumber: string, customer: string): number {
  const p = shipments.itemProfile[itemNumber]
  if (p === undefined || shipments.customerWeight[customer] === undefined) return 0
  return Math.round(recentDailyRate(itemNumber, customer) * p.coverDays)
}

/**
 * Days of cover left for an item across customers, measured on the trailing
 * run rate rather than on whatever window the user happens to be filtering to.
 */
export function coverDaysFor(itemNumber: string, customers: string[]): number {
  let rate = 0
  let onHand = 0
  for (const c of customers) {
    rate += recentDailyRate(itemNumber, c)
    onHand += onHandAt(itemNumber, c)
  }
  if (rate <= 0) return Infinity
  return onHand / rate
}

/**
 * Shipment performance for one item across a set of customers over a date
 * window. The window is clamped to the history that exists and never runs
 * past AS_OF — there are no future shipments.
 */
export function performanceFor(
  itemNumber: string,
  customers: string[],
  from: string,
  to: string,
): ItemPerformance {
  const earliest = new Date(iso(-PERFORMANCE_DAYS) + 'T00:00:00').getTime()
  const latest = new Date(AS_OF + 'T00:00:00').getTime()
  const start = Math.max(new Date(from + 'T00:00:00').getTime(), earliest)
  const end = Math.min(new Date(to + 'T00:00:00').getTime(), latest)
  if (end < start) return { unitsSold: 0, unitsAvailable: 0, windowDays: 0 }

  const windowDays = Math.round((end - start) / MS_PER_DAY) + 1
  let unitsSold = 0
  for (const c of customers) {
    for (let t = start; t <= end; t += MS_PER_DAY) {
      unitsSold += unitsOnDay(itemNumber, c, new Date(t))
    }
  }
  const onHand = customers.reduce((sum, c) => sum + onHandAt(itemNumber, c), 0)
  return { unitsSold, unitsAvailable: unitsSold + onHand, windowDays }
}

// ═══════════════════════════════════════════════════════════════════════
// 6 · Reconciliation
// ═══════════════════════════════════════════════════════════════════════
// Surfaced on the Setup page so the numbers can be defended live if someone
// interrogates them. Derived from the data above — never typed in by hand.

export interface ReconciliationLine {
  label: string
  value: string
}

export function reconciliation(marginTarget: number): ReconciliationLine[] {
  const retail = PRICING_SETUP.filter((l) => l.mode === 'Retail')
  const foodservice = PRICING_SETUP.filter((l) => l.mode === 'Foodservice')
  const failing = PRICING_SETUP.filter((l) => lineMarginPct(l) <= marginTarget)
  const breaches = PRICING_SETUP.filter((l) => lineBreachesFloor(l, AS_OF))
  const avg = (ls: PricingSetupLine[]) =>
    ls.length ? ls.reduce((s, l) => s + lineMarginPct(l), 0) / ls.length : 0

  // Blended sell-through over the trailing four weeks, on the retail lines'
  // own customers.
  let sold = 0
  let available = 0
  for (const l of retail) {
    const p = performanceFor(l.itemNumber, l.customerCodes ?? [], iso(-(RECENT_RATE_DAYS - 1)), AS_OF)
    sold += p.unitsSold
    available += p.unitsAvailable
  }
  const overallSellThrough = available > 0 ? (sold / available) * 100 : 0
  const states = new Set(CUSTOMERS.map((c) => c.state))
  const { Retail, Foodservice } = COPY.modes
  const r = COPY.reconciliation

  return [
    { label: 'As-of date', value: AS_OF },
    { label: 'Order-line price overrides on file', value: String(PRICE_OVERRIDES.length) },
    {
      label: 'Active pricing setup lines',
      value: `${PRICING_SETUP.length} (${retail.length} ${Retail.lower} · ${foodservice.length} ${Foodservice.lower})`,
    },
    { label: `Lines at or below ${marginTarget}% margin`, value: `${failing.length} of ${PRICING_SETUP.length}` },
    { label: 'Below floor without an active promotion', value: String(breaches.length) },
    { label: r.premiumAvg, value: `${avg(PRICING_SETUP.filter((l) => l.productLine === LINES.premium)).toFixed(1)}%` },
    { label: r.commodityAvg, value: `${avg(PRICING_SETUP.filter((l) => l.productLine === LINES.commodity)).toFixed(1)}%` },
    { label: 'Price history records', value: `${PRICE_HISTORY.length} across ${new Set(PRICE_HISTORY.map((h) => h.scopeId)).size} price scopes` },
    { label: r.customersLabel, value: `${CUSTOMERS.length} ship-tos across ${states.size} ${COPY.regionsWord}` },
    { label: r.contractsLabel, value: String(FOODSERVICE_CONTRACTS.length) },
    { label: 'Shipment history generated', value: `${PERFORMANCE_DAYS} days x ${CUSTOMERS.length} customers, seeded` },
    {
      label: `Trailing 4-week sell-through (${Retail.lower} lines)`,
      value: `${overallSellThrough.toFixed(1)}%`,
    },
  ]
}
