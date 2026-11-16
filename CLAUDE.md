# Template conventions

This is a Next.js 15 (App Router) / React 19 storefront template built on
`@opencals/storefront-sdk`. These conventions keep the template fast and
maintainable. They apply to every template in `templates/` — this file is meant
to be copied across them (only the template name / branding differs).

## Data fetching

**RSC-first.** Read data on the server and pass it down. Do NOT fetch cacheable
data in a `useEffect` on the client.

- Server reads go through `lib/server-data.ts` — `React.cache()`-wrapped helpers
  (`getStoreSettings`, `getProducts`, `getProduct`) that call the SDK directly.
  `React.cache` dedupes calls within a request. Never import `lib/server-data.ts`
  from a `'use client'` file.
- `app/layout.tsx` is an async Server Component: it fetches store settings once
  and seeds `<Providers initialSettings={...}>`. `SettingsProvider` takes the
  value as a prop — it does not fetch.
- Read-only pages (e.g. `app/coaches/page.tsx`) are async Server Components that
  fetch with `lib/server-data.ts` and hand the result to a small `'use client'`
  child as `initialProducts` / `initialProduct`.

**Client reads use SWR, seeded with server data.** For data that genuinely needs
to live on the client (filtering, availability, add-ons, cart), use `useSWR`
against the template's own `/api/*` routes, with `fallbackData` set to the
server-rendered value so there's no loading flash on first paint.

- Shared fetcher: `lib/fetcher.ts`.
- Build the SWR key from its inputs and pass `null` when not ready (e.g. no date
  picked yet) so nothing fetches prematurely. Multiple SWR hooks run in parallel
  — never chain fetches through sequential `useEffect`s.
- `revalidateOnFocus: false` unless you specifically want refocus revalidation.

The `/api/*` routes stay: they are the client/SWR data source and call the SDK
server-side via the `@/lib/opencals` side-effect import.

## Components & files

**Pages compose; components implement.** A `page.tsx` should be: data fetching
(RSC) + layout/composition + wiring. Presentational blocks and interactive
widgets live in `components/`.

- Guideline: any `page.tsx` over ~150 lines, or one that defines a section /
  widget component, gets decomposed into `components/`.
- Group `components/` by route/domain: `components/booking/`, `components/account/`,
  `components/services/`, `components/home/`; shared primitives in `components/ui/`.
  Co-locate a route's private components under a matching subfolder
  (e.g. `components/account/appointment-detail/`).

**Never define a component inside another component** — it remounts on every
parent render. Define at module scope (or a separate file). Module-scope sibling
helpers below a page are fine.

**Use the shared UI primitives — don't hand-style buttons/inputs inline.**
- `components/ui/button.tsx`: `<Button variant size fullWidth loading>`. Variants:
  `primary` (ink slab, red lip), `chalk` (on rubber), `outline`, `outline-chalk`,
  `ghost`, `plate` (yellow, the booking action: "Load the bar"). Sizes `sm|md|lg`.
  Square (2px) slabs with a 2px bottom "plate lip"; no pills. Links that look like
  buttons use `buttonClasses({ variant, size, fullWidth, className })`.
- `components/ui/input.tsx` — `<Input>`, `<Textarea>`, `<Select>`, `<FieldLabel>`.
- `components/ui/segmented.tsx` — plain radio-button rows (tier, site, length).
- `components/ui/overlay.tsx` — the one overlay: `kind="drawer"` (the Bar, the menu)
  or `kind="sheet"` (phone session panel, cancel dialog). Focus trap + scroll lock.
- Brand pieces live in `components/brand/*` (plate, calibration strip, LED readout,
  places meter, section head, logo). Never import a motion library.

**Hooks are single-concern.** Split multi-purpose hooks so each has one
responsibility and independent dependencies (see `hooks/use-checkout-questions.ts`,
`hooks/use-payment-providers.ts`, `hooks/use-cart-expiry.ts`, split out of the
booking flow / cart context). A large hook may remain as a thin orchestrator that
composes the smaller ones.

## Re-render hygiene

- **Memoize context provider values** with `useMemo` — an inline `value={{...}}`
  object makes every consumer re-render on each provider render. All contexts here
  (`settings`, `timezone`, `cart`, `checkout`) follow this.
