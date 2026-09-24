import { useMemo, useState } from 'react'
import { reconciliation } from '../data/mockData'
import {
  BRAND,
  DEFAULT_RETAIL_MARGIN_TARGET,
  DEFAULT_VENDOR_MARGIN_FLOOR,
} from '../lib/config'
import { useToast } from '../components/useToast'

export function Setup() {
  const [liveMode, setLiveMode] = useState(false)
  const [minMargin, setMinMargin] = useState(DEFAULT_RETAIL_MARGIN_TARGET)
  const [vendorFloor, setVendorFloor] = useState(DEFAULT_VENDOR_MARGIN_FLOOR)
  const [, showToast, toastNode] = useToast()

  const recon = useMemo(() => reconciliation(minMargin), [minMargin])

  return (
    <>
      <header className="page-head">
        <div className="eyebrow">Configuration</div>
        <h1>Setup</h1>
        <p className="lede">
          Connect to Dynamics 365, set margin guardrails, and configure the assistant. The app runs
          on a bundled dataset by default; the live D365 connection uses the same service seam.
        </p>
      </header>

      <div className="setup-grid">
        <div className="card setup-card">
          <h3>D365 connection</h3>
          <div className="field">
            <label>Environment URL</label>
            <input className="input" placeholder="https://bluestem-prod.operations.dynamics.com" />
          </div>
          <div className="field">
            <label>Legal entity</label>
            <input className="input" defaultValue={BRAND.legalEntity} />
          </div>
          <div className="toggle-row">
            <span>
              Data source: <b>{liveMode ? 'Live D365 (OData)' : 'Bundled dataset'}</b>
            </span>
            <button
              className="btn small ghost"
              onClick={() => {
                setLiveMode((v) => !v)
                showToast(
                  liveMode
                    ? 'Switched back to the bundled dataset'
                    : 'Live mode requires OAuth setup — see DESIGN.md',
                )
              }}
            >
              {liveMode ? 'Use bundled' : 'Go live'}
            </button>
          </div>
        </div>

        <div className="card setup-card">
          <h3>Margin guardrails</h3>
          <div className="field">
            <label>Retail margin threshold %</label>
            <input
              type="number"
              className="input"
              style={{ width: 120 }}
              value={minMargin}
              onChange={(e) => setMinMargin(Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label>Vendor program minimum margin % (discount approvals)</label>
            <input
              type="number"
              className="input"
              style={{ width: 120 }}
              value={vendorFloor}
              onChange={(e) => setVendorFloor(Number(e.target.value))}
            />
          </div>
          <div className="toggle-row">
            <span>Flag overrides below threshold in red</span>
            <input type="checkbox" defaultChecked />
          </div>
          <div className="toggle-row">
            <span>Require reason code on every override</span>
            <input type="checkbox" defaultChecked />
          </div>
          <div className="toggle-row">
            <span>Block register overrides below vendor MAP</span>
            <input type="checkbox" defaultChecked />
          </div>
        </div>

        <div className="card setup-card">
          <h3>Follow-up actions</h3>
          <div className="field">
            <label>Case queue (D365 Customer Service)</label>
            <input className="input" defaultValue="Pricing Review Queue" />
          </div>
          <div className="field">
            <label>Email from-address</label>
            <input className="input" defaultValue={`pricing@${BRAND.emailDomain}`} />
          </div>
          <div className="toggle-row">
            <span>Auto-create case when margin &lt; 25%</span>
            <input type="checkbox" defaultChecked />
          </div>
          <div className="toggle-row">
            <span>Auto-create case on any MAP breach</span>
            <input type="checkbox" defaultChecked />
          </div>
        </div>

        <div className="card setup-card">
          <h3>Assistant</h3>
          <div className="field">
            <label>Transport</label>
            <select className="select" defaultValue="heuristic">
              <option value="heuristic">Heuristic (offline, default)</option>
              <option value="azure">Azure OpenAI (BYO key)</option>
            </select>
          </div>
          <div className="field">
            <label>Azure OpenAI endpoint (optional)</label>
            <input className="input" placeholder="https://….openai.azure.com" />
          </div>
          <div className="toggle-row">
            <span>Human-in-the-loop on all pricing actions</span>
            <input type="checkbox" defaultChecked disabled />
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <h2>Data reconciliation</h2>
          <span className="eyebrow">computed from the dataset, not typed in</span>
        </div>
        <div className="card" style={{ padding: '18px 20px' }}>
          <table className="tier-table" style={{ marginTop: 0 }}>
            <thead>
              <tr>
                <th>Measure</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {recon.map((r) => (
                <tr key={r.label}>
                  <td>{r.label}</td>
                  <td className="num" style={{ fontWeight: 600 }}>
                    {r.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ margin: '14px 0 0', fontSize: 12.5, color: 'var(--ink-500)', lineHeight: 1.6 }}>
            Every date in the dataset is derived from a single as-of value in{' '}
            <span className="mono">src/lib/config.ts</span>. Moving that one constant slides the
            whole book — order dates, price windows, markdown waves, and MAP waivers — so the demo
            never shows stale dates.
          </p>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <button className="btn primary" onClick={() => showToast('Settings saved to localStorage')}>
          Save settings
        </button>
      </div>
      {toastNode}
    </>
  )
}
