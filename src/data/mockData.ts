// ── Alvin's Island · Pricing & Margin Agent · demo dataset ──────────────
//
// This file is the single source of truth for the demo. Every figure here is
// synthetic and hand-built to be internally consistent:
//
//   · Own-label souvenir/beach goods run 65–82% margin (cheap to source,
//     bought on impulse by tourists who do not comparison-shop).
//   · Branded surf (Quiksilver, Roxy, Volcom, O'Neill, Rip Curl, Vans, Fox)
//     runs at keystone — ~45–50% at full price — and the brand sets a MAP
//     floor plus how much markdown it will co-fund.
//   That gap is the demo's whole argument: discounting own-label is cheap,
//   discounting branded is where margin quietly disappears.
//
// Every date is derived from AS_OF in src/lib/config.ts. Move that one value
// and the entire dataset — order dates, price windows, markdown waves, MAP
// waivers — slides with it. Nothing here is hardcoded to a calendar date.
//
// Store locations are Alvin's Island's real coastal estate. Staff names,
// order numbers, customer-facing incidents and vendor program numbers are
// invented; no real person is portrayed as making a bad pricing call.

import { iso, AS_OF } from '../lib/config'
import type {
  PriceOverride,
  PricingSetupLine,
  PriceHistoryRecord,
  Recommendation,
  KpiMonitor,
  StoreLocation,
  OrgNode,
  ItemPerformance,
} from '../models/types'
import { lineMarginPct, lineBreachesMap } from '../models/types'

// ═══════════════════════════════════════════════════════════════════════
// 0 · Store estate
// ═══════════════════════════════════════════════════════════════════════

export const STORES: StoreLocation[] = [
  { code: 'ST-PCB', name: 'Panama City Beach, FL', state: 'FL', region: 'RGN-PAN' },
  { code: 'ST-DEST', name: 'Destin, FL', state: 'FL', region: 'RGN-PAN' },
  { code: 'ST-FWB', name: 'Fort Walton Beach, FL', state: 'FL', region: 'RGN-PAN' },
  { code: 'ST-PNS', name: 'Pensacola Beach, FL', state: 'FL', region: 'RGN-PAN' },
  { code: 'ST-NAV', name: 'Navarre Beach, FL', state: 'FL', region: 'RGN-PAN' },
  { code: 'ST-MAD', name: 'Madeira Beach, FL', state: 'FL', region: 'RGN-GULF' },
  { code: 'ST-CLW', name: 'Clearwater Beach, FL', state: 'FL', region: 'RGN-GULF' },
  { code: 'ST-DAY', name: 'Daytona Beach, FL', state: 'FL', region: 'RGN-ATL' },
  { code: 'ST-GSH', name: 'Gulf Shores, AL', state: 'AL', region: 'RGN-ALA' },
  { code: 'ST-ORB', name: 'Orange Beach, AL', state: 'AL', region: 'RGN-ALA' },
]

/** The ecommerce channel behaves as a location for pricing and sell-through. */
export const ECOM_CODE = 'ECOM'

/** Every sellable location: the store estate plus the site. */
export const LOCATIONS: { code: string; name: string; region: string }[] = [
  ...STORES.map((s) => ({ code: s.code, name: s.name, region: s.region })),
  { code: ECOM_CODE, name: 'alvinsisland.com', region: 'RGN-ECOM' },
]

/**
 * Organisation hierarchy. Price updates roll out against a node here — pick
 * "Florida Panhandle" and the change applies to the five stores under it.
 */
export const ORG_HIERARCHY: OrgNode = {
  code: 'ALL',
  name: 'All locations',
  children: [
    {
      code: 'RGN-PAN',
      name: 'Florida Panhandle',
      children: STORES.filter((s) => s.region === 'RGN-PAN').map((s) => ({ code: s.code, name: s.name })),
    },
    {
      code: 'RGN-GULF',
      name: 'Gulf Coast Florida',
      children: STORES.filter((s) => s.region === 'RGN-GULF').map((s) => ({ code: s.code, name: s.name })),
    },
    {
      code: 'RGN-ATL',
      name: 'Atlantic Florida',
      children: STORES.filter((s) => s.region === 'RGN-ATL').map((s) => ({ code: s.code, name: s.name })),
    },
    {
      code: 'RGN-ALA',
      name: 'Alabama Coast',
      children: STORES.filter((s) => s.region === 'RGN-ALA').map((s) => ({ code: s.code, name: s.name })),
    },
    { code: 'RGN-ECOM', name: 'Ecommerce', children: [{ code: ECOM_CODE, name: 'alvinsisland.com' }] },
  ],
}

const ALL_STORE_CODES = STORES.map((s) => s.code)
const GULF_COAST = ALL_STORE_CODES.filter((c) => c !== 'ST-DAY')
const PANHANDLE = STORES.filter((s) => s.region === 'RGN-PAN').map((s) => s.code)

/** Vendor programs the branded assortment is bought under. */
export const VENDOR_PROGRAMS = [
  { account: 'V-2041', brand: 'Quiksilver', program: 'Core Surf Program', coopPct: 12 },
  { account: 'V-2044', brand: 'Roxy', program: 'Womens Swim Program', coopPct: 10 },
  { account: 'V-2052', brand: 'Volcom', program: 'Womens Swim Program', coopPct: 0 },
  { account: 'V-2068', brand: "O'Neill", program: 'Watersports Program', coopPct: 8 },
  { account: 'V-2075', brand: 'Rip Curl', program: 'Core Surf Program', coopPct: 0 },
  { account: 'V-2090', brand: 'Vans', program: 'Footwear Program', coopPct: 0 },
  { account: 'V-2103', brand: 'Fox Racing', program: 'Headwear Program', coopPct: 5 },
] as const

// ═══════════════════════════════════════════════════════════════════════
// 1 · Price overrides (POS audit trail)
// ═══════════════════════════════════════════════════════════════════════
// Register-level price overrides. Branded items carry the vendor MAP floor so
// the audit can separate "thin margin" from "we broke the vendor agreement" —
// several branded overrides sit thin but exactly at the floor, which is the
// distinction the MAP column exists to draw.

