// ── Pricing & Margin Workspace · RIMEX dataset ───────────────────────────
//
// Single source of truth for the RIMEX build. Every figure is synthetic.
//
// Wheel assemblies (TSR-63-4400, TSR-57-4000, TSR-49-3600) and rim components
// (LR-63-HD, BSB-57) take name, list price and cost from ./items.ts — the
// same master the Price Simulator reads — and assertMasterConsistency() below
// throws if any page would show a different cost or list price. Their
// quantities are wheel volumes (tens of units, not thousands).
//
// The rest of the book (service kits, steel hardware) was derived from the
// Bluestem dataset as a rename: same prices, costs, discounts and offsets.
//
//   · Service kits (SK-*) — RIMEX-engineered O-ring, bead-seat, valve and rim
//     rebuild kits built at Surrey. ~38–44% list margin; a 15% promotion
//     still clears 25%.
//   · Wheels & hardware — TSR assemblies, rim components and steel hardware.
//     Thinner: a 15% allowance on an assembly or a routine 10% deal on
//     hardware takes them under the floor. The mill's program can fund part
//     of a promotional price on steel items (the "mill program share").
//
// Beats: 6 of 20 lines fail 25%, all wheels & hardware; 3 price below floor
// with no active promotion — the headline is Keystone Ridge's 63" TSR
// assembly, whose Q3 allowance outlived TP-2026-118 by nine days.
//
// Two books: dealers (mining, national accounts, ag and online parts) and
// fleet contracts (mine sites, quarries, haulage and earthworks contractors).
// Every date is derived from AS_OF in ./config.ts. RIMEX is the tenant; every
// dealer, fleet customer, contract and rep below is fictional.

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
import { simulator } from './simulator'
import { MASTER, WHEELS_LINE, wheel } from './items'

// Wheels and rim components take list price and cost from the item master.
const T63 = MASTER['TSR-63-4400']
const T57 = MASTER['TSR-57-4000']
const T49 = MASTER['TSR-49-3600']
const LR63 = MASTER['LR-63-HD']
const BSB57 = MASTER['BSB-57']

const iso = makeIso(AS_OF)

// ═══════════════════════════════════════════════════════════════════════
// 0 · Retail customers
// ═══════════════════════════════════════════════════════════════════════

const CUSTOMERS: CustomerLocation[] = [
  { code: 'C10001', name: 'Thompson Valley Equipment', city: 'Kamloops', state: 'BC', segment: 'SEG-MIN' },
  { code: 'C10002', name: 'Northern Shield Tire & Wheel', city: 'Sudbury', state: 'ON', segment: 'SEG-MIN' },
  { code: 'C10003', name: 'Iron Range OTR Services', city: 'Hibbing', state: 'MN', segment: 'SEG-MIN' },
  { code: 'C10006', name: 'Great Basin Mining Supply', city: 'Elko', state: 'NV', segment: 'SEG-MIN' },
  { code: 'C10005', name: 'Sonoran OTR Supply', city: 'Tucson', state: 'AZ', segment: 'SEG-MIN' },
  { code: 'C10007', name: 'Westline Equipment Group', city: 'Abbotsford', state: 'BC', segment: 'SEG-NATL' },
  { code: 'C10008', name: 'Continental Earthmoving Supply', city: 'Spokane', state: 'WA', segment: 'SEG-NATL' },
  { code: 'C10009', name: 'Quill Lake Ag Equipment', city: 'Saskatoon', state: 'SK', segment: 'SEG-AG' },
  { code: 'C10010', name: 'Sheyenne Ag Supply', city: 'Fargo', state: 'ND', segment: 'SEG-AG' },
  { code: 'C10026', name: 'OTR PartsHub', city: 'Calgary', state: 'AB', segment: 'SEG-WEB' },
  { code: 'C10027', name: 'RimLine Online', city: 'Boise', state: 'ID', segment: 'SEG-WEB' },
]

const SEGMENTS: { code: string; name: string }[] = [
  { code: 'SEG-MIN', name: 'Mining dealers' },
  { code: 'SEG-NATL', name: 'National accounts' },
  { code: 'SEG-AG', name: 'Ag dealers' },
  { code: 'SEG-WEB', name: 'Online parts' },
]

const inSegment = (seg: string) => CUSTOMERS.filter((c) => c.segment === seg).map((c) => c.code)
const MINING = inSegment('SEG-MIN')
const AG = inSegment('SEG-AG')
const ONLINE = inSegment('SEG-WEB')

/** Fleet contracts — mine sites, quarries, haulage and earthworks contractors. */
const FOODSERVICE_CONTRACTS = [
  { account: 'C10011', customer: 'Boulder Ridge Mining Co.', contract: 'FY26 Wheel Service Supply Agreement' },
  { account: 'C10012', customer: 'Keystone Ridge Copper', contract: 'Haul Fleet Wheel Program' },
  { account: 'C10014', customer: 'North Shore Aggregates', contract: 'Winter Shutdown Program' },
  { account: 'C10016', customer: 'Ashcroft Contract Haulage', contract: 'Contract Haulage Agreement' },
  { account: 'C10021', customer: 'Granite Peak Quarries', contract: 'Quarry Fleet Agreement' },
  { account: 'C10037', customer: 'Cedar Creek Earthworks', contract: 'Season Earthworks Agreement' },
  { account: 'C10038', customer: 'Tamarack Basin Coal', contract: 'Mine Supply Contract' },
] as const

// ═══════════════════════════════════════════════════════════════════════
// 1 · Price overrides (sales-order line audit trail)
// ═══════════════════════════════════════════════════════════════════════
// Order lines where a rep typed over the system price. Wheel hardware in a
// dealer price group carries a price floor, so the audit can separate "thin
// margin" from "below the floor with no promotion behind it" — two overrides
// sit thin but exactly at the floor, which is the distinction the floor
// column exists to draw.

const EMAIL = (name: string) => `${name.toLowerCase().replace(' ', '.')}@rimex.com`

