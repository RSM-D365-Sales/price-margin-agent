import { useMemo, useState } from 'react'
import {
  lineSalesPrice,
  lineEffectiveCost,
  lineMarginPct,
  orgLeaves,
  type PricingSetupLine,
  type PriceComponentTarget,
} from '../models/types'
import { ORG_HIERARCHY } from '../data/mockData'
import { money, pct, isoToday } from '../lib/format'
import { DEFAULT_RETAIL_MARGIN_TARGET, iso } from '../lib/config'
import { Modal } from './Modal'

const COMPONENT_LABELS: Record<PriceComponentTarget, string> = {
  basePrice: 'Base price (TA)',
  marginComponent: 'Margin component',
  discountPct: 'Discount %',
}

/** How the new price is arrived at. */
type Method = 'margin' | 'change'

interface RepriceModalProps {
  /** The lines the reprice will be applied to. */
  lines: PricingSetupLine[]
  /** Extra sentence appended to the modal subtitle. */
  note?: string
  /** Show the org-hierarchy roll-out picker. */
  showRollout?: boolean
  /** Offer the "apply a % change" method alongside solve-to-target-margin. */
  showMultiplier?: boolean
  onClose: () => void
  /** Receives the solved lines plus a human summary for the toast. */
  onApply: (solved: PricingSetupLine[], summary: string) => void
}

