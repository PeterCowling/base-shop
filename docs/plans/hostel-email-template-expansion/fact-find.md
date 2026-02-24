---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Operations
Workstream: Operations
Created: 2026-02-22
Last-updated: 2026-02-22
Feature-Slug: hostel-email-template-expansion
Execution-Track: business-artifact
Deliverable-Family: message
Deliverable-Channel: email
Deliverable-Subtype: none
Deliverable-Type: email-message
Startup-Deliverable-Alias: none
Primary-Execution-Skill: draft-email
Supporting-Skills: ops-inbox
Related-Plan: docs/plans/hostel-email-template-expansion/plan.md
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
---

# Hostel Email Template Expansion — Fact-Find Brief

## Scope

### Summary

The hostel currently has 53 email reply templates (T01–T53) across 20 categories. The repo contains a far richer knowledge base than the templates reflect: 168 guide JSON files, structured route schemas, a 28-item FAQ, full menus, house rules, terms, room pricing, and policy guides — all at high operational granularity (named clubs, step-counts, prices, durations, operators, phone numbers, conditional edge cases). This fact-find identifies **~130 distinct template opportunities** derivable from repo content alone, before any Gmail mining. The target is to approximately triple the template library to ~160–180 templates.

### Goals

- Map every guest scenario where a specific, accurate template response is possible from repo content
- Produce a prioritised, batched gap list ready for plan tasks
- Define the authoring process: repo source → template draft → lint validation → append to `email-templates.json`
- Ensure schema compliance (T54+ sequential IDs, `{{SLOT:GREETING}}`, `\r\n` line endings)

### Non-goals

- Changes to template delivery, inbox agent, ranking, or calibration logic
- Rewriting or merging existing 53 templates
- Translation to other languages
- Gmail mining (Phase 3 — follow-on after repo-first authoring)

### Constraints & Assumptions

- Constraints:
  - Template IDs sequential from T54 (current max: T53)
  - Schema: `{ subject, body, category, template_id, reference_scope, canonical_reference_url, normalization_batch }`
  - `reference_scope` enum: `reference_required` | `reference_optional_excluded` | `reference_optional_included`
  - Body: `{{SLOT:GREETING}}\r\n\r\n<body>` with `\r\n` line endings
  - All factual claims anchored to repo source — no invented facts
  - `normalization_batch: "E"` for this expansion wave (distinguishes from earlier A–D batches)
- Assumptions:
  - Guide URL pattern: `https://hostel-positano.com/en/guides/<slug>`
  - Hostel address: Via Guglielmo Marconi 358, 84017 Positano (Skylar SRL)
  - Hostel email: hostelpositano@gmail.com
  - Taxi WhatsApp confirmed in ferryDockToBrikette guide: +39 379 125 6222

---

## Evidence Audit (Current State)

### Key Modules / Files

- `packages/mcp-server/data/email-templates.json` — 53 templates T01–T53, the authoritative template store
- `apps/brikette/src/locales/en/faq.json` — 28 Q&A; definitive on hours, policies, distances, facilities
- `apps/brikette/src/locales/en/houseRulesPage.json` — 14-section legal house rules; quiet hours 23:45–08:00; late checkout €40
- `apps/brikette/src/locales/en/breakfastMenuPage.json` — Full breakfast menu (08:00–10:30)
- `apps/brikette/src/locales/en/barMenuPage.json` — Full bar menu: spritz, cocktails, wine, beer, spirits, gelato
- `apps/brikette/src/locales/en/termsPage.json` — Full booking terms effective 2026-01-09; Skylar SRL operator
- `apps/brikette/src/locales/en/roomsPage.json` — All 10 room types with prices (non-ref/flexible)
- `apps/brikette/src/locales/en/guides/content/` — 168 guide JSON files (read in full for this fact-find)
- `apps/brikette/src/locales/en/how-to-get-here/routes/` — 25 structured route schemas

### Key Factual Evidence from Guide Content

**Prices confirmed in guide JSON:**
- Fornillo clubs: from ~€15 (Pupetto); range €0–€50
- Spiaggia Grande L'Incanto: ~€25–€35/person; La Scogliera: ~€100–€400+
- Arienzo packages (2 people incl. boat): €70–€90; front row €120–€200; dishes €18–€28; cocktails €12–€15
- Da Adolfo (Laurito): loungers + shuttle ~€50–€70 for two; mains €18–€30
- Villa Tre Ville (Laurito): €180–€220 for two with concierge; cocktails €12–€15
- La Gavitella: €70–€100 for two; One Fire: €100–€180 + shuttle €10–€20 each way
- Marina di Praia Beach Club: €25–€35/day; kayak ~€20/hr for two; dinner €16–€28
- Interno bus (orange "Interno Positano"): €1.50 from Bar Internazionale
- SITA bus: Amalfi €2.50, Sorrento €2.50, Salerno €4.00, 24-hr pass €8.00
- Ferry Positano–Amalfi: €10–€18 (bus plan B; passes €10 COSTIERASITA 24hr)
- Ferry Positano–Capri: €18–€25 one-way, 30–60 min; Sorrento ferry 45–60 min
- Curreri airport shuttle: €10 one-way (2026); SITA Sorrento–Positano: €2.60
- Nocelle shuttle: €1.80–€2.40 per leg
- Pompeii: SITA to Sorrento ~€2.50–€3.00; Circumvesuviana ~€3.00–€4.00; entry €16–€18
- Capri: Monte Solaro chairlift €16–€18 return; Blue Grotto €14–€18 + rowboat €15–€20
- Taxi dock to hostel: €25–€35 (WhatsApp +39 379 125 6222)
- Porter: €15/bag standard (≤20kg), €18–€20 oversized, cash only, 30–45 min delivery
- Late checkout: €40 (until 12:00, subject to availability)
- Damage labour rates: Director €50/h, Manager €35/h, Staff €25/h
- Cancellation admin fee: €5 per booking (bookingBasics/terms; note: changingCancelling guide states 15% — inconsistency must be resolved before writing template)
- Safeguarding hold: one night per guest at check-in (preauth or cash; separate from €10 keycard deposit)

**Named operators and locations confirmed:**
- Bar Internazionale (Chiesa Nuova): SITA ticket sales; bus stop outside; opens ~06:30am (earlier than tabacchi)
- Ferry operators: Lucibello, Travelmar, NLG, Alilauro, Positano Jet
- Capri funicular: Marina Grande €2 (15 min; queue 30–45 min 10am–2pm peak)
- Circumvesuviana station: Sorrento, connects to Naples; exit "Pompei Scavi – Villa dei Misteri"
- Ristorante Jerla (Bomerano): landmark for Path of the Gods bus stop
- Farmacia Positano: Via Pasitea (~450m from hostel)
- Medical clinic: Praiano (~3km by bus)
- Emergency: 112 / 118 (Italian emergency services)
- Named beach clubs: Pupetto, Da Ferdinando, Fratelli Grassi, La Marinella (Fornillo); L'Incanto, La Scogliera (Spiaggia Grande); Arienzo Beach Club; Da Adolfo, Villa Tre Ville (Laurito); La Gavitella, One Fire (Praiano Gavitella); Marina di Praia Beach Club (Marina di Praia)
- Named restaurants: C'era Una Volta (across road), Il Grottino Azzurro (160m), Da Costantino (300m uphill), Da Gabrisa, Next2, Luna at Villa Magia, Da Vincenzo 1958, La Tagliata (Montepertuso, free shuttle), Il Ritrovo (Montepertuso)

