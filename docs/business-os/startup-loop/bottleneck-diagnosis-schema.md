---
Type: Reference
Status: Canonical
Domain: Business-OS
Last-reviewed: 2026-02-13
---

# Bottleneck Diagnosis Schema

Canonical schemas for bottleneck diagnosis artifacts: `bottleneck-diagnosis.json` (per-run snapshot), `bottleneck-history.jsonl` (append-only ledger), and `replan-trigger.json` (lifecycle state). All three are control-plane-owned files.

**Decision reference:** `docs/plans/bottleneck-locator-plan.md` (BL-01, DL-02, DL-03)

## 1) Purpose

The bottleneck diagnosis system identifies the highest-leverage growth constraint after S10 completion (typically weekly). It provides deterministic ranking of metric misses, prefers upstream drivers over downstream symptoms, and writes a guarded replan signal when the same constraint persists across N consecutive runs.

This is diagnosis + signaling only. It does not execute `/lp-do-replan` automatically.

## 2) Metric Catalog (v1)

| Metric ID | Class | Direction | Default Stage | Candidate Priority |
|---|---|---|---|---|
| `traffic` | primitive | higher_is_better | `SELL-01` | primary |
| `cvr` | primitive | higher_is_better | `S3` | primary |
| `aov` | primitive | higher_is_better | `MARKET-06` | primary |
| `cac` | primitive | lower_is_better | `SELL-01` | primary |
| `orders` | derived | higher_is_better | `S10` | secondary |
| `revenue` | derived | higher_is_better | `S10` | secondary |

### Metric Directionality

- **Higher-is-better metrics** (`traffic`, `cvr`, `aov`, `orders`, `revenue`): Values above target are favorable; values below target represent missed opportunity.
- **Lower-is-better metrics** (`cac`): Values below target are favorable; values above target represent inefficiency.

### Metric-to-Stage Mapping

Each metric has a default stage assignment based on where the constraint is typically addressed:

- `traffic` → `SELL-01` (Channel strategy + GTM)
- `cvr` → `S3` (Forecast / conversion optimization)
- `aov` → `MARKET-06` (Offer design)
- `cac` → `SELL-01` (Channel strategy + GTM)
- `orders` → `S10` (Derived outcome, not actionable as primary)
- `revenue` → `S10` (Derived outcome, not actionable as primary)

## 2A) Business Model Profile Catalog

The base metric catalog (Section 2) applies to all businesses. When a `business_model_profile` is set on the run context, profile-specific metrics are included in the ranking candidate pool alongside base catalog metrics.

### Supported Profiles

| Profile ID | Description |
|---|---|
| `hospitality-direct-booking` | Accommodation businesses targeting direct bookings (no OTA intermediary) |
| `dtc-ecommerce` | Direct-to-consumer ecommerce businesses with online checkout |

### Profile Metric Catalog

Each profile metric has a `candidate_priority`:
- **`primary`**: Competes with all other metrics (base + profile primary) by miss magnitude. These are actionable primitives.
- **`secondary`**: Ranked after all `primary` metrics. Profile secondary metrics are deprioritized when any same-profile primary metric has severity ≥ `moderate` — mirroring the base catalog treatment of `orders` and `revenue` relative to their upstream primitives.

| Metric ID | Profile | Class | Direction | Default Stage | Candidate Priority |
|---|---|---|---|---|---|
| `inquiry_to_quote_rate` | hospitality-direct-booking | primitive | higher_is_better | `S3` | primary |
| `quote_to_booking_rate` | hospitality-direct-booking | primitive | higher_is_better | `SELL-01` | primary |
| `median_response_time` | hospitality-direct-booking | primitive | lower_is_better | `SELL-01` | primary |
| `direct_ota_mix` | hospitality-direct-booking | primitive | higher_is_better | `SELL-01` | secondary |
| `cancellation_rate` | hospitality-direct-booking | derived | lower_is_better | `S10` | secondary |
| `review_velocity` | hospitality-direct-booking | derived | higher_is_better | `S10` | secondary |
| `page_to_atc_rate` | dtc-ecommerce | primitive | higher_is_better | `S3` | primary |
| `checkout_completion_rate` | dtc-ecommerce | primitive | higher_is_better | `S3` | primary |
| `cac_by_cohort` | dtc-ecommerce | primitive | lower_is_better | `SELL-01` | primary |
| `refund_rate` | dtc-ecommerce | derived | lower_is_better | `S10` | secondary |
| `support_load_per_100_orders` | dtc-ecommerce | derived | lower_is_better | `S10` | secondary |
| `repeat_purchase_rate` | dtc-ecommerce | derived | higher_is_better | `S10` | secondary |

### No-Profile Fallback

When `business_model_profile` is null or absent, `profile_funnel_metrics` is empty or absent and behavior is identical to v1: only base catalog metrics are ranked. Existing v1 snapshots without `business_model_profile` are valid and require no migration.

### Constraint Keys for Profile Metrics

Profile metrics use the same constraint key format as base metrics: `<stage>/<metric_id>`.

**Examples:**
- `S3/inquiry_to_quote_rate` — inquiry-to-quote conversion at Forecast stage
- `SELL-01/median_response_time` — response time at Channel strategy stage
- `S3/page_to_atc_rate` — product page-to-add-to-cart at Forecast stage

## 3) Normalized Miss Formula

The `miss` metric is normalized so that **higher values are always worse**, regardless of metric direction:

### Higher-is-better metrics (`traffic`, `cvr`, `aov`, `orders`, `revenue`)

```
miss = max(0, (target - actual) / target)
```

**Example:** Target CVR = 5%, Actual CVR = 3%
```
miss = max(0, (5 - 3) / 5) = 0.40  (40% worse than target)
```

### Lower-is-better metrics (`cac`)

```
miss = max(0, (actual - target) / target)
```

**Example:** Target CAC = $50, Actual CAC = $90
```
miss = max(0, (90 - 50) / 50) = 0.80  (80% worse than target)
```

### Missing or Invalid Data

If `target <= 0`, `target` is null, or `actual` is null, then `miss` is `null` and the metric is excluded from ranking candidates.

## 4) Severity Bands

Severity is classified based on the normalized `miss` value:

| Severity | Threshold | Interpretation |
|---|---|---|
| `critical` | `miss >= 0.50` | 50%+ worse than target — urgent intervention required |
| `moderate` | `0.20 <= miss < 0.50` | 20-50% worse than target — significant gap |
| `minor` | `0.05 <= miss < 0.20` | 5-20% worse than target — opportunity for improvement |
| `none` | `miss < 0.05` | Within 5% of target — no bottleneck |

### No-Bottleneck Condition

`identified_constraint = null` only when:
1. All rank-eligible metrics have severity `none` (`miss < 0.05`), AND
2. No `stage_blocked` constraints exist

## 5) Stage Ordering and Upstream Priority

### Upstream Priority Order

The `upstream_priority_order` defines stage precedence for tie-breaking and multi-block selection. This ordering is derived from startup-loop dependency flow (not stage-ID numeric sorting).