- Hoist static objects (default non-primitive props) to module-level `const`s
  instead of recreating them inline.
- `React.memo` leaf components that take stable props and render often
  (e.g. `components/floor/session-block.tsx`).
- Prefer a ternary (`cond ? <x/> : null`) over `cond && <x/>` for conditional
  rendering, to avoid accidentally rendering `0`/`''`.

## Bundle

- Load heavy / below-the-fold components with `next/dynamic`. Stripe is never
  in the initial bundle: it loads on demand inside
  `components/checkout/checkout-view.tsx`.
- Import directly from module paths; avoid barrel/index re-export files that pull
  in more than you use.

## METTLE: boutique gym (Melbourne, AUD, `Australia/Melbourne`)

Strength, fight and recovery club: the Engine House (Collingwood), the Yard
(Cremorne) and Mettle Remote (online). Twelve coaches in three tiers, weekly
group classes, personal training at 30/60/90 min, partner PT, padwork, ring
hire, a contrast suite, infrared suites, open floor, a testing lab, dated
events. Seed dataset `boutique_gym` (backend). Design contract: **DESIGN.md**
("Calibrated": IWF plate colours, the Bar, LED readouts, the race bib).

### Data model (`lib/catalog.ts`): derived from the API, keyed by slugs
- **Discipline** = the product's collection (`strength`, `fight`,
  `conditioning`, `mobility`, `recovery`, `coaching`, `lab`, `events`). Site
  copy wins when it knows the product (`siteConfig.classes[key].discipline` /
  `services[key].discipline`), because open floor sits in two collections. The
  discipline sets the **plate** colour.
- **Kind**: `event` (events), `class` (a `siteConfig.classes` key, or a
  timetable discipline with >1 place and one coach per variant), else
  `service` (booked in the slot rack).
- **Class** = product group; each variant is one weekly **series** (class ×
  site × coach), slug `<class-key>-<site>-<coach>` (`barbell-club-collingwood-jo`).
  Site and coach come from the variant's own `locations` / `staffMembers`.
- **Service** = product group; variants are options (PT tiers `pt-coach`,
  `pt-senior`, `pt-head` under `personal-training` via `prefixes: ['pt-']`;
  `fight-padwork-45/-60`; `infrared-suite-1/-2`; `open-floor-<site>`).
- Sites by location slug (`mettle-collingwood` → key `collingwood`, URL
  `/sites/collingwood`); coaches by staff slug (bios, tiers in site-config).
- `getCatalog()` → `{ classes, services, events, sites, coaches }`; helpers
  `findOffering`, `findSeries`, `findSite`, `findCoach`, `servicesIn`,
  `physicalSites`, `offeringsForCoach`.

### Availability (never per day or per cell from the client)
- **The Floor** (`getTimetable`, `lib/timetable.ts`): one merged-availability
  call per class series (6 at a time), `unstable_cache` 60 s, tag
  `availability`. **Full inference** as in Tensile: a weekly pattern slot
  missing between today and the last start the API returned is `full,
  inferred`. Melbourne local-time keys, so the April/October DST switches
  don't create twins (tests). Events come from `getEventOccurrences` (60 days).
- **Slot rack** (`/api/ranges` → `getServiceRanges`): one merged call per
  (service variant, coach?, site?) across the whole horizon, cached 60 s with
  tag `availability`. `lib/rack.ts` derives days and start times on the client
  (local-time grid, `startStep` per service, the whole length must fit).
- `revalidateTag('availability')` runs after book, cart-item removal, cancel
  and reschedule (the API routes).

### Booking, the Bar and checkout
- Everything goes through `useLoadBar()` (`hooks/use-load-bar.ts`): `POST
  /api/book` per session (UTC slot, `staffMemberId`, `locationId`,
  `numberOfAttendees`, `addOns`, `people` for partner PT →
  `customAttributes.people = "2"`), then the Bar drawer opens.
- **The Bar** (`lib/bar.ts`, `components/bar/*`): one plate per cart item
  coloured by discipline; the scale shows `siteConfig.blockThresholds`
  (A$100 → 10%, A$250 → 15%: the store's automatic minimum-purchase
  discounts). **The total and each offer come from the cart**; thresholds only
  drive the "Add $12 more for Loaded" copy. The API's `subtotal` (cart and order)
  is already net of offers, so the "Sessions & extras" gross is rebuilt from the
  lines' `originalSubtotal` with `grossSubtotal()`, and a session's price is
  `linePrice()` (the session plus its add-ons after offers), on the Bar and the
  order page alike.
