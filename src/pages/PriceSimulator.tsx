import { useMemo, useState } from 'react'
import { SIMULATOR } from '../data/mockData'
import {
  evaluatePrice,
  RELATION_LABEL,
  type LineStatus,
  type PriceResult,
  type SearchStep,
  type SimulatorData,
} from '../models/tradeAgreements'
import { AS_OF, DEFAULT_RETAIL_MARGIN_TARGET } from '../lib/config'
import { money, num, pct, shortDate } from '../lib/format'
import { Kpi } from '../components/Kpi'

const STATUS: Record<LineStatus, { label: string; pill: string }> = {
  applied: { label: 'Applied', pill: 'good' },
  superseded: { label: 'Higher price', pill: 'grey' },
  qty: { label: 'Qty out of range', pill: 'warn' },
  date: { label: 'Outside dates', pill: 'warn' },
  stopped: { label: 'Not reached', pill: 'grey' },
  otherAccount: { label: 'Not this customer', pill: '' },
}

const OUTCOME: Record<SearchStep['outcome'], string> = {
  found: 'Found',
  none: 'Nothing found',
  notSearched: 'Not searched',
  noGroup: 'Customer has no group',
}

export function PriceSimulator() {
  // The route only exists when the scenario ships a journal.
  return SIMULATOR ? <Simulator data={SIMULATOR} /> : null
}

interface WaterfallRow {
  label: string
  sub: string
  from: number
  to: number
  kind: 'total' | 'step'
  value: number
}