```
ASSESSMENT-01, ASSESSMENT-02, ASSESSMENT-03, ASSESSMENT-04, ASSESSMENT-05, ASSESSMENT-06, ASSESSMENT-07, ASSESSMENT-08, ASSESSMENT-09, ASSESSMENT-10, ASSESSMENT-11, ASSESSMENT, MEASURE-01, MEASURE-02, PRODUCT, PRODUCT-01, MARKET, MARKET-01, MARKET-02, MARKET-03, MARKET-04, MARKET-05, MARKET-06, S3, PRODUCT-02, SELL-01, SELL-02, SELL-03, SELL-04, SELL-05, SELL-06, SELL-07, SELL-08, SELL, S4, S5A, S5B, S6, DO, S9B, S10
```

**Note:** `SELL-01` intentionally precedes `S4` because `S4` (Baseline merge) consumes SELL-01 outputs as dependencies. `ASSESSMENT-01–ASSESSMENT-09` form the conditional problem-first pre-intake sequence; `ASSESSMENT-10–ASSESSMENT-11` are brand profiling stages; `ASSESSMENT` is the container stage (v1.7.0, renamed v1.9.0, consolidated v2.0). `PRODUCT-02` runs as a conditional parallel fan-out sibling of `S3` and `SELL-01` (non-blocking at S4).

### Upstream Attribution Rules

When multiple constraints are present, the system prefers upstream drivers over downstream symptoms:

1. **Orders vs drivers:** If `orders` has the highest miss but `traffic` and `cvr` are available, select the larger miss of `{traffic, cvr}` as primary.
2. **Revenue vs drivers:** If `revenue` has the highest miss but `orders` and `aov` are available, compare `{orders, aov}`:
   - If `orders` is selected and its drivers (`traffic`, `cvr`) exist, apply rule 1 recursively.
   - Otherwise, select between `orders` and `aov` by miss magnitude.

**Rationale:** Derived outcomes (`orders`, `revenue`) are symptoms. Addressing primitive drivers (`traffic`, `cvr`, `aov`, `cac`) is more actionable and leveraged.

3. **Profile secondary deprioritisation:** When a `business_model_profile` is set and at least one profile primary metric has severity ≥ `moderate`, profile secondary metrics are excluded from primary selection (ranked only after all primary metrics, base and profile).

**Example:** For `dtc-ecommerce`, if `page_to_atc_rate` (primary, miss=0.42) and `refund_rate` (secondary, miss=1.25) are both present, `page_to_atc_rate` is selected as primary because it is a profile primary primitive with severity ≥ moderate, and `refund_rate` is a profile secondary derived metric.

## 6) Constraint Signatures

Constraints are identified using stable, deterministic keys:

### Metric Constraint Key

```
<stage>/<metric>
```

**Examples:**
- `S3/cvr` — conversion rate constraint at Forecast stage
- `SELL-01/cac` — customer acquisition cost constraint at Channel strategy stage
- `MARKET-06/aov` — average order value constraint at Offer design stage

### Blocked-Stage Constraint Key

```
<stage>/stage_blocked/<reason_code>
```

**Examples:**
- `S4/stage_blocked/deps_blocked` — Baseline merge blocked due to missing dependencies
- `DO/stage_blocked/data_missing` — Do stage blocked due to missing data
- `DO/stage_blocked/compliance` — Do stage blocked due to compliance review

### Persistence and Trigger Logic

Persistence checks and trigger lifecycle use `constraint_key` values, not free-text reason text. This ensures deterministic comparison across runs.

## 7) Diagnosis Status and Data Quality

### Diagnosis Status

| Status | Condition | Meaning |
|---|---|---|
| `ok` | Rank-eligible metrics exist and primary constraint identified | Normal diagnosis with actionable bottleneck |
| `no_bottleneck` | All rank-eligible metrics have severity `none` and no blocked stage exists | No significant constraint detected |
| `insufficient_data` | No rank-eligible metrics and no blocked stage exists | Cannot diagnose due to missing data |
| `partial_data` | Some metrics missing/excluded but at least one rank-eligible metric or blocked stage exists | Diagnosis possible but incomplete |

### Data Quality Tracking

The `data_quality` object tracks data availability:

```json
{
  "missing_targets": ["<MetricId>"],
  "missing_actuals": ["<MetricId>"],
  "excluded_metrics": ["<MetricId>"]
}
```

- **`missing_targets`**: Metrics where target values are unavailable (e.g., forecast not yet run)
- **`missing_actuals`**: Metrics where actual values are unavailable (e.g., S10 readout not yet complete)
- **`excluded_metrics`**: Metrics excluded from ranking due to invalid values (target <= 0, unsupported direction, computation errors)

### Status Transition Rules

1. **`ok`**: At least one metric with valid target/actual and `miss >= 0.05`, OR at least one blocked stage
2. **`no_bottleneck`**: At least one rank-eligible metric exists, all have `miss < 0.05`, no blocked stages
3. **`insufficient_data`**: Zero rank-eligible metrics, zero blocked stages
4. **`partial_data`**: At least one metric missing/excluded, but diagnosis still possible (status would be `ok` or `no_bottleneck`)

## 8) Blocked Constraint Ranking Rules

### Precedence

Any normalized `stage_blocked` constraint outranks any metric constraint, regardless of metric miss magnitude.

**Rationale:** A blocked stage prevents any forward progress. Metric misses only indicate suboptimal performance.

### Normalized Representation

Blocked constraints are represented with `miss = 1.0` (100% worse than target) in the `ranked_constraints` array for comparability and severity classification (always `critical`).

### Multi-Block Selection

If multiple blocked constraints exist, select the primary by:

1. **Earliest stage** in `upstream_priority_order`
2. **Latest timestamp** (if same stage has multiple blocked events)
3. **Lexical `reason_code`** (if tied on stage and timestamp)

**Example:** If both `S4/stage_blocked/deps_blocked` and `DO/stage_blocked/data_missing` exist, `S4` is selected because it precedes `DO` in `upstream_priority_order`.

## 9) Blocked Reason Taxonomy (v1)

Normalize `stage_blocked` reason codes to this controlled vocabulary:

| Reason Code | Meaning |
|---|---|
| `data_missing` | Required data or artifacts unavailable |
| `deps_blocked` | Upstream dependencies not yet complete |
| `compliance` | Regulatory or legal review required |
| `ops_capacity` | Operational bandwidth constraints |
| `unclear_requirements` | Acceptance criteria or scope undefined |
| `other` | Reason does not fit standard categories |

**Usage:** When a `stage_blocked` event is written to `events.jsonl`, the control plane normalizes the free-text `blocking_reason` to one of these codes for deterministic ranking.

## 10) Determinism Contracts

### Prior-Run Selection Strategy

When comparing to a prior run, the system uses deterministic ordering:

1. **Scan** all run directories for valid `baseline.manifest.json` files
2. **Filter** to runs with:
   - An existing `bottleneck-diagnosis.json` snapshot, OR
   - A completed S10 artifact pointer in the manifest
3. **Order** by `run_id` lexicographically (`SFS-<BIZ>-<YYYYMMDD>-<hhmm>`)
4. **Select** the greatest `run_id` strictly less than the current `run_id`

This strategy is independent of filesystem listing order and ensures repeatable comparisons.

