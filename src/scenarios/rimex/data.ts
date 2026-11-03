// ── Pricing & Margin Workspace · RIMEX dataset ───────────────────────────
//
// This file is the single source of truth for the RIMEX build. Every figure is
// synthetic. It was derived from the Bluestem dataset as a RENAME, not a
// re-tune: every price, cost, floor, discount, quantity and date offset is the
// Bluestem number, so the demo's beats survive verbatim in wheel-shop clothes
// (6 of 20 lines fail the 25% test, all of them wheel hardware; 3 price below
// floor with no active promotion; the headline leak is a fleet allowance that
// outlived its promotion by nine days).
//
//   · Service kits (SK-*) — RIMEX-engineered O-ring, bead-seat, valve and rim
//     rebuild kits built at Surrey. ~38–44% list margin; a 15% promotion
//     still clears 25%.
//   · Wheel hardware (HW-*) — steel wedges, studs, clamps, bolts and rings,
//     priced off the mill index at ~28–32%. A 10% deal takes it under the
//     floor. On steel hardware the mill's program can fund part of a
//     promotional price (the "mill program share", poolSharePct).
//   That gap is the demo's whole argument: promoting service kits is cheap,
//   promoting hardware is where margin quietly disappears.
//
// Two books: dealers (mining, national accounts, ag and online parts — the
// price-group book) and fleet contracts (mine sites, quarries, haulage and
// earthworks contractors).
//
// The cover-vs-life measure on Price Updates reads as days of cover against
// days left in the item's selling window: ag dual-wheel clamps carry 9 days
// of cover with 12 days left in the harvest window — after which ag demand
// goes quiet until spring planting.
//
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
    id: 'OVR-001', orderNumber: 'SO-50812', orderDate: iso(-2), cases: 336,
    channel: 'Mining Dealer', customer: 'Northern Shield Tire & Wheel',
    itemName: 'Stud & Nut Set 49 in', itemNumber: 'HW-STN-49',
    category: 'Mining OTR', productLine: 'Wheel hardware', pack: '12-pc set',
    unitCost: 13.4, originalPrice: 18.75, overridePrice: 15.5, floorPrice: 16.9,
    reasonCode: 'Promo price overlap', overriddenBy: 'Mike Rennick', overriddenByEmail: EMAIL('Mike Rennick'),
  },
  {
    id: 'OVR-002', orderNumber: 'SO-50797', orderDate: iso(-3), cases: 168,
    channel: 'Fleet Contract', customer: 'Tamarack Basin Coal',
    itemName: 'Spacer Ring Set 33 in', itemNumber: 'HW-SPC-33',
    category: 'Construction', productLine: 'Wheel hardware', pack: '4-pc set',
    unitCost: 13.5, originalPrice: 19.0, overridePrice: 17.5, floorPrice: 17.1,
    reasonCode: 'Volume deal', overriddenBy: 'Arjun Sandhu', overriddenByEmail: EMAIL('Arjun Sandhu'),
  },
  {
    id: 'OVR-003', orderNumber: 'SO-50771', orderDate: iso(-5), cases: 480,
    channel: 'National Account', customer: 'Westline Equipment Group',
    itemName: 'TSR Wedge & Bolt Set 57 in', itemNumber: 'HW-WDG-57',
    category: 'Mining OTR', productLine: 'Wheel hardware', pack: '12-pc set',
    unitCost: 15.8, originalPrice: 22.5, overridePrice: 20.25, floorPrice: 20.25,
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
    id: 'OVR-005', orderNumber: 'SO-50718', orderDate: iso(-9), cases: 240,
    channel: 'Fleet Contract', customer: 'Keystone Ridge Copper',
    itemName: 'TSR Wedge Kit 63 in', itemNumber: 'HW-WDG-63',
    category: 'Mining OTR', productLine: 'Wheel hardware', pack: '24-pc kit',
    unitCost: 29.3, originalPrice: 42.0, overridePrice: 34.5, floorPrice: 37.8,
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
    category: 'Dual & ag wheels', productLine: 'Wheel hardware', pack: '8-pc set',
    unitCost: 19.4, originalPrice: 27.2, overridePrice: 23.5, floorPrice: 24.5,
    reasonCode: 'Aged stock / open box', overriddenBy: 'Ben Tran', overriddenByEmail: EMAIL('Ben Tran'),
  },
  {
    id: 'OVR-008', orderNumber: 'SO-50631', orderDate: iso(-16), cases: 60,
    channel: 'Ag Dealer', customer: 'Quill Lake Ag Equipment',
    itemName: 'Rim Bolt Set 33 in', itemNumber: 'HW-BLT-33',
    category: 'Construction', productLine: 'Wheel hardware', pack: '16-pc set',
    unitCost: 19.6, originalPrice: 30.0, overridePrice: 27.0,
    reasonCode: 'Competitive match', overriddenBy: 'Arjun Sandhu', overriddenByEmail: EMAIL('Arjun Sandhu'),
  },
  {
    id: 'OVR-009', orderNumber: 'SO-50602', orderDate: iso(-19), cases: 84,
    channel: 'Mining Dealer', customer: 'Sonoran OTR Supply',
    itemName: 'Flange Nut Set 33 in', itemNumber: 'HW-NUT-33',
    category: 'Construction', productLine: 'Wheel hardware', pack: '20-pc set',
    unitCost: 17.0, originalPrice: 24.0, overridePrice: 21.25, floorPrice: 21.6,
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
    id: 'OVR-012', orderNumber: 'SO-50511', orderDate: iso(-33), cases: 180,
    channel: 'Mining Dealer', customer: 'Great Basin Mining Supply',
    itemName: 'Rim Clamp Set 25 in', itemNumber: 'HW-CLP-25',
    category: 'Construction', productLine: 'Wheel hardware', pack: '6-pc set',
    unitCost: 14.2, originalPrice: 21.0, overridePrice: 19.0, floorPrice: 18.9,
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
    category: 'Mining OTR', productLine: 'Service kits', pack: '6 O-rings + lube',
    unitCost: 22.9, originalPrice: 37.0, overridePrice: 33.0,
    reasonCode: 'Volume deal', overriddenBy: 'Arjun Sandhu', overriddenByEmail: EMAIL('Arjun Sandhu'),
  },
  {
    id: 'OVR-015', orderNumber: 'SO-50435', orderDate: iso(-52), cases: 120,
    channel: 'Mining Dealer', customer: 'Northern Shield Tire & Wheel',
    itemName: 'Lock Ring Pin Set 29 in', itemNumber: 'HW-LRP-29',
    category: 'Construction', productLine: 'Wheel hardware', pack: '10-pc set',
    unitCost: 22.8, originalPrice: 33.0, overridePrice: 29.0, floorPrice: 29.7,
    reasonCode: 'Contract price not updated', overriddenBy: 'Mike Rennick', overriddenByEmail: EMAIL('Mike Rennick'),
  },
  {
    id: 'OVR-016', orderNumber: 'SO-50388', orderDate: iso(-61), cases: 96,
    channel: 'Mining Dealer', customer: 'Iron Range OTR Services',
    itemName: 'Hardened Washer Pack 25 in', itemNumber: 'HW-WSH-25',
    category: 'Construction', productLine: 'Wheel hardware', pack: '50-pc pack',
    unitCost: 11.9, originalPrice: 16.8, overridePrice: 16.1,
    reasonCode: 'Aged stock / open box', overriddenBy: 'Sofia Marchetti', overriddenByEmail: EMAIL('Sofia Marchetti'),
  },
  {
    id: 'OVR-017', orderNumber: 'SO-50342', orderDate: iso(-74), cases: 288,
    channel: 'National Account', customer: 'Westline Equipment Group',
    itemName: 'Rim Bolt Set 25 in', itemNumber: 'HW-BLT-25',
    category: 'Construction', productLine: 'Wheel hardware', pack: '16-pc set',
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
    itemName: 'TSR Wedge & Bolt Set 57 in', itemNumber: 'HW-WDG-57',
    category: 'Mining OTR', productLine: 'Wheel hardware', pack: '12-pc set',
    quantity: 480, basePrice: 22.5, marginComponent: 0, discountPct: 0,
    autoCharge: 0, unitCost: 15.8, floorPrice: 20.25,
    validFrom: iso(-38), validTo: iso(120),
  },
  {
    id: 'PRC-RTL-02', mode: 'Retail', channel: 'National Account', channelDetail: 'Westline Equipment Group',
    customerCodes: ['C10007'],
    itemName: 'TSR Wedge & Bolt Set 57 in', itemNumber: 'HW-WDG-57',
    category: 'Mining OTR', productLine: 'Wheel hardware', pack: '12-pc set',
    quantity: 336, basePrice: 22.5, marginComponent: 0, discountPct: 12,
    discount: {
      name: 'Fall Fleet Readiness Event', type: 'Threshold', promoId: 'TP-2026-112',
      validFrom: iso(-10), validTo: iso(12),
      tiers: [
        { label: '1 – 239 units', discountPct: 8 },
        { label: '240 – 479 units', discountPct: 12 },
        { label: '480+ units', discountPct: 15 },
      ],
    },
    autoCharge: 0, unitCost: 15.8, poolSharePct: 8, floorPrice: 20.25, promoUntil: iso(12),
    validFrom: iso(-10), validTo: iso(12),
  },
  {
    id: 'PRC-RTL-03', mode: 'Retail', channel: 'Mining Dealer', channelDetail: 'Mining dealer price group',
    customerCodes: MINING,
    itemName: 'O-Ring Seal Kit 57 in', itemNumber: 'SK-ORG-57',
    category: 'Mining OTR', productLine: 'Service kits', pack: '6 O-rings + lube',
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
    itemName: 'Rim Clamp Set 25 in', itemNumber: 'HW-CLP-25',
    category: 'Construction', productLine: 'Wheel hardware', pack: '6-pc set',
    quantity: 240, basePrice: 21.0, marginComponent: 0, discountPct: 0,
    autoCharge: 0, unitCost: 14.2, floorPrice: 18.9,
    validFrom: iso(-20), validTo: iso(90),
  },
  {
    id: 'PRC-RTL-05', mode: 'Retail', channel: 'Online Parts', channelDetail: 'Online parts price group',
    customerCodes: ONLINE,
    itemName: 'Dual-Wheel Clamp Set Ag', itemNumber: 'HW-DCL-AG',
    category: 'Dual & ag wheels', productLine: 'Wheel hardware', pack: '8-pc set',
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
    itemName: 'Stud & Nut Set 49 in', itemNumber: 'HW-STN-49',
    category: 'Mining OTR', productLine: 'Wheel hardware', pack: '12-pc set',
    quantity: 9600, basePrice: 18.75, marginComponent: 0, discountPct: 15,
    discount: {
      name: 'Iron Range Fall Stocking Program', type: 'Line', promoId: 'TP-2026-104',
      validFrom: iso(-27), validTo: iso(-6),
    },
    // The stocking program closed six days ago and the promo price was never
    // taken off the price group — the dealer side's price-leak finding.
    autoCharge: 0, unitCost: 13.4, floorPrice: 16.9, promoUntil: iso(-6),
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
    category: 'Construction', productLine: 'Wheel hardware', pack: '16-pc set',
    quantity: 96, basePrice: 30.0, marginComponent: -2.0, discountPct: 0,
    autoCharge: 0, unitCost: 19.6,
    validFrom: iso(-120), validTo: iso(90),
  },
  {
    id: 'PRC-RTL-10', mode: 'Retail', channel: 'National Account', channelDetail: 'Westline Equipment Group',
    customerCodes: ['C10007'],
    itemName: 'Rim Bolt Set 25 in', itemNumber: 'HW-BLT-25',
    category: 'Construction', productLine: 'Wheel hardware', pack: '16-pc set',
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
    category: 'Mining OTR', productLine: 'Service kits', pack: '6 O-rings + lube',
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
    itemName: 'TSR Wedge Kit 63 in', itemNumber: 'HW-WDG-63',
    category: 'Mining OTR', productLine: 'Wheel hardware', pack: '24-pc kit',
    quantity: 4800, basePrice: 42.0, marginComponent: 0, discountPct: 15,
    discount: {
      name: 'Q3 Fleet Rebuild Allowance', type: 'Line', promoId: 'TP-2026-118',
      validFrom: iso(-35), validTo: iso(-9),
    },
    // The fleet-rebuild allowance closed nine days ago and stayed on the
    // contract line — this is the demo's headline price-leak finding.
    autoCharge: 0, unitCost: 29.3, poolSharePct: 8, floorPrice: 37.8, promoUntil: iso(-9),
    validFrom: iso(-35), validTo: iso(55),
  },
  {
    id: 'PRC-FS-04', mode: 'Foodservice', channel: 'Fleet Contract',
    channelDetail: 'Tamarack Basin Coal',
    customerAccount: 'C10038', contract: 'Mine Supply Contract',
    itemName: 'Spacer Ring Set 33 in', itemNumber: 'HW-SPC-33',
    category: 'Construction', productLine: 'Wheel hardware', pack: '4-pc set',
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
    itemName: 'Flange Nut Set 33 in', itemNumber: 'HW-NUT-33',
    category: 'Construction', productLine: 'Wheel hardware', pack: '20-pc set',
    quantity: 5760, basePrice: 24.0, marginComponent: 0, discountPct: 8,
    discount: {
      name: 'Mine Supply Volume Schedule', type: 'Quantity',
      validFrom: iso(-150), validTo: iso(30),
      tiers: [
        { label: '1 – 99 units', discountPct: 0 },
        { label: '100 – 199 units', discountPct: 5 },
        { label: '200+ units', discountPct: 8 },
      ],
    },
    // Bar-stock cost moved with the mill index after the contract was signed;
    // the floor was raised but the volume schedule was never re-cut against it.
    autoCharge: 0, unitCost: 17.0, floorPrice: 22.8,
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
    itemName: 'Rim Clamp Set 25 in', itemNumber: 'HW-CLP-25',
    category: 'Construction', productLine: 'Wheel hardware', pack: '6-pc set',
    quantity: 144, basePrice: 21.0, marginComponent: 0, discountPct: 5,
    discount: {
      name: 'Winter Program Schedule', type: 'Quantity',
      validFrom: iso(-20), validTo: iso(150),
      tiers: [
        { label: '1 – 71 units', discountPct: 0 },
        { label: '72 – 143 units', discountPct: 3 },
        { label: '144+ units', discountPct: 5 },
      ],
    },
    autoCharge: 0, unitCost: 14.2, floorPrice: 18.9,
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
    productKey: 'HW-WDG-63|24-pc kit|LIST',
    itemName: 'TSR Wedge Kit 63 in', itemNumber: 'HW-WDG-63',
    category: 'Mining OTR', productLine: 'Wheel hardware', pack: '24-pc kit',
    scopeId: 'LIST', scopeName: 'RIMEX list price',
    entries: [
      { id: 'PH-1-3', price: 42.0, activeFrom: iso(-38), activeTo: null, changedBy: 'Dana Whitford', changeType: 'List update', note: 'Q4 list — steel surcharge reset off the mill index' },
      { id: 'PH-1-2', price: 44.5, activeFrom: iso(-170), activeTo: iso(-39), changedBy: 'Dana Whitford', changeType: 'List update', note: 'Q2 list at peak plate pricing' },
      { id: 'PH-1-1', price: 39.5, activeFrom: iso(-400), activeTo: iso(-171), changedBy: 'System', changeType: 'Initial', note: 'Item introduction' },
    ],
  },
  {
    productKey: 'HW-WDG-63|24-pc kit|C10012',
    itemName: 'TSR Wedge Kit 63 in', itemNumber: 'HW-WDG-63',
    category: 'Mining OTR', productLine: 'Wheel hardware', pack: '24-pc kit',
    scopeId: 'C10012', scopeName: 'Keystone Ridge Copper · Haul Fleet Wheel Program',
    entries: [
      { id: 'PH-2-3', price: 35.7, activeFrom: iso(-35), activeTo: null, changedBy: 'Mike Rennick', changeType: 'Trade promotion', note: `Q3 Fleet Rebuild Allowance · 15% — TP-2026-118 ended ${shortDate(iso(-9))}, price never restored to the $37.80 floor` },
      { id: 'PH-2-2', price: 42.0, activeFrom: iso(-170), activeTo: iso(-36), changedBy: 'Mike Rennick', changeType: 'Contract update', note: 'Contract line matched to list' },
      { id: 'PH-2-1', price: 40.0, activeFrom: iso(-400), activeTo: iso(-171), changedBy: 'System', changeType: 'Initial', note: 'Program contract signed' },
    ],
  },
  {
    productKey: 'HW-STN-49|12-pc set|LIST',
    itemName: 'Stud & Nut Set 49 in', itemNumber: 'HW-STN-49',
    category: 'Mining OTR', productLine: 'Wheel hardware', pack: '12-pc set',
    scopeId: 'LIST', scopeName: 'RIMEX list price',
    entries: [
      { id: 'PH-3-3', price: 18.75, activeFrom: iso(-38), activeTo: null, changedBy: 'Dana Whitford', changeType: 'List update', note: 'Q4 list off the mill index' },
      { id: 'PH-3-2', price: 19.5, activeFrom: iso(-170), activeTo: iso(-39), changedBy: 'Dana Whitford', changeType: 'List update', note: 'Q2 list' },
      { id: 'PH-3-1', price: 17.95, activeFrom: iso(-400), activeTo: iso(-171), changedBy: 'System', changeType: 'Initial', note: 'Item introduction' },
    ],
  },
  {
    productKey: 'HW-STN-49|12-pc set|PG-IRON',
    itemName: 'Stud & Nut Set 49 in', itemNumber: 'HW-STN-49',
    category: 'Mining OTR', productLine: 'Wheel hardware', pack: '12-pc set',
    scopeId: 'PG-IRON', scopeName: 'Northern Shield Tire & Wheel · Iron Range OTR Services',
    entries: [
      { id: 'PH-4-3', price: 15.94, activeFrom: iso(-27), activeTo: null, changedBy: 'Mike Rennick', changeType: 'Trade promotion', note: `Iron Range Fall Stocking Program · 15% — TP-2026-104 ended ${shortDate(iso(-6))}, promo price still live` },
      { id: 'PH-4-2', price: 18.75, activeFrom: iso(-38), activeTo: iso(-28), changedBy: 'Dana Whitford', changeType: 'List update', note: 'Matched to the Q4 list' },
      { id: 'PH-4-1', price: 19.5, activeFrom: iso(-170), activeTo: iso(-39), changedBy: 'System', changeType: 'Initial', note: 'Price group created' },
    ],
  },
  {
    productKey: 'HW-DCL-AG|8-pc set|LIST',
    itemName: 'Dual-Wheel Clamp Set Ag', itemNumber: 'HW-DCL-AG',
    category: 'Dual & ag wheels', productLine: 'Wheel hardware', pack: '8-pc set',
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
    category: 'Dual & ag wheels', productLine: 'Wheel hardware', pack: '8-pc set',
    scopeId: 'PG-WEB', scopeName: 'Online parts price group',
    entries: [
      { id: 'PH-6-3', price: 27.0, activeFrom: iso(-12), activeTo: null, changedBy: 'Pricing Agent', changeType: 'Agent reprice', note: 'Harvest Service Feature · 10% — held exactly at the $27.00 floor' },
      { id: 'PH-6-2', price: 30.0, activeFrom: iso(-45), activeTo: iso(-13), changedBy: 'Claire Fournier', changeType: 'Season set', note: 'Matched to the harvest-season list' },
      { id: 'PH-6-1', price: 26.0, activeFrom: iso(-100), activeTo: iso(-46), changedBy: 'System', changeType: 'Initial', note: 'Price group created' },
    ],
  },
  {
    productKey: 'HW-CLP-25|6-pc set|LIST',
    itemName: 'Rim Clamp Set 25 in', itemNumber: 'HW-CLP-25',
    category: 'Construction', productLine: 'Wheel hardware', pack: '6-pc set',
    scopeId: 'LIST', scopeName: 'RIMEX list price',
    entries: [
      { id: 'PH-7-3', price: 21.0, activeFrom: iso(-20), activeTo: null, changedBy: 'Dana Whitford', changeType: 'Season set', note: 'Pre-winter price — held through year-end fleet rebuilds' },
      { id: 'PH-7-2', price: 23.5, activeFrom: iso(-230), activeTo: iso(-21), changedBy: 'Dana Whitford', changeType: 'Season set', note: 'Spring construction-ramp price' },
      { id: 'PH-7-1', price: 21.5, activeFrom: iso(-400), activeTo: iso(-231), changedBy: 'System', changeType: 'Initial', note: 'Item introduction' },
    ],
  },
  {
    productKey: 'SK-ORG-57|6 O-rings + lube|LIST',
    itemName: 'O-Ring Seal Kit 57 in', itemNumber: 'SK-ORG-57',
    category: 'Mining OTR', productLine: 'Service kits', pack: '6 O-rings + lube',
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
    title: 'Put the fall fleet-readiness features on service kits, not on hardware',
    detail:
      'O-ring seal kits still clear 27% margin at 15% off; a 49 in stud & nut set at the same depth lands under 16%. Feature the service kits on price and keep the hardware at list in the program.',
    bullets: ['Week 1 · 57 in O-ring seal kits at 15% off', 'Week 2 · Seal kit stock-up on the 300-unit tier', 'Hardware stays at list — feature in the program, not on price'],
    impact: '+$84K margin vs. a flat 12% fleet-readiness promotion', confidence: 'High', status: 'Open',
  },
  {
    id: 'REC-RTL-2', audience: 'Retail', kind: 'Hold price',
    title: 'Hold the 25 in rim clamp set at $21.00 through year-end',
    detail:
      'Clamp demand climbs into the winter rebuild season and steel hardware does not age on the shelf, so there is no clock forcing a price move. Cutting now gives away a price the mining dealers are paying.',
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
      'The Keystone Ridge 63 in wedge kit kept its fleet-rebuild allowance nine days after TP-2026-118 closed, the Iron Range stocking price is still live at Northern Shield and Iron Range OTR, and the Tamarack Basin flange-nut schedule was never re-cut against the new floor.',
    bullets: ['Restore the Keystone Ridge 63 in wedge kit to the $37.80 floor', 'End the Iron Range stocking price or extend TP-2026-104 with approval', 'Re-cut the Tamarack Basin flange-nut volume schedule'],
    impact: 'Clears 3 open price leaks', confidence: 'High', status: 'Open',
  },
  {
    id: 'REC-FS-2', audience: 'Foodservice', kind: 'Contract terms',
    title: 'Index the Tamarack Basin supply contract to the mill',
    detail:
      'Spacer-ring and flange-nut costs rose with plate and bar after the contract was signed and the fixed volume schedule did not move with them, which is why both lines now sit under 25%. A quarterly mill-index clause keeps the discount and the margin.',
    impact: '+$67K if the contract reprices quarterly to cost', confidence: 'Medium', status: 'Open',
  },
  {
    id: 'REC-FS-3', audience: 'Foodservice', kind: 'Margin protection',
    title: 'Keystone Ridge wedge kit earns 24.5% at 15% off — under the floor even with the mill share',
    detail:
      'Without the 8% mill program share the line would be at 17.9%. Rather than deepen the allowance, restore the floor and fund a smaller, dated promotion.',
    bullets: ['Restore to the $37.80 floor and close the expired allowance', 'Counter with a 7% dated allowance through the next rebuild cycle'],
    impact: '+$10K margin across the 4,800-unit program', confidence: 'High', status: 'Open',
  },
  {
    id: 'REC-FS-4', audience: 'Foodservice', kind: 'Product mix',
    title: 'Move haul-fleet volume toward O-ring service kits',
    detail:
      'Loose 63 in wedge kits list at 30% margin and carry a floor; 63 in O-ring seal kits run 38% and absorb contract tiers. Offer Keystone Ridge the seal kit for its scheduled tire-change program.',
    bullets: ['Propose a 60/40 wedge kit / seal kit split on the winter contract'],
    impact: '+5.4 pts blended margin on haul-fleet hardware', confidence: 'Medium', status: 'Open',
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
  'Mining OTR',
  'Dual & ag wheels',
  'Construction',
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
  'HW-WDG-57': { base: 14, season: 'mining', coverDays: 10, shelfLifeDays: 45 },
  'HW-STN-49': { base: 11, season: 'mining', coverDays: 14, shelfLifeDays: 45 },
  'HW-CLP-25': { base: 6, season: 'shutdown', coverDays: 12, shelfLifeDays: 60 },
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
