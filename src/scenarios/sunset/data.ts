// ── Pricing & Margin Workspace · SUNSET dataset ──────────────────────────
//
// Single source of truth for the SUNSET (Mastronardi Produce) build. Every
// figure is synthetic. Items, packs, case list prices and case costs come
// from ./items.ts; assertMasterConsistency() below throws at load if any page
// would show a different cost or list price for an item.
//
//   · Specialty brands — Wild Wonders®, Angel Sweet®, SHAZAM!®, Sweet
//     Twister™, WOW™ Dreamberry, Organic Mini Cucumber 6ct. ~38–41% list
//     margin; a 15% promotion still clears 25%.
//   · Core greenhouse — Romana, Beefsteak, Sweet Bell, Mini Cucumbers.
//     ~28–35%; a routine 8–15% deal takes it under the floor. Partner
//     growers can fund part of a promotional price (the "partner-grower
//     share").
//
// Beats (same shape as the Bluestem book): 6 of 20 lines fail 25%, every one
// core greenhouse; 3 price below floor with no active promotion — the
// headline is Keystone Foodservice's Beefsteak contract line, whose winter
// kickoff allowance outlived TP-2026-118 by nine days.
//
// Retail channels are Grocery, Wholesale, Natural and E-commerce (Wholesale
// replaces Bluestem's Club & Mass). Every date is derived from AS_OF in
// ./config.ts. Mastronardi is the tenant; every customer, contract and rep
// below is fictional.

import { makeIso, shortDate } from '../../lib/dates'
import type { ScenarioData, ItemProfile } from '../types'
import type {
  PriceOverride,
  PricingSetupLine,
  PriceHistoryRecord,
  Recommendation,
  KpiMonitor,
  CustomerLocation,
} from '../../models/types'
import { AS_OF } from './config'
import { MASTER, costOf, item, listOf, type ItemNumber } from './items'

const iso = makeIso(AS_OF)

// ═══════════════════════════════════════════════════════════════════════
// 0 · Retail customers
// ═══════════════════════════════════════════════════════════════════════

const CUSTOMERS: CustomerLocation[] = [
  { code: 'C10001', name: 'Great Lakes Grocers', city: 'Grand Rapids', state: 'MI', segment: 'SEG-GRO' },
  { code: 'C10002', name: 'Northwind Foods', city: 'Columbus', state: 'OH', segment: 'SEG-GRO' },
  { code: 'C10003', name: 'Harborline Markets', city: 'Cleveland', state: 'OH', segment: 'SEG-GRO' },
  { code: 'C10006', name: 'Riverbend Supermarkets', city: 'Pittsburgh', state: 'PA', segment: 'SEG-GRO' },
  { code: 'C10005', name: 'Maple Crest Food Markets', city: 'London', state: 'ON', segment: 'SEG-GRO' },
  { code: 'C10007', name: 'Summit Produce Wholesale', city: 'Toronto', state: 'ON', segment: 'SEG-WHL' },
  { code: 'C10008', name: 'Valley Fresh Distributors', city: 'Detroit', state: 'MI', segment: 'SEG-WHL' },
  { code: 'C10009', name: 'Lakeside Natural Foods', city: 'Ann Arbor', state: 'MI', segment: 'SEG-NAT' },
  { code: 'C10010', name: 'Green Cart Co-op', city: 'Ottawa', state: 'ON', segment: 'SEG-NAT' },
  { code: 'C10026', name: 'Pantry Prime Meal Kits', city: 'Indianapolis', state: 'IN', segment: 'SEG-ECOM' },
  { code: 'C10027', name: 'DoorStep Grocer', city: 'Chicago', state: 'IL', segment: 'SEG-ECOM' },
]

const SEGMENTS: { code: string; name: string }[] = [
  { code: 'SEG-GRO', name: 'Grocery' },
  { code: 'SEG-WHL', name: 'Wholesale' },
  { code: 'SEG-NAT', name: 'Natural' },
  { code: 'SEG-ECOM', name: 'E-commerce' },
]

const inSegment = (seg: string) => CUSTOMERS.filter((c) => c.segment === seg).map((c) => c.code)
const GROCERY = inSegment('SEG-GRO')
const NATURAL = inSegment('SEG-NAT')
const ECOMMERCE = inSegment('SEG-ECOM')

/** Foodservice and processor contracts the foodservice book is priced under. */
const FOODSERVICE_CONTRACTS = [
  { account: 'C10011', customer: 'Midwest Foodservice Supply', contract: 'FY27 Greenhouse Supply Agreement' },
  { account: 'C10012', customer: 'Keystone Foodservice', contract: 'Winter Tomato Program' },
  { account: 'C10014', customer: 'North Shore Provisions', contract: 'Winter Romana Program' },
  { account: 'C10016', customer: 'Hudson Produce Terminal', contract: 'Terminal Market Agreement' },
  { account: 'C10021', customer: 'Fresh Bowl Kitchens', contract: 'Restaurant Chain Agreement' },
  { account: 'C10037', customer: 'Cedar Bluff Hospitality', contract: 'Specialty Menu Agreement' },
  { account: 'C10038', customer: 'Windy City Salad Works', contract: 'Processor Supply Contract' },
] as const

// ═══════════════════════════════════════════════════════════════════════
// 1 · Price overrides (sales-order line audit trail)
// ═══════════════════════════════════════════════════════════════════════
// Order lines where a rep typed over the system price. Original price is the
// item's case list price; unit cost is the master case cost.

const EMAIL = (name: string) => `${name.toLowerCase().replace(' ', '.')}@sunsetgrown.com`

interface OverrideSeed {
  id: string
  orderNumber: string
  daysAgo: number
  cases: number
  channel: string
  customer: string
  item: ItemNumber
  overridePrice: number
  floorPrice?: number
  reasonCode: string
  rep: string
}

