---
Type: System-Spec
Status: Active
Domain: Brikette
Last-reviewed: 2026-03-01
Relates-to charter: docs/business-os/business-os-charter.md
Relates-to:
  - docs/plans/brikette-sales-funnel-analysis/fact-find.md
  - docs/plans/brikette-sales-funnel-analysis/plan.md
---

# Brikette Resulting Booking System (Octobook, No Paid API)

## 1) North Star
Deliver the highest-conversion first-party funnel possible under Octobook constraints.
Only true impracticality (cannot be done, or proven materially non-ideal) is a valid reason to deviate.

## 2) Non-Negotiable Hard Contracts
- Hostel booking stays are strictly `2-8` nights.
- Hostel booking max is `8` adults per booking.
- Hostel flow is adults-only.
- Child handling is allowed only in apartment/private-room flow.
- Over-limit demand is never a dead end: always route to split-booking guidance or assisted booking.

## 3) Canonical State and Event Contracts

### 3.1 `BookingSearch` (continuity state)
- `checkin: YYYY-MM-DD | null`
- `checkout: YYYY-MM-DD | null`
- `pax: integer` (`>=1`, interpreted as adults in hostel domain)
- `preferred_rate: nr | flex | null`

### 3.2 `HandoffAttempt` (interaction state)
- `brik_click_id: string`
- `timestamp: ISO-8601`
- `source_route: string`
- `cta_location: string`
- `engine_endpoint: result | calendar | string`

`brik_click_id` is generated per handoff click, is not persisted in shared continuity storage, and is never reused across handoff attempts.

### 3.3 Domain scope
Option locked: `/dorms` and `/dorms/[slug]` operate in hostel-domain constraints only.
- “Private” filter on `/dorms` refers only to hostel-domain private inventory that still follows hostel contracts.
- Apartment/private-with-children remains outside this system and uses a separate domain flow.

### 3.4 Parse vs validate (no intent drop)
Hydration uses parseability, not validity.

Route-load precedence:
1. If URL has parseable `checkin/checkout/pax` -> hydrate runtime state from URL.
2. Else if shared store has parseable non-stale state -> hydrate runtime state from store.
3. Else -> empty state.

Then always validate and derive:
- `validationErrors[]`
- `hasValidSearch = validationErrors.length === 0`

This preserves user intent even when inputs are invalid (for example 1-night stays or pax > 8), so corrective UX and split-booking guidance can be shown without losing entered values.

### 3.5 Write policy (runtime/store/URL)
- Runtime state updates on every picker change.
- Shared store updates on runtime changes using debounced writes.
- Shared store also flushes immediately on:
  - explicit `Apply/Search/Update`,
  - handoff click,
  - explicit share/copy-link action.
- URL updates only on explicit actions:
  - `Apply/Search/Update` (replace-state style),
  - explicit share/copy-link,
  - handoff URL generation.
- Never mutate URL on every picker change.

### 3.6 Cold-state contract
If URL and store are unavailable, page remains conversion-safe:
- render entered/empty controls predictably,
- show indicative pricing if applicable,
- provide clear next action,
- never show dead-end CTA.

## 4) Funnel Flow (Resulting)

### 4.1 Primary flow
```text
Traffic (SEO / Maps / Social / Email / OTAs)
        |
        v
+---------------------------------------------+
| First-party discovery pages                 |
| /{lang}                                     |
| /{lang}/dorms                               |
| /{lang}/dorms/[slug]                        |
| /{lang}/guides/*                            |
+---------------------------------------------+
        |
        | set/adjust BookingSearch
        v
+---------------------------------------------+
| Decision surfaces                           |
| Primary fast lane: /{lang}/dorms/[slug]     |
| Comparison lane: /{lang}/book               |
+---------------------------------------------+
        |
        | handoff_to_engine + HandoffAttempt
        v
+---------------------------------------------+
| Octobook checkout (third-party)             |
+---------------------------------------------+
        |
        v
+---------------------------------------------+
| Recovery loop (no deterministic API close)  |
| quote capture + resume link + proxy audiences|
+---------------------------------------------+
```

### 4.2 State machine (corrected)
```text
URL/store parseable?
   |
   +--> yes --> hydrate state --> validate
   |                           |
   |                           +--> valid   --> enable handoff
   |                           +--> invalid --> show errors/guidance
   |
   +--> no  --> empty state + prompt + indicative anchor
```

