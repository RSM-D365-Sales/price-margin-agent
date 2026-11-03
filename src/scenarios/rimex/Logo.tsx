// ── RIMEX wordmark ──────────────────────────────────────────────────────
// A plain typeset wordmark beside a generic wheel glyph (rim, bead seat,
// hub, bolt circle) in RIMEX teal. Deliberately not a reproduction of the
// RIMEX logo artwork — swap in the official SVG if RIMEX supplies one.
// Rendered inline so the built app stays self-contained.

import type { LogoProps } from '../types'

const TEAL = '#0095a1'

export function RimexLogo({ height = 28, onDark = false, descriptor = false }: LogoProps) {
  const ink = onDark ? '#ffffff' : '#14181a'
  const grey = onDark ? '#a9b2b5' : '#6f7375'
  const bolts = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4
    return { cx: 50 + Math.cos(a) * 20, cy: 50 + Math.sin(a) * 20 }
  })
  return (
    <span className="rimex-logo" role="img" aria-label="RIMEX" style={{ height, fontSize: height * 0.78 }}>
      <svg viewBox="0 0 100 100" height={height} aria-hidden="true" className="rimex-mark">
        <circle cx="50" cy="50" r="44" fill="none" stroke={TEAL} strokeWidth="10" />
        <circle cx="50" cy="50" r="31" fill="none" stroke={TEAL} strokeWidth="3" opacity="0.6" />
        <circle cx="50" cy="50" r="11" fill={TEAL} />
        {bolts.map((b, i) => (
          <circle key={i} cx={b.cx} cy={b.cy} r="3.6" fill={onDark ? '#ffffff' : '#14181a'} />
        ))}
      </svg>
      <span className="rimex-text">
        <span className="rimex-wordmark" style={{ color: ink }}>
          RIMEX
        </span>
        {descriptor && (
          <span className="rimex-descriptor" style={{ color: grey }}>
            Wheels &amp; Rims
          </span>
        )}
      </span>
    </span>
  )
}
