// ── RIMEX · Price Simulator trade agreements ─────────────────────────────
//
// The TSR-63-4400 lines are the trade agreement journal from the RIMEX F&SC
// demo environment, line for line (base price 24,875.59; RIM-005 table price;
// IC / OP / SC / AM groups). The other four items follow the same structure.
// All figures synthetic; every customer is fictional. Dates are offsets from
// AS_OF so promotion windows never go stale.
//
// Beats the default selection is tuned for:
//   · RIM-005 on TSR-63-4400 — a negotiated customer price (21,000) with the
//     Fleet-operator quantity discount stacked on top because Find next is
//     on: 4 units net 19,950 = 20.3%, under the 25% floor.
//   · RIM-002 on TSR-57-4000 — same shape, but the customer discount line has
//     Find next OFF, so the OP group discount is never reached: 26.0%.
//   · TSR-49-3600 — a live Q4 service-centre program stacks for SC; an
//     expired fleet allowance shows as "outside dates".
//   · Components (CMP group) — an All-customers volume break stacks with the
//     aftermarket group discount at 20+ units; RIM-006's negotiated BSB-57
//     price takes the aftermarket discount on top (stacking, under floor).
//
// List prices and costs are NOT set here — they come from ./items.ts.

import { makeIso } from '../../lib/dates'
import type { SimulatorData, TradeAgreementLine } from '../../models/tradeAgreements'
import { AS_OF } from './config'
import { MASTER } from './items'

const iso = makeIso(AS_OF)

const L = (
  id: string,
  relation: TradeAgreementLine['relation'],
  accountCode: TradeAgreementLine['accountCode'],
  accountSelection: string,
  itemCode: TradeAgreementLine['itemCode'],
  itemSelection: string,
  amount: number,
  discountPct: number,
  more: Partial<TradeAgreementLine> = {},
): TradeAgreementLine => ({
  id, relation, accountCode, accountSelection, itemCode, itemSelection,
  fromQty: 0, toQty: 0, amount, discountPct, findNext: true, ...more,
})

