import { useMemo, useState } from 'react'
import { PRICING_SETUP, CATEGORIES } from '../data/mockData'
import {
  lineMarginPct,
  lineUnpooledMarginPct,
  lineSalesPrice,
  lineBelowFloor,
  lineBreachesFloor,
  type PricingSetupLine,
  type PricingMode,
} from '../models/types'
import { money, pct, num, shortDate } from '../lib/format'
import { AS_OF, DEFAULT_RETAIL_MARGIN_TARGET, iso } from '../lib/config'
import { Kpi } from '../components/Kpi'
import { Modal } from '../components/Modal'
import { RepriceModal } from '../components/RepriceModal'
import { useToast } from '../components/useToast'

export function ThresholdTest() {
  // test inputs — the window is anchored to the demo's as-of date
  const [fromDate, setFromDate] = useState(iso(-14))
  const [toDate, setToDate] = useState(iso(30))
  const [marginTarget, setMarginTarget] = useState(DEFAULT_RETAIL_MARGIN_TARGET)
  const [category, setCategory] = useState<string>('All')
  const [mode, setMode] = useState<PricingMode>('Retail')
  const [hasRun, setHasRun] = useState(true)

  // editable quantities + repriced lines are local overlays on the dataset
  const [lines, setLines] = useState<PricingSetupLine[]>(PRICING_SETUP)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [discountDetail, setDiscountDetail] = useState<PricingSetupLine | null>(null)
  const [repriceOpen, setRepriceOpen] = useState(false)
  const [, showToast, toastNode] = useToast()

  /** Lines matching everything except the mode — used for both tab counts. */
  const matching = useMemo(
    () =>
      lines
        .filter((l) => (category === 'All' ? true : l.category === category))
        .filter((l) => l.validFrom <= toDate && l.validTo >= fromDate)
        .filter((l) => lineMarginPct(l) <= marginTarget),
    [lines, category, fromDate, toDate, marginTarget],
  )

  const results = useMemo(() => {
    if (!hasRun) return []
    return matching
      .filter((l) => l.mode === mode)
      .sort((a, b) => lineMarginPct(a) - lineMarginPct(b))
  }, [matching, mode, hasRun])

  const retailCount = matching.filter((l) => l.mode === 'Retail').length
  const foodserviceCount = matching.filter((l) => l.mode === 'Foodservice').length
  const worstMargin = results.length ? lineMarginPct(results[0]) : null

  // Floor breaches are evaluated across the whole book, not just the failing set —
  // a line can sit above the margin target and still be out of compliance.
  const breaches = useMemo(() => lines.filter((l) => lineBreachesFloor(l, AS_OF)), [lines])
  const breachesInMode = breaches.filter((l) => l.mode === mode)

  function setQty(id: string, qty: number) {
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, quantity: Math.max(1, qty) } : l)))
  }

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  function toggleAll() {
    setSelected((s) => (s.size === results.length ? new Set() : new Set(results.map((r) => r.id))))
  }

  const repriceLines = useMemo(
    () => (selected.size ? results.filter((r) => selected.has(r.id)) : results),
    [results, selected],
  )

  function applyReprice(solved: PricingSetupLine[], summary: string) {
    const byId = new Map(solved.map((l) => [l.id, l]))
    setLines((ls) => ls.map((l) => byId.get(l.id) ?? l))
    setRepriceOpen(false)
    setSelected(new Set())
    showToast(summary)
  }

  return (
    <>
      <header className="page-head">
        <div className="eyebrow">Discount thresholds &amp; approval requirements</div>
        <h1>Margin Threshold Test</h1>
        <p className="lede">
          A price simulator tests one line at a time. This finds <em>all</em> pricing setup at or
          below a margin % across a date range — customer price groups and trade promotions on the
          retail side, contract lines with their floors and grower pool share on the foodservice
          side. Select lines and let the agent draft a new price.
        </p>
      </header>

      <div className="card filter-bar">
        <div className="field">
          <label>Test from</label>
          <input
            type="date"
            className="input"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Test to</label>
          <input
            type="date"
            className="input"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Margin must be above</label>
          <input
            type="number"
            className="input"
            style={{ width: 110 }}
            value={marginTarget}
            min={0}
            max={100}
            onChange={(e) => setMarginTarget(Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label>Category node (optional)</label>
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>All</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="spacer" />
        <button className="btn" onClick={() => setHasRun(true)}>
          Run test
        </button>
      </div>

      <div className="kpi-strip">
        <Kpi
          label="Lines failing the test"
          value={num(results.length)}
          tone={results.length ? 'red' : 'sage'}
          sub={`at or below ${marginTarget}% margin`}
        />
        <Kpi
          label="Worst margin found"
          value={worstMargin === null ? '—' : pct(worstMargin)}
          tone={worstMargin !== null && worstMargin < 20 ? 'red' : 'default'}
          sub={results.length ? results[0].itemName : 'no failures'}
        />
        <Kpi label="Retail failures" value={num(retailCount)} sub="price groups + promotions" />
        <Kpi label="Foodservice failures" value={num(foodserviceCount)} sub="contract lines" />
        <Kpi
          label="Below floor, no promo"
          value={num(breaches.length)}
          tone={breaches.length ? 'red' : 'sage'}
          sub="whole book, promotion ended"
        />
      </div>

      {breachesInMode.length > 0 && (
        <div className="callout critical">
          <span className="callout-glyph" aria-hidden="true">
            ⚠
          </span>
          <span>
            <b>
              {breachesInMode.length} {mode.toLowerCase()} line
              {breachesInMode.length === 1 ? '' : 's'} price below floor with no active trade
              promotion:
            </b>{' '}
            {breachesInMode
              .map(
                (l) =>
                  `${l.itemNumber} at ${money(lineSalesPrice(l))} against a ${money(l.floorPrice!)} floor` +
                  (l.promoUntil ? ` (${l.discount?.promoId ?? 'promotion'} ended ${shortDate(l.promoUntil)})` : ' (no promotion on file)'),
              )
              .join(' · ')}
            . Repricing with <em>hold at or above the floor</em> enabled clears this.
          </span>
        </div>
      )}

      <div className="tab-row">
        <button
          className={`tab${mode === 'Retail' ? ' active' : ''}`}
          onClick={() => setMode('Retail')}
        >
          Retail · Grocery, Club &amp; E-commerce<span className="count">{retailCount}</span>
        </button>
        <button
          className={`tab${mode === 'Foodservice' ? ' active' : ''}`}
          onClick={() => setMode('Foodservice')}
        >
          Foodservice · Contracts<span className="count">{foodserviceCount}</span>
        </button>
      </div>

      <div className="card table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={results.length > 0 && selected.size === results.length}
                  onChange={toggleAll}
                  aria-label="Select all rows"
                />
              </th>
              <th>Product</th>
              <th>Item</th>
              <th>Category</th>
              <th>Pack</th>
              {mode === 'Foodservice' ? <th>Customer / Contract</th> : <th>Channel</th>}
              <th className="num">Qty</th>
              <th className="num">Base price (TA)</th>
              <th className="num">Margin comp.</th>
              <th className="num">Discount</th>
              <th className="num">Auto charge</th>
              <th className="num">Sales price</th>
              <th className="num">Price floor</th>
              <th className="num">Margin %</th>
            </tr>
          </thead>
          <tbody>
            {results.map((l) => {
              const m = lineMarginPct(l)
              const belowFloor = lineBelowFloor(l)
              const breach = lineBreachesFloor(l, AS_OF)
              const pooled = (l.poolSharePct ?? 0) > 0
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
                      {l.productLine} · valid {shortDate(l.validFrom)} – {shortDate(l.validTo)}
                    </div>
                  </td>
                  <td className="item-code">{l.itemNumber}</td>
                  <td>{l.category}</td>
                  <td>{l.pack}</td>
                  {mode === 'Foodservice' ? (
                    <td>
                      <div>{l.channelDetail}</div>
                      <div className="style-sub">
                        {l.customerAccount} · {l.contract}
                      </div>
                    </td>
                  ) : (
                    <td>
                      <div>{l.channel}</div>
                      <div className="style-sub">{l.channelDetail}</div>
                    </td>
                  )}
                  <td className="num">
                    <input
                      type="number"
                      className="input qty-input"
                      value={l.quantity}
                      min={1}
                      onChange={(e) => setQty(l.id, Number(e.target.value))}
                      aria-label={`Quantity for ${l.itemNumber}`}
                    />
                  </td>
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
                  <td className="num">{l.autoCharge === 0 ? '—' : money(l.autoCharge)}</td>
                  <td className="num">{money(lineSalesPrice(l))}</td>
                  <td className="num">
                    {l.floorPrice === undefined ? (
                      <span style={{ color: 'var(--ink-300)' }}>—</span>
                    ) : breach ? (
                      <span className="map-breach">
                        {money(l.floorPrice)}
                        <div style={{ fontSize: 11 }}>breach</div>
                      </span>
                    ) : belowFloor ? (
                      <span style={{ color: 'var(--warning-text)' }}>
                        {money(l.floorPrice)}
                        <div style={{ fontSize: 11 }}>on promo</div>
                      </span>
                    ) : (
                      <span style={{ color: 'var(--ink-500)' }}>{money(l.floorPrice)}</span>
                    )}
                  </td>
                  <td className={`num ${m <= marginTarget ? 'margin-red' : 'margin-ok'}`}>
                    {pct(m)}
                    {pooled && (
                      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-400)' }}>
                        {pct(lineUnpooledMarginPct(l))} unpooled
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
            {results.length === 0 && (
              <tr>
                <td colSpan={14} style={{ textAlign: 'center', color: 'var(--ink-400)', padding: 32 }}>
                  No {mode.toLowerCase()} pricing at or below {marginTarget}% margin for this window
                  — the setup passes the test.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {results.length > 0 && (
        <div className="action-bar">
          <span className="count">
            {selected.size || 'All'} line{(selected.size || results.length) === 1 ? '' : 's'}
          </span>
          <span style={{ fontSize: 12.5, opacity: 0.8 }}>
            {selected.size
              ? 'selected for reprice'
              : `displayed — reprice applies to all ${results.length}`}
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
            {discountDetail.poolSharePct !== undefined && (
              <>
                <dt>Grower pool share</dt>
                <dd>
                  {discountDetail.poolSharePct}% of cost — margin reads{' '}
                  {pct(lineMarginPct(discountDetail))} pooled,{' '}
                  {pct(lineUnpooledMarginPct(discountDetail))} unpooled
                </dd>
              </>
            )}
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
          lines={repriceLines}
          note={mode === 'Foodservice' ? 'Contract lines route through trade-agreement journal approval.' : undefined}
          onClose={() => setRepriceOpen(false)}
          onApply={applyReprice}
        />
      )}
      {toastNode}
    </>
  )
}
