# bluestem — Pricing & Margin Workspace

RSM presales demo kit. A Dynamics 365 F&SC pricing-and-margin agent, branded
for **Bluestem Fresh Produce** — RSM's fictional mock company for the IFPA
show circuit. Brand kit lives in `../Blustem-company-details` (note the folder
spelling): `BRAND_GUIDE.md`, `PUN_BANK.md`, logo PNGs, and
`Bluestem_Brand_v2_and_Data.zip` (SVG mark, favicon, employees, sample data).

**Brand status (Sep 24, 2026):** chrome, palette, typography, favicon, title
ribbon, RSM sponsor mark, persona, and doc titles are Bluestem. The **dataset
is still the coastal beachwear book** it was originally built on (own-label
souvenir goods vs. branded surf under vendor MAP programs, a Gulf Coast store
estate). Retargeting the data to produce is a domain rethink, not a find-and-
replace — see §8. `bluestem/data/price_margin_alerts.csv` in the brand zip is
the seed for that: sales-order lines below a 25% floor with causes like
"Promo price overlap", "Contract price not updated", and "Freight surcharge".

Visual language follows the Bluestem brand guide so every app on the show
floor reads as RSM-built: Midnight chrome, RSM Blue actions, RSM Green
reserved for on-target status, Poppins headings over Segoe UI body.

---

## 1. The argument the demo makes

The (still beachwear) dataset sells two very different kinds of product, and
they behave nothing alike under discount:

| | Own label | Branded surf |
|---|---|---|
| Examples | Panama City Beach Sunset Tee, Destin Sun & Stripes Hoodie, Shark Tooth Necklace | Quiksilver, Roxy, Volcom, O'Neill, Rip Curl, Vans, Fox Racing |
| Average margin in the dataset | **67.5%** | **42.9%** |
| Who sets the floor | the retailer | the brand, via **MAP** |
| Markdown headroom | deep — 40% off still clears the target | almost none |

So the pitch is: *discounting own-label souvenir goods is cheap; discounting
branded surf is where margin quietly disappears, and the brand — not you — sets
how far you can go.* Every page in the app is a different lens on that.

The demo opens post-Labor Day, which is the moment this bites: peak Gulf Coast
season has just ended, boardshorts are at 14 weeks of supply, and there is
pressure to mark everything down at once.

## 2. The two pricing modes

**Retail** — the ecommerce site (`bluestemfresh.com` in the data) plus the
store estate. The retailer sets the price. Channels are ecommerce, all-stores, price groups (Retail Standard,
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
single channel (`bluestemfresh.com`), one store (`ST-PCB`), or a vendor
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
the ecommerce site disappears when you deselect Ecommerce.

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

Tokens in `src/styles/theme.css`, per `BRAND_GUIDE.md` (palette borrowed from
rsmus.com).

| Role | Token | Value |
|---|---|---|
| Chrome / ribbon / sidebar | `--midnight-900` | `#00153D` Midnight |
| Sidebar gradient top | `--midnight-800` | `#0B2454` |
| Secondary solid button | `--midnight-900` | `#00153D` |
| Primary / execute action, links, active nav | `--accent` (`--blue-600`) | `#0079AD` — RSM Blue deepened for AA text contrast |
| Chart series 1, avatar, active-nav rail | `--blue-500` | `#009CDE` RSM Blue |
| Selected rows, info banners | `--blue-100` | `#E5F5FC` Light Sky |
| Page ground | `--bg` (`--grey-50`) | `#F2F3F4` Fog |
| Card | `--surface` / `--grey-200` | `#fff` on `#D7D9DB` |
| Good / warning / critical | `--good` `--warning` `--critical` | `#3F9C35` RSM Green · `#F2A900` Harvest Amber · `#D0342C` Signal Red |

Green is status-only (on-target margin, accepted, positive delta). It never
colours a button or a chart series — the brand guide reserves it.

`--ink-*` tokens are aliases onto the grey scale so the pages' inline styles
did not need touching.

Type: **Poppins 600** for headings, KPI values, the wordmark and the app name
(self-hosted as base64 woff2 in `src/styles/fonts.css`, no CDN); **Segoe UI**
for body and grids, matching D365 F&SC. Numbers use tabular figures; item codes
use the mono stack.

### Header pattern

A fixed 52px Midnight **title ribbon** spans the full width, per the brand
guide: bluestem lockup on the left (inline SVG mark + Poppins wordmark, white
"blue" / green "stem" on dark), a divider, then the app name. On the right:
season and as-of date, the required **"Powered by" RSM sponsor mark**
(`src/assets/rsmus-logo-white.png`, 22px tall, behind a 1px divider), then the
persona avatar and name from `BRAND.persona`. The sidebar sits below the ribbon
and carries only navigation; the active link gets a 3px RSM Blue rail.

The brand guide's header also lists a site selector (GRP / HRT / HOL / SAL).
It is deliberately omitted here: this dataset is keyed on stores, not Bluestem
sites, and a selector that changes nothing is a decoy.

The favicon is `public/favicon.png` (`favicon_64.png` from the brand zip). The
lockup component is `src/components/BluestemLogo.tsx`.

## 7. Running it

```
npm install
npm run dev        # vite dev server
npm run build      # tsc && vite build -> dist/
```

Deploys to Cloudflare Pages (project `price-margin-agent`) via
`.github/workflows/deploy.yml` on push to `main`. `vite.config.ts` uses a
relative `base` so it works from any path, and routing is hash-based for the
same reason.

## 8. Retargeting to another prospect

1. Edit `BRAND` and `AS_OF` in `src/lib/config.ts`.
2. Replace the product catalogue, stores, and vendor programs in
   `src/data/mockData.ts`, keeping the failing/passing ratio roughly where it is
   — about 30% of lines failing reads as insightful; a book that is mostly red
   reads as alarmist.
3. Adjust the palette in `src/styles/theme.css` if the new brand needs it.
4. `npm run build`, then check the Setup page's reconciliation block ties out.

### Still to do for the Bluestem data retarget

Step 2 has not been done for Bluestem. The current domain model is retail
apparel: register overrides, own-label vs branded, vendor MAP floors and co-op
waivers, a store estate with sell-through. A produce grower-packer-shipper
does not have MAP floors or register overrides. The mapping to work out
before touching `mockData.ts`:

| Today | Bluestem equivalent |
|---|---|
| Register price overrides | Sales-order line price overrides below the 25% floor (`price_margin_alerts.csv`: causes are promo overlap, stale contract price, freight surcharge, raw cost increase) |
| Retail vs vendor pricing modes | Retail (grocery chains, club) vs foodservice distributor contracts — the sibling rebate app already splits on this |
| Vendor MAP floor + co-op waiver | Customer contract price + trade promotion window (`trade_promotions.csv`) |
| Own label vs branded | Packed produce (`PK-*`) vs fresh-cut (`FC-*`) items, which carry very different margins |
| Store estate / sell-through | Ship-to customers and sites (GRP / HRT / HOL / SAL); velocity per customer instead of per store |
| Gulf Coast seasonality | Michigan harvest calendar — apples and squash in autumn, asparagus in spring, winter volume from partner growers |

The personas in `employees.csv` (Kate Sullivan for club/mass, Elena Petrov for
retail central, Jamal Greene for foodservice) should replace the invented
override users. Everything portrayed as a problem stays fictional.
