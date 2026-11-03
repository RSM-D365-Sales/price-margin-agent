// ── Pure date helpers ────────────────────────────────────────────────────
// No imports on purpose: scenario datasets build their dates with these at
// module load, before src/lib/config.ts has resolved which scenario is live.

/** Returns an `iso(offsetDays)` function anchored to `asOf` (negative = past). */
export function makeIso(asOf: string): (offsetDays?: number) => string {
  return (offsetDays = 0) => {
    const d = new Date(asOf + 'T00:00:00')
    d.setDate(d.getDate() + offsetDays)
    return d.toISOString().slice(0, 10)
  }
}

export function shortDate(value: string): string {
  const d = new Date(value + (value.length === 10 ? 'T00:00:00' : ''))
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
