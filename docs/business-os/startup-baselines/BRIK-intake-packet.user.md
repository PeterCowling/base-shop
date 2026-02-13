---
Type: Startup-Intake-Packet
Status: Active
Business: BRIK
Created: 2026-02-12
Updated: 2026-02-12
Last-reviewed: 2026-02-12
Owner: Pete
Source-Plan: docs/business-os/strategy/BRIK/plan.user.md
---

# BRIK Intake Packet

## A) Intake Summary

- Business idea: multilingual e-commerce platform for hostel bookings and travel experiences (`observed`).
- Business is already operating and has substantial product and content footprint (`observed`).
- Core current execution lane includes reception infrastructure and dashboard/operations unification (`observed`).
- Critical gap remains analytics/visibility baseline (GA/Search Console not fully configured) (`observed`).
- Launch-surface mode: `website-live` (`inferred` from existing production/staging footprint).
- Immediate risk is decision-making without measured conversion and traffic data (`observed`).

## B) Business and Product Packet

| Field | Value | Tag |
|---|---|---|
| Business code | BRIK | observed |
| Business name | Brikette | observed |
| Region | Multi-locale (18 locales in current content footprint) | observed |
| Core offer | Hostel bookings + travel experience commerce | observed |
| Current app surfaces | `brikette`, `reception`, `prime`, `brikette-scripts` | observed |
| Launch-surface mode | website-live | inferred |

## C) ICP and Channel Packet

| Field | Value | Tag |
|---|---|---|
| Primary ICP (current) | Travelers booking hostel stays/experiences | inferred |
| Secondary ICP | On-site operations and reception staff workflows | inferred |
| Planned channels | Direct website and content-led acquisition | observed/inferred |
| Support expectation | Reception and booking operational continuity | inferred |

## D) Constraints and Assumptions Register

| Item | Type | Evidence / note | Confidence |
|---|---|---|---|
| Analytics baseline is currently missing | observed | BRIK plan calls out no GA measurement baseline and no Search Console setup | High |
| Content footprint is large and cross-locale | observed | Plan references 168+ guides across 18 locales | High |
| Reception app stability is an active execution risk | observed | Plan risk register includes reception stability concerns | High |
| Growth decisions should be measurement-led | inferred | Current risk profile shows visibility/data as critical blocker | High |

## E) Draft Outcome Contract

- Outcome statement: Establish measurable BRIK conversion and traffic baseline, then improve booking conversion and operational reliability with weekly decision cadence.
- Baseline:
  - MAU: not measured
  - booking conversion rate: not measured
  - guide pageviews: not measured
  - reception reliability incidents: not baselined
- Target (90 days):
  - analytics stack live and producing reliable weekly KPI reports
  - booking conversion baseline established and improving
  - reception workflow stability tracked with explicit incident/recovery metrics
- By: 2026-05-13
- Owner: Pete
- Leading indicators:
  - sessions/pageviews by locale
  - booking funnel conversion
  - search visibility signals
  - reception issue frequency/time-to-recovery
- Decision link: `DEC-BRIK-01` (whether to scale acquisition/content investments vs stabilize operations first)

## F) Apartment Product Line (StepFree Positano)

New for 2026. Owned apartment adjacent to the hostel, operated by hostel reception staff. Tracked as a BRIK product line (not a separate business).

