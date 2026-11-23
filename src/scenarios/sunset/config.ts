// ── SUNSET® (Mastronardi Produce) · scenario config ──────────────────────
// Prospect: Mastronardi Produce Ltd., which markets its greenhouse tomatoes,
// cucumbers, peppers and WOW® berries under the SUNSET® brand
// (sunsetgrown.com). Palette follows the live sunsetgrown.com stylesheet:
// SUNSET magenta #D41367 on the nav and buttons, purple #863399 / #6A167D as
// the secondary accent.
//
// Mastronardi appears only as the tenant that owns the data. Every customer,
// contract, rep and the signed-in persona in data.ts are fictional — they are
// the ones the demo shows pricing under the floor.
//
// Kept free of imports so data.ts can read AS_OF at module load.

export const BRAND = {
  name: 'SUNSET',
  legalName: 'Mastronardi Produce Ltd.',
  short: 'SUNSET',
  tagline: 'Greenhouse-grown flavour, priced to protect margin.',
  site: 'sunsetgrown.com',
  legalEntity: 'MPL',
  emailDomain: 'sunsetgrown.com',
  d365UrlPlaceholder: 'https://mastronardi-prod.operations.dynamics.com',
  possessive: 'SUNSET’s',
  persona: { name: 'Jordan Reyes', initials: 'JR', title: 'VP Sales', site: 'KGV' },
}

/**
 * The demo's "today". Every order date, price window and promotion window in
 * data.ts is an offset from this value — move it before the meeting and the
 * whole book slides with it.
 */
export const AS_OF = '2026-11-23'

/** Same guardrails as the default scenario, so the beats hold. */
export const RETAIL_MARGIN_TARGET = 25
export const FOODSERVICE_MARGIN_FLOOR = 20

/**
 * Greenhouse calendar. Product ships year-round; what moves is light, yield
 * and cost — winter runs under supplemental lighting, summer is peak volume.
 */
export function seasonOf(isoDate: string): string {
  const m = Number(isoDate.slice(5, 7))
  if (m >= 3 && m <= 5) return 'Spring Greenhouse Ramp-up'
  if (m >= 6 && m <= 8) return 'Summer Peak Volume'
  if (m === 9 || m === 10) return 'Fall Crop Changeover'
  return 'Winter Lit-Greenhouse Season'
}

/**
 * Specialty brands (Wild Wonders®, Angel Sweet®, SHAZAM!®, Sweet Twister™,
 * WOW™ Dreamberry, Organic Mini Cucumber 6ct) list at ~38–41% margin.
 * Core greenhouse (Romana, Beefsteak, Sweet Bell, Mini Cucumbers) lists at
 * ~28–35%. Must match the productLine values in ./items.ts.
 */
export const LINES = { premium: 'Specialty brands', commodity: 'Core greenhouse' }