**Example:** For run `SFS-HEAD-20260213-1500`, if prior runs are:
- `SFS-HEAD-20260206-1200` (has diagnosis)
- `SFS-HEAD-20260209-1400` (no diagnosis)
- `SFS-HEAD-20260211-1000` (has diagnosis)

The selected prior is `SFS-HEAD-20260211-1000`.

### History Append Deduplication

The `bottleneck-history.jsonl` file enforces idempotent append by `run_id`:

1. Before appending a new entry, scan existing entries for matching `run_id`
2. If an entry with the same `run_id` exists, skip the append (return `appended: false`)
3. Otherwise, append the new entry (return `appended: true`)

This guarantees that re-running S10 for the same run does not duplicate history entries.

### Atomic Writes

All file writes (snapshot, history append, trigger state) use atomic write operations:

1. Write content to a temporary file (e.g., `bottleneck-diagnosis.json.tmp`)
2. Rename temp file to target path (atomic operation on POSIX filesystems)
3. If write fails, temp file is cleaned up; target file remains unchanged

This prevents partial writes from corrupting the control-plane state.

## 11) Snapshot Schema (v1)

### File Path

```
docs/business-os/startup-baselines/<BIZ>/runs/<run_id>/bottleneck-diagnosis.json
```

### Schema

```json
{
  "diagnosis_schema_version": "v1",
  "constraint_key_version": "v1",
  "metric_catalog_version": "v1",
  "run_id": "<string: SFS-<BIZ>-<YYYYMMDD>-<hhmm>>",
  "business": "<string: business key>",
  "business_model_profile": "<enum: null | hospitality-direct-booking | dtc-ecommerce>",
  "timestamp": "<string: ISO 8601 UTC>",
  "diagnosis_status": "<enum: ok | no_bottleneck | insufficient_data | partial_data>",
  "data_quality": {
    "missing_targets": ["<MetricId>"],
    "missing_actuals": ["<MetricId>"],
    "excluded_metrics": ["<MetricId>"]
  },
  "funnel_metrics": {
    "<MetricId>": {
      "target": "<number|null>",
      "actual": "<number|null>",
      "delta_pct": "<number|null>",
      "miss": "<number|null>",
      "stage": "<string: stage ID>",
      "direction": "<enum: higher_is_better | lower_is_better>",
      "metric_class": "<enum: primitive | derived>"
    }
  },
  "profile_funnel_metrics": {
    "<ProfileMetricId>": {
      "target": "<number|null>",
      "actual": "<number|null>",
      "delta_pct": "<number|null>",
      "miss": "<number|null>",
      "stage": "<string: stage ID>",
      "direction": "<enum: higher_is_better | lower_is_better>",
      "metric_class": "<enum: primitive | derived>"
    }
  },
  "identified_constraint": {
    "constraint_key": "<string: <stage>/<metric> or <stage>/stage_blocked/<reason_code>>",
    "constraint_type": "<enum: metric | stage_blocked>",
    "stage": "<string: stage ID>",
    "metric": "<string|null: MetricId if type=metric>",
    "reason_code": "<string|null: reason code if type=stage_blocked>",
    "severity": "<enum: critical | moderate | minor | none>",
    "miss": "<number>",
    "reasoning": "<string: human-readable explanation>"
  },
  "ranked_constraints": [
    {
      "rank": "<number: 1-based>",
      "constraint_key": "<string>",
      "constraint_type": "<enum: metric | stage_blocked>",
      "stage": "<string>",
      "metric": "<string|null>",
      "reason_code": "<string|null>",
      "severity": "<enum: critical | moderate | minor>",
      "miss": "<number>",
      "reasoning": "<string>"
    }
  ],
  "comparison_to_prior_run": {
    "prior_run_id": "<string|null>",
    "constraint_changed": "<boolean>",
    "prior_constraint_key": "<string|null>",
    "metric_trends": {
      "<MetricId>": "<enum: improving | worsening | stable | new_data | no_prior_data>"
    }
  }
}
```

### Field Definitions

| Field | Type | Required | Description |
|---|---|---|---|
| `diagnosis_schema_version` | string | yes | Always `"v1"` for this version |
| `constraint_key_version` | string | yes | Always `"v1"` for this version |
| `metric_catalog_version` | string | yes | Always `"v1"` for this version |
| `run_id` | string | yes | Stable run identifier matching `SFS-<BIZ>-<YYYYMMDD>-<hhmm>` |
| `business` | string | yes | Business key (e.g., `BRIK`, `HEAD`, `PET`) |
| `business_model_profile` | enum or null | no | Profile adapter applied to this run; null = generic v1 behavior; see Section 2A for supported values |
| `profile_funnel_metrics` | object | no | Map of ProfileMetricId → per-metric details (same shape as `funnel_metrics`); absent when `business_model_profile` is null |
| `timestamp` | string | yes | ISO 8601 UTC — when the diagnosis was performed |
| `diagnosis_status` | enum | yes | One of `ok`, `no_bottleneck`, `insufficient_data`, `partial_data` |
| `data_quality` | object | yes | Tracks missing/excluded metrics |
| `funnel_metrics` | object | yes | Map of MetricId → metric details |
| `identified_constraint` | object or null | yes | Primary bottleneck; null when `diagnosis_status` is `no_bottleneck` or `insufficient_data` |
| `ranked_constraints` | array | yes | Top-ranked alternatives (typically 3-5) |
| `comparison_to_prior_run` | object or null | yes | Comparison to deterministic prior; null for first run |

### Example 1: Happy Path with Metric Bottleneck