const PRICE_OVERRIDES: PriceOverride[] = [
  {
    id: 'OVR-001', orderNumber: 'SO-50812', orderDate: iso(-2), cases: 8,
    channel: 'Mining Dealer', customer: 'Northern Shield Tire & Wheel',
    ...wheel('TSR-49-3600'),
    unitCost: T49.cost, originalPrice: T49.list, overridePrice: 10980, floorPrice: 11970,
    reasonCode: 'Promo price overlap', overriddenBy: 'Mike Rennick', overriddenByEmail: EMAIL('Mike Rennick'),
  },
  {
    id: 'OVR-002', orderNumber: 'SO-50797', orderDate: iso(-3), cases: 168,
    channel: 'Fleet Contract', customer: 'Tamarack Basin Coal',
    itemName: 'Spacer Ring Set 33 in', itemNumber: 'HW-SPC-33',
    category: 'Wheel hardware', productLine: WHEELS_LINE, pack: '4-pc set',
    unitCost: 13.5, originalPrice: 19.0, overridePrice: 17.5, floorPrice: 17.1,
    reasonCode: 'Volume deal', overriddenBy: 'Arjun Sandhu', overriddenByEmail: EMAIL('Arjun Sandhu'),
  },
  {
    id: 'OVR-003', orderNumber: 'SO-50771', orderDate: iso(-5), cases: 12,
    channel: 'National Account', customer: 'Westline Equipment Group',
    ...wheel('TSR-57-4000'),
    unitCost: T57.cost, originalPrice: T57.list, overridePrice: 17676, floorPrice: 17676,
    reasonCode: 'Competitive match', overriddenBy: 'Claire Fournier', overriddenByEmail: EMAIL('Claire Fournier'),
  },
  {
    id: 'OVR-004', orderNumber: 'SO-50744', orderDate: iso(-7), cases: 120,
    channel: 'Mining Dealer', customer: 'Thompson Valley Equipment',
    itemName: 'Bead Seat Seal Kit 49 in', itemNumber: 'SK-BSS-49',
    category: 'Seal kits', productLine: 'Service kits', pack: 'seal + 2 O-rings',
    unitCost: 17.5, originalPrice: 29.6, overridePrice: 25.9,
    reasonCode: 'Aged stock / open box', overriddenBy: 'Arjun Sandhu', overriddenByEmail: EMAIL('Arjun Sandhu'),
  },
  {
    id: 'OVR-005', orderNumber: 'SO-50718', orderDate: iso(-9), cases: 6,
    channel: 'Fleet Contract', customer: 'Keystone Ridge Copper',
    ...wheel('TSR-63-4400'),
    unitCost: T63.cost, originalPrice: T63.list, overridePrice: 20435, floorPrice: 22388,
    reasonCode: 'Contract price not updated', overriddenBy: 'Mike Rennick', overriddenByEmail: EMAIL('Mike Rennick'),
  },
  {
    id: 'OVR-006', orderNumber: 'SO-50690', orderDate: iso(-11), cases: 96,
    channel: 'Online Parts', customer: 'OTR PartsHub',
    itemName: 'Valve Service Kit OTR', itemNumber: 'SK-VLV-OTR',
    category: 'Valve & inflation', productLine: 'Service kits', pack: 'core, cap, stem',
    unitCost: 14.7, originalPrice: 26.4, overridePrice: 22.0,
    reasonCode: 'Volume deal', overriddenBy: 'Claire Fournier', overriddenByEmail: EMAIL('Claire Fournier'),
  },
  {
    id: 'OVR-007', orderNumber: 'SO-50655', orderDate: iso(-13), cases: 168,
    channel: 'Fleet Contract', customer: 'Ashcroft Contract Haulage',
    itemName: 'Dual-Wheel Clamp Set HD', itemNumber: 'HW-DCL-HD',
    category: 'Wheel hardware', productLine: WHEELS_LINE, pack: '8-pc set',
    unitCost: 19.4, originalPrice: 27.2, overridePrice: 23.5, floorPrice: 24.5,
    reasonCode: 'Aged stock / open box', overriddenBy: 'Ben Tran', overriddenByEmail: EMAIL('Ben Tran'),
  },
  {
    id: 'OVR-008', orderNumber: 'SO-50631', orderDate: iso(-16), cases: 60,
    channel: 'Ag Dealer', customer: 'Quill Lake Ag Equipment',
    itemName: 'Rim Bolt Set 33 in', itemNumber: 'HW-BLT-33',
    category: 'Wheel hardware', productLine: WHEELS_LINE, pack: '16-pc set',
    unitCost: 19.6, originalPrice: 30.0, overridePrice: 27.0,
    reasonCode: 'Competitive match', overriddenBy: 'Arjun Sandhu', overriddenByEmail: EMAIL('Arjun Sandhu'),
  },
  {
    id: 'OVR-009', orderNumber: 'SO-50602', orderDate: iso(-19), cases: 6,
    channel: 'Mining Dealer', customer: 'Sonoran OTR Supply',
    ...wheel('BSB-57'),
    unitCost: BSB57.cost, originalPrice: BSB57.list, overridePrice: 3080, floorPrice: 3132,
    reasonCode: 'Promo price overlap', overriddenBy: 'Sofia Marchetti', overriddenByEmail: EMAIL('Sofia Marchetti'),
  },
  {
    id: 'OVR-010', orderNumber: 'SO-50577', orderDate: iso(-23), cases: 140,
    channel: 'National Account', customer: 'Continental Earthmoving Supply',
    itemName: 'Rim Rebuild Kit 25 in', itemNumber: 'SK-RBL-25',
    category: 'Rebuild kits', productLine: 'Service kits', pack: 'rings, seals, hardware',
    unitCost: 21.7, originalPrice: 36.0, overridePrice: 31.5,
    reasonCode: 'Volume deal', overriddenBy: 'Ben Tran', overriddenByEmail: EMAIL('Ben Tran'),
  },
  {
    id: 'OVR-011', orderNumber: 'SO-50549', orderDate: iso(-27), cases: 72,
    channel: 'Fleet Contract', customer: 'Cedar Creek Earthworks',
    itemName: 'Inflation Hardware Kit OTR', itemNumber: 'SK-INF-OTR',
    category: 'Valve & inflation', productLine: 'Service kits', pack: 'chuck, gauge, hose',
    unitCost: 17.5, originalPrice: 28.8, overridePrice: 23.5,
    reasonCode: 'Rep discretion', overriddenBy: 'Mike Rennick', overriddenByEmail: EMAIL('Mike Rennick'),
  },
  {
    id: 'OVR-012', orderNumber: 'SO-50511', orderDate: iso(-33), cases: 18,
    channel: 'Mining Dealer', customer: 'Great Basin Mining Supply',
    ...wheel('LR-63-HD'),
    unitCost: LR63.cost, originalPrice: LR63.list, overridePrice: 1940, floorPrice: 1931,
    reasonCode: 'Competitive match', overriddenBy: 'Mike Rennick', overriddenByEmail: EMAIL('Mike Rennick'),
  },
  {
    id: 'OVR-013', orderNumber: 'SO-50480', orderDate: iso(-38), cases: 48,
    channel: 'Online Parts', customer: 'RimLine Online',
    itemName: 'Rim Rebuild Kit 33 in', itemNumber: 'SK-RBL-33',
    category: 'Rebuild kits', productLine: 'Service kits', pack: 'rings, seals, hardware',
    unitCost: 19.5, originalPrice: 32.4, overridePrice: 27.5,
    reasonCode: 'Rep discretion', overriddenBy: 'Sofia Marchetti', overriddenByEmail: EMAIL('Sofia Marchetti'),
  },
  {
    id: 'OVR-014', orderNumber: 'SO-50447', orderDate: iso(-44), cases: 200,
    channel: 'Fleet Contract', customer: 'Boulder Ridge Mining Co.',
    itemName: 'O-Ring Seal Kit 63 in', itemNumber: 'SK-ORG-63',
    category: 'Seal kits', productLine: 'Service kits', pack: '6 O-rings + lube',
    unitCost: 22.9, originalPrice: 37.0, overridePrice: 33.0,
    reasonCode: 'Volume deal', overriddenBy: 'Arjun Sandhu', overriddenByEmail: EMAIL('Arjun Sandhu'),
  },
  {
    id: 'OVR-015', orderNumber: 'SO-50435', orderDate: iso(-52), cases: 120,
    channel: 'Mining Dealer', customer: 'Northern Shield Tire & Wheel',
    itemName: 'Lock Ring Pin Set 29 in', itemNumber: 'HW-LRP-29',
    category: 'Wheel hardware', productLine: WHEELS_LINE, pack: '10-pc set',
    unitCost: 22.8, originalPrice: 33.0, overridePrice: 29.0, floorPrice: 29.7,
    reasonCode: 'Contract price not updated', overriddenBy: 'Mike Rennick', overriddenByEmail: EMAIL('Mike Rennick'),
  },
  {
    id: 'OVR-016', orderNumber: 'SO-50388', orderDate: iso(-61), cases: 96,
    channel: 'Mining Dealer', customer: 'Iron Range OTR Services',
    itemName: 'Hardened Washer Pack 25 in', itemNumber: 'HW-WSH-25',
    category: 'Wheel hardware', productLine: WHEELS_LINE, pack: '50-pc pack',
    unitCost: 11.9, originalPrice: 16.8, overridePrice: 16.1,
    reasonCode: 'Aged stock / open box', overriddenBy: 'Sofia Marchetti', overriddenByEmail: EMAIL('Sofia Marchetti'),
  },
  {
    id: 'OVR-017', orderNumber: 'SO-50342', orderDate: iso(-74), cases: 288,
    channel: 'National Account', customer: 'Westline Equipment Group',
    itemName: 'Rim Bolt Set 25 in', itemNumber: 'HW-BLT-25',
    category: 'Wheel hardware', productLine: WHEELS_LINE, pack: '16-pc set',
    unitCost: 13.4, originalPrice: 19.2, overridePrice: 17.28, floorPrice: 17.28,
    reasonCode: 'Volume deal', overriddenBy: 'Claire Fournier', overriddenByEmail: EMAIL('Claire Fournier'),
  },
  {
    id: 'OVR-018', orderNumber: 'SO-50296', orderDate: iso(-95), cases: 160,
    channel: 'Fleet Contract', customer: 'Ashcroft Contract Haulage',
    itemName: 'Valve Service Kit Haul Truck', itemNumber: 'SK-VLV-HL',
    category: 'Valve & inflation', productLine: 'Service kits', pack: 'core, cap, stem',
    unitCost: 15.0, originalPrice: 24.0, overridePrice: 21.5,
    reasonCode: 'Rep discretion', overriddenBy: 'Ben Tran', overriddenByEmail: EMAIL('Ben Tran'),
  },
]

