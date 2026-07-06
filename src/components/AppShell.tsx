import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { ChatPanel } from './ChatPanel'

const NAV = [
  { to: '/', label: 'Overview', glyph: '◈', end: true },
  { to: '/overrides', label: 'Override Audit', glyph: '✎' },
  { to: '/threshold-test', label: 'Threshold Test', glyph: '◮' },
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
          <div className="wordmark">VINCE</div>
          <div className="sub">Sales Margin Agent</div>
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
          Guards margin across
          <br />
          D2C &amp; wholesale pricing
          <br />
          <span className="mode">Mock data · D365 ready</span>
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
