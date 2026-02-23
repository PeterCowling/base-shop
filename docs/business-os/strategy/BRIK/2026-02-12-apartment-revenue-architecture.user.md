---
Type: Fact-Find
Business-Unit: BRIK
Business-Name: Brikette
Product-Line: Apartment (StepFree Positano)
Status: Active
Created: 2026-02-12
Last-reviewed: 2026-02-12
Owner: Pete
Card-ID: BRIK-ENG-0021
Related-Intake: docs/business-os/startup-baselines/BRIK-intake-packet.user.md
Review-trigger: After each completed build cycle touching this document.
---

# Fact-Find: Apartment Revenue Architecture — Dual-Intent Landing System (2026)

## 1) Objective

Maximize apartment revenue (ADR x occupancy) while minimizing cancellation/review risk from expectation mismatch (noise + internal stairs). Prioritize speed-to-impact and measurable iteration.

## 2) Known Facts (Inputs)

- We operate the only hostel in Positano (`observed`).
- We own an apartment next door to the hostel; it is operated by hostel reception staff (`observed`).
- Apartment spec: sleeps 4 (double bed upstairs + sofa bed downstairs), kitchen, washer/dryer, 100sqm, 2 bathrooms (`observed`).
- In-season pricing: €495–€550/night; shoulder season from €265/night (`observed`).
- Pricing model: two tiers — pre-paid non-refundable (lower) and flexible (higher) (`observed`).
- Hostel inventory: 1 private room; rest dorms (`observed`).
- Current channels:
  - Hostel listed on Hostelworld + Booking.com (`observed`).
  - Apartment listed separately on Booking.com only (`observed`).
- Hostel website performance: hostel-positano.com ~12k unique visitors/month; site recently relaunched with more content (`observed`).
- Apartment guests can access hostel: terrace, breakfast, bar, reception support, events (`observed`).
- Channel manager: Octorate (shared with hostel, deep-link booking pattern proven in Brikette) (`observed`).
- Standalone domain decided: stepfreepositano.com (pending registration) (`observed`).
- Target guest: couples (`observed`).
- Brand: StepFree Positano — own identity, cross-linked with Brikette/hostel (`observed`).

### Noise reality

- Some road noise (`observed`).
- Some noise from the hostel terrace (apartment roof = hostel terrace) (`observed`).
- Noise restriction in place from midnight regarding terrace noise (`observed`).

### Access/stairs reality

- Step-free from the street to the apartment entrance (`observed`).
- The apartment interior has steps; not particularly easy to navigate (`observed`).
- Split-level: sofa bed downstairs, double bed upstairs (`observed`).
- Families with children / older guests are only a clean fit if stair-avoidant guests sleep downstairs (sofa bed) (`observed`).

## 3) Core Risks

### R1: "StepFree" brand name vs interior stairs (HIGH)

**This is the single biggest messaging risk.**

The brand name "StepFree Positano" and domain `stepfreepositano.com` create a strong implication of full accessibility. The property IS step-free from street to entrance — a genuine and rare USP in Positano. But the interior has stairs between levels.

If a guest books expecting a fully step-free experience and encounters internal stairs, the result is:
- Negative review ("misleading", "not actually step-free")
- Cancellation/refund pressure at €500+/night
- Reputational damage that compounds (reviews are permanent)

**Mitigation (mandatory):**
- Brand positioning must always be "step-free **arrival**" — never "step-free apartment"
- The Fit Check truth layer (section 7) is non-negotiable on every page and in pre-arrival comms
- SEO targeting: "step-free arrival Positano", "no street stairs Positano" — NOT "accessible apartment Positano" or "wheelchair Positano"
- Booking.com description must mirror the truth layer
- Mobility-limited / accessibility-first travelers are explicitly a **poor-fit segment** unless interior is adapted (it is not)

### R2: Expectation mismatch — noise (MEDIUM)

At €550/night, noise sensitivity generates low-star reviews, cancellation/refund pressure, and reputational damage.

**Mitigation:**
- Fit Check module discloses ambient sound + quiet hours
- Pre-arrival message repeats noise reality
- Operational: treat 23:00–24:00 as wind-down (chair pads, signage, staff reminders)

