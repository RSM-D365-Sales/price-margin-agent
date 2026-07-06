import { useMemo, useState } from 'react'
import { PRICE_OVERRIDES } from '../data/mockData'
import { overrideMarginPct, type PriceOverride } from '../models/types'
import { money, pct, num, shortDate, isoDaysAgo, isoToday } from '../lib/format'
import { Kpi } from '../components/Kpi'
import { Modal } from '../components/Modal'
import { useToast } from '../components/useToast'

type ActionKind = 'email' | 'case'

export function Overrides() {
  // filters — default: last 90 days, margin at or below 50%
  const [fromDate, setFromDate] = useState(isoDaysAgo(90))
  const [toDate, setToDate] = useState(isoToday())
  const [marginFilter, setMarginFilter] = useState(50)
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
        .sort((a, b) => overrideMarginPct(a) - overrideMarginPct(b)),
    [inDateRange, marginFilter],
  )

  const kpis = useMemo(() => {
    const margins = inDateRange.map(overrideMarginPct)
    const below = margins.filter((m) => m <= marginFilter).length
    const avg = margins.length ? margins.reduce((s, m) => s + m, 0) / margins.length : 0
    const marginGivenUp = inDateRange.reduce((s, o) => s + (o.originalPrice - o.overridePrice), 0)
    return { total: inDateRange.length, below, avg, marginGivenUp }
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
        <div className="eyebrow">Audit trail · Pricing overrides</div>
        <h1>Override Audit</h1>
        <p className="lede">
          Every sales order where a price was manually overridden. Filtered to margins at or below
          your threshold, ranked lowest margin first. Follow up by emailing the user or raising a
          case in D365.
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
        <Kpi label="Average override margin" value={pct(kpis.avg)} sub="across the date range" />
        <Kpi
          label="Price reduction given up"
          value={money(kpis.marginGivenUp, { decimals: 0 })}
          sub="original vs. override price"
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
        <div className="spacer" />
        <span className="pill camel">{rows.length} lines match</span>
      </div>

      <div className="card table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Style description</th>
              <th>Item</th>
              <th>Category</th>
              <th>Color / Size</th>
              <th className="num">Unit cost</th>
              <th className="num">Override price</th>
              <th className="num">Margin %</th>
              <th>Reason code</th>
              <th>Overridden by</th>
              <th>Follow up</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => {
              const m = overrideMarginPct(o)
              const isRed = m <= marginFilter
              return (
                <tr key={o.id}>
                  <td className="style-cell">
                    <div className="style-name">{o.styleName}</div>
                    <div className="style-sub">
                      {o.orderNumber} · {o.channel} · {shortDate(o.orderDate)}
                    </div>
                  </td>
                  <td>{o.itemNumber}</td>
                  <td>{o.category}</td>
                  <td>{o.colorSize}</td>
                  <td className="num">{money(o.unitCost)}</td>
                  <td className="num">
                    {money(o.overridePrice)}
                    <div className="style-sub" style={{ textDecoration: 'line-through' }}>
                      {money(o.originalPrice)}
                    </div>
                  </td>
                  <td className={`num ${isRed ? 'margin-red' : 'margin-ok'}`}>{pct(m)}</td>
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
                <td colSpan={10} style={{ textAlign: 'center', color: 'var(--ink-3)', padding: 32 }}>
                  No overrides at or below {marginFilter}% margin in this date range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {action && (
        <Modal
          title={action.kind === 'email' ? 'Email the user' : 'Create a D365 case'}
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
              <button className="btn camel" onClick={completeAction}>
                {action.kind === 'email' ? 'Send email' : 'Create case'}
              </button>
            </>
          }
        >
          <dl className="detail-list">
            <dt>Order</dt>
            <dd>
              {action.row.orderNumber} · {shortDate(action.row.orderDate)} · {action.row.channel} ·{' '}
              {action.row.storeOrSite}
            </dd>
            <dt>Product</dt>
            <dd>
              {action.row.styleName} ({action.row.itemNumber}) · {action.row.colorSize}
            </dd>
            <dt>Override</dt>
            <dd>
              {money(action.row.originalPrice)} → {money(action.row.overridePrice)} ·{' '}
              <span className="margin-red">{pct(overrideMarginPct(action.row))} margin</span>
            </dd>
            <dt>Reason</dt>
            <dd>{action.row.reasonCode}</dd>
            <dt>User</dt>
            <dd>
              {action.row.overriddenBy} · {action.row.overriddenByEmail}
            </dd>
          </dl>
          {action.kind === 'email' ? (
            <div className="field" style={{ marginTop: 18 }}>
              <label>Message</label>
              <textarea
                className="input"
                rows={5}
                defaultValue={`Hi ${action.row.overriddenBy.split(' ')[0]},\n\nOn order ${action.row.orderNumber} the price of ${action.row.styleName} (${action.row.itemNumber}) was overridden to ${money(action.row.overridePrice)}, which lands at ${pct(overrideMarginPct(action.row))} margin. Could you add context to the "${action.row.reasonCode}" reason code?\n\nThanks,\nPricing team`}
              />
            </div>
          ) : (
            <div className="field" style={{ marginTop: 18 }}>
              <label>Case title</label>
              <input
                className="input"
                defaultValue={`Price override review · ${action.row.orderNumber} · ${action.row.itemNumber}`}
              />
            </div>
          )}
        </Modal>
      )}
      {toastNode}
    </>
  )
}
