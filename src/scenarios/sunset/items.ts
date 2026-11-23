// ── SUNSET · item master ─────────────────────────────────────────────────
//
// ONE place for the name, pack, case list price and case cost of every item
// in the book: the twelve SUNSET® products the demo was asked to show.
// Pricing setup, overrides and price history all read from here, and
// data.ts asserts at load that no page shows a different cost or list price.
//
// Product names are SUNSET's own retail products. Pack configurations, case
// list prices and costs are synthetic (sunsetgrown.com does not publish pack
// sizes) — the case structures are typical for greenhouse retail packs.

import { LINES } from './config'

export interface MasterItem {
  itemNumber: string
  name: string
  category: 'Tomatoes' | 'Cucumbers' | 'Peppers' | 'Berries'
  productLine: string
  pack: string
  /** Case list price. */
  list: number
  /** Standard case cost. */
  cost: number
}

const CORE = LINES.commodity
const SPECIALTY = LINES.premium

const ITEMS: MasterItem[] = [
  // ── Core greenhouse · ~28–35% list margin ──
  { itemNumber: 'SG-TOM-ROM-3LB', name: 'Romana Tomatoes 3 lb', category: 'Tomatoes', productLine: CORE, pack: '8 × 3 lb', list: 22.5, cost: 15.8 },
  { itemNumber: 'SG-TOM-BEEF', name: 'Beefsteak Tomatoes', category: 'Tomatoes', productLine: CORE, pack: '15 lb carton', list: 21.0, cost: 14.2 },
  { itemNumber: 'SG-CUC-MINI', name: 'Mini Cucumbers', category: 'Cucumbers', productLine: CORE, pack: '12 × 1 lb', list: 19.2, cost: 13.4 },
  { itemNumber: 'SG-CUC-MINI-ORG', name: 'Organic Mini Cucumbers', category: 'Cucumbers', productLine: CORE, pack: '12 × 1 lb', list: 24.0, cost: 17.0 },
  { itemNumber: 'SG-PEP-BELL', name: 'Sweet Bell Peppers', category: 'Peppers', productLine: CORE, pack: '11 lb carton', list: 18.75, cost: 13.4 },
  { itemNumber: 'SG-PEP-BELL-3CT', name: 'Sweet Bell Peppers 3ct', category: 'Peppers', productLine: CORE, pack: '12 × 3 ct', list: 30.0, cost: 19.6 },

  // ── Specialty brands · ~38–41% list margin ──
  { itemNumber: 'SG-TOM-WW-2LB', name: 'Wild Wonders® Tomatoes 2 lb', category: 'Tomatoes', productLine: SPECIALTY, pack: '6 × 2 lb', list: 36.0, cost: 21.7 },
  { itemNumber: 'SG-TOM-ANGEL', name: 'Angel Sweet® Tomatoes', category: 'Tomatoes', productLine: SPECIALTY, pack: '12 × 10 oz', list: 29.6, cost: 17.5 },
  { itemNumber: 'SG-CUC-ORG-6CT', name: 'Organic Mini Cucumber 6ct', category: 'Cucumbers', productLine: SPECIALTY, pack: '12 × 6 ct', list: 27.6, cost: 17.0 },
  { itemNumber: 'SG-PEP-SHAZAM', name: 'SHAZAM!® Shishito Peppers', category: 'Peppers', productLine: SPECIALTY, pack: '12 × 6 oz', list: 32.4, cost: 19.5 },
  { itemNumber: 'SG-PEP-TWST-2LB', name: 'Sweet Twister™ Peppers 2 lb', category: 'Peppers', productLine: SPECIALTY, pack: '6 × 2 lb', list: 28.8, cost: 17.5 },
  { itemNumber: 'SG-BER-WOW-10OZ', name: 'WOW™ Dreamberry 10 oz', category: 'Berries', productLine: SPECIALTY, pack: '8 × 10 oz', list: 37.0, cost: 22.9 },
]

export type ItemNumber =
  | 'SG-TOM-ROM-3LB' | 'SG-TOM-BEEF' | 'SG-CUC-MINI' | 'SG-CUC-MINI-ORG' | 'SG-PEP-BELL' | 'SG-PEP-BELL-3CT'
  | 'SG-TOM-WW-2LB' | 'SG-TOM-ANGEL' | 'SG-CUC-ORG-6CT' | 'SG-PEP-SHAZAM' | 'SG-PEP-TWST-2LB' | 'SG-BER-WOW-10OZ'

export const MASTER = Object.fromEntries(ITEMS.map((i) => [i.itemNumber, i])) as Record<ItemNumber, MasterItem>

/** Identity fields + case cost for a pricing line, override or history record. */
export function item(n: ItemNumber) {
  const m = MASTER[n]
  return {
    itemName: m.name,
    itemNumber: m.itemNumber,
    category: m.category,
    productLine: m.productLine,
    pack: m.pack,
  }
}

/** Case list price from the master. */
export const listOf = (n: ItemNumber) => MASTER[n].list
/** Case cost from the master. */
export const costOf = (n: ItemNumber) => MASTER[n].cost