- **Discounts never combine**: per line the biggest wins (First rep 25% on
  classes, first order; Midday shift 20% on classes starting Mon–Fri
  11:00–14:30; Block 10/15%; code `METTLE10`). An outranked code shows as
  "a better offer already applies" (`lib/discount-state.ts`).
- **Training Blocks** (`/blocks`, `siteConfig.blocks`): recipes of class lines
  (picked from the next 14 days of the Floor) and service lines (picked in a
  mini rack), booked in one order with `useLoadBar`.
- **Checkout** (`/checkout`): the Bar across the top, then sets 01 You, 02
  Clearance (the required PAR-Q checkbox + questions; answers sent as
  `{questionId, question, answer}`), 03 Pay. Routing is on the provider's
  `checkoutMode` (`lib/checkout-outcome.ts`): `internal` mounts Stripe;
  `manual` (desk, bank transfer, invoice) and `none` (free First Round)
  submit right after start. Stripe's publishable key comes only from
  checkout start (`paymentData.publishableKey`). Checkout 409/402 codes
  (`CART_ALREADY_CHECKED_OUT`, `CART_EXPIRED`, `CHECKOUT_IN_PROGRESS`,
  `PAYMENT_NOT_AUTHORIZED`) are handled in `contexts/checkout-context.tsx`.
- **Booking status**: a booking is waiting only when `status === 'pending'`
  with a `pendingReason` (payment or the club's approval); pending with no
  reason is confirmed (a background job is about to confirm it). Pending with
  no order (`orderLineItem === null`) is a cart hold and stays off the log.
- **Thank-you** (`/thank-you`): the race bib + heat sheet (calendar links), the
  pay slip for manual payments (submit's `paymentInstructions`, handed over in
  sessionStorage; after a reload it points to the email),
  before you come, getting there, same time next week. Without a session it
  asks for a sign-in code.
- **Account** (`/account`): the Training log (up next with Join/Manage, plate
  stack, log by week); `/account/appointments/[id]` moves (same coach and
  site, `ReschedulePicker`) or cancels; orders and settings.
- **Memberships** are a preview only ("Launching 2027"): no sign-up form; the
  CTA is the free First Round.

### URLs
- Floor: `lib/floor-url.ts` `floorHref({ day, site, discipline, class, coach,
  max, occ })`; `s=<seriesSlug>@<startISO>` opens a session panel.
- Rack pages: `/coaching|/recovery|/lab?service=<key>&coach=<staff-slug>#rack`.
- `/preview/bib` and `/preview/log` render fixtures (dev, or `METTLE_PREVIEW=1`).

### Times
Always Melbourne: everything renders in `siteConfig.timezone` with `lib/when.ts`
(24 h, `en-AU`), on the server and in the browser.

### Auth
Passwordless only: `/login` (email → 6-digit code) and `/link/[token]` magic
links. The middleware refreshes tokens and protects `/account/*`.

### Gotchas
- The SDK runs with `throwOnError: true`; routes pass errors through `handleApiError`.
- Next 15 `params`/`searchParams` are Promises.
- Media lives in `public/images/*` and `public/videos/hero.mp4` (paths in
  `siteConfig.media` and `siteConfig.sites[*].images`); `SafeImage` hides a
  missing file and the rubber placeholder shows. `images.unoptimized: true`.
- Quote bracketed paths in shell commands.

## Verifying changes

- `npm run typecheck`, `npm run lint` and `npm test` (vitest: timetable,
  catalog, floor, rack, bar, log, guards) must pass.
- `npm run build` must pass before release. Don't `next build` while a
  `next dev` runs in this folder (shared `.next`); build in a copy.
- Smoke test against a seeded `boutique_gym` store: the Floor shows today's
  lanes with places and some Full blocks pointing to "next with space"; a class
  and a 60-min PT load onto the Bar; checkout with pay-at-the-desk lands on the
  bib; the log shows the sessions and moves one.