### R3: Hostel-averse buyers (MEDIUM — partially mitigated)

A non-trivial portion of premium apartment buyers are hostel-averse. The content lives on `hostel-positano.com/apartment/...` which exposes "hostel" in the URL. However:

- **stepfreepositano.com** redirects to these pages — hostel-averse buyers arriving via ads, WhatsApp, or word-of-mouth see a clean URL initially
- Once they land, the URL bar shows `hostel-positano.com` — this is visible but not prominently branded as "hostel"
- Page content frames the hostel as "hospitality team next door" / "optional amenities", never "hostel staff"

**Mitigation:**
- Use `stepfreepositano.com` in all outbound marketing, WhatsApp messages, and paid ads
- Monitor GA4: compare conversion rate for `stepfreepositano.com` referral vs organic hostel-positano.com arrivals
- If data shows material conversion drag from the hostname, escalate to a standalone microsite (section 14)

## 4) Strategic Hypothesis

Users arrive with different "primary reasons to buy." Forcing a single page to satisfy all intents leads to diluted messaging (lower conversion) and/or hidden constraints (higher mismatch risk).

Therefore: build distinct intent-targeted pages while enforcing a shared truth layer on every route.

## 5) Information Architecture

Content lives on **hostel-positano.com** under `/apartment/...`, leveraging existing domain authority and 12k monthly visitors. **stepfreepositano.com** redirects to the hub page — used as the clean URL for ads, WhatsApp, and word-of-mouth sharing.

### Hosting architecture

| Domain | Role |
|---|---|
| `hostel-positano.com/apartment/...` | All content pages — SEO-indexed, canonical |
| `stepfreepositano.com` | Redirect → `hostel-positano.com/apartment/` — premium front door for outbound marketing |

### Launch set (3 content pages + booking)

| Route (on hostel-positano.com) | Role | Primary audience |
|---|---|---|
| `/apartment/` | Hub / intent router with early Fit Check disclosure | All visitors |
| `/apartment/street-level-arrival/` | Intent page: "no street stairs" — arrival friction elimination | Travelers anxious about Positano stairs, luggage, strollers |
| `/apartment/private-stay/` | Intent page: "serviced private apartment with optional amenities next door" | Couples seeking privacy + reliability; hostel-averse buyers |
| `/apartment/book/` | Booking page with Octorate deep-link (reuse Brikette pattern) | High-intent visitors ready to convert |

### Supporting content (can be minimal at launch)

| Route | Role |
|---|---|
| `/apartment/contact/` | WhatsApp CTA + email + location map |

> **Note:** Original concept used `/apartment/hostel-benefits/` — replaced with `/apartment/private-stay/` to avoid "hostel" in slug while still communicating optional amenities in body content.

### Why hostel-positano.com, not a standalone site
- 12k unique visitors/month already — immediate audience for cross-sell
- Existing domain authority compounds SEO for apartment pages faster than a new domain
- Shared Octorate integration, GA4 property, and Cloudflare deployment
- stepfreepositano.com as redirect gives a clean outbound URL without maintaining two sites
- If data later shows hostel-domain conversion drag, can escalate to standalone microsite (section 14)

## 6) Page Roles and Differentiation

### A) `/apartment/` (Hub)

**Purpose:** Fast self-selection + early constraint disclosure. Also the redirect target for stepfreepositano.com.

**Above-the-fold structure:**
- Hero: premium interior photography with warm, homely feel
- Two primary cards/buttons routing to intent pages:
  - "Street-level arrival (no street stairs)" → `/apartment/street-level-arrival/`
  - "Private serviced stay (with optional terrace, bar & breakfast next door)" → `/apartment/private-stay/`
- Fit Check strip visible immediately (section 7)
- Primary CTA: "Check availability"

**SEO role:** Hub targets brand + generic "apartment Positano" terms. Intent pages target specific long-tail queries.

### B) `/apartment/street-level-arrival/`

