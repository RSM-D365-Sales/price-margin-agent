import { useMemo, useState } from 'react'
import { PRICE_HISTORY } from '../data/mockData'
import { money, pct, shortDate } from '../lib/format'
import { Kpi } from '../components/Kpi'

export function PriceHistory() {
  const products = useMemo(() => {
    const seen = new Map<string, { itemNumber: string; styleName: string; colorSize: string }>()
    for (const r of PRICE_HISTORY) {
      const key = `${r.itemNumber}|${r.colorSize}`
      if (!seen.has(key)) seen.set(key, r)
    }
    return [...seen.values()]
  }, [])

  const [productKey, setProductKey] = useState(`${products[0].itemNumber}|${products[0].colorSize}`)

  const customers = useMemo(
    () =>
      PRICE_HISTORY.filter((r) => `${r.itemNumber}|${r.colorSize}` === productKey).map((r) => ({
        account: r.customerAccount,
        name: r.customerName,
      })),
    [productKey],
  )

  const [customer, setCustomer] = useState(customers[0]?.account ?? 'D2C')

  const record = useMemo(() => {
    const match = PRICE_HISTORY.find(
      (r) => `${r.itemNumber}|${r.colorSize}` === productKey && r.customerAccount === customer,
    )
    return match ?? PRICE_HISTORY.find((r) => `${r.itemNumber}|${r.colorSize}` === productKey) ?? null
  }, [productKey, customer])

  function onProductChange(key: string) {
    setProductKey(key)
    const first = PRICE_HISTORY.find((r) => `${r.itemNumber}|${r.colorSize}` === key)
    if (first) setCustomer(first.customerAccount)
  }

  const stats = useMemo(() => {
    if (!record) return null
    const prices = record.entries.map((e) => e.price)
    const current = record.entries[0].price
    const first = record.entries[record.entries.length - 1].price
    return {
      changes: record.entries.length - 1,
      current,
      high: Math.max(...prices),
      low: Math.min(...prices),
      driftPct: ((current - first) / first) * 100,
    }
  }, [record])

  return (
    <>
      <header className="page-head">
        <div className="eyebrow">Audit report · Price history</div>
        <h1>Price History</h1>
        <p className="lede">
          Pick a specific product (size / color) and customer to see every price change — who
          changed it, why, and the date range each price was active for. Direct (D2C) list price
          and customer-specific wholesale agreements are both tracked.
        </p>
      </header>

      <div className="card filter-bar">
        <div className="field">
          <label>Product · size / color</label>
          <select
            className="select"
            style={{ minWidth: 320 }}
            value={productKey}
            onChange={(e) => onProductChange(e.target.value)}
          >
            {products.map((p) => (
              <option key={`${p.itemNumber}|${p.colorSize}`} value={`${p.itemNumber}|${p.colorSize}`}>
                {p.styleName} · {p.itemNumber} · {p.colorSize}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Customer</label>
          <select
            className="select"
            style={{ minWidth: 260 }}
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
          >
            {customers.map((c) => (
              <option key={c.account} value={c.account}>
                {c.name}
                {c.account !== 'D2C' ? ` · ${c.account}` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {record && stats && (
        <>
          <div className="kpi-strip">
            <Kpi label="Current price" value={money(stats.current)} sub="active today" />
            <Kpi label="Price changes" value={String(stats.changes)} sub="since introduction" />
            <Kpi label="Highest / lowest" value={`${money(stats.high, { decimals: 0 })} / ${money(stats.low, { decimals: 0 })}`} />
            <Kpi
              label="Drift since intro"
              value={pct(stats.driftPct)}
              tone={stats.driftPct < 0 ? 'red' : 'sage'}
            />
          </div>

          <div className="card" style={{ padding: '26px 30px' }}>
            <div className="section-head" style={{ marginBottom: 20 }}>
              <h2>
                {record.styleName} · {record.colorSize}
              </h2>
              <span className="pill camel">{record.customerName}</span>
            </div>
            <div className="history-track">
              {record.entries.map((e, i) => {
                const prev = record.entries[i + 1]
                const delta = prev ? ((e.price - prev.price) / prev.price) * 100 : null
                return (
                  <div className="history-row" key={e.id}>
                    <div className="rail">
                      <div className={`dot${e.activeTo === null ? ' current' : ''}`} />
                    </div>
                    <div className="entry">
                      <div className="price-line">
                        <span className="price">{money(e.price)}</span>
                        {delta !== null && (
                          <span className={`delta ${delta >= 0 ? 'up' : 'down'}`}>
                            {delta >= 0 ? '▲' : '▼'} {pct(Math.abs(delta))}
                          </span>
                        )}
                        {e.activeTo === null && <span className="pill sage">Current</span>}
                        <span className="pill">{e.changeType}</span>
                      </div>
                      <div className="meta">
                        Active {shortDate(e.activeFrom)} –{' '}
                        {e.activeTo ? shortDate(e.activeTo) : 'no end date'} · changed by{' '}
                        {e.changedBy}
                        {e.note ? ` · ${e.note}` : ''}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </>
  )
}