export const PRICE_OVERRIDES: PriceOverride[] = [
  {
    id: 'OVR-001', orderNumber: 'SO-241882', orderDate: iso(-2),
    channel: 'Store', storeOrSite: 'Panama City Beach, FL',
    styleName: 'Quiksilver Everyday Surfwash Boardshort 19"', itemNumber: 'QS-4412',
    category: 'Boardshorts', productLine: 'Branded', colorSize: 'Sapphire / 32',
    unitCost: 25.0, originalPrice: 49.99, overridePrice: 29.99, mapFloor: 44.99,
    reasonCode: 'Price Match', overriddenBy: 'Bryce Callender', overriddenByEmail: 'bryce.callender@alvinsisland.com',
  },
  {
    id: 'OVR-002', orderNumber: 'SO-241790', orderDate: iso(-4),
    channel: 'Ecommerce', storeOrSite: 'alvinsisland.com',
    styleName: 'Destin, FL Sun & Stripes Hoodie', itemNumber: 'AI-7702',
    category: 'Hoodies & Fleece', productLine: 'Own label', colorSize: 'Navy / L',
    unitCost: 12.75, originalPrice: 39.99, overridePrice: 27.99,
    reasonCode: 'Event Promotion', overriddenBy: 'Marisol Reyes', overriddenByEmail: 'marisol.reyes@alvinsisland.com',
  },
  {
    id: 'OVR-003', orderNumber: 'SO-241655', orderDate: iso(-6),
    channel: 'Store', storeOrSite: 'Destin, FL',
    styleName: 'Vans Classic Slip-On', itemNumber: 'VN-8801',
    category: 'Footwear', productLine: 'Branded', colorSize: 'Black-White / 9',
    unitCost: 32.0, originalPrice: 59.99, overridePrice: 54.99, mapFloor: 54.99,
    reasonCode: 'Manager Discretion', overriddenBy: 'Devon Trask', overriddenByEmail: 'devon.trask@alvinsisland.com',
  },
  {
    id: 'OVR-004', orderNumber: 'SO-241503', orderDate: iso(-9),
    channel: 'Store', storeOrSite: 'Gulf Shores, AL',
    styleName: 'Foam Boogie Board 41"', itemNumber: 'AI-9310',
    category: 'Beach Accessories', productLine: 'Own label', colorSize: 'Teal / 41in',
    unitCost: 8.2, originalPrice: 29.99, overridePrice: 19.99,
    reasonCode: 'Damaged / Sun-Faded', overriddenBy: 'Kayla Nguyen', overriddenByEmail: 'kayla.nguyen@alvinsisland.com',
  },
  {
    id: 'OVR-005', orderNumber: 'SO-241344', orderDate: iso(-12),
    channel: 'Store', storeOrSite: 'Orange Beach, AL',
    styleName: 'Roxy Beach Classics Tie-Side Bottom', itemNumber: 'RX-2208',
    category: 'Swimwear', productLine: 'Branded', colorSize: 'Coral / M',
    unitCost: 15.0, originalPrice: 29.99, overridePrice: 17.99, mapFloor: 26.99,
    reasonCode: 'Manager Discretion', overriddenBy: 'Bryce Callender', overriddenByEmail: 'bryce.callender@alvinsisland.com',
  },
  {
    id: 'OVR-006', orderNumber: 'SO-241201', orderDate: iso(-15),
    channel: 'Store', storeOrSite: 'Panama City Beach, FL',
    styleName: 'Panama City Beach Sunset Tee', itemNumber: 'AI-6011',
    category: 'Souvenirs', productLine: 'Own label', colorSize: 'White / L',
    unitCost: 4.2, originalPrice: 16.99, overridePrice: 10.0,
    reasonCode: 'Group / Tour Rate', overriddenBy: 'Hollis Barnett', overriddenByEmail: 'hollis.barnett@alvinsisland.com',
  },
  {
    id: 'OVR-007', orderNumber: 'SO-241077', orderDate: iso(-18),
    channel: 'Ecommerce', storeOrSite: 'alvinsisland.com',
    styleName: 'Volcom Pucker Up Cheekini Bottom', itemNumber: 'VL-3390',
    category: 'Swimwear', productLine: 'Branded', colorSize: 'Black / S',
    unitCost: 27.5, originalPrice: 55.0, overridePrice: 38.5, mapFloor: 49.5,
    reasonCode: 'Price Match', overriddenBy: 'Marisol Reyes', overriddenByEmail: 'marisol.reyes@alvinsisland.com',
  },
  {
    id: 'OVR-008', orderNumber: 'SO-240918', orderDate: iso(-22),
    channel: 'Store', storeOrSite: 'Clearwater Beach, FL',
    styleName: "Alvin's Island Logo Trucker Cap", itemNumber: 'AI-5540',
    category: 'Headwear', productLine: 'Own label', colorSize: 'Navy-Gold / OS',
    unitCost: 4.75, originalPrice: 19.99, overridePrice: 12.99,
    reasonCode: 'Display Sample', overriddenBy: 'Tamsin Okoro', overriddenByEmail: 'tamsin.okoro@alvinsisland.com',
  },
  {
    id: 'OVR-009', orderNumber: 'SO-240766', orderDate: iso(-26),
    channel: 'Store', storeOrSite: 'Madeira Beach, FL',
    styleName: "O'Neill Reactor 2mm Rash Guard", itemNumber: 'ON-1174',
    category: 'Dry-Fit', productLine: 'Branded', colorSize: 'Graphite / M',
    unitCost: 20.0, originalPrice: 39.99, overridePrice: 25.99, mapFloor: 35.99,
    reasonCode: 'Manager Discretion', overriddenBy: 'Devon Trask', overriddenByEmail: 'devon.trask@alvinsisland.com',
  },
  {
    id: 'OVR-010', orderNumber: 'SO-240612', orderDate: iso(-31),
    channel: 'Store', storeOrSite: 'Daytona Beach, FL',
    styleName: 'Ladies Tropical Palm One-Piece', itemNumber: 'AI-2255',
    category: 'Swimwear', productLine: 'Own label', colorSize: 'Aqua / M',
    unitCost: 13.4, originalPrice: 44.99, overridePrice: 24.99,
    reasonCode: 'Damaged / Sun-Faded', overriddenBy: 'Kayla Nguyen', overriddenByEmail: 'kayla.nguyen@alvinsisland.com',
  },
  {
    id: 'OVR-011', orderNumber: 'SO-240455', orderDate: iso(-36),
    channel: 'Ecommerce', storeOrSite: 'alvinsisland.com',
    styleName: 'Paradise Dress Tunic', itemNumber: 'AI-8104',
    category: 'Tees & Tanks', productLine: 'Own label', colorSize: 'Turquoise / M',
    unitCost: 8.9, originalPrice: 29.99, overridePrice: 19.99,
    reasonCode: 'Price Match', overriddenBy: 'Marisol Reyes', overriddenByEmail: 'marisol.reyes@alvinsisland.com',
  },
  {
    id: 'OVR-012', orderNumber: 'SO-240298', orderDate: iso(-41),
    channel: 'Store', storeOrSite: 'Navarre Beach, FL',
    styleName: 'Rip Curl Icons Surflite Boardshort', itemNumber: 'RC-5521',
    category: 'Boardshorts', productLine: 'Branded', colorSize: 'Navy / 34',
    unitCost: 27.5, originalPrice: 54.99, overridePrice: 34.99, mapFloor: 49.49,
    reasonCode: 'Manager Discretion', overriddenBy: 'Hollis Barnett', overriddenByEmail: 'hollis.barnett@alvinsisland.com',
  },
  {
    id: 'OVR-013', orderNumber: 'SO-240134', orderDate: iso(-48),
    channel: 'Store', storeOrSite: 'Fort Walton Beach, FL',
    styleName: 'Sea Turtle Beach Towel 30x60', itemNumber: 'AI-9020',
    category: 'Beach Accessories', productLine: 'Own label', colorSize: 'Multi / 30x60',
    unitCost: 6.4, originalPrice: 21.99, overridePrice: 12.99,
    reasonCode: 'Group / Tour Rate', overriddenBy: 'Tamsin Okoro', overriddenByEmail: 'tamsin.okoro@alvinsisland.com',
  },
  {
    id: 'OVR-014', orderNumber: 'SO-239977', orderDate: iso(-55),
    channel: 'Store', storeOrSite: 'Panama City Beach, FL',
    styleName: 'Fox Racing Legacy Moth Snapback', itemNumber: 'FX-6612',
    category: 'Headwear', productLine: 'Branded', colorSize: 'Black / OS',
    unitCost: 14.0, originalPrice: 27.99, overridePrice: 24.99, mapFloor: 24.99,
    reasonCode: 'Event Promotion', overriddenBy: 'Bryce Callender', overriddenByEmail: 'bryce.callender@alvinsisland.com',
  },
  {
    id: 'OVR-015', orderNumber: 'SO-239741', orderDate: iso(-63),
    channel: 'Ecommerce', storeOrSite: 'alvinsisland.com',
    styleName: 'Gulf Shores Dolphin Dry-Fit Tee', itemNumber: 'AI-6155',
    category: 'Dry-Fit', productLine: 'Own label', colorSize: 'Heather Blue / L',
    unitCost: 6.1, originalPrice: 24.99, overridePrice: 16.99,
    reasonCode: 'Event Promotion', overriddenBy: 'Marisol Reyes', overriddenByEmail: 'marisol.reyes@alvinsisland.com',
  },
  {
    id: 'OVR-016', orderNumber: 'SO-239502', orderDate: iso(-72),
    channel: 'Store', storeOrSite: 'Destin, FL',
    styleName: 'Quiksilver Original Boardshort Tee', itemNumber: 'QS-4090',
    category: 'Tees & Tanks', productLine: 'Branded', colorSize: 'White / M',
    unitCost: 12.5, originalPrice: 24.99, overridePrice: 22.49, mapFloor: 22.49,
    reasonCode: 'Price Match', overriddenBy: 'Devon Trask', overriddenByEmail: 'devon.trask@alvinsisland.com',
  },
  {
    id: 'OVR-017', orderNumber: 'SO-239188', orderDate: iso(-86),
    channel: 'Store', storeOrSite: 'Gulf Shores, AL',
    styleName: 'Shark Tooth Necklace', itemNumber: 'AI-9105',
    category: 'Beach Accessories', productLine: 'Own label', colorSize: 'Cord / OS',
    unitCost: 1.85, originalPrice: 9.99, overridePrice: 5.0,
    reasonCode: 'Group / Tour Rate', overriddenBy: 'Kayla Nguyen', overriddenByEmail: 'kayla.nguyen@alvinsisland.com',
  },
  {
    id: 'OVR-018', orderNumber: 'SO-238904', orderDate: iso(-104),
    channel: 'Store', storeOrSite: 'Orange Beach, AL',
    styleName: 'Gulf Shores, AL Sunset Tank', itemNumber: 'AI-6208',
    category: 'Souvenirs', productLine: 'Own label', colorSize: 'Sand / M',
    unitCost: 4.6, originalPrice: 18.99, overridePrice: 11.99,
    reasonCode: 'Display Sample', overriddenBy: 'Hollis Barnett', overriddenByEmail: 'hollis.barnett@alvinsisland.com',
  },
]