**Primary promise:** "No street stairs from road to entrance" + luggage/stroller friction elimination.
**Required proof:** Continuous street-to-door video (single shot) + clear phrasing of what IS and ISN'T step-free.
**Primary audience:** Groups, travelers with luggage, anyone anxious about Positano stairs *for arrival* (not inside the apartment).
**Critical messaging:** "Step-free arrival — the apartment interior is split-level with internal stairs" (truth layer prominent, not buried).

### C) `/apartment/private-stay/`

**Primary promise:** "Private apartment with hospitality-grade support next door."
**Secondary value:** Optional terrace/bar/breakfast access (explicitly framed as optional, governed by hours/capacity).
**Primary audience:** Couples seeking reliability and privacy; hostel-averse buyers who still want professional ops.
**Hostel framing:** "Professionally managed by the hospitality team next door" — never "hostel staff."

## 7) Non-Negotiable "Fit Check" Truth Layer

A standardized disclosure block included on:
- `/apartment/` hub (visible immediately)
- Both intent pages (before final CTA)
- `/apartment/book/` page (before Octorate handoff)
- Pre-arrival WhatsApp/email message
- Booking.com description (adapted wording)

### Fit Check — Canonical Content

| Topic | Disclosure |
|---|---|
| **Arrival** | "No street stairs from the road to the apartment entrance." |
| **Inside** | "Split-level interior with internal stairs between living area and bedroom." |
| **Sleeping** | "Sofa bed downstairs; double bed upstairs." |
| **Sound** | "Some road and terrace ambience; terrace quiet hours from midnight." |
| **Best fit** | "Ideal for couples. If anyone in your group prefers to avoid stairs, the downstairs sofa bed is a comfortable alternative. Not recommended for very light sleepers." |

**Rationale:** Reduces cancellations and review negativity. Avoids "hidden gotcha" perception. At €500+/night, a single bad review from mismatch costs more than any lost conversion from honesty.

## 8) CTA and Funnel Mechanics

### Primary CTA (all pages)
- "Check availability" → `/apartment/book/` page with Octorate deep-link
- Octorate integration: same deep-link pattern as Brikette; apartment added to Octorate with own rate plan IDs (nr + flex); filter to show only apartment

### Secondary CTA
- "WhatsApp for quick answers" (high intent; handles qualification on stairs/noise quickly)

### Cross-site routing (hostel → apartment)
- If hostel private room unavailable, or party size ≥ 3, promote apartment from hostel booking flow
- Cross-link from Brikette site: "Looking for a private apartment? → stepfreepositano.com"
- Cross-link from StepFree site: "Traveling with a group? Our hostel is next door → hostel-positano.com"

## 9) SEO Strategy

### Target keywords (aligned with brand positioning)

| Priority | Keyword cluster | Intent page |
|---|---|---|
| P1 | "step-free positano", "no stairs positano apartment" | `/apartment/street-level-arrival/` |
| P1 | "private apartment positano", "serviced apartment positano" | `/apartment/private-stay/` |
| P2 | "apartment positano amalfi coast", "holiday apartment positano" | `/apartment/` |
| P2 | "positano apartment couples" | `/apartment/private-stay/` |
| P3 | "positano accommodation with breakfast", "positano apartment with terrace" | `/apartment/private-stay/` |

### Duplication control
- Different hero media per intent page (street-to-door video vs premium interior)
- Different first 200 words, FAQs, and emphasis
- Homepage absorbs generic overview; intent pages go deep on one primary promise
- `rel=canonical` on each page pointing to itself (no cross-canonicalization)

## 10) Measurement Plan (GA4)

### Content grouping

| Page | Content group |
|---|---|
| `/apartment/` | `apartment_hub` |
| `/apartment/street-level-arrival/` | `apartment_street_access` |
| `/apartment/private-stay/` | `apartment_serviced` |
| `/apartment/book/` | `apartment_booking` |

### Key events

- `page_view` (with content group)
- `click_check_availability` (with source page)
- `click_whatsapp`
- `outbound_click_bookingcom` (with UTMs)
- `begin_checkout` / `purchase` (via Octorate)
- `video_play_stepfree_route`
- Scroll depth (25/50/75/100)