const override = (s: OverrideSeed): PriceOverride => ({
  id: s.id,
  orderNumber: s.orderNumber,
  orderDate: iso(-s.daysAgo),
  cases: s.cases,
  channel: s.channel,
  customer: s.customer,
  ...item(s.item),
  unitCost: costOf(s.item),
  originalPrice: listOf(s.item),
  overridePrice: s.overridePrice,
  ...(s.floorPrice !== undefined ? { floorPrice: s.floorPrice } : {}),
  reasonCode: s.reasonCode,
  overriddenBy: s.rep,
  overriddenByEmail: EMAIL(s.rep),
})

const OVERRIDE_SEEDS: OverrideSeed[] = [
  { id: 'OVR-001', orderNumber: 'SO-50812', daysAgo: 2, cases: 336, channel: 'Grocery', customer: 'Northwind Foods', item: 'SG-PEP-BELL', overridePrice: 15.5, floorPrice: 16.9, reasonCode: 'Promo price overlap', rep: 'Tom Kowalski' },
  { id: 'OVR-002', orderNumber: 'SO-50797', daysAgo: 3, cases: 168, channel: 'Foodservice Contract', customer: 'Windy City Salad Works', item: 'SG-CUC-MINI', overridePrice: 17.5, floorPrice: 17.28, reasonCode: 'Volume deal', rep: 'Jamal Greene' },
  { id: 'OVR-003', orderNumber: 'SO-50771', daysAgo: 5, cases: 480, channel: 'Wholesale', customer: 'Summit Produce Wholesale', item: 'SG-TOM-ROM-3LB', overridePrice: 20.25, floorPrice: 20.25, reasonCode: 'Competitive match', rep: 'Kate Sullivan' },
  { id: 'OVR-004', orderNumber: 'SO-50744', daysAgo: 7, cases: 120, channel: 'Grocery', customer: 'Great Lakes Grocers', item: 'SG-TOM-ANGEL', overridePrice: 25.9, reasonCode: 'Quality / short-dated', rep: 'Jamal Greene' },
  { id: 'OVR-005', orderNumber: 'SO-50718', daysAgo: 9, cases: 240, channel: 'Foodservice Contract', customer: 'Keystone Foodservice', item: 'SG-TOM-BEEF', overridePrice: 17.25, floorPrice: 18.9, reasonCode: 'Contract price not updated', rep: 'Tom Kowalski' },
  { id: 'OVR-006', orderNumber: 'SO-50690', daysAgo: 11, cases: 96, channel: 'E-commerce', customer: 'Pantry Prime Meal Kits', item: 'SG-PEP-TWST-2LB', overridePrice: 24.0, reasonCode: 'Volume deal', rep: 'Kate Sullivan' },
  { id: 'OVR-007', orderNumber: 'SO-50655', daysAgo: 13, cases: 168, channel: 'Foodservice Contract', customer: 'Hudson Produce Terminal', item: 'SG-BER-WOW-10OZ', overridePrice: 30.5, floorPrice: 33.3, reasonCode: 'Quality / short-dated', rep: 'Elena Petrov' },
  { id: 'OVR-008', orderNumber: 'SO-50631', daysAgo: 16, cases: 60, channel: 'Natural', customer: 'Lakeside Natural Foods', item: 'SG-PEP-BELL-3CT', overridePrice: 27.0, reasonCode: 'Competitive match', rep: 'Jamal Greene' },
  { id: 'OVR-009', orderNumber: 'SO-50602', daysAgo: 19, cases: 84, channel: 'Grocery', customer: 'Maple Crest Food Markets', item: 'SG-CUC-MINI-ORG', overridePrice: 21.25, floorPrice: 21.6, reasonCode: 'Promo price overlap', rep: 'Victor Huang' },
  { id: 'OVR-010', orderNumber: 'SO-50577', daysAgo: 23, cases: 140, channel: 'Wholesale', customer: 'Valley Fresh Distributors', item: 'SG-TOM-WW-2LB', overridePrice: 31.5, reasonCode: 'Volume deal', rep: 'Elena Petrov' },
  { id: 'OVR-011', orderNumber: 'SO-50549', daysAgo: 27, cases: 72, channel: 'Foodservice Contract', customer: 'Cedar Bluff Hospitality', item: 'SG-PEP-SHAZAM', overridePrice: 26.5, reasonCode: 'Rep discretion', rep: 'Tom Kowalski' },
  { id: 'OVR-012', orderNumber: 'SO-50511', daysAgo: 33, cases: 180, channel: 'Grocery', customer: 'Riverbend Supermarkets', item: 'SG-TOM-BEEF', overridePrice: 19.0, floorPrice: 18.9, reasonCode: 'Competitive match', rep: 'Tom Kowalski' },
  { id: 'OVR-013', orderNumber: 'SO-50480', daysAgo: 38, cases: 48, channel: 'E-commerce', customer: 'DoorStep Grocer', item: 'SG-BER-WOW-10OZ', overridePrice: 31.5, reasonCode: 'Rep discretion', rep: 'Victor Huang' },
  { id: 'OVR-014', orderNumber: 'SO-50447', daysAgo: 44, cases: 200, channel: 'Foodservice Contract', customer: 'Midwest Foodservice Supply', item: 'SG-TOM-WW-2LB', overridePrice: 32.0, reasonCode: 'Volume deal', rep: 'Jamal Greene' },
  { id: 'OVR-015', orderNumber: 'SO-50435', daysAgo: 52, cases: 120, channel: 'Grocery', customer: 'Northwind Foods', item: 'SG-TOM-ROM-3LB', overridePrice: 19.5, floorPrice: 20.25, reasonCode: 'Contract price not updated', rep: 'Tom Kowalski' },
  { id: 'OVR-016', orderNumber: 'SO-50388', daysAgo: 61, cases: 96, channel: 'Grocery', customer: 'Harborline Markets', item: 'SG-CUC-MINI', overridePrice: 18.4, reasonCode: 'Quality / short-dated', rep: 'Victor Huang' },
  { id: 'OVR-017', orderNumber: 'SO-50342', daysAgo: 74, cases: 288, channel: 'Wholesale', customer: 'Summit Produce Wholesale', item: 'SG-CUC-MINI', overridePrice: 17.28, floorPrice: 17.28, reasonCode: 'Volume deal', rep: 'Kate Sullivan' },
  { id: 'OVR-018', orderNumber: 'SO-50296', daysAgo: 95, cases: 160, channel: 'Foodservice Contract', customer: 'Hudson Produce Terminal', item: 'SG-CUC-ORG-6CT', overridePrice: 24.5, reasonCode: 'Rep discretion', rep: 'Elena Petrov' },
]
const PRICE_OVERRIDES: PriceOverride[] = OVERRIDE_SEEDS.map(override)