function Simulator({ data }: { data: SimulatorData }) {
  const [account, setAccount] = useState(data.defaults.customer)
  const customer = data.customers.find((c) => c.account === account) ?? data.customers[0]
  const [itemNumber, setItemNumber] = useState(data.defaults.item)
  const effectiveItem = customer.items.includes(itemNumber) ? itemNumber : customer.items[0]
  const item = data.items.find((i) => i.itemNumber === effectiveItem)!
  const [qty, setQty] = useState(data.defaults.qty)
  const [date, setDate] = useState(AS_OF)
  const [hover, setHover] = useState<number | null>(null)

  const r = useMemo(
    () => evaluatePrice(data, customer, item, Math.max(0, qty), date),
    [data, customer, item, qty, date],
  )

  const floor = DEFAULT_RETAIL_MARGIN_TARGET
  const floorPrice = r.unitCost / (1 - floor / 100)
  const belowFloor = !customer.floorExempt && r.marginPct < floor
  const stoppedLine = r.lines.find((l) => l.status === 'applied' && !l.line.findNext)
  const rows = waterfall(r)

  const groupName = (code: string | undefined, names: Record<string, string>) =>
    code ? `${code} · ${names[code] ?? code}` : '—'

  return (
    <>
      <header className="page-head">
        <div className="eyebrow">Trade agreement evaluation · sales price</div>
        <h1>Price Simulator</h1>
        <p className="lede">{data.lede}</p>
      </header>

      <div className="card filter-bar">
        <div className="field">
          <label>Customer</label>
          <select className="select" value={customer.account} onChange={(e) => setAccount(e.target.value)}>
            {data.customers.map((c) => (
              <option key={c.account} value={c.account}>
                {c.account} · {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Product</label>
          <select className="select" value={item.itemNumber} onChange={(e) => setItemNumber(e.target.value)}>
            {customer.items.map((n) => {
              const i = data.items.find((x) => x.itemNumber === n)!
              return (
                <option key={n} value={n}>
                  {n} · {i.name}
                </option>
              )
            })}
          </select>
        </div>
        <div className="field">
          <label>Quantity ({item.unit})</label>
          <input
            type="number"
            className="input"
            style={{ width: 100 }}
            min={1}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label>Price date</label>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value || AS_OF)} />
        </div>
      </div>

      <div className="sim-context">
        <span className="pill midnight">{customer.type}</span>
        <span className="pill">Price group: {groupName(customer.priceGroup, data.priceGroups)}</span>
        <span className="pill">
          Line discount group: {groupName(customer.lineDiscountGroup, data.lineDiscountGroups)}
        </span>
        <span className="pill">
          Item discount group: {groupName(item.lineDiscountGroup, data.itemDiscountGroups)}
        </span>
      </div>

      <div className="kpi-strip">
        <Kpi label="Base price" value={money(r.basePrice)} sub="item sales price" />
        <Kpi
          label="Trade agreement price"
          value={money(r.price)}
          sub={r.priceLine ? `${r.priceLine.accountCode} · ${r.priceLine.accountSelection || 'All'}` : 'none found — base price'}
        />
        <Kpi
          label="Line discount"
          value={r.discountPct ? pct(r.discountPct, 1) : '—'}
          sub={`${r.discounts.length} line${r.discounts.length === 1 ? '' : 's'} applied`}
        />
        <Kpi label="Net unit price" value={money(r.netUnit)} sub={`net amount ${money(r.netAmount, { decimals: 0 })}`} />
        <Kpi
          label="Margin"
          value={pct(r.marginPct)}
          tone={customer.floorExempt ? 'default' : belowFloor ? 'red' : 'sage'}
          sub={customer.floorExempt ? 'transfer price — floor n/a' : `${floor}% floor at ${money(floorPrice)}`}
        />
      </div>

      {r.stacked && !customer.floorExempt && (
        <div className={`callout ${belowFloor ? 'critical' : 'warn'}`}>
          <span className="callout-glyph" aria-hidden="true">⚠</span>
          <span>
            <b>
              Negotiated price {money(r.price)} for {customer.account} has a group discount stacked on top.
            </b>{' '}
            The customer line has <em>Find next</em> on, so the search kept going and added{' '}
            {r.discounts.map((d) => `${d.accountSelection || 'All'} ${pct(d.discountPct, 0)}`).join(' + ')}. Net{' '}
            {money(r.netUnit)} lands at {pct(r.marginPct)}
            {belowFloor ? `, under the ${floor}% floor` : ''}. Turn Find next off on the customer price, or give the
            customer its own all-in discount line, to hold the negotiated price.
          </span>
        </div>
      )}
      {!r.stacked && belowFloor && (
        <div className="callout critical">
          <span className="callout-glyph" aria-hidden="true">⚠</span>
          <span>
            <b>Net {money(r.netUnit)} is under the {floor}% floor ({money(floorPrice)}).</b> The discounts found add up to{' '}
            {pct(r.discountPct, 0)} on a {money(r.price)} price.
          </span>
        </div>
      )}
      {stoppedLine && (
        <div className="callout">
          <span className="callout-glyph" aria-hidden="true">ⓘ</span>
          <span>
            <b>{stoppedLine.line.id} has Find next off</b>, so the discount search stopped there — group and all-customer
            lines below it were never evaluated. That is what keeps {customer.account} at {pct(r.marginPct)}.
          </span>
        </div>
      )}
      {customer.floorExempt && (
        <div className="callout">
          <span className="callout-glyph" aria-hidden="true">ⓘ</span>
          <span>Intercompany customer: priced at the transfer price from the {customer.priceGroup} price group; the margin floor does not apply.</span>
        </div>
      )}

      <div className="sim-grid">
        <div className="card sim-card">
          <div className="section-head" style={{ marginTop: 0 }}>
            <h2>How the price is built</h2>
            <span className="eyebrow">per {item.unit} · {num(qty)} {item.unit}</span>
          </div>
          <Waterfall rows={rows} cost={r.unitCost} floorPrice={floorPrice} floorPct={floor} showFloor={!customer.floorExempt} hover={hover} setHover={setHover} />
          <p className="sim-note">
            Net unit = (price − discount amounts) × (1 − Σ discount %). Discount lines found with Find next on add
            together.
          </p>
        </div>

        <div className="card sim-card">
          <div className="section-head" style={{ marginTop: 0 }}>
            <h2>Search path</h2>
            <span className="eyebrow">order Dynamics 365 searches in</span>
          </div>
          <SearchPath steps={r.steps} />
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <h2>View trade agreements · {item.itemNumber}</h2>
          <span className="eyebrow">every journal line for this item and its discount group</span>
        </div>
        <div className="card table-wrap">
          <table className="data-table sim-journal">
            <thead>
              <tr>
                <th>Line</th>
                <th>Relation</th>
                <th>Account code</th>
                <th>Account selection</th>
                <th>Item code</th>
                <th>Item / group</th>
                <th className="num">From qty</th>
                <th className="num">To qty</th>
                <th>From date</th>
                <th>To date</th>
                <th className="num">Amount</th>
                <th className="num">Discount %</th>
                <th>Find next</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {r.lines.map(({ line: l, status }) => (
                <tr key={l.id} className={status === 'applied' ? 'row-selected' : status === 'otherAccount' ? 'sim-muted' : undefined} title={`${l.note ?? ''}${status === 'stopped' ? ' — not reached: an earlier line has Find next off' : ''}`}>
                  <td className="item-code">{l.id}</td>
                  <td>{RELATION_LABEL[l.relation]}</td>
                  <td>{l.accountCode}</td>
                  <td>{l.accountSelection || <span className="sim-dim">All</span>}</td>
                  <td>{l.itemCode}</td>
                  <td>{l.itemSelection || <span className="sim-dim">All</span>}</td>
                  <td className="num">{l.fromQty.toFixed(2)}</td>
                  <td className="num">{l.toQty ? l.toQty.toFixed(2) : ''}</td>
                  <td>{l.fromDate ? shortDate(l.fromDate) : ''}</td>
                  <td>{l.toDate ? shortDate(l.toDate) : ''}</td>
                  <td className="num">{l.amount ? money(l.amount) : '0.00'}</td>
                  <td className="num">{l.discountPct.toFixed(2)}</td>
                  <td>{l.findNext ? '✓' : <b>No</b>}</td>
                  <td>
                    <span className={`pill ${STATUS[status].pill}`}>{STATUS[status].label}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

/** Base → agreement price → each discount → net, as floating bars. */
function waterfall(r: PriceResult): WaterfallRow[] {
  const rows: WaterfallRow[] = [
    { label: 'Base price', sub: 'Item sales price', from: 0, to: r.basePrice, kind: 'total', value: r.basePrice },
  ]
  if (r.priceLine && r.price !== r.basePrice) {
    const sel = r.priceLine.accountSelection || 'All'
    rows.push({
      label: 'Trade agreement price',
      sub: `${r.priceLine.accountCode} · ${sel} · ${r.priceLine.id}`,
      from: Math.min(r.price, r.basePrice),
      to: Math.max(r.price, r.basePrice),
      kind: 'step',
      value: r.price - r.basePrice,
    })
  }
  let running = r.price
  for (const d of r.discounts.filter((x) => x.amount > 0)) {
    rows.push({ label: 'Discount amount', sub: `${d.accountCode} · ${d.accountSelection || 'All'} · ${d.id}`, from: running - d.amount, to: running, kind: 'step', value: -d.amount })
    running -= d.amount
  }
  const pctBase = running
  for (const d of r.discounts.filter((x) => x.discountPct > 0)) {
    const cut = (pctBase * d.discountPct) / 100
    rows.push({
      label: `Line discount ${pct(d.discountPct, 0)}`,
      sub: `${d.accountCode} · ${d.accountSelection || 'All'} · ${d.id}`,
      from: running - cut,
      to: running,
      kind: 'step',
      value: -cut,
    })
    running -= cut
  }
  rows.push({ label: 'Net unit price', sub: 'what the order line carries', from: 0, to: r.netUnit, kind: 'total', value: r.netUnit })
  return rows
}

function Waterfall({
  rows,
  cost,
  floorPrice,
  floorPct,
  showFloor,
  hover,
  setHover,
}: {
  rows: WaterfallRow[]
  cost: number
  floorPrice: number
  floorPct: number
  showFloor: boolean
  hover: number | null
  setHover: (i: number | null) => void
}) {
  const max = Math.max(...rows.map((r) => r.to), floorPrice) * 1.04
  const x = (v: number) => `${(v / max) * 100}%`
  const active = hover !== null ? rows[hover] : null
  return (
    <div className="wf">
      <div className="wf-legend">
        <span><i className="wf-key total" /> Price</span>
        <span><i className="wf-key step" /> Change</span>
        <span><i className="wf-key-line cost" /> Unit cost {money(cost)}</span>
        {showFloor && <span><i className="wf-key-line floor" /> {floorPct}% floor {money(floorPrice)}</span>}
      </div>
      {rows.map((r, i) => (
        <div
          key={i}
          className={`wf-row${hover === i ? ' hover' : ''}`}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
        >
          <div className="wf-label">
            <span>{r.label}</span>
            <small>{r.sub}</small>
          </div>
          <div className="wf-track">
            <div className={`wf-bar ${r.kind}`} style={{ left: x(r.from), width: x(Math.max(0, r.to - r.from)) }} />
            <div className="wf-line cost" style={{ left: x(cost) }} />
            {showFloor && <div className="wf-line floor" style={{ left: x(floorPrice) }} />}
          </div>
          <div className={`wf-value${r.kind === 'step' ? ' step' : ''}`}>
            {r.kind === 'step' ? (r.value < 0 ? '−' : '+') + money(Math.abs(r.value)) : money(r.value)}
          </div>
        </div>
      ))}
      <div className="wf-readout" aria-live="polite">
        {active
          ? `${active.label} · ${active.sub} · ${active.kind === 'step' ? `${money(active.to)} → ${money(active.from)}` : money(active.value)}`
          : 'Hover a bar for its source line.'}
      </div>
    </div>
  )
}

function SearchPath({ steps }: { steps: SearchStep[] }) {
  const groups: { title: string; rel: SearchStep['relation'] }[] = [
    { title: 'Price (sales) — lowest valid price wins', rel: 'price' },
    { title: 'Line discount (sales) — valid lines add', rel: 'lineDiscount' },
  ]
  return (
    <div className="sim-path">
      {groups.map((g) => (
        <div key={g.rel}>
          <div className="sim-path-title">{g.title}</div>
          <ol>
            {steps
              .filter((s) => s.relation === g.rel)
              .map((s, i) => (
                <li key={i} className={`sim-step ${s.outcome}`}>
                  <span className="sim-step-level">
                    {s.accountCode} / {s.itemCode}
                  </span>
                  <span className="sim-step-what">
                    {s.outcome === 'noGroup' ? '—' : s.accountSelection || 'All'} · {s.itemSelection || 'All'}
                  </span>
                  <span className="sim-step-result">
                    {OUTCOME[s.outcome]}
                    {s.found > 1 ? ` (${s.found})` : ''}
                  </span>
                </li>
              ))}
          </ol>
        </div>
      ))}
    </div>
  )
}