// ═══════════════════════════════════════════════════════════════════════
// 2 · Pricing setup (margin threshold test)
// ═══════════════════════════════════════════════════════════════════════
// 20 active price records. At the 45% default target, 6 fail — 3 on the
// retail side and 3 on the vendor side. Three of those also price below a
// vendor MAP floor with no active waiver, which is a compliance issue rather
// than a margin one.

export const PRICING_SETUP: PricingSetupLine[] = [
  // ── Retail · alvinsisland.com + the store estate ──
  {
    id: 'PRC-RTL-01', mode: 'Retail', channel: 'Ecommerce', channelDetail: 'alvinsisland.com',
    storeCodes: [ECOM_CODE],
    styleName: 'Destin, FL Sun & Stripes Hoodie', itemNumber: 'AI-7702',
    category: 'Hoodies & Fleece', productLine: 'Own label', colorSize: 'Navy / L',
    quantity: 1, basePrice: 39.99, marginComponent: 0, discountPct: 0,
    autoCharge: 0, unitCost: 12.75,
    validFrom: iso(-3), validTo: iso(120),
  },
  {
    id: 'PRC-RTL-02', mode: 'Retail', channel: 'Ecommerce', channelDetail: 'alvinsisland.com',
    storeCodes: [ECOM_CODE],
    styleName: 'Quiksilver Everyday Surfwash Boardshort 19"', itemNumber: 'QS-4412',
    category: 'Boardshorts', productLine: 'Branded', colorSize: 'Sapphire / 32',
    quantity: 1, basePrice: 49.99, marginComponent: 0, discountPct: 20,
    discount: {
      name: 'End-of-Summer Surf Event', type: 'Threshold',
      validFrom: iso(-14), validTo: iso(20),
      tiers: [
        { label: '$0 – $74 order total', discountPct: 10 },
        { label: '$75 – $149 order total', discountPct: 20 },
        { label: '$150+ order total', discountPct: 25 },
      ],
    },
    autoCharge: 0, unitCost: 25.0, mapFloor: 44.99, mapWaiverUntil: iso(20),
    validFrom: iso(-14), validTo: iso(20),
  },
  {
    id: 'PRC-RTL-03', mode: 'Retail', channel: 'Store', channelDetail: 'All Gulf Coast stores',
    storeCodes: GULF_COAST,
    styleName: 'Panama City Beach Sunset Tee', itemNumber: 'AI-6011',
    category: 'Souvenirs', productLine: 'Own label', colorSize: 'White / L',
    quantity: 2, basePrice: 16.99, marginComponent: 0, discountPct: 30,
    discount: {
      name: 'Souvenir Tee Multi-Buy', type: 'Quantity',
      validFrom: iso(-60), validTo: iso(45),
      tiers: [
        { label: '1 unit', discountPct: 0 },
        { label: '2 units', discountPct: 30 },
        { label: '3+ units', discountPct: 40 },
      ],
    },
    autoCharge: 0, unitCost: 4.2,
    validFrom: iso(-60), validTo: iso(45),
  },
  {
    id: 'PRC-RTL-04', mode: 'Retail', channel: 'Store', channelDetail: 'All stores',
    storeCodes: ALL_STORE_CODES,
    styleName: 'Vans Classic Slip-On', itemNumber: 'VN-8801',
    category: 'Footwear', productLine: 'Branded', colorSize: 'Black-White / 9',
    quantity: 1, basePrice: 59.99, marginComponent: 0, discountPct: 0,
    autoCharge: 0, unitCost: 32.0, mapFloor: 54.99,
    validFrom: iso(-210), validTo: iso(150),
  },
  {
    id: 'PRC-RTL-05', mode: 'Retail', channel: 'Ecommerce', channelDetail: 'alvinsisland.com',
    storeCodes: [ECOM_CODE],
    styleName: 'Ladies Tropical Palm One-Piece', itemNumber: 'AI-2255',
    category: 'Swimwear', productLine: 'Own label', colorSize: 'Aqua / M',
    quantity: 1, basePrice: 44.99, marginComponent: 0, discountPct: 40,
    discount: {
      name: 'End-of-Season Swim Clearance', type: 'Line',
      validFrom: iso(-11), validTo: iso(40),
    },
    autoCharge: 0, unitCost: 13.4,
    validFrom: iso(-11), validTo: iso(40),
  },
  {
    id: 'PRC-RTL-06', mode: 'Retail', channel: 'Store', channelDetail: 'Panhandle stores',
    storeCodes: PANHANDLE,
    styleName: 'Roxy Beach Classics Tie-Side Bottom', itemNumber: 'RX-2208',
    category: 'Swimwear', productLine: 'Branded', colorSize: 'Coral / M',
    quantity: 1, basePrice: 29.99, marginComponent: 0, discountPct: 30,
    discount: {
      name: 'Swim Season Flush · Panhandle', type: 'Line',
      validFrom: iso(-8), validTo: iso(30),
    },
    autoCharge: 0, unitCost: 15.0, vendorAllowancePct: 10, mapFloor: 26.99,
    validFrom: iso(-8), validTo: iso(30),
  },
  {
    id: 'PRC-RTL-07', mode: 'Retail', channel: 'Store', channelDetail: 'All stores',
    storeCodes: ALL_STORE_CODES,
    styleName: 'Shark Tooth Necklace', itemNumber: 'AI-9105',
    category: 'Beach Accessories', productLine: 'Own label', colorSize: 'Cord / OS',
    quantity: 1, basePrice: 9.99, marginComponent: 0, discountPct: 0,
    autoCharge: 0, unitCost: 1.85,
    validFrom: iso(-300), validTo: iso(180),
  },
  {
    id: 'PRC-RTL-08', mode: 'Retail', channel: 'Ecommerce', channelDetail: 'alvinsisland.com',
    storeCodes: [ECOM_CODE],
    styleName: 'Foam Boogie Board 41"', itemNumber: 'AI-9310',
    category: 'Beach Accessories', productLine: 'Own label', colorSize: 'Teal / 41in',
    quantity: 1, basePrice: 29.99, marginComponent: 0, discountPct: 0,
    autoCharge: 4.95, unitCost: 8.2,
    validFrom: iso(-180), validTo: iso(180),
  },
  {
    id: 'PRC-RTL-09', mode: 'Retail', channel: 'Store', channelDetail: 'Clearance / outlet stores',
    storeCodes: ['ST-FWB', 'ST-DAY'],
    styleName: 'Paradise Dress Tunic', itemNumber: 'AI-8104',
    category: 'Tees & Tanks', productLine: 'Own label', colorSize: 'Turquoise / M',
    quantity: 1, basePrice: 29.99, marginComponent: -6.0, discountPct: 25,
    discount: {
      name: 'Outlet Everyday Price', type: 'Line',
      validFrom: iso(-240), validTo: iso(120),
    },
    autoCharge: 0, unitCost: 8.9,
    validFrom: iso(-240), validTo: iso(120),
  },
  {
    id: 'PRC-RTL-10', mode: 'Retail', channel: 'Ecommerce', channelDetail: 'alvinsisland.com',
    storeCodes: [ECOM_CODE],
    styleName: "O'Neill Reactor 2mm Rash Guard", itemNumber: 'ON-1174',
    category: 'Dry-Fit', productLine: 'Branded', colorSize: 'Graphite / M',
    quantity: 1, basePrice: 39.99, marginComponent: 0, discountPct: 15,
    discount: {
      name: 'Watersports Site Promo', type: 'Line',
      validFrom: iso(-6), validTo: iso(13),
    },
    autoCharge: 0, unitCost: 20.0, mapFloor: 35.99, mapWaiverUntil: iso(13),
    validFrom: iso(-6), validTo: iso(13),
  },
  {
    id: 'PRC-RTL-11', mode: 'Retail', channel: 'Store', channelDetail: 'All stores',
    storeCodes: ALL_STORE_CODES,
    styleName: "Alvin's Island Logo Trucker Cap", itemNumber: 'AI-5540',
    category: 'Headwear', productLine: 'Own label', colorSize: 'Navy-Gold / OS',
    quantity: 1, basePrice: 19.99, marginComponent: 0, discountPct: 20,
    discount: {
      name: 'Cap & Tee Bundle', type: 'Mix and match',
      validFrom: iso(-45), validTo: iso(35),
    },
    autoCharge: 0, unitCost: 4.75,
    validFrom: iso(-45), validTo: iso(35),
  },
  {
    id: 'PRC-RTL-12', mode: 'Retail', channel: 'Store', channelDetail: 'Resort & kiosk locations',
    storeCodes: ['ST-DEST', 'ST-PNS', 'ST-GSH', 'ST-ORB'],
    styleName: 'Gulf Shores Dolphin Dry-Fit Tee', itemNumber: 'AI-6155',
    category: 'Dry-Fit', productLine: 'Own label', colorSize: 'Heather Blue / L',
    quantity: 1, basePrice: 24.99, marginComponent: 3.0, discountPct: 0,
    autoCharge: 0, unitCost: 6.1,
    validFrom: iso(-150), validTo: iso(120),
  },

  // ── Vendor programs · brand-set MAP floors and co-op funding ──
  {
    id: 'PRC-VEN-01', mode: 'Vendor', channel: 'Vendor Program',
    channelDetail: 'Quiksilver · Core Surf Program',
    vendorAccount: 'V-2041', vendorProgram: 'Core Surf Program',
    styleName: 'Quiksilver Everyday Surfwash Boardshort 19"', itemNumber: 'QS-4412',
    category: 'Boardshorts', productLine: 'Branded', colorSize: 'Sapphire / 32',
    quantity: 144, basePrice: 49.99, marginComponent: 0, discountPct: 25,
    discount: {
      name: 'Season-End Co-op Markdown', type: 'Threshold',
      validFrom: iso(-14), validTo: iso(20),
      tiers: [
        { label: '$0 – $4,999 program value', discountPct: 15 },
        { label: '$5,000 – $14,999 program value', discountPct: 25 },
        { label: '$15,000+ program value', discountPct: 30 },
      ],
    },
    autoCharge: 0, unitCost: 25.0, vendorAllowancePct: 12,
    mapFloor: 44.99, mapWaiverUntil: iso(20),
    validFrom: iso(-14), validTo: iso(20),
  },
  {
    id: 'PRC-VEN-02', mode: 'Vendor', channel: 'Vendor Program',
    channelDetail: 'Quiksilver · Core Surf Program',
    vendorAccount: 'V-2041', vendorProgram: 'Core Surf Program',
    styleName: 'Quiksilver Original Boardshort Tee', itemNumber: 'QS-4090',
    category: 'Tees & Tanks', productLine: 'Branded', colorSize: 'White / M',
    quantity: 288, basePrice: 24.99, marginComponent: 0, discountPct: 0,
    autoCharge: 0, unitCost: 12.5, mapFloor: 22.49,
    validFrom: iso(-240), validTo: iso(125),
  },
  {
    id: 'PRC-VEN-03', mode: 'Vendor', channel: 'Vendor Program',
    channelDetail: 'Roxy · Womens Swim Program',
    vendorAccount: 'V-2044', vendorProgram: 'Womens Swim Program',
    styleName: 'Roxy Beach Classics Tie-Side Bottom', itemNumber: 'RX-2208',
    category: 'Swimwear', productLine: 'Branded', colorSize: 'Coral / M',
    quantity: 216, basePrice: 29.99, marginComponent: 0, discountPct: 30,
    discount: {
      name: 'Swim Season Flush', type: 'Quantity',
      validFrom: iso(-8), validTo: iso(30),
      tiers: [
        { label: '1 – 99 units', discountPct: 20 },
        { label: '100 – 249 units', discountPct: 30 },
        { label: '250+ units', discountPct: 35 },
      ],
    },
    autoCharge: 0, unitCost: 15.0, vendorAllowancePct: 10, mapFloor: 26.99,
    validFrom: iso(-8), validTo: iso(30),
  },
  {
    id: 'PRC-VEN-04', mode: 'Vendor', channel: 'Vendor Program',
    channelDetail: 'Volcom · Womens Swim Program',
    vendorAccount: 'V-2052', vendorProgram: 'Womens Swim Program',
    styleName: 'Volcom Pucker Up Cheekini Bottom', itemNumber: 'VL-3390',
    category: 'Swimwear', productLine: 'Branded', colorSize: 'Black / S',
    quantity: 96, basePrice: 55.0, marginComponent: 0, discountPct: 0,
    autoCharge: 0, unitCost: 27.5, mapFloor: 49.5,
    validFrom: iso(-210), validTo: iso(155),
  },
  {
    id: 'PRC-VEN-05', mode: 'Vendor', channel: 'Vendor Program',
    channelDetail: "O'Neill · Watersports Program",
    vendorAccount: 'V-2068', vendorProgram: 'Watersports Program',
    styleName: "O'Neill Reactor 2mm Rash Guard", itemNumber: 'ON-1174',
    category: 'Dry-Fit', productLine: 'Branded', colorSize: 'Graphite / M',
    quantity: 120, basePrice: 39.99, marginComponent: 0, discountPct: 15,
    discount: {
      name: 'Watersports Co-op Window', type: 'Line',
      validFrom: iso(-6), validTo: iso(13),
    },
    autoCharge: 0, unitCost: 20.0, vendorAllowancePct: 8,
    mapFloor: 35.99, mapWaiverUntil: iso(13),
    validFrom: iso(-6), validTo: iso(13),
  },
  {
    id: 'PRC-VEN-06', mode: 'Vendor', channel: 'Vendor Program',
    channelDetail: 'Rip Curl · Core Surf Program',
    vendorAccount: 'V-2075', vendorProgram: 'Core Surf Program',
    styleName: 'Rip Curl Icons Surflite Boardshort', itemNumber: 'RC-5521',
    category: 'Boardshorts', productLine: 'Branded', colorSize: 'Navy / 34',
    quantity: 84, basePrice: 54.99, marginComponent: 0, discountPct: 20,
    discount: {
      name: 'Surf Carryover Markdown', type: 'Line',
      validFrom: iso(-30), validTo: iso(25),
    },
    // The vendor's approved markdown window closed nine days ago and the
    // price never went back up — this is the demo's compliance finding.
    autoCharge: 0, unitCost: 27.5, mapFloor: 49.49, mapWaiverUntil: iso(-9),
    validFrom: iso(-30), validTo: iso(25),
  },
  {
    id: 'PRC-VEN-07', mode: 'Vendor', channel: 'Vendor Program',
    channelDetail: 'Vans · Footwear Program',
    vendorAccount: 'V-2090', vendorProgram: 'Footwear Program',
    styleName: 'Vans Classic Slip-On', itemNumber: 'VN-8801',
    category: 'Footwear', productLine: 'Branded', colorSize: 'Black-White / 9',
    quantity: 60, basePrice: 59.99, marginComponent: 0, discountPct: 0,
    autoCharge: 0, unitCost: 32.0, mapFloor: 54.99,
    validFrom: iso(-210), validTo: iso(150),
  },
  {
    id: 'PRC-VEN-08', mode: 'Vendor', channel: 'Vendor Program',
    channelDetail: 'Fox Racing · Headwear Program',
    vendorAccount: 'V-2103', vendorProgram: 'Headwear Program',
    styleName: 'Fox Racing Legacy Moth Snapback', itemNumber: 'FX-6612',
    category: 'Headwear', productLine: 'Branded', colorSize: 'Black / OS',
    quantity: 144, basePrice: 27.99, marginComponent: 0, discountPct: 10,
    discount: {
      name: 'Headwear Program Allowance', type: 'Quantity',
      validFrom: iso(-90), validTo: iso(60),
      tiers: [
        { label: '1 – 71 units', discountPct: 0 },
        { label: '72 – 143 units', discountPct: 5 },
        { label: '144+ units', discountPct: 10 },
      ],
    },
    autoCharge: 0, unitCost: 14.0, vendorAllowancePct: 5, mapFloor: 24.99,
    validFrom: iso(-90), validTo: iso(60),
  },
]

