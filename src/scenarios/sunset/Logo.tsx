// ── SUNSET wordmark ─────────────────────────────────────────────────────
// A typeset wordmark beside a generic rising-sun glyph in SUNSET magenta.
// Deliberately not a reproduction of the SUNSET® logo artwork — swap in the
// official SVG in this file if Mastronardi supplies one. Rendered inline so
// the built app stays self-contained.

import type { LogoProps } from '../types'

const MAGENTA = '#d41367'

export function SunsetLogo({ height = 28, onDark = false, descriptor = false }: LogoProps) {
  const ink = onDark ? '#ffffff' : '#2a0f33'
  const grey = onDark ? '#d9c3df' : '#6f6475'
  const rays = [-90, -135, -45, -165, -15].map((deg) => {
    const a = (deg * Math.PI) / 180
    return {
      x1: 50 + Math.cos(a) * 34,
      y1: 62 + Math.sin(a) * 34,
      x2: 50 + Math.cos(a) * 44,
      y2: 62 + Math.sin(a) * 44,
    }
  })
  return (
    <span className="sunset-logo" role="img" aria-label="SUNSET" style={{ height, fontSize: height * 0.74 }}>
      <svg viewBox="0 0 100 80" height={height} aria-hidden="true" className="sunset-mark">
        <path d="M22 62a28 28 0 0 1 56 0z" fill={MAGENTA} />
        {rays.map((r, i) => (
          <line key={i} {...r} stroke={MAGENTA} strokeWidth="6" strokeLinecap="round" />
        ))}
        <line x1="12" y1="72" x2="88" y2="72" stroke={ink} strokeWidth="6" strokeLinecap="round" />
      </svg>
      <span className="sunset-text">
        <span className="sunset-wordmark" style={{ color: ink }}>
          SUNSET
        </span>
        {descriptor && (
          <span className="sunset-descriptor" style={{ color: grey }}>
            Greenhouse Grown
          </span>
        )}
      </span>
    </span>
  )
}