// ═══════════════════════════════════════════════════════════════════════
// 2 · Pricing setup (margin threshold test)
// ═══════════════════════════════════════════════════════════════════════
// 20 active price records. At the 25% default floor, 6 fail — 3 retail and 3
// foodservice, every one of them core greenhouse. Three also price below
// their floor with no active trade promotion, which is a price leak rather
// than a margin decision.

/** Item identity, master list price as base, master cost. */
const priced = (n: ItemNumber) => ({ ...item(n), basePrice: listOf(n), unitCost: costOf(n) })

const PRICING_SETUP: PricingSetupLine[] = [
  // ── Retail · grocery, wholesale, natural, e-commerce ──
  {
    id: 'PRC-RTL-01', mode: 'Retail', channel: 'Grocery', channelDetail: 'Grocery price group',
    customerCodes: GROCERY, ...priced('SG-TOM-ROM-3LB'),
    quantity: 480, marginComponent: 0, discountPct: 0, autoCharge: 0, floorPrice: 20.25,
    validFrom: iso(-38), validTo: iso(120),
  },
  {
    id: 'PRC-RTL-02', mode: 'Retail', channel: 'Wholesale', channelDetail: 'Summit Produce Wholesale',
    customerCodes: ['C10007'], ...priced('SG-TOM-ROM-3LB'),
    quantity: 336, marginComponent: 0, discountPct: 12,
    discount: {
      name: 'Holiday Romana Pallet Event', type: 'Threshold', promoId: 'TP-2026-112',
      validFrom: iso(-10), validTo: iso(12),
      tiers: [
        { label: '1 – 239 cases', discountPct: 8 },
        { label: '240 – 479 cases', discountPct: 12 },
        { label: '480+ cases', discountPct: 15 },
      ],
    },
    autoCharge: 0, poolSharePct: 8, floorPrice: 20.25, promoUntil: iso(12),
    validFrom: iso(-10), validTo: iso(12),
  },
  {
    id: 'PRC-RTL-03', mode: 'Retail', channel: 'Grocery', channelDetail: 'Grocery price group',
    customerCodes: GROCERY, ...priced('SG-CUC-ORG-6CT'),
    quantity: 300, marginComponent: 0, discountPct: 15,
    discount: {
      name: 'Organic Snacking Deal', type: 'Quantity', promoId: 'TP-2026-108',
      validFrom: iso(-40), validTo: iso(25),
      tiers: [
        { label: '1 – 99 cases', discountPct: 0 },
        { label: '100 – 299 cases', discountPct: 10 },
        { label: '300+ cases', discountPct: 15 },
      ],
    },
    autoCharge: 0,
    validFrom: iso(-40), validTo: iso(25),
  },
  {
    id: 'PRC-RTL-04', mode: 'Retail', channel: 'Grocery', channelDetail: 'Grocery price group',
    customerCodes: GROCERY, ...priced('SG-TOM-BEEF'),
    quantity: 240, marginComponent: 0, discountPct: 0, autoCharge: 0, floorPrice: 18.9,
    validFrom: iso(-20), validTo: iso(90),
  },
  {
    // The inventory beat (REC-RTL-5 reads this line by id): Dreamberry is
    // carrying most of its short life in cover, and the e-commerce feature
    // already has it on its floor.
    id: 'PRC-RTL-05', mode: 'Retail', channel: 'E-commerce', channelDetail: 'E-commerce price group',
    customerCodes: ECOMMERCE, ...priced('SG-BER-WOW-10OZ'),
    quantity: 2400, marginComponent: 0, discountPct: 10,
    discount: {
      name: 'Holiday Berry Feature', type: 'Line', promoId: 'TP-2026-115',
      validFrom: iso(-12), validTo: iso(9),
    },
    autoCharge: 0, floorPrice: 33.3, promoUntil: iso(9),
    validFrom: iso(-12), validTo: iso(9),
  },
  {
    id: 'PRC-RTL-06', mode: 'Retail', channel: 'Grocery', channelDetail: 'Northwind Foods · Harborline Markets',
    customerCodes: ['C10002', 'C10003'], ...priced('SG-PEP-BELL'),
    quantity: 9600, marginComponent: 0, discountPct: 15,
    discount: {
      name: 'Ohio Fall Pepper Ad', type: 'Line', promoId: 'TP-2026-104',
      validFrom: iso(-27), validTo: iso(-6),
    },
    // The ad closed six days ago and the promo price was never taken off the
    // price group — the retail side's price-leak finding.
    autoCharge: 0, floorPrice: 16.9, promoUntil: iso(-6),
    validFrom: iso(-27), validTo: iso(60),
  },
  {
    id: 'PRC-RTL-07', mode: 'Retail', channel: 'Grocery', channelDetail: 'Grocery + Natural price groups',
    customerCodes: [...GROCERY, ...NATURAL], ...priced('SG-TOM-ANGEL'),
    quantity: 420, marginComponent: 0, discountPct: 0, autoCharge: 0,
    validFrom: iso(-150), validTo: iso(120),
  },
  {
    id: 'PRC-RTL-08', mode: 'Retail', channel: 'Wholesale', channelDetail: 'Valley Fresh Distributors',
    customerCodes: ['C10008'], ...priced('SG-TOM-WW-2LB'),
    quantity: 200, marginComponent: 0, discountPct: 0, autoCharge: 1.25,
    validFrom: iso(-90), validTo: iso(150),
  },
  {
    // Natural price group sits $2 under list to match the organic shelf; at a
    // 29% list margin that alone takes it under 25%.
    id: 'PRC-RTL-09', mode: 'Retail', channel: 'Natural', channelDetail: 'Natural price group',
    customerCodes: NATURAL, ...priced('SG-CUC-MINI-ORG'),
    quantity: 96, marginComponent: -2.0, discountPct: 0, autoCharge: 0,
    validFrom: iso(-120), validTo: iso(90),
  },
  {
    id: 'PRC-RTL-10', mode: 'Retail', channel: 'Wholesale', channelDetail: 'Summit Produce Wholesale',
    customerCodes: ['C10007'], ...priced('SG-CUC-MINI'),
    quantity: 7200, marginComponent: 0, discountPct: 8,
    discount: {
      name: 'Wholesale Pallet Program', type: 'Line', promoId: 'TP-2026-109',
      validFrom: iso(-30), validTo: iso(30),
    },
    autoCharge: 0, floorPrice: 17.28, promoUntil: iso(30),
    validFrom: iso(-30), validTo: iso(30),
  },
  {
    id: 'PRC-RTL-11', mode: 'Retail', channel: 'Grocery', channelDetail: 'Grocery price group',
    customerCodes: GROCERY, ...priced('SG-PEP-TWST-2LB'),
    quantity: 160, marginComponent: 0, discountPct: 15,
    discount: {
      name: 'Holiday Snacking Bundle', type: 'Mix and match', promoId: 'TP-2026-116',
      validFrom: iso(-5), validTo: iso(40),
    },
    autoCharge: 0,
    validFrom: iso(-5), validTo: iso(40),
  },
  {
    id: 'PRC-RTL-12', mode: 'Retail', channel: 'E-commerce', channelDetail: 'E-commerce price group',
    customerCodes: ECOMMERCE, ...priced('SG-PEP-BELL-3CT'),
    quantity: 120, marginComponent: 1.5, discountPct: 0, autoCharge: 0,
    validFrom: iso(-200), validTo: iso(160),
  },

  // ── Foodservice · distributor, restaurant-chain and processor contracts ──
  {
    id: 'PRC-FS-01', mode: 'Foodservice', channel: 'Foodservice Contract',
    channelDetail: 'Midwest Foodservice Supply',
    customerAccount: 'C10011', contract: 'FY27 Greenhouse Supply Agreement', ...priced('SG-TOM-WW-2LB'),
    quantity: 480, marginComponent: 0, discountPct: 10,
    discount: {
      name: 'Contract Volume Tier', type: 'Threshold', promoId: 'TP-2026-110',
      validFrom: iso(-45), validTo: iso(20),
      tiers: [
        { label: '$0 – $9,999 per order', discountPct: 5 },
        { label: '$10,000 – $24,999 per order', discountPct: 10 },
        { label: '$25,000+ per order', discountPct: 12 },
      ],
    },
    autoCharge: 0, floorPrice: 33.0, promoUntil: iso(20),
    validFrom: iso(-45), validTo: iso(20),
  },
  {
    id: 'PRC-FS-02', mode: 'Foodservice', channel: 'Foodservice Contract',
    channelDetail: 'Fresh Bowl Kitchens',
    customerAccount: 'C10021', contract: 'Restaurant Chain Agreement', ...priced('SG-TOM-ANGEL'),
    quantity: 600, marginComponent: 0, discountPct: 0, autoCharge: 0, floorPrice: 27.0,
    validFrom: iso(-180), validTo: iso(185),
  },
  {
    id: 'PRC-FS-03', mode: 'Foodservice', channel: 'Foodservice Contract',
    channelDetail: 'Keystone Foodservice',
    customerAccount: 'C10012', contract: 'Winter Tomato Program', ...priced('SG-TOM-BEEF'),
    quantity: 4800, marginComponent: 0, discountPct: 15,
    discount: {
      name: 'Winter Kickoff Allowance', type: 'Line', promoId: 'TP-2026-118',
      validFrom: iso(-35), validTo: iso(-9),
    },
    // The trade promotion closed nine days ago and the allowance stayed on the
    // contract line — this is the demo's headline price-leak finding.
    autoCharge: 0, poolSharePct: 4, floorPrice: 18.9, promoUntil: iso(-9),
    validFrom: iso(-35), validTo: iso(55),
  },
  {
    id: 'PRC-FS-04', mode: 'Foodservice', channel: 'Foodservice Contract',
    channelDetail: 'Windy City Salad Works',
    customerAccount: 'C10038', contract: 'Processor Supply Contract', ...priced('SG-CUC-MINI'),
    quantity: 5760, marginComponent: 0, discountPct: 8,
    discount: {
      name: 'Processor Volume Schedule', type: 'Quantity',
      validFrom: iso(-150), validTo: iso(30),
      tiers: [
        { label: '1 – 99 cases', discountPct: 0 },
        { label: '100 – 199 cases', discountPct: 5 },
        { label: '200+ cases', discountPct: 8 },
      ],
    },
    autoCharge: 0, floorPrice: 17.28,
    validFrom: iso(-150), validTo: iso(30),
  },
  {
    id: 'PRC-FS-05', mode: 'Foodservice', channel: 'Foodservice Contract',
    channelDetail: 'Windy City Salad Works',
    customerAccount: 'C10038', contract: 'Processor Supply Contract', ...priced('SG-PEP-BELL'),
    quantity: 5760, marginComponent: 0, discountPct: 8,
    discount: {
      name: 'Processor Volume Schedule', type: 'Quantity',
      validFrom: iso(-150), validTo: iso(30),
      tiers: [
        { label: '1 – 99 cases', discountPct: 0 },
        { label: '100 – 199 cases', discountPct: 5 },
        { label: '200+ cases', discountPct: 8 },
      ],
    },
    // Winter-lit pepper cost moved after the contract was signed; the floor
    // was raised but the volume schedule was never re-cut against it.
    autoCharge: 0, floorPrice: 17.85,
    validFrom: iso(-150), validTo: iso(30),
  },
  {
    id: 'PRC-FS-06', mode: 'Foodservice', channel: 'Foodservice Contract',
    channelDetail: 'Cedar Bluff Hospitality',
    customerAccount: 'C10037', contract: 'Specialty Menu Agreement', ...priced('SG-PEP-SHAZAM'),
    quantity: 144, marginComponent: 0, discountPct: 10,
    discount: {
      name: 'Holiday Menu Allowance', type: 'Line', promoId: 'TP-2026-117',
      validFrom: iso(-8), validTo: iso(21),
    },
    autoCharge: 0,
    validFrom: iso(-8), validTo: iso(21),
  },
  {
    id: 'PRC-FS-07', mode: 'Foodservice', channel: 'Foodservice Contract',
    channelDetail: 'Hudson Produce Terminal',
    customerAccount: 'C10016', contract: 'Terminal Market Agreement', ...priced('SG-CUC-ORG-6CT'),
    quantity: 200, marginComponent: 0, discountPct: 0, autoCharge: 0.95,
    validFrom: iso(-240), validTo: iso(125),
  },
  {
    id: 'PRC-FS-08', mode: 'Foodservice', channel: 'Foodservice Contract',
    channelDetail: 'North Shore Provisions',
    customerAccount: 'C10014', contract: 'Winter Romana Program', ...priced('SG-TOM-ROM-3LB'),
    quantity: 144, marginComponent: 0, discountPct: 5,
    discount: {
      name: 'Winter Program Schedule', type: 'Quantity',
      validFrom: iso(-20), validTo: iso(150),
      tiers: [
        { label: '1 – 71 cases', discountPct: 0 },
        { label: '72 – 143 cases', discountPct: 3 },
        { label: '144+ cases', discountPct: 5 },
      ],
    },
    autoCharge: 0, floorPrice: 20.25,
    validFrom: iso(-20), validTo: iso(150),
  },
]

