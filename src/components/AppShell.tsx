import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { ChatPanel } from './ChatPanel'
import { BRAND, CURRENT_SEASON } from '../lib/config'

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
      <nav className="nav">
        <div className="nav-brand">
          <div className="mark" aria-hidden="true">
            A
          </div>
          <div>
            <div className="wordmark">{BRAND.name}</div>
            <div className="sub">Pricing &amp; Margin</div>
          </div>
        </div>
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
          Guards margin across {BRAND.site}, the store estate, and vendor programs.
          <span className="mode">{CURRENT_SEASON}</span>
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
