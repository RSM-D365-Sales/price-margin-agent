# Alvin's Island — Pricing & Margin Workspace

RSM presales demo kit. A Dynamics 365 F&SC pricing-and-margin agent retargeted
to **Alvin's Island** (alvinsisland.com), a coastal beachwear and surf retailer
running ~20 stores across the Florida panhandle, Gulf Coast Florida, and coastal
Alabama, plus a direct ecommerce channel.

Visual language matches the **Retail Product Creation** workspace
(retail-product-creation.rsmd365.com) so the two demos read as one product
family: deep navy chrome, beach gold accents, Poppins throughout, white cards on
a cool grey ground.

---

## 1. The argument the demo makes

Alvin's Island sells two very different kinds of product, and they behave
nothing alike under discount:

| | Own label | Branded surf |
|---|---|---|
| Examples | Panama City Beach Sunset Tee, Destin Sun & Stripes Hoodie, Shark Tooth Necklace | Quiksilver, Roxy, Volcom, O'Neill, Rip Curl, Vans, Fox Racing |
| Average margin in the dataset | **67.5%** | **42.9%** |
| Who sets the floor | Alvin's Island | the brand, via **MAP** |
| Markdown headroom | deep — 40% off still clears the target | almost none |

So the pitch is: *discounting own-label souvenir goods is cheap; discounting
branded surf is where margin quietly disappears, and the brand — not you — sets
how far you can go.* Every page in the app is a different lens on that.

The demo opens post-Labor Day, which is the moment this bites: peak Gulf Coast
season has just ended, boardshorts are at 14 weeks of supply, and there is
pressure to mark everything down at once.

## 2. The two pricing modes

**Retail** — alvinsisland.com plus the store estate. Alvin's Island sets the
price. Channels are ecommerce, all-stores, price groups (Retail Standard,
High Stores), outlets, and resort & kiosk locations (which carry a price uplift).

**Vendor programs** — the branded assortment is bought under brand programs.
The brand sets:

- a **MAP floor** (minimum advertised price),
- an optional **markdown waiver window** during which pricing below MAP is
  agreed, and
- a **co-op allowance** — a % of cost the brand funds on approved markdowns.

That allowance is why the app reports margin twice on funded lines: *funded*
margin (against cost net of allowance, which is what the business actually
earns) and *unfunded* margin (what the P&L looks like without it). The gap
between them is the whole argument for negotiating co-op funding into a
program — see `lineEffectiveCost` / `lineUnfundedMarginPct` in
`src/models/types.ts`.

**A MAP breach is not the same as a thin margin.** Pricing below MAP inside an
approved waiver window is compliant. Pricing below MAP with an expired waiver,
or none at all, is a breach of the vendor agreement. The app keeps those
separate everywhere — `lineBelowMap` vs `lineBreachesMap`.

## 3. Pages

| Page | What it answers |
|---|---|
| **Overview** | Where is margin leaking right now, and how much is at risk? |
| **Override Audit** | Which register overrides went too thin — and which broke a vendor MAP floor? Email the user or raise a D365 case. |
| **Margin Threshold Test** | Find *all* pricing setup at or below a margin % across a date range, then let the agent solve base price / margin component / discount to reach a target — optionally held at or above MAP. |
| **Price Updates** | Rank the retail book by how it is actually selling — sell-through, sales velocity, weeks of supply, margin — then roll a price change out to chosen stores or a whole region. |
| **Price History** | For one product and one *price scope*, every price change and the window it was live for. |
| **Recommendations** | Markdown timing, price increases, kiosk uplifts, and vendor program guidance, with accept/dismiss. |
| **Setup** | D365 connection, margin guardrails, follow-up actions, assistant transport, and a live **data reconciliation** block. |

A **price scope** is whatever a price is set against: the retail list price, a
single channel (`alvinsisland.com`), one store (`ST-PCB`), or a vendor
program's MAP schedule (`VP-QUIK`). The same product carries different history
in different scopes — the Quiksilver boardshort has both a retail list history
and a Quiksilver MAP history, and reading them side by side is the point.

## 4. Price Updates vs. Margin Threshold Test

The two grids look similar and answer different questions.

- **Margin Threshold Test** asks *which prices are too thin.* It works on the
  whole book, retail and vendor, and its unit of analysis is the price record.
- **Price Updates** asks *which prices the sell-through says are wrong.* It
  works on the retail book only — those are the prices that carry a store
  presence and therefore a sell-through — and joins each price record to how
  the item actually sold in the locations you have selected.

Price Updates adds three things the threshold test does not have:

**Store scope.** Every retail price record carries the locations it applies to
(`storeCodes`). Selecting stores filters the grid *and* re-computes every
performance figure over just those locations. A price that only exists on
alvinsisland.com disappears when you deselect Ecommerce.

**Performance columns.** Sell-through (units sold ÷ units available), sales
velocity (units per day / week / month, switchable), and weeks of supply.
Velocity is shown as a total with a per-location figure underneath, because a
line stocked in ten stores and one stocked only on the site are not otherwise
comparable — the "slowest mover" KPI ranks per location for the same reason.