// ═══════════════════════════════════════════════════════════════════════
// 2 · Pricing setup (margin threshold test)
// ═══════════════════════════════════════════════════════════════════════
// 20 active price records. At the 25% default floor, 6 fail — 3 dealer and 3
// fleet, every one of them wheel hardware. Three also price below their floor
// with no active trade promotion, which is a price leak rather than a margin
// decision.

const PRICING_SETUP: PricingSetupLine[] = [
  // ── Dealers · mining, national accounts, ag, online parts ──
  {
    id: 'PRC-RTL-01', mode: 'Retail', channel: 'Mining Dealer', channelDetail: 'Mining dealer price group',
    customerCodes: MINING,
    ...wheel('TSR-57-4000'),
    quantity: 12, basePrice: T57.list, marginComponent: 0, discountPct: 0,
    autoCharge: 0, unitCost: T57.cost, floorPrice: 17676,
    validFrom: iso(-38), validTo: iso(120),
  },
  {
    id: 'PRC-RTL-02', mode: 'Retail', channel: 'National Account', channelDetail: 'Westline Equipment Group',
    customerCodes: ['C10007'],
    ...wheel('TSR-57-4000'),
    quantity: 8, basePrice: T57.list, marginComponent: 0, discountPct: 12,
    discount: {
      name: 'Fall Fleet Readiness Event', type: 'Threshold', promoId: 'TP-2026-112',
      validFrom: iso(-10), validTo: iso(12),
      tiers: [
        { label: '1 – 5 units', discountPct: 8 },
        { label: '6 – 11 units', discountPct: 12 },
        { label: '12+ units', discountPct: 15 },
      ],
    },
    autoCharge: 0, unitCost: T57.cost, poolSharePct: 8, floorPrice: 17676, promoUntil: iso(12),
    validFrom: iso(-10), validTo: iso(12),
  },
  {
    id: 'PRC-RTL-03', mode: 'Retail', channel: 'Mining Dealer', channelDetail: 'Mining dealer price group',
    customerCodes: MINING,
    itemName: 'O-Ring Seal Kit 57 in', itemNumber: 'SK-ORG-57',
    category: 'Seal kits', productLine: 'Service kits', pack: '6 O-rings + lube',
    quantity: 300, basePrice: 27.6, marginComponent: 0, discountPct: 15,
    discount: {
      name: 'Seal Kit Stock-Up Deal', type: 'Quantity', promoId: 'TP-2026-108',
      validFrom: iso(-40), validTo: iso(25),
      tiers: [
        { label: '1 – 99 units', discountPct: 0 },
        { label: '100 – 299 units', discountPct: 10 },
        { label: '300+ units', discountPct: 15 },
      ],
    },
    autoCharge: 0, unitCost: 17.0,
    validFrom: iso(-40), validTo: iso(25),
  },
  {
    id: 'PRC-RTL-04', mode: 'Retail', channel: 'Mining Dealer', channelDetail: 'Mining dealer price group',
    customerCodes: MINING,
    ...wheel('LR-63-HD'),
    quantity: 24, basePrice: LR63.list, marginComponent: 0, discountPct: 0,
    autoCharge: 0, unitCost: LR63.cost, floorPrice: 1931,
    validFrom: iso(-20), validTo: iso(90),
  },
  {
    id: 'PRC-RTL-05', mode: 'Retail', channel: 'Online Parts', channelDetail: 'Online parts price group',
    customerCodes: ONLINE,
    itemName: 'Dual-Wheel Clamp Set Ag', itemNumber: 'HW-DCL-AG',
    category: 'Wheel hardware', productLine: WHEELS_LINE, pack: '8-pc set',
    quantity: 2400, basePrice: 30.0, marginComponent: 0, discountPct: 10,
    discount: {
      name: 'Harvest Service Feature', type: 'Line', promoId: 'TP-2026-115',
      validFrom: iso(-12), validTo: iso(9),
    },
    autoCharge: 0, unitCost: 21.0, floorPrice: 27.0, promoUntil: iso(9),
    validFrom: iso(-12), validTo: iso(9),
  },
  {
    id: 'PRC-RTL-06', mode: 'Retail', channel: 'Mining Dealer', channelDetail: 'Northern Shield Tire & Wheel · Iron Range OTR Services',
    customerCodes: ['C10002', 'C10003'],
    ...wheel('TSR-49-3600'),
    quantity: 40, basePrice: T49.list, marginComponent: 0, discountPct: 15,
    discount: {
      name: 'Iron Range Fall Stocking Program', type: 'Line', promoId: 'TP-2026-104',
      validFrom: iso(-27), validTo: iso(-6),
    },
    // The stocking program closed six days ago and the promo price was never
    // taken off the price group — the dealer side's price-leak finding.
    autoCharge: 0, unitCost: T49.cost, floorPrice: 11970, promoUntil: iso(-6),
    validFrom: iso(-27), validTo: iso(60),
  },
  {
    id: 'PRC-RTL-07', mode: 'Retail', channel: 'Mining Dealer', channelDetail: 'Mining + Ag dealer price groups',
    customerCodes: [...MINING, ...AG],
    itemName: 'Bead Seat Seal Kit 49 in', itemNumber: 'SK-BSS-49',
    category: 'Seal kits', productLine: 'Service kits', pack: 'seal + 2 O-rings',
    quantity: 420, basePrice: 29.6, marginComponent: 0, discountPct: 0,
    autoCharge: 0, unitCost: 17.5,
    validFrom: iso(-150), validTo: iso(120),
  },
  {
    id: 'PRC-RTL-08', mode: 'Retail', channel: 'National Account', channelDetail: 'Continental Earthmoving Supply',
    customerCodes: ['C10008'],
    itemName: 'Rim Rebuild Kit 25 in', itemNumber: 'SK-RBL-25',
    category: 'Rebuild kits', productLine: 'Service kits', pack: 'rings, seals, hardware',
    quantity: 200, basePrice: 36.0, marginComponent: 0, discountPct: 0,
    autoCharge: 1.25, unitCost: 21.7,
    validFrom: iso(-90), validTo: iso(150),
  },
  {
    id: 'PRC-RTL-09', mode: 'Retail', channel: 'Ag Dealer', channelDetail: 'Ag dealer price group',
    customerCodes: AG,
    itemName: 'Rim Bolt Set 33 in', itemNumber: 'HW-BLT-33',
    category: 'Wheel hardware', productLine: WHEELS_LINE, pack: '16-pc set',
    quantity: 96, basePrice: 30.0, marginComponent: -2.0, discountPct: 0,
    autoCharge: 0, unitCost: 19.6,
    validFrom: iso(-120), validTo: iso(90),
  },
  {
    id: 'PRC-RTL-10', mode: 'Retail', channel: 'National Account', channelDetail: 'Westline Equipment Group',
    customerCodes: ['C10007'],
    itemName: 'Rim Bolt Set 25 in', itemNumber: 'HW-BLT-25',
    category: 'Wheel hardware', productLine: WHEELS_LINE, pack: '16-pc set',
    quantity: 7200, basePrice: 19.2, marginComponent: 0, discountPct: 8,
    discount: {
      name: 'Dealer Pallet Program', type: 'Line', promoId: 'TP-2026-109',
      validFrom: iso(-30), validTo: iso(30),
    },
    autoCharge: 0, unitCost: 13.4, floorPrice: 17.28, promoUntil: iso(30),
    validFrom: iso(-30), validTo: iso(30),
  },
  {
    id: 'PRC-RTL-11', mode: 'Retail', channel: 'Mining Dealer', channelDetail: 'Mining dealer price group',
    customerCodes: MINING,
    itemName: 'Valve Service Kit Construction', itemNumber: 'SK-VLV-CON',
    category: 'Valve & inflation', productLine: 'Service kits', pack: 'core, cap, stem',
    quantity: 160, basePrice: 24.0, marginComponent: 0, discountPct: 15,
    discount: {
      name: 'Pre-Winter Valve Kit Bundle', type: 'Mix and match', promoId: 'TP-2026-116',
      validFrom: iso(-5), validTo: iso(40),
    },
    autoCharge: 0, unitCost: 14.6,
    validFrom: iso(-5), validTo: iso(40),
  },
  {
    id: 'PRC-RTL-12', mode: 'Retail', channel: 'Online Parts', channelDetail: 'Online parts price group',
    customerCodes: ONLINE,
    itemName: 'Rim Rebuild Kit 33 in', itemNumber: 'SK-RBL-33',
    category: 'Rebuild kits', productLine: 'Service kits', pack: 'rings, seals, hardware',
    quantity: 120, basePrice: 32.4, marginComponent: 1.5, discountPct: 0,
    autoCharge: 0, unitCost: 19.5,
    validFrom: iso(-200), validTo: iso(160),
  },

  // ── Fleet · mine-site, quarry, haulage and earthworks contracts ──
  {
    id: 'PRC-FS-01', mode: 'Foodservice', channel: 'Fleet Contract',
    channelDetail: 'Boulder Ridge Mining Co.',
    customerAccount: 'C10011', contract: 'FY26 Wheel Service Supply Agreement',
    itemName: 'O-Ring Seal Kit 63 in', itemNumber: 'SK-ORG-63',
    category: 'Seal kits', productLine: 'Service kits', pack: '6 O-rings + lube',
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
    id: 'PRC-FS-02', mode: 'Foodservice', channel: 'Fleet Contract',
    channelDetail: 'Granite Peak Quarries',
    customerAccount: 'C10021', contract: 'Quarry Fleet Agreement',
    itemName: 'Bead Seat Seal Kit 51 in', itemNumber: 'SK-BSS-51',
    category: 'Seal kits', productLine: 'Service kits', pack: 'seal + 2 O-rings',
    quantity: 600, basePrice: 26.4, marginComponent: 0, discountPct: 0,
    autoCharge: 0, unitCost: 16.5, floorPrice: 24.0,
    validFrom: iso(-180), validTo: iso(185),
  },
  {
    id: 'PRC-FS-03', mode: 'Foodservice', channel: 'Fleet Contract',
    channelDetail: 'Keystone Ridge Copper',
    customerAccount: 'C10012', contract: 'Haul Fleet Wheel Program',
    ...wheel('TSR-63-4400'),
    quantity: 24, basePrice: T63.list, marginComponent: 0, discountPct: 15,
    discount: {
      name: 'Q3 Fleet Rebuild Allowance', type: 'Line', promoId: 'TP-2026-118',
      validFrom: iso(-35), validTo: iso(-9),
    },
    // The fleet-rebuild allowance closed nine days ago and stayed on the
    // contract line — this is the demo's headline price-leak finding.
    autoCharge: 0, unitCost: T63.cost, floorPrice: 22388, promoUntil: iso(-9),
    validFrom: iso(-35), validTo: iso(55),
  },
  {
    id: 'PRC-FS-04', mode: 'Foodservice', channel: 'Fleet Contract',
    channelDetail: 'Tamarack Basin Coal',
    customerAccount: 'C10038', contract: 'Mine Supply Contract',
    itemName: 'Spacer Ring Set 33 in', itemNumber: 'HW-SPC-33',
    category: 'Wheel hardware', productLine: WHEELS_LINE, pack: '4-pc set',
    quantity: 5760, basePrice: 19.0, marginComponent: 0, discountPct: 8,
    discount: {
      name: 'Mine Supply Volume Schedule', type: 'Quantity',
      validFrom: iso(-150), validTo: iso(30),
      tiers: [
        { label: '1 – 99 units', discountPct: 0 },
        { label: '100 – 199 units', discountPct: 5 },
        { label: '200+ units', discountPct: 8 },
      ],
    },
    autoCharge: 0, unitCost: 13.5, floorPrice: 17.1,
    validFrom: iso(-150), validTo: iso(30),
  },
  {
    id: 'PRC-FS-05', mode: 'Foodservice', channel: 'Fleet Contract',
    channelDetail: 'Tamarack Basin Coal',
    customerAccount: 'C10038', contract: 'Mine Supply Contract',
    ...wheel('BSB-57'),
    quantity: 48, basePrice: BSB57.list, marginComponent: 0, discountPct: 8,
    discount: {
      name: 'Mine Supply Volume Schedule', type: 'Quantity',
      validFrom: iso(-150), validTo: iso(30),
      tiers: [
        { label: '1 – 11 units', discountPct: 0 },
        { label: '12 – 23 units', discountPct: 5 },
        { label: '24+ units', discountPct: 8 },
      ],
    },
    // Plate cost moved with the mill index after the contract was signed; the
    // floor was raised but the volume schedule was never re-cut against it.
    autoCharge: 0, unitCost: BSB57.cost, floorPrice: 3306,
    validFrom: iso(-150), validTo: iso(30),
  },
  {
    id: 'PRC-FS-06', mode: 'Foodservice', channel: 'Fleet Contract',
    channelDetail: 'Cedar Creek Earthworks',
    customerAccount: 'C10037', contract: 'Season Earthworks Agreement',
    itemName: 'Inflation Hardware Kit OTR', itemNumber: 'SK-INF-OTR',
    category: 'Valve & inflation', productLine: 'Service kits', pack: 'chuck, gauge, hose',
    quantity: 144, basePrice: 28.8, marginComponent: 0, discountPct: 10,
    discount: {
      name: 'Season-Close Allowance', type: 'Line', promoId: 'TP-2026-117',
      validFrom: iso(-8), validTo: iso(21),
    },
    autoCharge: 0, unitCost: 17.5,
    validFrom: iso(-8), validTo: iso(21),
  },
  {
    id: 'PRC-FS-07', mode: 'Foodservice', channel: 'Fleet Contract',
    channelDetail: 'Ashcroft Contract Haulage',
    customerAccount: 'C10016', contract: 'Contract Haulage Agreement',
    itemName: 'Valve Service Kit Haul Truck', itemNumber: 'SK-VLV-HL',
    category: 'Valve & inflation', productLine: 'Service kits', pack: 'core, cap, stem',
    quantity: 200, basePrice: 24.0, marginComponent: 0, discountPct: 0,
    autoCharge: 0.95, unitCost: 15.0,
    validFrom: iso(-240), validTo: iso(125),
  },
  {
    id: 'PRC-FS-08', mode: 'Foodservice', channel: 'Fleet Contract',
    channelDetail: 'North Shore Aggregates',
    customerAccount: 'C10014', contract: 'Winter Shutdown Program',
    ...wheel('LR-63-HD'),
    quantity: 36, basePrice: LR63.list, marginComponent: 0, discountPct: 5,
    discount: {
      name: 'Winter Program Schedule', type: 'Quantity',
      validFrom: iso(-20), validTo: iso(150),
      tiers: [
        { label: '1 – 11 units', discountPct: 0 },
        { label: '12 – 35 units', discountPct: 3 },
        { label: '36+ units', discountPct: 5 },
      ],
    },
    autoCharge: 0, unitCost: LR63.cost, floorPrice: 1931,
    validFrom: iso(-20), validTo: iso(150),
  },
]

