import { useMemo, useState } from 'react'
import { RECOMMENDATIONS, D2C_KPIS, WHOLESALE_KPIS } from '../data/mockData'
import type { RecAudience, Recommendation } from '../models/types'
import { Kpi } from '../components/Kpi'
import { useToast } from '../components/useToast'

const TREND_GLYPH = { up: '▲', down: '▼', flat: '—' } as const

export function Recommendations() {
  const [audience, setAudience] = useState<RecAudience>('D2C')
  const [recs, setRecs] = useState<Recommendation[]>(RECOMMENDATIONS)
  const [, showToast, toastNode] = useToast()

  const shown = useMemo(() => recs.filter((r) => r.audience === audience), [recs, audience])
  const open = shown.filter((r) => r.status === 'Open').length
  const accepted = recs.filter((r) => r.status === 'Accepted').length
  const kpis = audience === 'D2C' ? D2C_KPIS : WHOLESALE_KPIS

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
          Objective: maximize gross margin while increasing full-price sell-through and reducing
          unnecessary markdowns. The agent monitors the KPIs below and proposes pricing, markdown,
          promotion, and contract moves — every action stays human-in-the-loop.
        </p>
      </header>

      <div className="kpi-strip">
        <Kpi label="Open recommendations" value={String(open)} sub={`${audience} view`} />
        <Kpi label="Accepted this session" value={String(accepted)} tone="sage" />
        <Kpi
          label="Projected margin upside"
          value={audience === 'D2C' ? '+$329K' : '+$420K'}
          sub="if open recommendations are accepted"
        />
      </div>

      <div className="tab-row">
        <button
          className={`tab${audience === 'D2C' ? ' active' : ''}`}
          onClick={() => setAudience('D2C')}
        >
          D2C Pricing Agent
          <span className="count">{recs.filter((r) => r.audience === 'D2C' && r.status === 'Open').length}</span>
        </button>
        <button
          className={`tab${audience === 'Wholesale' ? ' active' : ''}`}
          onClick={() => setAudience('Wholesale')}
        >
          Wholesale Pricing Agent
          <span className="count">
            {recs.filter((r) => r.audience === 'Wholesale' && r.status === 'Open').length}
          </span>
        </button>
      </div>

      <div className="rec-grid">
        {shown.map((r) => (
          <div className="card rec-card" key={r.id} style={r.status !== 'Open' ? { opacity: 0.55 } : undefined}>
            <div className="rec-head">
              <span className="pill camel">{r.kind}</span>
              <span className={`pill ${r.confidence === 'High' ? 'sage' : r.confidence === 'Low' ? 'wine' : 'gold'}`}>
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
                  <button className="btn small camel" onClick={() => setStatus(r.id, 'Accepted')}>
                    Accept
                  </button>
                  <button className="btn small ghost" onClick={() => setStatus(r.id, 'Dismissed')}>
                    Dismiss
                  </button>
                </>
              ) : (
                <span className={`pill ${r.status === 'Accepted' ? 'sage' : ''}`}>{r.status}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="section">
        <div className="section-head">
          <h2>{audience === 'D2C' ? 'D2C KPIs the agent monitors' : 'Wholesale KPIs the agent monitors'}</h2>
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
