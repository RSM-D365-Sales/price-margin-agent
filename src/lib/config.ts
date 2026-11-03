// ── Demo configuration ──────────────────────────────────────────────────
// Everything company-specific lives in the active scenario
// (src/scenarios/<key>/), which vite.config.ts aliases to `@scenario`.
// Retargeting this demo to a new prospect is a new scenario folder plus one
// build flag — see src/scenarios/types.ts. Pages import from here so they
// never know which company they are rendering.

import { scenario } from '@scenario'
import { makeIso } from './dates'

export const SCENARIO_KEY = scenario.key
export const BRAND = scenario.brand
export const COPY = scenario.copy
export const LINES = scenario.lines
export const Logo = scenario.Logo

/**
 * The "today" every date in this demo is anchored to. Never call `new Date()`
 * for business logic — demo kits get reused weeks later and stale windows are
 * the fastest way to lose the room. Set per scenario in its config.ts.
 */
export const AS_OF = scenario.asOf

/** Margin floors the guardrails default to. */
export const DEFAULT_RETAIL_MARGIN_TARGET = scenario.retailMarginTarget
export const DEFAULT_FOODSERVICE_MARGIN_FLOOR = scenario.foodserviceMarginFloor

/** ISO date `offsetDays` from AS_OF (negative = in the past). */
export const iso = makeIso(AS_OF)

/** Season label for a date, from the scenario's calendar. */
export const seasonOf = scenario.seasonOf

/** The season the demo opens in. */
export const CURRENT_SEASON = seasonOf(AS_OF)