// ═══════════════════════════════════════════════════════════════════════
// 3 · Price history audit
// ═══════════════════════════════════════════════════════════════════════
// A price scope is whatever the price is set against: RIMEX's list price, a
// dealer price group, or one customer's contract line.

const PRICE_HISTORY: PriceHistoryRecord[] = [
  {
    productKey: 'TSR-63-4400|assembly|LIST',
    ...wheel('TSR-63-4400'),
    scopeId: 'LIST', scopeName: 'RIMEX list price',
    entries: [
      { id: 'PH-1-3', price: T63.list, activeFrom: iso(-38), activeTo: null, changedBy: 'Dana Whitford', changeType: 'List update', note: 'Q4 list — steel surcharge reset off the mill index' },
      { id: 'PH-1-2', price: 26355, activeFrom: iso(-170), activeTo: iso(-39), changedBy: 'Dana Whitford', changeType: 'List update', note: 'Q2 list at peak plate pricing' },
      { id: 'PH-1-1', price: 23395, activeFrom: iso(-400), activeTo: iso(-171), changedBy: 'System', changeType: 'Initial', note: 'Item introduction' },
    ],
  },
  {
    productKey: 'TSR-63-4400|assembly|C10012',
    ...wheel('TSR-63-4400'),
    scopeId: 'C10012', scopeName: 'Keystone Ridge Copper · Haul Fleet Wheel Program',
    entries: [
      { id: 'PH-2-3', price: 21144.25, activeFrom: iso(-35), activeTo: null, changedBy: 'Mike Rennick', changeType: 'Trade promotion', note: `Q3 Fleet Rebuild Allowance · 15% — TP-2026-118 ended ${shortDate(iso(-9))}, price never restored to the $22,388.00 floor` },
      { id: 'PH-2-2', price: T63.list, activeFrom: iso(-170), activeTo: iso(-36), changedBy: 'Mike Rennick', changeType: 'Contract update', note: 'Contract line matched to list' },
      { id: 'PH-2-1', price: 23690, activeFrom: iso(-400), activeTo: iso(-171), changedBy: 'System', changeType: 'Initial', note: 'Program contract signed' },
    ],
  },
  {
    productKey: 'TSR-49-3600|assembly|LIST',
    ...wheel('TSR-49-3600'),
    scopeId: 'LIST', scopeName: 'RIMEX list price',
    entries: [
      { id: 'PH-3-3', price: T49.list, activeFrom: iso(-38), activeTo: null, changedBy: 'Dana Whitford', changeType: 'List update', note: 'Q4 list off the mill index' },
      { id: 'PH-3-2', price: 13810, activeFrom: iso(-170), activeTo: iso(-39), changedBy: 'Dana Whitford', changeType: 'List update', note: 'Q2 list' },
      { id: 'PH-3-1', price: 12715, activeFrom: iso(-400), activeTo: iso(-171), changedBy: 'System', changeType: 'Initial', note: 'Item introduction' },
    ],
  },
  {
    productKey: 'TSR-49-3600|assembly|PG-IRON',
    ...wheel('TSR-49-3600'),
    scopeId: 'PG-IRON', scopeName: 'Northern Shield Tire & Wheel · Iron Range OTR Services',
    entries: [
      { id: 'PH-4-3', price: 11288, activeFrom: iso(-27), activeTo: null, changedBy: 'Mike Rennick', changeType: 'Trade promotion', note: `Iron Range Fall Stocking Program · 15% — TP-2026-104 ended ${shortDate(iso(-6))}, promo price still live` },
      { id: 'PH-4-2', price: T49.list, activeFrom: iso(-38), activeTo: iso(-28), changedBy: 'Dana Whitford', changeType: 'List update', note: 'Matched to the Q4 list' },
      { id: 'PH-4-1', price: 13810, activeFrom: iso(-170), activeTo: iso(-39), changedBy: 'System', changeType: 'Initial', note: 'Price group created' },
    ],
  },
  {
    productKey: 'HW-DCL-AG|8-pc set|LIST',
    itemName: 'Dual-Wheel Clamp Set Ag', itemNumber: 'HW-DCL-AG',
    category: 'Wheel hardware', productLine: WHEELS_LINE, pack: '8-pc set',
    scopeId: 'LIST', scopeName: 'RIMEX list price',
    entries: [
      { id: 'PH-5-4', price: 30.0, activeFrom: iso(-45), activeTo: null, changedBy: 'Dana Whitford', changeType: 'Season set', note: 'Fall harvest service price' },
      { id: 'PH-5-3', price: 26.0, activeFrom: iso(-100), activeTo: iso(-46), changedBy: 'Dana Whitford', changeType: 'Season set', note: 'Summer clearance — planting-season overstock at the Saskatoon branch' },
      { id: 'PH-5-2', price: 32.0, activeFrom: iso(-150), activeTo: iso(-101), changedBy: 'Dana Whitford', changeType: 'Season set', note: 'Spring planting price' },
      { id: 'PH-5-1', price: 31.0, activeFrom: iso(-420), activeTo: iso(-151), changedBy: 'System', changeType: 'Initial', note: 'Item introduction' },
    ],
  },
  {
    productKey: 'HW-DCL-AG|8-pc set|PG-WEB',
    itemName: 'Dual-Wheel Clamp Set Ag', itemNumber: 'HW-DCL-AG',
    category: 'Wheel hardware', productLine: WHEELS_LINE, pack: '8-pc set',
    scopeId: 'PG-WEB', scopeName: 'Online parts price group',
    entries: [
      { id: 'PH-6-3', price: 27.0, activeFrom: iso(-12), activeTo: null, changedBy: 'Pricing Agent', changeType: 'Agent reprice', note: 'Harvest Service Feature · 10% — held exactly at the $27.00 floor' },
      { id: 'PH-6-2', price: 30.0, activeFrom: iso(-45), activeTo: iso(-13), changedBy: 'Claire Fournier', changeType: 'Season set', note: 'Matched to the harvest-season list' },
      { id: 'PH-6-1', price: 26.0, activeFrom: iso(-100), activeTo: iso(-46), changedBy: 'System', changeType: 'Initial', note: 'Price group created' },
    ],
  },
  {
    productKey: 'LR-63-HD|each|LIST',
    ...wheel('LR-63-HD'),
    scopeId: 'LIST', scopeName: 'RIMEX list price',
    entries: [
      { id: 'PH-7-3', price: LR63.list, activeFrom: iso(-20), activeTo: null, changedBy: 'Dana Whitford', changeType: 'Season set', note: 'Pre-winter price — held through year-end fleet rebuilds' },
      { id: 'PH-7-2', price: 2400, activeFrom: iso(-230), activeTo: iso(-21), changedBy: 'Dana Whitford', changeType: 'Season set', note: 'Spring construction-ramp price' },
      { id: 'PH-7-1', price: 2195, activeFrom: iso(-400), activeTo: iso(-231), changedBy: 'System', changeType: 'Initial', note: 'Item introduction' },
    ],
  },
  {
    productKey: 'SK-ORG-57|6 O-rings + lube|LIST',
    itemName: 'O-Ring Seal Kit 57 in', itemNumber: 'SK-ORG-57',
    category: 'Seal kits', productLine: 'Service kits', pack: '6 O-rings + lube',
    scopeId: 'LIST', scopeName: 'RIMEX list price',
    entries: [
      { id: 'PH-8-3', price: 27.6, activeFrom: iso(-40), activeTo: null, changedBy: 'Pricing Agent', changeType: 'Cost-plus update', note: 'Q4 elastomer compound cost rolled into the kit price' },
      { id: 'PH-8-2', price: 26.4, activeFrom: iso(-220), activeTo: iso(-41), changedBy: 'Dana Whitford', changeType: 'List update', note: 'Prior compound cost basis' },
      { id: 'PH-8-1', price: 25.8, activeFrom: iso(-420), activeTo: iso(-221), changedBy: 'System', changeType: 'Initial', note: 'Item introduction' },
    ],
  },
]