```json
{
  "diagnosis_schema_version": "v1",
  "constraint_key_version": "v1",
  "metric_catalog_version": "v1",
  "run_id": "SFS-HEAD-20260213-1500",
  "business": "HEAD",
  "timestamp": "2026-02-13T15:30:00Z",
  "diagnosis_status": "ok",
  "data_quality": {
    "missing_targets": [],
    "missing_actuals": [],
    "excluded_metrics": []
  },
  "funnel_metrics": {
    "traffic": {
      "target": 10000,
      "actual": 8500,
      "delta_pct": -15.0,
      "miss": 0.15,
      "stage": "SELL-01",
      "direction": "higher_is_better",
      "metric_class": "primitive"
    },
    "cvr": {
      "target": 0.05,
      "actual": 0.025,
      "delta_pct": -50.0,
      "miss": 0.50,
      "stage": "S3",
      "direction": "higher_is_better",
      "metric_class": "primitive"
    },
    "aov": {
      "target": 150,
      "actual": 145,
      "delta_pct": -3.33,
      "miss": 0.033,
      "stage": "MARKET-06",
      "direction": "higher_is_better",
      "metric_class": "primitive"
    },
    "cac": {
      "target": 50,
      "actual": 45,
      "delta_pct": -10.0,
      "miss": 0.0,
      "stage": "SELL-01",
      "direction": "lower_is_better",
      "metric_class": "primitive"
    },
    "orders": {
      "target": 500,
      "actual": 213,
      "delta_pct": -57.4,
      "miss": 0.574,
      "stage": "S10",
      "direction": "higher_is_better",
      "metric_class": "derived"
    },
    "revenue": {
      "target": 75000,
      "actual": 30885,
      "delta_pct": -58.82,
      "miss": 0.588,
      "stage": "S10",
      "direction": "higher_is_better",
      "metric_class": "derived"
    }
  },
  "identified_constraint": {
    "constraint_key": "S3/cvr",
    "constraint_type": "metric",
    "stage": "S3",
    "metric": "cvr",
    "reason_code": null,
    "severity": "critical",
    "miss": 0.50,
    "reasoning": "Conversion rate is 50% worse than target (2.5% actual vs 5.0% target). Despite revenue and orders showing higher raw miss values, CVR is identified as the primary bottleneck because it is a primitive driver metric. Improving CVR directly addresses the root cause of low order volume."
  },
  "ranked_constraints": [
    {
      "rank": 1,
      "constraint_key": "S3/cvr",
      "constraint_type": "metric",
      "stage": "S3",
      "metric": "cvr",
      "reason_code": null,
      "severity": "critical",
      "miss": 0.50,
      "reasoning": "Primary bottleneck — conversion rate 50% below target"
    },
    {
      "rank": 2,
      "constraint_key": "SELL-01/traffic",
      "constraint_type": "metric",
      "stage": "SELL-01",
      "metric": "traffic",
      "reason_code": null,
      "severity": "minor",
      "miss": 0.15,
      "reasoning": "Secondary concern — traffic 15% below target"
    },
    {
      "rank": 3,
      "constraint_key": "S10/orders",
      "constraint_type": "metric",
      "stage": "S10",
      "metric": "orders",
      "reason_code": null,
      "severity": "critical",
      "miss": 0.574,
      "reasoning": "Derived outcome — symptom of CVR and traffic constraints"
    },
    {
      "rank": 4,
      "constraint_key": "S10/revenue",
      "constraint_type": "metric",
      "stage": "S10",
      "metric": "revenue",
      "reason_code": null,
      "severity": "critical",
      "miss": 0.588,
      "reasoning": "Derived outcome — symptom of orders and AOV constraints"
    }
  ],
  "comparison_to_prior_run": {
    "prior_run_id": "SFS-HEAD-20260206-1200",
    "constraint_changed": false,
    "prior_constraint_key": "S3/cvr",
    "metric_trends": {
      "traffic": "stable",
      "cvr": "worsening",
      "aov": "improving",
      "cac": "improving",
      "orders": "worsening",
      "revenue": "worsening"
    }
  }
}
```

### Example 2: Blocked Stage Constraint

```json
{
  "diagnosis_schema_version": "v1",
  "constraint_key_version": "v1",
  "metric_catalog_version": "v1",
  "run_id": "SFS-BRIK-20260213-1000",
  "business": "BRIK",
  "timestamp": "2026-02-13T10:45:00Z",
  "diagnosis_status": "ok",
  "data_quality": {
    "missing_targets": [],
    "missing_actuals": ["orders", "revenue"],
    "excluded_metrics": []
  },
  "funnel_metrics": {
    "traffic": {
      "target": 5000,
      "actual": 4800,
      "delta_pct": -4.0,
      "miss": 0.04,
      "stage": "SELL-01",
      "direction": "higher_is_better",
      "metric_class": "primitive"
    },
    "cvr": {
      "target": 0.03,
      "actual": 0.024,
      "delta_pct": -20.0,
      "miss": 0.20,
      "stage": "S3",
      "direction": "higher_is_better",
      "metric_class": "primitive"
    },
    "aov": {
      "target": 200,
      "actual": 210,
      "delta_pct": 5.0,
      "miss": 0.0,
      "stage": "MARKET-06",
      "direction": "higher_is_better",
      "metric_class": "primitive"
    },
    "cac": {
      "target": 60,
      "actual": 55,
      "delta_pct": -8.33,
      "miss": 0.0,
      "stage": "SELL-01",
      "direction": "lower_is_better",
      "metric_class": "primitive"
    },
    "orders": {
      "target": 150,
      "actual": null,
      "delta_pct": null,
      "miss": null,
      "stage": "S10",
      "direction": "higher_is_better",
      "metric_class": "derived"
    },
    "revenue": {
      "target": 30000,
      "actual": null,
      "delta_pct": null,
      "miss": null,
      "stage": "S10",
      "direction": "higher_is_better",
      "metric_class": "derived"
    }
  },
  "identified_constraint": {
    "constraint_key": "S4/stage_blocked/deps_blocked",
    "constraint_type": "stage_blocked",
    "stage": "S4",
    "metric": null,
    "reason_code": "deps_blocked",
    "severity": "critical",
    "miss": 1.0,
    "reasoning": "Stage S4 (Baseline merge) is blocked due to missing dependencies from upstream stages. This prevents any forward progress in the startup loop. Blocked stages always outrank metric constraints."
  },
  "ranked_constraints": [
    {
      "rank": 1,
      "constraint_key": "S4/stage_blocked/deps_blocked",
      "constraint_type": "stage_blocked",
      "stage": "S4",
      "metric": null,
      "reason_code": "deps_blocked",
      "severity": "critical",
      "miss": 1.0,
      "reasoning": "Primary blocker — S4 cannot proceed without upstream dependencies"
    },
    {
      "rank": 2,
      "constraint_key": "S3/cvr",
      "constraint_type": "metric",
      "stage": "S3",
      "metric": "cvr",
      "reason_code": null,
      "severity": "moderate",
      "miss": 0.20,
      "reasoning": "Metric concern — CVR 20% below target (would be primary if S4 were unblocked)"
    }
  ],
  "comparison_to_prior_run": {
    "prior_run_id": "SFS-BRIK-20260206-0900",
    "constraint_changed": true,
    "prior_constraint_key": "S3/cvr",
    "metric_trends": {
      "traffic": "stable",
      "cvr": "worsening",
      "aov": "improving",
      "cac": "improving",
      "orders": "no_prior_data",
      "revenue": "no_prior_data"
    }
  }
}
```

### Example 3: No Bottleneck Detected

```json
{
  "diagnosis_schema_version": "v1",
  "constraint_key_version": "v1",
  "metric_catalog_version": "v1",
  "run_id": "SFS-PET-20260213-1400",
  "business": "PET",
  "timestamp": "2026-02-13T14:20:00Z",
  "diagnosis_status": "no_bottleneck",
  "data_quality": {
    "missing_targets": [],
    "missing_actuals": [],
    "excluded_metrics": []
  },
  "funnel_metrics": {
    "traffic": {
      "target": 8000,
      "actual": 8200,
      "delta_pct": 2.5,
      "miss": 0.0,
      "stage": "SELL-01",
      "direction": "higher_is_better",
      "metric_class": "primitive"
    },
    "cvr": {
      "target": 0.04,
      "actual": 0.041,
      "delta_pct": 2.5,
      "miss": 0.0,
      "stage": "S3",
      "direction": "higher_is_better",
      "metric_class": "primitive"
    },
    "aov": {
      "target": 180,
      "actual": 175,
      "delta_pct": -2.78,
      "miss": 0.028,
      "stage": "MARKET-06",
      "direction": "higher_is_better",
      "metric_class": "primitive"
    },
    "cac": {
      "target": 55,
      "actual": 52,
      "delta_pct": -5.45,
      "miss": 0.0,
      "stage": "SELL-01",
      "direction": "lower_is_better",
      "metric_class": "primitive"
    },
    "orders": {
      "target": 320,
      "actual": 336,
      "delta_pct": 5.0,
      "miss": 0.0,
      "stage": "S10",
      "direction": "higher_is_better",
      "metric_class": "derived"
    },
    "revenue": {
      "target": 57600,
      "actual": 58800,
      "delta_pct": 2.08,
      "miss": 0.0,
      "stage": "S10",
      "direction": "higher_is_better",
      "metric_class": "derived"
    }
  },
  "identified_constraint": null,
  "ranked_constraints": [],
  "comparison_to_prior_run": {
    "prior_run_id": "SFS-PET-20260206-1400",
    "constraint_changed": true,
    "prior_constraint_key": "MARKET-06/aov",
    "metric_trends": {
      "traffic": "improving",
      "cvr": "stable",
      "aov": "improving",
      "cac": "improving",
      "orders": "improving",
      "revenue": "improving"
    }
  }
}
```