| Field | Value | Tag |
|---|---|---|
| Product name | StepFree Chiesa Nuova | observed |
| Brand name | StepFree Positano | observed |
| Location | Chiesa Nuova, Positano, Amalfi Coast | observed |
| Property type | Apartment (whole unit), 100sqm | observed |
| Capacity | 4 guests (double bed upstairs + sofa bed downstairs) | observed |
| Bathrooms | 2 | observed |
| Key USP | Step-free arrival from street to entrance (rare in Positano) | observed |
| Secondary USP | Homeliness — not a hotel, a home | observed |
| Interior reality | Split-level with internal stairs between living area and bedroom | observed |
| Noise reality | Some road + hostel terrace noise; quiet hours from midnight | observed |
| Amenities | Full kitchen, WiFi, AC, TV, hairdryer, washer/dryer, dining area | observed |
| Channel manager | Octorate (shared with hostel) | observed |
| Current listing | Booking.com only | observed |
| Pricing: early Mar | €265 (non-refund) – €450 (flex) | observed |
| Pricing: Apr | €400 (non-refund) – €500 (flex) | observed |
| Pricing: May onwards | €495 (non-refund) – €550 (flex) | observed |
| 2026 availability | Completely open — first season | observed |
| Target guest | Couples (distinct from hostel demographic) | observed |
| Content host | hostel-positano.com/apartment/... | observed |
| Redirect domain | stepfreepositano.com (pending registration) | observed |
| Revenue architecture | Dual-intent landing pages with Fit Check truth layer | observed |
| Strategy doc | docs/business-os/strategy/BRIK/2026-02-12-apartment-revenue-architecture.user.md | observed |

### Apartment open items

| Item | Owner | Priority |
|---|---|---|
| Register stepfreepositano.com | Pete | high |
| Add apartment to Octorate; get rate plan IDs (nr + flex) | Pete | high |
| Film street-to-door proof video | Pete | high |
| Interior photography | Pete | high |
| Noise mitigation details (double glazing, shutters?) | Pete | high |
| Internal stair details (count, handrail, steepness) | Pete | high |
| Reception hours for apartment guests | Pete | medium |
| Which hostel amenities available to apartment guests? | Pete | medium |

## G) Missing-Data Checklist (to progress S1/S3)

| Missing field | Why needed | Owner | Priority |
|---|---|---|---|
| Locked outcome contract fields in canonical plan | Needed for objective prioritization and gate decisions | Pete | critical |
| Confirmed analytics instrumentation status (GA/Search Console) | Needed for baseline and weekly decisioning | Pete | critical |
| Booking funnel baseline metrics by channel/locale | Needed to define conversion targets and pivots | Pete | high |
| Reception reliability baseline and SLA definition | Needed for ops-risk decisioning | Pete | high |
| Market intelligence pack for BRIK | Needed for external benchmark refresh | Pete | medium |
| Site-upgrade brief for BRIK | Needed for structured web UX backlog synthesis | Pete | medium |

## Priors (Machine)

Last updated: 2026-02-13 12:00 UTC

```json
[
  {
    "id": "risk.analytics_baseline_missing",
    "type": "risk",
    "statement": "Analytics baseline is currently missing (no GA measurement baseline, no Search Console setup)",
    "confidence": 0.95,
    "last_updated": "2026-02-12T00:00:00Z",
    "evidence": ["BRIK plan explicitly calls out this gap"]
  },
  {
    "id": "risk.reception_stability",
    "type": "risk",
    "statement": "Reception app stability is an active execution risk",
    "confidence": 0.85,
    "last_updated": "2026-02-12T00:00:00Z",
    "evidence": ["Plan risk register includes reception stability concerns"]
  },
  {
    "id": "assumption.measurement_led_growth",
    "type": "assumption",
    "statement": "Growth decisions should be measurement-led",
    "confidence": 0.9,
    "last_updated": "2026-02-12T00:00:00Z",
    "evidence": ["Current risk profile shows visibility/data as critical blocker"]
  },
  {
    "id": "apartment.usp.step_free_arrival",
    "type": "assumption",
    "statement": "Step-free arrival from street to entrance is rare USP in Positano",
    "confidence": 0.9,
    "last_updated": "2026-02-12T00:00:00Z",
    "evidence": ["Product definition and market positioning"]
  },
  {
    "id": "apartment.pricing.may_onwards_non_refund",
    "type": "target",
    "statement": "Apartment non-refundable pricing for May onwards is EUR 495",
    "confidence": 0.8,
    "value": 495,
    "unit": "EUR",
    "last_updated": "2026-02-12T00:00:00Z",
    "evidence": ["Observed pricing structure"]
  }
]
```
