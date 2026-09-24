// ── Demo configuration ──────────────────────────────────────────────────
// Retargeting this demo to a new prospect or a new date should be an edit
// to THIS FILE plus src/data/mockData.ts — nothing else.

/**
 * Brand the workspace is built for.
 *
 * Bluestem Fresh Produce is RSM's fictional mock company for the IFPA show
 * circuit. Identity, palette, and header rules come from
 * ../Blustem-company-details/BRAND_GUIDE.md (note the folder spelling); the
 * persona is from employees.csv in the same kit.
 */
export const BRAND = {
  /** Wordmark is lowercase by brand rule. */
  name: 'bluestem',
  legalName: 'Bluestem Fresh Produce, Inc.',
  short: 'BLUESTEM',
  /** App one-liner from PUN_BANK.md — "Price Margin Alert". */
  tagline: 'Catch thin margins before they beet you.',
  site: 'bluestemfresh.com',
  legalEntity: 'BSFP',
  emailDomain: 'bluestemfresh.com',
  /** Who is signed in. From the Bluestem employees list — pricing sits under Sales. */
  persona: { name: 'Priya Nair', initials: 'PN', title: 'VP Sales', site: 'GRP' },
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