export const simulator: SimulatorData = {
  lede: 'Pick a customer and one of the products it buys. The simulator searches the trade agreement journal the way Dynamics 365 does — customer, then price group, then all customers — and shows which lines were found, which were skipped and why, and how the net price is built.',

  priceGroups: { IC: 'Intercompany' },
  lineDiscountGroups: {
    OP: 'Fleet operators',
    SC: 'Service centers',
    AM: 'Aftermarket distributors',
  },
  itemDiscountGroups: { RIM: 'Wheel assemblies', CMP: 'Wheel components' },

  customers: [
    { account: 'RIM-001', name: 'Copperline Haul Fleet Services', type: 'Fleet operator', lineDiscountGroup: 'OP', items: ['TSR-63-4400', 'TSR-57-4000', 'LR-63-HD', 'BSB-57'] },
    { account: 'RIM-002', name: 'Redcliff Open Pit Operations', type: 'Fleet operator', lineDiscountGroup: 'OP', items: ['TSR-57-4000', 'TSR-49-3600', 'LR-63-HD'] },
    { account: 'RIM-003', name: 'Highway 16 Tire Service Centre', type: 'Service center', lineDiscountGroup: 'SC', items: ['TSR-49-3600', 'LR-63-HD', 'BSB-57'] },
    { account: 'RIM-004', name: 'Kootenay OTR Service Centre', type: 'Service center', lineDiscountGroup: 'SC', items: ['TSR-63-4400', 'TSR-57-4000', 'TSR-49-3600', 'LR-63-HD'] },
    { account: 'RIM-005', name: 'Basalt Creek Mining Ltd.', type: 'Fleet operator', lineDiscountGroup: 'OP', items: ['TSR-63-4400', 'LR-63-HD', 'BSB-57'] },
    { account: 'RIM-006', name: 'Northline Aftermarket Supply', type: 'Aftermarket distributor', lineDiscountGroup: 'AM', items: ['TSR-49-3600', 'LR-63-HD', 'BSB-57'] },
    { account: 'RIM-007', name: 'Pacific Rim & Wheel Distributors', type: 'Aftermarket distributor', lineDiscountGroup: 'AM', items: ['TSR-63-4400', 'TSR-57-4000', 'LR-63-HD'] },
    { account: 'RIM-008', name: 'RMX2 Intercompany Sales', type: 'Intercompany', priceGroup: 'IC', floorExempt: true, items: ['TSR-63-4400', 'TSR-57-4000', 'TSR-49-3600', 'LR-63-HD', 'BSB-57'] },
  ],

  // Names, list prices and costs come from the item master, so the simulator
  // and the rest of the workspace can never disagree.
  items: Object.values(MASTER).map((m) => ({
    itemNumber: m.itemNumber,
    name: m.name,
    unit: m.unit,
    basePrice: m.list,
    unitCost: m.cost,
    lineDiscountGroup: m.discountGroup,
  })),

  agreements: [
    // ── TSR-63-4400 · as in the F&SC journal ──
    L('TA-001', 'price', 'Table', 'RIM-005', 'Table', 'TSR-63-4400', 21000, 0, { note: 'Customer price agreement' }),
    L('TA-002', 'price', 'Group', 'IC', 'Table', 'TSR-63-4400', 16457.18, 0, { note: 'Intercompany transfer price' }),
    L('TA-003', 'lineDiscount', 'Group', 'OP', 'Table', 'TSR-63-4400', 0, 5, { fromQty: 1, toQty: 10, note: 'Fleet operator quantity break' }),
    L('TA-004', 'lineDiscount', 'Group', 'OP', 'Table', 'TSR-63-4400', 0, 10, { fromQty: 10, note: 'Fleet operator quantity break' }),
    L('TA-005', 'lineDiscount', 'Group', 'SC', 'Table', 'TSR-63-4400', 0, 7, { note: 'Service center discount' }),
    L('TA-006', 'lineDiscount', 'Group', 'AM', 'Group', 'RIM', 0, 3, { note: 'Aftermarket discount on wheel assemblies' }),

    // ── TSR-57-4000 · customer discount with Find next off ──
    L('TA-010', 'price', 'Table', 'RIM-002', 'Table', 'TSR-57-4000', 17900, 0, { note: 'Customer price agreement' }),
    L('TA-011', 'price', 'Group', 'IC', 'Table', 'TSR-57-4000', 13010, 0, { note: 'Intercompany transfer price' }),
    L('TA-012', 'lineDiscount', 'Table', 'RIM-002', 'Table', 'TSR-57-4000', 0, 6, { findNext: false, note: 'Negotiated all-in discount — stops the search' }),
    L('TA-013', 'lineDiscount', 'Group', 'OP', 'Table', 'TSR-57-4000', 0, 4, { fromQty: 1, toQty: 8, note: 'Fleet operator quantity break' }),
    L('TA-014', 'lineDiscount', 'Group', 'OP', 'Table', 'TSR-57-4000', 0, 8, { fromQty: 8, note: 'Fleet operator quantity break' }),
    L('TA-015', 'lineDiscount', 'Group', 'SC', 'Table', 'TSR-57-4000', 0, 6, { note: 'Service center discount' }),

    // ── TSR-49-3600 · dated programs ──
    L('TA-020', 'price', 'Group', 'IC', 'Table', 'TSR-49-3600', 8820, 0, { note: 'Intercompany transfer price' }),
    L('TA-021', 'lineDiscount', 'Group', 'OP', 'Table', 'TSR-49-3600', 0, 5, { note: 'Fleet operator discount' }),
    L('TA-022', 'lineDiscount', 'Group', 'OP', 'Table', 'TSR-49-3600', 0, 4, { fromDate: iso(-60), toDate: iso(-8), note: 'Q3 fleet rebuild allowance' }),
    L('TA-023', 'lineDiscount', 'Group', 'SC', 'Table', 'TSR-49-3600', 0, 7, { note: 'Service center discount' }),
    L('TA-024', 'lineDiscount', 'Group', 'SC', 'Table', 'TSR-49-3600', 0, 3, { fromDate: iso(-20), toDate: iso(25), note: 'Q4 service-centre stocking program' }),

    // ── Components · CMP item discount group ──
    L('TA-030', 'price', 'All', '', 'Table', 'LR-63-HD', 2095, 0, { note: 'FY26 component list price' }),
    L('TA-031', 'price', 'Group', 'IC', 'Table', 'LR-63-HD', 1380, 0, { note: 'Intercompany transfer price' }),
    L('TA-032', 'price', 'Table', 'RIM-006', 'Table', 'BSB-57', 3150, 0, { note: 'Customer price agreement' }),
    L('TA-033', 'price', 'Group', 'IC', 'Table', 'BSB-57', 2540, 0, { note: 'Intercompany transfer price' }),
    L('TA-034', 'lineDiscount', 'Group', 'AM', 'Group', 'CMP', 0, 10, { note: 'Aftermarket discount on components' }),
    L('TA-035', 'lineDiscount', 'Group', 'SC', 'Group', 'CMP', 0, 5, { note: 'Service center discount on components' }),
    L('TA-036', 'lineDiscount', 'All', '', 'Group', 'CMP', 0, 5, { fromQty: 20, note: 'Component volume break — all customers' }),
  ],

  defaults: { customer: 'RIM-005', item: 'TSR-63-4400', qty: 4 },
}
