---
Type: Product-Spec
Status: Draft
Business: BRIK
Created: 2026-02-17
Updated: 2026-02-17 (rooms updated)
Last-reviewed: 2026-02-17
Owner: Pete
---

# Brikette — Product Spec

Brikette is a physical hostel in Positano on the Amalfi Coast. The ambition is to be the most expensive hostel in the world while remaining very busy — premium pricing justified by exceptional quality: comfortable rooms, great common areas, outstanding staff and service, organised experiences, and deep local knowledge. The digital platform exists to serve the physical product.

This document specifies every product Brikette sells. Gaps are marked **[NEEDS INPUT]** and should be filled before the S2B Offer Design stage runs.

---

## 1. Rooms

### Overview

The hostel has **11 rooms** across two types: dormitory rooms (the majority) and one private room. Each room is individually numbered and likely has distinct characteristics — which is an asset for premium positioning (you are not booking "a dorm bed", you are booking a specific room with a specific feel).

> **Data source note — read before editing this table.**
>
> **Octorate room names in calendar exports are rate-plan labels**, not descriptive room names. The export sheets contain labels like "OTA, Refundable, Room 3" — these identify which rate plan applies, not the room's physical characteristics. Do not treat export room labels as authoritative descriptions.
>
> **Gender policy and bed count are held in Octorate's room configuration admin UI** (Rooms section of the Octorate admin) but are NOT included in any automated export. They must be read manually from the admin interface and entered here.
>
> **Trigger for manual update**: whenever a room configuration is changed in Octorate (gender policy, bed reconfiguration, capacity change), this product spec must be updated to match. The stale-gender-policy scenario (room switched in Octorate admin but product spec still showing old value) is the most likely failure mode.
>
> **Nightly pricing and real availability do not belong in this table.** They are sourced from the weekly automated calendar extract (`data/octorate/octorate-calendar-YYYY-MM-DD.xlsx`) and queried from `data/octorate/` at loop runtime. No manual entry is needed or desirable — it would immediately be stale.

| Room | Octorate label | Type | Gender policy | Capacity | Notes | Source |
|---|---|---|---|---|---|---|
| Room 3 | Room 3 | Dorm | Female-only | 8 | **[NEEDS INPUT]** key features, view, ensuite/shared | `[OCT-CFG]` type + gender + beds; `[MANUAL]` notes |
| Room 4 | Room 4 | Dorm | Mixed | 8 | **[NEEDS INPUT]** | `[OCT-CFG]` type + gender + beds; `[MANUAL]` notes |
| Room 5 | Room 5 | Dorm | Female-only | 6 | **[NEEDS INPUT]** | `[OCT-CFG]` type + gender + beds; `[MANUAL]` notes |
| Room 6 | Room 6 | Dorm | Female-only | 7 | **[NEEDS INPUT]** | `[OCT-CFG]` type + gender + beds; `[MANUAL]` notes |
| Room 7 | 2022-7 | Private | N/A | 2 | **[NEEDS INPUT]** key features, view | `[OCT-CFG]` capacity; `[MANUAL]` notes |
| Room 8 | Room 8 | Staff room | — | — | Not for sale in 2026 — staff accommodation | `[MANUAL]` |
| Room 9 | Room 9 | Dorm | Mixed | 3 | **[NEEDS INPUT]** | `[OCT-CFG]` type + gender + beds; `[MANUAL]` notes |
| Room 10 | Room 10 | Dorm | Mixed | 6 | **[NEEDS INPUT]** | `[OCT-CFG]` type + gender + beds; `[MANUAL]` notes |
| Room 11 | Room 11 | Dorm | Female-only | 6 | **[NEEDS INPUT]** | `[OCT-CFG]` type + gender + beds; `[MANUAL]` notes |
| Room 12 | Room 12 | Dorm | Mixed | 6 | **[NEEDS INPUT]** | `[OCT-CFG]` type + gender + beds; `[MANUAL]` notes |
| Apartment | 2025-14 | Private apartment | N/A | 4 | StepFree Chiesa Nuova — see Section 2 for full spec | `[OCT-CFG]`; `[MANUAL]` |

> Room 7 = Octorate label "2022-7" (private room). Apartment = Octorate label "2025-14" (StepFree Chiesa Nuova, added to Octorate in 2025).
> Room 8 is staff accommodation in 2026 — excluded from sellable inventory and capacity calculations.
> **Sellable guest capacity: 52 dorm beds + 2 (room 7 private) + 4 (apartment) = 58 total.** `[MANUAL]`

### Per-room questions to fill in

For each room, the following should be specified. These drive OTA listing copy, direct-site content, and pricing decisions:

| Field | Source |
|---|---|
| Bed configuration — number of beds, bed size, bunk or single, privacy screen/curtain | `[OCT-CFG]` bed count; `[MANUAL]` bed size/type/curtain |
| Bathroom — ensuite, semi-private, or shared? How many sharing? | `[MANUAL]` |
| View — sea view, terrace view, internal courtyard, other | `[MANUAL]` |
| Floor — which floor? Steps to reach it? Lift access? | `[MANUAL]` |
| Noise profile — road-facing, terrace-facing, quieter side | `[MANUAL]` |
| Standout feature — what makes this room worth choosing over the others | `[MANUAL]` |
| Base nightly price — current Octorate rate plan (low/high season) | `[OCT-CAL]` — queried at runtime; do not enter here |
| Accessibility notes | `[MANUAL]` |

### Room pricing

> Per-night room rates are not manually documented here. Pricing comes from `[OCT-CAL]` — the weekly automated Octorate calendar extract. Queried from `data/octorate/` at loop runtime.

Observed aggregate per-booking net value (Feb–May 2025): **EUR 270.84** average across all bookings. This is not a per-room rate; it reflects the full booking mix. Source: `[DERIVED]` (calculated from historical booking records).

---

## 2. Apartment — StepFree Chiesa Nuova

Brand name: **StepFree Positano**. Domain: stepfreepositano.com (pending registration). Business code: POSAPT.

### Physical spec

| Field | Value | Source |
|---|---|---|
| Location | Next door to the hostel, Chiesa Nuova, Positano | `[MANUAL]` |
| Size | 100 sqm | `[MANUAL]` |
| Layout | Split-level: living area downstairs, bedroom upstairs with internal stairs | `[MANUAL]` |
| Capacity | 4 guests | `[MANUAL]` |
| Beds | Double bed (upstairs) + sofa bed (downstairs) | `[MANUAL]` |
| Bathrooms | 2 | `[MANUAL]` |
| Kitchen | Full kitchen | `[MANUAL]` |
| Laundry | Washer/dryer | `[MANUAL]` |
| Wi-Fi | Yes | `[MANUAL]` |
| AC | Yes | `[MANUAL]` |
| TV | Yes | `[MANUAL]` |
| Other amenities | Hairdryer, dining area | `[MANUAL]` |

### Access and accessibility

| Field | Value | Source |
|---|---|---|
| Street to entrance | Step-free — primary USP, rare in Positano | `[MANUAL]` |
| Interior | NOT step-free — internal stairs between living area and bedroom | `[MANUAL]` |
| Stair detail | **[NEEDS INPUT]** — count, handrail, steepness | `[MANUAL]` |

### Noise profile

| Field | Value | Source |
|---|---|---|
| Road noise | Some road noise | `[MANUAL]` |
| Terrace noise | Some hostel terrace noise (apartment roof is hostel terrace) | `[MANUAL]` |
| Quiet hours | Formal from midnight; operational wind-down from 23:00 | `[MANUAL]` |

### Hostel amenities available to apartment guests

Apartment guests can access: terrace, breakfast, bar, reception support, events. These are optional inclusions, not guaranteed; subject to capacity. Exact terms **[NEEDS INPUT]**. Source: `[MANUAL]`

### Pricing

| Rate type | Mar | Apr | May onwards | Source |
|---|---|---|---|---|
| Non-refundable | EUR 265 | EUR 400 | EUR 495 | `[OCT-CFG]` rate plan; `[OCT-CAL]` live nightly rate |
| Flexible | EUR 450 | EUR 500 | EUR 550 | `[OCT-CFG]` rate plan; `[OCT-CAL]` live nightly rate |

### Target guest

| Segment | Detail | Source |
|---|---|---|
| Primary | Couples (distinct from hostel 18-25 female traveller demographic) | `[MANUAL]` |
| Poor fit — mobility-limited | Interior stairs — honest positioning required | `[MANUAL]` |
| Poor fit — very light sleepers | Terrace noise — honest positioning required | `[MANUAL]` |
| Poor fit — hostel-averse | Apartment shares facilities with hostel | `[MANUAL]` |

### Channel and booking

| Channel | Status | Source |
|---|---|---|
| Booking.com | Currently listed | `[BKG-COM]` |
| Octorate booking engine | Shared with hostel | `[OCT-CFG]` |
| Direct — hostel-positano.com/apartment/ | Active | `[MANUAL]` |
| StepFree Positano domain | Redirects; pending registration | `[MANUAL]` |
| WhatsApp | Secondary CTA for high-intent inquiries | `[MANUAL]` |

### Pre-arrival communication sequence