**Roll-out and multiplier.** The reprice modal — shared with the threshold test
as `RepriceModal` — gains an org-hierarchy picker (pick "Retail Standard" and
the change applies to the five stores under it) and a second pricing method:
instead of solving to a target margin, apply a flat percentage move to the
current price. Both methods then solve the same chosen price component, and the
preview shows the resulting **new sales price** alongside the new margin.

The two extra features are enabled per-page via `showRollout` / `showMultiplier`,
so the threshold test keeps its original, simpler modal. Flip either prop on to
give it the same controls.

### Weeks of supply

Cover is measured against a **trailing 28-day run rate** (`coverWeeksFor`), not
against whatever window the user is filtering to. This matters: a 90-day window
ending in September still spans peak summer, so measuring cover against it would
flatter every slow mover — the boardshorts would read 7 weeks instead of 14.
Merchants forecast forward on recent velocity, and the demo has to agree with
itself when the Recommendations page says 14 weeks.

## 5. The dataset

`src/data/mockData.ts` is the single source of truth. Every figure is
synthetic and hand-built to tie out:

- **20 active pricing setup lines** (12 retail, 8 vendor). At the 45% default
  target, **6 fail** — 3 retail, 3 vendor. Almost all failures are branded,
  which is the intended finding.
- **3 MAP breaches** with no active waiver. The sharpest is the Rip Curl
  Surflite: the vendor's waiver expired nine days before the as-of date and the
  price was never restored.
- **18 register price overrides**, 8 at or below 45% margin, 5 below a MAP
  floor. Several branded overrides sit *thin but exactly at the floor* — that
  contrast is why the MAP column exists.
- **8 price history records** across 5 price scopes, with no gaps in the
  active-from/active-to chain.

- **Unit sales are generated, not listed.** Price Updates needs an arbitrary
  date window over 18 items x 11 locations, which is not something to hand-write.
  A seeded PRNG keyed on (item, location, day) produces daily units from a
  per-item base rate, scaled by store size, Gulf Coast seasonality (spring break,
  peak summer, the drop after Labor Day) and day of week. It is fully
  reproducible — the same demo shows the same numbers twice — and any date range
  sums identically every time.
- On-hand is sized so each item carries a designed **weeks of supply** at its
  recent run rate. That is what makes the boardshorts land at 14 weeks and the
  souvenir tees at 3, and it is why sell-through spreads from 52% (branded
  boardshorts) to 83% (souvenir tees) rather than clustering.

The Setup page renders a reconciliation table computed from the data at
runtime, so the numbers can be defended live if someone interrogates them.

### Dates

Every date derives from a single `AS_OF` constant in `src/lib/config.ts`. Order
dates, price validity windows, markdown waves, and MAP waiver expiries are all
expressed as `iso(±n)` offsets from it. Nothing is hardcoded to a calendar date,
so a demo reused weeks later does not show stale windows — move `AS_OF` and the
whole book slides with it.

`isoToday()` in `src/lib/format.ts` returns `AS_OF`, not the wall clock, so
default filter ranges follow it too.

### Real vs. invented

Store locations, brand names, and a handful of product names are real — that is
what makes the assortment land as *theirs*. Everything portrayed as a problem is
invented: staff names, order numbers, program numbers, and the pricing decisions
themselves. No real person or organisation is shown making a bad call. Vendor
brands appear only as counterparties setting normal MAP and co-op terms.

## 6. Design system

Tokens in `src/styles/theme.css`, lifted to match the Retail Product Creation
workspace.

| Role | Token | Value |
|---|---|---|
| Chrome / sidebar | `--navy-900` | `#0b1f36` |
| Primary button | `--navy-800` | `#0b304d` |
| Accent / execute action | `--gold-400` | `#d9a93b` |
| Page ground | `--bg` | `#f3f5f8` |
| Card | `--surface` / `--ink-200` | `#fff` on `#d5dae3` |
| Critical / good / warning | `--critical` `--good` `--warning` | `#d03b3b` `#0ca30c` `#fab219` |

Type is **Poppins 400/500/600/700**, self-hosted as base64 woff2 in
`src/styles/fonts.css` — no CDN, so the built artifact is self-contained for
GitHub Pages. Numbers use `font-variant-numeric: tabular-nums`; item codes use
the mono stack.

Radii are 6/8/12px, cards carry a soft two-layer shadow, and the gold "A" tile
in the sidebar is the same mark as the favicon.

## 7. Running it

```
npm install
npm run dev        # vite dev server
npm run build      # tsc && vite build -> dist/
```

Deploys to GitHub Pages via `.github/workflows/deploy.yml`. `vite.config.ts`
uses a relative `base` so it works from any Pages path, and routing is hash-based
for the same reason.

## 8. Retargeting to another prospect

1. Edit `BRAND` and `AS_OF` in `src/lib/config.ts`.
2. Replace the product catalogue, stores, and vendor programs in
   `src/data/mockData.ts`, keeping the failing/passing ratio roughly where it is
   — about 30% of lines failing reads as insightful; a book that is mostly red
   reads as alarmist.
3. Adjust the palette in `src/styles/theme.css` if the new brand needs it.
4. `npm run build`, then check the Setup page's reconciliation block ties out.