// ═══════════════════════════════════════════════════════════════════════
// 4 · AI recommendations
// ═══════════════════════════════════════════════════════════════════════

const RECOMMENDATIONS: Recommendation[] = [
  // ── Dealers ──
  {
    id: 'REC-RTL-1', audience: 'Retail', kind: 'Promotion timing',
    title: 'Put the fall fleet-readiness features on service kits, not on wheel assemblies',
    detail:
      'O-ring seal kits still clear 27% margin at 15% off; a 49" TSR wheel assembly at the same depth lands at 24.5%, under the floor. Feature the service kits on price and keep the assemblies at list in the program.',
    bullets: ['Week 1 · 57 in O-ring seal kits at 15% off', 'Week 2 · Seal kit stock-up on the 300-unit tier', 'Assemblies stay at list — feature in the program, not on price'],
    impact: '+$84K margin vs. a flat 12% fleet-readiness promotion', confidence: 'High', status: 'Open',
  },
  {
    id: 'REC-RTL-2', audience: 'Retail', kind: 'Hold price',
    title: 'Hold the 63" heavy-duty lock ring at $2,145.00 through year-end',
    detail:
      'Lock-ring demand climbs into the winter rebuild season and steel components do not age on the shelf, so there is no clock forcing a price move. Cutting now gives away a price the mining dealers are paying.',
    impact: 'Protects ~$52K of list-price revenue', confidence: 'High', status: 'Open',
  },
  {
    id: 'REC-RTL-3', audience: 'Retail', kind: 'Increase price',
    title: 'Raise the 49 in bead seat seal kit from $29.60 to $31.20',
    detail:
      'Bead seat seal kits ship at 41% margin and unit velocity held flat through two compound cost-plus increases. The 45 in kit already lists at $31.20 with no volume penalty.',
    impact: '+$118K estimated annual margin', confidence: 'High', status: 'Open',
  },
  {
    id: 'REC-RTL-4', audience: 'Retail', kind: 'Customer-specific pricing',
    title: 'Carry the online small-order uplift to the ag dealers',
    detail:
      'OTR PartsHub and RimLine already pay $1.50 a unit above the price group on service kits with no loss of volume. Extend the uplift to Quill Lake Ag Equipment and Sheyenne Ag Supply.',
    impact: '+$38K margin per season', confidence: 'Medium', status: 'Open',
  },
  {
    id: 'REC-RTL-5', audience: 'Retail', kind: 'Inventory-driven',
    title: 'Ag dual-wheel clamp sets carry 9 days of cover with 12 days left in the harvest window',
    detail: 'Planting-season overstock is still landing heavier than the online program is pulling, and once harvest closes ag demand goes quiet until spring. Options, in order of margin impact:',
    bullets: [
      'Kit the surplus into ag valve & clamp service kits at Surrey (42% margin)',
      'Offer the balance to Westline Equipment Group as a pallet deal before day 6',
      'Price to move only as a last resort — the line already sits on its floor',
    ],
    impact: 'Avoids ~$41K of aged stock carried into spring', confidence: 'High', status: 'Open',
  },

  // ── Fleet ──
  {
    id: 'REC-FS-1', audience: 'Foodservice', kind: 'Floor compliance',
    title: 'Three lines price below floor with no active promotion',
    detail:
      'Keystone Ridge kept its fleet-rebuild allowance on the 63" TSR assembly nine days after TP-2026-118 closed, the Iron Range stocking price on the 49" assembly is still live at Northern Shield and Iron Range OTR, and the Tamarack Basin bead-seat-band schedule was never re-cut against the new $3,306 floor.',
    bullets: ['Restore the Keystone Ridge TSR-63-4400 line to the $22,388 floor', 'End the Iron Range stocking price or extend TP-2026-104 with approval', 'Re-cut the Tamarack Basin bead-seat-band volume schedule'],
    impact: 'Clears 3 open price leaks', confidence: 'High', status: 'Open',
  },
  {
    id: 'REC-FS-2', audience: 'Foodservice', kind: 'Contract terms',
    title: 'Index the Tamarack Basin supply contract to the mill',
    detail:
      'Bead-seat-band and spacer-ring costs rose with plate after the contract was signed and the fixed volume schedule did not move with them, which is why both lines now sit under 25%. A quarterly mill-index clause keeps the discount and the margin.',
    impact: '+$67K if the contract reprices quarterly to cost', confidence: 'Medium', status: 'Open',
  },
  {
    id: 'REC-FS-3', audience: 'Foodservice', kind: 'Margin protection',
    title: 'Keystone Ridge 63" TSR assembly earns 24.8% on an allowance that has already expired',
    detail:
      'The 15% Q3 fleet-rebuild allowance takes the $24,875.59 list to $21,144.25 — under the floor and under 25%. Rather than leave it, restore the floor and fund a smaller, dated promotion.',
    bullets: ['Restore to the $22,388 floor and close the expired allowance', 'Counter with a 7% dated allowance through the next rebuild cycle (31.3% margin)'],
    impact: '+$30K margin across the 24-assembly program', confidence: 'High', status: 'Open',
  },
  {
    id: 'REC-FS-4', audience: 'Foodservice', kind: 'Product mix',
    title: 'Attach O-ring service kits to the Keystone Ridge assembly program',
    detail:
      'Every TSR assembly change-out needs a seal kit. The 63 in O-ring seal kit runs 38% and absorbs contract tiers, so quoting one with each assembly lifts the program margin without touching the assembly price.',
    bullets: ['Add SK-ORG-63 at contract price to each TSR-63-4400 line on the winter contract'],
    impact: '+2.1 pts blended margin on the haul-fleet program', confidence: 'Medium', status: 'Open',
  },
]

