import { useMemo, useState } from 'react'
import {
  PRICING_SETUP,
  CATEGORIES,
  LOCATIONS,
  ORG_HIERARCHY,
  performanceFor,
  coverDaysFor,
  shelfLifeFor,
  RECENT_RATE_DAYS,
} from '../data/mockData'
import {
  lineMarginPct,
  lineSalesPrice,
  lineBelowFloor,
  lineBreachesFloor,
  sellThroughPct,
  salesVelocity,
  orgLeaves,
  type PricingSetupLine,
  type ItemPerformance,
  type VelocityBasis,
} from '../models/types'
import { money, pct, num, shortDate } from '../lib/format'
import { AS_OF, COPY, iso } from '../lib/config'
import { Kpi } from '../components/Kpi'
import { Modal } from '../components/Modal'
import { RepriceModal } from '../components/RepriceModal'
import { useToast } from '../components/useToast'

type RankBy = 'velocity' | 'sellThrough' | 'margin'
type Direction = 'best' | 'worst'

const RANK_LABELS: Record<RankBy, string> = {
  velocity: 'Sales velocity',
  sellThrough: 'Sell-through %',
  margin: 'Margin %',
}

const VELOCITY_LABELS: Record<VelocityBasis, string> = {
  day: `${COPY.units.plural} / day`,
  week: `${COPY.units.plural} / week`,
  month: `${COPY.units.plural} / month`,
}

/** A pricing line joined to how it actually shipped to the selected customers. */
interface Row {
  line: PricingSetupLine
  /** Selected customers this line's price actually applies to. */
  locations: string[]
  perf: ItemPerformance
}

