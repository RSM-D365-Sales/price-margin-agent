// ── Pricing & Margin Workspace · demo dataset ────────────────────────────
//
// This file is the single source of truth for the demo. Every figure here is
// synthetic and hand-built to be internally consistent. Items, costs, list
// prices, shelf lives, customers and people come from the Bluestem brand kit
// (Bluestem_Brand_v2_and_Data.zip → items.csv, customers.csv, employees.csv);
// the order lines, prices, promotions and decisions are invented for this app.
//
//   · Fresh-cut (FC-*) is value-added at the Grand Rapids plant and lists at
//     ~38–44% margin. It absorbs a 15% promotion and still clears 25%.
//   · Packed fresh (PK-*) is whole produce in a pouch, clamshell or carton and
//     lists at ~28–32%. A 10% deal takes it under the 25% floor.
//   That gap is the demo's whole argument: promoting fresh-cut is cheap,
//   promoting packed fresh is where margin quietly disappears.
//
// Every date is derived from asOf in ./config.ts. Move that one value
// and the entire dataset — order dates, price windows, promotion windows —
// slides with it. Nothing here is hardcoded to a calendar date.
//
// Bluestem Fresh Produce, its customers and its staff are all fictional.

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

const iso = makeIso(AS_OF)

// ═══════════════════════════════════════════════════════════════════════
// 0 · Retail customers
// ═══════════════════════════════════════════════════════════════════════

const CUSTOMERS: CustomerLocation[] = [
  { code: 'C10001', name: 'Great Lakes Grocers', city: 'Grand Rapids', state: 'MI', segment: 'SEG-GRO' },
  { code: 'C10002', name: 'Northwind Foods', city: 'Columbus', state: 'OH', segment: 'SEG-GRO' },
  { code: 'C10003', name: 'Harborline Markets', city: 'Cleveland', state: 'OH', segment: 'SEG-GRO' },
  { code: 'C10006', name: 'Riverbend Supermarkets', city: 'Pittsburgh', state: 'PA', segment: 'SEG-GRO' },
  { code: 'C10005', name: 'Copper Creek Grocery', city: 'Indianapolis', state: 'IN', segment: 'SEG-GRO' },
  { code: 'C10007', name: 'Summit Club Stores', city: 'Chicago', state: 'IL', segment: 'SEG-CLUB' },
  { code: 'C10008', name: 'ValuePoint Mass Retail', city: 'Minneapolis', state: 'MN', segment: 'SEG-CLUB' },
  { code: 'C10009', name: 'Lakeside Natural Foods', city: 'Ann Arbor', state: 'MI', segment: 'SEG-NAT' },
  { code: 'C10010', name: 'Green Cart Co-op', city: 'Detroit', state: 'MI', segment: 'SEG-NAT' },
  { code: 'C10026', name: 'Pantry Prime Meal Kits', city: 'Indianapolis', state: 'IN', segment: 'SEG-ECOM' },
  { code: 'C10027', name: 'DoorStep Grocer', city: 'Detroit', state: 'MI', segment: 'SEG-ECOM' },
]

const SEGMENTS: { code: string; name: string }[] = [
  { code: 'SEG-GRO', name: 'Grocery' },
  { code: 'SEG-CLUB', name: 'Club & Mass' },
  { code: 'SEG-NAT', name: 'Natural' },
  { code: 'SEG-ECOM', name: 'E-commerce' },
]

const inSegment = (seg: string) => CUSTOMERS.filter((c) => c.segment === seg).map((c) => c.code)
const GROCERY = inSegment('SEG-GRO')
const NATURAL = inSegment('SEG-NAT')
const ECOMMERCE = inSegment('SEG-ECOM')

/** Foodservice and processor contracts the foodservice book is priced under. */
const FOODSERVICE_CONTRACTS = [
  { account: 'C10011', customer: 'Midwest Foodservice Supply', contract: 'FY26 Fresh-Cut Supply Agreement' },
  { account: 'C10012', customer: 'Keystone Foodservice', contract: 'Fall Apple Program' },
  { account: 'C10014', customer: 'North Shore Provisions', contract: 'Winter Squash Program' },
  { account: 'C10016', customer: 'Hudson Produce Terminal', contract: 'Terminal Market Agreement' },
  { account: 'C10021', customer: 'Fresh Bowl Kitchens', contract: 'Restaurant Chain Agreement' },
  { account: 'C10037', customer: 'Cedar Point Hospitality', contract: 'Season Hospitality Agreement' },
  { account: 'C10038', customer: 'Windy City Salad Works', contract: 'Processor Supply Contract' },
] as const

// ═══════════════════════════════════════════════════════════════════════
// 1 · Price overrides (sales-order line audit trail)
// ═══════════════════════════════════════════════════════════════════════
// Order lines where a rep typed over the system price. Packed-fresh items in
// a customer price group carry a price floor, so the audit can separate "thin
// margin" from "below the floor with no promotion behind it" — two overrides
// sit thin but exactly at the floor, which is the distinction the floor
// column exists to draw.

const EMAIL = (name: string) => `${name.toLowerCase().replace(' ', '.')}@bluestemfresh.com`