const RETAIL_KPIS: KpiMonitor[] = [
  { label: 'Gross margin %', value: '31.4%', trend: 'up' },
  { label: 'Program sell-through', value: '79%', trend: 'up' },
  { label: 'Trade spend % of sales', value: '6.8%', trend: 'down' },
  { label: 'Promotion ROI', value: '2.1x', trend: 'flat' },
  { label: 'Days of cover', value: '7.4', trend: 'down' },
  { label: 'Aged stock %', value: '2.3%', trend: 'down' },
  { label: 'Fill rate', value: '97.1%', trend: 'up' },
  { label: 'On-time in-full', value: '94%', trend: 'flat' },
  { label: 'Service kit mix', value: '38%', trend: 'up' },
]

const FOODSERVICE_KPIS: KpiMonitor[] = [
  { label: 'Margin by contract', value: '27.2% avg', trend: 'flat' },
  { label: 'Mill program share captured', value: '$186K', trend: 'up' },
  { label: 'Floor compliance rate', value: '95.8%', trend: 'down' },
  { label: 'Average contract discount', value: '7.9%', trend: 'up' },
  { label: 'Open deductions', value: '$94K', trend: 'down' },
  { label: 'Contracts renewing in 60 days', value: '4', trend: 'flat' },
  { label: 'Contract margin', value: '26.4%', trend: 'flat' },
  { label: 'Units per contract', value: '2,940 avg', trend: 'up' },
  { label: 'Committed volume', value: '$6.8M', trend: 'up' },
]

