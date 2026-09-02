import { useMemo, useState } from 'react'
import { PRICING_SETUP, CATEGORIES } from '../data/mockData'
import {
  lineMarginPct,
  lineUnfundedMarginPct,
  lineSalesPrice,
  lineEffectiveCost,
  lineBelowMap,
  lineBreachesMap,
  type PricingSetupLine,
  type PricingMode,
  type PriceComponentTarget,
} from '../models/types'
import { money, pct, num, shortDate, isoToday } from '../lib/format'
import { AS_OF, DEFAULT_RETAIL_MARGIN_TARGET, iso } from '../lib/config'
import { Kpi } from '../components/Kpi'
import { Modal } from '../components/Modal'
import { useToast } from '../components/useToast'

const COMPONENT_LABELS: Record<PriceComponentTarget, string> = {
  basePrice: 'Base price (TA)',
  marginComponent: 'Margin component',
  discountPct: 'Discount %',
}

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

  // reprice inputs
  const [repriceComponent, setRepriceComponent] = useState<PriceComponentTarget>('discountPct')
  const [repriceTargetMargin, setRepriceTargetMargin] = useState(DEFAULT_RETAIL_MARGIN_TARGET)
  const [repriceFrom, setRepriceFrom] = useState(isoToday())
  const [repriceTo, setRepriceTo] = useState('')
  const [noEndDate, setNoEndDate] = useState(true)
  const [respectMap, setRespectMap] = useState(true)

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
  const vendorCount = matching.filter((l) => l.mode === 'Vendor').length
  const worstMargin = results.length ? lineMarginPct(results[0]) : null

  // MAP breaches are evaluated across the whole book, not just the failing set —
  // a line can sit above the margin target and still be out of compliance.
  const breaches = useMemo(() => lines.filter((l) => lineBreachesMap(l, AS_OF)), [lines])
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

  /**
   * Solve the chosen component so the line reaches the target margin.
   *   salesPrice = (base + marginComp) * (1 - disc) + autoCharge
   *   target:  (salesPrice - effectiveCost) / salesPrice = m
   *        →   salesPrice = effectiveCost / (1 - m)
   * Effective cost is net of any vendor allowance, so a co-funded line needs a
   * smaller price move than an unfunded one. When "hold at or above MAP" is on,
   * the solved price is floored at the vendor's minimum advertised price.
   */
  function repriceLine(l: PricingSetupLine): PricingSetupLine {
    const m = repriceTargetMargin / 100
    let targetSales = lineEffectiveCost(l) / (1 - m)
    if (respectMap && l.mapFloor !== undefined) targetSales = Math.max(targetSales, l.mapFloor)

    const next = { ...l, validFrom: repriceFrom, validTo: noEndDate ? iso(3650) : repriceTo }
    if (repriceComponent === 'discountPct') {
      const gross = l.basePrice + l.marginComponent
      const disc = gross > 0 ? Math.max(0, (1 - (targetSales - l.autoCharge) / gross) * 100) : 0
      next.discountPct = Math.round(disc * 10) / 10
    } else if (repriceComponent === 'basePrice') {
      const base = (targetSales - l.autoCharge) / (1 - l.discountPct / 100) - l.marginComponent
      next.basePrice = Math.round(base * 100) / 100
    } else {
      const comp = (targetSales - l.autoCharge) / (1 - l.discountPct / 100) - l.basePrice
      next.marginComponent = Math.round(comp * 100) / 100
    }
    return next
  }

  const repriceIds = selected.size ? selected : new Set(results.map((r) => r.id))
  const repricePreview = results.filter((r) => repriceIds.has(r.id)).slice(0, 5)

  function executeReprice() {
    setLines((ls) => ls.map((l) => (repriceIds.has(l.id) ? repriceLine(l) : l)))
    setRepriceOpen(false)
    setSelected(new Set())
    showToast(
      `New prices executed for ${repriceIds.size} line${repriceIds.size === 1 ? '' : 's'} · ` +
        `${COMPONENT_LABELS[repriceComponent]} solved to reach ${repriceTargetMargin}% margin` +
        (respectMap ? ', held at or above MAP' : ''),
    )
  }

  return (
    <>
      <header className="page-head">
        <div className="eyebrow">Discount thresholds &amp; approval requirements</div>
        <h1>Margin Threshold Test</h1>
        <p className="lede">
          A price simulator tests one line at a time. This finds <em>all</em> pricing setup at or
          below a margin % across a date range — ecommerce and store pricing on the retail side,
          brand programs with their MAP floors and co-op funding on the vendor side. Select lines
          and let the agent draft a new price.
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
          tone={worstMargin !== null && worstMargin < 30 ? 'red' : 'default'}
          sub={results.length ? results[0].styleName : 'no failures'}
        />
        <Kpi label="Retail failures" value={num(retailCount)} sub="ecommerce + store" />
        <Kpi label="Vendor failures" value={num(vendorCount)} sub="brand programs" />
        <Kpi
          label="MAP breaches"
          value={num(breaches.length)}
          tone={breaches.length ? 'red' : 'sage'}
          sub="whole book, no active waiver"
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
              {breachesInMode.length === 1 ? '' : 's'} price below a vendor MAP floor with no active
              waiver:
            </b>{' '}
            {breachesInMode
              .map(
                (l) =>
                  `${l.itemNumber} at ${money(lineSalesPrice(l))} against a ${money(l.mapFloor!)} floor` +
                  (l.mapWaiverUntil ? ` (waiver expired ${shortDate(l.mapWaiverUntil)})` : ' (no waiver on file)'),
              )
              .join(' · ')}
            . Repricing with <em>hold at or above MAP</em> enabled clears this.
          </span>
        </div>
      )}

      <div className="tab-row">
        <button
          className={`tab${mode === 'Retail' ? ' active' : ''}`}
          onClick={() => setMode('Retail')}
        >
          Retail · Ecommerce &amp; Stores<span className="count">{retailCount}</span>
        </button>
        <button
          className={`tab${mode === 'Vendor' ? ' active' : ''}`}
          onClick={() => setMode('Vendor')}
        >
          Vendor · Brand Programs<span className="count">{vendorCount}</span>
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
              <th>Color / Size</th>
              {mode === 'Vendor' ? <th>Brand / Program</th> : <th>Channel</th>}
              <th className="num">Qty</th>
              <th className="num">Base price (TA)</th>
              <th className="num">Margin comp.</th>
              <th className="num">Discount</th>
              <th className="num">Auto charge</th>
              <th className="num">Sales price</th>
              <th className="num">MAP floor</th>
              <th className="num">Margin %</th>
            </tr>
          </thead>
          <tbody>
            {results.map((l) => {
              const m = lineMarginPct(l)
              const belowMap = lineBelowMap(l)
              const breach = lineBreachesMap(l, AS_OF)
              const funded = (l.vendorAllowancePct ?? 0) > 0
              return (
                <tr key={l.id} className={selected.has(l.id) ? 'row-selected' : undefined}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(l.id)}
                      onChange={() => toggle(l.id)}
                      aria-label={`Select ${l.styleName}`}
                    />
                  </td>
                  <td className="style-cell">
                    <div className="style-name">{l.styleName}</div>
                    <div className="style-sub">
                      {l.productLine} · valid {shortDate(l.validFrom)} – {shortDate(l.validTo)}
                    </div>
                  </td>
                  <td className="item-code">{l.itemNumber}</td>
                  <td>{l.category}</td>
                  <td>{l.colorSize}</td>
                  {mode === 'Vendor' ? (
                    <td>
                      <div>{l.channelDetail}</div>
                      <div className="style-sub">
                        {l.vendorAccount} · {l.vendorProgram}
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
                    {l.mapFloor === undefined ? (
                      <span style={{ color: 'var(--ink-300)' }}>—</span>
                    ) : breach ? (
                      <span className="map-breach">
                        {money(l.mapFloor)}
                        <div style={{ fontSize: 11 }}>breach</div>
                      </span>
                    ) : belowMap ? (
                      <span style={{ color: 'var(--warning-text)' }}>
                        {money(l.mapFloor)}
                        <div style={{ fontSize: 11 }}>waived</div>
                      </span>
                    ) : (
                      <span style={{ color: 'var(--ink-500)' }}>{money(l.mapFloor)}</span>
                    )}
                  </td>
                  <td className={`num ${m <= marginTarget ? 'margin-red' : 'margin-ok'}`}>
                    {pct(m)}
                    {funded && (
                      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-400)' }}>
                        {pct(lineUnfundedMarginPct(l))} unfunded
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
          <button className="btn gold" onClick={() => setRepriceOpen(true)}>
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
              {discountDetail.styleName} ({discountDetail.itemNumber}) · {discountDetail.colorSize}
            </dd>
            <dt>Current qty</dt>
            <dd>
              {num(discountDetail.quantity)} → effective {pct(discountDetail.discountPct, 0)} off
            </dd>
            {discountDetail.vendorAllowancePct !== undefined && (
              <>
                <dt>Vendor funding</dt>
                <dd>
                  {discountDetail.vendorAllowancePct}% of cost — margin reads{' '}
                  {pct(lineMarginPct(discountDetail))} funded,{' '}
                  {pct(lineUnfundedMarginPct(discountDetail))} unfunded
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
        <Modal
          title="Draft new price"
          sub={`The agent solves the chosen component so each line reaches the target margin, measured against cost net of any vendor allowance.${mode === 'Vendor' ? ' Vendor lines route through trade-agreement journal approval.' : ''}`}
          onClose={() => setRepriceOpen(false)}
          actions={
            <>
              <button className="btn ghost" onClick={() => setRepriceOpen(false)}>
                Cancel
              </button>
              <button className="btn gold" onClick={executeReprice}>
                Confirm &amp; execute new price
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="field">
              <label>Items to update</label>
              <div style={{ fontSize: 13 }}>
                {selected.size
                  ? `${selected.size} selected line${selected.size === 1 ? '' : 's'}`
                  : `All ${results.length} displayed lines`}
              </div>
            </div>
            <div className="field">
              <label>Price component to update</label>
              <select
                className="select"
                value={repriceComponent}
                onChange={(e) => setRepriceComponent(e.target.value as PriceComponentTarget)}
              >
                <option value="basePrice">Base price (trade agreement)</option>
                <option value="marginComponent">Margin component</option>
                <option value="discountPct">Discount %</option>
              </select>
            </div>
            <div className="field">
              <label>Target margin %</label>
              <input
                type="number"
                className="input"
                style={{ width: 120 }}
                value={repriceTargetMargin}
                min={0}
                max={95}
                onChange={(e) => setRepriceTargetMargin(Number(e.target.value))}
              />
            </div>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
              <input
                type="checkbox"
                checked={respectMap}
                onChange={(e) => setRespectMap(e.target.checked)}
              />
              Hold at or above the vendor MAP floor
            </label>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="field">
                <label>Effective from</label>
                <input
                  type="date"
                  className="input"
                  value={repriceFrom}
                  onChange={(e) => setRepriceFrom(e.target.value)}
                />
              </div>
              <div className="field">
                <label>To</label>
                <input
                  type="date"
                  className="input"
                  value={repriceTo}
                  disabled={noEndDate}
                  onChange={(e) => setRepriceTo(e.target.value)}
                />
              </div>
              <label
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  fontSize: 13,
                  paddingBottom: 8,
                }}
              >
                <input
                  type="checkbox"
                  checked={noEndDate}
                  onChange={(e) => setNoEndDate(e.target.checked)}
                />
                No end date
              </label>
            </div>

            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>
                Preview
              </div>
              <table className="tier-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Today</th>
                    <th>New {COMPONENT_LABELS[repriceComponent]}</th>
                    <th>New margin</th>
                  </tr>
                </thead>
                <tbody>
                  {repricePreview.map((l) => {
                    const next = repriceLine(l)
                    return (
                      <tr key={l.id}>
                        <td className="mono">
                          {l.itemNumber} · {l.colorSize}
                        </td>
                        <td className="num">
                          {money(lineSalesPrice(l))} ({pct(lineMarginPct(l))})
                        </td>
                        <td className="num">
                          {repriceComponent === 'discountPct'
                            ? pct(next.discountPct, 1)
                            : money(next[repriceComponent])}
                        </td>
                        <td className="num margin-ok">{pct(lineMarginPct(next))}</td>
                      </tr>
                    )
                  })}
                  {repriceIds.size > repricePreview.length && (
                    <tr>
                      <td colSpan={4} style={{ color: 'var(--ink-400)' }}>
                        …and {repriceIds.size - repricePreview.length} more lines
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}
      {toastNode}
    </>
  )
}