### Example 4: Hospitality Direct-Booking Profile

Profile primitive `median_response_time` (primary, miss=1.75) outranks base primitive `cvr` (miss=0.20) due to higher miss magnitude.

```json
{
  "diagnosis_schema_version": "v1",
  "constraint_key_version": "v1",
  "metric_catalog_version": "v1",
  "run_id": "SFS-BRIK-20260217-1000",
  "business": "BRIK",
  "business_model_profile": "hospitality-direct-booking",
  "timestamp": "2026-02-17T10:00:00Z",
  "diagnosis_status": "ok",
  "data_quality": {
    "missing_targets": [],
    "missing_actuals": [],
    "excluded_metrics": []
  },
  "funnel_metrics": {
    "traffic": { "target": 5000, "actual": 4800, "delta_pct": -4.0, "miss": 0.04, "stage": "SELL-01", "direction": "higher_is_better", "metric_class": "primitive" },
    "cvr": { "target": 0.05, "actual": 0.04, "delta_pct": -20.0, "miss": 0.20, "stage": "S3", "direction": "higher_is_better", "metric_class": "primitive" },
    "aov": { "target": 300, "actual": 310, "delta_pct": 3.3, "miss": 0.0, "stage": "MARKET-06", "direction": "higher_is_better", "metric_class": "primitive" },
    "cac": { "target": 80, "actual": 72, "delta_pct": -10.0, "miss": 0.0, "stage": "SELL-01", "direction": "lower_is_better", "metric_class": "primitive" }
  },
  "profile_funnel_metrics": {
    "inquiry_to_quote_rate": { "target": 0.60, "actual": 0.35, "delta_pct": -41.7, "miss": 0.417, "stage": "S3", "direction": "higher_is_better", "metric_class": "primitive" },
    "quote_to_booking_rate": { "target": 0.45, "actual": 0.40, "delta_pct": -11.1, "miss": 0.111, "stage": "SELL-01", "direction": "higher_is_better", "metric_class": "primitive" },
    "median_response_time": { "target": 2.0, "actual": 5.5, "delta_pct": 175.0, "miss": 1.75, "stage": "SELL-01", "direction": "lower_is_better", "metric_class": "primitive" },
    "direct_ota_mix": { "target": 0.70, "actual": 0.58, "delta_pct": -17.1, "miss": 0.171, "stage": "SELL-01", "direction": "higher_is_better", "metric_class": "primitive" },
    "cancellation_rate": { "target": 0.05, "actual": 0.08, "delta_pct": 60.0, "miss": 0.60, "stage": "S10", "direction": "lower_is_better", "metric_class": "derived" },
    "review_velocity": { "target": 5.0, "actual": 3.0, "delta_pct": -40.0, "miss": 0.40, "stage": "S10", "direction": "higher_is_better", "metric_class": "derived" }
  },
  "identified_constraint": {
    "constraint_key": "SELL-01/median_response_time",
    "constraint_type": "metric",
    "stage": "SELL-01",
    "metric": "median_response_time",
    "reason_code": null,
    "severity": "critical",
    "miss": 1.75,
    "reasoning": "Median response time is 175% worse than the 2-hour target (actual: 5.5 hours). This profile primary primitive has the highest miss in the candidate pool. Slow response time directly suppresses inquiry-to-quote conversion for direct-booking hospitality. Profile secondary metrics (cancellation_rate miss=0.60, review_velocity miss=0.40) are deprioritised because profile primary primitives exist with severity >= moderate. Profile: hospitality-direct-booking."
  },
  "ranked_constraints": [
    { "rank": 1, "constraint_key": "SELL-01/median_response_time", "constraint_type": "metric", "stage": "SELL-01", "metric": "median_response_time", "reason_code": null, "severity": "critical", "miss": 1.75, "reasoning": "Primary — profile primary primitive: response time 175% above target" },
    { "rank": 2, "constraint_key": "S3/inquiry_to_quote_rate", "constraint_type": "metric", "stage": "S3", "metric": "inquiry_to_quote_rate", "reason_code": null, "severity": "moderate", "miss": 0.417, "reasoning": "Secondary — profile primary primitive: inquiry-to-quote 41.7% below target" },
    { "rank": 3, "constraint_key": "S3/cvr", "constraint_type": "metric", "stage": "S3", "metric": "cvr", "reason_code": null, "severity": "moderate", "miss": 0.20, "reasoning": "Tertiary — base primitive: CVR 20% below target" }
  ],
  "comparison_to_prior_run": {
    "prior_run_id": null,
    "constraint_changed": false,
    "prior_constraint_key": null,
    "metric_trends": {}
  }
}
```

### Example 5: DTC Ecommerce Profile

Profile secondary `refund_rate` (miss=1.25, critical) is deprioritised because profile primary `page_to_atc_rate` (miss=0.42, moderate) exists. Primary primitive wins.