// category list for filters
const CATEGORIES = [
  'Wheel assemblies',
  'Rim components',
  'Wheel hardware',
  'Seal kits',
  'Valve & inflation',
  'Rebuild kits',
] as const

// ═══════════════════════════════════════════════════════════════════════
// 5 · Shipment model (feeds the shared generator in src/data/mockData.ts)
// ═══════════════════════════════════════════════════════════════════════
// Shape of the curve: a per-item base rate at an average dealer, scaled by
// dealer size, by the item's selling season, and by day of week (branches
// ship Monday to Friday), with bounded noise on top.

/** Demand curve by calendar month, Jan..Dec. */
const SEASON_CURVES = {
  /** Year-round haul fleets, with pre-winter stocking for northern sites. */
  mining: [0.95, 0.9, 0.9, 0.9, 0.95, 0.95, 0.95, 1.0, 1.1, 1.25, 1.2, 1.0],
  /** Spring ramp, summer peak, tails off at freeze-up. */
  construction: [0.6, 0.6, 0.8, 1.1, 1.3, 1.35, 1.35, 1.3, 1.15, 1.0, 0.85, 0.65],
  /** Planting in spring, harvest in fall, quiet in winter. */
  ag: [0.5, 0.6, 0.9, 1.3, 1.3, 0.9, 0.8, 1.0, 1.4, 1.4, 0.9, 0.5],
  /** Winter shutdowns are when fleets rebuild wheels. */
  shutdown: [1.3, 1.2, 1.0, 0.85, 0.8, 0.8, 0.8, 0.85, 0.95, 1.1, 1.3, 1.4],
} as const

