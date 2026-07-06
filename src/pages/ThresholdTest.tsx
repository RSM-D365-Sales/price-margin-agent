import { useMemo, useState } from 'react'
import { PRICING_SETUP, CATEGORIES } from '../data/mockData'
import {
  lineMarginPct,
  lineSalesPrice,
  type PricingSetupLine,
  type PricingMode,
  type PriceComponentTarget,
} from '../models/types'
import { money, pct, num, shortDate, isoToday } from '../lib/format'
import { Kpi } from '../components/Kpi'
import { Modal } from '../components/Modal'
import { useToast } from '../components/useToast'

const COMPONENT_LABELS: Record<PriceComponentTarget, string> = {
  basePrice: 'Base price (TA)',
  marginComponent: 'Margin component',
  discountPct: 'Discount %',
}

export function ThresholdTest() {
  // test inputs
  const [fromDate, setFromDate] = useState('2026-07-01')
  const [toDate, setToDate] = useState('2026-07-31')
  const [marginTarget, setMarginTarget] = useState(50)
  const [category, setCategory] = useState<string>('All')
  const [mode, setMode] = useState<PricingMode>('D2C')
  const [hasRun, setHasRun] = useState(true)

  // editable quantities + repriced lines are local overlays on the mock setup
  const [lines, setLines] = useState<PricingSetupLine[]>(PRICING_SETUP)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [discountDetail, setDiscountDetail] = useState<PricingSetupLine | null>(null)
  const [repriceOpen, setRepriceOpen] = useState(false)
  const [, showToast, toastNode] = useToast()

  // reprice inputs
  const [repriceComponent, setRepriceComponent] = useState<PriceComponentTarget>('discountPct')
  const [repriceTargetMargin, setRepriceTargetMargin] = useState(50)
  const [repriceFrom, setRepriceFrom] = useState(isoToday())
  const [repriceTo, setRepriceTo] = useState('')
  const [noEndDate, setNoEndDate] = useState(true)

  const results = useMemo(() => {
    if (!hasRun) return []
    return lines
      .filter((l) => l.mode === mode)
      .filter((l) => (category === 'All' ? true : l.category === category))
      // active pricing overlapping the test window
      .filter((l) => l.validFrom <= toDate && l.validTo >= fromDate)
      // at or below the margin target
      .filter((l) => lineMarginPct(l) <= marginTarget)
      .sort((a, b) => lineMarginPct(a) - lineMarginPct(b))
  }, [lines, mode, category, fromDate, toDate, marginTarget, hasRun])

  const d2cCount = useMemo(
    () =>
      lines.filter(
        (l) =>
          l.mode === 'D2C' &&
          (category === 'All' || l.category === category) &&
          l.validFrom <= toDate &&
          l.validTo >= fromDate &&
          lineMarginPct(l) <= marginTarget,
      ).length,
    [lines, category, fromDate, toDate, marginTarget],
  )
  const b2bCount = useMemo(
    () =>
      lines.filter(
        (l) =>
          l.mode === 'B2B' &&
          (category === 'All' || l.category === category) &&
          l.validFrom <= toDate &&
          l.validTo >= fromDate &&
          lineMarginPct(l) <= marginTarget,
      ).length,
    [lines, category, fromDate, toDate, marginTarget],
  )

  const worstMargin = results.length ? lineMarginPct(results[0]) : null

  function setQty(id: string, qty: number) {
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, quantity: Math.max(1, qty) } : l)))
  }

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  function toggleAll() {
    setSelected((s) =>
      s.size === results.length ? new Set() : new Set(results.map((r) => r.id)),
    )
  }

  // Solve the chosen component so the line reaches the target margin %.
  // salesPrice = (base + marginComp) * (1 - disc) + autoCharge
  // target: (salesPrice - cost) / salesPrice = m  →  salesPrice = cost / (1 - m)
  function repriceLine(l: PricingSetupLine): PricingSetupLine {
    const m = repriceTargetMargin / 100
    const targetSales = l.unitCost / (1 - m)
    const next = { ...l, validFrom: repriceFrom, validTo: noEndDate ? '2099-12-31' : repriceTo }
    if (repriceComponent === 'discountPct') {
      const gross = l.basePrice + l.marginComponent
      const disc = gross > 0 ? Math.max(0, (1 - (targetSales - l.autoCharge) / gross) * 100) : 0
      next.discountPct = Math.round(disc * 10) / 10
    } else if (repriceComponent === 'basePrice') {
      const base =
        (targetSales - l.autoCharge) / (1 - l.discountPct / 100) - l.marginComponent
      next.basePrice = Math.round(base * 100) / 100
    } else {
      const comp = (targetSales - l.autoCharge) / (1 - l.discountPct / 100) - l.basePrice
      next.marginComponent = Math.round(comp * 100) / 100
    }
    return next
  }

  function executeReprice() {
    const ids = selected.size ? selected : new Set(results.map((r) => r.id))
    setLines((ls) => ls.map((l) => (ids.has(l.id) ? repriceLine(l) : l)))
    setRepriceOpen(false)
    setSelected(new Set())
    showToast(
      `New prices executed for ${ids.size} line${ids.size === 1 ? '' : 's'} · ${COMPONENT_LABELS[repriceComponent]} adjusted to reach ${repriceTargetMargin}% margin`,
    )
  }

  const repriceIds = selected.size ? selected : new Set(results.map((r) => r.id))
  const repricePreview = results.filter((r) => repriceIds.has(r.id)).slice(0, 5)

  return (
    <>
      <header className="page-head">
        <div className="eyebrow">Discount thresholds &amp; approval requirements</div>
        <h1>Margin Threshold Test</h1>
        <p className="lede">
          The price simulator lets you test manually — this agent finds <em>all</em> pricing setup
          at or below a margin % across a date range: ecommerce and retail store pricing for D2C,
          and customer / customer-group agreements for B2B. Select lines and let the agent draft a
          new price.
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
          sub={results.length ? `${results[0].styleName}` : 'no failures'}
        />
        <Kpi label="D2C failures" value={num(d2cCount)} sub="ecommerce + retail store" />
        <Kpi label="B2B failures" value={num(b2bCount)} sub="wholesale customers & groups" />
      </div>

      <div className="tab-row">
        <button className={`tab${mode === 'D2C' ? ' active' : ''}`} onClick={() => setMode('D2C')}>
          D2C · Ecommerce &amp; Retail<span className="count">{d2cCount}</span>
        </button>
        <button className={`tab${mode === 'B2B' ? ' active' : ''}`} onClick={() => setMode('B2B')}>
          B2B · Wholesale<span className="count">{b2bCount}</span>
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
                />
              </th>
              <th>Style description</th>
              <th>Item</th>
              <th>Category</th>
              <th>Color / Size</th>
              {mode === 'B2B' && <th>Customer / Group</th>}
              {mode === 'D2C' && <th>Channel</th>}
              <th className="num">Qty</th>
              <th className="num">Base price (TA)</th>
              <th className="num">Margin comp.</th>
              <th className="num">Discount</th>
              <th className="num">Auto charge</th>
              <th className="num">Sales price</th>
              <th className="num">Margin %</th>
            </tr>
          </thead>
          <tbody>
            {results.map((l) => {
              const m = lineMarginPct(l)
              return (
                <tr key={l.id} className={selected.has(l.id) ? 'row-selected' : undefined}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(l.id)}
                      onChange={() => toggle(l.id)}
                    />
                  </td>
                  <td className="style-cell">
                    <div className="style-name">{l.styleName}</div>
                    <div className="style-sub">
                      Valid {shortDate(l.validFrom)} – {shortDate(l.validTo)}
                    </div>
                  </td>
                  <td>{l.itemNumber}</td>
                  <td>{l.category}</td>
                  <td>{l.colorSize}</td>
                  {mode === 'B2B' && (
                    <td>
                      {l.customerAccount ? (
                        <>
                          <div>{l.channelDetail}</div>
                          <div className="style-sub">
                            {l.customerAccount} · {l.customerGroup}
                          </div>
                        </>
                      ) : (
                        <>
                          <div>{l.customerGroup}</div>
                          <div className="style-sub">customer price group</div>
                        </>
                      )}
                    </td>
                  )}
                  {mode === 'D2C' && (
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
                    />
                  </td>
                  <td className="num">{money(l.basePrice)}</td>
                  <td className="num">{l.marginComponent === 0 ? '—' : money(l.marginComponent)}</td>
                  <td className="num">
                    {l.discountPct === 0 ? (
                      '—'
                    ) : l.discount && (l.discount.type === 'Threshold' || l.discount.type === 'Quantity') ? (
                      <button className="link-btn" onClick={() => setDiscountDetail(l)}>
                        {pct(l.discountPct, 0)} ▸
                      </button>
                    ) : (
                      pct(l.discountPct, 0)
                    )}
                  </td>
                  <td className="num">{l.autoCharge === 0 ? '—' : money(l.autoCharge)}</td>
                  <td className="num">{money(lineSalesPrice(l))}</td>
                  <td className={`num ${m <= marginTarget ? 'margin-red' : 'margin-ok'}`}>
                    {pct(m)}
                  </td>
                </tr>
              )
            })}
            {results.length === 0 && (
              <tr>
                <td
                  colSpan={mode === 'B2B' ? 14 : 14}
                  style={{ textAlign: 'center', color: 'var(--ink-3)', padding: 32 }}
                >
                  No {mode} pricing at or below {marginTarget}% margin for this window — the setup
                  passes the test.
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
          <span style={{ fontSize: 12, letterSpacing: '0.08em', opacity: 0.75 }}>
            {selected.size
              ? 'selected for reprice'
              : `displayed — reprice applies to all ${results.length}`}
          </span>
          <div className="spacer" />
          <button className="btn camel" onClick={() => setRepriceOpen(true)}>
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
          sub={`The agent solves the chosen component so each line reaches the target margin. ${mode === 'B2B' ? 'B2B lines route through trade-agreement journal approval.' : ''}`}
          onClose={() => setRepriceOpen(false)}
          actions={
            <>
              <button className="btn ghost" onClick={() => setRepriceOpen(false)}>
                Cancel
              </button>
              <button className="btn camel" onClick={executeReprice}>
                Confirm &amp; execute new price
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
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
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12.5, paddingBottom: 9 }}>
                <input
                  type="checkbox"
                  checked={noEndDate}
                  onChange={(e) => setNoEndDate(e.target.checked)}
                />
                No end date
              </label>
            </div>

            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>
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
                        <td>
                          {l.itemNumber} · {l.colorSize}
                        </td>
                        <td>
                          {money(lineSalesPrice(l))} ({pct(lineMarginPct(l))})
                        </td>
                        <td>
                          {repriceComponent === 'discountPct'
                            ? pct(next.discountPct, 1)
                            : money(next[repriceComponent])}
                        </td>
                        <td className="margin-ok">{pct(lineMarginPct(next))}</td>
                      </tr>
                    )
                  })}
                  {repriceIds.size > repricePreview.length && (
                    <tr>
                      <td colSpan={4} style={{ color: 'var(--ink-3)' }}>
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
