// ── Scenario contract ────────────────────────────────────────────────────
//
// A scenario is everything that makes this workspace belong to one company:
// brand, persona, as-of date, season calendar, UI vocabulary, logo, theme
// tokens and the dataset. The pricing engine, margin math, shipment generator
// and reconciliation are shared code — a scenario only feeds them.
//
// Exactly one scenario is compiled into a build. vite.config.ts aliases
// `@scenario` to src/scenarios/<key>/ (selected by `--mode <key>` or
// VITE_SCENARIO, default `bluestem`), so a RIMEX build carries no Bluestem
// data and vice versa.
//
// Internal keys are shared across scenarios and never shown as-is:
//   mode      'Retail' | 'Foodservice'  — the two pricing books. Display
//             names come from copy.modes.
//   lines     every PricingSetupLine.productLine is either lines.premium (the
//             value-added line that absorbs a promotion) or lines.commodity
//             (the thin line a routine deal pushes under the floor).
//   ids       REC-RTL-5 (inventory-driven rec) and PRC-RTL-05 (its pricing
//             line) are looked up by id from the assistant — keep them.
//
// To dress the demo for a new prospect: copy src/scenarios/rimex/, replace
// brand, copy and data, register the key in vite.config.ts, add the
// package.json scripts. Anything portrayed as failing, at risk or leaking
// margin must be a fictional entity (customers, reps, suppliers); real
// prospect branding is for the tenant that owns the data only.

import type { ComponentType } from 'react'
import type {
  CustomerLocation,
  KpiMonitor,
  PriceHistoryRecord,
  PriceOverride,
  PricingSetupLine,
  Recommendation,
} from '../models/types'
import type { SimulatorData } from '../models/tradeAgreements'

export interface ScenarioBrand {
  /** Wordmark text, in the brand's own casing. */
  name: string
  legalName: string
  short: string
  /** One-liner under the nav. */
  tagline: string
  site: string
  legalEntity: string
  emailDomain: string
  /** Placeholder shown in the Setup page's environment URL field. */
  d365UrlPlaceholder: string
  /** Possessive used in prose: "Bluestem's", "RIMEX's". */
  possessive: string
  /** Who is signed in. */
  persona: { name: string; initials: string; title: string; site: string }
}

export interface LogoProps {
  height?: number
  onDark?: boolean
  descriptor?: boolean
}

export interface ItemProfile {
  /** Units/day at an average customer in a 1.0 month. */
  base: number
  /** Key into ShipmentModel.seasonCurves. */
  season: string
  /** Days of cover the item is carrying at its recent run rate. */
  coverDays: number
  /** Days of life the cover is measured against (shelf life, season window). */
  shelfLifeDays: number
}

export interface ShipmentModel {
  /** Demand curve by calendar month, Jan..Dec. */
  seasonCurves: Record<string, readonly number[]>
  /** Profile for every retail-priced item number. */
  itemProfile: Record<string, ItemProfile>
  /** Relative size of each retail customer, by customer code. */
  customerWeight: Record<string, number>
  /** Day-of-week factor, Sun..Sat. */
  dowFactor: readonly number[]
}

export interface FoodserviceContract {
  account: string
  customer: string
  contract: string
}

export interface ScenarioData {
  customers: CustomerLocation[]
  segments: { code: string; name: string }[]
  contracts: readonly FoodserviceContract[]
  overrides: PriceOverride[]
  pricingSetup: PricingSetupLine[]
  priceHistory: PriceHistoryRecord[]
  recommendations: Recommendation[]
  retailKpis: KpiMonitor[]
  foodserviceKpis: KpiMonitor[]
  categories: readonly string[]
  shipments: ShipmentModel
  /** Trade agreement journal for the Price Simulator page. Absent → page hidden. */
  simulator?: SimulatorData
}

/** Every piece of UI wording that names the industry. */
export interface ScenarioCopy {
  /** Display names for the two pricing books. */
  modes: {
    Retail: { label: string; lower: string; tab: string; agent: string; kpiHeading: string }
    Foodservice: { label: string; lower: string; tab: string; agent: string; kpiHeading: string }
  }
  units: {
    /** "cases" */
    plural: string
    /** "Cases" */
    pluralTitle: string
    /** "cs" — after a quantity in dense rows. */
    abbr: string
  }
  pool: {
    /** "Grower pool share" */
    label: string
    /** "grower pool share" — mid-sentence. */
    inline: string
    /** "pooled" / "unpooled" next to a margin. */
    withShare: string
    withoutShare: string
  }
  /** "of 12-day life" under a days-of-cover figure. */
  lifeSuffix: (days: number) => string
  /** Root of the customer hierarchy picker. */
  orgRootName: string
  /** "states", "states and provinces". */
  regionsWord: string
  shell: { navFoot: string }
  overview: {
    lede: (customers: number, contracts: number) => string
    thresholdCard: string
    priceUpdatesCard: string
    historyCard: string
    recsCard: string
    recsKpiSub: string
    linesNote: string
  }
  overrides: { lede: string }
  threshold: { lede: string; contractHeader: string; foodserviceRepriceNote: string }
  priceUpdates: { lede: string; itemPlaceholder: string }
  priceHistory: { lede: string }
  recommendations: { lede: string }
  setup: { foodserviceFloorLabel: string }
  reprice: { sub: string }
  agent: {
    suggestedPrompts: string[]
    /** Words that route a question to the inventory-driven recommendation. */
    inventoryKeywords: string[]
    /** Words that route a question to the contract summary. */
    contractKeywords: string[]
    customerKeywords: string[]
    /** Unit-cost noun in the worst-override answer: "case cost". */
    unitCost: string
    commodityHits: (commodity: number, hits: number) => string
    inventoryMeasured: (cover: string, life: number | undefined, price: string, margin: string) => string
    contractsHeader: (n: number) => string
    pooledLines: (pooled: number, total: number) => string
    customersIntro: (customers: number, regions: number) => string
    help: string
  }
  reconciliation: {
    premiumAvg: string
    commodityAvg: string
    customersLabel: string
    contractsLabel: string
  }
}

export interface Scenario {
  key: string
  brand: ScenarioBrand
  /**
   * The "today" every date in the dataset is anchored to. Never call
   * `new Date()` for business logic — move this one value and the whole book
   * slides with it.
   */
  asOf: string
  retailMarginTarget: number
  foodserviceMarginFloor: number
  /** Season label for a date, driven by the calendar — not hardcoded. */
  seasonOf: (isoDate: string) => string
  lines: { premium: string; commodity: string }
  copy: ScenarioCopy
  Logo: ComponentType<LogoProps>
  data: ScenarioData
}
