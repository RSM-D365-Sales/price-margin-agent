import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { ChatPanel } from './ChatPanel'
import { BluestemLogo } from './BluestemLogo'
import { AS_OF, BRAND, CURRENT_SEASON } from '../lib/config'
import { shortDate } from '../lib/format'
import rsmLogoWhite from '../assets/rsmus-logo-white.png'

const NAV = [
  { to: '/', label: 'Overview', glyph: '◈', end: true },
  { to: '/overrides', label: 'Override Audit', glyph: '✎' },
  { to: '/threshold-test', label: 'Margin Threshold Test', glyph: '◮' },
  { to: '/price-updates', label: 'Price Updates', glyph: '↗' },
  { to: '/price-history', label: 'Price History', glyph: '⧖' },
  { to: '/recommendations', label: 'Recommendations', glyph: '✦' },
  { to: '/setup', label: 'Setup', glyph: '⚙' },
]

export function AppShell() {
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <div className="shell">
      {/* Title ribbon — Midnight bar per BRAND_GUIDE.md "App header pattern":
          bluestem logo left, app name, then as-of, the RSM sponsor mark, and
          the signed-in persona on the right. */}
      <header className="ribbon">
        <div className="ribbon-brand">
          <BluestemLogo height={26} onDark />
          <span className="ribbon-divider" aria-hidden="true" />
          <span className="ribbon-app">Pricing &amp; Margin Workspace</span>
        </div>
        <div className="ribbon-meta">
          <span className="ribbon-asof">
            {CURRENT_SEASON} · as of <b>{shortDate(AS_OF)}</b>
          </span>
          {/* RSM sponsor mark — required on every bluestem app (BRAND_GUIDE.md) */}
          <span className="sponsor">
            <span className="sponsor-label">Powered by</span>
            <img src={rsmLogoWhite} alt="RSM" height={22} />
          </span>
          <span className="persona">
            <span className="avatar" aria-hidden="true">
              {BRAND.persona.initials}
            </span>
            <span className="persona-text">
              <span className="persona-name">{BRAND.persona.name}</span>
              <span className="persona-title">
                {BRAND.persona.title} · {BRAND.persona.site}
              </span>
            </span>
          </span>
        </div>
      </header>

      <nav className="nav">
        <div className="nav-links">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="glyph">{n.glyph}</span>
              {n.label}
            </NavLink>
          ))}
        </div>
        <div className="nav-foot">
          Guards margin across retail price groups, foodservice contracts, and grower pools.
          <span className="mode">{BRAND.tagline}</span>
        </div>
      </nav>

      <main className={`main${chatOpen ? ' chat-open' : ''}`}>
        <Outlet />
      </main>

      {!chatOpen && (
        <button className="chat-fab" onClick={() => setChatOpen(true)}>
          ✦ Ask the Agent
        </button>
      )}
      {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}
    </div>
  )
}
