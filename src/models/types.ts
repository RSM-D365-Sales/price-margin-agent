// ── Pricing & Margin Workspace · domain types ────────────────────────────
// Bluestem is a grower-packer-shipper. Two pricing modes:
//   Retail      — grocery, club & mass, natural and e-commerce customers,
//                 priced through customer price groups and trade promotions.
//   Foodservice — distributor, restaurant-chain and processor contracts. The
//                 price is a negotiated contract line; margin is a term of the
//                 contract, not a weekly decision.

export type ProductCategory =
  | 'Apples'
  | 'Berries'
  | 'Vegetables'
  | 'Salads'
  | 'Vegetable Blends'
  | 'Fruit Cups & Trays'

export type Channel = 'Grocery' | 'Club & Mass' | 'Natural' | 'E-commerce' | 'Foodservice Contract'

export type PricingMode = 'Retail' | 'Foodservice'

/**
 * Packed fresh (PK-*) is whole produce in a pouch, clamshell or carton — near
 * commodity, ~30% list margin. Fresh-cut (FC-*) is value-added at the Grand
 * Rapids plant and carries ~40%.
 */
export type ProductLine = 'Packed fresh' | 'Fresh-cut'

// ═══ Price override audit ═══════════════════════════════════════════════

export type OverrideReasonCode =
  | 'Competitive match'
  | 'Quality / short-dated'
  | 'Volume deal'
  | 'Rep discretion'
  | 'Promo price overlap'
  | 'Contract price not updated'

/** A sales-order line whose price was manually overridden. */
export interface PriceOverride {
  id: string
  orderNumber: string
  orderDate: string // ISO
  /** Cases on the order line. */
  cases: number
  channel: Channel
  /** Ship-to customer on the sales order. */
  customer: string
  itemName: string
  itemNumber: string
  category: ProductCategory
  productLine: ProductLine
  pack: string
  unitCost: number
  originalPrice: number
  overridePrice: number
  reasonCode: OverrideReasonCode
  overriddenBy: string
  overriddenByEmail: string
  /** Price-group floor, when the item is covered by one. */
  floorPrice?: number
}

export function overrideMarginPct(o: PriceOverride): number {
  if (o.overridePrice <= 0) return -100
  return ((o.overridePrice - o.unitCost) / o.overridePrice) * 100
}

/** An order-line override below the price floor needs an approved promotion. */
export function overrideBreachesFloor(o: PriceOverride): boolean {
  return o.floorPrice !== undefined && o.overridePrice < o.floorPrice - 0.005
}

// ═══ Margin threshold test (pricing setup) ══════════════════════════════

export interface DiscountTier {
  label: string // "1–239 cases" or "$0–$9,999"
  discountPct: number
}

export interface DiscountDetail {
  name: string
  type: 'Line' | 'Threshold' | 'Quantity' | 'Mix and match'
  /** Trade promotion the discount is booked against, when there is one. */
  promoId?: string
  validFrom: string
  validTo: string
  tiers?: DiscountTier[]
}

export interface PricingSetupLine {
  id: string
  mode: PricingMode
  channel: Channel
  /** Customer group, customer, or contract the price applies to. */
  channelDetail: string
  /** Foodservice mode: the customer account in D365. */
  customerAccount?: string
  /** Foodservice mode: the contract the line belongs to. */
  contract?: string
  /**
   * Retail mode: the ship-to customers this price actually applies to — codes
   * from CUSTOMERS. Drives the customer filter and roll-out scope on Price
   * Updates.
   */
  customerCodes?: string[]
  itemName: string
  itemNumber: string
  category: ProductCategory
  productLine: ProductLine
  pack: string
  quantity: number // cases on the order / contract tier, editable in the grid
  basePrice: number // base price / trade agreement, per case
  marginComponent: number // $ added on top of base
  discountPct: number // effective discount at the current qty
  discount?: DiscountDetail // present for threshold / quantity discounts
  autoCharge: number // $ per case (freight / fuel surcharge)
  unitCost: number // standard cost per case
  /**
   * Grower pool share as a % of cost. On pooled fruit (apples, blueberries)
   * the grower pool carries part of a promotional price, so the margin
   * Bluestem actually earns is measured against a reduced effective cost —
   * see lineEffectiveCost.
   */
  poolSharePct?: number
  /** Lowest price the customer's price group allows without a trade promotion. */
  floorPrice?: number
  /**
   * End of the approved trade-promotion window. Pricing below the floor
   * inside this window is agreed; outside it — or with no promotion at all —
   * it is a price leak.
   */
  promoUntil?: string
  validFrom: string
  validTo: string
}

// sales price = (base + margin component) * (1 - discount) + auto charge
export function lineSalesPrice(l: PricingSetupLine): number {
  return (l.basePrice + l.marginComponent) * (1 - l.discountPct / 100) + l.autoCharge
}