### 4.3 Invalid and over-limit handling flow
```text
User search input
  |
  +--> valid hostel contract? ---- yes ---> enable direct handoff CTA
  |
  +--> no
        |
        +--> nights/pax over limit? -- yes --> show split-booking guidance (2+ bookings)
        |                                     + assisted contact path
        |
        +--> other invalid state -----------> show corrective prompt; no dead-end
```

### 4.4 No-JS hostel policy flow
```text
Hostel page (no JS)
  |
  +--> direct unconstrained booking link? -> NOT ALLOWED
  |
  +--> assisted conversion block
       - contact / WhatsApp / booking assistance
       - includes carried context when present
         (dates, pax, room label) in prefilled request text
```

## 5) Page-by-Page Target Behavior and ASCII Layouts

### 5.1 `/{lang}` Homepage
Purpose:
- Fast capture of dates/pax.
- Route undecided users to `/{lang}/book`.
- Keep room-intent users close to direct path via room detail.

CTA rules:
- Widget primary: `Check availability` -> `/{lang}/book` with explicit action URL state.
- Room card:
  - valid search: `Book this room` -> direct Octobook handoff.
  - invalid/empty: `Check rates` -> focus/open widget or route to `/{lang}/book`.
- `More about this room`: clean link to room detail.

ASCII page:
```text
+--------------------------------------------------------------+
| H1: Brikette Hostel in <City>                                |
| [Check-in] [Check-out] [Adults] [Check availability]         |
| (state updates live; URL writes on explicit action only)      |
+--------------------------------------------------------------+
| Featured rooms                                                |
| [Room A] From €X*  [Book this room] [More about this room]   |
| [Room B] From €Y*  [Book this room] [More about this room]   |
+--------------------------------------------------------------+
| Guides / Location / FAQ                                      |
+--------------------------------------------------------------+
```

### 5.2 `/{lang}/dorms` Listing
Purpose:
- Browse hostel-domain inventory and adjust dates inline.
- Enable direct handoff when valid.

UI contract:
- Compact date/pax bar at top + sticky behavior.
- “Private” filter remains hostel-domain and adults-only.

CTA rules:
- valid search: `Book` + `Details`.
- invalid/empty: `Select dates` + `Details`.

ASCII page:
```text
+--------------------------------------------------------------+
| H1: Dorm Rooms                                                |
| [Check-in] [Check-out] [Adults] [Update]   (sticky on scroll)|
| Filter: Dorms / Private (hostel-domain only)                 |
+--------------------------------------------------------------+
| Room grid                                                     |
| [Dorm A] From €X* [Book / Select dates] [Details]            |
| [Hostel Private] From €Y* [Book / Select dates] [Details]    |
+--------------------------------------------------------------+
| Short SEO text + FAQ + guide links                           |
+--------------------------------------------------------------+
```

### 5.3 `/{lang}/dorms/[slug]` Room Detail (Primary Conversion Surface)
Purpose:
- Close booking intent with lowest friction.
- Do not force `/book` interposition when valid.

Rules:
- No load-time auto-seeding of booking params.
- Read parseable URL first, then parseable fresh store.
- Invalid values stay visible with corrective prompts.

Rate-plan behavior:
- NR/Flex explicit on room detail.

ASCII page:
```text
+--------------------------------------------------------------+
| H1: 8-bed Mixed Dorm                                          |
| Gallery | Amenities | Reviews                                 |
+--------------------------------------------------------------+
| [Check-in] [Check-out] [Adults]                               |
| Price: From €X*  OR live price (with unit labels)             |
| Rate: [NR] [Flex]                                             |
| [Book now]                                                    |
+--------------------------------------------------------------+
| Facts + policies + FAQs                                       |
+--------------------------------------------------------------+
| Sticky: From €X   [Book NR] [Book Flex]                       |
+--------------------------------------------------------------+
```

### 5.4 `/{lang}/book` Comparison/Search Surface
Purpose:
- Comparison for undecided users.
- Not mandatory for room-detail users.

Rate-plan capability tiers:
- Minimum (must): NR default + per-room “Flex available”.
- Enhanced (only if cheap/reliable): show “Flex +€N” delta once dual-rate data is available.

