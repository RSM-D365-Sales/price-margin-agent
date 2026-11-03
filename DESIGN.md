# bluestem — Pricing & Margin Workspace

RSM presales demo kit. A Dynamics 365 F&SC pricing-and-margin agent, built
for **Bluestem Fresh Produce** — RSM's fictional mock company for the IFPA
show circuit, a Michigan grower-packer-shipper and fresh-cut processor. Brand
kit lives in `../Blustem-company-details` (note the folder spelling):
`BRAND_GUIDE.md`, `PUN_BANK.md`, logo PNGs, and
`Bluestem_Brand_v2_and_Data.zip` (SVG mark, favicon, employees, sample data).

**Status (Oct 8, 2026):** brand and data are both Bluestem. The visual rebrand
landed Sep 24; the produce data retarget (§8) landed Oct 8. Items, case costs,
list prices, shelf lives, customers and people come from the brand zip
(`items.csv`, `customers.csv`, `employees.csv`); the order lines, prices,
promotions and decisions are invented for this app. The 25% order-line floor
and the override causes ("Promo price overlap", "Contract price not updated")
follow `price_margin_alerts.csv`.

Visual language follows the Bluestem brand guide so every app on the show
floor reads as RSM-built: Midnight chrome, RSM Blue actions, RSM Green
reserved for on-target status, Poppins headings over Segoe UI body.

---

## 1. The argument the demo makes

Bluestem sells two very different kinds of product, and they behave nothing
alike under a promotion:

| | Fresh-cut (`FC-*`) | Packed fresh (`PK-*`) |
|---|---|---|
| Examples | Apple Slices snack cup, Garden Salad Kit, Veggie Tray, Diced Apples 5 lb | Honeycrisp 3 lb pouch, Gala 3 lb pouch, Blueberry pint, Butternut Squash carton |
| List margin | **38–44%** | **28–32%** |
| Average margin in the dataset | **35.8%** | **25.5%** |
| Promotion headroom | a 15% deal still clears 25% | a 10% deal takes it under |

So the pitch is: *promoting fresh-cut is cheap; promoting packed fresh is where
margin quietly disappears — and a promo price that outlives its window is a
leak nobody signed off on.* Every page in the app is a different lens on that.

The demo opens in the apple and squash harvest, which is the moment this
bites: new-crop apples are flowing off the Hart packing line, every chain wants
a fall feature, and partner-grower blueberries are landing with most of their
shelf life already used up.

## 2. The two pricing modes

**Retail** — grocery chains, club & mass, natural and e-commerce customers,
priced through D365 customer price groups and trade promotions. Channels are
Grocery, Club & Mass, Natural and E-commerce; the e-commerce group carries a
small-pack uplift.

**Foodservice** — distributor, restaurant-chain and processor contracts. The
price is a contract line with:

- a **price floor** — the lowest price the price group allows without a
  promotion,
- an optional **trade-promotion window** (`TP-2026-*`) during which pricing
  below the floor is agreed, and
- on pooled fruit, a **grower pool share** — a % of cost the grower pool
  carries on a promotional price.

That pool share is why the app reports margin twice on pooled lines: *pooled*
margin (against cost net of the share, which is what Bluestem actually earns)
and *unpooled* margin (what the P&L looks like without it). See
`lineEffectiveCost` / `lineUnpooledMarginPct` in `src/models/types.ts`.

**A floor breach is not the same as a thin margin.** Pricing below the floor
inside an approved promotion window is fine. Pricing below it after the
promotion ended — or with no promotion at all — is a price leak. The app keeps
those separate everywhere: `lineBelowFloor` vs `lineBreachesFloor`.

## 3. Pages

| Page | What it answers |
|---|---|
| **Overview** | Where is margin leaking right now, and how much is at risk? |
| **Override Audit** | Which sales-order line overrides went too thin — and which went under the price floor? Email the rep or raise a D365 case. |
| **Margin Threshold Test** | Find *all* pricing setup at or below a margin % across a date range, then let the agent solve base price / margin component / discount to reach a target — optionally held at or above the floor. |
| **Price Updates** | Rank the retail book by how it is actually shipping — case velocity, sell-through, days of cover against shelf life, margin — then roll a price change out to chosen customers or a whole segment. |
| **Price History** | For one item and one *price scope*, every price change and the window it was live for. |
| **Recommendations** | Promotion timing, price holds and increases, short-life inventory, and foodservice contract guidance, with accept/dismiss. |
| **Setup** | D365 connection, margin guardrails, follow-up actions, assistant transport, and a live **data reconciliation** block. |

A **price scope** is whatever a price is set against: Bluestem's list price
(`LIST`), a customer price group (`PG-OHIO`, `PG-ECOM`), or one customer's
contract line (`C10012`). The same item carries different history in different
scopes — the Honeycrisp 88ct tray has both a list history and a Keystone
contract history, and reading them side by side shows the promo price that
never came off.

## 4. Price Updates vs. Margin Threshold Test

The two grids look similar and answer different questions.

