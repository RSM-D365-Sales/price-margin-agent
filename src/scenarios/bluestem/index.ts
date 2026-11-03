// ── Bluestem Fresh Produce · scenario entry ──────────────────────────────
// Default scenario: `npm run build` / `npm run dev`. This is what main and the
// production Cloudflare Pages deployment (price-margin-agent) serve, and what
// the IFPA booth kit in demo-kit/ was recorded against.

import './theme.css'
import type { Scenario } from '../types'
import { AS_OF, BRAND, FOODSERVICE_MARGIN_FLOOR, LINES, RETAIL_MARGIN_TARGET, seasonOf } from './config'
import { copy } from './copy'
import { data } from './data'
import { BluestemLogo } from './Logo'

export const scenario: Scenario = {
  key: 'bluestem',
  brand: BRAND,
  asOf: AS_OF,
  retailMarginTarget: RETAIL_MARGIN_TARGET,
  foodserviceMarginFloor: FOODSERVICE_MARGIN_FLOOR,
  seasonOf,
  lines: LINES,
  copy,
  Logo: BluestemLogo,
  data,
}