// ═══════════════════════════════════════════════════════════════════════
// 3 · Price history audit
// ═══════════════════════════════════════════════════════════════════════
// A price scope is whatever the price is set against: the retail list price,
// one channel, one store, or a vendor program's MAP schedule.

export const PRICE_HISTORY: PriceHistoryRecord[] = [
  {
    productKey: 'QS-4412|Sapphire / 32|RETAIL',
    styleName: 'Quiksilver Everyday Surfwash Boardshort 19"', itemNumber: 'QS-4412',
    category: 'Boardshorts', productLine: 'Branded', colorSize: 'Sapphire / 32',
    scopeId: 'RETAIL', scopeName: 'Retail list price (all channels)',
    entries: [
      { id: 'PH-1-4', price: 39.99, activeFrom: iso(-14), activeTo: null, changedBy: 'Pricing Agent', changeType: 'Markdown', note: 'Season-end co-op markdown · 20%, vendor-funded at 12%' },
      { id: 'PH-1-3', price: 49.99, activeFrom: iso(-104), activeTo: iso(-15), changedBy: 'R. Deleon', changeType: 'Season set', note: 'Peak Summer program price' },
      { id: 'PH-1-2', price: 47.99, activeFrom: iso(-196), activeTo: iso(-105), changedBy: 'R. Deleon', changeType: 'Season set', note: 'Spring Break program price' },
      { id: 'PH-1-1', price: 45.99, activeFrom: iso(-380), activeTo: iso(-197), changedBy: 'System', changeType: 'Initial', note: 'Program introduction' },
    ],
  },
  {
    productKey: 'QS-4412|Sapphire / 32|VP-QUIK',
    styleName: 'Quiksilver Everyday Surfwash Boardshort 19"', itemNumber: 'QS-4412',
    category: 'Boardshorts', productLine: 'Branded', colorSize: 'Sapphire / 32',
    scopeId: 'VP-QUIK', scopeName: 'Quiksilver · Core Surf Program (MAP)',
    entries: [
      { id: 'PH-2-3', price: 44.99, activeFrom: iso(-104), activeTo: null, changedBy: 'Vendor feed', changeType: 'MAP update', note: `Markdown waiver active to ${iso(20)} — pricing below MAP is approved` },
      { id: 'PH-2-2', price: 42.99, activeFrom: iso(-196), activeTo: iso(-105), changedBy: 'Vendor feed', changeType: 'MAP update', note: 'Spring Break MAP schedule' },
      { id: 'PH-2-1', price: 41.99, activeFrom: iso(-380), activeTo: iso(-197), changedBy: 'System', changeType: 'Initial', note: 'Program MAP at introduction' },
    ],
  },
  {
    productKey: 'RC-5521|Navy / 34|VP-RIPC',
    styleName: 'Rip Curl Icons Surflite Boardshort', itemNumber: 'RC-5521',
    category: 'Boardshorts', productLine: 'Branded', colorSize: 'Navy / 34',
    scopeId: 'VP-RIPC', scopeName: 'Rip Curl · Core Surf Program (MAP)',
    entries: [
      { id: 'PH-3-3', price: 49.49, activeFrom: iso(-8), activeTo: null, changedBy: 'Vendor feed', changeType: 'MAP update', note: `Markdown waiver expired ${iso(-9)} — MAP is back in force at $49.49` },
      { id: 'PH-3-2', price: 49.49, activeFrom: iso(-30), activeTo: iso(-9), changedBy: 'Vendor feed', changeType: 'MAP update', note: 'Carryover markdown waiver granted for 21 days' },
      { id: 'PH-3-1', price: 49.49, activeFrom: iso(-360), activeTo: iso(-31), changedBy: 'System', changeType: 'Initial', note: 'Program MAP at introduction' },
    ],
  },
  {
    productKey: 'AI-2255|Aqua / M|RETAIL',
    styleName: 'Ladies Tropical Palm One-Piece', itemNumber: 'AI-2255',
    category: 'Swimwear', productLine: 'Own label', colorSize: 'Aqua / M',
    scopeId: 'RETAIL', scopeName: 'Retail list price (all channels)',
    entries: [
      { id: 'PH-4-3', price: 44.99, activeFrom: iso(-150), activeTo: null, changedBy: 'R. Deleon', changeType: 'Season set', note: 'Peak Summer list price' },
      { id: 'PH-4-2', price: 42.99, activeFrom: iso(-260), activeTo: iso(-151), changedBy: 'R. Deleon', changeType: 'Season set', note: 'Spring Break list price' },
      { id: 'PH-4-1', price: 39.99, activeFrom: iso(-330), activeTo: iso(-261), changedBy: 'System', changeType: 'Initial', note: 'Style introduction' },
    ],
  },
  {
    productKey: 'AI-2255|Aqua / M|ECOM',
    styleName: 'Ladies Tropical Palm One-Piece', itemNumber: 'AI-2255',
    category: 'Swimwear', productLine: 'Own label', colorSize: 'Aqua / M',
    scopeId: 'ECOM', scopeName: 'alvinsisland.com',
    entries: [
      { id: 'PH-5-4', price: 26.99, activeFrom: iso(-11), activeTo: null, changedBy: 'Pricing Agent', changeType: 'Markdown', note: 'End-of-season swim clearance · 40% — still clears 50% margin' },
      { id: 'PH-5-3', price: 33.74, activeFrom: iso(-40), activeTo: iso(-12), changedBy: 'Pricing Agent', changeType: 'Markdown', note: 'Wave 1 · 25%' },
      { id: 'PH-5-2', price: 44.99, activeFrom: iso(-150), activeTo: iso(-41), changedBy: 'R. Deleon', changeType: 'Season set', note: 'Peak Summer list, matched to retail' },
      { id: 'PH-5-1', price: 42.99, activeFrom: iso(-330), activeTo: iso(-151), changedBy: 'System', changeType: 'Initial', note: 'Style introduction' },
    ],
  },
  {
    productKey: 'AI-6011|White / L|RETAIL',
    styleName: 'Panama City Beach Sunset Tee', itemNumber: 'AI-6011',
    category: 'Souvenirs', productLine: 'Own label', colorSize: 'White / L',
    scopeId: 'RETAIL', scopeName: 'Retail list price (all channels)',
    entries: [
      { id: 'PH-6-3', price: 16.99, activeFrom: iso(-190), activeTo: null, changedBy: 'R. Deleon', changeType: 'Season set', note: 'Season price — held through the summer' },
      { id: 'PH-6-2', price: 15.99, activeFrom: iso(-420), activeTo: iso(-191), changedBy: 'R. Deleon', changeType: 'Season set', note: 'Prior season price' },
      { id: 'PH-6-1', price: 14.99, activeFrom: iso(-600), activeTo: iso(-421), changedBy: 'System', changeType: 'Initial', note: 'Style introduction' },
    ],
  },
  {
    productKey: 'AI-6011|White / L|ST-PCB',
    styleName: 'Panama City Beach Sunset Tee', itemNumber: 'AI-6011',
    category: 'Souvenirs', productLine: 'Own label', colorSize: 'White / L',
    scopeId: 'ST-PCB', scopeName: 'Panama City Beach, FL store',
    entries: [
      { id: 'PH-7-3', price: 11.89, activeFrom: iso(-60), activeTo: null, changedBy: 'Pricing Agent', changeType: 'Agent reprice', note: 'Souvenir tee multi-buy · effective price at 2 units' },
      { id: 'PH-7-2', price: 16.99, activeFrom: iso(-190), activeTo: iso(-61), changedBy: 'R. Deleon', changeType: 'Season set', note: 'Matched to retail list' },
      { id: 'PH-7-1', price: 15.99, activeFrom: iso(-420), activeTo: iso(-191), changedBy: 'System', changeType: 'Initial', note: 'Home-city style, store-specific from launch' },
    ],
  },
  {
    productKey: 'AI-7702|Navy / L|RETAIL',
    styleName: 'Destin, FL Sun & Stripes Hoodie', itemNumber: 'AI-7702',
    category: 'Hoodies & Fleece', productLine: 'Own label', colorSize: 'Navy / L',
    scopeId: 'RETAIL', scopeName: 'Retail list price (all channels)',
    entries: [
      { id: 'PH-8-3', price: 39.99, activeFrom: iso(-3), activeTo: null, changedBy: 'R. Deleon', changeType: 'Season set', note: 'Post-Labor Day price hold — fleece demand rises into snowbird season' },
      { id: 'PH-8-2', price: 36.99, activeFrom: iso(-96), activeTo: iso(-4), changedBy: 'Pricing Agent', changeType: 'Markdown', note: 'Peak Summer promo price' },
      { id: 'PH-8-1', price: 34.99, activeFrom: iso(-300), activeTo: iso(-97), changedBy: 'System', changeType: 'Initial', note: 'Style introduction' },
    ],
  },
]