- **Margin Threshold Test** asks *which prices are too thin.* It works on the
  whole book, retail and foodservice, and its unit of analysis is the price
  record.
- **Price Updates** asks *which prices the movement says are wrong.* It works
  on the retail book only — those are the prices that ship to a set of
  customers and therefore carry a velocity — and joins each price record to
  how the item actually shipped to the customers you have selected.

Price Updates adds three things the threshold test does not have:

**Customer scope.** Every retail price record carries the ship-tos it applies
to (`customerCodes`). Selecting customers filters the grid *and* re-computes
every performance figure over just those customers.

**Performance columns.** Sell-through (cases shipped ÷ cases available), case
velocity (per day / week / month, switchable), and days of cover. Velocity is
shown as a total with a per-customer figure underneath, because a line shipping
to five chains and one shipping to one club are not otherwise comparable — the
"slowest mover" KPI ranks per customer for the same reason. The default window
is the trailing four weeks; produce turns too fast for a 90-day window to say
anything.

**Roll-out and multiplier.** The reprice modal — shared with the threshold test
as `RepriceModal` — gains a customer-hierarchy picker (pick "Grocery" and the
change applies to the five chains under it) and a second pricing method:
instead of solving to a target margin, apply a flat percentage move to the
current price. Both methods then solve the same chosen price component, and the
preview shows the resulting **new sales price** alongside the new margin.

The two extra features are enabled per-page via `showRollout` / `showMultiplier`,
so the threshold test keeps its original, simpler modal.

### Days of cover

Cover is measured against a **trailing 28-day run rate** (`coverDaysFor`), not
against whatever window the user is filtering to, and it is always shown next to
the item's shelf life (`shelfLifeFor`). Nine days of cover is nothing for a
60-day squash carton and most of the life of a 12-day blueberry pint; the grid
colours cover by the share of shelf life it uses (red above 60%, green below
35%). The Recommendations page's "9 days on a 12-day shelf life" is the same
number the grid shows.

## 5. The dataset

`src/scenarios/bluestem/data.ts` is the single source of truth (shared
generator and reconciliation logic live in `src/data/mockData.ts`). Every figure is
synthetic and hand-built to tie out:

- **20 active pricing setup lines** (12 retail, 8 foodservice). At the 25%
  default floor, **6 fail** — 3 retail, 3 foodservice. Every failure is packed
  fresh, which is the intended finding.
- **3 floor breaches** with no active promotion. The sharpest is the Keystone
  Foodservice Honeycrisp 88ct tray: trade promotion TP-2026-118 closed nine
  days before the as-of date and the 15% allowance stayed on the contract line.
  The others are the Ohio Gala ad price still live at Northwind Foods and
  Harborline Markets, and the Windy City Salad Works pepper volume schedule that
  was never re-cut against a raised floor.
- **18 sales-order line overrides**, 8 at or below 25% margin, 5 below the
  price floor. Two sit *thin but exactly at the floor* — that contrast is why
  the floor column exists.
- **8 price history records** across 4 price scopes, with no gaps in the
  active-from/active-to chain.
- **Margin at risk** on the Overview is the gap to 25% on each failing line ×
  the cases on the record; quantities on failing lines are season-program
  volumes, not single orders.

- **Case shipments are generated, not listed.** Price Updates needs an
  arbitrary date window over 11 items x 11 customers, which is not something to
  hand-write. A seeded PRNG keyed on (item, customer, day) produces daily cases
  from a per-item base rate, scaled by customer size, the item's crop-season
  curve (apples peak in October, squash in November, blueberries in July) and
  day of week (produce ships Monday to Friday). It is fully reproducible — the
  same demo shows the same numbers twice — and any date range sums identically
  every time.
- Cases on hand are sized so each item carries a designed **days of cover** at
  its recent run rate. That is what makes blueberry pints land at 9 days on a
  12-day life and mini cucumbers at 8 on 12, while apples and squash sit on
  days of cover against weeks of life.

The Setup page renders a reconciliation table computed from the data at
runtime, so the numbers can be defended live if someone interrogates them.

### Dates

Every date derives from a single `AS_OF` constant in `src/scenarios/bluestem/config.ts`. Order
dates, price validity windows, promotion windows and price history are all
expressed as `iso(±n)` offsets from it. Nothing is hardcoded to a calendar date,
so a demo reused weeks later does not show stale windows — move `AS_OF` and the
whole book slides with it. The season label in the ribbon follows the Michigan
harvest calendar (`seasonOf`).

`isoToday()` in `src/lib/format.ts` returns `AS_OF`, not the wall clock, so
default filter ranges follow it too.

### Real vs. invented

Bluestem Fresh Produce, its customers, its contracts and its staff are all
fictional — they come from RSM's brand kit, so everything portrayed as a
problem is already invented. The rep names on overrides are Bluestem's sales
team from `employees.csv` (Tom Kowalski, Elena Petrov, Jamal Greene, Kate
Sullivan, Victor Huang).

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
It is deliberately omitted here: pricing is keyed on customers and contracts,
not on the ship-from site, and a selector that changes nothing is a decoy.

