# METTLE · design contract ("Calibrated")

METTLE is a strength, fight and recovery club in Melbourne: the Engine House (a 1920s cable-tram
engine house on Smith St, Collingwood), the Yard (turf, sled track and a rooftop recovery deck in
Cremorne) and Mettle Remote (online). The design comes from what hangs on a gym wall, not from a
booking-software kit. It uses **calibrated bumper plates**, the **barbell**, the **interval timer**
over the ring, **chalk on rubber flooring**, the coach's **whiteboard** and the **race bib**.

## 1. Concept in one line

Every bookable thing is a plate. Its colour is its discipline (the IWF plate colours), the cart is
a bar you load, the timetable is the floor plotted against the clock, and your confirmation is the
bib you pin on.

## 2. Tokens

| Token | Hex | Use |
|---|---|---|
| `--rubber` | `#121212` | Dark slabs: header, hero, the Floor board, footer |
| `--rubber-2` | `#1C1C1B` | Raised surfaces on rubber |
| `--rubber-line` | `#2E2E2C` | Rules on rubber |
| `--chalk` | `#F2EFE8` | Light slabs, text on rubber |
| `--chalk-2` | `#E6E1D6` | Raised surfaces on chalk |
| `--ink` | `#121212` | Text on chalk |
| `--steel` | `#8A9399` | Secondary text, the Lab plate |
| plate `red` | `#D7262E` | Strength (25 kg plate) |
| plate `blue` | `#1F5FBF` | Fight (20 kg) |
| plate `yellow` | `#F2C230` | Conditioning (15 kg) |
| plate `green` | `#1E9E5A` | Mobility (10 kg) |
| plate `white` | `#F7F7F2` + ink outline | Recovery (5 kg) |
| plate `black` | `#0A0A0A` + chalk outline | Coaching (training plate) |
| plate `steel` | `#8A9399` | Lab and events |
| `--led-red` / `--led-green` | `#FF3B2F` / `#38E07B` | The interval-timer LED readouts only |

The plate colours are **category only**. Status (places left, Full) uses the LED colours and a fill
level, never a plate colour.

## 3. Type

- **Big Shoulders Display** (700–900, uppercase, tight leading) for display: headings, the lockup, the
  big numbers on the bib.
- **Albert Sans** (400–700) for all running text and UI labels.
- **Chivo Mono** (400–600) for numbers and data: times, prices, places left, the LED readouts, the log.
- None of these fonts is used by another template or demo (see the ban list in
  `templates/_skills/build-opencals-template/references/uniqueness.md`).

## 4. Shapes and motifs (all hand-built in SVG/CSS, in `components/brand/*`)

- **Plate** (`plate.tsx`): a bumper plate seen edge-on, a rounded vertical slab with a steel hub
  line. It marks a discipline in chips, on cards and in the timetable lanes.
- **Calibration strip** (`calibration-strip.tsx`): a thin band of the seven plate colours in
  stack order. It's the only divider between slabs.
- **The Bar** (`components/bar/*`): a barbell in SVG (sleeves, collars, a knurled shaft). Each cart
  item slides a plate onto the sleeve, and the scale under it marks the Training Block thresholds
  (A$150, A$300) as collars.
- **LED readout** (`led.tsx`): Chivo Mono on rubber with a soft glow and a blinking colon, used for
  "Next on the floor" in the header, the countdowns and the hero board.
- **Bib** (`components/bib/*`): the confirmation artifact. A white bib with four safety pins at the
  corners, the race number (the order number), a plate stripe per session and a fold line.
- **Training log** (`components/log/*`): a ruled logbook with column heads, plus a stack of plates
  showing completed sessions per discipline.
