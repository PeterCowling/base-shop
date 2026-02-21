---
Type: Demand-Evidence-Pack
Status: Active
Business: BRIK
Schema-Version: 1.0.0
Created: 2026-02-18
Last-updated: 2026-02-18
Owner: Pete
Gate-Assessment: GATE-S6B-STRAT-01=PASS / GATE-S6B-ACT-01=HOLD
Source-Intelligence: docs/business-os/market-research/BRIK/2026-02-15-market-intelligence.user.md
---

# BRIK Demand Evidence Pack

## Demand Signal Summary

BRIK is an established hospitality business with confirmed historical demand. The primary demand
evidence is internal booking history: **1,906 bookings, EUR 514,800.23 net value, 12-month 2025
season**. This DEP documents the existing evidence state, objection patterns from operator
knowledge, and identifies what formal capture is still required before spend authorization.

---

## Pass-Floor Self-Assessment

| Criterion | Status | Notes |
|---|---|---|
| ≥2 message variants tested | Partial | Two channel surfaces in market (direct site + OTA listings); formal impression-level tracking per variant not yet active for 2026 |
| Every variant has denominator + source_tag | Partial | Booking volumes by channel are a proxy denominator (channel split pending operator CSV export); session-level denominators pending GA4 repair |
| Objection log: ≥5 tagged objections OR none_observed | Pass | 5+ recurring objection patterns documented from 2025 booking history and review sentiment |
| Speed-to-lead: sample_size ≥1 | Hold | Inquiries handled manually; formal response-time logging not yet active |

**GATE-S6B-STRAT-01 (strategy design)**: **PASS** — historical demand is confirmed and macro
demand context is strong. Channel strategy design may proceed.

**GATE-S6B-ACT-01 (spend authorization)**: **HOLD** — formal impression-level denominators,
confirmed channel-split booking data, and speed-to-lead formal capture are required before paid
spend activation. See Capture Gaps below.

---

## DEP Record — H-BRIK-DEM-01 (2025 Season Historical Demand)

```yaml
hypothesis_id: H-BRIK-DEM-01
hypothesis_statement: >
  Guests will book accommodation at Hostel Positano (direct + OTA) at current room
  rates and direct-perks offer (best-rate guarantee, complimentary breakfast,
  welcome drink).

capture_window:
  start: "2025-01-01T00:00:00Z"
  end: "2025-12-31T23:59:59Z"
  note: "12-month season; historical booking record. Impression-level tracking pending for 2026."

message_variants:
  - channel: direct_website
    audience_slice: inbound_leisure_travelers_positano_amalfi_coast
    asset_ref: https://hostel-positano.com/en/rooms/
    timestamp: "2025-01-01T00:00:00Z"
    note: >
      Positioning: best-rate guarantee + breakfast + welcome drink. Strong review proof
      visible (Hostelworld 9.3/10, 2,757 reviews; Booking.com 9.0/10, 579 reviews).
      Direct share rose to 20.5% YoY (+6.4pp), confirming direct channel conversion
      traction despite overall volume decline.

  - channel: ota_distribution
    audience_slice: inbound_leisure_travelers_positano_amalfi_coast
    asset_ref: https://www.hostelworld.com/ (property listing)
    timestamp: "2025-01-01T00:00:00Z"
    note: >
      Includes Booking.com, Hostelworld, and other OTA channels. Commission-based;
      review-anchored; comparison-mode discovery. Estimated ~79.5% of 2025 booking
      volume. Channel-level split pending CSV export from booking management system.

denominators:
  direct_website:
    bookings: 391
    note: >
      Estimated at 20.5% direct share of 1,906 total bookings (2025 season). Not
      confirmed by channel-split CSV export — operator must verify.
    source_tag: internal_booking_management_2025_season
  ota_distribution:
    bookings: 1515
    note: >
      Estimated at ~79.5% OTA share; channel-level OTA split (Booking.com vs
      Hostelworld vs other) not yet decomposed. Pending operator channel export.
    source_tag: internal_booking_management_2025_season

intent_events:
  - event_type: booking_confirmed
    source_tag: internal_booking_management_2025_season
    count: 1906
    timestamp: "2025-12-31T23:59:59Z"
    note: >
      Total confirmed bookings across all channels. EUR 514,800.23 net value.
      EUR 270.09 average net per booking. YoY change: -299 bookings (-13.6% volume),
      -EUR 92,297.23 net value (-15.2%). Decline concentrated in April, June, July.

objection_log:
  - text: "Price/fee opacity — what is the tourist tax, when is it paid, and is it in the total?"
    frequency_count: 8
    source: operator_booking_support_and_review_sentiment_2025
  - text: "Cancellation confusion — unclear difference between refundable and non-refundable; unexpected EUR 5 admin fee"
    frequency_count: 6
    source: operator_booking_support_and_review_sentiment_2025
  - text: "Direct booking confidence — why book direct vs OTA? What guarantee exists?"
    frequency_count: 5
    source: operator_observation_booking_history_2025
  - text: "Security deposit uncertainty — how much is held, when is it released?"
    frequency_count: 4
    source: operator_booking_support_and_review_sentiment_2025
  - text: "Location/access from village center and beach — distance, walkability, transport required?"
    frequency_count: 5
    source: operator_observation_reviews_hostelworld_2025
  operator_notes: >
    Objection frequencies are operator estimates from booking support contacts and
    Hostelworld/Booking.com review themes; not from formal intercept surveys.
    Sample covers 2025 booking season (1,906 total bookings).

speed_to_lead:
  median_minutes_to_first_response: 0
  sample_size: 0
  note: >
    Formal speed-to-lead logging not yet active. Pete handles email and WhatsApp
    inquiries manually. Capture protocol to be established; target formal sample_size
    ≥5 before GATE-S6B-ACT-01.

operator_notes: >
  This DEP documents confirmed historical demand evidence for BRIK and satisfies
  GATE-S6B-STRAT-01 (channel strategy design may proceed). It does NOT pass the full
  schema pass-floor for GATE-S6B-ACT-01 (spend authorization) — formal impression-level
  denominators, confirmed channel-split booking data, and speed-to-lead formal capture
  are required before any paid channel spend is activated.
  Source market intelligence: docs/business-os/market-research/BRIK/2026-02-15-market-intelligence.user.md
```

