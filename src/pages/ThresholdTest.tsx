import { useMemo, useState } from 'react'
import { PRICING_SETUP, CATEGORIES } from '../data/mockData'
import {
  lineMarginPct,
  lineUnfundedMarginPct,
  lineSalesPrice,
  lineBelowMap,
  lineBreachesMap,
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
        <RepriceModal
          lines={repriceLines}
          note={mode === 'Vendor' ? 'Vendor lines route through trade-agreement journal approval.' : undefined}
          onClose={() => setRepriceOpen(false)}
          onApply={applyReprice}
        />
      )}
      {toastNode}
    </>
  )
}