/**
 * Per-item profile for every dealer-priced item. Life here is days left in
 * the item's selling window. The ag clamp sets and 25 in rim bolts are
 * carrying most of their window in cover — the demo's inventory problem —
 * while mining hardware sits on weeks of window with days of cover. Cover and
 * window lengths are the Bluestem values, so the colouring and the
 * inventory-driven recommendation land the same way.
 */
const ITEM_PROFILE: Record<string, ItemProfile> = {
  'TSR-57-4000': { base: 0.5, season: 'mining', coverDays: 10, shelfLifeDays: 45 },
  'TSR-49-3600': { base: 0.6, season: 'mining', coverDays: 14, shelfLifeDays: 45 },
  'LR-63-HD': { base: 1.5, season: 'shutdown', coverDays: 12, shelfLifeDays: 60 },
  'HW-DCL-AG': { base: 5, season: 'ag', coverDays: 9, shelfLifeDays: 12 },
  'HW-BLT-25': { base: 7, season: 'construction', coverDays: 8, shelfLifeDays: 12 },
  'HW-BLT-33': { base: 4, season: 'construction', coverDays: 3, shelfLifeDays: 10 },
  'SK-ORG-57': { base: 6, season: 'mining', coverDays: 5, shelfLifeDays: 18 },
  'SK-BSS-49': { base: 8, season: 'shutdown', coverDays: 3, shelfLifeDays: 12 },
  'SK-RBL-25': { base: 3, season: 'shutdown', coverDays: 2, shelfLifeDays: 9 },
  'SK-VLV-CON': { base: 3.5, season: 'construction', coverDays: 4, shelfLifeDays: 12 },
  'SK-RBL-33': { base: 4.5, season: 'shutdown', coverDays: 3, shelfLifeDays: 10 },
}

/** Relative size of each dealer. */
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

/** Day-of-week factor: branches ship on weekdays. Sun..Sat. */
const DOW_FACTOR = [0.25, 1.2, 1.25, 1.2, 1.25, 1.15, 0.45]


/**
 * Wheels and rim components must show the item master's cost everywhere, and
 * list-price scopes must show its list price. Fails the build's first render
 * loudly rather than letting two pages disagree.
 */
function assertMasterConsistency() {
  const problems: string[] = []
  for (const l of [...PRICE_OVERRIDES, ...PRICING_SETUP]) {
    const m = MASTER[l.itemNumber]
    if (m && l.unitCost !== m.cost) problems.push(`${l.itemNumber}: unitCost ${l.unitCost} ≠ master ${m.cost}`)
    if (m && l.itemName !== m.name) problems.push(`${l.itemNumber}: name drift`)
  }
  for (const h of PRICE_HISTORY) {
    const m = MASTER[h.itemNumber]
    const current = h.entries.find((e) => e.activeTo === null)
    if (m && h.scopeId === 'LIST' && current && current.price !== m.list) {
      problems.push(`${h.itemNumber}: current list ${current.price} ≠ master ${m.list}`)
    }
  }
  for (const i of simulator.items) {
    const m = MASTER[i.itemNumber]
    if (m && (i.basePrice !== m.list || i.unitCost !== m.cost)) problems.push(`${i.itemNumber}: simulator drift`)
  }
  if (problems.length) throw new Error('RIMEX item master drift:\n' + problems.join('\n'))
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
  simulator,
}