1. Booking confirmation — Fit Check summary + WhatsApp contact
2. 48h pre-arrival — directions, check-in process, quiet hours reminder
3. In-person check-in — walkthrough showing stairs, sofa bed setup, terrace hours

Source: `[MANUAL]` (owner-confirmed service design)

### Open items

| Item | Owner | Priority | Source to resolve |
|---|---|---|---|
| Register stepfreepositano.com | Pete | High | `[MANUAL]` |
| Add to Octorate; get rate plan IDs (non-refund + flex) | Pete | High | `[OCT-CFG]` |
| Film street-to-door proof video | Pete | High | `[MANUAL]` |
| Interior photography | Pete | High | `[MANUAL]` |
| Stair details (count, handrail, steepness) | Pete | High | `[MANUAL]` |
| Noise mitigation details (double glazing, shutters?) | Pete | High | `[MANUAL]` |
| Confirm which hostel amenities available to apartment guests and on what terms | Pete | Medium | `[MANUAL]` |
| Confirm reception hours for apartment guests | Pete | Medium | `[MANUAL]` |

---

## 3. Experiences

Experiences are a core part of the premium positioning — deep local knowledge and curated social moments as a product, not a free add-on.

> "Experiences" is the preferred label over "Activities" (brand voice guidance).

### Cheese and wine night

| Field | Value | Source |
|---|---|---|
| Name | Cheese and wine night | `[MANUAL]` |
| What it is | **[NEEDS INPUT]** — hosted tasting event, social format | `[MANUAL]` |
| Duration | **[NEEDS INPUT]** | `[MANUAL]` |
| Price per person | **[NEEDS INPUT]** | `[MANUAL]` |
| Capacity | **[NEEDS INPUT]** | `[MANUAL]` |
| When available | **[NEEDS INPUT]** — weekly / seasonal / on demand | `[MANUAL]` |
| Who leads it | **[NEEDS INPUT]** — staff member or external | `[MANUAL]` |
| What makes it worth paying for | **[NEEDS INPUT]** — local producers, curated selection, social atmosphere | `[MANUAL]` |
| Booking required | **[NEEDS INPUT]** | `[MANUAL]` |
| Included in room rate | **[NEEDS INPUT]** — extra charge or complimentary | `[MANUAL]` |

### Template — add further experiences here

| Field | Value | Source |
|---|---|---|
| Name | **[NEEDS INPUT]** | `[MANUAL]` |
| What it is | **[NEEDS INPUT]** | `[MANUAL]` |
| Duration | **[NEEDS INPUT]** | `[MANUAL]` |
| Price per person | **[NEEDS INPUT]** | `[MANUAL]` |
| Capacity | **[NEEDS INPUT]** | `[MANUAL]` |
| When available | **[NEEDS INPUT]** | `[MANUAL]` |
| Who leads it | **[NEEDS INPUT]** | `[MANUAL]` |
| What makes it worth paying for | **[NEEDS INPUT]** | `[MANUAL]` |
| Booking required | **[NEEDS INPUT]** | `[MANUAL]` |
| Included in room rate | **[NEEDS INPUT]** | `[MANUAL]` |

---

## 4. Facilities and Common Areas

Common areas and facilities are a central part of the premium value proposition — "great common areas" is explicitly part of the business ambition. These need specifying so they can be sold, not just listed.

| Facility | Detail | Source |
|---|---|---|
| Terrace | **[NEEDS INPUT]** — capacity, hours, view, furniture, atmosphere | `[MANUAL]` |
| Bar | **[NEEDS INPUT]** — offering, hours, self-serve or staffed | `[MANUAL]` |
| Breakfast | **[NEEDS INPUT]** — included in rate or extra? Format (continental, cooked, buffet)? Hours? Price if extra? | `[MANUAL]` |
| Common room / lounge | **[NEEDS INPUT]** — exists? Size? What's there? | `[MANUAL]` |
| Kitchen for guests | **[NEEDS INPUT]** — available to hostel guests? | `[MANUAL]` |
| Lockers | **[NEEDS INPUT]** — size, padlock required? | `[MANUAL]` |
| Linen and towels | **[NEEDS INPUT]** — included or hire? | `[MANUAL]` |
| Wi-Fi | **[NEEDS INPUT]** — speed, coverage, any limitations | `[MANUAL]` |
| Events | **[NEEDS INPUT]** — what events run, how often, hosted by whom | `[MANUAL]` |

---

## 5. Service

Service is explicitly part of the premium proposition — "great staff and service" is core to the ambition. These should be specified so they can be delivered consistently and described honestly.

