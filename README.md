# METTLE — Next.js Boutique Gym Template

A production-ready booking website for a boutique gym, boxing club or strength studio. Built with **Next.js 15**, **Tailwind CSS v4** and the **Opencals Storefront SDK**.

**[View Live Demo →](https://template-mettle.vercel.app)**

![METTLE in the Engine House: a chalky hand holds a phone with the day's classes in plate colours, and the homepage on a tablet at the front desk behind it](docs/cover.png)

Rubber flooring and chalk, calibrated bumper-plate colours as the language of the whole site, and LED interval-timer readouts. METTLE is a strength, fight and recovery club in **Melbourne** (AUD, `Australia/Melbourne`): the Engine House in Collingwood, the Yard in Cremorne and Mettle Remote online, with twelve coaches in three tiers. It has a full storefront: **the Floor**, every class of the day on one clock; personal training at 30, 60 or 90 minutes; partner sessions, padwork and ring hire; a contrast suite, infrared suites and open floor; a testing lab; dated events; **Training Blocks** that unlock real discounts as you load the bar; a race-bib confirmation; and a training log. MIT licensed: clone it, rebrand it, ship it.

---

## Get Started in 3 Steps

### 1. Create an Opencals account

Sign up at **[app.opencals.com](https://app.opencals.com)** and create a **Dev Store** in **Australia** (so prices are in AUD). When it asks for a dataset, choose the **Boutique Gym** preset (seed dataset `boutique_gym`). It seeds your store with:

- the two sites and Mettle Remote, and twelve coaches;
- the weekly timetable, with one variant per class × site × coach;
- personal training in three tiers, partner PT, padwork, ring hire, semi-private strength;
- the contrast suite, infrared suites, open floor, and the Lab tests including the free First Round;
- four dated events, the add-ons, and the checkout questions with the PAR-Q waiver;
- the discounts (First rep, Midday shift, the two Training Block thresholds and `METTLE10`);
- sample bookings, so some classes are already full.

### 2. Get your API key

In the Opencals dashboard, go to **User Account Settings** and generate a **private storefront key** (`spk_`). The template calls the API from its server, so the key stays secret, and it forwards each visitor's IP (`nextBuyerIp` in `lib/opencals.ts`) so visitors get their own rate limits. A public key (`sfk_`) also works, but then all visitors share your server's limits.

### 3. Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fletsopencals%2Ftemplate-mettle&env=OPENCALS_API_KEY,AUTH_SECRET&envDescription=API%20key%20from%20your%20Opencals%20dashboard%20and%20a%20random%20secret%20for%20auth&project-name=mettle&repository-name=template-mettle)

| Variable | Value |
|----------|-------|
| `OPENCALS_API_KEY` | Your private storefront key (starts with `spk_`) |
| `AUTH_SECRET` | Any random string, used for session encryption |
| `NEXT_PUBLIC_SITE_URL` | *(optional)* Your domain, for the sitemap, canonical URLs and Open Graph |

That's it. Card payments use the Stripe account connected to your store; the key comes from the checkout API, so there's no Stripe variable to set.

---

## The Site

![Homepage — "Built with mettle", the hero video and the live board of the next classes with places left](docs/homepage-hero.png)

![Coaches — twelve coaches in three tiers, each with their plate colours](docs/coaches.png)

![A coach — Tane Wiremu, Head of Fight, with his next classes](docs/coach.png)

![The Lab — InBody, movement screen, VO2 max, nutrition and the free First Round intro](docs/lab.png)

![Events — dated workshops: deadlift clinic, fight night prep, hybrid race day](docs/events.png)

![Memberships — Iron, Steel and Mettle, launching 2027, with the founding-member offer](docs/memberships.png)

---

## What's Included

### The Floor (`/schedule`)

The whole day on one horizontal clock, from 06:00 to 22:00, with **one lane per discipline**: strength, fight, conditioning, mobility, semi-private coaching and events. Each session is a block in its discipline's plate colour, placed by start time and as wide as it is long. It shows the coach, the site and a places-left fill. A **Full** session is hatched black and points to the next one with space. The day row sits right above the board, and the filters cover site, discipline, coach and intensity. Everything lives in the URL, so `/schedule?s=<series>@<start>` opens a session directly.

Tapping a session opens its **panel, docked under the board**. It shows the coach, the site, the intensity, any entry requirement, the extras, places for friends, the price with any Midday-shift offer, and **Load the bar**. On phones the lanes become an hour-by-hour list and the panel is a bottom sheet.

![The Floor — Monday on one clock, a lane per discipline, places left on every session and a Full session hatched](docs/schedule.png)

![A session panel — Muay Thai with the coach, extras, places and Load the bar](docs/session.png)

### The Slot Rack (`/coaching`, `/recovery`, `/lab`)

One-to-ones, recovery and testing all book the same way:

1. Pick the service.
2. Pick the option (PT tier, padwork length, suite, site).
3. Pick the coach (or the first free one), the site, and the length (30/60/90 for PT).
4. Pick the day row and a plain time slot under it.

The summary with the live price and **Load the bar** sits beside the slots on desktop and is pinned to the bottom on phones. Free windows load once per service, coach and site, and every day and start time is worked out from them in the browser.

![The slot rack — an hour of personal training with any head coach at the Yard, Monday 17:00](docs/coaching.png)

![Recovery — the contrast suite with places left on every slot](docs/recovery.png)

### The Bar and Training Blocks

The cart is a **barbell**. Every session you book racks a plate in its discipline's colour, and the scale under the bar marks the **Training Block thresholds**: load A$150 in one order for 10% off, A$300 for 15%. These are real automatic minimum-purchase discounts in the store, and the totals always come from the cart. **`/blocks`** has four curated blocks (Fight Week, Strong Start, Engine Block, Recovery Ritual). You fill each line from the Floor or the rack, then book the whole block in one order.

![The Bar — three classes racked as plates, the A$150 and A$300 thresholds, and the first-order offer](docs/bar.png)

![Training Blocks — Fight Week, Strong Start, Engine Block and Recovery Ritual, filled from the Floor](docs/blocks.png)

### Checkout, the Bib and the Training Log

- **Checkout** puts the Bar across the top, then three sets:
  - **01 You**: your details;
  - **02 Clearance**: the PAR-Q waiver, injuries, fight experience and your goal;
  - **03 Pay**: Stripe or pay at the desk. The free First Round needs no payment.

  Offers never stack: each session gets its biggest one (25% off a first order, 20% Midday shift, the block discount or `METTLE10`).
- The confirmation is a **race bib**, pinned at the corners: the booking number, your name, a plate stripe per session. Under it are the heat sheet with calendar links, what to bring, how to get to each site, and "same time next week?".
- **`/account`** is the **Training log**:
  - up next, with Join for Remote sessions, Move and Cancel up to 12 hours before;
  - a stack of plates for every finished session, by discipline;
  - every session written up week by week.

![Checkout — the Bar across the top, then You, Clearance and Pay](docs/checkout.png)

![The race bib — booking 4127 for Mia Kovač, the heat sheet with calendar links, what to bring and getting there](docs/thank-you.png)

![The training log — up next with move and cancel, the plate stack, and every session week by week](docs/account.png)

<p align="center">
  <img src="docs/mobile-floor.png" width="260" alt="The Floor on a phone, hour by hour" />
  <img src="docs/mobile-thank-you.png" width="260" alt="The race bib on a phone" />
  <img src="docs/mobile-home.png" width="260" alt="The homepage on a phone" />
</p>

  Orders and settings sit alongside it.

### Coaches, Sites, Disciplines, Events, Memberships

- **`/coaches`** and **`/coaches/[slug]`**: tiers, bios, credentials, their next classes and "Book 1:1".
- **`/sites/[slug]`**: photos, facilities, hours, transit, and the classes and coaches there.
- **`/disciplines/[slug]`**: each class with its length, intensity, level and price, plus the next sessions.
- **`/events`**: dated clinics laid out as a fight card.
- **`/memberships`**: a clearly labelled **"Launching 2027"** preview of three tiers. Nothing is for sale; the call to action is the free First Round and Training Blocks.

### Passwordless accounts

Customers sign in with a 6-digit email code or a magic link (`/link/[token]`). Set **Storefront Base URL** in the Opencals dashboard (Settings → API) to your deployed URL, so emailed links come back here.

### SEO

Per-page metadata, Open Graph, `ExerciseGym` structured data per site, robots.txt and sitemap.xml.

---

## The Gym Model

METTLE only uses existing Opencals features. The pattern for a gym:

- **Disciplines are collections**, and each one has a plate colour in `lib/site-config.ts`.
- **One product group per class, one variant per class × site × coach.** `barbell-club-collingwood-jo` is Barbell Club at the Engine House with Jo. Each variant has its own weekly schedule, one location and one staff member, and `maxAttendees` = places.
- **Full classes.** The availability API drops a slot once it's full. Classes repeat weekly, so the template learns each series' pattern and shows a missing week as **Full** (`lib/timetable.ts`, with tests).
- **Personal training** is one product per tier with a 30-minute base and `allowCustomDuration` up to 90. The price scales per 30 minutes, and the Staff rule stops a coach being double-booked across classes and PT.
- **Recovery** products have no staff and use the Self rule: a 6-place contrast suite, two private infrared suites (40 or 80 minutes), and open floor at each site.
- **Partner PT** is one booking for two, sent as the custom attribute `people = "2"`.
- **Training Blocks** are automatic discounts with a minimum purchase amount. The template only shows the progress toward them.

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v4 |
| Fonts | next/font: Big Shoulders, Albert Sans, Chivo Mono |
| Motion | CSS only (rack-in plates, LED tick, clock sweep) |
| Data | SWR (client) + React Server Components |
| Payments | Stripe Elements |
| Auth | NextAuth.js v5 |
| Tests | Vitest |
| API | Opencals Storefront SDK |

---

## Local Development

```bash
git clone https://github.com/letsopencals/template-mettle.git
cd template-mettle
npm install
cp .env.example .env.local   # set OPENCALS_API_KEY and AUTH_SECRET
npm run dev
```

Checks: `npm run typecheck`, `npm run lint` and `npm test`. The tests cover the timetable and Full inference, the Floor layout, the slot rack, the Bar and the log. `/preview/bib` and `/preview/log` show the post-booking screens with sample data in development.

---

## Customization

- **`lib/site-config.ts`** holds everything the API has no field for:
  - the name, contact details and site copy;
  - discipline plates and copy, class intensity and levels, what to bring;
  - service copy and PT lengths, coach bios and tiers;
  - the Training Blocks and their thresholds, and the memberships preview.
- **The store holds the bookable data**: classes, prices, capacities, coaches, sites, availability, add-ons, questions and discounts.
- **Theme**: the tokens are in `app/globals.css`, and the design contract is in **`DESIGN.md`**.
- **Imagery**: class photos, coach portraits and the logo come from your store. Site photos, discipline photos and the hero video live in `public/` (paths in `siteConfig.media`). A missing file falls back to the rubber placeholder.

---

## Other templates

| Template | Industry | Demo |
|---|---|---|
| [HAAR](https://github.com/letsopencals/template-haar) | Hair salon | [template-haar.vercel.app](https://template-haar.vercel.app) |
| [Frisør](https://github.com/letsopencals/template-frisor) | Barbershop | [template-frisor-sage.vercel.app](https://template-frisor-sage.vercel.app) |
| [Clear Care](https://github.com/letsopencals/template-clarity) | Medical clinic | [template-clarity.vercel.app](https://template-clarity.vercel.app) |
| [VOLT](https://github.com/letsopencals/template-volt) | Padel & squash clubs | [template-volt.vercel.app](https://template-volt.vercel.app) |
| [NOIR Drive](https://github.com/letsopencals/template-noir) | Car rental | [template-noir.vercel.app](https://template-noir.vercel.app) |
| [Fluently](https://github.com/letsopencals/template-fluently) | Language school | [template-fluently.vercel.app](https://template-fluently.vercel.app) |
| [Tensile](https://github.com/letsopencals/template-reformer) | Reformer Pilates | [template-reformer.vercel.app](https://template-reformer.vercel.app) |
| [Alba Dental](https://github.com/letsopencals/template-alba) | Dental clinic | [template-alba.vercel.app](https://template-alba.vercel.app) |
| [Gable](https://github.com/letsopencals/template-gable) | Coworking | [template-gable.vercel.app](https://template-gable.vercel.app) |

---

## License

MIT
