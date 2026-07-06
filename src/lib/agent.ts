// ── Heuristic assistant · grounded in the same mock aggregations ────────
// Rule-based router (offline default) — same pattern as the Consignment
// app's heuristicAgent. Numbers come from the dataset, never invented.

import {
  PRICE_OVERRIDES,
  PRICING_SETUP,
  RECOMMENDATIONS,
} from '../data/mockData'
import { overrideMarginPct, lineMarginPct, lineSalesPrice } from '../models/types'
import { money, pct } from './format'

export interface AgentReply {
  text: string
}

export const SUGGESTED_PROMPTS = [
  'How many price overrides this month?',
  'Which override has the worst margin?',
  'Show pricing setup below 50% margin',
  'What should we do about style V9087?',
  'Summarize the wholesale recommendations',
]

export function askAgent(raw: string): AgentReply {
  const q = raw.toLowerCase()

  // overrides count / summary
  if (q.includes('override') && (q.includes('how many') || q.includes('count') || q.includes('month') || q.includes('summar'))) {
    const now = new Date('2026-07-06')
    const monthStart = new Date('2026-06-06')
    const inWindow = PRICE_OVERRIDES.filter((o) => {
      const d = new Date(o.orderDate)
      return d >= monthStart && d <= now
    })
    const below50 = inWindow.filter((o) => overrideMarginPct(o) < 50)
    const worst = [...inWindow].sort((a, b) => overrideMarginPct(a) - overrideMarginPct(b))[0]
    return {
      text:
        `In the last 30 days I count ${inWindow.length} manual price overrides, ` +
        `${below50.length} of them landing below 50% margin.\n\n` +
        `The worst is ${worst.styleName} (${worst.itemNumber}, ${worst.colorSize}) on order ${worst.orderNumber}: ` +
        `overridden to ${money(worst.overridePrice)} against a ${money(worst.unitCost)} cost — ` +
        `${pct(overrideMarginPct(worst))} margin, reason "${worst.reasonCode}", by ${worst.overriddenBy}.\n\n` +
        `Open the Override Audit tab to email the user or raise a D365 case.`,
    }
  }

  // worst override
  if (q.includes('worst') && q.includes('margin')) {
    const worst = [...PRICE_OVERRIDES].sort((a, b) => overrideMarginPct(a) - overrideMarginPct(b))[0]
    return {
      text:
        `Lowest-margin override on file: ${worst.styleName} (${worst.itemNumber}, ${worst.colorSize}).\n` +
        `Original ${money(worst.originalPrice)} → overridden to ${money(worst.overridePrice)} ` +
        `(cost ${money(worst.unitCost)}) = ${pct(overrideMarginPct(worst))} margin.\n` +
        `Reason: ${worst.reasonCode} · User: ${worst.overriddenBy} · ${worst.channel} · ${worst.orderDate}.`,
    }
  }

  // pricing setup below threshold
  if ((q.includes('setup') || q.includes('pricing')) && (q.includes('below') || q.includes('under') || q.includes('50'))) {
    const m = q.match(/(\d+(?:\.\d+)?)\s*%/)
    const threshold = m ? parseFloat(m[1]) : 50
    const hits = PRICING_SETUP.filter((l) => lineMarginPct(l) <= threshold).sort(
      (a, b) => lineMarginPct(a) - lineMarginPct(b),
    )
    if (hits.length === 0) return { text: `No active pricing setup is at or below ${threshold}% margin. Nice.` }
    const lines = hits
      .slice(0, 6)
      .map(
        (l) =>
          `· ${l.styleName} (${l.itemNumber}) — ${l.mode} · ${l.channelDetail} — sells at ${money(lineSalesPrice(l))} = ${pct(lineMarginPct(l))}`,
      )
      .join('\n')
    return {
      text:
        `${hits.length} pricing setup line${hits.length === 1 ? '' : 's'} at or below ${threshold}% margin:\n\n${lines}` +
        (hits.length > 6 ? `\n…and ${hits.length - 6} more.` : '') +
        `\n\nUse Margin Threshold Test to select lines and draft a reprice.`,
    }
  }

  // V9087 / aging inventory
  if (q.includes('v9087') || q.includes('aging') || q.includes('weeks of supply')) {
    const rec = RECOMMENDATIONS.find((r) => r.id === 'REC-D2C-5')!
    return {
      text:
        `${rec.title}. ${rec.detail}\n` +
        rec.bullets!.map((b) => `· ${b}`).join('\n') +
        `\n${rec.impact}. It's already at 45% markdown on vince.com — current setup margin is ` +
        `${pct(lineMarginPct(PRICING_SETUP.find((l) => l.id === 'PRC-D2C-06')!))}. ` +
        `Outlet transfer is likely the better margin play than a deeper cut.`,
    }
  }

  // wholesale recommendations
  if (q.includes('wholesale') || q.includes('b2b') || q.includes('nordstrom')) {
    const recs = RECOMMENDATIONS.filter((r) => r.audience === 'Wholesale')
    return {
      text:
        `${recs.length} open wholesale recommendations:\n\n` +
        recs.map((r) => `· ${r.title}${r.impact ? ` — ${r.impact}` : ''}`).join('\n') +
        `\n\nDetails and accept/dismiss actions are on the Recommendations page.`,
    }
  }

  // default
  return {
    text:
      `I can help with:\n` +
      `· Override audit — "How many price overrides this month?"\n` +
      `· Threshold tests — "Show pricing setup below 40% margin"\n` +
      `· Aging inventory — "What should we do about V9087?"\n` +
      `· Recommendations — "Summarize the wholesale recommendations"\n\n` +
      `Everything I answer is grounded in the same data the dashboard uses.`,
  }
}