// ═══════════════════════════════════════════════════════════════════════
// 3 · Price history audit
// ═══════════════════════════════════════════════════════════════════════
// A price scope is whatever the price is set against: SUNSET's list price,
// a customer price group, or one customer's contract line. The current LIST
// entry of every item equals its master list price (asserted below).

const history = (n: ItemNumber, scopeId: string, scopeName: string, entries: PriceHistoryRecord['entries']): PriceHistoryRecord => {
  const i = item(n)
  return {
    productKey: `${i.itemNumber}|${i.pack}|${scopeId}`,
    itemName: i.itemName,
    itemNumber: i.itemNumber,
    category: i.category,
    productLine: i.productLine,
    pack: i.pack,
    scopeId,
    scopeName,
    entries,
  }
}

const PRICE_HISTORY: PriceHistoryRecord[] = [
  history('SG-TOM-BEEF', 'LIST', 'SUNSET list price', [
    { id: 'PH-1-3', price: 21.0, activeFrom: iso(-38), activeTo: null, changedBy: 'Jordan Reyes', changeType: 'Season set', note: 'Winter lit-greenhouse price — lower light, lower yield per square metre' },
    { id: 'PH-1-2', price: 18.5, activeFrom: iso(-170), activeTo: iso(-39), changedBy: 'Jordan Reyes', changeType: 'Season set', note: 'Summer peak volume' },
    { id: 'PH-1-1', price: 19.75, activeFrom: iso(-400), activeTo: iso(-171), changedBy: 'System', changeType: 'Initial', note: 'Item introduction' },
  ]),
  history('SG-TOM-BEEF', 'C10012', 'Keystone Foodservice · Winter Tomato Program', [
    { id: 'PH-2-3', price: 17.85, activeFrom: iso(-35), activeTo: null, changedBy: 'Tom Kowalski', changeType: 'Trade promotion', note: `Winter Kickoff Allowance · 15% — TP-2026-118 ended ${shortDate(iso(-9))}, price never restored to the $18.90 floor` },
    { id: 'PH-2-2', price: 21.0, activeFrom: iso(-170), activeTo: iso(-36), changedBy: 'Tom Kowalski', changeType: 'Contract update', note: 'Contract line matched to list' },
    { id: 'PH-2-1', price: 20.0, activeFrom: iso(-400), activeTo: iso(-171), changedBy: 'System', changeType: 'Initial', note: 'Program contract signed' },
  ]),
  history('SG-PEP-BELL', 'LIST', 'SUNSET list price', [
    { id: 'PH-3-3', price: 18.75, activeFrom: iso(-38), activeTo: null, changedBy: 'Jordan Reyes', changeType: 'Season set', note: 'Winter lit-greenhouse pepper price' },
    { id: 'PH-3-2', price: 17.5, activeFrom: iso(-170), activeTo: iso(-39), changedBy: 'Jordan Reyes', changeType: 'Season set', note: 'Summer peak volume' },
    { id: 'PH-3-1', price: 18.25, activeFrom: iso(-400), activeTo: iso(-171), changedBy: 'System', changeType: 'Initial', note: 'Item introduction' },
  ]),
  history('SG-PEP-BELL', 'PG-OHIO', 'Northwind Foods · Harborline Markets', [
    { id: 'PH-4-3', price: 15.94, activeFrom: iso(-27), activeTo: null, changedBy: 'Tom Kowalski', changeType: 'Trade promotion', note: `Ohio Fall Pepper Ad · 15% — TP-2026-104 ended ${shortDate(iso(-6))}, promo price still live` },
    { id: 'PH-4-2', price: 18.75, activeFrom: iso(-38), activeTo: iso(-28), changedBy: 'Jordan Reyes', changeType: 'Season set', note: 'Matched to winter list' },
    { id: 'PH-4-1', price: 17.5, activeFrom: iso(-170), activeTo: iso(-39), changedBy: 'System', changeType: 'Initial', note: 'Price group created' },
  ]),
  history('SG-BER-WOW-10OZ', 'LIST', 'SUNSET list price', [
    { id: 'PH-5-4', price: 37.0, activeFrom: iso(-45), activeTo: null, changedBy: 'Jordan Reyes', changeType: 'Season set', note: 'Winter lit-greenhouse berry supply' },
    { id: 'PH-5-3', price: 34.0, activeFrom: iso(-100), activeTo: iso(-46), changedBy: 'Jordan Reyes', changeType: 'Season set', note: 'Summer peak — DC full' },
    { id: 'PH-5-2', price: 39.0, activeFrom: iso(-150), activeTo: iso(-101), changedBy: 'Jordan Reyes', changeType: 'Season set', note: 'Spring launch price' },
    { id: 'PH-5-1', price: 38.0, activeFrom: iso(-420), activeTo: iso(-151), changedBy: 'System', changeType: 'Initial', note: 'Item introduction' },
  ]),
  history('SG-BER-WOW-10OZ', 'PG-ECOM', 'E-commerce price group', [
    { id: 'PH-6-3', price: 33.3, activeFrom: iso(-12), activeTo: null, changedBy: 'Pricing Agent', changeType: 'Agent reprice', note: 'Holiday Berry Feature · 10% — held exactly at the $33.30 floor' },
    { id: 'PH-6-2', price: 37.0, activeFrom: iso(-45), activeTo: iso(-13), changedBy: 'Kate Sullivan', changeType: 'Season set', note: 'Matched to winter list' },
    { id: 'PH-6-1', price: 34.0, activeFrom: iso(-100), activeTo: iso(-46), changedBy: 'System', changeType: 'Initial', note: 'Price group created' },
  ]),
  history('SG-TOM-ROM-3LB', 'LIST', 'SUNSET list price', [
    { id: 'PH-7-3', price: 22.5, activeFrom: iso(-20), activeTo: null, changedBy: 'Jordan Reyes', changeType: 'Season set', note: 'Winter Romana price — held through the holidays' },
    { id: 'PH-7-2', price: 21.0, activeFrom: iso(-230), activeTo: iso(-21), changedBy: 'Jordan Reyes', changeType: 'Season set', note: 'Spring-to-fall volume price' },
    { id: 'PH-7-1', price: 21.75, activeFrom: iso(-400), activeTo: iso(-231), changedBy: 'System', changeType: 'Initial', note: 'Item introduction' },
  ]),
  history('SG-CUC-ORG-6CT', 'LIST', 'SUNSET list price', [
    { id: 'PH-8-3', price: 27.6, activeFrom: iso(-40), activeTo: null, changedBy: 'Pricing Agent', changeType: 'Cost-plus update', note: 'Organic growing-media and certification cost rolled into the price' },
    { id: 'PH-8-2', price: 26.4, activeFrom: iso(-220), activeTo: iso(-41), changedBy: 'Jordan Reyes', changeType: 'Season set', note: 'Prior organic cost basis' },
    { id: 'PH-8-1', price: 25.8, activeFrom: iso(-420), activeTo: iso(-221), changedBy: 'System', changeType: 'Initial', note: 'Item introduction' },
  ]),
]

