import { useMemo, useState } from 'react'
import { RECOMMENDATIONS, RETAIL_KPIS, VENDOR_KPIS } from '../data/mockData'
import type { RecAudience, Recommendation } from '../models/types'
import { Kpi } from '../components/Kpi'
import { useToast } from '../components/useToast'

const TREND_GLYPH = { up: '▲', down: '▼', flat: '—' } as const

/**
 * Sum the dollar figures the open cards actually claim, so the headline upside
 * always ties out to what is on screen rather than being typed in separately.
 */
function upsideOf(recs: Recommendation[]): string {
  let total = 0
  let sawMoney = false
  for (const r of recs) {
    const m = r.impact?.match(/\$([\d.]+)K/)
    if (m) {
      total += parseFloat(m[1])
      sawMoney = true
    }
  }
  return sawMoney ? `+$${Math.round(total)}K` : '—'
}

export function Recommendations() {
  const [audience, setAudience] = useState<RecAudience>('Retail')
  const [recs, setRecs] = useState<Recommendation[]>(RECOMMENDATIONS)
  const [, showToast, toastNode] = useToast()

  const shown = useMemo(() => recs.filter((r) => r.audience === audience), [recs, audience])
  const open = shown.filter((r) => r.status === 'Open')
  const accepted = recs.filter((r) => r.status === 'Accepted').length
  const kpis = audience === 'Retail' ? RETAIL_KPIS : VENDOR_KPIS

  function setStatus(id: string, status: Recommendation['status']) {
    setRecs((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)))
    showToast(
      status === 'Accepted'
        ? 'Recommendation accepted — the agent will draft the pricing change for review'
        : 'Recommendation dismissed',
    )
  }

  return (
    <>
      <header className="page-head">
        <div className="eyebrow">AI price &amp; discount guidance</div>
        <h1>Recommendations</h1>
        <p className="lede">
          Objective: hold gross margin through the season change while keeping full-price
          sell-through up and unnecessary markdowns down. The agent monitors the KPIs below and
          proposes pricing, markdown, promotion, and vendor program moves — every action stays
          human-in-the-loop.
        </p>
      </header>

      <div className="kpi-strip">
        <Kpi label="Open recommendations" value={String(open.length)} sub={`${audience} view`} />
        <Kpi label="Accepted this session" value={String(accepted)} tone="sage" />
        <Kpi
          label="Projected margin upside"
          value={upsideOf(open)}
          sub="if the open recommendations are accepted"
        />
      </div>

      <div className="tab-row">
        <button
          className={`tab${audience === 'Retail' ? ' active' : ''}`}
          onClick={() => setAudience('Retail')}
        >
          Retail Pricing Agent
          <span className="count">
            {recs.filter((r) => r.audience === 'Retail' && r.status === 'Open').length}
          </span>
        </button>
        <button
          className={`tab${audience === 'Vendor' ? ' active' : ''}`}
          onClick={() => setAudience('Vendor')}
        >
          Vendor Program Agent
          <span className="count">
            {recs.filter((r) => r.audience === 'Vendor' && r.status === 'Open').length}
          </span>
        </button>
      </div>

      <div className="rec-grid">
        {shown.map((r) => (
          <div
            className="card rec-card"
            key={r.id}
            style={r.status !== 'Open' ? { opacity: 0.55 } : undefined}
          >
            <div className="rec-head">
              <span className={`pill ${r.kind === 'MAP compliance' ? 'critical' : 'blue'}`}>
                {r.kind}
              </span>
              <span
                className={`pill ${r.confidence === 'High' ? 'good' : r.confidence === 'Low' ? 'critical' : 'warn'}`}
              >
                {r.confidence} confidence
              </span>
            </div>
            <h3>{r.title}</h3>
            <div className="rec-body">
              {r.detail}
              {r.bullets && (
                <ul>
                  {r.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
            {r.impact && <div className="rec-impact">{r.impact}</div>}
            <div className="rec-actions">
              {r.status === 'Open' ? (
                <>
                  <button className="btn small primary" onClick={() => setStatus(r.id, 'Accepted')}>
                    Accept
                  </button>
                  <button className="btn small ghost" onClick={() => setStatus(r.id, 'Dismissed')}>
                    Dismiss
                  </button>
                </>
              ) : (
                <span className={`pill ${r.status === 'Accepted' ? 'good' : ''}`}>{r.status}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="section">
        <div className="section-head">
          <h2>
            {audience === 'Retail'
              ? 'Retail KPIs the agent monitors'
              : 'Vendor program KPIs the agent monitors'}
          </h2>
        </div>
        <div className="chip-row">
          {kpis.map((k) => (
            <span className="chip" key={k.label}>
              {k.label}
              <b>
                {k.value}
                {k.trend ? ` ${TREND_GLYPH[k.trend]}` : ''}
              </b>
            </span>
          ))}
        </div>
      </div>
      {toastNode}
    </>
  )
}