| Dimension | Detail | Source |
|---|---|---|
| Reception hours | **[NEEDS INPUT]** | `[MANUAL]` |
| Languages spoken | **[NEEDS INPUT]** | `[MANUAL]` |
| Local knowledge offer | **[NEEDS INPUT]** — what does reception actively offer guests? Day trips, restaurant bookings, transport? | `[MANUAL]` |
| Check-in time | **[NEEDS INPUT]** | `[MANUAL]` |
| Check-out time | **[NEEDS INPUT]** | `[MANUAL]` |
| Late check-out | **[NEEDS INPUT]** — available? At cost? | `[MANUAL]` |
| Luggage storage | **[NEEDS INPUT]** — before check-in / after check-out? | `[MANUAL]` |
| Response time (messaging) | **[NEEDS INPUT]** — WhatsApp / email SLA | `[MANUAL]` |

---

## 6. Channels and Booking

| Channel | Hostel | Apartment | Source |
|---|---|---|---|
| Hostelworld (OTA) | Yes | No | `[BKG-COM]` / `[MANUAL]` |
| Booking.com (OTA) | Yes | Yes | `[BKG-COM]` |
| Direct (Brikette website) | Yes — Octorate deep-link | Yes — hostel-positano.com/apartment/ | `[MANUAL]` |
| StepFree Positano domain | No | stepfreepositano.com (redirects; pending registration) | `[MANUAL]` |
| WhatsApp | Secondary CTA | Secondary CTA for high-intent | `[MANUAL]` |

OTA share of bookings (historical baseline): 65–78% of bookings. Source: `[DERIVED]` (calculated from booking records). Direct share target: 27% by day 60–90 of the startup loop.

---

## 7. Audience

### Hostel guest

| Dimension | Detail | Source |
|---|---|---|
| Age | 18–35 (99% under 35) | `[MANUAL]` / `[DERIVED]` from booking data |
| Gender | 99% female; 60% of users in 18-25 female demographic | `[MANUAL]` / `[DERIVED]` from booking data |
| Behaviour | Mobile-first, emotional and experience-driven decision-making, not price-comparison shopping | `[MANUAL]` |
| Context | Travelling in Positano, looking for a social hostel stay with local knowledge and experience | `[MANUAL]` |

### Apartment guest

| Dimension | Detail | Source |
|---|---|---|
| Primary | Couples | `[MANUAL]` |
| Distinction from hostel | Older, less price-sensitive, seeking privacy and home-like feel | `[MANUAL]` |
| Poor fit — mobility-limited | Interior stairs | `[MANUAL]` |
| Poor fit — light sleepers | Terrace noise | `[MANUAL]` |
| Poor fit — hostel-averse | Shared facilities; honest positioning needed | `[MANUAL]` |

---

## 8. Pricing Summary

| Product | Low season | Mid season | High season | Notes | Source |
|---|---|---|---|---|---|
| Dorm bed | **[NEEDS INPUT]** | **[NEEDS INPUT]** | **[NEEDS INPUT]** | Per night, per person | `[OCT-CAL]` live; `[OCT-CFG]` rate plan structure |
| Private room | **[NEEDS INPUT]** | **[NEEDS INPUT]** | **[NEEDS INPUT]** | Per night | `[OCT-CAL]` live; `[OCT-CFG]` rate plan structure |
| Apartment (non-refund) | EUR 265 (Mar) | EUR 400 (Apr) | EUR 495 (May+) | Per night | `[OCT-CFG]` rate plan; `[OCT-CAL]` live |
| Apartment (flex) | EUR 450 (Mar) | EUR 500 (Apr) | EUR 550 (May+) | Per night | `[OCT-CFG]` rate plan; `[OCT-CAL]` live |
| Breakfast | **[NEEDS INPUT]** | | | If not included | `[MANUAL]` |
| Experiences | **[NEEDS INPUT]** | | | Per person per experience | `[MANUAL]` |

ADR (average daily rate) and RevPAR are `[DERIVED]` — calculated at S3 Forecast / S10 Weekly Decision from `[OCT-CAL]` booking data and `[OCT-CFG]` capacity. Not stored here.

---

## 9. What this spec unlocks

Once the **[NEEDS INPUT]** gaps above are filled:

- **S2B Offer Design** can run properly — the offer artifact needs to know what is actually being sold
- **OTA listing copy** can be written at the room level, not just at the hostel level
- **Direct site content** can sell specific rooms and experiences rather than generic hostel benefits
- **Pricing decisions** can be made per product rather than based only on aggregate booking value
- **Per-product performance tracking** becomes possible — occupancy rate and revenue by room type, experience attach rate, apartment conversion rate
