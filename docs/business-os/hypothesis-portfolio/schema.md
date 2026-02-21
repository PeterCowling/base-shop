---
Type: Reference
Status: Active
Domain: Business OS
Last-reviewed: 2026-02-13
---

# Hypothesis Portfolio Schema (v1)

## Purpose

Define the canonical hypothesis and portfolio metadata schema used by the Hypothesis Portfolio Manager. This is the source of truth for:

- hypothesis persistence shape,
- expected-value (EV) semantics,
- lifecycle invariants,
- ranking eligibility and blocked reasons.

## Value Semantics (Canonical)

- `upside_estimate`:
  - Gross incremental value if the hypothesis is true over `value_horizon_days`.
- `downside_estimate`:
  - Gross incremental harm if the hypothesis is false over `value_horizon_days`.
  - Must not include always-incurred run costs.
- Always-incurred run costs:
  - `required_spend` (cash),
  - `required_effort_days` converted to cash via `loaded_cost_per_person_day`.
- `effort_cost`:
  - `required_effort_days * loaded_cost_per_person_day`.
- Expected value formula:
  - `EV = P(success) * upside_estimate - P(failure) * downside_estimate - required_spend - effort_cost`.

## Monetary Eligibility Rule (v1)

- EV ranking is monetary-only in v1.
- `value_unit` must be USD-denominated and integrated over the selected horizon.
- Non-monetary units (for example `SIGNUPS`) are storable but blocked from EV ranking with:
  - `non_monetary_unit_requires_conversion`.
- Rate-like units (for example `USD_MRR`) are blocked from EV ranking unless explicitly converted upstream.

## Hypothesis Entity Schema

Required fields:

- `id: string`
  - Canonical hypothesis identifier.
  - Must map 1:1 to Agent idea entity ID in storage adapters.
- `hypothesis_key: string`
  - Human-readable display key, format `<BIZ>-HYP-<NNN>`.
- `business: string`
- `title: string`
- `hypothesis_type: "market" | "offer" | "channel" | "product" | "pricing" | "operations"`
- `prior_confidence: number`
  - Range `0..100`.
- `value_unit: string`
  - USD monetary value units only for EV eligibility.
- `value_horizon_days: number`
  - Positive integer.
- `upside_estimate: number`
- `downside_estimate: number`
- `required_spend: number`
  - `>= 0`.
- `required_effort_days: number`
  - `>= 0`.
- `dependency_hypothesis_ids: string[]`
  - Canonical ID references.
- `dependency_card_ids: string[]`
- `stopping_rule: string`
- `status: "draft" | "active" | "stopped" | "completed" | "archived"`
- `created_date: string`
  - ISO-8601 timestamp.
- `owner: string`

Optional fields:

- `hypothesis_uuid?: string`
- `primary_metric_unit?: string`
- `detection_window_days?: number | null`
  - Nullable if unknown.
- `activated_date?: string`
- `stopped_date?: string`
- `completed_date?: string`
- `outcome?: "success" | "failure" | "inconclusive"`
- `outcome_date?: string`
  - Defaults to `completed_date` when completed, else `stopped_date` when stopped.
- `result_summary?: string`
- `observed_metric?: string`
- `observed_uplift?: number`
- `activation_override?: boolean`
- `activation_override_reason?: string`
- `activation_override_at?: string`
- `activation_override_by?: string`

## Lifecycle Invariants

- `status = "active"` requires `activated_date`.
- `status = "stopped"` requires `stopped_date`.
- `status = "completed"` requires `completed_date`.
- `activation_override = true` requires:
  - `activation_override_reason`,
  - `activation_override_at`,
  - `activation_override_by`.

## Portfolio Metadata Schema

Required fields:

- `max_concurrent_experiments: number`
  - Default `3`.
- `monthly_experiment_budget: number`
  - Default `5000`.
- `budget_timezone: string`
  - IANA timezone (default `Europe/Rome`).
- `default_value_unit: string`
  - Canonical portfolio ranking unit.
- `default_value_horizon_days: number`
  - Canonical ranking horizon.
- `loaded_cost_per_person_day: number`
- `ev_score_weight: number`
  - Default `0.60`.
- `time_score_weight: number`
  - Default `0.25`.
- `cost_score_weight: number`
  - Default `0.15`.
- `default_detection_window_days: number`

Optional fields:

- `risk_tolerance?: "low" | "medium" | "high"`
- `max_loss_if_false_per_experiment?: number`
- `ev_normalization?: "winsorized_p10_p90_nearest_rank"`
- `cost_normalization?: "winsorized_p10_p90_nearest_rank"`

Normalization policy:

- For population size `N >= 10`:
  - winsorize at p10/p90 using nearest-rank quantiles, then clamp to `[0,1]`.
- For `N < 10`:
  - use deterministic fallback min-max normalization.
- For flat distributions:
  - return stable fallback values (no divide-by-zero behavior).

## Constraint Schema

- `max_concurrent`:
  - block new activation when active count is at cap.
- `budget_cap`:
  - monthly cap enforced by `activated_date` attribution in `budget_timezone`.
- `risk_cap`:
  - block if `downside_estimate + required_spend + effort_cost` exceeds cap.
- `dependency_gate`:
  - block if required hypothesis/card dependencies are unresolved.

## Domain and Ranking Guards

- Ranking domain is hypotheses with:
  - `status in ("draft", "active")`,
  - `value_unit` and `value_horizon_days` matching portfolio defaults.
- Domain mismatches are returned as blocked, not dropped:
  - `unit_horizon_mismatch`.
- If ranking defaults are missing and multiple EV-eligible domains exist:
  - hard error `portfolio_default_domain_required`.

## Validation Examples

### Valid Hypothesis (Pass)

```yaml
id: BRIK-IDEA-0042
hypothesis_key: BRIK-HYP-042
business: BRIK
title: Terrace breakfast upsell improves booking margin
hypothesis_type: offer
prior_confidence: 60
value_unit: USD_GROSS_PROFIT
value_horizon_days: 90
upside_estimate: 15000
downside_estimate: 2000
detection_window_days: 14
required_spend: 500
required_effort_days: 2
dependency_hypothesis_ids: []
dependency_card_ids: []
stopping_rule: Stop if attach rate remains below 2% after 7 days
status: draft
created_date: 2026-02-13T09:00:00Z
owner: pete
```

### Invalid Hypothesis (Fail)

```yaml
id: BRIK-IDEA-0099
hypothesis_key: bad-key
business: BRIK
title: Invalid example
hypothesis_type: pricing
prior_confidence: 140
value_unit: SIGNUPS
value_horizon_days: 0
upside_estimate: 4000
downside_estimate: 5000
required_spend: -10
required_effort_days: -1
dependency_hypothesis_ids: []
dependency_card_ids: []
stopping_rule: TBD
status: active
created_date: 2026-02-13
owner: pete
```

Expected validation failures:

- `prior_confidence_out_of_range`
- `non_monetary_unit_requires_conversion`
- `value_horizon_days_must_be_positive`
- `required_spend_negative`
- `required_effort_days_negative`
- `active_requires_activated_date`