### Success metrics

| Metric | Target | Measurement |
|---|---|---|
| CTA CTR (page → availability click) | >5% | GA4 event ratio |
| Booking conversion (direct) | Track from launch | Octorate + GA4 |
| Cancellation rate | Lower than Booking.com-only baseline | Octorate data |
| Review mentions: "stairs", "noise", "not as expected" | Zero | Manual review monitoring |
| Direct vs OTA booking ratio | Increasing over time | Octorate channel report |

## 11) Operational Guardrails

### Noise control
- Treat 23:00–24:00 as wind-down operationally, even if formal quiet time is midnight
- Reduce scraping/impact noise sources (chair pads, signage, staff reminders)
- Pre-arrival message repeats Fit Check highlights (stairs + ambient sound + quiet hours)

### Pre-arrival communication sequence
1. Booking confirmation: Fit Check summary + WhatsApp contact
2. 48h pre-arrival: Directions (emphasizing step-free street access), check-in process, quiet hours reminder
3. Check-in: In-person Fit Check walkthrough (show stairs, show sofa bed setup, explain terrace hours)

## 12) Decisions Already Made

| Decision | Status | Rationale |
|---|---|---|
| Content on hostel-positano.com/apartment/... | Decided | Leverages 12k visitors/month, existing domain authority, shared infra |
| stepfreepositano.com as redirect front door | Decided — pending registration | Clean URL for ads/sharing; mitigates hostel-aversion for outbound traffic |
| Octorate as booking engine | Decided | Already in use for Brikette; proven deep-link pattern; handles OTA sync |
| Own brand identity (StepFree Positano) | Decided | Distinct from hostel brand; cross-linked but independent |
| Target demographic: couples | Decided | Distinct from hostel (young female travelers) |
| Business code: POSAPT | Decided | Separate tracking in startup loop |

## 13) Open Questions (Remaining)

| # | Question | Why it matters | Owner | Priority |
|---|---|---|---|---|
| 1 | Noise mitigations available? (double glazing, shutters, AC enabling windows closed) | Determines how confidently we can address noise concern | Pete | high |
| 2 | Exact internal layout: number of steps, handrail presence, stair steepness | Truthful Fit Check messaging needs specifics | Pete | high |
| 3 | Reception hours and check-in process for apartment guests | Avoid implying 24/7 if not available | Pete | medium |
| 4 | Which hostel amenities are truly available to apartment guests without capacity issues? (breakfast, events, terrace) | Determines what we can promise on `/private-stay/` | Pete | medium |
| 5 | Street-to-door proof video — does it exist or need filming? | Required content for `/street-level-arrival/` | Pete | high |
| 6 | Photography / interior visual assets — current state? | Homepage and all pages need premium imagery | Pete | high |

## 14) Follow-On Options (Conditional on Data)

### A) Paid acquisition test
If organic traction is slow after 30 days, test Google Ads on "apartment Positano" keywords with landing page via `stepfreepositano.com` (redirects to `/apartment/private-stay/`). Low budget (€10/day) to validate conversion rate before scaling.

### B) Standalone microsite escalation
If GA4 data shows material conversion drag from the `hostel-positano.com` hostname among premium buyers, build a standalone site on `stepfreepositano.com` instead of redirecting. Mark `noindex` initially to avoid SEO duplication; use for paid/referrals/retargeting only. Requires cross-domain GA4 setup.

### C) Hostel cross-sell module
Add an apartment promotion module to the hostel booking flow when private room is unavailable. Requires Octorate availability check integration (already built for Brikette).

### D) Additional OTA channels
List on Airbnb / VRBO via Octorate channel manager. Separate decision — increases exposure but adds commission cost and review surface area.

## 15) Immediate Next Actions

1. Register `stepfreepositano.com` (Pete — tomorrow)
2. Add apartment to Octorate; get rate plan IDs (nr + flex)
3. Film street-to-door proof video (single continuous shot)
4. Gather interior photography (prioritize: living area, kitchen, bedroom, bathroom, view)
5. Answer open questions (section 13)
6. Proceed to S1 Readiness in startup loop
