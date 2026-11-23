// ── SUNSET® (Mastronardi Produce) · scenario entry ───────────────────────
// `npm run build:sunset` → dist-sunset/. Published as its own Cloudflare
// Pages project, `greenhouse-price-margin`, so the URL carries no prospect
// name.

import './theme.css'
import type { Scenario } from '../types'
import { AS_OF, BRAND, FOODSERVICE_MARGIN_FLOOR, LINES, RETAIL_MARGIN_TARGET, seasonOf } from './config'
import { copy } from './copy'
import { data } from './data'
import { SunsetLogo } from './Logo'

export const scenario: Scenario = {
  key: 'sunset',
  brand: BRAND,
  asOf: AS_OF,
  retailMarginTarget: RETAIL_MARGIN_TARGET,
  foodserviceMarginFloor: FOODSERVICE_MARGIN_FLOOR,
  seasonOf,
  lines: LINES,
  copy,
  Logo: SunsetLogo,
  data,
  // Requested for the Mastronardi build: no floor KPI on the Overview, no
  // floor KPI or "below floor only" filter on the Override Audit. Floors
  // still drive the Margin Threshold Test and the reprice guardrail.
  ui: { overviewFloorKpi: false, overrideFloorFilter: false },
}