The favicon is `src/scenarios/bluestem/public/favicon.png` (`favicon_64.png`
from the brand zip). The lockup component is `src/scenarios/bluestem/Logo.tsx`.

## 7. Running it

```
npm install
npm run dev        # vite dev server
npm run build      # tsc && vite build -> dist/          (Bluestem)
npm run build:rimex   # tsc && vite build --mode rimex -> dist-rimex/
npm run preview:rimex # serve the RIMEX build
```

Deploys to Cloudflare Pages (project `price-margin-agent`) via
`.github/workflows/deploy.yml` on push to `main`. `vite.config.ts` uses a
relative `base` so it works from any path, and routing is hash-based for the
same reason.

The dev server hangs on the OneDrive checkout; for anything recorded or
screenshotted, serve a production build (`npm run build`, then
`npx vite preview --port 5199 --strictPort`).

The IFPA booth kit (tour video, title card, reel, voice-over script and
presenter cheat sheet) lives in `demo-kit/` — see `demo-kit/README.md`.

## 8. Scenarios and retargeting

Everything company-specific lives in a scenario folder under
`src/scenarios/<key>/` — `config.ts` (brand, persona, `AS_OF`, season
calendar, product-line names), `copy.ts` (every UI string that names the
industry), `data.ts` (the dataset), `Logo.tsx`, `theme.css` (token
overrides), `meta.ts` (HTML title, theme colour, favicon) and `public/`.
`vite.config.ts` aliases `@scenario` to exactly one folder per build, so a
prospect's bundle never contains another company's data. The contract is
`src/scenarios/types.ts`; `tsc` fails if a scenario misses a field.

| Scenario | Build | Who it is for |
|---|---|---|
| `bluestem` (default) | `npm run build` → `dist/` | IFPA show circuit; what `main` / production serve |
| `rimex` | `npm run build:rimex` → `dist-rimex/` | RIMEX (rimex.com) — wheels & rims |

**RIMEX** is a rename, not a re-tune: every price, cost, floor, discount,
quantity and date offset is the Bluestem number, so the beats are identical
(6 of 20 lines fail 25%, all hardware; 3 below floor with no promo; headline
leak is the Keystone Ridge 63 in wedge kit, allowance TP-2026-118 nine days
past its window). Mapping:

| Bluestem | RIMEX |
|---|---|
| Fresh-cut (`FC-*`) / packed fresh (`PK-*`) | Service kits (`SK-*`) / wheel hardware (`HW-*`) |
| Retail customers (grocery, club, natural, e-com) | Dealers (mining, national accounts, ag, online parts) |
| Foodservice contracts | Fleet contracts (mine sites, quarries, haulage, earthworks) |
| Grower pool share | Mill program share (steel mill funds part of a promo on hardware) |
| Days of cover vs shelf life | Days of cover vs days left in the selling window |
| Blueberries 9 d cover / 12 d life | Ag dual-wheel clamps 9 d cover / 12 d left in harvest window |
| Cases | Units |

RIMEX is only the tenant; every dealer, fleet customer, contract, rep and the
signed-in persona are fictional. The wordmark is typeset text beside a generic
wheel glyph, not RIMEX's logo artwork — drop in their SVG in
`src/scenarios/rimex/Logo.tsx` if they supply one. `AS_OF` is 2026-11-03;
move it in `src/scenarios/rimex/config.ts` before the meeting.

To add a prospect: copy `src/scenarios/rimex/`, then

1. Edit `BRAND`, `AS_OF`, `seasonOf` and `LINES` in `config.ts`, and every
   string in `copy.ts`.
2. Replace the items, customers and contracts in `data.ts`,
   keeping the failing/passing ratio roughly where it is — about 30% of lines
   failing reads as insightful; a book that is mostly red reads as alarmist.
   If the new domain has no shelf life, `ITEM_PROFILE.coverDays` and the
   Price Updates cover column are the only places that assume one.
3. Retint the tokens in the scenario's `theme.css`; register the key in
   `vite.config.ts` and add `dev:/build:/preview:<key>` scripts.
4. `npm run build:<key>`, then check the Setup page's reconciliation block ties out.
5. Update `demo-kit/scenes.mjs` so the tour captions and voice-over still name
   real figures, then re-record (`node demo-kit/record.mjs`).

The produce retarget mapped the original retail-apparel model like this:

| Retail apparel (before) | Bluestem produce (now) |
|---|---|
| Register price overrides | Sales-order line price overrides below the 25% floor |
| Retail vs vendor pricing modes | Retail customer price groups vs foodservice contracts |
| Vendor MAP floor + co-op waiver | Price-group floor + trade-promotion window |
| Vendor co-op allowance | Grower pool share on pooled fruit |
| Own label vs branded | Fresh-cut (`FC-*`) vs packed fresh (`PK-*`) |
| Store estate / sell-through / weeks of supply | Ship-to customers / case sell-through / days of cover vs shelf life |
| Gulf Coast seasonality | Per-crop Michigan harvest curves |
