// ── SUNSET · UI vocabulary ───────────────────────────────────────────────
// Same structure as the Bluestem copy; retail channels are Grocery,
// Wholesale, Natural and E-commerce, and the value-added line is the
// specialty brands rather than fresh-cut.

import type { ScenarioCopy } from '../types'

export const copy: ScenarioCopy = {
  modes: {
    Retail: {
      label: 'Retail',
      lower: 'retail',
      tab: 'Retail · Grocery, Wholesale & E-commerce',
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
    label: 'Partner-grower share',
    inline: 'partner-grower share',
    withShare: 'with share',
    withoutShare: 'without share',
  },
  lifeSuffix: (days) => `of ${days}-day life`,
  orgRootName: 'All retail customers',
  regionsWord: 'states and provinces',
  shell: {
    navFoot: 'Guards margin across retail price groups, wholesale programs, and foodservice contracts.',
  },
  overview: {
    eyebrow: 'Mastronardi Produce',
    lede: (customers, contracts) =>
      `One place to audit order-line price overrides, stress-test discount thresholds, trace price history, and act on pricing guidance — across ${customers} retail and wholesale customers and ${contracts} foodservice contracts for SUNSET® greenhouse tomatoes, cucumbers, peppers and berries.`,
    thresholdCard:
      'Find all pricing setup at or below a margin % across retail and wholesale price groups and foodservice contracts — then let the agent draft new prices, uplifts, or discounts.',
    priceUpdatesCard:
      'Rank the retail and wholesale book by case velocity, sell-through and days of cover, then roll a price change out to chosen customers or a segment — solved to a margin, or as a flat % move.',
    historyCard:
      'Audit report for one item and one price scope: SUNSET list, a customer price group, or one contract line — every change and the window it was live for.',
    recsCard:
      'Promotion timing, price holds and increases, short-life inventory, and foodservice contract guidance — grounded in the KPIs the agent monitors.',
    recsKpiSub: 'retail + foodservice agents',
    linesNote:
      'Specialty brands absorb a 15% promotion and still clear the floor. Core greenhouse does not — a routine 8–15% deal takes it under, which is why every failing line is core greenhouse.',
  },
  overrides: {
    lede: 'Every sales-order line where a rep typed over the system price, across retail, wholesale and foodservice. Filtered to margins at or below your threshold, ranked lowest margin first.',
  },
  threshold: {
    /** Middle clause of the lede: "…across a date range — <this>. Select lines…" */
    lede: 'customer price groups and trade promotions on the retail and wholesale side, contract lines with their floors and partner-grower share on the foodservice side',
    contractHeader: 'Customer / Contract',
    foodserviceRepriceNote: 'Contract lines route through trade-agreement journal approval.',
  },
  priceUpdates: {
    lede: 'Rank the retail and wholesale book by how it is actually shipping — case velocity, sell-through, and days of cover against shelf life — then push a price change to the customers you choose. The Margin Threshold Test asks which prices are too thin; this asks which prices the movement says are wrong.',
    itemPlaceholder: 'e.g. SG-BER-WOW-10OZ',
  },
  priceHistory: {
    lede: 'Pick an item (pack) and a price scope to see every price change — who changed it, why, and the window each price was live for. A scope is whatever the price is set against: SUNSET’s list price, a customer price group, or one customer’s contract line.',
  },
  recommendations: {
    lede: 'Objective: hold gross margin through the winter lit-greenhouse season while keeping short-life product moving and trade spend where it earns. The agent monitors the KPIs below and proposes pricing, promotion, inventory, and contract moves — every action stays human-in-the-loop.',
  },
  setup: {
    foodserviceFloorLabel: 'Foodservice contract minimum margin % (VP Sales approval)',
  },
  reprice: {
    sub: 'The agent solves the chosen component so each line lands on its new price, measured against cost net of any partner-grower share.',
  },
  agent: {
    suggestedPrompts: [
      'How many price overrides this month?',
      'Which override has the worst margin?',
      'Show pricing setup below 25% margin',
      'What should we do about the Dreamberries?',
      'Summarize the foodservice contract recommendations',
    ],
    inventoryKeywords: ['dreamberr', 'berry', 'berries', 'shelf', 'cover', 'shrink'],
    contractKeywords: ['foodservice', 'contract', 'keystone', 'windy city', 'grower share', 'partner'],
    customerKeywords: ['customer', 'retailer', 'chain', 'wholesale'],
    unitCost: 'case cost',
    commodityHits: (commodity, hits) =>
      `${commodity} of ${hits} are core greenhouse, where list margin is thin enough that a routine deal crosses the floor. `,
    inventoryMeasured: (cover, life, price, margin) =>
      `Measured now: ${cover} days of cover against a ${life}-day shelf life, ` +
      `and the e-commerce price is already ${price} — exactly on its floor at ${margin} margin. ` +
      `Moving the surplus through wholesale protects more margin than a deeper cut can.`,
    contractsHeader: (n) => `${n} open foodservice contract recommendations:`,
    pooledLines: (pooled, total) =>
      `${pooled} of ${total} priced lines currently carry a partner-grower share. ` +
      `On promoted core tomatoes that share is the difference between a promotion that holds margin and one that does not.`,
    customersIntro: (customers, regions) =>
      `The retail book prices ${customers} ship-to customers across ${regions} states and provinces, plus the foodservice contracts.`,
    help:
      `I can help with:\n` +
      `· Override audit — "How many price overrides this month?"\n` +
      `· Threshold tests — "Show pricing setup below 20% margin"\n` +
      `· Short-life inventory — "What should we do about the Dreamberries?"\n` +
      `· Foodservice — "Summarize the foodservice contract recommendations"\n\n` +
      `Everything I answer is computed from the same data the dashboard uses.`,
  },
  reconciliation: {
    premiumAvg: 'Average margin · specialty brands',
    commodityAvg: 'Average margin · core greenhouse',
    customersLabel: 'Retail & wholesale customers',
    contractsLabel: 'Foodservice contracts',
  },
}
