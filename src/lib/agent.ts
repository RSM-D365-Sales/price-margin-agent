// ── Heuristic assistant · grounded in the same aggregations the pages use ──
// Rule-based router (offline default). Every number it quotes is computed from
// the dataset at call time — nothing is written into the replies by hand.

import { CUSTOMERS, PRICE_OVERRIDES, PRICING_SETUP, RECOMMENDATIONS, coverDaysFor, shelfLifeFor } from '../data/mockData'
import {
  overrideMarginPct,
  overrideBreachesFloor,
  lineMarginPct,
  lineUnpooledMarginPct,
  lineSalesPrice,
  lineBreachesFloor,
} from '../models/types'
import { AS_OF, DEFAULT_RETAIL_MARGIN_TARGET, iso } from './config'
import { money, pct, shortDate } from './format'

export interface AgentReply {
  text: string
}

export const SUGGESTED_PROMPTS = [
  'How many price overrides this month?',
  'Which override has the worst margin?',
  `Show pricing setup below ${DEFAULT_RETAIL_MARGIN_TARGET}% margin`,
  'Are we below floor anywhere?',
  'What should we do about the blueberries?',
  'Summarize the foodservice contract recommendations',
]

export function askAgent(raw: string): AgentReply {
  const q = raw.toLowerCase()

  // ── price floor / promotion compliance ──
  if (q.includes('floor') || q.includes('leak') || q.includes('expired') || q.includes('promo')) {
    const breaches = PRICING_SETUP.filter((l) => lineBreachesFloor(l, AS_OF))
    const onPromo = PRICING_SETUP.filter(
      (l) => l.floorPrice !== undefined && lineSalesPrice(l) < l.floorPrice && !lineBreachesFloor(l, AS_OF),
    )
    if (breaches.length === 0) {
      return { text: 'Every floor-covered line is either at or above its floor, or inside an approved trade promotion. Nothing to escalate.' }
    }
    const lines = breaches
      .map(
        (l) =>
          `· ${l.itemName} (${l.itemNumber}) — ${l.channelDetail}\n` +
          `  sells at ${money(lineSalesPrice(l))} against a ${money(l.floorPrice!)} floor` +
          (l.promoUntil
            ? ` · ${l.discount?.promoId ?? 'promotion'} ended ${shortDate(l.promoUntil)}`
            : ' · no promotion on file'),
      )
      .join('\n')
    return {
      text:
        `${breaches.length} line${breaches.length === 1 ? '' : 's'} price below floor with no active trade promotion:\n\n${lines}\n\n` +
        `${onPromo.length} further line${onPromo.length === 1 ? ' is' : 's are'} below floor but inside an approved promotion window, so ${onPromo.length === 1 ? 'it is' : 'they are'} fine.\n\n` +
        `Fastest fix is to restore the price to the floor; the alternative is to extend the promotion with approval.`,
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
    const floorHits = inWindow.filter(overrideBreachesFloor)
    const worst = [...inWindow].sort((a, b) => overrideMarginPct(a) - overrideMarginPct(b))[0]
    return {
      text:
        `In the last 30 days I count ${inWindow.length} order-line price overrides, ` +
        `${below.length} of them below ${DEFAULT_RETAIL_MARGIN_TARGET}% margin` +
        (floorHits.length ? `, and ${floorHits.length} that went under the price floor` : '') +
        `.\n\n` +
        `The worst is ${worst.itemName} (${worst.itemNumber}, ${worst.pack}) on order ${worst.orderNumber}: ` +
        `overridden to ${money(worst.overridePrice)} against a ${money(worst.unitCost)} case cost — ` +
        `${pct(overrideMarginPct(worst))} margin, reason "${worst.reasonCode}", by ${worst.overriddenBy} for ${worst.customer}.\n\n` +
        `Open the Override Audit tab to email the rep or raise a D365 case.`,
    }
  }

  // ── worst override ──
  if (q.includes('worst') && (q.includes('margin') || q.includes('override'))) {
    const worst = [...PRICE_OVERRIDES].sort((a, b) => overrideMarginPct(a) - overrideMarginPct(b))[0]
    return {
      text:
        `Lowest-margin override on file: ${worst.itemName} (${worst.itemNumber}, ${worst.pack}).\n` +
        `Original ${money(worst.originalPrice)} → overridden to ${money(worst.overridePrice)} ` +
        `(cost ${money(worst.unitCost)}) = ${pct(overrideMarginPct(worst))} margin.\n` +
        `Reason: ${worst.reasonCode} · Rep: ${worst.overriddenBy} · ${worst.customer} · ${shortDate(worst.orderDate)}` +
        (overrideBreachesFloor(worst)
          ? `\n\nIt also landed ${money(worst.floorPrice! - worst.overridePrice)} under the ${money(worst.floorPrice!)} price floor.`
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
          `· ${l.itemName} (${l.itemNumber}) — ${l.mode} · ${l.channelDetail} — ` +
          `sells at ${money(lineSalesPrice(l))} = ${pct(lineMarginPct(l))}` +
          (l.poolSharePct ? ` (${pct(lineUnpooledMarginPct(l))} before the ${l.poolSharePct}% grower pool share)` : ''),
      )
      .join('\n')
    const packed = hits.filter((l) => l.productLine === 'Packed fresh').length
    return {
      text:
        `${hits.length} pricing setup line${hits.length === 1 ? '' : 's'} at or below ${threshold}% margin:\n\n${lines}` +
        (hits.length > 6 ? `\n…and ${hits.length - 6} more.` : '') +
        `\n\n${packed} of ${hits.length} are packed fresh, where list margin is thin enough that a routine deal crosses the floor. ` +
        `Use Margin Threshold Test to select lines and draft a reprice.`,
    }
  }

  // ── short-life inventory ──
  if (
    q.includes('blueberr') ||
    q.includes('berry') ||
    q.includes('shelf') ||
    q.includes('cover') ||
    q.includes('shrink')
  ) {
    const rec = RECOMMENDATIONS.find((r) => r.id === 'REC-RTL-5')!
    const berries = PRICING_SETUP.find((l) => l.id === 'PRC-RTL-05')!
    const cover = coverDaysFor(berries.itemNumber, berries.customerCodes ?? [])
    return {
      text:
        `${rec.title}. ${rec.detail}\n` +
        rec.bullets!.map((b) => `· ${b}`).join('\n') +
        `\n${rec.impact}.\n\n` +
        `Measured now: ${cover.toFixed(1)} days of cover against a ${shelfLifeFor(berries.itemNumber)}-day shelf life, ` +
        `and the e-commerce price is already ${money(lineSalesPrice(berries))} — exactly on its floor at ${pct(lineMarginPct(berries))} margin. ` +
        `Diverting to fresh-cut protects more margin than a deeper cut can.`,
    }
  }

  // ── foodservice contracts ──
  if (
    q.includes('foodservice') ||
    q.includes('contract') ||
    q.includes('keystone') ||
    q.includes('windy city') ||
    q.includes('pool')
  ) {
    const recs = RECOMMENDATIONS.filter((r) => r.audience === 'Foodservice')
    const pooled = PRICING_SETUP.filter((l) => (l.poolSharePct ?? 0) > 0)
    return {
      text:
        `${recs.length} open foodservice contract recommendations:\n\n` +
        recs.map((r) => `· ${r.title}${r.impact ? ` — ${r.impact}` : ''}`).join('\n') +
        `\n\n${pooled.length} of ${PRICING_SETUP.length} priced lines currently carry a grower pool share. ` +
        `On pooled apples that share is the difference between a promotion that holds margin and one that does not.`,
    }
  }

  // ── customers ──
  if (q.includes('customer') || q.includes('retailer') || q.includes('chain')) {
    const byCustomer = new Map<string, number>()
    for (const o of PRICE_OVERRIDES) {
      byCustomer.set(o.customer, (byCustomer.get(o.customer) ?? 0) + 1)
    }
    const top = [...byCustomer.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)
    return {
      text:
        `The retail book prices ${CUSTOMERS.length} ship-to customers across ${new Set(CUSTOMERS.map((c) => c.state)).size} states, ` +
        `plus the foodservice contracts.\n\n` +
        `Customers with the most order-line overrides:\n` +
        top.map(([c, n]) => `· ${c} — ${n} override${n === 1 ? '' : 's'}`).join('\n'),
    }
  }

  // ── default ──
  return {
    text:
      `I can help with:\n` +
      `· Override audit — "How many price overrides this month?"\n` +
      `· Threshold tests — "Show pricing setup below 20% margin"\n` +
      `· Price floors — "Are we below floor anywhere?"\n` +
      `· Short-life inventory — "What should we do about the blueberries?"\n` +
      `· Foodservice — "Summarize the foodservice contract recommendations"\n\n` +
      `Everything I answer is computed from the same data the dashboard uses.`,
  }
}
