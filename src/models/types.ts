// ── Sales Margin Agent · domain types ───────────────────────────────────
// Naming mirrors the Consignment / Popup agent conventions.

export type ProductCategory =
  | 'Knitwear'
  | 'Outerwear'
  | 'Dresses'
  | 'Tops'
  | 'Bottoms'
  | 'Footwear'
  | 'Accessories'

export type Channel = 'Ecommerce' | 'Retail Store' | 'Wholesale'

export type PricingMode = 'D2C' | 'B2B'

// ── Price override audit ──
export type OverrideReasonCode =
  | 'Price Match'
  | 'Damaged Goods'
  | 'Customer Loyalty'
  | 'Manager Discretion'
  | 'Floor Sample'
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
  colorSize: string
  unitCost: number
  originalPrice: number
  overridePrice: number
  reasonCode: OverrideReasonCode
  overriddenBy: string // user id / name
  overriddenByEmail: string
}

export function overrideMarginPct(o: PriceOverride): number {
  if (o.overridePrice <= 0) return -100
  return ((o.overridePrice - o.unitCost) / o.overridePrice) * 100
}

// ── Margin threshold test (pricing setup) ──
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
  channelDetail: string // site / store / customer or customer group
  customerAccount?: string // B2B: customer number
  customerGroup?: string // B2B: customer price group
  styleName: string
  itemNumber: string
  category: ProductCategory
  colorSize: string
  quantity: number // editable in grid
  basePrice: number // base price / trade agreement
  marginComponent: number // $ added on top of base
  discountPct: number // effective discount at current qty
  discount?: DiscountDetail // present when threshold / quantity discount
  autoCharge: number // $ per line
  unitCost: number
  validFrom: string
  validTo: string
}

// sales price = (base + margin component) * (1 - discount) + auto charge
export function lineSalesPrice(l: PricingSetupLine): number {
  return (l.basePrice + l.marginComponent) * (1 - l.discountPct / 100) + l.autoCharge
}

export function lineMarginPct(l: PricingSetupLine): number {
  const sp = lineSalesPrice(l)
  if (sp <= 0) return -100
  return ((sp - l.unitCost) / sp) * 100
}

export type PriceComponentTarget = 'basePrice' | 'marginComponent' | 'discountPct'

// ── Price history audit ──
export interface PriceHistoryEntry {
  id: string
  price: number
  activeFrom: string
  activeTo: string | null // null = open-ended / current
  changedBy: string
  changeType: 'Initial' | 'Trade agreement' | 'Markdown' | 'Manual update' | 'Contract renewal' | 'Agent reprice'
  note?: string
}

export interface PriceHistoryRecord {
  productKey: string // itemNumber + variant
  styleName: string
  itemNumber: string
  category: ProductCategory
  colorSize: string
  customerAccount: string // "D2C" for direct
  customerName: string
  entries: PriceHistoryEntry[] // newest first
}

// ── AI recommendations ──
export type RecAudience = 'D2C' | 'Wholesale'

export type RecKind =
  | 'Increase price'
  | 'Delay markdown'
  | 'Markdown timing'
  | 'Optimize promotion'
  | 'Inventory-driven'
  | 'Customer-specific pricing'
  | 'Margin protection'
  | 'Product mix'
  | 'Contract terms'

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
