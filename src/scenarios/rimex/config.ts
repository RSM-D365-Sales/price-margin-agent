// ── RIMEX · scenario config ──────────────────────────────────────────────
// Prospect: RIMEX (rimex.com) — wheels, rims and wheel-service hardware for
// surface mining, construction and agriculture, headquartered in Surrey, BC.
// Identity (teal #0095A1, tagline, RMX legal entity, Surrey plant) follows the
// earlier RIMEX build of the Make-Buy demo and the RIMEX scenario of the
// Fabric cost tracker, so the demos read as one shop.
//
// RIMEX appears only as the tenant that owns the data. Every customer, rep
// and contract in data.ts is fictional — they are the ones the demo shows
// pricing below floor. The signed-in persona is fictional too.
//
// Kept free of imports so data.ts can read AS_OF at module load.

export const BRAND = {
  name: 'RIMEX',
  legalName: 'RIMEX',
  short: 'RIMEX',
  tagline: 'Better wheels. Built strong with proven performance.',
  site: 'rimex.com',
  legalEntity: 'RMX',
  emailDomain: 'rimex.com',
  d365UrlPlaceholder: 'https://rimex-prod.operations.dynamics.com',
  possessive: 'RIMEX’s',
  persona: { name: 'Dana Whitford', initials: 'DW', title: 'VP Sales', site: 'SUR' },
}

/**
 * The demo's "today". Every order date, price window and promotion window in
 * data.ts is an offset from this value — move it before the meeting and the
 * whole book slides with it.
 */
export const AS_OF = '2026-11-03'

/**
 * 25% order-line floor; fleet contracts can be approved down to 20% by the
 * VP Sales. Same guardrails as the default scenario, so the beats hold.
 */
export const RETAIL_MARGIN_TARGET = 25
export const FOODSERVICE_MARGIN_FLOOR = 20

/**
 * Selling calendar for a wheel-hardware book across mining, construction and
 * ag: winter shutdowns are when haul fleets rebuild, spring is the
 * construction ramp, fall is ag harvest plus pre-winter stocking for northern
 * sites before the freeze.
 */
export function seasonOf(isoDate: string): string {
  const m = Number(isoDate.slice(5, 7))
  if (m >= 3 && m <= 5) return 'Spring Construction Ramp'
  if (m >= 6 && m <= 8) return 'Peak Construction & Haulage'
  if (m >= 9 && m <= 11) return 'Harvest & Pre-Winter Stocking'
  return 'Winter Shutdown & Rebuild'
}

/**
 * Service kits (SK-*) are RIMEX-engineered seal, valve and rebuild kits —
 * value-added, ~38–44% list margin. Wheel hardware (HW-*) is steel: wedges,
 * studs, clamps, bolts and rings, priced off the mill index at ~28–32%.
 */
export const LINES = { premium: 'Service kits', commodity: 'Wheel hardware' }
