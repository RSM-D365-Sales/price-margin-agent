import { useMemo, useState } from 'react'
import { PRICE_OVERRIDES } from '../data/mockData'
import { overrideMarginPct, overrideBreachesFloor, type PriceOverride } from '../models/types'
import { money, pct, num, shortDate, isoDaysAgo, isoToday } from '../lib/format'
import { DEFAULT_RETAIL_MARGIN_TARGET } from '../lib/config'
import { Kpi } from '../components/Kpi'
import { Modal } from '../components/Modal'
import { useToast } from '../components/useToast'

type ActionKind = 'email' | 'case'

export function Overrides() {
  // filters — default: last 90 days, margin at or below the retail target
  const [fromDate, setFromDate] = useState(isoDaysAgo(90))
  const [toDate, setToDate] = useState(isoToday())
  const [marginFilter, setMarginFilter] = useState(DEFAULT_RETAIL_MARGIN_TARGET)
  const [floorOnly, setFloorOnly] = useState(false)
  const [action, setAction] = useState<{ kind: ActionKind; row: PriceOverride } | null>(null)
  const [, showToast, toastNode] = useToast()

  const inDateRange = useMemo(
    () => PRICE_OVERRIDES.filter((o) => o.orderDate >= fromDate && o.orderDate <= toDate),
    [fromDate, toDate],
  )

  // at or below the margin filter, sorted lowest → highest margin
  const rows = useMemo(
    () =>
      inDateRange
        .filter((o) => overrideMarginPct(o) <= marginFilter)
        .filter((o) => (floorOnly ? overrideBreachesFloor(o) : true))
        .sort((a, b) => overrideMarginPct(a) - overrideMarginPct(b)),
    [inDateRange, marginFilter, floorOnly],
  )

  const kpis = useMemo(() => {
    const margins = inDateRange.map(overrideMarginPct)
    const below = margins.filter((m) => m <= marginFilter).length
    const avg = margins.length ? margins.reduce((s, m) => s + m, 0) / margins.length : 0
    const givenUp = inDateRange.reduce((s, o) => s + (o.originalPrice - o.overridePrice) * o.cases, 0)
    const floorHits = inDateRange.filter(overrideBreachesFloor).length
    return { total: inDateRange.length, below, avg, givenUp, floorHits }
  }, [inDateRange, marginFilter])

  function completeAction() {
    if (!action) return
    showToast(
      action.kind === 'email'
        ? `Follow-up email drafted to ${action.row.overriddenBy}`
        : `D365 case created for order ${action.row.orderNumber}`,
    )
    setAction(null)
  }

  return (
    <>
      <header className="page-head">
        <div className="eyebrow">Audit trail · Sales-order line price overrides</div>
        <h1>Override Audit</h1>
        <p className="lede">
          Every sales-order line where a rep typed over the system price, across retail and
          foodservice. Filtered to margins at or below your threshold, ranked lowest margin first.
          Packed-fresh items in a price group also show whether the override went under the floor.
        </p>
      </header>

      <div className="kpi-strip">
        <Kpi
          label="Price overrides"
          value={num(kpis.total)}
          sub={`${shortDate(fromDate)} – ${shortDate(toDate)}`}
        />
        <Kpi
          label={`At or below ${marginFilter}% margin`}
          value={num(kpis.below)}
          tone={kpis.below > 0 ? 'red' : 'sage'}
          sub="shown in the grid below"
        />
        <Kpi
          label="Below price floor"
          value={num(kpis.floorHits)}
          tone={kpis.floorHits > 0 ? 'red' : 'sage'}
          sub="items in a floor price group"
        />
        <Kpi label="Average override margin" value={pct(kpis.avg)} sub="across the date range" />
        <Kpi
          label="Price given up"
          value={money(kpis.givenUp, { decimals: 0 })}
          sub="(original − override) × cases"
        />
      </div>

      <div className="card filter-bar">
        <div className="field">
          <label>From date</label>
          <input
            type="date"
            className="input"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="field">
          <label>To date</label>
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
            style={{ width: 110 }}
            value={marginFilter}
            min={0}
            max={100}
            onChange={(e) => setMarginFilter(Number(e.target.value))}
          />
        </div>
        <label
          style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, paddingBottom: 8 }}
        >
          <input type="checkbox" checked={floorOnly} onChange={(e) => setFloorOnly(e.target.checked)} />
          Below floor only
        </label>
        <div className="spacer" />
        <span className="pill midnight">{rows.length} lines match</span>
      </div>

      <div className="card table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Item</th>
              <th>Category</th>
              <th>Pack</th>
              <th className="num">Unit cost</th>
              <th className="num">Override price</th>
              <th className="num">Margin %</th>
              <th className="num">Price floor</th>
              <th>Reason code</th>
              <th>Overridden by</th>
              <th>Follow up</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => {
              const m = overrideMarginPct(o)
              const isRed = m <= marginFilter
              const belowFloor = overrideBreachesFloor(o)
              return (
                <tr key={o.id}>
                  <td className="style-cell">
                    <div className="style-name">{o.itemName}</div>
                    <div className="style-sub">
                      {o.orderNumber} · {o.customer} · {num(o.cases)} cs · {shortDate(o.orderDate)}
                    </div>
                  </td>
                  <td className="item-code">{o.itemNumber}</td>
                  <td>{o.category}</td>
                  <td>{o.pack}</td>
                  <td className="num">{money(o.unitCost)}</td>
                  <td className="num">
                    {money(o.overridePrice)}
                    <div className="style-sub" style={{ textDecoration: 'line-through' }}>
                      {money(o.originalPrice)}
                    </div>
                  </td>
                  <td className={`num ${isRed ? 'margin-red' : 'margin-ok'}`}>{pct(m)}</td>
                  <td className="num">
                    {o.floorPrice === undefined ? (
                      <span style={{ color: 'var(--ink-300)' }}>—</span>
                    ) : belowFloor ? (
                      <span className="map-breach">
                        {money(o.floorPrice)}
                        <div style={{ fontSize: 11, fontWeight: 500 }}>
                          −{money(o.floorPrice - o.overridePrice)} under
                        </div>
                      </span>
                    ) : (
                      <span style={{ color: 'var(--ink-500)' }}>{money(o.floorPrice)}</span>
                    )}
                  </td>
                  <td>
                    <span className="pill">{o.reasonCode}</span>
                  </td>
                  <td>{o.overriddenBy}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button
                        className="link-btn"
                        onClick={() => setAction({ kind: 'email', row: o })}
                      >
                        Email
                      </button>
                      <button
                        className="link-btn"
                        onClick={() => setAction({ kind: 'case', row: o })}
                      >
                        Create case
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', color: 'var(--ink-400)', padding: 32 }}>
                  No overrides at or below {marginFilter}% margin
                  {floorOnly ? ' that are also below floor' : ''} in this date range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {action && (
        <Modal
          title={action.kind === 'email' ? 'Email the rep' : 'Create a D365 case'}
          sub={
            action.kind === 'email'
              ? `Draft a follow-up to ${action.row.overriddenBy} about this override`
              : `Open a follow-up case in Dynamics 365 linked to order ${action.row.orderNumber}`
          }
          onClose={() => setAction(null)}
          actions={
            <>
              <button className="btn ghost" onClick={() => setAction(null)}>
                Cancel
              </button>
              <button className="btn primary" onClick={completeAction}>
                {action.kind === 'email' ? 'Send email' : 'Create case'}
              </button>
            </>
          }
        >
          <dl className="detail-list">
            <dt>Order</dt>
            <dd>
              {action.row.orderNumber} · {shortDate(action.row.orderDate)} · {action.row.channel} ·{' '}
              {action.row.customer} · {num(action.row.cases)} cases
            </dd>
            <dt>Product</dt>
            <dd>
              {action.row.itemName} ({action.row.itemNumber}) · {action.row.pack}
            </dd>
            <dt>Override</dt>
            <dd>
              {money(action.row.originalPrice)} → {money(action.row.overridePrice)} ·{' '}
              <span className="margin-red">{pct(overrideMarginPct(action.row))} margin</span>
            </dd>
            {action.row.floorPrice !== undefined && (
              <>
                <dt>Price floor</dt>
                <dd>
                  {money(action.row.floorPrice)}
                  {overrideBreachesFloor(action.row) ? (
                    <span className="map-breach">
                      {' '}
                      · {money(action.row.floorPrice - action.row.overridePrice)} under the floor
                    </span>
                  ) : (
                    ' · at or above the floor'
                  )}
                </dd>
              </>
            )}
            <dt>Reason</dt>
            <dd>{action.row.reasonCode}</dd>
            <dt>Rep</dt>
            <dd>
              {action.row.overriddenBy} · {action.row.overriddenByEmail}
            </dd>
          </dl>
          {action.kind === 'email' ? (
            <div className="field" style={{ marginTop: 18 }}>
              <label>Message</label>
              <textarea
                className="input"
                rows={6}
                defaultValue={
                  `Hi ${action.row.overriddenBy.split(' ')[0]},\n\n` +
                  `On order ${action.row.orderNumber} the price of ${action.row.itemName} (${action.row.itemNumber}) was overridden to ${money(action.row.overridePrice)}, which lands at ${pct(overrideMarginPct(action.row))} margin.` +
                  (overrideBreachesFloor(action.row)
                    ? ` That is also ${money(action.row.floorPrice! - action.row.overridePrice)} below the ${money(action.row.floorPrice!)} price floor for this customer group, and there is no active trade promotion behind it.`
                    : '') +
                  `\n\nCould you add context to the "${action.row.reasonCode}" reason code?\n\nThanks,\nPricing team`
                }
              />
            </div>
          ) : (
            <div className="field" style={{ marginTop: 18 }}>
              <label>Case title</label>
              <input
                className="input"
                defaultValue={
                  overrideBreachesFloor(action.row)
                    ? `Below-floor review · ${action.row.orderNumber} · ${action.row.itemNumber}`
                    : `Price override review · ${action.row.orderNumber} · ${action.row.itemNumber}`
                }
              />
            </div>
          )}
        </Modal>
      )}
      {toastNode}
    </>
  )
}