/** Cost per case after any grower pool share is applied. */
export function lineEffectiveCost(l: PricingSetupLine): number {
  return l.unitCost * (1 - (l.poolSharePct ?? 0) / 100)
}

export function lineMarginPct(l: PricingSetupLine): number {
  const sp = lineSalesPrice(l)
  if (sp <= 0) return -100
  return ((sp - lineEffectiveCost(l)) / sp) * 100
}

/** Margin before the grower pool share — what the P&L looks like unpooled. */
export function lineUnpooledMarginPct(l: PricingSetupLine): number {
  const sp = lineSalesPrice(l)
  if (sp <= 0) return -100
  return ((sp - l.unitCost) / sp) * 100
}

/** True when the line prices below its floor at all — promotion or not. */
export function lineBelowFloor(l: PricingSetupLine): boolean {
  return l.floorPrice !== undefined && lineSalesPrice(l) < l.floorPrice - 0.005
}

/**
 * True when the line prices below its floor *without* an active trade
 * promotion — a promo price that outlived its window, or a contract price
 * that was never updated.
 */
export function lineBreachesFloor(l: PricingSetupLine, asOf: string): boolean {
  if (!lineBelowFloor(l)) return false
  return !(l.promoUntil !== undefined && asOf <= l.promoUntil)
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
    | 'Trade promotion'
    | 'Contract update'
    | 'Cost-plus update'
    | 'Agent reprice'
  note?: string
}

/**
 * A price scope is whatever the price is set against: Bluestem's list price,
 * a customer price group, or one customer's contract.
 */
export interface PriceHistoryRecord {
  productKey: string // itemNumber + pack + scope
  itemName: string
  itemNumber: string
  category: ProductCategory
  productLine: ProductLine
  pack: string
  scopeId: string // 'LIST', 'PG-RETAIL-A', 'C10012', …
  scopeName: string // human label shown in the picker
  entries: PriceHistoryEntry[] // newest first
}

// ═══ AI recommendations ═════════════════════════════════════════════════

export type RecAudience = 'Retail' | 'Foodservice'

export type RecKind =
  | 'Increase price'
  | 'Hold price'
  | 'Promotion timing'
  | 'Inventory-driven'
  | 'Customer-specific pricing'
  | 'Margin protection'
  | 'Product mix'
  | 'Contract terms'
  | 'Floor compliance'

export interface Recommendation {
  id: string
  audience: RecAudience
  kind: RecKind
  title: string
  detail: string
  bullets?: string[]
  impact?: string // "+$85K margin"
  confidence: 'High' | 'Medium' | 'Low'
  status: 'Open' | 'Accepted' | 'Dismissed'
}

export interface KpiMonitor {
  label: string
  value: string
  trend?: 'up' | 'down' | 'flat'
}

// ═══ Retail customers ═══════════════════════════════════════════════════

export interface CustomerLocation {
  code: string // D365 customer account
  name: string
  city: string
  state: string
  /** Segment node in the customer hierarchy this customer rolls up to. */
  segment: string
}

/** A node in the customer hierarchy — used for price roll-out scope. */
export interface OrgNode {
  code: string
  name: string
  children?: OrgNode[]
}

/** Flatten an org node to the leaf customer codes underneath it. */
export function orgLeaves(node: OrgNode): string[] {
  if (!node.children || node.children.length === 0) return [node.code]
  return node.children.flatMap(orgLeaves)
}

// ═══ Sales performance ══════════════════════════════════════════════════

/** How velocity is expressed on the Price Updates grid. */
export type VelocityBasis = 'day' | 'week' | 'month'

export const VELOCITY_DAYS: Record<VelocityBasis, number> = {
  day: 1,
  week: 7,
  month: 30,
}

export interface ItemPerformance {
  unitsSold: number
  /**
   * Cases that were available to ship over the window: what shipped, plus
   * what is still allocated on hand at the end of it. A standard
   * simplification — it does not reconstruct receipts mid-window.
   */
  unitsAvailable: number
  /** Length of the measured window, in days. */
  windowDays: number
}

/** cases shipped ÷ cases available × 100 */
export function sellThroughPct(p: ItemPerformance): number {
  if (p.unitsAvailable <= 0) return 0
  return (p.unitsSold / p.unitsAvailable) * 100
}

/** cases shipped per day / week / month over the window */
export function salesVelocity(p: ItemPerformance, basis: VelocityBasis): number {
  if (p.windowDays <= 0) return 0
  return (p.unitsSold / p.windowDays) * VELOCITY_DAYS[basis]
}

// Days of cover deliberately lives in the data layer as coverDaysFor(), not
// here: it must be measured against a recent run rate, not against whatever
// window the user is filtering to — and it only means something next to the
// item's shelf life.