// ═══════════════════════════════════════════════════════════════════════
// 4 · AI recommendations
// ═══════════════════════════════════════════════════════════════════════

export const RECOMMENDATIONS: Recommendation[] = [
  // ── Retail ──
  {
    id: 'REC-RTL-1', audience: 'Retail', kind: 'Markdown timing',
    title: 'Stage the swim clearance in three waves, own-label first',
    detail:
      'Own-label swim still clears 50% margin at a 40% cut; branded swim does not. Run the waves on own-label and hold branded at MAP until a vendor waiver is in hand.',
    bullets: ['Week 1 · 25% — own-label only', 'Week 3 · 40% — own-label only', 'Week 5 · 55% — add branded once waivers land'],
    impact: '+$128K margin vs. a flat 50% cut across all swim', confidence: 'High', status: 'Open',
  },
  {
    id: 'REC-RTL-2', audience: 'Retail', kind: 'Delay markdown',
    title: 'Hold the Destin hoodie at $39.99 through October',
    detail:
      'Fleece sell-through is 58% against a 52% target for this point in the season, and snowbird traffic builds from October. Marking it down now gives away a price the market is paying.',
    impact: 'Protects ~$61K of full-price revenue', confidence: 'High', status: 'Open',
  },
  {
    id: 'REC-RTL-3', audience: 'Retail', kind: 'Increase price',
    title: 'Raise own-label souvenir tees from $16.99 to $18.99',
    detail:
      'Souvenir tees sell on impulse to visitors who are not comparison-shopping, and nearby kiosks list comparable tees at $19.99. Unit velocity has been flat across two price moves, which suggests headroom.',
    impact: '+$214K estimated annual margin', confidence: 'High', status: 'Open',
  },
  {
    id: 'REC-RTL-4', audience: 'Retail', kind: 'Store-specific pricing',
    title: 'Carry the $3 kiosk uplift across all resort locations',
    detail:
      'Resort and kiosk locations already price own-label dry-fit $3 above the estate with no measurable conversion loss. Extend the uplift to headwear and beach accessories at the same locations.',
    impact: '+$47K margin per season', confidence: 'Medium', status: 'Open',
  },
  {
    id: 'REC-RTL-5', audience: 'Retail', kind: 'Inventory-driven',
    title: 'Boardshorts are at 14 weeks of supply going into the off-season',
    detail: 'Gulf Coast boardshort demand falls off sharply after Labor Day. Options, in order of margin impact:',
    bullets: [
      'Transfer to South Florida stores, where the season runs into November',
      'Request a co-op markdown extension before cutting price',
      'Mark down 25% only once the MAP waiver is confirmed',
    ],
    impact: 'Frees ~$186K of working capital', confidence: 'High', status: 'Open',
  },

  // ── Vendor programs ──
  {
    id: 'REC-VEN-1', audience: 'Vendor', kind: 'MAP compliance',
    title: 'Three lines price below MAP with no active waiver',
    detail:
      'Two Roxy tie-side records (store and program) and the Rip Curl Surflite are below their vendor MAP floors. The Rip Curl waiver expired and the price was never restored.',
    bullets: ['Restore Rip Curl Surflite to the $49.49 floor', 'Request a Roxy waiver or pull the Panhandle flush back to $26.99'],
    impact: 'Clears 3 open agreement breaches', confidence: 'High', status: 'Open',
  },
  {
    id: 'REC-VEN-2', audience: 'Vendor', kind: 'Vendor terms',
    title: 'Negotiate co-op markdown funding into the Rip Curl program',
    detail:
      'Quiksilver funds 12% of cost on approved markdown windows and O’Neill funds 8%. Rip Curl funds nothing, which is why the same 20% markdown earns 8 points less margin there than on comparable Quiksilver product.',
    impact: '+$96K if Rip Curl matches Quiksilver at 12%', confidence: 'Medium', status: 'Open',
  },
  {
    id: 'REC-VEN-3', audience: 'Vendor', kind: 'Margin protection',
    title: 'Rip Curl Surflite at 20% off earns 37.5% — under the vendor floor',
    detail:
      'The line is below the 38% vendor margin floor and below MAP at the same time. Rather than deepening the cut, take it back to the floor and open a funded window.',
    bullets: ['Restore to MAP and close the unfunded markdown', 'Counter with a vendor-funded window before the next flush'],
    impact: 'Protects 8 pts of margin across 84 units', confidence: 'High', status: 'Open',
  },
  {
    id: 'REC-VEN-4', audience: 'Vendor', kind: 'Product mix',
    title: 'Shift the spring pre-book toward own-label boardshorts',
    detail:
      'Branded boardshorts carry a MAP floor and 45–50% margin. Own-label equivalents run near 68% and can be discounted freely for spring-break traffic.',
    bullets: ['Pre-book 60% branded / 40% own-label instead of 100% branded'],
    impact: '+9.1 pts blended margin on the category', confidence: 'Medium', status: 'Open',
  },
]