- Corners are square (2 px max radius). Buttons are flat slabs with a 2 px bottom edge ("plate
  lip"). No pills, no shadows except the LED glow, no gradients except the hero scrim.

## 5. Motion (CSS only, no motion library, no smooth scroll)

- **Rack-in:** a plate slides onto the bar from the right with a short settle (280 ms,
  `cubic-bezier(.2,.9,.3,1.2)`).
- **LED tick:** the colon blinks once a second, and changed digits flash.
- **Fill:** places-left meters fill from left to right once, on mount.
- **Clock sweep:** a red "now" line sweeps across the Floor board to the current time on load.
- Everything respects `prefers-reduced-motion` (no movement, instant states).

## 6. Navigation and page rhythm

- **Header:** a standard top bar on rubber with the wordmark, Schedule · Coaching · Recovery · Lab ·
  Blocks · Memberships, the LED "Next on the floor" readout (desktop), Account, and **The Bar**
  button with a mini plate stack and an item count. On mobile: the wordmark, the Bar button and a
  menu button that opens a full-height sheet. There's no bottom nav.
- **Rhythm:** pages alternate full-bleed **rubber** and **chalk slabs**, with a calibration strip
  at each change. Section heads are left-aligned: a mono index (`01 / FLOOR`) above a tall display
  heading, with the copy in a right-hand column. No centred eyebrow-pill headings and no three-card
  grids.

## 7. Booking interactions

- **Classes, "The Floor" (`/schedule`):** one day at a time. A row of day buttons sits on top, and
  under it a **horizontal time axis** (06:00–21:00) with one **lane per discipline**. Each session is
  a block placed by its start time, with its width set by the duration, coloured by its plate, and
  holding the time, name, coach and a places-left fill. A Full session shows hatched black with
  "Next with space". Clicking a block opens the **session panel docked under the board**: coach,
  site, intensity, add-ons, the price and the **Load the bar** button, all visible without scrolling.
  Filters for site, coach and intensity sit in one row above the days. Below 768 px the lanes
  become an hour-grouped list of the same blocks, and the panel opens as a bottom sheet.
- **Coaching / Recovery / Lab (`/coaching`, `/recovery`, `/lab`): the "Slot rack".** You pick the
  option (coach, length 30/60/90, suite, site) as plain segmented buttons. The day buttons sit
  directly above the time slots, which are plain tappable buttons. The price, the add-ons and
  **Load the bar** sit in a panel next to the slots on desktop, and in a pinned footer on mobile.
- **Training Blocks (`/blocks`):** a recipe of sessions ("3 × Fight + 1 × Contrast Suite"). Each
  line is a slot you fill from the next 14 days. The Bar on the page fills as you go, and **Load the
  block** adds every session to one cart, so the threshold discount from the API applies.
- **The Bar** (drawer from the header, and across the top of checkout): plates per item, item lines
  with remove, the totals and discounts exactly as the cart returns them, and the progress to the
  next threshold.

## 8. Checkout, confirmation and account

- **Checkout (`/checkout`):** one page. The Bar summary runs across the top (not a sticky side
  card). Below it, three numbered "sets" stack vertically: **01 You**, **02 Clearance** (PAR-Q
  waiver and questions) and **03 Pay**. A done set collapses to a one-line receipt with Edit. The
  pay button is always the last thing in the active set.
- **Thank-you (`/thank-you`):** **the Bib**: the race number, your name, a plate stripe per session,
  "Before you come" (what to bring, wraps, arrive 10 min early), getting there for each site, add to
  calendar, and "Build your block" / "Same time next week".
- **Account (`/account`):** **the Training log**: next up (with Join for Remote, Move, Cancel), the
  plate stack of completed sessions by discipline, and the log by week. The order history and the
  settings sit in the same ruled-log style.

## 9. How this differs from every other template

| | Others | METTLE |
|---|---|---|
| Navigation model | Tensile, Clarity and HAAR: light editorial headers; Frisør: a classic paper header; Gable: a title-block header | A rubber gym bar with a **live LED "next on the floor" readout** and a cart that is a **barbell** |
| Section rhythm | eyebrow → H2 → three-card grids (most); Gable: numbered drawing sheets; Alba: a side chart rail | Full-bleed **rubber/chalk slabs** split by the **calibration strip**, a mono index and a left-aligned display head |
| Timetable | **Tensile: a week grid of day columns with bed pips and a slide-over class sheet.** VOLT: a hall map. Gable: a search-results planner | **One day, a horizontal time axis, lanes per discipline**; sessions as plate blocks sized by duration; the panel docks *under* the board, not a slide-over |
| Booking (1:1) | Tensile: privates wizard; Alba: chair-time track; Frisør: 3-step chair panel | The **Slot rack**: segmented options, the day row directly above plain slots, the Bar panel beside them |
| Upsell | Discount banners | **Loading the bar**: plates rack on, threshold collars at A$150/A$300, Training Blocks |
| Checkout | Step accordion + sticky summary (HAAR, Clarity, Tensile), Day sheet (Gable) | The Bar across the top + three stacked **sets** that collapse to receipts |
| Confirmation | Tickets, check-in pass (Tensile), flippable card (Alba), Day-sheet printout (Gable) | A **race bib** with safety pins and plate stripes |
| Account | Ticket next booking, week board (Tensile), Week plan (Gable), recall ring (Alba) | A **Training log** with a ruled log and a plate stack |
| Type | Archivo/Plex (Tensile), Bricolage/Onest/Azeret (Gable), Instrument Serif/Hanken (Alba)… | Big Shoulders Display / Albert Sans / Chivo Mono |
| Motion | Shared kit: fade-up, parallax, marquee, Lenis | Rack-in plates, the LED tick, the clock sweep, meter fill. No motion library |

## 10. Usability rules (binding)

The top header is always normal. Time slots are plain buttons with the day row right above them.
The total and the primary action are always in view while booking. Nothing that looks like a
control is decorative. The layout works at 390 px.