---

## Macro Demand Context (from Market Intelligence)

Evidence that destination-level demand is not the cause of BRIK's volume decline:

- EU tourism nights: ~3.08B in 2025 (+2% YoY). Source: Eurostat.
- Italy non-resident nights: exceeded 250M in 2024 (+6.8%). Source: ISTAT.
- YoY booking decline is property/channel-specific, not macro-driven. `[inferred | Medium confidence]`

This supports the hypothesis that recovery levers are distribution (OTA) and conversion (direct
site), not demand generation.

---

## Capture Gaps (Required Before GATE-S6B-ACT-01)

| Gap | What's needed | How to capture | Target by |
|---|---|---|---|
| Bookings by channel (confirmed split) | Direct vs each OTA channel, with net value | Export from Octorate/PMS; save as `docs/business-os/market-research/BRIK/data/2026-02-15-bookings-by-channel.csv` | Pre-spend activation |
| Session-level denominators per variant | Direct: visits/sessions tied to booking start; OTA: OTA extranet impressions/clicks | GA4 (after measurement repair) + OTA extranet exports | Pre-spend activation |
| Formal objection log | Verbatim objections with frequency counts from classified tickets | Review Octorate inquiry records; tag by type | Pre-spend activation |
| Speed-to-lead (formal) | Median response minutes to first inquiry reply; sample_size ≥5 | Log timestamp on inquiry receipt + first reply for 2 weeks | Week-2 KPCS action plan |

---

## References

- Internal booking history (2025 season): internal_booking_management_2025_season
- Market intelligence: `docs/business-os/market-research/BRIK/2026-02-15-market-intelligence.user.md`
- Reviews (observed 2026-02-15): Hostelworld 9.3/10 (2,757 reviews); Booking.com 9.0/10 (579 reviews)
- GATE-S6B-STRAT-01 definition: `docs/business-os/../.claude/skills/startup-loop/modules/cmd-advance.md`
- DEP schema: `docs/business-os/startup-loop/demand-evidence-pack-schema.md`