// ═══════════════════════════════════════════════════════════════════════
// 4 · AI recommendations
// ═══════════════════════════════════════════════════════════════════════

const RECOMMENDATIONS: Recommendation[] = [
  // ── Retail ──
  {
    id: 'REC-RTL-1', audience: 'Retail', kind: 'Promotion timing',
    title: 'Put the holiday features on specialty brands, not on core tomatoes and peppers',
    detail:
      'Organic Mini Cucumber 6ct still clears 27% margin at 15% off; an 11 lb Sweet Bell carton at the same depth lands under 16%. Feature the specialty brands on price and keep core cartons at list in the ad.',
    bullets: ['Week 1 · Sweet Twister™ 2 lb in the holiday snacking bundle at 15% off', 'Week 2 · Organic Mini Cucumber 6ct on the 300-case tier', 'Core Romana and Sweet Bell stay at list — feature in ad, not on price'],
    impact: '+$84K margin vs. a flat 12% holiday promotion', confidence: 'High', status: 'Open',
  },
  {
    id: 'REC-RTL-2', audience: 'Retail', kind: 'Hold price',
    title: 'Hold Beefsteak at $21.00 through the winter lit-greenhouse season',
    detail:
      'Winter yield per square metre is down and lighting cost is up, so supply is tight and there is no volume to clear. Cutting now gives away a price the grocery chains are paying.',
    impact: 'Protects ~$52K of list-price revenue', confidence: 'High', status: 'Open',
  },
  {
    id: 'REC-RTL-3', audience: 'Retail', kind: 'Increase price',
    title: 'Raise Angel Sweet® from $29.60 to $31.20 a case',
    detail:
      'Angel Sweet ships at 41% margin and case velocity held flat through two cost-plus increases. Wild Wonders® already lists well above it with no volume penalty.',
    impact: '+$118K estimated annual margin', confidence: 'High', status: 'Open',
  },
  {
    id: 'REC-RTL-4', audience: 'Retail', kind: 'Customer-specific pricing',
    title: 'Carry the e-commerce small-pack uplift to the natural channel',
    detail:
      'Pantry Prime and DoorStep already pay $1.50 a case above the price group on Sweet Bell 3ct with no loss of volume. Extend the uplift to Lakeside Natural Foods and Green Cart Co-op — and close the $2.00 organic discount that has their Organic Mini Cucumbers under 25%.',
    impact: '+$38K margin per season', confidence: 'Medium', status: 'Open',
  },
  {
    id: 'REC-RTL-5', audience: 'Retail', kind: 'Inventory-driven',
    title: 'WOW™ Dreamberry is at 6 days of cover on an 8-day shelf life',
    detail: 'The new lit-greenhouse berry block came in heavier than the e-commerce feature is pulling. Options, in order of margin impact:',
    bullets: [
      'Offer the surplus to Summit Produce Wholesale as a pallet deal before day 4',
      'Shift the balance into the grocery holiday snacking bundle at list',
      'Price to move only as a last resort — the e-commerce line already sits on its floor',
    ],
    impact: 'Avoids ~$41K of shrink', confidence: 'High', status: 'Open',
  },

  // ── Foodservice ──
  {
    id: 'REC-FS-1', audience: 'Foodservice', kind: 'Floor compliance',
    title: 'Three lines price below floor with no active promotion',
    detail:
      'The Keystone Beefsteak line kept its winter kickoff allowance nine days after TP-2026-118 closed, the Ohio Sweet Bell ad price is still live at Northwind and Harborline, and the Windy City pepper schedule was never re-cut against the new floor.',
    bullets: ['Restore Keystone Beefsteak to the $18.90 floor', 'End the Ohio pepper ad price or extend TP-2026-104 with approval', 'Re-cut the Windy City pepper volume schedule'],
    impact: 'Clears 3 open price leaks', confidence: 'High', status: 'Open',
  },
  {
    id: 'REC-FS-2', audience: 'Foodservice', kind: 'Contract terms',
    title: 'Index the Windy City processor contract to greenhouse cost',
    detail:
      'Winter lighting and heating pushed mini cucumber and pepper costs up after the contract was signed, and the fixed volume schedule did not move with them — which is why both lines now sit under 25%. A quarterly cost index keeps the discount and the margin.',
    impact: '+$67K if the contract reprices quarterly to cost', confidence: 'Medium', status: 'Open',
  },
  {
    id: 'REC-FS-3', audience: 'Foodservice', kind: 'Margin protection',
    title: 'Keystone Beefsteak earns 23.6% at 15% off — under the floor even with the partner-grower share',
    detail:
      'Without the 4% partner-grower share the line would be at 20.5%. Rather than deepen the allowance, restore the floor and fund a smaller, dated promotion.',
    bullets: ['Restore to the $18.90 floor and close the expired allowance', 'Counter with a 7% dated allowance through the next menu cycle'],
    impact: '+$10K margin across the 4,800-case program', confidence: 'High', status: 'Open',
  },
  {
    id: 'REC-FS-4', audience: 'Foodservice', kind: 'Product mix',
    title: 'Move foodservice tomato volume toward Wild Wonders® and Angel Sweet®',
    detail:
      'Beefsteak cartons list at 32% margin and carry a floor; Wild Wonders runs 40% and absorbs contract tiers. Offer Keystone the specialty pack for its restaurant and hotel accounts.',
    bullets: ['Propose a 60/40 Beefsteak / Wild Wonders split on the winter program'],
    impact: '+5.4 pts blended margin on foodservice tomatoes', confidence: 'Medium', status: 'Open',
  },
]

