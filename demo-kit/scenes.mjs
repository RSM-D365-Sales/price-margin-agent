/**
 * Single source of truth for the Price Margin Alerts booth video.
 *
 * Every other file in demo-kit/ derives from this one:
 *   record.mjs        — drives the app and records the tour, scene by scene,
 *                       holding each scene for exactly `seconds`
 *   write-script.mjs  — regenerates voiceover-script.md (timecodes + VO text)
 *                       and injects the script into the cheat sheet
 *   scratch-vo.mjs    — builds a Windows text-to-speech scratch track so the
 *                       narration can be checked against the picture
 *   subtitle-reel.mjs — burns the narration into the reel as subtitles for a
 *                       muted show-floor screen
 *
 * Edit the copy or the timings here, then re-run the scripts. Don't hand-edit
 * voiceover-script.md.
 *
 * Pacing: a relaxed read is ~150 words a minute (2.5 words a second). Each
 * scene's VO should sit just under `seconds * 2.5` words so the narrator is
 * never racing the cut.
 *
 * Figures quoted here come from src/data/mockData.ts at AS_OF 2026-10-08. If
 * the dataset changes, re-check every number in `vo` and `onScreen`.
 */

export const VIDEO = {
  title: 'Price Margin Alerts',
  company: 'Bluestem Fresh Produce',
  // Hook line from Blustem-company-details/PUN_BANK.md ("Price Margin Alert")
  tagline: 'Catch thin margins before they beet you.',
  campus: 'Grand Rapids HQ · Sites GRP · HRT · HOL',
  // What the title card between loop videos says this clip is
  interstitialSeconds: 12,
  // Pipeline nodes drawn on the title card (keeps the card's layout identical
  // across apps; only the labels change)
  interstitialNodes: [
    { n: 'Order lines',    d: 'Every override, by rep and customer' },
    { n: 'Price setup',    d: 'Price groups, promotions, contracts' },
    { n: 'Margin test',    d: 'Under 25%, under floor, promo ended' },
    { n: 'Reprice & act',  d: 'The agent drafts it, you approve' },
  ],
  // The fifth (D365) node and the connector label into it
  interstitialErp: 'Price groups · trade agreements · sales orders',
  interstitialLink: 'OData v4',
  frame: { width: 1920, height: 1080 },
}

export const SCENES = [
  {
    id: 'overview',
    seconds: 9,
    caption: 'Pricing & Margin Workspace',
    sub: 'Retail price groups and foodservice contracts, one view',
    vo: 'Harvest is on, every chain wants a feature, and margin leaks one order line at a time. Bluestem sees it here.',
    onScreen: 'Overview: the amber callout "3 pricing lines sit below the price floor with no active trade promotion", KPI row (11 overrides in 30 days, 6 setup lines failing 25%, 3 below floor, 9 open recommendations, $29,912 margin at risk), then the gap bar led by Apples $19,678.',
  },
  {
    id: 'overrides',
    seconds: 10,
    caption: 'Override Audit',
    sub: 'Every order line a rep priced by hand, lowest margin first',
    vo: 'Every price a rep typed over, lowest margin first. Five went under the floor. Email the rep or raise a case.',
    onScreen: '"Below floor only" ticked: five rows, Gala 3 lb pouch for Northwind Foods at 13.5% and $1.40 under its $16.90 floor on top. Email opens a drafted note to Tom Kowalski, then Cancel.',
  },
  {
    id: 'threshold',
    seconds: 12,
    caption: 'Margin Threshold Test',
    sub: 'The whole book against 25% · retail and foodservice',
    vo: 'Test the whole book at twenty-five percent. Every failure is packed fresh, and one apple promo outlived its window. Draft the fix, held at the floor.',
    onScreen: 'Retail tab: 3 failures, Gala 15.9% "breach". Foodservice tab: Keystone Foodservice Honeycrisp 88ct tray at 24.5% (17.9% unpooled), $37.80 floor "breach". Draft new price opens the reprice preview with "Hold at or above the price floor" ticked, then Cancel.',
  },
  {
    id: 'price-updates',
    seconds: 10,
    caption: 'Price Updates',
    sub: 'Case velocity, sell-through and days of cover against shelf life',
    vo: 'Rank the retail book by how it actually ships. Blueberry pints are sitting on nine days of cover with a twelve-day life.',
    onScreen: 'Customer chips narrowed to E-commerce (Pantry Prime Meal Kits, DoorStep Grocer): Blueberries pint clamshell shows 9 days of 12-day life in red, $27.00 on its floor at 22.2%.',
  },
  {
    id: 'price-history',
    seconds: 8,
    caption: 'Price History',
    sub: 'One item, one price scope, every change',
    vo: 'Price history shows when that Keystone allowance went live, and that nobody ever took it off.',
    onScreen: 'Honeycrisp 88ct tray, scope switched to "Keystone Foodservice · Fall Apple Program": current $35.70 Trade promotion, note "TP-2026-118 ended … price never restored to the $37.80 floor".',
  },
  {
    id: 'recommendations',
    seconds: 9,
    caption: 'AI Recommendations',
    sub: 'Retail and foodservice agents · human-in-the-loop',
    vo: 'The agent turns it into moves: divert berries to fresh-cut, restore the floor, index the processor contract.',
    onScreen: 'Retail agent: "Blueberry pints are at 9 days of cover on a 12-day shelf life". Foodservice agent tab: "Three lines price below floor with no active promotion" (red pill), "Index the Windy City processor contract to raw cost".',
  },
  {
    id: 'setup',
    seconds: 7,
    caption: 'Setup',
    sub: 'Guardrails, follow-up actions, and a reconciliation that ties out',
    vo: 'Guardrails live in Setup, and every figure ties out to one dataset.',
    onScreen: 'Margin guardrails (order-line floor 25%, foodservice minimum 20%), then the Data reconciliation table: 20 lines, 6 of 20 at or below 25%, 3 below floor.',
  },
  {
    id: 'end-card',
    seconds: 6,
    caption: 'Price Margin Alerts',
    sub: 'Catch thin margins before they beet you.',
    vo: 'Price Margin Alerts, powered by RSM. Catch thin margins before they beet you.',
    onScreen: 'Midnight end card: bluestem mark, Price Margin Alerts, the hook line, Powered by RSM bottom-right.',
  },
]

export const TOTAL_SECONDS = SCENES.reduce((t, s) => t + s.seconds, 0)

/** Alternate openers from PUN_BANK.md — swap into scene 1 if the room wants a hook. */
export const ALT_OPENERS = [
  'Spreadsheets are where margins go to hide. Let\'s go find them.',
  'Fresh apps. Fresher data. Freshest margins.',
]

export function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function fmtTime(sec) {
  const m = Math.floor(sec / 60)
  const s = sec - m * 60
  return `${m}:${s.toFixed(1).padStart(4, '0')}`
}
