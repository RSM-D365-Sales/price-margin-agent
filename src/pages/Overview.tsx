import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PRICE_OVERRIDES, PRICING_SETUP, RECOMMENDATIONS, STORES } from '../data/mockData'
import {
  overrideMarginPct,
  overrideBreachesMap,
  lineMarginPct,
  lineSalesPrice,
  lineEffectiveCost,
  lineBreachesMap,
} from '../models/types'
import { money0, num, pct, shortDate } from '../lib/format'
import { AS_OF, BRAND, CURRENT_SEASON, DEFAULT_RETAIL_MARGIN_TARGET, iso } from '../lib/config'
import { Kpi } from '../components/Kpi'

const CARDS = [
  {
    to: '/overrides',
    glyph: '✎',
    title: 'Override Audit',
    body: 'Every order where a register price was manually overridden — margin, reason code, the store, and whether it went under a vendor MAP floor.',
  },
  {
    to: '/threshold-test',
    glyph: '◮',
    title: 'Margin Threshold Test',
    body: 'Find all pricing setup at or below a margin % across the retail estate and the vendor programs — then let the agent draft new prices, uplifts, or discounts.',
  },
  {
    to: '/price-history',
    glyph: '⧖',
    title: 'Price History',
    body: 'Audit report for one product and one price scope: retail list, a single channel, one store, or a vendor MAP schedule — every change and the window it was live for.',
  },
  {
    to: '/recommendations',
    glyph: '✦',
    title: 'AI Recommendations',
    body: 'Markdown timing, price increases, kiosk uplifts, and vendor program guidance — grounded in the KPIs the agent monitors.',
  },
]

export function Overview() {
  const stats = useMemo(() => {
    const windowStart = iso(-30)
    const overrides30 = PRICE_OVERRIDES.filter((o) => o.orderDate >= windowStart)
    const thin = overrides30.filter((o) => overrideMarginPct(o) < DEFAULT_RETAIL_MARGIN_TARGET).length
    const mapOverrides = PRICE_OVERRIDES.filter(overrideBreachesMap).length

    const failing = PRICING_SETUP.filter((l) => lineMarginPct(l) <= DEFAULT_RETAIL_MARGIN_TARGET)
    const breaches = PRICING_SETUP.filter((l) => lineBreachesMap(l, AS_OF))
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

    // Blended margin, own label vs branded — the core economics of the book.
    const avg = (ls: typeof PRICING_SETUP) =>
      ls.length ? ls.reduce((s, l) => s + lineMarginPct(l), 0) / ls.length : 0
    const ownLabel = avg(PRICING_SETUP.filter((l) => l.productLine === 'Own label'))
    const branded = avg(PRICING_SETUP.filter((l) => l.productLine === 'Branded'))

    return {
      overrides30: overrides30.length,
      thin,
      mapOverrides,
      failing: failing.length,
      breaches: breaches.length,
      openRecs,
      atRisk,
      cats,
      maxCat: cats.length ? cats[0][1] : 1,
      ownLabel,
      branded,
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
          One place to audit register price overrides, stress-test discount thresholds, trace price
          history, and act on pricing guidance — across {BRAND.site}, {STORES.length} coastal store
          locations, and the vendor programs the branded assortment is bought under.
        </p>
      </header>

      {stats.breaches > 0 && (
        <div className="callout warn">
          <span className="callout-glyph" aria-hidden="true">
            ⚠
          </span>
          <span>
            <b>
              {stats.breaches} pricing line{stats.breaches === 1 ? '' : 's'} sit below a vendor MAP
              floor with no active waiver.
            </b>{' '}
            Below-MAP pricing inside an approved co-op window is fine; these are outside one.{' '}
            <Link to="/threshold-test" style={{ color: 'inherit', fontWeight: 600 }}>
              Review on the vendor tab →
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
          label="MAP breaches"
          value={num(stats.breaches)}
          tone={stats.breaches ? 'red' : 'sage'}
          sub="no active vendor waiver"
        />
        <Kpi label="Open recommendations" value={num(stats.openRecs)} sub="retail + vendor agents" />
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
            <span className="pill sand">Own label · {pct(stats.ownLabel)} avg margin</span>
            <span className="pill navy">Branded · {pct(stats.branded)} avg margin</span>
            <span style={{ fontSize: 12.5, color: 'var(--ink-500)' }}>
              Own-label souvenir and beach goods absorb a deep markdown and still clear the target.
              Branded surf does not — which is why almost every failing line is branded.
            </span>
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
