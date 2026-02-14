---
Type: Reference
Status: Active
Domain: Business-OS
Last-reviewed: 2026-02-13
Relates-to charter: docs/business-os/business-os-charter.md
---

# Growth Metrics Adapter Contract (v1)

## Purpose

Define the v1 source-of-truth and ownership contract for `getWeeklyGrowthMetrics(shopId, weekRange)` used by growth-accounting integration at S10.

This contract resolves GAK-05 ambiguity and is the authoritative input shape for GAK-06.

## Ownership Decision

- Adapter owner: `scripts/src/startup-loop/growth-metrics-adapter.ts` (new in GAK-06).
- Primary caller: `scripts/src/startup-loop/s10-growth-accounting.ts` (new in GAK-06).
- Existing source readers reused by adapter:
  - `scripts/src/startup-loop/funnel-metrics-extractor.ts` style pointer traversal.
  - S3 target source: `stage-result-S3.json` -> `artifacts.forecast`.
  - S10 actual source: `stage-result-S10.json` -> `artifacts.readout`.
  - Events source: `events.jsonl` (for completeness flags and blocked-stage context).

Rationale:
- Keeps growth-specific mapping logic out of diagnosis modules.
- Reuses existing startup-loop artifact conventions and avoids duplicate filesystem traversal logic in S10.

## v1 Input Sources

- S3 forecast (`targets`): planning targets for primitive metrics.
- S10 readout (`actuals`): realized weekly metrics.
- S10 readout (`targets`): derived metric targets when present.
- Events ledger: supplementary context only (not used for numeric stage scoring in v1).

## Canonical Output Contract

`getWeeklyGrowthMetrics` returns a deterministic payload consumable by `evaluateGrowthLedger`:

```ts
interface WeeklyGrowthMetrics {
  run_id: string;
  business: string;
  period: {
    period_id: string;
    start_date: string;
    end_date: string;
    forecast_id: string;
  };
  metrics: Record<
    "acquisition" | "activation" | "revenue" | "retention" | "referral",
    Record<string, number | null>
  >;
  data_quality: {
    missing_metrics: string[];
    assumptions: string[];
  };
  sources: {
    s3_forecast: string | null;
    s10_readout: string | null;
    events: string | null;
  };
}
```

## Field Ownership and Mapping (v1)

### Acquisition

- `blended_cac_eur_cents`
  - Source-of-truth: `s10_readout.actuals.cac` (major-unit EUR).
  - Adapter-owned transform: `round(cac * 100)`.
- `new_customers_count`
  - Source-of-truth priority:
    1. `s10_readout.actuals.new_customers` (if present)
    2. fallback `s10_readout.actuals.orders`
  - Adapter owns fallback assumption.
- `spend_eur_cents`
  - Source-of-truth priority:
    1. `s10_readout.actuals.spend` (major-unit EUR, if present)
    2. fallback derive from `cac * new_customers_count` (major-unit EUR -> cents)
  - Adapter owns derivation.

### Activation

- `sessions_count`
  - Source-of-truth: `s10_readout.actuals.traffic`.
- `orders_count`
  - Source-of-truth: `s10_readout.actuals.orders`.
- `sitewide_cvr_bps`
  - Source-of-truth priority:
    1. `s10_readout.actuals.cvr` -> `round(cvr * 10000)`
    2. fallback derive from `orders_count / sessions_count` -> basis points.
  - Adapter owns normalization/derivation.

### Revenue

- `gross_revenue_eur_cents`
  - Source-of-truth: `s10_readout.actuals.revenue` (major-unit EUR -> cents).
- `orders_count`
  - Source-of-truth: `s10_readout.actuals.orders`.
- `aov_eur_cents`
  - Source-of-truth priority:
    1. `s10_readout.actuals.aov` (major-unit EUR -> cents)
    2. fallback derive from `gross_revenue_eur_cents / orders_count`.
  - Adapter owns normalization/derivation.

### Retention

- `orders_shipped_count`, `returned_orders_count`, `return_rate_30d_bps`
  - v1 status: `null` unless explicit readout fields exist.
  - Default behavior: emit `null` and record missing metrics in `data_quality`.

### Referral

- `referral_sessions_count`, `referral_orders_count`, `referral_conversion_rate_bps`
  - v1 status: `null` unless explicit readout fields exist.
  - Default behavior: emit `null` and record missing metrics in `data_quality`.

## Fallback Semantics

- Missing source file (`stage-result-S3.json`, `stage-result-S10.json`, pointed artifacts):
  - Adapter returns partial payload with `sources.* = null` where missing.
  - Missing mapped metrics are `null`.
- Missing metric values:
  - Mapped field becomes `null`.
  - Field key is appended to `data_quality.missing_metrics`.
- Assumption path used (for example `new_customers_count <- orders_count`):
  - Record explicit note in `data_quality.assumptions`.
- Growth evaluator behavior (already implemented):
  - threshold metric `null` -> `not_tracked`
  - denominator missing/too small -> `insufficient_data`

## Test Fixture Shape for GAK-06

Use this fixture shape for integration tests:

```json
{
  "run_id": "SFS-HEAD-20260213-1200",
  "business": "HEAD",
  "period": {
    "period_id": "2026-W07",
    "start_date": "2026-02-09",
    "end_date": "2026-02-15",
    "forecast_id": "HEAD-FC-2026Q1"
  },
  "metrics": {
    "acquisition": {
      "spend_eur_cents": 958500,
      "new_customers_count": 213,
      "blended_cac_eur_cents": 4500
    },
    "activation": {
      "sessions_count": 8500,
      "orders_count": 213,
      "sitewide_cvr_bps": 250
    },
    "revenue": {
      "gross_revenue_eur_cents": 3088500,
      "orders_count": 213,
      "aov_eur_cents": 14500
    },
    "retention": {
      "orders_shipped_count": null,
      "returned_orders_count": null,
      "return_rate_30d_bps": null
    },
    "referral": {
      "referral_sessions_count": null,
      "referral_orders_count": null,
      "referral_conversion_rate_bps": null
    }
  },
  "data_quality": {
    "missing_metrics": [
      "retention.orders_shipped_count",
      "retention.returned_orders_count",
      "retention.return_rate_30d_bps",
      "referral.referral_sessions_count",
      "referral.referral_orders_count",
      "referral.referral_conversion_rate_bps"
    ],
    "assumptions": [
      "acquisition.new_customers_count mapped from actuals.orders"
    ]
  },
  "sources": {
    "s3_forecast": "stages/S3/forecast.json",
    "s10_readout": "stages/S10/readout.json",
    "events": "events.jsonl"
  }
}
```

## Out of Scope for v1

- Reconstructing retention/referral from external systems.
- Cross-run smoothing/rolling windows in adapter layer.
- Non-EUR currency conversion.

