import { useState } from 'react'
import { useToast } from '../components/useToast'

export function Setup() {
  const [liveMode, setLiveMode] = useState(false)
  const [minMargin, setMinMargin] = useState(50)
  const [wholesaleFloor, setWholesaleFloor] = useState(30)
  const [, showToast, toastNode] = useToast()

  return (
    <>
      <header className="page-head">
        <div className="eyebrow">Configuration</div>
        <h1>Setup</h1>
        <p className="lede">
          Connect to Dynamics 365, set margin guardrails, and configure the assistant. The app runs
          on bundled mock data by default — the live D365 connection uses the same service seam as
          the Consignment and Popup agents.
        </p>
      </header>

      <div className="setup-grid">
        <div className="card setup-card">
          <h3>D365 connection</h3>
          <div className="field">
            <label>Environment URL</label>
            <input className="input" placeholder="https://vince-prod.operations.dynamics.com" />
          </div>
          <div className="field">
            <label>Legal entity</label>
            <input className="input" defaultValue="VNCE" />
          </div>
          <div className="toggle-row">
            <span>
              Data source: <b>{liveMode ? 'Live D365 (OData)' : 'Mock (bundled)'}</b>
            </span>
            <button
              className="btn small ghost"
              onClick={() => {
                setLiveMode((v) => !v)
                showToast(
                  liveMode
                    ? 'Switched to mock data'
                    : 'Live mode requires OAuth setup — see docs/FUTURE-INTEGRATION.md',
                )
              }}
            >
              {liveMode ? 'Use mock' : 'Go live'}
            </button>
          </div>
        </div>

        <div className="card setup-card">
          <h3>Margin guardrails</h3>
          <div className="field">
            <label>Default D2C margin threshold %</label>
            <input
              type="number"
              className="input"
              style={{ width: 120 }}
              value={minMargin}
              onChange={(e) => setMinMargin(Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label>Wholesale minimum margin % (discount approvals)</label>
            <input
              type="number"
              className="input"
              style={{ width: 120 }}
              value={wholesaleFloor}
              onChange={(e) => setWholesaleFloor(Number(e.target.value))}
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
        </div>

        <div className="card setup-card">
          <h3>Follow-up actions</h3>
          <div className="field">
            <label>Case queue (D365 Customer Service)</label>
            <input className="input" defaultValue="Pricing Review Queue" />
          </div>
          <div className="field">
            <label>Email from-address</label>
            <input className="input" defaultValue="pricing-team@vince.com" />
          </div>
          <div className="toggle-row">
            <span>Auto-create case when margin &lt; 25%</span>
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

      <div style={{ marginTop: 24 }}>
        <button className="btn camel" onClick={() => showToast('Settings saved to localStorage')}>
          Save settings
        </button>
      </div>
      {toastNode}
    </>
  )
}