```json
{
  "diagnosis_schema_version": "v1",
  "constraint_key_version": "v1",
  "metric_catalog_version": "v1",
  "run_id": "SFS-HEAD-20260217-1400",
  "business": "HEAD",
  "business_model_profile": "dtc-ecommerce",
  "timestamp": "2026-02-17T14:00:00Z",
  "diagnosis_status": "ok",
  "data_quality": {
    "missing_targets": [],
    "missing_actuals": [],
    "excluded_metrics": []
  },
  "funnel_metrics": {
    "traffic": { "target": 15000, "actual": 12000, "delta_pct": -20.0, "miss": 0.20, "stage": "SELL-01", "direction": "higher_is_better", "metric_class": "primitive" },
    "cvr": { "target": 0.025, "actual": 0.019, "delta_pct": -24.0, "miss": 0.24, "stage": "S3", "direction": "higher_is_better", "metric_class": "primitive" },
    "aov": { "target": 95, "actual": 92, "delta_pct": -3.2, "miss": 0.032, "stage": "MARKET-06", "direction": "higher_is_better", "metric_class": "primitive" },
    "cac": { "target": 35, "actual": 32, "delta_pct": -8.6, "miss": 0.0, "stage": "SELL-01", "direction": "lower_is_better", "metric_class": "primitive" }
  },
  "profile_funnel_metrics": {
    "page_to_atc_rate": { "target": 0.12, "actual": 0.07, "delta_pct": -41.7, "miss": 0.417, "stage": "S3", "direction": "higher_is_better", "metric_class": "primitive" },
    "checkout_completion_rate": { "target": 0.70, "actual": 0.58, "delta_pct": -17.1, "miss": 0.171, "stage": "S3", "direction": "higher_is_better", "metric_class": "primitive" },
    "cac_by_cohort": { "target": 45, "actual": 38, "delta_pct": -15.6, "miss": 0.0, "stage": "SELL-01", "direction": "lower_is_better", "metric_class": "primitive" },
    "refund_rate": { "target": 0.04, "actual": 0.09, "delta_pct": 125.0, "miss": 1.25, "stage": "S10", "direction": "lower_is_better", "metric_class": "derived" },
    "support_load_per_100_orders": { "target": 8, "actual": 14, "delta_pct": 75.0, "miss": 0.75, "stage": "S10", "direction": "lower_is_better", "metric_class": "derived" },
    "repeat_purchase_rate": { "target": 0.30, "actual": 0.22, "delta_pct": -26.7, "miss": 0.267, "stage": "S10", "direction": "higher_is_better", "metric_class": "derived" }
  },
  "identified_constraint": {
    "constraint_key": "S3/page_to_atc_rate",
    "constraint_type": "metric",
    "stage": "S3",
    "metric": "page_to_atc_rate",
    "reason_code": null,
    "severity": "moderate",
    "miss": 0.417,
    "reasoning": "Page-to-add-to-cart rate is 41.7% below target (actual: 7%, target: 12%). Profile secondary metrics refund_rate (miss=1.25) and support_load_per_100_orders (miss=0.75) are deprioritised because profile primary primitive page_to_atc_rate has severity >= moderate. Addressing funnel drop-off before ATC is more actionable than treating derived outcome symptoms. Profile: dtc-ecommerce."
  },
  "ranked_constraints": [
    { "rank": 1, "constraint_key": "S3/page_to_atc_rate", "constraint_type": "metric", "stage": "S3", "metric": "page_to_atc_rate", "reason_code": null, "severity": "moderate", "miss": 0.417, "reasoning": "Primary — profile primary primitive: ATC rate 41.7% below target" },
    { "rank": 2, "constraint_key": "S3/cvr", "constraint_type": "metric", "stage": "S3", "metric": "cvr", "reason_code": null, "severity": "moderate", "miss": 0.24, "reasoning": "Secondary — base primitive: overall CVR 24% below target (correlated with ATC constraint)" },
    { "rank": 3, "constraint_key": "S10/refund_rate", "constraint_type": "metric", "stage": "S10", "metric": "refund_rate", "reason_code": null, "severity": "critical", "miss": 1.25, "reasoning": "Profile secondary (deprioritised) — refund rate 125% above target; high miss but derived outcome, ranked after primaries" }
  ],
  "comparison_to_prior_run": {
    "prior_run_id": "SFS-HEAD-20260210-1400",
    "constraint_changed": true,
    "prior_constraint_key": "SELL-01/traffic",
    "metric_trends": {
      "traffic": "improving",
      "cvr": "stable",
      "aov": "stable",
      "cac": "improving",
      "page_to_atc_rate": "worsening",
      "checkout_completion_rate": "stable",
      "cac_by_cohort": "improving",
      "refund_rate": "worsening",
      "support_load_per_100_orders": "worsening",
      "repeat_purchase_rate": "stable"
    }
  }
}
```

## 12) History Schema (v1)

### File Path

```
docs/business-os/startup-baselines/<BIZ>/bottleneck-history.jsonl
```

### Schema

Each line in the JSONL file is a single JSON object:

```json
{
  "timestamp": "<string: ISO 8601 UTC>",
  "run_id": "<string: SFS-<BIZ>-<YYYYMMDD>-<hhmm>>",
  "diagnosis_status": "<enum: ok | no_bottleneck | insufficient_data | partial_data>",
  "constraint_key": "<string: constraint key or 'none' or 'insufficient_data'>",
  "constraint_stage": "<string|null: stage ID>",
  "constraint_metric": "<string|null: MetricId>",
  "reason_code": "<string|null: reason code for stage_blocked>",
  "severity": "<enum: critical | moderate | minor | none>"
}
```

### Field Definitions

| Field | Type | Required | Description |
|---|---|---|---|
| `timestamp` | string | yes | ISO 8601 UTC — when the diagnosis was performed |
| `run_id` | string | yes | Stable run identifier matching `SFS-<BIZ>-<YYYYMMDD>-<hhmm>` |
| `diagnosis_status` | enum | yes | One of `ok`, `no_bottleneck`, `insufficient_data`, `partial_data` |
| `constraint_key` | string | yes | Primary constraint key; `"none"` for no bottleneck; `"insufficient_data"` for insufficient data |
| `constraint_stage` | string or null | yes | Stage ID for the constraint; null when `constraint_key` is `"none"` or `"insufficient_data"` |
| `constraint_metric` | string or null | yes | MetricId for metric constraints; null for blocked constraints or special keys |
| `reason_code` | string or null | yes | Reason code for `stage_blocked` constraints; null for metric constraints or special keys |
| `severity` | enum | yes | Severity of the constraint; `"none"` for `constraint_key` = `"none"` or `"insufficient_data"` |

### Persistence Breakers

Entries with `constraint_key` in `{"none", "insufficient_data"}` are **persistence breakers** — they interrupt any constraint persistence streak.

**Example:** History sequence `[A, A, none, A]` yields `persistent = false` for `N=3` because the `none` entry breaks the streak.

### Idempotent Append

Duplicate `run_id` entries are skipped. If `appendBottleneckHistory` is called with a `run_id` that already exists in the ledger, the function returns `{ appended: false }` and does not write a new line.

### Examples

#### Example 1: Metric Constraint Entry

```json
{"timestamp":"2026-02-13T15:30:00Z","run_id":"SFS-HEAD-20260213-1500","diagnosis_status":"ok","constraint_key":"S3/cvr","constraint_stage":"S3","constraint_metric":"cvr","reason_code":null,"severity":"critical"}
```

#### Example 2: Blocked Stage Entry

```json
{"timestamp":"2026-02-13T10:45:00Z","run_id":"SFS-BRIK-20260213-1000","diagnosis_status":"ok","constraint_key":"S4/stage_blocked/deps_blocked","constraint_stage":"S4","constraint_metric":null,"reason_code":"deps_blocked","severity":"critical"}
```

#### Example 3: No Bottleneck Entry

```json
{"timestamp":"2026-02-13T14:20:00Z","run_id":"SFS-PET-20260213-1400","diagnosis_status":"no_bottleneck","constraint_key":"none","constraint_stage":null,"constraint_metric":null,"reason_code":null,"severity":"none"}
```

#### Example 4: Insufficient Data Entry

```json
{"timestamp":"2026-02-06T09:15:00Z","run_id":"SFS-HEAD-20260206-0900","diagnosis_status":"insufficient_data","constraint_key":"insufficient_data","constraint_stage":null,"constraint_metric":null,"reason_code":null,"severity":"none"}
```

## 13) Replan Trigger Schema (v1)

### File Path

```
docs/business-os/startup-baselines/<BIZ>/replan-trigger.json
```

### Schema