export const RETAIL_KPIS: KpiMonitor[] = [
  { label: 'Gross margin %', value: '61.8%', trend: 'up' },
  { label: 'Full-price sell-through', value: '54%', trend: 'up' },
  { label: 'Markdown %', value: '27%', trend: 'down' },
  { label: 'Promotion ROI', value: '2.9x', trend: 'flat' },
  { label: 'Weeks of supply', value: '11.2', trend: 'down' },
  { label: 'GMROI', value: '3.4', trend: 'up' },
  { label: 'Units per transaction', value: '2.6', trend: 'up' },
  { label: 'Store conversion', value: '38%', trend: 'flat' },
  { label: 'Own-label mix', value: '57%', trend: 'up' },
]

export const VENDOR_KPIS: KpiMonitor[] = [
  { label: 'Margin by brand', value: '44.9% avg', trend: 'flat' },
  { label: 'Co-op funding captured', value: '$312K', trend: 'up' },
  { label: 'MAP compliance rate', value: '96.2%', trend: 'down' },
  { label: 'Average program discount', value: '14.2%', trend: 'up' },
  { label: 'Vendor allowance earned', value: '$208K', trend: 'up' },
  { label: 'Return-to-vendor rate', value: '3.4%', trend: 'flat' },
  { label: 'Program margin', value: '43.1%', trend: 'flat' },
  { label: 'Units per program', value: '1,180 avg', trend: 'up' },
  { label: 'Pre-book commitment', value: '$4.2M', trend: 'up' },
]

