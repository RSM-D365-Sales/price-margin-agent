// ── Heuristic assistant · grounded in the same aggregations the pages use ──
// Rule-based router (offline default). Every number it quotes is computed from
// the dataset at call time — nothing is written into the replies by hand.

import { PRICE_OVERRIDES, PRICING_SETUP, RECOMMENDATIONS, STORES } from '../data/mockData'
import {
  overrideMarginPct,
  overrideBreachesMap,
  lineMarginPct,
  lineUnfundedMarginPct,
  lineSalesPrice,
  lineBreachesMap,
} from '../models/types'
import { AS_OF, DEFAULT_RETAIL_MARGIN_TARGET, iso } from './config'
import { money, pct, shortDate } from './format'

export interface AgentReply {
  text: string
}

export const SUGGESTED_PROMPTS = [
  'How many price overrides this month?',
  'Which override has the worst margin?',
  'Show pricing setup below 45% margin',
  'Are we breaking MAP anywhere?',
  'What should we do about the boardshorts?',
  'Summarize the vendor program recommendations',
]

export function askAgent(raw: string): AgentReply {
  const q = raw.toLowerCase()

  // ── MAP / vendor compliance ──
  if (q.includes('map') || q.includes('compliance') || q.includes('breach') || q.includes('waiver')) {
    const breaches = PRICING_SETUP.filter((l) => lineBreachesMap(l, AS_OF))
    const waived = PRICING_SETUP.filter(
      (l) => l.mapFloor !== undefined && lineSalesPrice(l) < l.mapFloor && !lineBreachesMap(l, AS_OF),
    )
    if (breaches.length === 0) {
      return { text: 'Every MAP-covered line is either at or above its floor, or inside an approved vendor markdown window. Nothing to escalate.' }
    }
    const lines = breaches
      .map(
        (l) =>
          `· ${l.styleName} (${l.itemNumber}) — ${l.channelDetail}\n` +
          `  sells at ${money(lineSalesPrice(l))} against a ${money(l.mapFloor!)} floor` +
          (l.mapWaiverUntil ? ` · waiver expired ${shortDate(l.mapWaiverUntil)}` : ' · no waiver on file'),
      )
      .join('\n')
    return {
      text:
        `${breaches.length} line${breaches.length === 1 ? '' : 's'} price below a vendor MAP floor with no active waiver:\n\n${lines}\n\n` +
        `${waived.length} further line${waived.length === 1 ? ' is' : 's are'} below MAP but inside an approved co-op window, so ${waived.length === 1 ? 'it is' : 'they are'} compliant.\n\n` +
        `Fastest fix is to restore the price to the floor; the alternative is to get the waiver extended before the next flush.`,
    }
  }

  // ── overrides count / summary ──
  if (
    q.includes('override') &&
    (q.includes('how many') || q.includes('count') || q.includes('month') || q.includes('summar'))
  ) {
    const monthStart = iso(-30)
    const inWindow = PRICE_OVERRIDES.filter((o) => o.orderDate >= monthStart && o.orderDate <= AS_OF)
    const below = inWindow.filter((o) => overrideMarginPct(o) < DEFAULT_RETAIL_MARGIN_TARGET)
    const mapHits = inWindow.filter(overrideBreachesMap)
    const worst = [...inWindow].sort((a, b) => overrideMarginPct(a) - overrideMarginPct(b))[0]
    return {
      text:
        `In the last 30 days I count ${inWindow.length} manual price overrides, ` +
        `${below.length} of them below ${DEFAULT_RETAIL_MARGIN_TARGET}% margin` +
        (mapHits.length ? `, and ${mapHits.length} that went under a vendor MAP floor` : '') +
        `.\n\n` +
        `The worst is ${worst.styleName} (${worst.itemNumber}, ${worst.colorSize}) on order ${worst.orderNumber}: ` +
        `overridden to ${money(worst.overridePrice)} against a ${money(worst.unitCost)} cost — ` +
        `${pct(overrideMarginPct(worst))} margin, reason "${worst.reasonCode}", by ${worst.overriddenBy} at ${worst.storeOrSite}.\n\n` +
        `Open the Override Audit tab to email the user or raise a D365 case.`,
    }
  }

  // ── worst override ──
  if (q.includes('worst') && (q.includes('margin') || q.includes('override'))) {
    const worst = [...PRICE_OVERRIDES].sort((a, b) => overrideMarginPct(a) - overrideMarginPct(b))[0]
    return {
      text:
        `Lowest-margin override on file: ${worst.styleName} (${worst.itemNumber}, ${worst.colorSize}).\n` +
        `Original ${money(worst.originalPrice)} → overridden to ${money(worst.overridePrice)} ` +
        `(cost ${money(worst.unitCost)}) = ${pct(overrideMarginPct(worst))} margin.\n` +
        `Reason: ${worst.reasonCode} · User: ${worst.overriddenBy} · ${worst.storeOrSite} · ${shortDate(worst.orderDate)}` +
        (overrideBreachesMap(worst)
          ? `\n\nIt also landed ${money(worst.mapFloor! - worst.overridePrice)} under the ${money(worst.mapFloor!)} vendor MAP floor.`
          : ''),
    }
  }

  // ── pricing setup below a threshold ──
  if (
    (q.includes('setup') || q.includes('pricing') || q.includes('below') || q.includes('under')) &&
    (q.includes('margin') || q.includes('%') || q.includes('below') || q.includes('under'))
  ) {
    const m = q.match(/(\d+(?:\.\d+)?)\s*%/)
    const threshold = m ? parseFloat(m[1]) : DEFAULT_RETAIL_MARGIN_TARGET
    const hits = PRICING_SETUP.filter((l) => lineMarginPct(l) <= threshold).sort(
      (a, b) => lineMarginPct(a) - lineMarginPct(b),
    )
    if (hits.length === 0) return { text: `No active pricing setup is at or below ${threshold}% margin.` }
    const lines = hits
      .slice(0, 6)
      .map(
        (l) =>
          `· ${l.styleName} (${l.itemNumber}) — ${l.mode} · ${l.channelDetail} — ` +
          `sells at ${money(lineSalesPrice(l))} = ${pct(lineMarginPct(l))}` +
          (l.vendorAllowancePct ? ` (${pct(lineUnfundedMarginPct(l))} before the ${l.vendorAllowancePct}% vendor allowance)` : ''),
      )
      .join('\n')
    const branded = hits.filter((l) => l.productLine === 'Branded').length
    return {
      text:
        `${hits.length} pricing setup line${hits.length === 1 ? '' : 's'} at or below ${threshold}% margin:\n\n${lines}` +
        (hits.length > 6 ? `\n…and ${hits.length - 6} more.` : '') +
        `\n\n${branded} of ${hits.length} are branded product, where the floor is set by the vendor rather than by us. ` +
        `Use Margin Threshold Test to select lines and draft a reprice.`,
    }
  }

  // ── aging boardshorts / off-season inventory ──
  if (
    q.includes('boardshort') ||
    q.includes('aging') ||
    q.includes('weeks of supply') ||
    q.includes('off-season') ||
    q.includes('off season')
  ) {
    const rec = RECOMMENDATIONS.find((r) => r.id === 'REC-RTL-5')!
    const ripCurl = PRICING_SETUP.find((l) => l.id === 'PRC-VEN-06')!
    return {
      text:
        `${rec.title}. ${rec.detail}\n` +
        rec.bullets!.map((b) => `· ${b}`).join('\n') +
        `\n${rec.impact}.\n\n` +
        `Worth knowing before you cut: the Rip Curl Surflite is already at ${pct(lineMarginPct(ripCurl))} margin ` +
        `and ${money(ripCurl.mapFloor! - lineSalesPrice(ripCurl))} under its ${money(ripCurl.mapFloor!)} MAP floor with the waiver expired. ` +
        `A transfer to the South Florida stores protects more margin than a deeper markdown does.`,
    }
  }

  // ── vendor programs ──
  if (
    q.includes('vendor') ||
    q.includes('brand') ||
    q.includes('quiksilver') ||
    q.includes('roxy') ||
    q.includes('volcom') ||
    q.includes('rip curl') ||
    q.includes('co-op') ||
    q.includes('coop')
  ) {
    const recs = RECOMMENDATIONS.filter((r) => r.audience === 'Vendor')
    const funded = PRICING_SETUP.filter((l) => (l.vendorAllowancePct ?? 0) > 0)
    return {
      text:
        `${recs.length} open vendor program recommendations:\n\n` +
        recs.map((r) => `· ${r.title}${r.impact ? ` — ${r.impact}` : ''}`).join('\n') +
        `\n\n${funded.length} of ${PRICING_SETUP.length} priced lines currently carry co-op funding. ` +
        `That allowance is the difference between a markdown that holds margin and one that does not.`,
    }
  }

  // ── stores ──
  if (q.includes('store') || q.includes('location') || q.includes('estate')) {
    const byStore = new Map<string, number>()
    for (const o of PRICE_OVERRIDES.filter((x) => x.channel === 'Store')) {
      byStore.set(o.storeOrSite, (byStore.get(o.storeOrSite) ?? 0) + 1)
    }
    const top = [...byStore.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)
    return {
      text:
        `The estate is ${STORES.length} locations — ${STORES.filter((s) => s.state === 'FL').length} in Florida and ` +
        `${STORES.filter((s) => s.state === 'AL').length} in Alabama — plus alvinsisland.com.\n\n` +
        `Stores logging the most price overrides:\n` +
        top.map(([s, n]) => `· ${s} — ${n} override${n === 1 ? '' : 's'}`).join('\n'),
    }
  }

  // ── default ──
  return {
    text:
      `I can help with:\n` +
      `· Override audit — "How many price overrides this month?"\n` +
      `· Threshold tests — "Show pricing setup below 40% margin"\n` +
      `· MAP compliance — "Are we breaking MAP anywhere?"\n` +
      `· Off-season inventory — "What should we do about the boardshorts?"\n` +
      `· Vendor programs — "Summarize the vendor program recommendations"\n\n` +
      `Everything I answer is computed from the same data the dashboard uses.`,
  }
}