**Distances and durations confirmed:**
- Hostel to Spiaggia Grande on foot: 20–25 min
- Hostel to Fornillo via shortcut: 15–20 min; promenade Spiaggia Grande → Fornillo: ~5 min
- Arienzo stairs: ~300 steps; 15–25 min up
- Gavitella stairs from Piazza San Gennaro: ~400 steps; 10–15 min down
- Path of the Gods: ~6km, ~200m elevation, 2.5–3 hours hiking
- Santa Maria del Castello: 670m altitude, views within 15 min of hostel departure
- Full summit hike: 6–7 hours round trip
- Pompeii site: 5–8km walking; 3–4 hours minimum; each-way travel 1.5–2 hours
- Ferry Positano–Amalfi: 25–40 min; Capri: 30–60 min; Sorrento: 45–60 min
- SITA Positano–Sorrento: 50–60 min; to Naples Airport: 1.5–2 hours total
- Interno bus: every ~30 min 08:00 to midnight
- Last SITA to Amalfi: ~10:30pm; to Sorrento: ~11pm
- Hot water: 07:00–10:30 and 17:00–22:30 (not 24/7)
- Porter delivery: 30–45 min after handover at dock

**Identified inconsistency in source material:**
- Visitor hours: houseRulesPage says 23:00; security guide and bookingBasics say 20:00 — operator must confirm canonical figure before template T32 (Visitor Policy) is updated or new templates reference this
- Cancellation fee: changingCancelling guide says 15% of booking price; bookingBasics and termsPage say €5 flat — operator must confirm before cancellation templates are written

### Data & Contracts

- Types/schemas/events: Template object: `{ subject, body, category, template_id, reference_scope, canonical_reference_url, normalization_batch }`
- Persistence: Single flat JSON array in `packages/mcp-server/data/email-templates.json`; lint script at `packages/mcp-server/scripts/lint-templates.ts` must pass after additions
- API/contracts: `mcp__brikette__draft_generate` and `mcp__brikette__draft_interpret` consume templates by subject/trigger matching

### Delivery & Channel Landscape

- Audience: Pre-arrival, in-stay, and post-stay guests
- Channel: Plain text email; `\r\n` line endings; angle-bracket URL format `<https://...>`
- Compliance: All prices/hours must match repo content at time of authoring; flag time-sensitive facts for periodic review

---

## Full Gap Analysis

### Existing 53-Template Coverage (summary)

| Category | Templates | Core coverage |
|---|---|---|
| check-in | 6 | Early arrival, access codes, ETA, out-of-hours, deposit/keycard, city tax |
| booking-issues | 6 | Cancelled prepaid, availability, capacity, overbooking, private vs dorm, group |
| prepayment | 5 | Octorate/Hostelworld attempts 1–3, success, cancelled post-3rd |
| cancellation | 4 | Non-refundable, no-show, medical hardship, confirmation |
| booking-changes | 3 | Date change, room type, extension |
| luggage | 3 | Before check-in, after checkout, porter service |
| payment | 3 | Card change, dispute, receipt |
| policies | 3 | Alcohol, age restriction, visitor/daytime |
| transportation | 3 | General getting here, bus arrival, parking |
| activities | 2 | Path of the Gods routes, things-to-do general |
| breakfast | 2 | Eligibility/hours, not included (OTA) |
| checkout | 2 | Reminder, late checkout |
| faq | 2 | Facilities overview, bar/terrace hours |
| house-rules | 2 | Quiet hours, visitor policy |
| access | 2 | Inner/outer door codes |
| employment | 1 | Job application |
| general | 1 | Agreement received |
| lost-found | 1 | Lost item report received |
| promotions | 1 | Coupon code redemption |
| wifi | 1 | WiFi info |

---

### CLUSTER A — Beaches (~28 templates)

All beach content read from guide JSON in full. Each beach warrants multiple templates given the operational specificity available.

#### A1 — Spiaggia Grande (Main Beach) — ~4 templates