// category list for filters
export const CATEGORIES = [
  'Swimwear',
  'Boardshorts',
  'Tees & Tanks',
  'Hoodies & Fleece',
  'Dry-Fit',
  'Headwear',
  'Footwear',
  'Beach Accessories',
  'Souvenirs',
] as const

// ═══════════════════════════════════════════════════════════════════════
// 5 · Sales performance (seeded, deterministic)
// ═══════════════════════════════════════════════════════════════════════
// Unit sales are generated rather than listed, because the Price Updates page
// needs an arbitrary date window and 18 items x 11 locations x 200 days is not
// something to hand-write. The generator is seeded off (item, location, day),
// so it is fully reproducible — the same demo shows the same numbers twice —
// and any date range sums the same way every time.
//
// Shape of the curve: a per-item base rate at an average store, scaled by
// store size, by Gulf Coast seasonality (spring break, peak summer, the drop
// after Labor Day), and by day of week, with bounded noise on top.

/** Days of sales history available before AS_OF. */
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

/** Units/day for this item at an average store in peak season. */
const ITEM_BASE_RATE: Record<string, number> = {
  // own label — high volume, impulse purchases
  'AI-9105': 9.0, // Shark Tooth Necklace
  'AI-6011': 6.0, // PCB Sunset Tee
  'AI-6208': 5.2, // Gulf Shores Sunset Tank
  'AI-5540': 4.0, // Logo Trucker Cap
  'AI-9020': 3.0, // Sea Turtle Beach Towel
  'AI-6155': 2.5, // Gulf Shores Dry-Fit Tee
  'AI-8104': 2.0, // Paradise Dress Tunic
  'AI-9310': 1.5, // Foam Boogie Board
  'AI-2255': 1.4, // Ladies Tropical Palm One-Piece
  'AI-7702': 1.2, // Destin Sun & Stripes Hoodie
  // branded surf — lower velocity, higher ticket
  'QS-4090': 1.3, // Quiksilver Boardshort Tee
  'QS-4412': 1.0, // Quiksilver Everyday Boardshort
  'RX-2208': 0.9, // Roxy Tie-Side Bottom
  'VN-8801': 0.8, // Vans Classic Slip-On
  'FX-6612': 0.8, // Fox Racing Snapback
  'ON-1174': 0.6, // O'Neill Rash Guard
  'RC-5521': 0.6, // Rip Curl Surflite Boardshort
  'VL-3390': 0.5, // Volcom Cheekini Bottom
}