const RETAIL_KPIS: KpiMonitor[] = [
  { label: 'Gross margin %', value: '31.4%', trend: 'up' },
  { label: 'Program sell-through', value: '79%', trend: 'up' },
  { label: 'Trade spend % of sales', value: '6.8%', trend: 'down' },
  { label: 'Promotion ROI', value: '2.1x', trend: 'flat' },
  { label: 'Days of cover', value: '7.4', trend: 'down' },
  { label: 'Shrink %', value: '2.3%', trend: 'down' },
  { label: 'Fill rate', value: '97.1%', trend: 'up' },
  { label: 'On-time in-full', value: '94%', trend: 'flat' },
  { label: 'Specialty brand mix', value: '38%', trend: 'up' },
]

const FOODSERVICE_KPIS: KpiMonitor[] = [
  { label: 'Margin by contract', value: '27.2% avg', trend: 'flat' },
  { label: 'Partner-grower share captured', value: '$186K', trend: 'up' },
  { label: 'Floor compliance rate', value: '95.8%', trend: 'down' },
  { label: 'Average contract discount', value: '7.9%', trend: 'up' },
  { label: 'Open deductions', value: '$94K', trend: 'down' },
  { label: 'Contracts renewing in 60 days', value: '4', trend: 'flat' },
  { label: 'Contract margin', value: '26.4%', trend: 'flat' },
  { label: 'Cases per contract', value: '2,940 avg', trend: 'up' },
  { label: 'Committed volume', value: '$6.8M', trend: 'up' },
]