```json
{
  "trigger_schema_version": "v1",
  "business": "<string: business key>",
  "status": "<enum: open | acknowledged | resolved>",
  "created_at": "<string: ISO 8601 UTC>",
  "last_evaluated_at": "<string: ISO 8601 UTC>",
  "resolved_at": "<string|null: ISO 8601 UTC>",
  "reopened_count": "<number: integer>",
  "last_reopened_at": "<string|null: ISO 8601 UTC>",
  "constraint": {
    "constraint_key": "<string>",
    "constraint_type": "<enum: metric | stage_blocked>",
    "stage": "<string>",
    "metric": "<string|null>",
    "reason_code": "<string|null>",
    "severity": "<enum: critical | moderate | minor>"
  },
  "run_history": [
    {
      "run_id": "<string>",
      "timestamp": "<string: ISO 8601 UTC>",
      "miss": "<number>",
      "severity": "<enum: critical | moderate | minor>"
    }
  ],
  "reason": "<string: human-readable explanation>",
  "recommended_focus": "<string: actionable guidance>",
  "min_severity": "<enum: moderate | critical>",
  "persistence_threshold": "<number: integer>"
}
```

### Field Definitions

| Field | Type | Required | Description |
|---|---|---|---|
| `trigger_schema_version` | string | yes | Always `"v1"` for this version |
| `business` | string | yes | Business key (e.g., `BRIK`, `HEAD`, `PET`) |
| `status` | enum | yes | One of `open`, `acknowledged`, `resolved` |
| `created_at` | string | yes | ISO 8601 UTC — when the trigger was first opened |
| `last_evaluated_at` | string | yes | ISO 8601 UTC — when the trigger was last evaluated |
| `resolved_at` | string or null | yes | ISO 8601 UTC — when the trigger was resolved; null if not resolved |
| `reopened_count` | number | yes | Count of times the trigger has been reopened after resolution |
| `last_reopened_at` | string or null | yes | ISO 8601 UTC — when the trigger was last reopened; null if never reopened |
| `constraint` | object | yes | Details of the persistent constraint |
| `run_history` | array | yes | List of runs contributing to the persistent constraint |
| `reason` | string | yes | Human-readable explanation of why the trigger was opened |
| `recommended_focus` | string | yes | Actionable guidance for the operator |
| `min_severity` | enum | yes | Minimum severity gate (default `moderate`) |
| `persistence_threshold` | number | yes | Number of consecutive runs required (default `3`) |

### Lifecycle State Machine

```
(none) ──persistence_met──▶ open ──operator_ack──▶ acknowledged ──non_persistent_streak──▶ resolved
  ▲                                                                                              │
  └──────────────────────────────────persistence_renewed────────────────────────────────────────┘
                                   (reopened_count incremented)
```

### Lifecycle Rules

1. **Open trigger**: Created when persistence criteria are met (N consecutive runs with same `constraint_key` and severity >= `min_severity`)
2. **Operator acknowledgment**: Status can be manually changed from `open` → `acknowledged` (file edit or future CLI command)
3. **Auto-resolve**: After a configured non-persistent streak (default 2 runs), status transitions from `open` or `acknowledged` → `resolved`
4. **Reopen**: If persistence criteria are met again after resolution, status transitions from `resolved` → `open` and `reopened_count` is incremented

### Severity Gate

The trigger only opens when the persistent constraint has severity >= `min_severity`. Default is `moderate`, which includes `moderate` and `critical` but excludes `minor`.

**Example:** A persistent `minor` constraint will not trigger if `min_severity` is `moderate`.

### Persistence Streak

Persistence is checked using the last `N` consecutive entries in `bottleneck-history.jsonl` where `N = persistence_threshold` (default 3).

**Persistence criteria:**
1. All `N` entries have the same `constraint_key`
2. No `constraint_key` in `{"none", "insufficient_data"}` (persistence breakers)
3. The constraint severity meets the `min_severity` gate

### Auto-Resolve Configuration

The trigger auto-resolves after `autoResolveAfterNonPersistentRuns` consecutive runs without persistence (default 2). This prevents trigger churn from single-run fluctuations.

### Examples

#### Example 1: Open Trigger (Persistent CVR Constraint)

```json
{
  "trigger_schema_version": "v1",
  "business": "HEAD",
  "status": "open",
  "created_at": "2026-02-13T15:30:00Z",
  "last_evaluated_at": "2026-02-13T15:30:00Z",
  "resolved_at": null,
  "reopened_count": 0,
  "last_reopened_at": null,
  "constraint": {
    "constraint_key": "S3/cvr",
    "constraint_type": "metric",
    "stage": "S3",
    "metric": "cvr",
    "reason_code": null,
    "severity": "critical"
  },
  "run_history": [
    {
      "run_id": "SFS-HEAD-20260130-1500",
      "timestamp": "2026-01-30T15:30:00Z",
      "miss": 0.52,
      "severity": "critical"
    },
    {
      "run_id": "SFS-HEAD-20260206-1500",
      "timestamp": "2026-02-06T15:30:00Z",
      "miss": 0.48,
      "severity": "moderate"
    },
    {
      "run_id": "SFS-HEAD-20260213-1500",
      "timestamp": "2026-02-13T15:30:00Z",
      "miss": 0.50,
      "severity": "critical"
    }
  ],
  "reason": "Conversion rate (CVR) has been the primary bottleneck for 3 consecutive weekly runs, with severity ranging from moderate to critical (48-52% worse than target). This indicates a persistent structural constraint rather than transient variance.",
  "recommended_focus": "Review conversion funnel analytics, user experience friction points, and pricing/offer clarity. Consider running qualitative user research or A/B tests on checkout flow. See S3 (Forecast) artifacts for detailed conversion analysis.",
  "min_severity": "moderate",
  "persistence_threshold": 3
}
```

#### Example 2: Resolved Trigger (After Non-Persistent Streak)

```json
{
  "trigger_schema_version": "v1",
  "business": "BRIK",
  "status": "resolved",
  "created_at": "2026-01-30T10:45:00Z",
  "last_evaluated_at": "2026-02-13T10:45:00Z",
  "resolved_at": "2026-02-13T10:45:00Z",
  "reopened_count": 0,
  "last_reopened_at": null,
  "constraint": {
    "constraint_key": "SELL-01/cac",
    "constraint_type": "metric",
    "stage": "SELL-01",
    "metric": "cac",
    "reason_code": null,
    "severity": "moderate"
  },
  "run_history": [
    {
      "run_id": "SFS-BRIK-20260116-1000",
      "timestamp": "2026-01-16T10:45:00Z",
      "miss": 0.35,
      "severity": "moderate"
    },
    {
      "run_id": "SFS-BRIK-20260123-1000",
      "timestamp": "2026-01-23T10:45:00Z",
      "miss": 0.28,
      "severity": "moderate"
    },
    {
      "run_id": "SFS-BRIK-20260130-1000",
      "timestamp": "2026-01-30T10:45:00Z",
      "miss": 0.32,
      "severity": "moderate"
    }
  ],
  "reason": "Customer acquisition cost (CAC) was persistently 28-35% above target for 3 consecutive runs. The constraint has since resolved — recent runs show CAC within acceptable range or different primary constraints.",
  "recommended_focus": "Channel strategy optimization was likely successful. Monitor for recurrence and consider documenting the intervention that resolved this constraint.",
  "min_severity": "moderate",
  "persistence_threshold": 3
}
```

