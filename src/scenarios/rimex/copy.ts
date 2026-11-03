// ── RIMEX · UI vocabulary ────────────────────────────────────────────────
// The two books are dealers (the price-group book: mining dealers, national
// accounts, ag dealers, online parts) and fleet contracts (mine sites,
// quarries, haulage and earthworks contractors). Units, not cases.

import type { ScenarioCopy } from '../types'

export const copy: ScenarioCopy = {
  modes: {
    Retail: {
      label: 'Dealer',
      lower: 'dealer',
      tab: 'Dealers · Mining, National & Ag',
      agent: 'Dealer Pricing Agent',
      kpiHeading: 'Dealer KPIs the agent monitors',
    },
    Foodservice: {
      label: 'Fleet',
      lower: 'fleet',
      tab: 'Fleet · Contracts',
      agent: 'Fleet Contract Agent',
      kpiHeading: 'Fleet contract KPIs the agent monitors',
    },
  },
  units: { plural: 'units', pluralTitle: 'Units', abbr: 'units' },
  pool: {
    label: 'Mill program share',
    inline: 'mill program share',
    withShare: 'mill-funded',
    withoutShare: 'before mill share',
  },
  lifeSuffix: (days) => `of ${days}-day window`,
  orgRootName: 'All dealers',
  regionsWord: 'states and provinces',
  shell: {
    navFoot: 'Guards margin across dealer price groups, fleet contracts, and mill-funded programs.',
  },
  overview: {
    lede: (customers, contracts) =>
      `One place to audit order-line price overrides, stress-test discount thresholds, trace price history, and act on pricing guidance — across ${customers} dealers and ${contracts} fleet contracts, built and shipped out of Surrey, BC.`,
    thresholdCard:
      'Find all pricing setup at or below a margin % across dealer price groups and fleet contracts — then let the agent draft new prices, uplifts, or discounts.',
    priceUpdatesCard:
      'Rank the dealer book by unit velocity, sell-through and days of cover, then roll a price change out to chosen dealers or a segment — solved to a margin, or as a flat % move.',
    historyCard:
      'Audit report for one item and one price scope: RIMEX list, a dealer price group, or one contract line — every change and the window it was live for.',
    recsCard:
      'Promotion timing, price holds and increases, seasonal inventory, and fleet contract guidance — grounded in the KPIs the agent monitors.',
    recsKpiSub: 'dealer + fleet agents',
    linesNote:
      'Service kits absorb a 15% promotion and still clear the floor. Wheels and hardware run thinner — a 15% allowance on an assembly or a routine 10% deal on hardware takes them under, which is why every failing line is in that book.',
  },
  overrides: {
    lede: 'Every sales-order line where a rep typed over the system price, across dealers and fleet contracts. Filtered to margins at or below your threshold, ranked lowest margin first. Wheels and hardware in a dealer price group also show whether the override went under the floor.',
  },
  threshold: {
    lede: 'dealer price groups and trade promotions on the dealer side, contract lines with their floors and mill program share on the fleet side',
    contractHeader: 'Customer / Contract',
    foodserviceRepriceNote: 'Contract lines route through trade-agreement journal approval.',
  },
  priceUpdates: {
    lede: 'Rank the dealer book by how it is actually shipping — unit velocity, sell-through, and days of cover against the selling window — then push a price change to the dealers you choose. The Margin Threshold Test asks which prices are too thin; this asks which prices the movement says are wrong.',
    itemPlaceholder: 'e.g. HW-DCL-AG',
  },
  priceHistory: {
    lede: 'Pick an item (pack) and a price scope to see every price change — who changed it, why, and the window each price was live for. A scope is whatever the price is set against: RIMEX’s list price, a dealer price group, or one customer’s contract line.',
  },
  recommendations: {
    lede: 'Objective: hold gross margin through harvest and pre-winter stocking while keeping seasonal stock moving and trade spend where it earns. The agent monitors the KPIs below and proposes pricing, promotion, inventory, and contract moves — every action stays human-in-the-loop.',
  },
  setup: {
    foodserviceFloorLabel: 'Fleet contract minimum margin % (VP Sales approval)',
  },
  reprice: {
    sub: 'The agent solves the chosen component so each line lands on its new price, measured against cost net of any mill program share.',
  },
  agent: {
    suggestedPrompts: [
      'How many price overrides this month?',
      'Which override has the worst margin?',
      'Show pricing setup below 25% margin',
      'Are we below floor anywhere?',
      'What should we do about the ag clamp sets?',
      'Summarize the fleet contract recommendations',
    ],
    // No bare "ag" — it would match "agent" and "average".
    inventoryKeywords: ['clamp', 'dual', 'harvest', 'cover', 'aged stock', 'window'],
    contractKeywords: ['fleet', 'contract', 'keystone', 'tamarack', 'mill'],
    customerKeywords: ['customer', 'dealer', 'account'],
    unitCost: 'unit cost',
    commodityHits: (commodity, hits) =>
      `${commodity} of ${hits} are wheels & hardware, where list margin is thin enough that a routine deal crosses the floor. `,
    inventoryMeasured: (cover, life, price, margin) =>
      `Measured now: ${cover} days of cover against ${life} days left in the selling window, ` +
      `and the online parts price is already ${price} — exactly on its floor at ${margin} margin. ` +
      `Kitting the surplus into service kits protects more margin than a deeper cut can.`,
    contractsHeader: (n) => `${n} open fleet contract recommendations:`,
    pooledLines: (pooled, total) =>
      `${pooled} of ${total} priced lines currently carry a mill program share. ` +
      `On steel items that share is the difference between a promotion that holds margin and one that does not.`,
    customersIntro: (customers, regions) =>
      `The dealer book prices ${customers} dealers across ${regions} states and provinces, plus the fleet contracts.`,
    help:
      `I can help with:\n` +
      `· Override audit — "How many price overrides this month?"\n` +
      `· Threshold tests — "Show pricing setup below 20% margin"\n` +
      `· Price floors — "Are we below floor anywhere?"\n` +
      `· Seasonal inventory — "What should we do about the ag clamp sets?"\n` +
      `· Fleet — "Summarize the fleet contract recommendations"\n\n` +
      `Everything I answer is computed from the same data the dashboard uses.`,
  },
  reconciliation: {
    premiumAvg: 'Average margin · service kits',
    commodityAvg: 'Average margin · wheels & hardware',
    customersLabel: 'Dealers',
    contractsLabel: 'Fleet contracts',
  },
}
