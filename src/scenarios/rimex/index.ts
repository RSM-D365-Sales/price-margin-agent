// ── RIMEX · scenario entry ───────────────────────────────────────────────
// `npm run build:rimex` → dist-rimex/. Same engine, same numbers as the
// Bluestem build; brand, vocabulary and dataset are RIMEX's.

import './theme.css'
import type { Scenario } from '../types'
import { AS_OF, BRAND, FOODSERVICE_MARGIN_FLOOR, LINES, RETAIL_MARGIN_TARGET, seasonOf } from './config'
import { copy } from './copy'
import { data } from './data'
import { RimexLogo } from './Logo'

export const scenario: Scenario = {
  key: 'rimex',
  brand: BRAND,
  asOf: AS_OF,
  retailMarginTarget: RETAIL_MARGIN_TARGET,
  foodserviceMarginFloor: FOODSERVICE_MARGIN_FLOOR,
  seasonOf,
  lines: LINES,
  copy,
  Logo: RimexLogo,
  data,
}