const PRICE_OVERRIDES: PriceOverride[] = [
  {
    id: 'OVR-001', orderNumber: 'SO-50812', orderDate: iso(-2), cases: 336,
    channel: 'Grocery', customer: 'Northwind Foods',
    itemName: 'Gala Apples 3 lb pouch', itemNumber: 'PK-APL-GA-3LB',
    category: 'Apples', productLine: 'Packed fresh', pack: '12 × 3 lb',
    unitCost: 13.4, originalPrice: 18.75, overridePrice: 15.5, floorPrice: 16.9,
    reasonCode: 'Promo price overlap', overriddenBy: 'Tom Kowalski', overriddenByEmail: EMAIL('Tom Kowalski'),
  },
  {
    id: 'OVR-002', orderNumber: 'SO-50797', orderDate: iso(-3), cases: 168,
    channel: 'Foodservice Contract', customer: 'Windy City Salad Works',
    itemName: 'Zucchini 20 lb carton', itemNumber: 'PK-ZUC-CTN',
    category: 'Vegetables', productLine: 'Packed fresh', pack: '20 lb carton',
    unitCost: 13.5, originalPrice: 19.0, overridePrice: 17.5, floorPrice: 17.1,
    reasonCode: 'Volume deal', overriddenBy: 'Jamal Greene', overriddenByEmail: EMAIL('Jamal Greene'),
  },
  {
    id: 'OVR-003', orderNumber: 'SO-50771', orderDate: iso(-5), cases: 480,
    channel: 'Club & Mass', customer: 'Summit Club Stores',
    itemName: 'Honeycrisp Apples 3 lb pouch', itemNumber: 'PK-APL-HC-3LB',
    category: 'Apples', productLine: 'Packed fresh', pack: '12 × 3 lb',
    unitCost: 15.8, originalPrice: 22.5, overridePrice: 20.25, floorPrice: 20.25,
    reasonCode: 'Competitive match', overriddenBy: 'Kate Sullivan', overriddenByEmail: EMAIL('Kate Sullivan'),
  },
  {
    id: 'OVR-004', orderNumber: 'SO-50744', orderDate: iso(-7), cases: 120,
    channel: 'Grocery', customer: 'Great Lakes Grocers',
    itemName: 'Garden Salad Kit 10 oz', itemNumber: 'FC-SAL-GARDEN',
    category: 'Salads', productLine: 'Fresh-cut', pack: '8 × 10 oz',
    unitCost: 17.5, originalPrice: 29.6, overridePrice: 25.9,
    reasonCode: 'Quality / short-dated', overriddenBy: 'Jamal Greene', overriddenByEmail: EMAIL('Jamal Greene'),
  },
  {
    id: 'OVR-005', orderNumber: 'SO-50718', orderDate: iso(-9), cases: 240,
    channel: 'Foodservice Contract', customer: 'Keystone Foodservice',
    itemName: 'Honeycrisp Apples 88ct tray', itemNumber: 'PK-APL-HC-TRAY',
    category: 'Apples', productLine: 'Packed fresh', pack: '88 ct tray',
    unitCost: 29.3, originalPrice: 42.0, overridePrice: 34.5, floorPrice: 37.8,
    reasonCode: 'Contract price not updated', overriddenBy: 'Tom Kowalski', overriddenByEmail: EMAIL('Tom Kowalski'),
  },
  {
    id: 'OVR-006', orderNumber: 'SO-50690', orderDate: iso(-11), cases: 96,
    channel: 'E-commerce', customer: 'Pantry Prime Meal Kits',
    itemName: 'Zucchini Noodles 10 oz', itemNumber: 'FC-VEG-ZOODLE',
    category: 'Vegetable Blends', productLine: 'Fresh-cut', pack: '8 × 10 oz',
    unitCost: 14.7, originalPrice: 26.4, overridePrice: 22.0,
    reasonCode: 'Volume deal', overriddenBy: 'Kate Sullivan', overriddenByEmail: EMAIL('Kate Sullivan'),
  },
  {
    id: 'OVR-007', orderNumber: 'SO-50655', orderDate: iso(-13), cases: 168,
    channel: 'Foodservice Contract', customer: 'Hudson Produce Terminal',
    itemName: 'Blueberries 18 oz clamshell', itemNumber: 'PK-BLU-18OZ',
    category: 'Berries', productLine: 'Packed fresh', pack: '8 × 18 oz',
    unitCost: 19.4, originalPrice: 27.2, overridePrice: 23.5, floorPrice: 24.5,
    reasonCode: 'Quality / short-dated', overriddenBy: 'Elena Petrov', overriddenByEmail: EMAIL('Elena Petrov'),
  },
  {
    id: 'OVR-008', orderNumber: 'SO-50631', orderDate: iso(-16), cases: 60,
    channel: 'Natural', customer: 'Lakeside Natural Foods',
    itemName: 'Tri-Color Peppers 3-pack', itemNumber: 'PK-PEP-3PK',
    category: 'Vegetables', productLine: 'Packed fresh', pack: '12 × 3 ct',
    unitCost: 19.6, originalPrice: 30.0, overridePrice: 27.0,
    reasonCode: 'Competitive match', overriddenBy: 'Jamal Greene', overriddenByEmail: EMAIL('Jamal Greene'),
  },
  {
    id: 'OVR-009', orderNumber: 'SO-50602', orderDate: iso(-19), cases: 84,
    channel: 'Grocery', customer: 'Copper Creek Grocery',
    itemName: 'Green Bell Peppers 1-1/9 bu', itemNumber: 'PK-PEP-GRN',
    category: 'Vegetables', productLine: 'Packed fresh', pack: '1-1/9 bu',
    unitCost: 17.0, originalPrice: 24.0, overridePrice: 21.25, floorPrice: 21.6,
    reasonCode: 'Promo price overlap', overriddenBy: 'Victor Huang', overriddenByEmail: EMAIL('Victor Huang'),
  },
  {
    id: 'OVR-010', orderNumber: 'SO-50577', orderDate: iso(-23), cases: 140,
    channel: 'Club & Mass', customer: 'ValuePoint Mass Retail',
    itemName: 'Veggie Tray w/ dip 24 oz', itemNumber: 'FC-VEG-TRAY',
    category: 'Fruit Cups & Trays', productLine: 'Fresh-cut', pack: '4 × 24 oz',
    unitCost: 21.7, originalPrice: 36.0, overridePrice: 31.5,
    reasonCode: 'Volume deal', overriddenBy: 'Elena Petrov', overriddenByEmail: EMAIL('Elena Petrov'),
  },
  {
    id: 'OVR-011', orderNumber: 'SO-50549', orderDate: iso(-27), cases: 72,
    channel: 'Foodservice Contract', customer: 'Cedar Point Hospitality',
    itemName: 'Stir-Fry Vegetable Blend 12 oz', itemNumber: 'FC-VEG-STIR-12OZ',
    category: 'Vegetable Blends', productLine: 'Fresh-cut', pack: '8 × 12 oz',
    unitCost: 17.5, originalPrice: 28.8, overridePrice: 23.5,
    reasonCode: 'Rep discretion', overriddenBy: 'Tom Kowalski', overriddenByEmail: EMAIL('Tom Kowalski'),
  },
  {
    id: 'OVR-012', orderNumber: 'SO-50511', orderDate: iso(-33), cases: 180,
    channel: 'Grocery', customer: 'Riverbend Supermarkets',
    itemName: 'Butternut Squash 35 lb carton', itemNumber: 'PK-SQB-CTN',
    category: 'Vegetables', productLine: 'Packed fresh', pack: '35 lb carton',
    unitCost: 14.2, originalPrice: 21.0, overridePrice: 19.0, floorPrice: 18.9,
    reasonCode: 'Competitive match', overriddenBy: 'Tom Kowalski', overriddenByEmail: EMAIL('Tom Kowalski'),
  },
  {
    id: 'OVR-013', orderNumber: 'SO-50480', orderDate: iso(-38), cases: 48,
    channel: 'E-commerce', customer: 'DoorStep Grocer',
    itemName: 'Fruit Cup (apple/blueberry) 6 oz', itemNumber: 'FC-FRT-CUP-6OZ',
    category: 'Fruit Cups & Trays', productLine: 'Fresh-cut', pack: '12 × 6 oz',
    unitCost: 19.5, originalPrice: 32.4, overridePrice: 27.5,
    reasonCode: 'Rep discretion', overriddenBy: 'Victor Huang', overriddenByEmail: EMAIL('Victor Huang'),
  },
  {
    id: 'OVR-014', orderNumber: 'SO-50447', orderDate: iso(-44), cases: 200,
    channel: 'Foodservice Contract', customer: 'Midwest Foodservice Supply',
    itemName: 'Diced Apples 5 lb foodservice', itemNumber: 'FC-APL-DICE-5LB',
    category: 'Apples', productLine: 'Fresh-cut', pack: '4 × 5 lb',
    unitCost: 22.9, originalPrice: 37.0, overridePrice: 33.0,
    reasonCode: 'Volume deal', overriddenBy: 'Jamal Greene', overriddenByEmail: EMAIL('Jamal Greene'),
  },
  {
    id: 'OVR-015', orderNumber: 'SO-50435', orderDate: iso(-52), cases: 120,
    channel: 'Grocery', customer: 'Northwind Foods',
    itemName: 'Asparagus 1 lb bunch', itemNumber: 'PK-ASP-1LB',
    category: 'Vegetables', productLine: 'Packed fresh', pack: '11 × 1 lb',
    unitCost: 22.8, originalPrice: 33.0, overridePrice: 29.0, floorPrice: 29.7,
    reasonCode: 'Contract price not updated', overriddenBy: 'Tom Kowalski', overriddenByEmail: EMAIL('Tom Kowalski'),
  },
  {
    id: 'OVR-016', orderNumber: 'SO-50388', orderDate: iso(-61), cases: 96,
    channel: 'Grocery', customer: 'Harborline Markets',
    itemName: 'Slicer Cucumbers 24 ct', itemNumber: 'PK-CUC-SLC',
    category: 'Vegetables', productLine: 'Packed fresh', pack: '24 ct',
    unitCost: 11.9, originalPrice: 16.8, overridePrice: 16.1,
    reasonCode: 'Quality / short-dated', overriddenBy: 'Victor Huang', overriddenByEmail: EMAIL('Victor Huang'),
  },
  {
    id: 'OVR-017', orderNumber: 'SO-50342', orderDate: iso(-74), cases: 288,
    channel: 'Club & Mass', customer: 'Summit Club Stores',
    itemName: 'Mini Cucumbers 1 lb bag', itemNumber: 'PK-CUC-MINI',
    category: 'Vegetables', productLine: 'Packed fresh', pack: '12 × 1 lb',
    unitCost: 13.4, originalPrice: 19.2, overridePrice: 17.28, floorPrice: 17.28,
    reasonCode: 'Volume deal', overriddenBy: 'Kate Sullivan', overriddenByEmail: EMAIL('Kate Sullivan'),
  },
  {
    id: 'OVR-018', orderNumber: 'SO-50296', orderDate: iso(-95), cases: 160,
    channel: 'Foodservice Contract', customer: 'Hudson Produce Terminal',
    itemName: 'Sliced Cucumbers 5 lb foodservice', itemNumber: 'FC-CUC-SLC-5LB',
    category: 'Vegetable Blends', productLine: 'Fresh-cut', pack: '4 × 5 lb',
    unitCost: 15.0, originalPrice: 24.0, overridePrice: 21.5,
    reasonCode: 'Rep discretion', overriddenBy: 'Elena Petrov', overriddenByEmail: EMAIL('Elena Petrov'),
  },
]