ASCII page:
```text
+--------------------------------------------------------------+
| H1: Compare rooms                                              |
| [Check-in] [Check-out] [Adults] [Search]                      |
+--------------------------------------------------------------+
| Room cards                                                     |
| [Dorm A] €X [Book] [Details] [Flex available / Flex +€N]      |
| [Dorm B] €Y [Book] [Details] [Flex available / Flex +€N]      |
+--------------------------------------------------------------+
| Quote capture (optional): [Email me this price]               |
+--------------------------------------------------------------+
```

### 5.5 No-JS hostel rendering
Purpose:
- Preserve hard contracts without JS validation.

ASCII block:
```text
+--------------------------------------------------------------+
| Booking assistance required                                   |
| Hostel rules: 2-8 nights, max 8 adults, adults-only          |
| [Contact us] [WhatsApp] [Request assisted booking]           |
| (prefilled with known context when available)                |
+--------------------------------------------------------------+
```

## 6) Pricing Contracts

### 6.1 Live price behavior
When `hasValidSearch` is true, attempt live price fetch.

Failure fallback contract:
- If fetch fails: show `Rates temporarily unavailable` (never label as sold out by default).
- CTA behavior must stay explicit:
  - either disable handoff with guided alternative path, or
  - allow controlled handoff only if hard constraints remain enforced.

Request discipline:
- Debounce price fetch on search changes.
- Session-cache by key `(checkin, checkout, pax, rate_plan)`.
- Protect listing grids from fan-out amplification.

### 6.2 Price presentation units
Display units must be explicit and consistent:
- Dorm inventory: per person per night.
- Private room inventory: per room per night.
- If total-stay price is shown, label as total for stay.
- Indicative anchors must include unit context.

### 6.3 Indicative pricing
Dataset minimum:
- `room_id`
- `currency`
- `indicative_from_per_night`
- `basis`
- `last_updated`

Display:
- No valid search -> `From €X*` + disclosure.
- Valid search -> live price path.
- Stale dataset -> hide anchor and show neutral prompt.

Disclosure:
- `* Indicative per-night price. Final price depends on dates and availability.`

## 7) Handoff and Analytics Contract

### 7.1 Canonical event
- Event: `handoff_to_engine`
- Fired once per explicit handoff action.
- Never fired on render/hydration.

### 7.2 Required payload
- `checkin`, `checkout`, `pax`, `rate_plan`, `room_id`
- `source_route`, `cta_location`
- `brik_click_id`, `engine_endpoint`, `handoff_mode`

### 7.3 Click-id boundary
- `brik_click_id` is always generated per click for event payload.
- URL propagation and deterministic joins are policy-driven by export evidence.
- Without proven export persistence, reporting remains proxy-based.

## 8) Recovery Contract (No Paid API)
MVP scope: email-only quote capture + resume link + proxy audiences.

Resume link contract:
- Format: query-based `/{lang}/book?checkin=...&checkout=...&pax=...&room=...` for MVP.
- TTL: 7 days.
- Expired/invalid resume: show empty state + `Rebuild your quote` action.

Recovery flow:
```text
valid search + intent
      |
      +--> handoff to Octobook
      |
      +--> optional "Email me this price"
             |
             +--> consented capture
             +--> resume link generated (TTL 7d)
             +--> follow-up + proxy audience signal
```

## 9) SEO and Indexation Contract
Policy matrix:
- `/{lang}/dorms` -> index, canonical clean URL.
- `/{lang}/dorms/[slug]` -> index, canonical clean URL.
- `/{lang}/book` -> `noindex,follow` by default.
- Param variants -> canonicalize to clean URL.

Crawl path rule:
- Do not generate internal crawl paths to param variants.
- Internal links remain clean (no param propagation as continuity mechanism).
- Canonical tags handle discovered param pages.

Booking engine outbound links:
- `rel="nofollow noopener noreferrer"`.

## 10) Cloudflare Free-Tier Fit (Resulting Design)
Designed to fit free tier by default:
- no paid Octobook API dependency,
- lightweight client/state contracts,
- bounded analytics/recovery traffic,
- static/managed indicative pricing dataset.

Likely first pressure points at scale:
- Worker request volume,
- KV read/write quotas (if used for recovery persistence).

## 11) Practicality Gate
Deviation is valid only if:
1. technically infeasible under platform constraints, or
2. demonstrably non-ideal by evidence (conversion/reliability/ops).

Otherwise, keep the target system and execute.
