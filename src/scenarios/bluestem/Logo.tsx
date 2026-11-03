// ── bluestem logo lockup ────────────────────────────────────────────────
// Mark from bluestem_logo.svg in the brand kit: an RSM Blue stem rising into
// an RSM Green leaf. Wordmark splits by colour — "blue" in RSM Blue, "stem"
// in Midnight; on dark backgrounds "blue" turns white and "stem" turns green
// (BRAND_GUIDE.md). Rendered inline so the built artifact stays self-contained.

import type { LogoProps } from '../types'

interface BluestemLogoProps extends LogoProps {
  /** Rendered height of the lockup in px; the wordmark scales with it. */
  height?: number
  /** Use the on-Midnight colourway. */
  onDark?: boolean
  /** Show the "FRESH PRODUCE" descriptor under the wordmark. */
  descriptor?: boolean
}

export function BluestemLogo({ height = 28, onDark = false, descriptor = false }: BluestemLogoProps) {
  const blue = onDark ? '#ffffff' : '#009cde'
  const stem = onDark ? '#3f9c35' : '#00153d'
  const grey = onDark ? '#c9d1db' : '#888b8d'
  return (
    <span
      className="bluestem-logo"
      role="img"
      aria-label="bluestem Fresh Produce"
      style={{ height, fontSize: height * 0.82 }}
    >
      <svg viewBox="40 30 180 220" height={height} aria-hidden="true" className="bluestem-mark">
        <path d="M62 232 Q75 150 150 130" stroke="#009cde" strokeWidth="26" strokeLinecap="round" fill="none" />
        <g transform="translate(155 108) rotate(-45)">
          <path d="M-72 0 C-40 -50 40 -50 72 0 C40 50 -40 50 -72 0 Z" fill="#3f9c35" />
          <path d="M-45 0 L45 0" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
        </g>
      </svg>
      <span className="bluestem-text">
        <span className="bluestem-wordmark">
          <span style={{ color: blue }}>blue</span>
          <span style={{ color: stem }}>stem</span>
        </span>
        {descriptor && (
          <span className="bluestem-descriptor" style={{ color: grey }}>
            Fresh Produce
          </span>
        )}
      </span>
    </span>
  )
}
