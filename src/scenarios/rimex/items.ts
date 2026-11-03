// ── RIMEX · item master for wheels and rim components ────────────────────
//
// ONE place for the list price and cost of every wheel assembly and rim
// component. The Price Simulator, the pricing setup lines, overrides and price
// history all read from here, so an item can never show two different prices
// or costs on two pages (data.ts asserts it at load).
//
// TSR-63-4400's list price (24,875.59) is the base price from the RIMEX F&SC
// demo environment; the other list prices and all costs are synthetic.

export interface MasterItem {
  itemNumber: string
  name: string
  category: string
  pack: string
  unit: string
  /** Item sales price (list / base price). */
  list: number
  /** Standard cost per unit. */
  cost: number
  /** Item line discount group (trade agreements). */
  discountGroup: string
}

const item = (m: MasterItem) => m

export const MASTER: Record<string, MasterItem> = {
  'TSR-63-4400': item({ itemNumber: 'TSR-63-4400', name: '63" TSR Wheel Assembly — 44.00/5.0', category: 'Wheel assemblies', pack: 'assembly', unit: 'ea', list: 24875.59, cost: 15900, discountGroup: 'RIM' }),
  'TSR-57-4000': item({ itemNumber: 'TSR-57-4000', name: '57" TSR Wheel Assembly — 40.00/4.5', category: 'Wheel assemblies', pack: 'assembly', unit: 'ea', list: 19640, cost: 12450, discountGroup: 'RIM' }),
  'TSR-49-3600': item({ itemNumber: 'TSR-49-3600', name: '49" TSR Wheel Assembly — 36.00/4.0', category: 'Wheel assemblies', pack: 'assembly', unit: 'ea', list: 13280, cost: 8520, discountGroup: 'RIM' }),
  'LR-63-HD': item({ itemNumber: 'LR-63-HD', name: '63" Lock Ring — Heavy Duty', category: 'Rim components', pack: 'each', unit: 'ea', list: 2145, cost: 1310, discountGroup: 'CMP' }),
  'BSB-57': item({ itemNumber: 'BSB-57', name: '57" Bead Seat Band', category: 'Rim components', pack: 'each', unit: 'ea', list: 3480, cost: 2465, discountGroup: 'CMP' }),
}

/** The commodity product line — wheels, rim components and steel hardware. */
export const WHEELS_LINE = 'Wheels & hardware'

/** Identity fields for a pricing line / override / history record. */
export function wheel(itemNumber: keyof typeof MASTER) {
  const m = MASTER[itemNumber]
  return {
    itemName: m.name,
    itemNumber: m.itemNumber,
    category: m.category,
    productLine: WHEELS_LINE,
    pack: m.pack,
  }
}