#### Example 3: Reopened Trigger (Recurrence After Resolution)

```json
{
  "trigger_schema_version": "v1",
  "business": "PET",
  "status": "open",
  "created_at": "2026-01-16T14:20:00Z",
  "last_evaluated_at": "2026-02-13T14:20:00Z",
  "resolved_at": null,
  "reopened_count": 1,
  "last_reopened_at": "2026-02-13T14:20:00Z",
  "constraint": {
    "constraint_key": "MARKET-06/aov",
    "constraint_type": "metric",
    "stage": "MARKET-06",
    "metric": "aov",
    "reason_code": null,
    "severity": "moderate"
  },
  "run_history": [
    {
      "run_id": "SFS-PET-20260130-1400",
      "timestamp": "2026-01-30T14:20:00Z",
      "miss": 0.22,
      "severity": "moderate"
    },
    {
      "run_id": "SFS-PET-20260206-1400",
      "timestamp": "2026-02-06T14:20:00Z",
      "miss": 0.25,
      "severity": "moderate"
    },
    {
      "run_id": "SFS-PET-20260213-1400",
      "timestamp": "2026-02-13T14:20:00Z",
      "miss": 0.28,
      "severity": "moderate"
    }
  ],
  "reason": "Average order value (AOV) has returned as the primary bottleneck after previous resolution. This is the 2nd occurrence of this constraint pattern, suggesting the prior intervention may not have been sustainable or the constraint has new root causes.",
  "recommended_focus": "Re-evaluate offer design and bundling strategy. Compare current AOV drivers to those from the previous occurrence. Consider whether market conditions or product mix have changed. See MARKET-06 (Offer design) artifacts for detailed analysis.",
  "min_severity": "moderate",
  "persistence_threshold": 3
}
```

## 14) Worked Ranking Examples

### Example A: Symptom Guard — Prefer CVR Over Orders

**Inputs:**
- `traffic`: target 10000, actual 8500, miss 0.15 (minor)
- `cvr`: target 0.05, actual 0.025, miss 0.50 (critical)
- `aov`: target 150, actual 145, miss 0.033 (none)
- `cac`: target 50, actual 45, miss 0.0 (none)
- `orders`: target 500, actual 213, miss 0.574 (critical)
- `revenue`: target 75000, actual 30885, miss 0.588 (critical)

**Naive ranking (by miss desc):**
1. `revenue` (0.588)
2. `orders` (0.574)
3. `cvr` (0.50)
4. `traffic` (0.15)
5. `aov` (0.033)

**Upstream attribution logic:**
1. `revenue` is derived from `orders * aov`. Since `orders` is available, check `orders` first.
2. `orders` is derived from `traffic * cvr`. Since both `traffic` and `cvr` are available, compare their misses:
   - `traffic` miss = 0.15
   - `cvr` miss = 0.50
3. Select `cvr` as the primary bottleneck because it has the larger miss and is a primitive driver.

**Final ranking:**
1. **`S3/cvr`** (0.50, critical) — primary bottleneck
2. `SELL-01/traffic` (0.15, minor) — secondary concern
3. `S10/orders` (0.574, critical) — derived outcome (symptom)
4. `S10/revenue` (0.588, critical) — derived outcome (symptom)

### Example B: Blocked Stage Outranks Metrics

**Inputs:**
- `traffic`: target 5000, actual 4800, miss 0.04 (none)
- `cvr`: target 0.03, actual 0.024, miss 0.20 (moderate)
- `aov`: target 200, actual 210, miss 0.0 (none)
- `cac`: target 60, actual 55, miss 0.0 (none)
- `orders`: actual null (missing)
- `revenue`: actual null (missing)
- **Blocked stage:** `S4/stage_blocked/deps_blocked`

**Naive ranking (by miss desc):**
1. `cvr` (0.20)

**Blocked-stage promotion:**
1. Blocked stage `S4/stage_blocked/deps_blocked` is assigned `miss = 1.0` and severity `critical`.
2. Any blocked stage outranks any metric constraint.

**Final ranking:**
1. **`S4/stage_blocked/deps_blocked`** (1.0, critical) — primary blocker
2. `S3/cvr` (0.20, moderate) — would be primary if S4 were unblocked

### Example C: Tie-Breaking by Upstream Priority Order

**Inputs:**
- `traffic`: target 10000, actual 7000, miss 0.30 (moderate)
- `cvr`: target 0.05, actual 0.035, miss 0.30 (moderate)
- `aov`: target 150, actual 145, miss 0.033 (none)
- `cac`: target 50, actual 45, miss 0.0 (none)

**Ranking logic:**
1. Both `traffic` and `cvr` have identical miss (0.30).
2. Apply tiebreaker: earlier stage in `upstream_priority_order`.
3. `upstream_priority_order`: `..., S3, SELL-01, ...`
4. `cvr` is at stage `S3`, `traffic` is at stage `SELL-01`.
5. `S3` precedes `SELL-01` → select `cvr`.

**Final ranking:**
1. **`S3/cvr`** (0.30, moderate) — primary bottleneck (tiebreak by upstream priority)
2. `SELL-01/traffic` (0.30, moderate) — alternative bottleneck

### Example D: Multiple Blocked Stages

**Inputs:**
- `traffic`: target 5000, actual 4900, miss 0.02 (none)
- `cvr`: target 0.04, actual 0.038, miss 0.05 (minor)
- **Blocked stages:**
  - `S4/stage_blocked/deps_blocked` (timestamp `2026-02-13T10:00:00Z`)
  - `DO/stage_blocked/data_missing` (timestamp `2026-02-13T10:30:00Z`)

**Multi-block selection:**
1. Both blocked stages have `miss = 1.0` and severity `critical`.
2. Apply tiebreaker: earliest stage in `upstream_priority_order`.
3. `upstream_priority_order`: `..., S4, S5A, S5B, S6, DO, ...`
4. `S4` precedes `DO` → select `S4`.

**Final ranking:**
1. **`S4/stage_blocked/deps_blocked`** (1.0, critical) — primary blocker (upstream)
2. `DO/stage_blocked/data_missing` (1.0, critical) — secondary blocker
3. `S3/cvr` (0.05, minor) — metric concern

## 15) Relationship to Other Schemas

| Schema | Owner | Defined in |
|---|---|---|
| Bottleneck diagnosis (this doc) | Control plane (BL-01 through BL-07) | This document |
| Event ledger + derived state | Control plane (LPSP-04A) | `event-state-schema.md` |
| Baseline manifest | Control plane (LPSP-03B) | `manifest-schema.md` |
| Stage result | Stage workers (data plane) | `stage-result-schema.md` |
| Loop spec | Plan authority | `loop-spec.yaml` |

---

**Document version:** v1 (profile adapter extension: 2026-02-17)
**Last updated:** 2026-02-17
**Schema stability:** Stable — v1 is the canonical contract for BL-02 through BL-07 implementation. Profile adapter fields (`business_model_profile`, `profile_funnel_metrics`) are optional and additive; existing v1 snapshots require no migration.