// ═══════════════════════════════════════════════════════════════════════
// 2 · Pricing setup (margin threshold test)
// ═══════════════════════════════════════════════════════════════════════
// 20 active price records. At the 25% default floor, 6 fail — 3 retail and 3
// foodservice, every one of them packed fresh. Three also price below their
// floor with no active trade promotion, which is a price leak rather than a
// margin decision.

const PRICING_SETUP: PricingSetupLine[] = [
  // ── Retail · grocery, club & mass, natural, e-commerce ──
  {
    id: 'PRC-RTL-01', mode: 'Retail', channel: 'Grocery', channelDetail: 'Grocery price group',
    customerCodes: GROCERY,
    itemName: 'Honeycrisp Apples 3 lb pouch', itemNumber: 'PK-APL-HC-3LB',
    category: 'Apples', productLine: 'Packed fresh', pack: '12 × 3 lb',
    quantity: 480, basePrice: 22.5, marginComponent: 0, discountPct: 0,
    autoCharge: 0, unitCost: 15.8, floorPrice: 20.25,
    validFrom: iso(-38), validTo: iso(120),
  },
  {
    id: 'PRC-RTL-02', mode: 'Retail', channel: 'Club & Mass', channelDetail: 'Summit Club Stores',
    customerCodes: ['C10007'],
    itemName: 'Honeycrisp Apples 3 lb pouch', itemNumber: 'PK-APL-HC-3LB',
    category: 'Apples', productLine: 'Packed fresh', pack: '12 × 3 lb',
    quantity: 336, basePrice: 22.5, marginComponent: 0, discountPct: 12,
    discount: {
      name: 'Fall Apple Club Event', type: 'Threshold', promoId: 'TP-2026-112',
      validFrom: iso(-10), validTo: iso(12),
      tiers: [
        { label: '1 – 239 cases', discountPct: 8 },
        { label: '240 – 479 cases', discountPct: 12 },
        { label: '480+ cases', discountPct: 15 },
      ],
    },
    autoCharge: 0, unitCost: 15.8, poolSharePct: 8, floorPrice: 20.25, promoUntil: iso(12),
    validFrom: iso(-10), validTo: iso(12),
  },
  {
    id: 'PRC-RTL-03', mode: 'Retail', channel: 'Grocery', channelDetail: 'Grocery price group',
    customerCodes: GROCERY,
    itemName: 'Apple Slices 2 oz snack cup', itemNumber: 'FC-APL-SLC-2OZ',
    category: 'Apples', productLine: 'Fresh-cut', pack: '24 × 2 oz',
    quantity: 300, basePrice: 27.6, marginComponent: 0, discountPct: 15,
    discount: {
      name: 'Lunchbox Snack Cup Deal', type: 'Quantity', promoId: 'TP-2026-108',
      validFrom: iso(-40), validTo: iso(25),
      tiers: [
        { label: '1 – 99 cases', discountPct: 0 },
        { label: '100 – 299 cases', discountPct: 10 },
        { label: '300+ cases', discountPct: 15 },
      ],
    },
    autoCharge: 0, unitCost: 17.0,
    validFrom: iso(-40), validTo: iso(25),
  },
  {
    id: 'PRC-RTL-04', mode: 'Retail', channel: 'Grocery', channelDetail: 'Grocery price group',
    customerCodes: GROCERY,
    itemName: 'Butternut Squash 35 lb carton', itemNumber: 'PK-SQB-CTN',
    category: 'Vegetables', productLine: 'Packed fresh', pack: '35 lb carton',
    quantity: 240, basePrice: 21.0, marginComponent: 0, discountPct: 0,
    autoCharge: 0, unitCost: 14.2, floorPrice: 18.9,
    validFrom: iso(-20), validTo: iso(90),
  },
  {
    id: 'PRC-RTL-05', mode: 'Retail', channel: 'E-commerce', channelDetail: 'E-commerce price group',
    customerCodes: ECOMMERCE,
    itemName: 'Blueberries pint clamshell', itemNumber: 'PK-BLU-PINT',
    category: 'Berries', productLine: 'Packed fresh', pack: '12 × 1 pint',
    quantity: 2400, basePrice: 30.0, marginComponent: 0, discountPct: 10,
    discount: {
      name: 'Late-Season Berry Feature', type: 'Line', promoId: 'TP-2026-115',
      validFrom: iso(-12), validTo: iso(9),
    },
    autoCharge: 0, unitCost: 21.0, floorPrice: 27.0, promoUntil: iso(9),
    validFrom: iso(-12), validTo: iso(9),
  },
  {
    id: 'PRC-RTL-06', mode: 'Retail', channel: 'Grocery', channelDetail: 'Northwind Foods · Harborline Markets',
    customerCodes: ['C10002', 'C10003'],
    itemName: 'Gala Apples 3 lb pouch', itemNumber: 'PK-APL-GA-3LB',
    category: 'Apples', productLine: 'Packed fresh', pack: '12 × 3 lb',
    quantity: 9600, basePrice: 18.75, marginComponent: 0, discountPct: 15,
    discount: {
      name: 'Ohio Harvest Ad', type: 'Line', promoId: 'TP-2026-104',
      validFrom: iso(-27), validTo: iso(-6),
    },
    // The ad closed six days ago and the promo price was never taken off the
    // price group — the retail side's price-leak finding.
    autoCharge: 0, unitCost: 13.4, floorPrice: 16.9, promoUntil: iso(-6),
    validFrom: iso(-27), validTo: iso(60),
  },
  {
    id: 'PRC-RTL-07', mode: 'Retail', channel: 'Grocery', channelDetail: 'Grocery + Natural price groups',
    customerCodes: [...GROCERY, ...NATURAL],
    itemName: 'Garden Salad Kit 10 oz', itemNumber: 'FC-SAL-GARDEN',
    category: 'Salads', productLine: 'Fresh-cut', pack: '8 × 10 oz',
    quantity: 420, basePrice: 29.6, marginComponent: 0, discountPct: 0,
    autoCharge: 0, unitCost: 17.5,
    validFrom: iso(-150), validTo: iso(120),
  },
  {
    id: 'PRC-RTL-08', mode: 'Retail', channel: 'Club & Mass', channelDetail: 'ValuePoint Mass Retail',
    customerCodes: ['C10008'],
    itemName: 'Veggie Tray w/ dip 24 oz', itemNumber: 'FC-VEG-TRAY',
    category: 'Fruit Cups & Trays', productLine: 'Fresh-cut', pack: '4 × 24 oz',
    quantity: 200, basePrice: 36.0, marginComponent: 0, discountPct: 0,
    autoCharge: 1.25, unitCost: 21.7,
    validFrom: iso(-90), validTo: iso(150),
  },
  {
    id: 'PRC-RTL-09', mode: 'Retail', channel: 'Natural', channelDetail: 'Natural price group',
    customerCodes: NATURAL,
    itemName: 'Tri-Color Peppers 3-pack', itemNumber: 'PK-PEP-3PK',
    category: 'Vegetables', productLine: 'Packed fresh', pack: '12 × 3 ct',
    quantity: 96, basePrice: 30.0, marginComponent: -2.0, discountPct: 0,
    autoCharge: 0, unitCost: 19.6,
    validFrom: iso(-120), validTo: iso(90),
  },
  {
    id: 'PRC-RTL-10', mode: 'Retail', channel: 'Club & Mass', channelDetail: 'Summit Club Stores',
    customerCodes: ['C10007'],
    itemName: 'Mini Cucumbers 1 lb bag', itemNumber: 'PK-CUC-MINI',
    category: 'Vegetables', productLine: 'Packed fresh', pack: '12 × 1 lb',
    quantity: 7200, basePrice: 19.2, marginComponent: 0, discountPct: 8,
    discount: {
      name: 'Club Pallet Program', type: 'Line', promoId: 'TP-2026-109',
      validFrom: iso(-30), validTo: iso(30),
    },
    autoCharge: 0, unitCost: 13.4, floorPrice: 17.28, promoUntil: iso(30),
    validFrom: iso(-30), validTo: iso(30),
  },
  {
    id: 'PRC-RTL-11', mode: 'Retail', channel: 'Grocery', channelDetail: 'Grocery price group',
    customerCodes: GROCERY,
    itemName: 'Diced Butternut Squash 12 oz', itemNumber: 'FC-VEG-SQB-DICE',
    category: 'Vegetable Blends', productLine: 'Fresh-cut', pack: '8 × 12 oz',
    quantity: 160, basePrice: 24.0, marginComponent: 0, discountPct: 15,
    discount: {
      name: 'Fall Soup Starter Bundle', type: 'Mix and match', promoId: 'TP-2026-116',
      validFrom: iso(-5), validTo: iso(40),
    },
    autoCharge: 0, unitCost: 14.6,
    validFrom: iso(-5), validTo: iso(40),
  },
  {
    id: 'PRC-RTL-12', mode: 'Retail', channel: 'E-commerce', channelDetail: 'E-commerce price group',
    customerCodes: ECOMMERCE,
    itemName: 'Fruit Cup (apple/blueberry) 6 oz', itemNumber: 'FC-FRT-CUP-6OZ',
    category: 'Fruit Cups & Trays', productLine: 'Fresh-cut', pack: '12 × 6 oz',
    quantity: 120, basePrice: 32.4, marginComponent: 1.5, discountPct: 0,
    autoCharge: 0, unitCost: 19.5,
    validFrom: iso(-200), validTo: iso(160),
  },

  // ── Foodservice · distributor, restaurant-chain and processor contracts ──
  {
    id: 'PRC-FS-01', mode: 'Foodservice', channel: 'Foodservice Contract',
    channelDetail: 'Midwest Foodservice Supply',
    customerAccount: 'C10011', contract: 'FY26 Fresh-Cut Supply Agreement',
    itemName: 'Diced Apples 5 lb foodservice', itemNumber: 'FC-APL-DICE-5LB',
    category: 'Apples', productLine: 'Fresh-cut', pack: '4 × 5 lb',
    quantity: 480, basePrice: 37.0, marginComponent: 0, discountPct: 10,
    discount: {
      name: 'Contract Volume Tier', type: 'Threshold', promoId: 'TP-2026-110',
      validFrom: iso(-45), validTo: iso(20),
      tiers: [
        { label: '$0 – $9,999 per order', discountPct: 5 },
        { label: '$10,000 – $24,999 per order', discountPct: 10 },
        { label: '$25,000+ per order', discountPct: 12 },
      ],
    },
    autoCharge: 0, unitCost: 22.9, floorPrice: 34.0, promoUntil: iso(20),
    validFrom: iso(-45), validTo: iso(20),
  },
  {
    id: 'PRC-FS-02', mode: 'Foodservice', channel: 'Foodservice Contract',
    channelDetail: 'Fresh Bowl Kitchens',
    customerAccount: 'C10021', contract: 'Restaurant Chain Agreement',
    itemName: 'Chopped Romaine 2 lb foodservice', itemNumber: 'FC-SAL-ROM-CHOP',
    category: 'Salads', productLine: 'Fresh-cut', pack: '6 × 2 lb',
    quantity: 600, basePrice: 26.4, marginComponent: 0, discountPct: 0,
    autoCharge: 0, unitCost: 16.5, floorPrice: 24.0,
    validFrom: iso(-180), validTo: iso(185),
  },
  {
    id: 'PRC-FS-03', mode: 'Foodservice', channel: 'Foodservice Contract',
    channelDetail: 'Keystone Foodservice',
    customerAccount: 'C10012', contract: 'Fall Apple Program',
    itemName: 'Honeycrisp Apples 88ct tray', itemNumber: 'PK-APL-HC-TRAY',
    category: 'Apples', productLine: 'Packed fresh', pack: '88 ct tray',
    quantity: 4800, basePrice: 42.0, marginComponent: 0, discountPct: 15,
    discount: {
      name: 'Harvest Kickoff Allowance', type: 'Line', promoId: 'TP-2026-118',
      validFrom: iso(-35), validTo: iso(-9),
    },
    // The trade promotion closed nine days ago and the allowance stayed on the
    // contract line — this is the demo's headline price-leak finding.
    autoCharge: 0, unitCost: 29.3, poolSharePct: 8, floorPrice: 37.8, promoUntil: iso(-9),
    validFrom: iso(-35), validTo: iso(55),
  },
  {
    id: 'PRC-FS-04', mode: 'Foodservice', channel: 'Foodservice Contract',
    channelDetail: 'Windy City Salad Works',
    customerAccount: 'C10038', contract: 'Processor Supply Contract',
    itemName: 'Zucchini 20 lb carton', itemNumber: 'PK-ZUC-CTN',
    category: 'Vegetables', productLine: 'Packed fresh', pack: '20 lb carton',
    quantity: 5760, basePrice: 19.0, marginComponent: 0, discountPct: 8,
    discount: {
      name: 'Processor Volume Schedule', type: 'Quantity',
      validFrom: iso(-150), validTo: iso(30),
      tiers: [
        { label: '1 – 99 cases', discountPct: 0 },
        { label: '100 – 199 cases', discountPct: 5 },
        { label: '200+ cases', discountPct: 8 },
      ],
    },
    autoCharge: 0, unitCost: 13.5, floorPrice: 17.1,
    validFrom: iso(-150), validTo: iso(30),
  },
  {
    id: 'PRC-FS-05', mode: 'Foodservice', channel: 'Foodservice Contract',
    channelDetail: 'Windy City Salad Works',
    customerAccount: 'C10038', contract: 'Processor Supply Contract',
    itemName: 'Green Bell Peppers 1-1/9 bu', itemNumber: 'PK-PEP-GRN',
    category: 'Vegetables', productLine: 'Packed fresh', pack: '1-1/9 bu',
    quantity: 5760, basePrice: 24.0, marginComponent: 0, discountPct: 8,
    discount: {
      name: 'Processor Volume Schedule', type: 'Quantity',
      validFrom: iso(-150), validTo: iso(30),
      tiers: [
        { label: '1 – 99 cases', discountPct: 0 },
        { label: '100 – 199 cases', discountPct: 5 },
        { label: '200+ cases', discountPct: 8 },
      ],
    },
    // Raw pepper cost moved after the contract was signed; the floor was
    // raised but the volume schedule was never re-cut against it.
    autoCharge: 0, unitCost: 17.0, floorPrice: 22.8,
    validFrom: iso(-150), validTo: iso(30),
  },
  {
    id: 'PRC-FS-06', mode: 'Foodservice', channel: 'Foodservice Contract',
    channelDetail: 'Cedar Point Hospitality',
    customerAccount: 'C10037', contract: 'Season Hospitality Agreement',
    itemName: 'Stir-Fry Vegetable Blend 12 oz', itemNumber: 'FC-VEG-STIR-12OZ',
    category: 'Vegetable Blends', productLine: 'Fresh-cut', pack: '8 × 12 oz',
    quantity: 144, basePrice: 28.8, marginComponent: 0, discountPct: 10,
    discount: {
      name: 'Season-Close Allowance', type: 'Line', promoId: 'TP-2026-117',
      validFrom: iso(-8), validTo: iso(21),
    },
    autoCharge: 0, unitCost: 17.5,
    validFrom: iso(-8), validTo: iso(21),
  },
  {
    id: 'PRC-FS-07', mode: 'Foodservice', channel: 'Foodservice Contract',
    channelDetail: 'Hudson Produce Terminal',
    customerAccount: 'C10016', contract: 'Terminal Market Agreement',
    itemName: 'Sliced Cucumbers 5 lb foodservice', itemNumber: 'FC-CUC-SLC-5LB',
    category: 'Vegetable Blends', productLine: 'Fresh-cut', pack: '4 × 5 lb',
    quantity: 200, basePrice: 24.0, marginComponent: 0, discountPct: 0,
    autoCharge: 0.95, unitCost: 15.0,
    validFrom: iso(-240), validTo: iso(125),
  },
  {
    id: 'PRC-FS-08', mode: 'Foodservice', channel: 'Foodservice Contract',
    channelDetail: 'North Shore Provisions',
    customerAccount: 'C10014', contract: 'Winter Squash Program',
    itemName: 'Butternut Squash 35 lb carton', itemNumber: 'PK-SQB-CTN',
    category: 'Vegetables', productLine: 'Packed fresh', pack: '35 lb carton',
    quantity: 144, basePrice: 21.0, marginComponent: 0, discountPct: 5,
    discount: {
      name: 'Winter Program Schedule', type: 'Quantity',
      validFrom: iso(-20), validTo: iso(150),
      tiers: [
        { label: '1 – 71 cases', discountPct: 0 },
        { label: '72 – 143 cases', discountPct: 3 },
        { label: '144+ cases', discountPct: 5 },
      ],
    },
    autoCharge: 0, unitCost: 14.2, floorPrice: 18.9,
    validFrom: iso(-20), validTo: iso(150),
  },
]

