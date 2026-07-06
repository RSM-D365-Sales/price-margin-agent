// ── formatting helpers (mirrors lib/format.ts in the Consignment app) ──

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

export function shortDate(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''))
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function isoToday(): string {
  return new Date().toISOString().slice(0, 10)
}

export function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}
