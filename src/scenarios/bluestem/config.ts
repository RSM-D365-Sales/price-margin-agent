// ── Bluestem Fresh Produce · scenario config ─────────────────────────────
// RSM's fictional mock company for the IFPA show circuit. Identity, palette,
// and header rules come from ../Blustem-company-details/BRAND_GUIDE.md (note
// the folder spelling); the persona is from employees.csv in the same kit.
//
// Kept free of imports so data.ts can read AS_OF at module load.

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
  d365UrlPlaceholder: 'https://bluestem-prod.operations.dynamics.com',
  possessive: 'Bluestem’s',
  /** Who is signed in. From the Bluestem employees list — pricing sits under Sales. */
  persona: { name: 'Priya Nair', initials: 'PN', title: 'VP Sales', site: 'GRP' },
}

/**
 * The IFPA booth kit (demo-kit/scenes.mjs, cheat-sheet.html) quotes figures
 * tied to this date — moving it means re-checking them and re-recording.
 */
export const AS_OF = '2026-10-08'

/**
 * 25% is Bluestem's order-line floor (FloorPct in the brand kit's
 * price_margin_alerts.csv); foodservice contracts can be approved down to 20%
 * by the VP Sales.
 */
export const RETAIL_MARGIN_TARGET = 25
export const FOODSERVICE_MARGIN_FLOOR = 20

/**
 * Michigan harvest-calendar season for a date. Winter volume comes from
 * partner growers in CA, AZ and MX.
 */
export function seasonOf(isoDate: string): string {
  const m = Number(isoDate.slice(5, 7))
  if (m >= 4 && m <= 6) return 'Asparagus & Early Berry'
  if (m === 7 || m === 8) return 'Blueberry & Sweet Corn'
  if (m >= 9 && m <= 11) return 'Apple & Squash Harvest'
  return 'Winter Partner Supply'
}

/**
 * Fresh-cut (FC-*) is value-added at the Grand Rapids plant and lists at
 * ~38–44%. Packed fresh (PK-*) is whole produce in a pouch, clamshell or
 * carton and lists at ~28–32%.
 */
export const LINES = { premium: 'Fresh-cut', commodity: 'Packed fresh' }
