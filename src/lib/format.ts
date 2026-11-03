// ── formatting helpers ────────────────────────────────────────
// Date helpers resolve against AS_OF, never the wall clock, so the demo
// looks identical whenever it is shown.

import { AS_OF, iso } from './config'

export function money(n: number, opts: { decimals?: number } = {}): string {
  const { decimals = 2 } = opts
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function money0(n: number): string {
  return money(n, { decimals: 0 })
}

export function pct(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`
}

export function num(n: number): string {
  return n.toLocaleString('en-US')
}

export { shortDate } from './dates'

/** The demo's "today". */
export function isoToday(): string {
  return AS_OF
}

export function isoDaysAgo(days: number): string {
  return iso(-days)
}

export function isoDaysAhead(days: number): string {
  return iso(days)
}
