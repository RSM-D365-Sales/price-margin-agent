import { useMemo, useState } from 'react'
import { PRICE_HISTORY } from '../data/mockData'
import { money, pct, shortDate } from '../lib/format'
import { Kpi } from '../components/Kpi'
import { COPY, LINES } from '../lib/config'

export function PriceHistory() {
  const products = useMemo(() => {
    const seen = new Map<string, { itemNumber: string; itemName: string; pack: string }>()
    for (const r of PRICE_HISTORY) {
      const key = `${r.itemNumber}|${r.pack}`
      if (!seen.has(key)) seen.set(key, r)
    }
    return [...seen.values()]
  }, [])

  const [productKey, setProductKey] = useState(`${products[0].itemNumber}|${products[0].pack}`)

  const scopes = useMemo(
    () =>
      PRICE_HISTORY.filter((r) => `${r.itemNumber}|${r.pack}` === productKey).map((r) => ({
        id: r.scopeId,
        name: r.scopeName,
      })),
    [productKey],
  )

  const [scope, setScope] = useState(scopes[0]?.id ?? 'LIST')

  const record = useMemo(() => {
    const match = PRICE_HISTORY.find(
      (r) => `${r.itemNumber}|${r.pack}` === productKey && r.scopeId === scope,
    )
    return match ?? PRICE_HISTORY.find((r) => `${r.itemNumber}|${r.pack}` === productKey) ?? null
  }, [productKey, scope])

  function onProductChange(key: string) {
    setProductKey(key)
    const first = PRICE_HISTORY.find((r) => `${r.itemNumber}|${r.pack}` === key)
    if (first) setScope(first.scopeId)
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
          {COPY.priceHistory.lede}
        </p>
      </header>

      <div className="card filter-bar">
        <div className="field">
          <label>Item · pack</label>
          <select
            className="select"
            style={{ minWidth: 340 }}
            value={productKey}
            onChange={(e) => onProductChange(e.target.value)}
          >
            {products.map((p) => (
              <option key={`${p.itemNumber}|${p.pack}`} value={`${p.itemNumber}|${p.pack}`}>
                {p.itemName} · {p.itemNumber} · {p.pack}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Price scope</label>
          <select
            className="select"
            style={{ minWidth: 280 }}
            value={scope}
            onChange={(e) => setScope(e.target.value)}
          >
            {scopes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        {scopes.length > 1 && (
          <>
            <div className="spacer" />
            <span className="pill blue">{scopes.length} scopes on this item</span>
          </>
        )}
      </div>

      {record && stats && (
        <>
          <div className="kpi-strip">
            <Kpi label="Current price" value={money(stats.current)} sub="active today" />
            <Kpi label="Price changes" value={String(stats.changes)} sub="since introduction" />
            <Kpi
              label="Highest / lowest"
              value={`${money(stats.high, { decimals: 0 })} / ${money(stats.low, { decimals: 0 })}`}
            />
            <Kpi
              label="Drift since intro"
              value={pct(stats.driftPct)}
              tone={stats.driftPct < 0 ? 'red' : 'sage'}
            />
          </div>

          <div className="card" style={{ padding: '20px 24px' }}>
            <div className="section-head" style={{ marginBottom: 18 }}>
              <h2>
                {record.itemName} · {record.pack}
              </h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className={`pill ${record.productLine === LINES.premium ? 'grey' : 'midnight'}`}>
                  {record.productLine}
                </span>
                <span className="pill blue">{record.scopeName}</span>
              </div>
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
                        {delta !== null && delta !== 0 && (
                          <span className={`delta ${delta >= 0 ? 'up' : 'down'}`}>
                            {delta >= 0 ? '▲' : '▼'} {pct(Math.abs(delta))}
                          </span>
                        )}
                        {e.activeTo === null && <span className="pill good">Current</span>}
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