// ═══════════════════════════════════════════════════════════════════════
// 3 · Price history audit
// ═══════════════════════════════════════════════════════════════════════
// A price scope is whatever the price is set against: Bluestem's list price,
// a customer price group, or one customer's contract line.

const PRICE_HISTORY: PriceHistoryRecord[] = [
  {
    productKey: 'PK-APL-HC-TRAY|88 ct tray|LIST',
    itemName: 'Honeycrisp Apples 88ct tray', itemNumber: 'PK-APL-HC-TRAY',
    category: 'Apples', productLine: 'Packed fresh', pack: '88 ct tray',
    scopeId: 'LIST', scopeName: 'Bluestem list price',
    entries: [
      { id: 'PH-1-3', price: 42.0, activeFrom: iso(-38), activeTo: null, changedBy: 'Priya Nair', changeType: 'Season set', note: 'New-crop Honeycrisp price off the Hart packing line' },
      { id: 'PH-1-2', price: 44.5, activeFrom: iso(-170), activeTo: iso(-39), changedBy: 'Priya Nair', changeType: 'Season set', note: 'Storage-crop price, CA rooms at Hart' },
      { id: 'PH-1-1', price: 39.5, activeFrom: iso(-400), activeTo: iso(-171), changedBy: 'System', changeType: 'Initial', note: 'Item introduction' },
    ],
  },
  {
    productKey: 'PK-APL-HC-TRAY|88 ct tray|C10012',
    itemName: 'Honeycrisp Apples 88ct tray', itemNumber: 'PK-APL-HC-TRAY',
    category: 'Apples', productLine: 'Packed fresh', pack: '88 ct tray',
    scopeId: 'C10012', scopeName: 'Keystone Foodservice · Fall Apple Program',
    entries: [
      { id: 'PH-2-3', price: 35.7, activeFrom: iso(-35), activeTo: null, changedBy: 'Tom Kowalski', changeType: 'Trade promotion', note: `Harvest Kickoff Allowance · 15% — TP-2026-118 ended ${shortDate(iso(-9))}, price never restored to the $37.80 floor` },
      { id: 'PH-2-2', price: 42.0, activeFrom: iso(-170), activeTo: iso(-36), changedBy: 'Tom Kowalski', changeType: 'Contract update', note: 'Contract line matched to list' },
      { id: 'PH-2-1', price: 40.0, activeFrom: iso(-400), activeTo: iso(-171), changedBy: 'System', changeType: 'Initial', note: 'Program contract signed' },
    ],
  },
  {
    productKey: 'PK-APL-GA-3LB|12 × 3 lb|LIST',
    itemName: 'Gala Apples 3 lb pouch', itemNumber: 'PK-APL-GA-3LB',
    category: 'Apples', productLine: 'Packed fresh', pack: '12 × 3 lb',
    scopeId: 'LIST', scopeName: 'Bluestem list price',
    entries: [
      { id: 'PH-3-3', price: 18.75, activeFrom: iso(-38), activeTo: null, changedBy: 'Priya Nair', changeType: 'Season set', note: 'New-crop Gala price' },
      { id: 'PH-3-2', price: 19.5, activeFrom: iso(-170), activeTo: iso(-39), changedBy: 'Priya Nair', changeType: 'Season set', note: 'Storage-crop price' },
      { id: 'PH-3-1', price: 17.95, activeFrom: iso(-400), activeTo: iso(-171), changedBy: 'System', changeType: 'Initial', note: 'Item introduction' },
    ],
  },
  {
    productKey: 'PK-APL-GA-3LB|12 × 3 lb|PG-OHIO',
    itemName: 'Gala Apples 3 lb pouch', itemNumber: 'PK-APL-GA-3LB',
    category: 'Apples', productLine: 'Packed fresh', pack: '12 × 3 lb',
    scopeId: 'PG-OHIO', scopeName: 'Northwind Foods · Harborline Markets',
    entries: [
      { id: 'PH-4-3', price: 15.94, activeFrom: iso(-27), activeTo: null, changedBy: 'Tom Kowalski', changeType: 'Trade promotion', note: `Ohio Harvest Ad · 15% — TP-2026-104 ended ${shortDate(iso(-6))}, promo price still live` },
      { id: 'PH-4-2', price: 18.75, activeFrom: iso(-38), activeTo: iso(-28), changedBy: 'Priya Nair', changeType: 'Season set', note: 'Matched to new-crop list' },
      { id: 'PH-4-1', price: 19.5, activeFrom: iso(-170), activeTo: iso(-39), changedBy: 'System', changeType: 'Initial', note: 'Price group created' },
    ],
  },
  {
    productKey: 'PK-BLU-PINT|12 × 1 pint|LIST',
    itemName: 'Blueberries pint clamshell', itemNumber: 'PK-BLU-PINT',
    category: 'Berries', productLine: 'Packed fresh', pack: '12 × 1 pint',
    scopeId: 'LIST', scopeName: 'Bluestem list price',
    entries: [
      { id: 'PH-5-4', price: 30.0, activeFrom: iso(-45), activeTo: null, changedBy: 'Priya Nair', changeType: 'Season set', note: 'Partner-grower supply after the Michigan season closed' },
      { id: 'PH-5-3', price: 26.0, activeFrom: iso(-100), activeTo: iso(-46), changedBy: 'Priya Nair', changeType: 'Season set', note: 'Michigan peak — Holland DC full' },
      { id: 'PH-5-2', price: 32.0, activeFrom: iso(-150), activeTo: iso(-101), changedBy: 'Priya Nair', changeType: 'Season set', note: 'Early-season Michigan price' },
      { id: 'PH-5-1', price: 31.0, activeFrom: iso(-420), activeTo: iso(-151), changedBy: 'System', changeType: 'Initial', note: 'Item introduction' },
    ],
  },
  {
    productKey: 'PK-BLU-PINT|12 × 1 pint|PG-ECOM',
    itemName: 'Blueberries pint clamshell', itemNumber: 'PK-BLU-PINT',
    category: 'Berries', productLine: 'Packed fresh', pack: '12 × 1 pint',
    scopeId: 'PG-ECOM', scopeName: 'E-commerce price group',
    entries: [
      { id: 'PH-6-3', price: 27.0, activeFrom: iso(-12), activeTo: null, changedBy: 'Pricing Agent', changeType: 'Agent reprice', note: 'Late-Season Berry Feature · 10% — held exactly at the $27.00 floor' },
      { id: 'PH-6-2', price: 30.0, activeFrom: iso(-45), activeTo: iso(-13), changedBy: 'Kate Sullivan', changeType: 'Season set', note: 'Matched to partner-grower list' },
      { id: 'PH-6-1', price: 26.0, activeFrom: iso(-100), activeTo: iso(-46), changedBy: 'System', changeType: 'Initial', note: 'Price group created' },
    ],
  },
  {
    productKey: 'PK-SQB-CTN|35 lb carton|LIST',
    itemName: 'Butternut Squash 35 lb carton', itemNumber: 'PK-SQB-CTN',
    category: 'Vegetables', productLine: 'Packed fresh', pack: '35 lb carton',
    scopeId: 'LIST', scopeName: 'Bluestem list price',
    entries: [
      { id: 'PH-7-3', price: 21.0, activeFrom: iso(-20), activeTo: null, changedBy: 'Priya Nair', changeType: 'Season set', note: 'Michigan squash harvest — held into Thanksgiving' },
      { id: 'PH-7-2', price: 23.5, activeFrom: iso(-230), activeTo: iso(-21), changedBy: 'Priya Nair', changeType: 'Season set', note: 'Partner-grower winter supply' },
      { id: 'PH-7-1', price: 21.5, activeFrom: iso(-400), activeTo: iso(-231), changedBy: 'System', changeType: 'Initial', note: 'Item introduction' },
    ],
  },
  {
    productKey: 'FC-APL-SLC-2OZ|24 × 2 oz|LIST',
    itemName: 'Apple Slices 2 oz snack cup', itemNumber: 'FC-APL-SLC-2OZ',
    category: 'Apples', productLine: 'Fresh-cut', pack: '24 × 2 oz',
    scopeId: 'LIST', scopeName: 'Bluestem list price',
    entries: [
      { id: 'PH-8-3', price: 27.6, activeFrom: iso(-40), activeTo: null, changedBy: 'Pricing Agent', changeType: 'Cost-plus update', note: 'New-crop apple cost rolled into the fresh-cut price' },
      { id: 'PH-8-2', price: 26.4, activeFrom: iso(-220), activeTo: iso(-41), changedBy: 'Priya Nair', changeType: 'Season set', note: 'Storage-crop cost basis' },
      { id: 'PH-8-1', price: 25.8, activeFrom: iso(-420), activeTo: iso(-221), changedBy: 'System', changeType: 'Initial', note: 'Item introduction' },
    ],
  },
]