| Gap | Subject | Repo anchor |
|---|---|---|
| A1a | Getting to Main Beach — Walk vs Bus | `positanoMainBeachWalkDown`, `positanoMainBeachBusDown` — walk 20–25 min down Via Pasitea; bus €1.50 from Bar Internazionale; alight Sponda or Piazza dei Mulini |
| A1b | Spiaggia Grande — Beach Layout and Free Sections | `positanoMainBeach` — four zones explained; free section arrives before 10:00 in high season; residents' strip off-limits; tips on waterline spots |
| A1c | Spiaggia Grande — Beach Clubs (L'Incanto and La Scogliera) | `positanoMainBeach` — L'Incanto €25–€35/person; La Scogliera €100–€400+; reservations via WhatsApp/email July–August |
| A1d | Getting Back from Main Beach (Bus) | `positanoMainBeachBusBack` — orange Interno bus from Piazza dei Mulini; validate ticket at bar before boarding |

#### A2 — Fornillo Beach — ~5 templates

| Gap | Subject | Repo anchor |
|---|---|---|
| A2a | Getting to Fornillo Beach — Two Routes | `hostelBriketteToFornilloBeach` — shortcut from hostel 15–20 min (left-hand end facing sea); promenade from Spiaggia Grande ~5 min |
| A2b | Fornillo — Free Beach Tips | `fornilloBeachGuide` — large free stretch beside Pupetto; arrive before 10:30; hidden free cove beyond La Marinella; sea urchins near edges — water shoes essential |
| A2c | Fornillo — Beach Clubs Guide | `fornilloBeachGuide` — Pupetto (from ~€15, reserve weekends by WhatsApp); Da Ferdinando (paddleboards, popular lunch); Fratelli Grassi (kayak/paddleboard rental); La Marinella (Spiaggia Grande walkway end) |
| A2d | Fornillo — Hidden Free Cove Beyond La Marinella | `fornilloBeachGuide` — quieter swim, rockier entry, sea urchins near edges, water shoes essential, occasional spare loungers |
| A2e | Getting Back from Fornillo | `fornilloBeachToBrikette` — promenade to Spiaggia Grande, then Interno bus uphill — avoids steepest staircase |

#### A3 — Arienzo Beach — ~4 templates

| Gap | Subject | Repo anchor |
|---|---|---|
| A3a | Getting to Arienzo Beach — Three Options | `hostelBriketteToArienzoBus`, `arienzoBeachClub` — shuttle boat from Spiaggia Grande (most convenient); SITA bus to Sponda then ~300 steep stairs (15–25 min up); taxi saves legs near stair entrance |
| A3b | Arienzo — Stairs Reality Check | `arienzoBeachClub` — ~300 steep uneven stairs; worst on return when wet and salty; anyone with knee pain → boat-only day; allow 15–25 min up |
| A3c | Arienzo — Packages, Lunch, and Booking | `arienzoBeachClub` — packages €70–€90 (two, incl. boat); front row/cabana €120–€200; lunch 12:30, dishes €18–€28, cocktails €12–€15; book WhatsApp 3–5 days ahead June–Sept |
| A3d | Getting Back from Arienzo | `arienzoBeachBusBack` — confirm last return boat on arrival; bus every 30–40 min (delays and full buses common); taxi via reception or digital concierge |

#### A4 — Laurito Beach — ~4 templates

| Gap | Subject | Repo anchor |
|---|---|---|
| A4a | Getting to Laurito Beach | `lauritoBeachBusDown` — shuttle boat from Spiaggia Grande (most convenient; confirm last return); SITA bus + steep stairs (most reliable if seas rough); phone signal unreliable at dock |
| A4b | Laurito — Da Adolfo Beach Club | `lauritoBeachGuide` — famous for grilled mozzarella on lemon leaves; booking difficult (reply slowly, day-of slots to returning guests); standby: arrive early at Spiaggia Grande, join water taxi; ~€50–€70 for two incl. shuttle |
| A4c | Laurito — Villa Tre Ville Beach Club | `lauritoBeachGuide` — reserve through concierge; day beds, à la carte, prosecco to chair; €180–€220 for two with towels; cocktails €12–€15 |
| A4d | Getting Back from Laurito | `lauritoBeachBusBack` — confirm last return boat early (can change); bus backup: buy tickets before leaving Positano — nowhere to buy at Laurito; taxis expensive, split with hostel guests |

#### A5 — Praiano Beaches (Gavitella + Marina di Praia) — ~5 templates

| Gap | Subject | Repo anchor |
|---|---|---|
| A5a | Getting to Gavitella Beach (Praiano) | `gavitellaBeachGuide` — SITA bus toward Amalfi, off at Piazza San Gennaro; ~400 steps down (10–15 min); west-facing = sunset magic |
| A5b | Gavitella — La Gavitella vs One Fire | `gavitellaBeachGuide` — La Gavitella: slow lunches, seafood, aperitivi €70–€100 for two; One Fire: DJ sets, high energy, €100–€180 for two |
| A5c | Getting to Marina di Praia (Praiano) | `marinaDiPraiaBeaches` — SITA bus toward Amalfi ~20 min; stone path downhill ~2 min from stop; sheltered cove, calmer water; free strip fills by 11am weekends |
| A5d | Marina di Praia — Facilities and Dining | `marinaDiPraiaBeaches` — Beach Club: €25–€35/day, kayak ~€20/hr for two; Da Armandino and Il Pirata (dinner €16–€28, book Fri–Sat); last SITA toward Positano ~21:30; taxi back €35–€45 |
| A5e | Pairing Gavitella/Marina di Praia with Fiordo di Furore | `marinaDiPraiaBeaches`, `fiordoDiFuroreBeachGuide` — treat Fiordo as short photo-and-dip stop on same bus line; Marina di Praia as main beach day |

#### A6 — Fiordo di Furore — ~3 templates

| Gap | Subject | Repo anchor |
|---|---|---|
| A6a | Getting to Fiordo di Furore by Bus | `hostelBriketteToFiordoDiFuroreBus`, `fiordoDiFuroreBeachGuide` — SITA toward Amalfi ~25 min; tell driver "Fiordo di Furore"; stop easy to miss; buy round-trip ticket before leaving Positano — nowhere to buy at fiord |
| A6b | Fiordo di Furore — What to Expect | `fiordoDiFuroreBeachGuide` — free entry; no beach clubs, no bathrooms, no reliable snack cart; treat as 60–120 min anchor stop; steep uneven stairs; arrive before late morning peak; avoid windy days |
| A6c | Fiordo di Furore — Swimming and Cliff Jumping Safety | `fiordoDiFuroreBeachGuide` — water usually clear but entry rocky and cramped; cliff jumping — only follow experienced locals on calm days, never alone, check depth first; no beginners |

#### A7 — Other Beaches — ~3 templates

| Gap | Subject | Repo anchor |
|---|---|---|
| A7a | Getting to Regina Giovanna Bath (Sorrento Day Trip) | `reginaGiovannaBath` — SITA to Sorrento, EAV bus (€1.50) to Capo di Sorrento, 1.1km walk; free entry; no facilities; water shoes and 1.5L+ water essential; taxi back €18–€22 if bus missed |
| A7b | Beach Overview — All Options at a Glance | `positanoBeaches`, `beaches` — pebble beaches (water shoes essential); arrive before 09:00 for free sections; Fornillo = cheapest chill; Spiaggia Grande = iconic; Arienzo/Laurito = late sun; Fiordo di Furore = dramatic cove |
| A7c | Beach Hopping — Multi-Beach Day Plan | `beachHoppingAmalfi` — morning Spiaggia Grande → Fornillo; midday ferry to Amalfi lunch; afternoon/evening Laurito or Arienzo; shared boat options; pre-book sunbeds July–August |

---

### CLUSTER B — Hikes and Walks (~10 templates)

#### B1 — Path of the Gods — ~3 templates (T18 exists but is general; these replace/supplement with full detail)

| Gap | Subject | Repo anchor |
|---|---|---|
| B1a | Path of the Gods — Bus Route (Bomerano to Nocelle) | `pathOfTheGodsBus` — 3 SITA tickets needed (Positano→Amalfi €2.50, Amalfi→Bomerano, Nocelle→Positano); buy at Bar Internazionale; queue: sea-view side for Amalfi-bound; landmark Ristorante Jerla at Bomerano; do NOT descend 1,700-step staircase from Nocelle |
| B1b | Path of the Gods — Ferry Route (via Amalfi) | `pathOfTheGodsFerry` — ferry €10–€16 to Amalfi (25 min); walk to bus terminal at harbour; bus to Bomerano; same trail; confirm ferries not cancelled before committing |
| B1c | Path of the Gods — Nocelle Shuttle (Easiest Option) | `pathOfTheGodsNocelle` — 2 tickets Positano→Nocelle→Positano (€1.80–€2.40 each); bus says "Montepertuso–Nocelle"; out-and-back toward Colle Serra, best viewpoints 45–60 min; avoid staircase down to Positano |

#### B2 — Other Hikes and Walks — ~7 templates

| Gap | Subject | Repo anchor |
|---|---|---|
| B2a | Sunrise Hike from the Hostel | `sunriseHike` — exit hostel, ~350m toward Sorrento; staircase uphill; woodland trail (right branch at fork, left to viewpoint); alternative: hostel terrace; start 10–15 min before sunrise with headlamp; grip shoes essential |
| B2b | Santa Maria del Castello Hike | `santaMariaDelCastelloHike` — 670m village above Positano; step-by-step 9-point directions from hostel door; views within 15 min; lookout has sudden drop-offs of several hundred metres (extreme caution); restaurant in village; start before 11am in summer |
| B2c | Top of the Mountain Hike (Monte Sant'Angelo) | `topOfTheMountainHike` — continue from Santa Maria del Castello; 6–7 hours round trip; 2L water minimum; mountain experience required; exposed ledges; avoid summer afternoons |
| B2d | Scenic Walks — Upper Village Loop | `scenicWalksPositano` — connect Chiesa Nuova and Sponda via terrace lanes; classic skyline views; lighter foot traffic; 30–60 min |
| B2e | Scenic Walks — Fornillo Coastal Path | `scenicWalksPositano` — quieter beach approach and photogenic staircases; early morning or golden hour; 30–60 min |
| B2f | Scenic Walks — Nocelle Viewpoint Stroll | `scenicWalksPositano` — bus to Nocelle, short spurs for sweeping vistas without long stair descents; 30–60 min including bus rides |
| B2g | Photography — Best Spots and Golden Hour | `instagramSpots`, `sunsetViewpoints` — sunrise: church steps, ferry pier (before 09:00); sunset: Via Cristoforo Colombo benches 45 min before; Laurito beach (steep return, headlamp needed); Chiesa Nuova terraces; Nocelle via bus; drone regulations (permits required, fines in town); tripod etiquette |

---

### CLUSTER C — Day Trips (~10 templates)

| Gap | Subject | Repo anchor |
|---|---|---|
| C01 | Capri Day Trip — Full Guide | `capriDayTrip`, `dayTripsAmalfi`, `positanoCapriFerry` — ferry €18–€25 (30–60 min, book 24h ahead); walk 15–20 min to pier; Anacapri first; Monte Solaro chairlift €16–€18 return; Blue Grotto €14–€18 + rowboat €15–€20; return 16:00–17:00; budget €70–€120/person |
| C02 | Pompeii Day Trip — Step by Step | `positanoPompeii`, `dayTripsAmalfi` — leave 08:00; SITA to Sorrento ~€2.50–€3; Circumvesuviana to Pompei Scavi ~€3–€4; entry €16–€18 (book ticketone.it); 5–8km walking; 3–4 hours on site; back by 17:00–18:00 |
| C03 | Amalfi Town and Ravello — Combined Day | `dayTripsAmalfi` — ferry €10–€18 or bus €2.50 to Amalfi; bus to Ravello €2.50 (25 min); Villa Cimbrone/Villa Rufolo €7–€10; total €21–€43; Ravello Festival June–Sept at Villa Rufolo |
| C04 | Sorrento Half-Day | `dayTripsAmalfi`, `sorrentoGuide` — ferry €12 or bus €2.50; free attractions (Villa Comunale, Marina Grande, lemon groves); gelato at I Giardini di Cataldo or Davide Gelato; limoncello from alimentari €8–€10; total €26–€51 |
| C05 | Herculaneum — Half-Day Alternative to Pompeii | `dayTripsAmalfi`, `positanoPompeii` — bus to Sorrento + Circumvesuviana; entry €13; 2–3 hours (smaller, better preserved); total ~€35–€37; less overwhelming than Pompeii |
| C06 | Boat Tours — Group and Private | `boatTours`, `experiencesPage.json` — group 3-hour tours mid-morning €85–€120/person July–Aug; private charter €550–€850 half-day (up to 6 people + fuel); cancel if wind >Force 4; book May–Sept; arrive 20 min early |
| C07 | Sunset Cruise and Dinner | `eatingOutPositano` — €139/person; 2-hour cruise + multi-course seafood; book 3–5 days ahead; weather dependent; reception can help book |
| C08 | Which Day Trip to Choose (Decision Guide) | `dayTripsAmalfi` — good weather = Capri or Amalfi+Ravello by ferry; rough seas or rain = Pompeii/Herculaneum or Sorrento by bus; half-day only = Amalfi solo (morning) or Sorrento; budget = Pompeii/Herculaneum, Amalfi by bus; photography = Capri or Ravello's Terrace of Infinity |
| C09 | Getting to Capri Ferry — Walk and Tickets | `positanoCapriFerry` — walk 15–20 min mostly downhill stairs; arrive 20–30 min before; each operator has own ticket booth; rough sea cancellations with as little as 90 min notice; backup = ferry to Sorrento + SITA bus |
| C10 | 1–3 Day Itinerary for Positano | `backpackerItineraries`, `weekend48Positano` — Day 1: Spiaggia Grande lookouts + Fornillo swim + sunset via Cristoforo Colombo; Day 2: Path of the Gods (Nocelle option) + beach cool-down; Day 3: Capri or Amalfi+Ravello |

---

### CLUSTER D — Transport Arrivals (~10 templates)

| Gap | Subject | Repo anchor |
|---|---|---|
| D01 | Arriving from Naples Airport — Bus Route | `naplesAirportPositanoBus` — Curreri bus Terminal 1 (€10, 75 min, no toilet, no stops); buy at kiosk or online; change to SITA at Sorrento bus station (Bar Circolo/Bar Fauno €2.60); get off "Positano Chiesa Nuova" NOT Centro/Spiaggia; walk 140m to hostel |
| D02 | Arriving from Naples Airport — Ferry Alternative | `naplesCenterPositanoFerry` — ferry from Molo Beverello to Positano (Apr–Oct); ~90 min; arrives Spiaggia Grande; then Interno bus to hostel |
| D03 | Arriving from Sorrento — Bus | `sorrentoPositanoBus` — SITA from Sorrento bus station; 1–1.5 hours; get off "Positano Chiesa Nuova" outside Bar Internazionale; walk 100m |
| D04 | Arriving from Sorrento — Ferry | `sorrentoPositanoFerry` — Travelmar/NLG from Marina Piccola; 45–60 min; arrive Spiaggia Grande; Interno bus uphill |
| D05 | Arriving from Salerno — Ferry | `salernoPositanoFerry` — Travelmar from Piazza della Concordia (confirm on ticket as some use Molo Manfredi); arrive Spiaggia Grande |
| D06 | Arriving from Salerno — Bus | `salernoPositanoBus` — SITA via Amalfi; change at Amalfi; get off Chiesa Nuova |
| D07 | Ferry Dock to Hostel — Complete Guide | `ferryDockToBrikette` — porter €15/bag (≤20kg), €18–€20 oversized, cash only, 30–45 min; OR Interno bus every 30 min 08:00–midnight, €1.50, alight Chiesa Nuova tabacchi, turn right 100m; OR walk 45–60 min 300+ steps (not recommended with luggage); taxi €25–35 (WhatsApp +39 379 125 6222) |
| D08 | Arriving by Car — ZTL, Garages, and Alternatives | `parking` — ZTL cameras (fines + admin fees); SS163 alternated-plate Apr–Oct; garages Mandara/Car Park Anna/Di Gennaro €35–60/24h, book ahead July–Aug, height limit ~1.9m; best plan: drop luggage near Chiesa Nuova first; park in Sorrento/Meta or Salerno + public transport |
| D09 | Late Night Arrival (After Midnight) | `ferryDockToBrikette`, `arrivingByFerry` — Interno bus runs to ~midnight; after midnight: taxi €25–35 WhatsApp +39 379 125 6222; message reception with ETA in advance; drops 50m from hostel entrance |
| D10 | SITA Bus Tickets — How to Buy and Validate | `sitaTickets`, `chiesaNuovaDepartures` — buy at tabacchi (opens 07:00) or Bar Internazionale (opens ~06:30) — cannot buy on board; validate by driver stamping/tearing; keep ticket until exit; prices: Amalfi €2.50, Sorrento €2.50, Salerno €4.00, 24-hr pass €8.00 |

---

### CLUSTER E — Transport Departures and Connections (~10 templates)

| Gap | Subject | Repo anchor |
|---|---|---|
| E01 | Getting to the Bus Stop — Chiesa Nuova Guide | `chiesaNuovaDepartures` — exit hostel, down steps, turn left, 120m to Bar Internazionale; queue: sea-view side for Amalfi/east; mountain side for Sorrento/west; tabacchi opens 07:00; buy ticket night before for early departures |
| E02 | Walking to the Ferry Dock | `briketteToFerryDock` — 20–30 min walk; 5-point landmark route; each ferry operator has own ticket booth at port; confirm at booth which one you need |
| E03 | Leaving for Naples Airport — Bus Route | `positanoNaplesAirportBus` — walk to Chiesa Nuova (120m); SITA to Sorrento (50–60 min); Curreri from Sorrento bus station to airport (75 min, no toilet); book Curreri at curreriviaggi.it; last SITA from Positano ~10:30–11pm |
| E04 | Positano to Sorrento | `positanoSorrentoBus`, `positanoSorrentoFerry` — SITA bus ~50–60 min (mountain side of Chiesa Nuova); OR ferry 45–60 min from Spiaggia Grande (Apr–Oct); Sorrento = Circumvesuviana for Naples/Rome connections |
| E05 | Positano to Amalfi — Bus | `positanoAmalfiBus` — €2.60 single or €10 COSTIERASITA day pass; 45–60 min; queue sea-view side; Amalfi terminus Piazza Flavio Gioia near waterfront |
| E06 | Positano to Amalfi — Ferry | `positanoAmalfiFerry` — Travelmar/Alilauro €10–€18; 25–40 min Apr–Oct; peak: 10–15 daily trips 09:00–18:30; plan B: SITA bus; walk hostel to pier 15–25 min (400+ steps, allow 45 min July–Aug) |
| E07 | Positano to Salerno | `positanoSalernoBus`, `positanoSalernoFerry` — SITA via Amalfi (change); OR Travelmar ferry Apr–Oct; Salerno = trains for Rome/Naples |
| E08 | Ferry Cancellations — What to Do | `ferryCancellations` — triggers: >20 knots OR >1.5m swell; check operators every 30 min on windy days; land backup: SITA to Sorrento then Circumvesuviana; refund: receipt/QR at dock or email agency within 24h; port info point for shared taxis and bag storage |
| E09 | Summer Bus Queue Tips | `chiesaNuovaDepartures` — peak June–Sept buses often full; busiest 09:00–12:00 and 16:00–19:00; arrive 10–15 min early; 4–5 large bags max in rear compartment; last bus to Amalfi ~10:30pm, Sorrento ~11pm — take second-to-last |
| E10 | Budget Transport — Day Pass and Money-Saving Tips | `transportBudget` — UNICO Costiera day pass €12.40 (unlimited SITA Sorrento–Salerno); Travelmar bundle tickets; peak avoidance before 08:30 or after 19:00; walk from Chiesa Nuova to hostel free vs porter; luggage storage near dock €7–€10 saves taxi cost |

---

### CLUSTER F — Food and Dining (~12 templates)

| Gap | Subject | Repo anchor |
|---|---|---|
| F01 | Budget Eating — €15–25/Day Strategy | `cheapEats` — grab-and-go: pizza al taglio €3–5 (Collina Bakery, Via Cristoforo Colombo); panini/focaccia €4–6; arancini €2.50–3.50; espresso al banco €1.20–1.50; tap water free from fountain near Chiesa Nuova "acqua del rubinetto" |
| F02 | Supermarket Picnic on the Terrace | `cheapEats` — mini-markets Via Pasitea/Via dei Mulini (open before 13:00 or after 16:30 siesta); picnic for two ~€20; wine €4–8; 1.5L water €0.80 vs €3 on beach |
| F03 | Menu del Giorno — Affordable Sit-Down Lunch | `cheapEats`, `eatingOutPositano` — uphill trattorias (Via Cristoforo Colombo): pasta €8–12, house wine carafe €3–5, coperto €2; menu del giorno €12–18 incl. water and coffee; arrive by 12:30 for best availability |
| F04 | Restaurants Near the Hostel (Walk-In to 5 Min) | `eatingOutPositano` — C'era Una Volta (across road, pizza €7–12, walk-in); Il Grottino Azzurro (160m flat, 0 stairs, dinner €35, vegetarian/GF available, book Fri–Sun high season); Da Costantino (300m uphill, 50–60 steps, set menu ~€30, best value) |
| F05 | Mid-Range Dining with Views (5–12 Min) | `eatingOutPositano` — Da Gabrisa (260m, ~€60, sunset terrace, book window tables); Next2 (270m, modern Italian €60); Luna at Villa Magia (450m, fine dining €65–100); Da Vincenzo 1958 (500m, classic €65) |
| F06 | Beach Bar Dining — Using the Interno Bus | `eatingOutPositano` — Interno bus €1.30 from Chiesa Nuova, every 30 min until ~11pm; Buca di Bacco at main beach ~€50; Ohimà €75; Al Palazzo €75; take bus back uphill after dinner |
| F07 | Farmhouse Dining Above Positano | `eatingOutPositano` — La Tagliata (Montepertuso, free shuttle when booking, €65/person, 2–3 hour feast, house wine included); Il Ritrovo (SITA bus, ~€50, better veg variety, return bus last ~10pm); La Taverna del Leone (SITA toward Amalfi 8–10 min, €45, taxi back ~€25–30) |
| F08 | Hostel Breakfast Menu — What's Available | `breakfastMenuPage.json` — 08:00–10:30; Eggs Combo (3 ingredients from: bacon/ham/tomatoes/mushroom/toast/cheese/beans); French toast with syrup choice; pancakes; Veggie Toast; Healthy Delight (yogurt/granola/fruit compote); juices (Detox/Energize/Multi-V/OJ); smoothies; full coffee bar; soy/rice milk |
| F09 | Hostel Bar Menu — What's Available | `barMenuPage.json` — Aperol/Limoncello/Hugo/Rossini Spritz; frozen daiquiri/margarita; Lemon Drop Martini; house wine by glass or bottle; Nastro/Peroni; vodka/rum/gin/whisky range (Hendrick's, Glenfiddich 12yr, Jameson, Jack Daniel's); shots; gelato (lemon/chocolate/vanilla/hazelnut, 1–3 scoops) |
| F10 | Dietary Options — Veg, Vegan, Gluten-Free | `eatingOutPositano`, `cheapEats`, `groceriesPharmacies` — "senza glutine" at pharmacies; phrases: "sono allergico/a a...", "senza formaggio", "senza noci/latticini/crostacei"; Il Grottino Azzurro/Da Vincenzo handle GF well (call day before); La Tagliata tough for vegans; pharmacy has GF sections |
| F11 | Booking a Restaurant — Tips and Strategy | `eatingOutPositano` — reserve 2–3 days ahead for 8:30–10pm seatings June–Sept; walk-in friendly: C'era Una Volta, Il Grottino (not Fri–Sun July–Aug), Da Costantino; payment: Visa/Mastercard (Amex less common); carry cash €20–30; arrive before 7pm or after 9:30pm |
| F12 | Cooking Classes on the Amalfi Coast | `cookingClassesAmalfi` — 2.5–4 hours including shared meal; 2–3 courses; book weeks ahead in high season; tell hosts dietary needs; bilingual/English formats; confirm pickup if outside Positano |

---

### CLUSTER G — Practical In-Destination (~12 templates)

| Gap | Subject | Repo anchor |
|---|---|---|
| G01 | SIM Cards and eSIMs in Positano | `simsAtms` — eSIM: TIM/Vodafone; activate on hostel Wi-Fi; choose ≥10GB for a week; physical SIM: Sorrento/Salerno/Naples Centrale; passport required; €10–20 starter pack; coverage good but slower offshore |
| G02 | ATMs and Cash — Strategy | `simsAtms`, `faq.json` — favour bank ATMs (Intesa Sanpaolo) €2–3 fee; avoid beach independent machines; withdraw €100–150 at a time; bank lobby machines 24/7 (can empty — may need Amalfi/Sorrento next morning); city tax and keycard deposit cash-only |
| G03 | Laundry Options in Positano | `laundryPositano` — no on-site laundry; self-service off-peak (late mornings/early afternoons); drop-off wash-and-fold per kg, same-day possible; gentle cycles for quick-dry/swimwear; shared dryers run hot |
| G04 | Groceries and Food Shopping | `groceriesPharmacies` — mini-markets Via Pasitea/Via dei Mulini (open before 13:00 or after 16:30); morning fruit/veg near Sponda/Chiesa Nuova; Wednesday market in Montepertuso (bus 13); no large supermarkets in Positano |
| G05 | Pharmacy and Medical Help | `groceriesPharmacies`, `ageAccessibility` — Farmacia Positano (Via Pasitea, ~450m); sun care, motion-sickness tablets; after-hours on-call number on pharmacy door; medical clinic in Praiano ~3km by bus; emergency: 112 / 118 |
| G06 | What to Pack — Footwear and Luggage | `whatToPack` — grip shoes essential (polished stone slippery when wet); backpack or soft duffel (rolling suitcases difficult on stairs); water shoes/sandals for pebbly beaches; no heels; aim for carry-on size |
| G07 | What to Pack — Seasonal and Sun | `whatToPack` — summer: lightweight breathable, SPF50+, hat (sunscreen €15–25 locally vs €8–12 at home); spring/fall: light rain jacket, layers; winter: proper rain jacket, grip shoes; power adapter Type L/Type C, 230V |
| G08 | Porter Services — How to Use | `porterServices`, `ferryDockToBrikette` — arrange at dock: confirm Hostel Brikette, agree fee before moving (€15/bag ≤20kg, €18–20 oversized, cash only); delivery 30–45 min; keep valuables with you; share arrival plan in advance in peak periods |
| G09 | Luggage Storage in Positano (Non-Hostel) | `luggageStorage` — options near dock: hourly/daily with ticket; book ahead high season; Bounce/Radical Storage aggregators (verify address and hours before paying online); label bags, keep claim tickets |
| G10 | Key Italian Phrases for Getting Around | `italianPhrasesCampania` — transport: "Un biglietto per Positano, per favore" / "Dove si convalida?" / "Scendo alla prossima" / "A che ora parte l'ultima corsa?"; dining: "Il conto, per favore" / "acqua del rubinetto"; emergency: "Ho bisogno di aiuto" / "Può chiamare un taxi?" |
| G11 | Travel Insurance Recommendation | `travelInsuranceAmalfi`, `legal` — cover: health/accident, cancellations, delays, electronics, hiking; keep all receipts/police reports; ferry weather delays vary by policy; non-refundable bookings especially benefit; Italian law governs — local legal action may be required for disputes |
| G12 | Hitchhiking the Amalfi Coast — Safety Warning | `hitchhikingAmalfi` — SS163 has no safe pull-offs; police enforce; risk of fines; never wait in tunnels or blind bends; hostel bar can book licensed taxi if stranded; alternatives: SITA buses, ferries, shuttle vans |

---

### CLUSTER H — Hostel Policy Edge Cases (~22 templates)

#### H1 — Check-in / Arrival Edge Cases

| Gap | Subject | Repo anchor |
|---|---|---|
| H01 | Midday Arrival — Temporary Guest Access | `checkinCheckout`, `bookingBasics` — arrival 10:30–15:00; temporary guest status; luggage storage subject to availability; common areas only; no room access until 15:00 |
| H02 | ID Not Accepted — What Happens | `checkinCheckout`, `termsPage` — valid original ID only (passport, national ID, driver's licence, military ID); photocopies not accepted; ID deadline 22:30; what happens if guest cannot provide valid ID at check-in |
| H03 | Third-Party Booking — Card Holder Liability | `bookingBasics`, `termsPage` — card holder liable for all charges even when booking for someone else; third-party payment link can be arranged; show confirmation email if surname doesn't match booking name |
| H04 | Booking Confirmation Not Received | `bookingBasics` — confirmation within 10 minutes; check spam/junk folder; confirmation email is binding document; if OTA booking, check OTA account |
| H05 | Wristband / Security Band Policy | `security` — wristband issued at check-in; must be worn on premises; small replacement fee if lost/damaged; guests without wristband or refusing ID may be asked to leave without refund |
| H06 | Hot Water Schedule | `bookingBasics`, `depositsPayments` — available approximately 07:00–10:30 and 17:00–22:30 (not 24/7); if outside these windows, this is by design not a defect |
| H07 | Locker / Padlock Information | `onlyHostel`, `security`, `faq.json` — individual locker per dorm bed; bring TSA padlock or buy at reception; locker use does not shift liability for stored items to hostel |
| H08 | Communal Fridge and Kitchen | `faq.json`, `bookingBasics` — no communal kitchen; fridge, kettle, microwave available for guest use; communal fridge available for snack storage |
| H09 | Lower Bunk Request | `checkinCheckout`, `ageAccessibility` — cannot be guaranteed for mobility concerns; dorm beds first-come first-choose; email in advance for mobility-related concerns; alternatives: private room |
| H10 | Female-Only Dorm — Policy Clarification | `roomsPage.json`, `houseRulesPage.json` — female-only dorms available on 3rd and 4th floors; mixed-gender groups cannot book female-only dorms; partner/companion cannot be accommodated in female-only dorm |

#### H2 — Financial and Administrative

| Gap | Subject | Repo anchor |
|---|---|---|
| H11 | Safeguarding Hold — Separate from Keycard Deposit | `depositsPayments`, `termsPage` — security hold of one night per guest at check-in (preauth or cash); separate from €10 keycard deposit; released minus any damages/fines/extras |
| H12 | Damage Charges and Labour Rates | `defectsDamages`, `depositsPayments`, `termsPage` — Director €50/h, Manager €35/h, Staff €25/h; damage deposit applied; guest responsible for balance if charges exceed deposit |
| H13 | Early Departure — Refund Not Automatic | `changingCancelling`, `termsPage` — no automatic refund for early departure; depends on rate type and written confirmation; original booking terms remain in effect |
| H14 | Booking Change Confirmation | `changingCancelling` — changes processed as replacement bookings; original booking cancelled; new booking created under same terms; not directly modifiable; written confirmation sent |
| H15 | Extended Stay — Linen and Towel Policy | `bookingBasics` — linen changed every 4th night for extended stays; additional towels available at extra charge |
| H16 | Cancellation Admin Fee — Explanation | `termsPage` — €5 admin fee per booking cancellation (note: operator must resolve inconsistency with changingCancelling guide's 15% figure before this template is written) |

#### H3 — Policy Enforcement

| Gap | Subject | Repo anchor |
|---|---|---|
| H17 | Outside Alcohol — Confiscation Notice | `rules` — staff stores outside alcohol; returned at checkout or when guest confirms it will be consumed off-site; repeat/serious breach = immediate booking cancellation as No Show, no refund |
| H18 | Unregistered Overnight Guest — Enforcement | `security`, `houseRulesPage.json` — charge: standard room rate + admin fee equal to twice that amount; unregistered person must check in or depart; if declined, authorities contacted; may result in No Show for original booking |
| H19 | Bed Bug — Guest Report Protocol | `defectsDamages`, `houseRulesPage.json` — immediate in-person report at reception; do not move rooms or transport linens without staff instruction; may need to bag/launder belongings; guest may be responsible for remediation costs if they failed to disclose prior bed bug exposure |
| H20 | Early Checkout Procedure | `checkinCheckout` — must arrange at reception the evening before to receive €10 cash deposit refund; abandoning keycard without staff confirmation forfeits deposit; belongings storage available |
| H21 | Failure to Checkout — Belongings Removal | `checkinCheckout` — if not out by 10:30 hostel may remove belongings to porter storage; storage and handling costs charged to guest |
| H22 | Contagious Illness — Refund Policy | `legal`, `termsPage` — non-refundable bookings remain non-refundable even when guest is ill; refundable bookings subject to standard cancellation terms; travel insurance strongly recommended; guests should disclose contagious illness exposure |

#### H4 — Accessibility and Special Needs

| Gap | Subject | Repo anchor |
|---|---|---|
| H23 | Service Animal — Booking Requirements | `ageAccessibility` — certified service animals in private rooms only; prior arrangement and documentation required; email before booking |
| H24 | CPAP / Assisted Sleeping Device | `ageAccessibility` — CPAP and assisted sleeping devices permitted in private rooms only; not available in dorms; book private room and email before arrival |
| H25 | Medication Refrigeration | `ageAccessibility` — can usually store medication requiring refrigeration; email before arrival to reserve space; Farmacia Positano ~450m for pharmacy needs |
| H26 | Minors — Under-16 and Under-18 Policy | `ageAccessibility`, `termsPage` — under-16: private rooms only, parent/guardian in same room; age 17: dorms possible with supervising adult + consent documentation (email in advance); groups under 18: exclusive occupancy + institutional written responsibility 7 days before |
| H27 | Pre-Arrival Orientation — What to Expect in Positano | `ageAccessibility`, `travelHelp` — ~30 stone steps to reception; no lift; most dorms 1–2 flights above reception; pack light; ferry arrival with luggage difficult — porter + Interno bus recommended; grip shoes essential |
| H28 | Digital Concierge — How to Access | `digitalConcierge`, `onlyHostel` — WhatsApp-based; ask reception for contact or QR code; send: dates, starting point, time window, budget, priority; good for same-day recommendations and transport alternatives |

---

### CLUSTER I — Gmail Mining Gaps (Phase 3 — to validate and add)

These templates cannot be written from repo content alone and require Gmail mining to surface examples and confirm frequency:

- Post-stay review request (preferred platform TBD — operator decision needed)
- Booking decline explanation (payment failure, fraud, policy breach)
- Room upgrade reversal notification
- Counter-offer acceptance confirmation
- Ferragosto / peak August expectations email
- Winter / off-season arrival tips
- Scooter rental information (brief — repo says not recommended for beginners)
- Cooking classes (brief)
- Booking platform redirect (OTA guest → direct booking incentive)

---

## Content Inconsistencies — RESOLVED (2026-02-22)

Operator confirmed:

1. **Visitor hours**: **20:30** — T32 corrected from "11:00 PM" to "8:30 PM"; all new templates must use 20:30 / 8:30 PM
2. **Cancellation admin fee**: **15% of booking price** (excluding third-party commissions) — not €5 flat
3. **Hot water**: **24/7** — depositsPayments.json scheduled-hours text is incorrect; templates should state hot water is available 24/7

---

## Summary: Gap Count by Cluster

| Cluster | Templates | Priority |
|---|---|---|
| A — Beaches | ~28 | High (most-asked guest topic) |
| B — Hikes and Walks | ~10 | High |
| C — Day Trips | ~10 | High |
| D — Transport Arrivals | ~10 | High |
| E — Transport Departures | ~10 | High |
| F — Food and Dining | ~12 | Medium–High |
| G — Practical | ~12 | Medium |
| H — Policy Edge Cases | ~28 | Mixed (some High enforcement, some Low frequency) |
| I — Gmail Mining | ~9 | After Phase 3 |
| **Total** | **~129** | |

Combined with existing 53, target library: **~182 templates**.

---

## Gmail Mining Plan (Phase 3 — Follow-on)

After Clusters A–H are authored, run targeted Gmail searches to validate frequency and catch residual gaps:

| Query | Target |
|---|---|
| `in:sent (beach OR Fornillo OR Spiaggia OR Arienzo OR Laurito)` | Validate beach template splits |
| `in:sent (hike OR path OR sentiero OR sunrise OR mountain)` | Validate hike template coverage |
| `in:sent (Capri OR Pompeii OR Amalfi OR Ravello OR day trip)` | Validate day trip coverage |
| `in:sent (ferry OR dock OR boat OR rough seas OR cancel)` | Validate transport templates |
| `in:sent (restaurant OR dinner OR eat OR menu OR food)` | Validate dining coverage |
| `in:sent (SIM OR eSIM OR data OR ATM OR cash OR pharmacy)` | Validate practical templates |
| `in:sent (damage OR broke OR defect OR bed bug OR wristband)` | Validate enforcement templates |
| `in:sent (review OR feedback OR TripAdvisor OR Google)` | Surface post-stay review template need |
| `in:sent (upgrade OR counter offer OR name change OR transfer)` | Surface booking admin gaps |

---

## Open Questions (User Input Needed)

1. **Operator inconsistencies**: Confirm canonical figure for visitor hours (20:00 or 23:00), cancellation admin fee (€5 or 15%), and hot water (scheduled or 24/7). Required before writing H-cluster templates that reference these.
2. **Batch scope for planning**: Should all clusters A–H go into a single plan, or phase it (A–E first, then F–H)?
3. **Post-stay review template (Cluster I)**: Which review platform should the CTA link to?
4. **Template numbering**: Confirm `normalization_batch: "E"` for this wave, and confirm sequential T54 onwards is the right approach (vs. alphabetical sub-IDs like T54a).

---

## Confidence Inputs

- Implementation: 92% — Schema clear, content sources comprehensive and verified with specific prices/times/names
- Approach: 88% — Gap list derived from full JSON reads; Gmail mining may add ~10 more templates
- Impact: 95% — Beach/transport clusters cover the most common unanswered guest queries
- Delivery-Readiness: 80% — Blocked only on operator resolution of 3 content inconsistencies and batch scope decision
- Testability: 72% — Lint validates schema; content accuracy is manual review; Gmail can validate frequency post-publish

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Prices/schedules change seasonally (especially ferry, SITA, beach clubs) | High | Medium | Flag all price/schedule claims in template body as "approx. as of 2026" and note in template metadata for annual review |
| Content inconsistencies written into templates before operator review | Medium | High | Block affected H-cluster templates until operator confirms canonical figures |
| 129 new templates degrade AI selection accuracy | Low | Medium | Use highly specific subjects; monitor `draft_signal_stats`; remove zero-selection templates after 4 weeks |
| Some beach clubs change pricing/policy seasonally | High | Low | Use approximate ranges rather than exact figures; link to guide for full detail |

---

## Suggested Task Seeds (Non-binding)

Proposed plan batches (each batch = one plan task):

- **Task 1 — Beaches Part 1 (A1–A3):** Spiaggia Grande (×4), Fornillo (×5), Arienzo (×4). 13 templates.
- **Task 2 — Beaches Part 2 (A4–A7):** Laurito (×4), Gavitella/Marina di Praia (×5), Fiordo di Furore (×3), Other (×3). 15 templates.
- **Task 3 — Hikes and Photography (B1–B2):** Path of the Gods (×3 detailed), other hikes (×4), scenic walks (×3), photography. 10 templates.
- **Task 4 — Day Trips (C01–C10):** Capri, Pompeii, Amalfi+Ravello, Sorrento, Herculaneum, Boat tours, Sunset cruise, Decision guide, Ferry guide, Itineraries. 10 templates.
- **Task 5 — Transport Arrivals (D01–D10):** All arrival routes + ferry dock guide + SITA tickets. 10 templates.
- **Task 6 — Transport Departures (E01–E10):** Bus stop guide, ferry dock walk, airport departure, coastal connections, ferry cancellations, budget tips. 10 templates.
- **Task 7 — Food and Dining (F01–F12):** Budget eating, picnics, restaurants, menus, dietary, booking tips, cooking classes. 12 templates.
- **Task 8 — Practical (G01–G12):** SIM, ATM, laundry, groceries, pharmacy, packing, porter, luggage storage, phrases, insurance, hitchhiking. 12 templates.
- **Task 9 — Policy Edge Cases Part 1 (H01–H16):** Check-in edges, financial/admin. 16 templates.
- **Task 10 — Policy Edge Cases Part 2 (H17–H28):** Enforcement, accessibility, orientation, digital concierge. 12 templates.
- **Task 11 — Gmail Mining Pass:** Run targeted searches, identify net-new gaps not in A–H, draft additional templates.
- **Task 12 — Operator Inconsistency Resolution:** Confirm 3 content inconsistencies; update affected templates accordingly.

Each task: read repo sources → draft templates → validate against lint script → append to `email-templates.json`.

---

## Execution Routing Packet

- Primary execution skill: `draft-email`
- Supporting skills: `ops-inbox` (Gmail mining phase)
- Deliverable acceptance:
  - Templates appended to `packages/mcp-server/data/email-templates.json`
  - `packages/mcp-server/scripts/lint-templates.ts` passes
  - Each template: distinct subject, `{{SLOT:GREETING}}` body, factual claims traceable to repo source
- Post-delivery measurement: Monitor `mcp__brikette__draft_signal_stats` after each batch; review zero-selection templates after 4 weeks

---

## Evidence Gap Review

### Gaps Addressed

- All 168 guide files read in full (not just titles/slugs)
- Beach guides read with full operational detail: prices, distances, club names, step counts, conditional advice
- Transport guides read with specific prices, operators, timetable structure, and named landmarks
- Policy guides read with financial thresholds, enforcement procedures, and edge cases
- Template schema confirmed from direct JSON inspection
- Three content inconsistencies identified and flagged for resolution before authoring

### Confidence Adjustments

- Initial estimate of ~40 gaps revised to ~129 after full guide content reads
- Beach cluster alone grew from 5 estimates to 28 templates once per-beach sub-topics were read
- Policy cluster grew from 10 estimates to 28 once booking terms, houseRules, and security guides were read in detail

### Remaining Assumptions

- Guide URL pattern `https://hostel-positano.com/en/guides/<slug>` not verified via live URL check
- Beach club prices and SITA fares assumed current as of 2026 season; should be verified annually
- `normalization_batch: "E"` assumed appropriate for this wave — operator may prefer different designation

---

## Planning Readiness

- Status: Ready-for-planning
- Blocking items (soft):
  - Operator must confirm 3 content inconsistencies before H-cluster templates are authored
  - Batch scope decision (all clusters in one plan, or phased)
  - Review platform for post-stay template (Cluster I, non-blocking for Clusters A–H)
- Recommended next step: `/lp-do-plan hostel-email-template-expansion` — scope Batches A–H in Tasks 1–10; add Task 11 (Gmail) and Task 12 (inconsistency resolution) as bookend tasks