/** Category filter values — the four the demo was asked to show. */
const CATEGORIES = ['Cucumbers', 'Tomatoes', 'Peppers', 'Berries'] as const

// ═══════════════════════════════════════════════════════════════════════
// 5 · Shipment model (feeds the shared generator in src/data/mockData.ts)
// ═══════════════════════════════════════════════════════════════════════
// Greenhouse product ships year-round, so the curves are flatter than a
// field-crop book: summer is peak volume, winter dips under supplemental
// lighting, and specialty snacking packs lift into the holidays.

/** Demand curve by calendar month, Jan..Dec. */
const SEASON_CURVES = {
  tomatoes: [0.9, 0.9, 0.95, 1.0, 1.05, 1.15, 1.2, 1.15, 1.0, 0.95, 0.9, 0.95],
  cucumbers: [0.85, 0.85, 0.9, 1.0, 1.1, 1.2, 1.2, 1.15, 1.0, 0.95, 0.9, 0.9],
  peppers: [0.85, 0.85, 0.9, 0.95, 1.05, 1.15, 1.2, 1.15, 1.05, 1.0, 0.95, 0.95],
  berries: [0.8, 0.85, 1.0, 1.1, 1.2, 1.2, 1.1, 1.0, 0.9, 0.9, 1.0, 1.15],
  specialty: [0.95, 0.95, 1.0, 1.0, 1.0, 1.05, 1.05, 1.0, 1.05, 1.05, 1.2, 1.3],
} as const