// ═══════════════════════════════════════════════════════════════════════
// 4 · AI recommendations
// ═══════════════════════════════════════════════════════════════════════

const RECOMMENDATIONS: Recommendation[] = [
  // ── Retail ──
  {
    id: 'REC-RTL-1', audience: 'Retail', kind: 'Promotion timing',
    title: 'Put the fall apple features on fresh-cut, not on the pouches',
    detail:
      'Apple slices still clear 27% margin at 15% off; a 3 lb Gala pouch at the same depth lands under 16%. Feature the fresh-cut items on price and keep the pouches at list in the ad.',
    bullets: ['Week 1 · Apple Slices 14 oz family pack at 15% off', 'Week 2 · Snack cups on the 300-case tier', 'Pouches stay at list — feature in ad, not on price'],
    impact: '+$84K margin vs. a flat 12% apple promotion', confidence: 'High', status: 'Open',
  },
  {
    id: 'REC-RTL-2', audience: 'Retail', kind: 'Hold price',
    title: 'Hold butternut squash at $21.00 through Thanksgiving',
    detail:
      'Squash demand climbs into November and the carton carries a 60-day shelf life, so there is no spoilage clock forcing a price move. Cutting now gives away a price the grocery chains are paying.',
    impact: 'Protects ~$52K of list-price revenue', confidence: 'High', status: 'Open',
  },
  {
    id: 'REC-RTL-3', audience: 'Retail', kind: 'Increase price',
    title: 'Raise the Garden Salad Kit from $29.60 to $31.20 a case',
    detail:
      'Fresh-cut salad kits ship at 41% margin and case velocity held flat through two cost-plus increases. The Caesar kit already lists at $31.20 with no volume penalty.',
    impact: '+$118K estimated annual margin', confidence: 'High', status: 'Open',
  },
  {
    id: 'REC-RTL-4', audience: 'Retail', kind: 'Customer-specific pricing',
    title: 'Carry the e-commerce small-pack uplift to the natural channel',
    detail:
      'Pantry Prime and DoorStep already pay $1.50 a case above the price group on fresh-cut with no loss of volume. Extend the uplift to Lakeside Natural Foods and Green Cart Co-op.',
    impact: '+$38K margin per season', confidence: 'Medium', status: 'Open',
  },
  {
    id: 'REC-RTL-5', audience: 'Retail', kind: 'Inventory-driven',
    title: 'Blueberry pints are at 9 days of cover on a 12-day shelf life',
    detail: 'Partner-grower berries landed heavier than the e-commerce program is pulling. Options, in order of margin impact:',
    bullets: [
      'Divert the surplus to the Grand Rapids fresh-cut line for fruit cups (42% margin)',
      'Offer the balance to Summit Club as a pallet deal before day 6',
      'Price to move only as a last resort — the line already sits on its floor',
    ],
    impact: 'Avoids ~$41K of shrink', confidence: 'High', status: 'Open',
  },

  // ── Foodservice ──
  {
    id: 'REC-FS-1', audience: 'Foodservice', kind: 'Floor compliance',
    title: 'Three lines price below floor with no active promotion',
    detail:
      'The Keystone Honeycrisp tray kept its harvest-kickoff allowance nine days after TP-2026-118 closed, the Ohio Gala ad price is still live at Northwind and Harborline, and the Windy City pepper schedule was never re-cut against the new floor.',
    bullets: ['Restore the Keystone 88ct tray to the $37.80 floor', 'End the Ohio Gala ad price or extend TP-2026-104 with approval', 'Re-cut the Windy City pepper volume schedule'],
    impact: 'Clears 3 open price leaks', confidence: 'High', status: 'Open',
  },
  {
    id: 'REC-FS-2', audience: 'Foodservice', kind: 'Contract terms',
    title: 'Index the Windy City processor contract to raw cost',
    detail:
      'Zucchini and pepper costs rose after the contract was signed and the fixed volume schedule did not move with them, which is why both lines now sit under 25%. A quarterly cost index keeps the discount and the margin.',
    impact: '+$67K if the contract reprices quarterly to cost', confidence: 'Medium', status: 'Open',
  },
  {
    id: 'REC-FS-3', audience: 'Foodservice', kind: 'Margin protection',
    title: 'Keystone Honeycrisp tray earns 24.5% at 15% off — under the floor even pooled',
    detail:
      'Without the 8% grower pool share the line would be at 17.9%. Rather than deepen the allowance, restore the floor and fund a smaller, dated promotion.',
    bullets: ['Restore to the $37.80 floor and close the expired allowance', 'Counter with a 7% dated allowance through the next ad cycle'],
    impact: '+$10K margin across the 4,800-case program', confidence: 'High', status: 'Open',
  },
  {
    id: 'REC-FS-4', audience: 'Foodservice', kind: 'Product mix',
    title: 'Move foodservice apple volume toward diced fresh-cut',
    detail:
      'Packed 88ct trays list at 30% margin and carry a floor; 5 lb diced apples for foodservice run 38% and absorb contract tiers. Offer Keystone the diced pack for its school and hospital accounts.',
    bullets: ['Propose a 60/40 tray / diced split on the winter contract'],
    impact: '+5.4 pts blended margin on foodservice apples', confidence: 'Medium', status: 'Open',
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
  { label: 'Fresh-cut mix', value: '38%', trend: 'up' },
]

const FOODSERVICE_KPIS: KpiMonitor[] = [
  { label: 'Margin by contract', value: '27.2% avg', trend: 'flat' },
  { label: 'Grower pool share captured', value: '$186K', trend: 'up' },
  { label: 'Floor compliance rate', value: '95.8%', trend: 'down' },
  { label: 'Average contract discount', value: '7.9%', trend: 'up' },
  { label: 'Open deductions', value: '$94K', trend: 'down' },
  { label: 'Contracts renewing in 60 days', value: '4', trend: 'flat' },
  { label: 'Contract margin', value: '26.4%', trend: 'flat' },
  { label: 'Cases per contract', value: '2,940 avg', trend: 'up' },
  { label: 'Committed volume', value: '$6.8M', trend: 'up' },
]

// category list for filters
const CATEGORIES = [
  'Apples',
  'Berries',
  'Vegetables',
  'Salads',
  'Vegetable Blends',
  'Fruit Cups & Trays',
] as const

// ═══════════════════════════════════════════════════════════════════════
// 5 · Shipment model (feeds the shared generator in src/data/mockData.ts)
// ═══════════════════════════════════════════════════════════════════════
// Shape of the curve: a per-item base rate at an average customer, scaled by
// customer size, by the item's crop season, and by day of week (produce ships
// Monday to Friday), with bounded noise on top.

/** Demand curve by calendar month, Jan..Dec. */
const SEASON_CURVES = {
  apples: [0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.65, 0.8, 1.2, 1.35, 1.2, 1.0],
  squash: [0.7, 0.6, 0.5, 0.4, 0.3, 0.3, 0.3, 0.5, 1.0, 1.4, 1.5, 1.1],
  berries: [0.6, 0.6, 0.7, 0.8, 1.0, 1.3, 1.5, 1.3, 0.9, 0.7, 0.6, 0.6],
  vegetables: [0.8, 0.8, 0.85, 0.9, 1.0, 1.15, 1.2, 1.2, 1.05, 0.95, 0.9, 0.85],
  freshCut: [0.95, 0.95, 1.0, 1.0, 1.0, 1.05, 1.05, 1.0, 1.05, 1.05, 1.2, 1.3],
} as const

/**
 * Per-item profile for every retail-priced item. Cover is sized against shelf
 * life: blueberries and mini cucumbers are carrying most of their life in
 * cover — the demo's inventory problem — while apples and squash sit on weeks
 * of life with days of cover.
 */
const ITEM_PROFILE: Record<string, ItemProfile> = {
  'PK-APL-HC-3LB': { base: 14, season: 'apples', coverDays: 10, shelfLifeDays: 45 },
  'PK-APL-GA-3LB': { base: 11, season: 'apples', coverDays: 14, shelfLifeDays: 45 },
  'PK-SQB-CTN': { base: 6, season: 'squash', coverDays: 12, shelfLifeDays: 60 },
  'PK-BLU-PINT': { base: 5, season: 'berries', coverDays: 9, shelfLifeDays: 12 },
  'PK-CUC-MINI': { base: 7, season: 'vegetables', coverDays: 8, shelfLifeDays: 12 },
  'PK-PEP-3PK': { base: 4, season: 'vegetables', coverDays: 3, shelfLifeDays: 10 },
  'FC-APL-SLC-2OZ': { base: 6, season: 'freshCut', coverDays: 5, shelfLifeDays: 18 },
  'FC-SAL-GARDEN': { base: 8, season: 'freshCut', coverDays: 3, shelfLifeDays: 12 },
  'FC-VEG-TRAY': { base: 3, season: 'freshCut', coverDays: 2, shelfLifeDays: 9 },
  'FC-VEG-SQB-DICE': { base: 3.5, season: 'squash', coverDays: 4, shelfLifeDays: 12 },
  'FC-FRT-CUP-6OZ': { base: 4.5, season: 'freshCut', coverDays: 3, shelfLifeDays: 10 },
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
