import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CUSTOMERS, FOODSERVICE_CONTRACTS, PRICE_OVERRIDES, PRICING_SETUP, RECOMMENDATIONS, SIMULATOR } from '../data/mockData'
import {
  overrideMarginPct,
  overrideBreachesFloor,
  lineMarginPct,
  lineSalesPrice,
  lineEffectiveCost,
  lineBreachesFloor,
} from '../models/types'
import { money0, num, pct, shortDate } from '../lib/format'
import { AS_OF, COPY, CURRENT_SEASON, DEFAULT_RETAIL_MARGIN_TARGET, LINES, iso } from '../lib/config'
import { Kpi } from '../components/Kpi'

const CARDS = [
  {
    to: '/overrides',
    glyph: '✎',
    title: 'Override Audit',
    body: 'Every sales-order line where a rep typed over the system price — margin, reason code, the customer, and whether it went under the price floor.',
  },
  {
    to: '/threshold-test',
    glyph: '◮',
    title: 'Margin Threshold Test',
    body: COPY.overview.thresholdCard,
  },
  {
    to: '/price-updates',
    glyph: '↗',
    title: 'Price Updates',
    body: COPY.overview.priceUpdatesCard,
  },
  {
    to: '/price-history',
    glyph: '⧖',
    title: 'Price History',
    body: COPY.overview.historyCard,
  },
  {
    to: '/recommendations',
    glyph: '✦',
    title: 'AI Recommendations',
    body: COPY.overview.recsCard,
  },
  ...(SIMULATOR
    ? [
        {
          to: '/price-simulator',
          glyph: '⊞',
          title: 'Price Simulator',
          body: 'Pick a customer and a product and watch the trade agreement search resolve the price — which lines were found, which were skipped, and how the net price is built.',
        },
      ]
    : []),
]

export function Overview() {
  const stats = useMemo(() => {
    const windowStart = iso(-30)
    const overrides30 = PRICE_OVERRIDES.filter((o) => o.orderDate >= windowStart)
    const thin = overrides30.filter((o) => overrideMarginPct(o) < DEFAULT_RETAIL_MARGIN_TARGET).length
    const floorOverrides = PRICE_OVERRIDES.filter(overrideBreachesFloor).length

    const failing = PRICING_SETUP.filter((l) => lineMarginPct(l) <= DEFAULT_RETAIL_MARGIN_TARGET)
    const breaches = PRICING_SETUP.filter((l) => lineBreachesFloor(l, AS_OF))
    const openRecs = RECOMMENDATIONS.filter((r) => r.status === 'Open').length

    // Margin at risk: for each failing line, the revenue gap between what it
    // sells for today and the price that would hit the target margin, times
    // the quantity on the record.
    const target = DEFAULT_RETAIL_MARGIN_TARGET / 100
    let atRisk = 0
    const byCat = new Map<string, number>()
    for (const l of failing) {
      const needed = lineEffectiveCost(l) / (1 - target)
      const gap = Math.max(0, needed - lineSalesPrice(l)) * l.quantity
      atRisk += gap
      byCat.set(l.category, (byCat.get(l.category) ?? 0) + gap)
    }
    const cats = [...byCat.entries()].sort((a, b) => b[1] - a[1])

    // Blended margin, premium vs commodity line — the core economics of the book.
    const avg = (ls: typeof PRICING_SETUP) =>
      ls.length ? ls.reduce((s, l) => s + lineMarginPct(l), 0) / ls.length : 0
    const freshCut = avg(PRICING_SETUP.filter((l) => l.productLine === LINES.premium))
    const packed = avg(PRICING_SETUP.filter((l) => l.productLine === LINES.commodity))

    return {
      overrides30: overrides30.length,
      thin,
      floorOverrides,
      failing: failing.length,
      breaches: breaches.length,
      openRecs,
      atRisk,
      cats,
      maxCat: cats.length ? cats[0][1] : 1,
      freshCut,
      packed,
    }
  }, [])

  return (
    <>
      <header className="page-head">
        <div className="eyebrow">
          {CURRENT_SEASON} · as of {shortDate(AS_OF)}
        </div>
        <h1>Pricing &amp; Margin Workspace</h1>
        <p className="lede">
          {COPY.overview.lede(CUSTOMERS.length, FOODSERVICE_CONTRACTS.length)}
        </p>
      </header>

      {stats.breaches > 0 && (
        <div className="callout warn">
          <span className="callout-glyph" aria-hidden="true">
            ⚠
          </span>
          <span>
            <b>
              {stats.breaches} pricing line{stats.breaches === 1 ? '' : 's'} sit below the price
              floor with no active trade promotion.
            </b>{' '}
            Below-floor pricing inside an approved promotion window is fine; these are promo prices that
            outlived their window.{' '}
            <Link to="/threshold-test" style={{ color: 'inherit', fontWeight: 600 }}>
              Review in the threshold test →
            </Link>
          </span>
        </div>
      )}

      <div className="kpi-strip">
        <Kpi
          label="Overrides · last 30 days"
          value={num(stats.overrides30)}
          sub={`${stats.thin} below ${DEFAULT_RETAIL_MARGIN_TARGET}% margin`}
        />
        <Kpi
          label={`Setup lines failing ${DEFAULT_RETAIL_MARGIN_TARGET}%`}
          value={num(stats.failing)}
          tone={stats.failing ? 'red' : 'sage'}
          sub={`of ${PRICING_SETUP.length} active price records`}
        />
        <Kpi
          label="Below floor, no promo"
          value={num(stats.breaches)}
          tone={stats.breaches ? 'red' : 'sage'}
          sub="promo prices that outlived their window"
        />
        <Kpi label="Open recommendations" value={num(stats.openRecs)} sub={COPY.overview.recsKpiSub} />
        <Kpi
          label="Margin at risk"
          value={money0(stats.atRisk)}
          tone="red"
          sub={`gap to ${DEFAULT_RETAIL_MARGIN_TARGET}% on failing lines`}
        />
      </div>

      <div className="section" style={{ marginTop: 6 }}>
        <div className="section-head">
          <h2>Where the margin gap sits</h2>
          <span className="eyebrow">
            gap to the {DEFAULT_RETAIL_MARGIN_TARGET}% target on failing lines
          </span>
        </div>
        <div className="card" style={{ padding: '18px 20px' }}>
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
          <div
            style={{
              marginTop: 16,
              paddingTop: 14,
              borderTop: '1px solid var(--ink-100)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              alignItems: 'center',
            }}
          >
            <span className="pill grey">{LINES.premium} · {pct(stats.freshCut)} avg margin</span>
            <span className="pill midnight">{LINES.commodity} · {pct(stats.packed)} avg margin</span>
            <span style={{ fontSize: 12.5, color: 'var(--ink-500)' }}>{COPY.overview.linesNote}</span>
          </div>
        </div>
      </div>

      <div className="overview-grid">
        {CARDS.map((c) => (
          <Link to={c.to} className="card overview-card" key={c.to}>
            <span className="card-glyph" aria-hidden="true">
              {c.glyph}
            </span>
            <h3>{c.title}</h3>
            <p>{c.body}</p>
            <span className="go">Open →</span>
          </Link>
        ))}
      </div>
    </>
  )
}