export function PriceUpdates() {
  // ── filters ──
  const [fromDate, setFromDate] = useState(iso(-(RECENT_RATE_DAYS - 1)))
  const [toDate, setToDate] = useState(AS_OF)
  const [marginFilter, setMarginFilter] = useState(100)
  const [category, setCategory] = useState('All')
  const [itemQuery, setItemQuery] = useState('')
  const [basis, setBasis] = useState<VelocityBasis>('week')
  const [inScope, setInScope] = useState<Set<string>>(new Set(LOCATIONS.map((l) => l.code)))

  // ── ranking ──
  const [rankBy, setRankBy] = useState<RankBy>('velocity')
  const [direction, setDirection] = useState<Direction>('best')

  // ── grid state ──
  const [lines, setLines] = useState<PricingSetupLine[]>(PRICING_SETUP)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [discountDetail, setDiscountDetail] = useState<PricingSetupLine | null>(null)
  const [repriceOpen, setRepriceOpen] = useState(false)
  const [, showToast, toastNode] = useToast()

  /**
   * Price Updates works on the retail book — those are the prices that ship to a
   * set of customers and therefore carry a velocity and a sell-through.
   * Foodservice contract lines are negotiated terms and are handled on the
   * Margin Threshold Test.
   */
  const rows: Row[] = useMemo(() => {
    const q = itemQuery.trim().toLowerCase()
    return lines
      .filter((l) => l.mode === 'Retail')
      .filter((l) => (category === 'All' ? true : l.category === category))
      .filter((l) => lineMarginPct(l) <= marginFilter)
      .filter((l) =>
        q ? l.itemNumber.toLowerCase().includes(q) || l.itemName.toLowerCase().includes(q) : true,
      )
      .map((l) => {
        const locations = (l.customerCodes ?? []).filter((c) => inScope.has(c))
        return { line: l, locations, perf: performanceFor(l.itemNumber, locations, fromDate, toDate) }
      })
      // a line with no selected customer in scope has nothing to say here
      .filter((r) => r.locations.length > 0)
  }, [lines, category, marginFilter, itemQuery, inScope, fromDate, toDate])

  const ranked = useMemo(() => {
    const score = (r: Row) =>
      rankBy === 'velocity'
        ? salesVelocity(r.perf, basis)
        : rankBy === 'sellThrough'
          ? sellThroughPct(r.perf)
          : lineMarginPct(r.line)
    const sorted = [...rows].sort((a, b) => score(b) - score(a))
    return direction === 'best' ? sorted : sorted.reverse()
  }, [rows, rankBy, direction, basis])

  const kpis = useMemo(() => {
    if (rows.length === 0) return null
    // Best seller is a headline total. Slowest mover has to be per customer,
    // or it just finds whichever line ships to the fewest customers.
    const byTotal = [...rows].sort(
      (a, b) => salesVelocity(b.perf, basis) - salesVelocity(a.perf, basis),
    )
    const perLoc = (r: Row) => salesVelocity(r.perf, basis) / Math.max(1, r.locations.length)
    const byPerLoc = [...rows].sort((a, b) => perLoc(b) - perLoc(a))
    const best = byTotal[0]
    const slowest = byPerLoc[byPerLoc.length - 1]
    const sold = rows.reduce((s, r) => s + r.perf.unitsSold, 0)
    const available = rows.reduce((s, r) => s + r.perf.unitsAvailable, 0)
    return {
      best,
      slowest,
      unitsSold: sold,
      sellThrough: available > 0 ? (sold / available) * 100 : 0,
    }
  }, [rows, basis])

  const selectedLines = useMemo(
    () => (selected.size ? ranked.filter((r) => selected.has(r.line.id)) : ranked).map((r) => r.line),
    [ranked, selected],
  )

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  function toggleAll() {
    setSelected((s) => (s.size === ranked.length ? new Set() : new Set(ranked.map((r) => r.line.id))))
  }

  function toggleLocations(codes: string[], on: boolean) {
    setInScope((s) => {
      const n = new Set(s)
      for (const c of codes) {
        if (on) n.add(c)
        else n.delete(c)
      }
      return n
    })
  }

  function applyReprice(solved: PricingSetupLine[], summary: string) {
    const byId = new Map(solved.map((l) => [l.id, l]))
    setLines((ls) => ls.map((l) => byId.get(l.id) ?? l))
    setRepriceOpen(false)
    setSelected(new Set())
    showToast(summary)
  }

  const allSelected = inScope.size === LOCATIONS.length

  return (
    <>
      <header className="page-head">
        <div className="eyebrow">Performance-led repricing</div>
        <h1>Price Updates</h1>
        <p className="lede">
          {COPY.priceUpdates.lede}
        </p>
      </header>

      <div className="card filter-bar">
        <div className="field">
          <label>From</label>
          <input
            type="date"
            className="input"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="field">
          <label>To</label>
          <input
            type="date"
            className="input"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Margin % at or below</label>
          <input
            type="number"
            className="input"
            style={{ width: 105 }}
            value={marginFilter}
            min={0}
            max={100}
            onChange={(e) => setMarginFilter(Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label>Category</label>
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>All</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Item number</label>
          <input
            className="input"
            style={{ width: 150 }}
            placeholder={COPY.priceUpdates.itemPlaceholder}
            value={itemQuery}
            onChange={(e) => setItemQuery(e.target.value)}
          />
        </div>
        <div className="field">
          <label>{COPY.units.pluralTitle} per</label>
          <select
            className="select"
            value={basis}
            onChange={(e) => setBasis(e.target.value as VelocityBasis)}
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>
      </div>

      <div className="card filter-bar" style={{ alignItems: 'center' }}>
        <div className="field" style={{ flex: 1 }}>
          <label>Customers</label>
          <div className="chip-select">
            <button
              className={`loc-chip${allSelected ? ' on' : ''}`}
              onClick={() => toggleLocations(LOCATIONS.map((l) => l.code), !allSelected)}
            >
              All customers
            </button>
            {(ORG_HIERARCHY.children ?? []).map((region) => {
              const leaves = orgLeaves(region)
              const on = leaves.every((c) => inScope.has(c))
              return (
                <button
                  key={region.code}
                  className={`loc-chip region${on ? ' on' : ''}`}
                  onClick={() => toggleLocations(leaves, !on)}
                  title={`Toggle all of ${region.name}`}
                >
                  {region.name}
                </button>
              )
            })}
            <span className="chip-divider" />
            {LOCATIONS.map((l) => (
              <button
                key={l.code}
                className={`loc-chip${inScope.has(l.code) ? ' on' : ''}`}
                onClick={() => toggleLocations([l.code], !inScope.has(l.code))}
              >
                {l.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {kpis ? (
        <div className="kpi-strip">
          <Kpi
            label={`Best seller · ${VELOCITY_LABELS[basis]}`}
            value={num(Math.round(salesVelocity(kpis.best.perf, basis) * 10) / 10)}
            tone="sage"
            sub={kpis.best.line.itemName}
          />
          <Kpi
            label={`Slowest mover · ${VELOCITY_LABELS[basis]} / customer`}
            value={num(
              Math.round(
                (salesVelocity(kpis.slowest.perf, basis) /
                  Math.max(1, kpis.slowest.locations.length)) *
                  10,
              ) / 10,
            )}
            tone="red"
            sub={kpis.slowest.line.itemName}
          />
          <Kpi
            label="Sell-through rate"
            value={pct(kpis.sellThrough)}
            sub={`${COPY.units.plural} shipped ÷ ${COPY.units.plural} available`}
          />
          <Kpi label={`${COPY.units.pluralTitle} shipped`} value={num(kpis.unitsSold)} sub={`${shortDate(fromDate)} – ${shortDate(toDate)}`} />
          <Kpi
            label="Customers in scope"
            value={`${inScope.size} / ${LOCATIONS.length}`}
            sub={`${ranked.length} price line${ranked.length === 1 ? '' : 's'} match`}
          />
        </div>
      ) : (
        <div className="callout warn">
          <span className="callout-glyph" aria-hidden="true">
            ⚠
          </span>
          <span>No {COPY.modes.Retail.lower} price lines match these filters — widen the customer selection or clear the item number.</span>
        </div>
      )}

      <div className="tab-row" role="group" aria-label="Ranking">
        <span
          style={{
            alignSelf: 'center',
            padding: '0 10px 0 6px',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--ink-400)',
          }}
        >
          Rank by
        </span>
        {(Object.keys(RANK_LABELS) as RankBy[]).map((k) => (
          <button
            key={k}
            className={`tab${rankBy === k ? ' active' : ''}`}
            onClick={() => setRankBy(k)}
          >
            {RANK_LABELS[k]}
          </button>
        ))}
        <span className="chip-divider" style={{ alignSelf: 'stretch' }} />
        <button
          className={`tab${direction === 'best' ? ' active' : ''}`}
          onClick={() => setDirection('best')}
        >
          Best → worst
        </button>
        <button
          className={`tab${direction === 'worst' ? ' active' : ''}`}
          onClick={() => setDirection('worst')}
        >
          Worst → best
        </button>
      </div>

      <div className="card table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={ranked.length > 0 && selected.size === ranked.length}
                  onChange={toggleAll}
                  aria-label="Select all rows"
                />
              </th>
              <th>Product</th>
              <th>Item</th>
              <th>Category</th>
              <th>Pack</th>
              <th>Channel</th>
              <th className="num">Qty</th>
              <th className="num">Base price (TA)</th>
              <th className="num">Margin comp.</th>
              <th className="num">Discount</th>
              <th className="num">Sales price</th>
              <th className="num">Sell-through</th>
              <th className="num">Velocity</th>
              <th className="num">Days cover</th>
              <th className="num">Margin %</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map(({ line: l, locations, perf }) => {
              const m = lineMarginPct(l)
              const st = sellThroughPct(perf)
              const vel = salesVelocity(perf, basis)
              const cover = coverDaysFor(l.itemNumber, locations)
              // Cover only means something next to the item's life (shelf
              // life, season window): 9 days is nothing on a 60-day item and
              // most of the life of a 12-day one.
              const life = shelfLifeFor(l.itemNumber)
              const lifeUsed = life && Number.isFinite(cover) ? cover / life : 0
              const breach = lineBreachesFloor(l, AS_OF)
              return (
                <tr key={l.id} className={selected.has(l.id) ? 'row-selected' : undefined}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(l.id)}
                      onChange={() => toggle(l.id)}
                      aria-label={`Select ${l.itemName}`}
                    />
                  </td>
                  <td className="style-cell">
                    <div className="style-name">{l.itemName}</div>
                    <div className="style-sub">
                      {l.productLine}
                      {breach && <span className="map-breach"> · below floor, promo ended</span>}
                    </div>
                  </td>
                  <td className="item-code">{l.itemNumber}</td>
                  <td>{l.category}</td>
                  <td>{l.pack}</td>
                  <td>
                    <div>{l.channel}</div>
                    <div className="style-sub">
                      {l.channelDetail} · {locations.length} cust
                    </div>
                  </td>
                  <td className="num">{num(l.quantity)}</td>
                  <td className="num">{money(l.basePrice)}</td>
                  <td className="num">{l.marginComponent === 0 ? '—' : money(l.marginComponent)}</td>
                  <td className="num">
                    {l.discountPct === 0 ? (
                      '—'
                    ) : l.discount &&
                      (l.discount.type === 'Threshold' || l.discount.type === 'Quantity') ? (
                      <button className="link-btn" onClick={() => setDiscountDetail(l)}>
                        {pct(l.discountPct, 0)} ▸
                      </button>
                    ) : (
                      pct(l.discountPct, 0)
                    )}
                  </td>
                  <td className="num">
                    {money(lineSalesPrice(l))}
                    {lineBelowFloor(l) && !breach && (
                      <div style={{ fontSize: 11, color: 'var(--warning-text)' }}>on promo</div>
                    )}
                  </td>
                  <td className="num">
                    <span className={st >= 85 ? 'margin-ok' : st < 70 ? 'margin-red' : undefined}>
                      {pct(st)}
                    </span>
                    <div style={{ fontSize: 11, color: 'var(--ink-400)' }}>
                      {num(perf.unitsSold)} of {num(perf.unitsAvailable)}
                    </div>
                  </td>
                  <td className="num">
                    {num(Math.round(vel * 10) / 10)}
                    <div style={{ fontSize: 11, color: 'var(--ink-400)' }}>
                      {num(Math.round((vel / locations.length) * 10) / 10)} per customer
                    </div>
                  </td>
                  <td className="num">
                    <span className={lifeUsed > 0.6 ? 'margin-red' : lifeUsed < 0.35 ? 'margin-ok' : undefined}>
                      {Number.isFinite(cover) ? `${Math.round(cover)} days` : '—'}
                    </span>
                    {life && (
                      <div style={{ fontSize: 11, color: 'var(--ink-400)' }}>{COPY.lifeSuffix(life)}</div>
                    )}
                  </td>
                  <td className={`num ${m <= marginFilter && marginFilter < 100 ? 'margin-red' : 'margin-ok'}`}>
                    {pct(m)}
                  </td>
                </tr>
              )
            })}
            {ranked.length === 0 && (
              <tr>
                <td colSpan={15} style={{ textAlign: 'center', color: 'var(--ink-400)', padding: 32 }}>
                  No {COPY.modes.Retail.lower} pricing matches these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {ranked.length > 0 && (
        <div className="action-bar">
          <span className="count">
            {selected.size || 'All'} line{(selected.size || ranked.length) === 1 ? '' : 's'}
          </span>
          <span style={{ fontSize: 12.5, opacity: 0.8 }}>
            {selected.size
              ? 'selected for reprice'
              : `displayed — reprice applies to all ${ranked.length}`}
          </span>
          <div className="spacer" />
          <button className="btn primary" onClick={() => setRepriceOpen(true)}>
            Draft new price →
          </button>
        </div>
      )}

      {discountDetail?.discount && (
        <Modal
          title={discountDetail.discount.name}
          sub={`${discountDetail.discount.type} discount · valid ${shortDate(discountDetail.discount.validFrom)} – ${shortDate(discountDetail.discount.validTo)}`}
          onClose={() => setDiscountDetail(null)}
        >
          <dl className="detail-list">
            <dt>Applies to</dt>
            <dd>
              {discountDetail.itemName} ({discountDetail.itemNumber}) · {discountDetail.pack}
            </dd>
            <dt>Current qty</dt>
            <dd>
              {num(discountDetail.quantity)} → effective {pct(discountDetail.discountPct, 0)} off
            </dd>
          </dl>
          {discountDetail.discount.tiers && (
            <table className="tier-table">
              <thead>
                <tr>
                  <th>Tier</th>
                  <th>Discount</th>
                </tr>
              </thead>
              <tbody>
                {discountDetail.discount.tiers.map((t) => (
                  <tr key={t.label}>
                    <td>{t.label}</td>
                    <td>{pct(t.discountPct, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Modal>
      )}

      {repriceOpen && (
        <RepriceModal
          lines={selectedLines}
          showRollout
          showMultiplier
          note="Roll-out defaults to the customers these prices already apply to."
          onClose={() => setRepriceOpen(false)}
          onApply={applyReprice}
        />
      )}
      {toastNode}
    </>
  )
}
