// ── Bluestem · UI vocabulary ─────────────────────────────────────────────
// Every string here was lifted verbatim from the pages when the scenario
// layer was introduced, so the Bluestem build renders exactly as it did.

import type { ScenarioCopy } from '../types'

export const copy: ScenarioCopy = {
  modes: {
    Retail: {
      label: 'Retail',
      lower: 'retail',
      tab: 'Retail · Grocery, Club & E-commerce',
      agent: 'Retail Pricing Agent',
      kpiHeading: 'Retail KPIs the agent monitors',
    },
    Foodservice: {
      label: 'Foodservice',
      lower: 'foodservice',
      tab: 'Foodservice · Contracts',
      agent: 'Foodservice Contract Agent',
      kpiHeading: 'Foodservice contract KPIs the agent monitors',
    },
  },
  units: { plural: 'cases', pluralTitle: 'Cases', abbr: 'cs' },
  pool: {
    label: 'Grower pool share',
    inline: 'grower pool share',
    withShare: 'pooled',
    withoutShare: 'unpooled',
  },
  lifeSuffix: (days) => `of ${days}-day life`,
  orgRootName: 'All retail customers',
  regionsWord: 'states',
  shell: {
    navFoot: 'Guards margin across retail price groups, foodservice contracts, and grower pools.',
  },
  overview: {
    lede: (customers, contracts) =>
      `One place to audit order-line price overrides, stress-test discount thresholds, trace price history, and act on pricing guidance — across ${customers} retail customers and ${contracts} foodservice contracts, packed and shipped out of Grand Rapids, Hart and Holland.`,
    thresholdCard:
      'Find all pricing setup at or below a margin % across retail price groups and foodservice contracts — then let the agent draft new prices, uplifts, or discounts.',
    priceUpdatesCard:
      'Rank the retail book by case velocity, sell-through and days of cover, then roll a price change out to chosen customers or a segment — solved to a margin, or as a flat % move.',
    historyCard:
      'Audit report for one item and one price scope: Bluestem list, a customer price group, or one contract line — every change and the window it was live for.',
    recsCard:
      'Promotion timing, price holds and increases, short-life inventory, and foodservice contract guidance — grounded in the KPIs the agent monitors.',
    recsKpiSub: 'retail + foodservice agents',
    linesNote:
      'Fresh-cut absorbs a 15% promotion and still clears the floor. Packed fresh does not — a routine 10% deal takes it under, which is why every failing line is packed fresh.',
  },
  overrides: {
    lede: 'Every sales-order line where a rep typed over the system price, across retail and foodservice. Filtered to margins at or below your threshold, ranked lowest margin first. Packed-fresh items in a price group also show whether the override went under the floor.',
  },
  threshold: {
    /** Middle clause of the lede: "…across a date range — <this>. Select lines…" */
    lede: 'customer price groups and trade promotions on the retail side, contract lines with their floors and grower pool share on the foodservice side',
    contractHeader: 'Customer / Contract',
    foodserviceRepriceNote: 'Contract lines route through trade-agreement journal approval.',
  },
  priceUpdates: {
    lede: 'Rank the retail book by how it is actually shipping — case velocity, sell-through, and days of cover against shelf life — then push a price change to the customers you choose. The Margin Threshold Test asks which prices are too thin; this asks which prices the movement says are wrong.',
    itemPlaceholder: 'e.g. PK-BLU-PINT',
  },
  priceHistory: {
    lede: 'Pick an item (pack) and a price scope to see every price change — who changed it, why, and the window each price was live for. A scope is whatever the price is set against: Bluestem’s list price, a customer price group, or one customer’s contract line.',
  },
  recommendations: {
    lede: 'Objective: hold gross margin through the apple and squash harvest while keeping short-life product moving and trade spend where it earns. The agent monitors the KPIs below and proposes pricing, promotion, inventory, and contract moves — every action stays human-in-the-loop.',
  },
  setup: {
    foodserviceFloorLabel: 'Foodservice contract minimum margin % (VP Sales approval)',
  },
  reprice: {
    sub: 'The agent solves the chosen component so each line lands on its new price, measured against cost net of any grower pool share.',
  },
  agent: {
    suggestedPrompts: [
      'How many price overrides this month?',
      'Which override has the worst margin?',
      'Show pricing setup below 25% margin',
      'Are we below floor anywhere?',
      'What should we do about the blueberries?',
      'Summarize the foodservice contract recommendations',
    ],
    inventoryKeywords: ['blueberr', 'berry', 'shelf', 'cover', 'shrink'],
    contractKeywords: ['foodservice', 'contract', 'keystone', 'windy city', 'pool'],
    customerKeywords: ['customer', 'retailer', 'chain'],
    unitCost: 'case cost',
    commodityHits: (commodity, hits) =>
      `${commodity} of ${hits} are packed fresh, where list margin is thin enough that a routine deal crosses the floor. `,
    inventoryMeasured: (cover, life, price, margin) =>
      `Measured now: ${cover} days of cover against a ${life}-day shelf life, ` +
      `and the e-commerce price is already ${price} — exactly on its floor at ${margin} margin. ` +
      `Diverting to fresh-cut protects more margin than a deeper cut can.`,
    contractsHeader: (n) => `${n} open foodservice contract recommendations:`,
    pooledLines: (pooled, total) =>
      `${pooled} of ${total} priced lines currently carry a grower pool share. ` +
      `On pooled apples that share is the difference between a promotion that holds margin and one that does not.`,
    customersIntro: (customers, regions) =>
      `The retail book prices ${customers} ship-to customers across ${regions} states, plus the foodservice contracts.`,
    help:
      `I can help with:\n` +
      `· Override audit — "How many price overrides this month?"\n` +
      `· Threshold tests — "Show pricing setup below 20% margin"\n` +
      `· Price floors — "Are we below floor anywhere?"\n` +
      `· Short-life inventory — "What should we do about the blueberries?"\n` +
      `· Foodservice — "Summarize the foodservice contract recommendations"\n\n` +
      `Everything I answer is computed from the same data the dashboard uses.`,
  },
  reconciliation: {
    premiumAvg: 'Average margin · fresh-cut',
    commodityAvg: 'Average margin · packed fresh',
    customersLabel: 'Retail customers',
    contractsLabel: 'Foodservice contracts',
  },
}