/** Relative size of each selling location. */
const LOCATION_WEIGHT: Record<string, number> = {
  'ST-PCB': 1.5,
  'ST-DEST': 1.3,
  'ST-GSH': 1.2,
  'ST-ORB': 1.1,
  'ST-CLW': 1.1,
  'ST-PNS': 1.0,
  'ST-DAY': 1.0,
  'ST-FWB': 0.9,
  'ST-MAD': 0.8,
  'ST-NAV': 0.7,
  ECOM: 2.2,
}

/**
 * Weeks of supply each item is carrying at the current rate. This is what
 * drives sell-through: boardshorts sitting on 14-16 weeks going into the
 * off-season are the demo's inventory problem, souvenir tees at 3-5 weeks are
 * the healthy comparison.
 */
const ITEM_COVER_WEEKS: Record<string, number> = {
  'AI-6011': 3,
  'AI-6208': 3.5,
  'AI-9105': 4,
  'AI-5540': 5,
  'AI-9020': 5,
  'AI-6155': 5,
  'AI-8104': 6,
  'AI-9310': 7,
  'VN-8801': 7,
  'AI-7702': 8,
  'QS-4090': 8,
  'FX-6612': 8,
  'AI-2255': 9,
  'ON-1174': 9,
  'VL-3390': 10,
  'RX-2208': 11,
  'QS-4412': 14,
  'RC-5521': 16,
}

/** Gulf Coast beach-retail seasonality, by calendar month. */
const SEASON_BY_MONTH = [
  0.35, // Jan
  0.45, // Feb
  0.95, // Mar — spring break
  0.85, // Apr
  1.0, // May
  1.3, // Jun
  1.4, // Jul — peak
  1.15, // Aug
  0.7, // Sep — falls away after Labor Day
  0.5, // Oct
  0.4, // Nov
  0.45, // Dec
]

/** Day-of-week uplift: beach retail is a weekend business. */
const DOW_FACTOR = [1.0, 0.85, 0.85, 0.9, 0.95, 1.15, 1.35] // Sun..Sat

function dayFactor(date: Date): number {
  return SEASON_BY_MONTH[date.getMonth()] * DOW_FACTOR[date.getDay()]
}

/** Units sold of one item at one location on one day. Deterministic. */
function unitsOnDay(itemNumber: string, location: string, date: Date): number {
  const base = ITEM_BASE_RATE[itemNumber]
  const weight = LOCATION_WEIGHT[location]
  if (base === undefined || weight === undefined) return 0
  const seed = hashStr(`${itemNumber}|${location}|${date.toISOString().slice(0, 10)}`)
  const noise = 0.7 + rand(seed) * 0.6
  return Math.round(base * weight * dayFactor(date) * noise)
}

/**
 * Weeks of supply is only meaningful against a *recent* run rate — a merchant
 * forecasts forward on how the item is selling now, not on a 90-day average
 * that still includes peak summer. 28 days is four whole weeks, so day-of-week
 * effects average out.
 */
export const RECENT_RATE_DAYS = 28

/** Mean daily units over the trailing RECENT_RATE_DAYS. */
function recentDailyRate(itemNumber: string, location: string): number {
  const end = new Date(AS_OF + 'T00:00:00').getTime()
  let total = 0
  for (let i = 0; i < RECENT_RATE_DAYS; i++) {
    total += unitsOnDay(itemNumber, location, new Date(end - i * MS_PER_DAY))
  }
  return total / RECENT_RATE_DAYS
}

/**
 * On-hand units at AS_OF, sized so the item carries its target weeks of supply
 * *at the recent run rate*. That keeps the grid, the weeks-of-supply figure and
 * the inventory recommendation telling the same story.
 */
function onHandAt(itemNumber: string, location: string): number {
  const cover = ITEM_COVER_WEEKS[itemNumber]
  if (cover === undefined || LOCATION_WEIGHT[location] === undefined) return 0
  return Math.round(recentDailyRate(itemNumber, location) * cover * 7)
}

/**
 * Weeks of supply left for an item across locations, measured on the trailing
 * run rate rather than on whatever window the user happens to be filtering to.
 */
export function coverWeeksFor(itemNumber: string, locations: string[]): number {
  let rate = 0
  let onHand = 0
  for (const loc of locations) {
    rate += recentDailyRate(itemNumber, loc)
    onHand += onHandAt(itemNumber, loc)
  }
  if (rate <= 0) return Infinity
  return onHand / (rate * 7)
}

/**
 * Sales performance for one item across a set of locations over a date window.
 * The window is clamped to the history that exists and never runs past AS_OF —
 * there are no future sales.
 */
export function performanceFor(
  itemNumber: string,
  locations: string[],
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
  for (const loc of locations) {
    for (let t = start; t <= end; t += MS_PER_DAY) {
      unitsSold += unitsOnDay(itemNumber, loc, new Date(t))
    }
  }
  const onHand = locations.reduce((sum, loc) => sum + onHandAt(itemNumber, loc), 0)
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
  const vendor = PRICING_SETUP.filter((l) => l.mode === 'Vendor')
  const failing = PRICING_SETUP.filter((l) => lineMarginPct(l) <= marginTarget)
  const breaches = PRICING_SETUP.filter((l) => lineBreachesMap(l, AS_OF))
  const ownLabel = PRICING_SETUP.filter((l) => l.productLine === 'Own label')
  const avg = (ls: PricingSetupLine[]) =>
    ls.length ? ls.reduce((s, l) => s + lineMarginPct(l), 0) / ls.length : 0

  // Blended sell-through over the trailing 90 days, across every location.
  const allLocs = LOCATIONS.map((l) => l.code)
  let sold = 0
  let available = 0
  for (const item of new Set(PRICING_SETUP.map((l) => l.itemNumber))) {
    const p = performanceFor(item, allLocs, iso(-90), AS_OF)
    sold += p.unitsSold
    available += p.unitsAvailable
  }
  const overallSellThrough = available > 0 ? (sold / available) * 100 : 0

  return [
    { label: 'As-of date', value: AS_OF },
    { label: 'Price overrides on file', value: String(PRICE_OVERRIDES.length) },
    { label: 'Active pricing setup lines', value: `${PRICING_SETUP.length} (${retail.length} retail · ${vendor.length} vendor)` },
    { label: `Lines at or below ${marginTarget}% margin`, value: `${failing.length} of ${PRICING_SETUP.length}` },
    { label: 'MAP breaches without an active waiver', value: String(breaches.length) },
    { label: 'Average margin · own label', value: `${avg(ownLabel).toFixed(1)}%` },
    { label: 'Average margin · branded', value: `${avg(PRICING_SETUP.filter((l) => l.productLine === 'Branded')).toFixed(1)}%` },
    { label: 'Price history records', value: `${PRICE_HISTORY.length} across ${new Set(PRICE_HISTORY.map((r) => r.scopeId)).size} price scopes` },
    { label: 'Store estate', value: `${STORES.length} locations · ${STORES.filter((s) => s.state === 'FL').length} FL, ${STORES.filter((s) => s.state === 'AL').length} AL` },
    { label: 'Vendor programs', value: String(VENDOR_PROGRAMS.length) },
    { label: 'Sales history generated', value: `${PERFORMANCE_DAYS} days x ${LOCATIONS.length} locations, seeded` },
    {
      label: 'Trailing 90-day sell-through (all locations)',
      value: `${overallSellThrough.toFixed(1)}%`,
    },
  ]
}
