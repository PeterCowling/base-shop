---
Type: Reference
Status: Draft
Domain: Business-OS
Last-reviewed: 2026-02-13
Relates-to charter: docs/business-os/business-os-charter.md
---

# Growth Ledger Schema

## Scope

This document defines the v1 canonical growth-accounting ledger for startup-loop decisioning. The immutable audit trail remains in startup-loop events and stage results; `growth-ledger.json` is the current-state materialization.

## Stage Model (AARRR)

| Stage | Blocking mode (v1 default) | Purpose |
|---|---|---|
| acquisition | `always` | Demand efficiency and CAC control |
| activation | `always` | Funnel conversion quality |
| revenue | `always` | Commercial viability |
| retention | `after_valid` | Post-purchase quality once sample is sufficient |
| referral | `never` | Advisory-only growth loop signal in v1 |

## Numeric Determinism

- Currency metrics use integer minor units (`*_eur_cents`).
- Rate metrics use integer basis points (`*_bps`).
- Count metrics use integer counts (`*_count`).
- Threshold fields are integers only (`green_threshold`, `red_threshold`, `validity_min_denominator`).

## Required Status Values

- `green`
- `yellow`
- `red`
- `insufficient_data`
- `not_tracked`

## Threshold Contract

Each threshold entry is:

```json
{
  "metric": "sitewide_cvr_bps",
  "unit": "bps",
  "direction": "higher",
  "green_threshold": 140,
  "red_threshold": 90,
  "validity_min_denominator": 500,
  "denominator_metric": "sessions_count"
}
```

Rules:
- `direction=higher`: `green_threshold >= red_threshold`
- `direction=lower`: `green_threshold <= red_threshold`
- Rate thresholds (`bps`) require positive `validity_min_denominator`.

## Threshold Set Immutability

Threshold sets are content addressed:

- `threshold_set_hash = sha256:<64-hex-digest>` over canonical JSON of stage thresholds.
- `threshold_set_id = gts_<first-12-hex-of-digest>`.

Any threshold change produces a new hash and ID.

## Ledger Top-Level Shape

```json
{
  "schema_version": 1,
  "ledger_revision": 3,
  "business": "HEAD",
  "period": {
    "period_id": "2026-W07",
    "start_date": "2026-02-09",
    "end_date": "2026-02-15",
    "forecast_id": "HEAD-FC-2026Q1"
  },
  "threshold_set_id": "gts_ab12cd34ef56",
  "threshold_set_hash": "sha256:...",
  "threshold_locked_at": "2026-02-13T00:00:00.000Z",
  "updated_at": "2026-02-13T00:00:00.000Z",
  "stages": {
    "acquisition": { "status": "yellow", "policy": { "blocking_mode": "always" }, "metrics": {}, "reasons": [] },
    "activation": { "status": "green", "policy": { "blocking_mode": "always" }, "metrics": {}, "reasons": [] },
    "revenue": { "status": "green", "policy": { "blocking_mode": "always" }, "metrics": {}, "reasons": [] },
    "retention": { "status": "insufficient_data", "policy": { "blocking_mode": "after_valid" }, "metrics": {}, "reasons": [] },
    "referral": { "status": "not_tracked", "policy": { "blocking_mode": "never" }, "metrics": {}, "reasons": [] }
  }
}
```

## HEAD/PET Compatibility Notes

The schema supports active guardrails from:

- `docs/business-os/strategy/HEAD/plan.user.md`:
  - blended CAC thresholds (EUR 13 target / EUR 15 hard ceiling)
  - CVR floor (`0.9%`) and target (`1.4%`) as basis points
  - payment success (`>=97%`) and return-rate (`<=7%`) denominator-gated thresholds
- `docs/business-os/strategy/PET/italy-90-day-launch-forecast-v2.user.md`:
  - week-2 CVR (`>=1.2%`)
  - blended CAC bound relative to contribution (represented via stage thresholds + policy)
  - refund/payment reliability denominators