/** Checkbox tree over the org hierarchy. Selection is held as leaf codes. */
function OrgPicker({
  selected,
  onChange,
}: {
  selected: Set<string>
  onChange: (next: Set<string>) => void
}) {
  function toggleLeaves(codes: string[], on: boolean) {
    const next = new Set(selected)
    for (const c of codes) {
      if (on) next.add(c)
      else next.delete(c)
    }
    onChange(next)
  }

  const regions = ORG_HIERARCHY.children ?? []
  const allLeaves = orgLeaves(ORG_HIERARCHY)
  const allOn = allLeaves.every((c) => selected.has(c))

  return (
    <div
      style={{
        border: '1px solid var(--ink-200)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 12px',
        maxHeight: 190,
        overflowY: 'auto',
        background: 'var(--ink-50)',
      }}
    >
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, fontWeight: 600 }}>
        <input
          type="checkbox"
          checked={allOn}
          onChange={(e) => toggleLeaves(allLeaves, e.target.checked)}
        />
        {ORG_HIERARCHY.name}
      </label>
      {regions.map((r) => {
        const leaves = orgLeaves(r)
        const on = leaves.every((c) => selected.has(c))
        const some = !on && leaves.some((c) => selected.has(c))
        return (
          <div key={r.code} style={{ marginTop: 6, paddingLeft: 18 }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12.5, fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={on}
                ref={(el) => {
                  if (el) el.indeterminate = some
                }}
                onChange={(e) => toggleLeaves(leaves, e.target.checked)}
              />
              {r.name}
              <span style={{ color: 'var(--ink-400)', fontWeight: 400 }}>
                ({leaves.filter((c) => selected.has(c)).length}/{leaves.length})
              </span>
            </label>
            <div style={{ paddingLeft: 22, display: 'flex', flexWrap: 'wrap', gap: '2px 16px' }}>
              {(r.children ?? []).map((store) => (
                <label
                  key={store.code}
                  style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, color: 'var(--ink-600)' }}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(store.code)}
                    onChange={(e) => toggleLeaves([store.code], e.target.checked)}
                    style={{ width: 13, height: 13 }}
                  />
                  {store.name}
                </label>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function RepriceModal({
  lines,
  note,
  showRollout = false,
  showMultiplier = false,
  onClose,
  onApply,
}: RepriceModalProps) {
  const [component, setComponent] = useState<PriceComponentTarget>('discountPct')
  const [method, setMethod] = useState<Method>('margin')
  const [targetMargin, setTargetMargin] = useState(DEFAULT_RETAIL_MARGIN_TARGET)
  const [changePct, setChangePct] = useState(1.3)
  const [respectMap, setRespectMap] = useState(true)
  const [from, setFrom] = useState(isoToday())
  const [to, setTo] = useState('')
  const [noEndDate, setNoEndDate] = useState(true)

  // Default roll-out scope: wherever the selected lines already price.
  const defaultScope = useMemo(() => {
    const s = new Set<string>()
    for (const l of lines) for (const c of l.storeCodes ?? []) s.add(c)
    return s
  }, [lines])
  const [scope, setScope] = useState<Set<string>>(defaultScope)

  /**
   * Solve the chosen price component so the line lands on its new price.
   *
   *   salesPrice = (base + marginComp) * (1 - disc) + autoCharge
   *
   * Target margin method: salesPrice = effectiveCost / (1 - m), where effective
   * cost is net of any vendor allowance — a co-funded line needs a smaller move.
   * Percent-change method: salesPrice = currentSalesPrice * (1 + change/100).
   * With "hold at or above MAP" on, the result is floored at the vendor's
   * minimum advertised price.
   */
  function solve(l: PricingSetupLine): PricingSetupLine {
    let targetSales =
      method === 'margin'
        ? lineEffectiveCost(l) / (1 - targetMargin / 100)
        : lineSalesPrice(l) * (1 + changePct / 100)
    if (respectMap && l.mapFloor !== undefined) targetSales = Math.max(targetSales, l.mapFloor)

    const next = { ...l, validFrom: from, validTo: noEndDate ? iso(3650) : to }
    if (component === 'discountPct') {
      const gross = l.basePrice + l.marginComponent
      const disc = gross > 0 ? Math.max(0, (1 - (targetSales - l.autoCharge) / gross) * 100) : 0
      next.discountPct = Math.round(disc * 10) / 10
    } else if (component === 'basePrice') {
      const base = (targetSales - l.autoCharge) / (1 - l.discountPct / 100) - l.marginComponent
      next.basePrice = Math.round(base * 100) / 100
    } else {
      const comp = (targetSales - l.autoCharge) / (1 - l.discountPct / 100) - l.basePrice
      next.marginComponent = Math.round(comp * 100) / 100
    }
    return next
  }

  const preview = lines.slice(0, 5)

  function confirm() {
    const scopeText = showRollout ? ` across ${scope.size} location${scope.size === 1 ? '' : 's'}` : ''
    const methodText =
      method === 'margin'
        ? `solved to reach ${targetMargin}% margin`
        : `${changePct >= 0 ? 'increased' : 'reduced'} by ${Math.abs(changePct)}%`
    onApply(
      lines.map(solve),
      `New prices executed for ${lines.length} line${lines.length === 1 ? '' : 's'}${scopeText} · ` +
        `${COMPONENT_LABELS[component]} ${methodText}${respectMap ? ', held at or above MAP' : ''}`,
    )
  }

  const canConfirm = lines.length > 0 && (!showRollout || scope.size > 0)

  return (
    <Modal
      title="Draft new price"
      sub={
        `The agent solves the chosen component so each line lands on its new price, measured against cost net of any vendor allowance.` +
        (note ? ` ${note}` : '')
      }
      onClose={onClose}
      actions={
        <>
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn gold" onClick={confirm} disabled={!canConfirm}>
            Confirm &amp; execute new price
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="field">
          <label>Items to update</label>
          <div style={{ fontSize: 13 }}>
            {lines.length} line{lines.length === 1 ? '' : 's'}
          </div>
        </div>

        <div className="field">
          <label>Price component to update</label>
          <select
            className="select"
            value={component}
            onChange={(e) => setComponent(e.target.value as PriceComponentTarget)}
          >
            <option value="basePrice">Base price (trade agreement)</option>
            <option value="marginComponent">Margin component</option>
            <option value="discountPct">Discount %</option>
          </select>
        </div>

        {showMultiplier && (
          <div className="field">
            <label>Method</label>
            <select
              className="select"
              value={method}
              onChange={(e) => setMethod(e.target.value as Method)}
            >
              <option value="margin">Solve to a target margin %</option>
              <option value="change">Apply a % change to the current price</option>
            </select>
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {method === 'margin' ? (
            <div className="field">
              <label>Target margin %</label>
              <input
                type="number"
                className="input"
                style={{ width: 120 }}
                value={targetMargin}
                min={0}
                max={95}
                onChange={(e) => setTargetMargin(Number(e.target.value))}
              />
            </div>
          ) : (
            <div className="field">
              <label>Price change % (negative to cut)</label>
              <input
                type="number"
                className="input"
                style={{ width: 120 }}
                step={0.1}
                value={changePct}
                onChange={(e) => setChangePct(Number(e.target.value))}
              />
            </div>
          )}

          {showRollout && (
            <div className="field" style={{ flex: 1, minWidth: 300 }}>
              <label>Roll out to</label>
              <OrgPicker selected={scope} onChange={setScope} />
            </div>
          )}
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
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="field">
            <label>To</label>
            <input
              type="date"
              className="input"
              value={to}
              disabled={noEndDate}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <label
            style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, paddingBottom: 8 }}
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
                <th>New {COMPONENT_LABELS[component]}</th>
                <th>New sales price</th>
                <th>New margin</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((l) => {
                const next = solve(l)
                const newPrice = lineSalesPrice(next)
                const oldPrice = lineSalesPrice(l)
                const delta = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0
                return (
                  <tr key={l.id}>
                    <td className="mono">
                      {l.itemNumber} · {l.colorSize}
                    </td>
                    <td className="num">
                      {money(oldPrice)} ({pct(lineMarginPct(l))})
                    </td>
                    <td className="num">
                      {component === 'discountPct'
                        ? pct(next.discountPct, 1)
                        : money(next[component])}
                    </td>
                    <td className="num" style={{ fontWeight: 600 }}>
                      {money(newPrice)}
                      <div
                        className={`delta ${delta >= 0 ? 'up' : 'down'}`}
                        style={{ fontSize: 11 }}
                      >
                        {delta >= 0 ? '▲' : '▼'} {pct(Math.abs(delta))}
                      </div>
                    </td>
                    <td className="num margin-ok">{pct(lineMarginPct(next))}</td>
                  </tr>
                )
              })}
              {lines.length > preview.length && (
                <tr>
                  <td colSpan={5} style={{ color: 'var(--ink-400)' }}>
                    …and {lines.length - preview.length} more lines
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  )
}