/**
 * Per-item profile for every retail-priced item. Cover is sized against shelf
 * life: Dreamberry and Mini Cucumbers carry most of their life in cover — the
 * demo's inventory problem — while tomatoes and peppers sit on weeks of life.
 */
const ITEM_PROFILE: Record<string, ItemProfile> = {
  'SG-TOM-ROM-3LB': { base: 14, season: 'tomatoes', coverDays: 7, shelfLifeDays: 18 },
  'SG-TOM-BEEF': { base: 6, season: 'tomatoes', coverDays: 6, shelfLifeDays: 14 },
  'SG-PEP-BELL': { base: 11, season: 'peppers', coverDays: 8, shelfLifeDays: 21 },
  'SG-BER-WOW-10OZ': { base: 5, season: 'berries', coverDays: 6, shelfLifeDays: 8 },
  'SG-CUC-MINI': { base: 7, season: 'cucumbers', coverDays: 8, shelfLifeDays: 12 },
  'SG-CUC-MINI-ORG': { base: 4, season: 'cucumbers', coverDays: 3, shelfLifeDays: 12 },
  'SG-CUC-ORG-6CT': { base: 6, season: 'specialty', coverDays: 5, shelfLifeDays: 14 },
  'SG-TOM-ANGEL': { base: 8, season: 'specialty', coverDays: 4, shelfLifeDays: 16 },
  'SG-TOM-WW-2LB': { base: 3, season: 'specialty', coverDays: 3, shelfLifeDays: 14 },
  'SG-PEP-TWST-2LB': { base: 3.5, season: 'specialty', coverDays: 4, shelfLifeDays: 18 },
  'SG-PEP-BELL-3CT': { base: 4.5, season: 'peppers', coverDays: 3, shelfLifeDays: 18 },
}

/** Relative size of each retail customer. */
const CUSTOMER_WEIGHT: Record<string, number> = {
  C10001: 1.6,
  C10002: 1.8,
  C10003: 1.0,
  C10006: 1.3,
  C10005: 0.9,
  C10007: 2.4,
  C10008: 2.0,
  C10009: 0.5,
  C10010: 0.6,
  C10026: 0.8,
  C10027: 0.7,
}

/** Day-of-week factor: produce ships on weekdays. Sun..Sat. */
const DOW_FACTOR = [0.25, 1.2, 1.25, 1.2, 1.25, 1.15, 0.45]

// ═══════════════════════════════════════════════════════════════════════
// 6 · Master consistency — fail the build, not the demo
// ═══════════════════════════════════════════════════════════════════════

function assertMasterConsistency() {
  const problems: string[] = []
  for (const l of [...PRICE_OVERRIDES, ...PRICING_SETUP]) {
    const m = MASTER[l.itemNumber as ItemNumber]
    if (!m) problems.push(`${l.itemNumber}: not in the item master`)
    else {
      if (l.unitCost !== m.cost) problems.push(`${l.itemNumber}: unitCost ${l.unitCost} ≠ master ${m.cost}`)
      if (l.itemName !== m.name) problems.push(`${l.itemNumber}: name drift`)
    }
  }
  for (const l of PRICING_SETUP) {
    const m = MASTER[l.itemNumber as ItemNumber]
    if (m && l.basePrice !== m.list) problems.push(`${l.id}: base ${l.basePrice} ≠ master list ${m.list}`)
  }
  for (const h of PRICE_HISTORY) {
    const m = MASTER[h.itemNumber as ItemNumber]
    const current = h.entries.find((e) => e.activeTo === null)
    if (m && h.scopeId === 'LIST' && current && current.price !== m.list) {
      problems.push(`${h.itemNumber}: current list ${current.price} ≠ master ${m.list}`)
    }
  }
  for (const n of Object.keys(ITEM_PROFILE)) {
    if (!MASTER[n as ItemNumber]) problems.push(`${n}: shipment profile for an unknown item`)
  }
  if (problems.length) throw new Error(`SUNSET item master drift:\n${problems.join('\n')}`)
}
assertMasterConsistency()

export const data: ScenarioData = {
  customers: CUSTOMERS,
  segments: SEGMENTS,
  contracts: FOODSERVICE_CONTRACTS,
  overrides: PRICE_OVERRIDES,
  pricingSetup: PRICING_SETUP,
  priceHistory: PRICE_HISTORY,
  recommendations: RECOMMENDATIONS,
  retailKpis: RETAIL_KPIS,
  foodserviceKpis: FOODSERVICE_KPIS,
  categories: CATEGORIES,
  shipments: {
    seasonCurves: SEASON_CURVES,
    itemProfile: ITEM_PROFILE,
    customerWeight: CUSTOMER_WEIGHT,
    dowFactor: DOW_FACTOR,
  },
}
