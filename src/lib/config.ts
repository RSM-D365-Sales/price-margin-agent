// ── Demo configuration ──────────────────────────────────────────────────
// Retargeting this demo to a new prospect or a new date should be an edit
// to THIS FILE plus src/data/mockData.ts — nothing else.

/** Brand the workspace is built for. */
export const BRAND = {
  name: "Alvin's Island",
  short: 'ALVIN’S ISLAND',
  tagline: 'Sun, sand & style',
  site: 'alvinsisland.com',
  legalEntity: 'ALVI',
  emailDomain: 'alvinsisland.com',
} as const

/**
 * The "today" every date in this demo is anchored to. Never call `new Date()`
 * for business logic — demo kits get reused weeks later and stale windows are
 * the fastest way to lose the room. Move this one value and the whole dataset
 * (order dates, price validity, markdown waves, aging) slides with it.
 */
export const AS_OF = '2026-09-01'

/** Margin floors the guardrails default to. */
export const DEFAULT_RETAIL_MARGIN_TARGET = 45
export const DEFAULT_VENDOR_MARGIN_FLOOR = 38

/** ISO date `offsetDays` from AS_OF (negative = in the past). */
export function iso(offsetDays = 0): string {
  const d = new Date(AS_OF + 'T00:00:00')
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

/** Retail season label for a date, driven by AS_OF's calendar — not hardcoded. */
export function seasonOf(isoDate: string): string {
  const m = Number(isoDate.slice(5, 7))
  if (m >= 3 && m <= 4) return 'Spring Break'
  if (m >= 5 && m <= 8) return 'Peak Summer'
  if (m === 9 || m === 10) return 'Post-Labor Day'
  return 'Snowbird'
}

/** The season the demo opens in. */
export const CURRENT_SEASON = seasonOf(AS_OF)
