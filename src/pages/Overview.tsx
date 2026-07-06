import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PRICE_OVERRIDES, PRICING_SETUP, RECOMMENDATIONS } from '../data/mockData'
import { overrideMarginPct, lineMarginPct, lineSalesPrice } from '../models/types'
import { money0, num, pct } from '../lib/format'
import { Kpi } from '../components/Kpi'

const CARDS = [
  {
    to: '/overrides',
    title: 'Override Audit',
    body: 'Every order where a price was manually overridden — margin %, reason code, and the user who did it. Email them or raise a D365 case.',
  },
  {
    to: '/threshold-test',
    title: 'Margin Threshold Test',
    body: 'Find all pricing setup at or below a margin % across D2C and wholesale — then let the agent draft new base prices, margin components, or discounts.',
  },
  {
    to: '/price-history',
    title: 'Price History',
    body: 'Audit report for a specific product (size / color) and customer: every price change and the date range it was active for.',
  },
  {
    to: '/recommendations',
    title: 'AI Recommendations',
    body: 'Price increases, markdown timing, promotion tuning, and wholesale contract guidance — grounded in the KPIs the agent monitors.',
  },
]

export function Overview() {
  const stats = useMemo(() => {
    const overrides30 = PRICE_OVERRIDES.filter((o) => o.orderDate >= '2026-06-06')
    const below50 = overrides30.filter((o) => overrideMarginPct(o) < 50).length
    const failing = PRICING_SETUP.filter((l) => lineMarginPct(l) <= 50)
    const openRecs = RECOMMENDATIONS.filter((r) => r.status === 'Open').length

    // margin exposure by category for failing setup lines
    const byCat = new Map<string, number>()
    for (const l of failing) {
      const exposure = (l.unitCost / 0.5 - lineSalesPrice(l)) * l.quantity
      byCat.set(l.category, (byCat.get(l.category) ?? 0) + Math.max(0, exposure))
    }
    const cats = [...byCat.entries()].sort((a, b) => b[1] - a[1])
    const maxCat = cats.length ? cats[0][1] : 1

    return { overrides30: overrides30.length, below50, failing: failing.length, openRecs, cats, maxCat }
  }, [])

  return (
    <>
      <header className="page-head">
        <div className="eyebrow">Margin Guardrails · As of 2026-07-06</div>
        <h1>Sales Margin Agent</h1>
        <p className="lede">
          One place to audit price overrides, stress-test discount thresholds, trace price history,
          and act on AI pricing guidance — across vince.com, retail stores, and wholesale accounts.
        </p>
      </header>

      <div className="kpi-strip">
        <Kpi label="Overrides · last 30 days" value={num(stats.overrides30)} sub={`${stats.below50} below 50% margin`} />
        <Kpi
          label="Setup lines failing 50%"
          value={num(stats.failing)}
          tone={stats.failing ? 'red' : 'sage'}
          sub="D2C + wholesale pricing"
        />
        <Kpi label="Open recommendations" value={num(stats.openRecs)} sub="D2C + wholesale agents" />
        <Kpi label="Gross margin · D2C" value={pct(68.4)} tone="sage" sub="▲ 1.2 pts vs last month" />
        <Kpi label="Margin at risk" value="$412K" tone="red" sub="aging + failing setup" />
      </div>

      <div className="section" style={{ marginTop: 10 }}>
        <div className="section-head">
          <h2>Margin exposure by category</h2>
          <span className="eyebrow">gap to 50% target on failing setup lines</span>
        </div>
        <div className="card" style={{ padding: '22px 26px' }}>
          <div className="bar-list">
            {stats.cats.map(([cat, v]) => (
              <div className="bar-row" key={cat}>
                <span>{cat}</span>
                <div className="bar-track">
                  <div
                    className={`bar-fill${v === stats.maxCat ? ' red' : ''}`}
                    style={{ width: `${(v / stats.maxCat) * 100}%` }}
                  />
                </div>
                <span className="bar-value">{money0(v)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overview-grid">
        {CARDS.map((c) => (
          <Link to={c.to} className="card overview-card" key={c.to}>
            <h3>{c.title}</h3>
            <p>{c.body}</p>
            <span className="go">Open →</span>
          </Link>
        ))}
      </div>
    </>
  )
}
