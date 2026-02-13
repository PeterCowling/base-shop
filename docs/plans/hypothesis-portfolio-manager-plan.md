---
Type: Plan
Status: Proposed
Domain: Venture-Studio
Workstream: Process
Created: 2026-02-13
Last-updated: 2026-02-13
Last-reviewed: 2026-02-13
Replan-date: TBD
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: hypothesis-portfolio-manager
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-sequence, /lp-replan
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact) — schema/risk semantics now explicit (90%), ranking normalization edge-cases specified (86%), integration with lp-prioritize and activation-gate enforcement still need validation (74%)
Business-OS-Integration: on
Business-Unit: BOS
---

# Hypothesis Portfolio Manager — Implementation Plan

## Summary

This plan implements a portfolio-level hypothesis registry and ranking system that treats experiments and features as bets with explicit expected value, time-to-signal, and downside bounds. The system replaces intuition-driven prioritization with explicit portfolio optimization, with strict value semantics and normalization rules to avoid score drift.

**Core capabilities:**
1. Hypothesis registry schema with structured bet metadata (prior confidence, upside/downside estimates, detection window, required spend, dependencies, stopping rules)
2. Expected-value ranking engine with explicit always-incurred costs (EV = P(success) × upside - P(failure) × downside - spend - effort_cost), limited to monetary value units in v1
3. Time-to-signal scoring (prefer fast-learning experiments over slow ones)
4. Portfolio-level constraints (max concurrent experiments, budget caps, risk caps)
5. Integration with existing prioritization flow (`/lp-prioritize`)

**Primary reference:**
- `docs/plans/advanced-math-algorithms-fact-find.md` (Opportunity N)

## Goals

1. **Structured hypothesis capture:** Every bet has explicit priors, upside/downside estimates, and stopping rules
2. **Expected-value ranking:** Replace "gut feel" with EV-based portfolio ranking
3. **Fast-learning bias:** Surface experiments with short time-to-signal and low required spend
4. **Portfolio risk management:** Enforce concurrent experiment limits and budget caps
5. **Integration with startup loop:** Plug into `/lp-prioritize` (S5A) as a scoring input

## Non-goals

1. Real-time experiment tracking (remains in S10 `/lp-experiment`)
2. Bayesian updating of priors (defer to future iteration)
3. Advanced portfolio optimization (no Pareto frontiers or solver-based optimization in v1)
4. Automatic experiment stopping (stopping rules are advisory, not enforced)

## Constraints & Assumptions

- **Constraints:**
  - TypeScript-only (no Python/Rust sidecars)
  - Must integrate cleanly with existing `/lp-prioritize` skill
  - Portfolio data must persist in Business OS (D1 via Agent API)
  - No new database tables (use ideas + stage-docs for storage)
- **Assumptions:**
  - Users can estimate P(success), upside, downside with reasonable accuracy (±50% error is acceptable)
  - Time-to-signal is measurable in days/weeks (not months/quarters)
  - Portfolio constraints are business-level (not cross-business)
  - Early iteration focuses on ranking, not real-time portfolio rebalancing
  - All monetary inputs are USD in v1

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---|---|---|---|
| HPM-01 | DESIGN | Define hypothesis registry schema (hypothesis fields, portfolio metadata, constraint schema) | 85% | S | Pending | - | HPM-02, HPM-03 |
| HPM-02 | IMPLEMENT | Create TypeScript types and validation for hypothesis schema | 82% | S | Pending | HPM-01 | HPM-04, HPM-05 |
| HPM-03 | DESIGN | Design storage contract (ideas with `hypothesis` tag + stage-doc for portfolio state) | 80% | S | Pending | HPM-01 | HPM-04 |
| HPM-04 | IMPLEMENT | Implement expected-value ranking engine (EV calculation, time-to-signal scoring, composite ranking) | 78% | M | Pending | HPM-02, HPM-03 | HPM-06 |
| HPM-05 | IMPLEMENT | Implement portfolio constraint checker (max concurrent, budget caps, risk caps) | 75% | M | Pending | HPM-02 | HPM-06 |
| HPM-06 | IMPLEMENT | Create hypothesis registry CLI / API endpoints (CRUD for hypotheses, portfolio query) | 70% | M | Pending | HPM-04, HPM-05 | HPM-07 |
| HPM-07 | IMPLEMENT | Integrate with `/lp-prioritize` (inject normalized portfolio scores into prioritization flow) | 68% | M | Pending | HPM-06 | HPM-08 |
| HPM-08 | VALIDATE | End-to-end validation (create 5 test hypotheses, run portfolio ranking, verify constraint enforcement) | 75% | S | Pending | HPM-07 | - |

## Tasks

### HPM-01: Define hypothesis registry schema — DESIGN

- **Type:** DESIGN
- **Status:** Pending
- **Deliverable:** Schema definition document (`docs/business-os/hypothesis-portfolio/schema.md`)
- **Execution-Skill:** /lp-build
- **Confidence:** 85%
- **Effort:** S (2-3 days)
- **Acceptance:**
  - Schema document defines value semantics explicitly (v1 decision):
    - `upside_estimate` = gross incremental value if hypothesis is true over `value_horizon_days`
    - `downside_estimate` = incremental harm if hypothesis is false, excluding always-incurred run costs
    - `required_spend` and `required_effort_days` are always-incurred costs and must be subtracted explicitly in EV
    - `effort_cost = required_effort_days * loaded_cost_per_person_day` (from portfolio metadata)
    - EV ranking is monetary-only in v1; non-monetary hypotheses are stored but blocked from EV ranking unless explicit conversion is added in a later version
  - Hypothesis schema includes all required fields:
    - `id` (immutable Agent idea entity ID; canonical hypothesis identifier for API addressing and links)
    - `hypothesis_key` (human-readable key, format `<BIZ>-HYP-<NNN>`, best-effort monotonic display key)
    - `hypothesis_uuid` (optional internal UUID for analytics correlation; not used for API paths or dependency references in v1)
    - `business` (business code)
    - `title` (short hypothesis statement)
    - `hypothesis_type` (market | offer | channel | product | pricing | operations)
    - `prior_confidence` (0-100, P(success) estimate before experiment)
    - `value_unit` (USD monetary unit only for v1 EV ranking, e.g. USD_GROSS_PROFIT, USD_NET_CASHFLOW; non-monetary units are not rank-eligible in v1)
    - `value_horizon_days` (integer horizon used for upside/downside estimates, e.g. 30/90/365)
    - `primary_metric_unit` (optional observational KPI unit, e.g. SIGNUPS, CTR_PCT_POINTS; not used directly in EV math)
    - `upside_estimate` (gross upside in `value_unit` over `value_horizon_days`)
    - `downside_estimate` (gross downside in `value_unit` over `value_horizon_days`, excluding always-incurred run costs)
    - `detection_window_days` (days to first signal; nullable when unknown)
    - `required_spend` (monetary budget required to run experiment)
    - `required_effort_days` (person-days required to run experiment)
    - `dependency_hypothesis_ids` (array of hypothesis `id` values / Agent idea IDs that must be completed first)
    - `dependency_card_ids` (array of card IDs that must be completed first)
    - `stopping_rule` (explicit condition to stop experiment early, e.g., "If conversion < 0.5% after 7 days")
    - `status` (draft | active | stopped | completed | archived)
    - `activated_date` (optional; required when `status=active`, used for monthly budget attribution)
    - `stopped_date` (optional; required when `status=stopped`)
    - `completed_date` (optional; required when `status=completed`)
    - `outcome` (optional: success | failure | inconclusive)
    - `outcome_date` (optional; defaults to `completed_date` when completed, else `stopped_date` when stopped)
    - `result_summary` (optional short markdown)
    - `observed_metric` (optional)
    - `observed_uplift` (optional numeric)
    - `activation_override` (optional boolean; true only when `--force` activation override is used)
    - `activation_override_reason` (optional string; required when `activation_override=true`)
    - `activation_override_at` (optional ISO timestamp; required when `activation_override=true`)
    - `activation_override_by` (optional operator identifier; required when `activation_override=true`)
    - `created_date`
    - `owner`
  - Portfolio metadata schema is configuration-only (no duplicated lifecycle arrays):
    - `max_concurrent_experiments` (business-level cap, default 3)
    - `monthly_experiment_budget` (business-level cap, default $5000 USD, calendar-month convention)
    - `budget_timezone` (IANA timezone for month-boundary calculations, default `Europe/Rome`)
    - `default_value_unit` (required canonical ranking unit for portfolio, must match `value_unit` and be USD-based)
    - `default_value_horizon_days` (required canonical ranking horizon for portfolio)
    - `loaded_cost_per_person_day` (for effort_cost conversion in EV)
    - `time_score_weight` (default 0.25)
    - `ev_score_weight` (default 0.60)
    - `cost_score_weight` (default 0.15)
    - `risk_tolerance` (low | medium | high; display and policy annotation only in v1)
    - `max_loss_if_false_per_experiment` (optional hard risk cap on total-loss exposure)
    - `default_detection_window_days` (fallback when `detection_window_days` is null)
    - `ev_normalization` (robust rule: winsorize at p10/p90 when N>=10, quantile algorithm `nearest-rank`, clamp to [0,1], deterministic small-N and degenerate fallbacks)
    - `cost_normalization` (same fallback rules as EV normalization; applied to `required_spend` only)
  - Constraint schema includes:
    - `max_concurrent` (number, enforced at portfolio query time and activation transitions)
    - `budget_cap` (number, enforced at portfolio query time and activation transitions with explicit month convention)
    - `risk_cap` (maximum acceptable total-loss exposure per experiment, enforced at portfolio query time and activation time)
    - `dependency_gate` (block hypotheses with unresolved dependencies)
  - Monetary convention is explicit:
    - All monetary fields are USD in v1 (`value_unit`, `required_spend`, `monthly_experiment_budget`, `loaded_cost_per_person_day`)
- **Validation contract (VC-01):**
  - **VC-01-01:** Schema document includes all required hypothesis fields with types, ranges, and nullability rules
  - **VC-01-02:** Schema document explicitly defines value semantics (gross vs net) and EV treatment of spend/effort
  - **VC-01-03:** Schema document includes portfolio configuration-only metadata (no active/completed arrays) including budget timezone and normalization fallback policy
  - **VC-01-04:** Schema document includes lifecycle timestamp invariants (`activated_date`, `stopped_date`, `completed_date`)
  - **VC-01-05:** Schema document includes override-audit fields and required-on-force invariants
  - **VC-01-06:** Schema document includes constraint definitions and enforcement points (including dependency gate and total-loss risk cap)
  - **Acceptance coverage:** VC-01-01 covers criteria 2; VC-01-02 covers criteria 1; VC-01-03 covers criteria 3; VC-01-04 covers criteria 2; VC-01-05 covers criteria 6; VC-01-06 covers criteria 4
  - **Validation type:** review checklist
  - **Validation location/evidence:** `docs/business-os/hypothesis-portfolio/schema.md`
  - **Run/verify:** Read schema document, verify all fields present with types/ranges

### HPM-02: Create TypeScript types and validation — IMPLEMENT

- **Type:** IMPLEMENT
- **Status:** Pending
- **Deliverable:** TypeScript module (`packages/lib/src/hypothesis-portfolio/types.ts`, `packages/lib/src/hypothesis-portfolio/validation.ts`)
- **Execution-Skill:** /lp-build
- **Confidence:** 82%
- **Effort:** S (2-3 days)
- **Depends on:** HPM-01
- **Acceptance:**
  - TypeScript types mirror schema from HPM-01:
    - `Hypothesis` interface with all required fields
    - `PortfolioMetadata` interface
    - `PortfolioConstraints` interface
  - Validation functions enforce schema:
    - `validateHypothesis(h: unknown): Hypothesis | ValidationError`
    - `validatePortfolioMetadata(m: unknown): PortfolioMetadata | ValidationError`
    - Validation checks: required fields, type correctness, range bounds (e.g., prior_confidence 0-100), nullability rules (`detection_window_days`), and dependency field format
    - Validation checks: `value_unit` + `value_horizon_days` required for EV-ranked hypotheses; v1 EV eligibility requires monetary `value_unit`
    - Validation checks: `id` is treated as Agent idea entity ID (canonical), `hypothesis_key` format check is advisory display validation only
    - Validation checks: lifecycle status/date invariants (`status=active` requires `activated_date`; `status=stopped` requires `stopped_date`; `status=completed` requires `completed_date`)
    - Validation checks: `outcome_date` defaulting/consistency rule (`completed_date` if completed, else `stopped_date` if stopped, unless explicitly set)
    - Validation checks: override audit invariants (`activation_override=true` requires reason/at/by)
    - Validation checks: `value_unit` must represent integrated USD monetary value over the horizon (rate-like units such as `USD_MRR` are rejected for EV ranking unless explicitly converted upstream)
  - Unit tests cover validation:
    - Valid hypothesis → passes
    - Missing required field → fails with clear error
    - Out-of-range prior_confidence → fails
    - Invalid dependency format → fails
    - Null detection window accepted when fallback exists in portfolio metadata
    - Non-monetary unit in EV-ranked set rejected with reason `non_monetary_unit_requires_conversion`
    - Unit/horizon mismatch to portfolio default domain blocked with reason `unit_horizon_mismatch`
    - Active status without `activated_date` fails validation
    - Forced activation without override reason metadata fails validation
- **Validation contract (VC-02):**
  - **VC-02-01:** All schema fields from HPM-01 have corresponding TypeScript types
  - **VC-02-02:** Validation functions reject invalid inputs (missing fields, wrong types, out-of-range values)
  - **VC-02-03:** Unit tests cover happy path + 5 failure cases per validation function
  - **Acceptance coverage:** VC-02-01 covers criteria 1; VC-02-02 covers criteria 2; VC-02-03 covers criteria 3
  - **Validation type:** unit tests
  - **Validation location/evidence:** `packages/lib/src/hypothesis-portfolio/__tests__/validation.test.ts`
  - **Run/verify:** `npx jest --testPathPattern=hypothesis-portfolio/validation` — all tests pass

### HPM-03: Design storage contract — DESIGN

- **Type:** DESIGN
- **Status:** Pending
- **Deliverable:** Storage contract document (`docs/business-os/hypothesis-portfolio/storage-contract.md`)
- **Execution-Skill:** /lp-build
- **Confidence:** 80%
- **Effort:** S (1-2 days)
- **Depends on:** HPM-01
- **Acceptance:**
  - Storage contract defines how hypotheses persist:
    - **Ideas with `hypothesis` tag:** Each hypothesis is an idea entity with `tags: ["hypothesis", "hyp:<type>", "unit:<value_unit>"]` where `<type>` is market/offer/channel/product/pricing/operations
    - **Hypothesis content:** Stored as markdown in idea `content` field with frontmatter containing structured hypothesis fields (including `schema_version: 1`, value semantics fields, dependency arrays, outcome fields, and activation override audit fields)
    - **Canonical content example:** storage contract includes one complete frontmatter + markdown body example and one parse-error example
    - **Portfolio metadata:** Stored as stage-doc with `stage: portfolio-state` and `cardId` = business-level portfolio card (created once per business)
  - Storage contract defines CRUD operations:
    - **Create:** `POST /api/agent/ideas` with `tags: ["hypothesis", "hyp:<type>", "unit:<value_unit>"]` and frontmatter-structured content
    - **Read:** `GET /api/agent/ideas?business=<BIZ>&tags=hypothesis` returns all hypotheses for a business
    - **Update:** `PATCH /api/agent/ideas/:id` with optimistic concurrency (`baseEntitySha`)
    - **Delete/Archive:** `PATCH /api/agent/ideas/:id` with `status: archived`
    - **Portfolio metadata read/write:** `GET/PATCH /api/agent/stage-docs/<portfolio-card-id>/portfolio-state`
  - Storage contract defines query patterns:
    - **Active hypotheses:** derive by filtering ideas where `status: active` + `tags: hypothesis` (single source of truth)
    - **By type:** filter by `tags: hyp:<type>`
    - **By dependency:** parse frontmatter `dependency_hypothesis_ids` / `dependency_card_ids` and filter
    - **Ranking domain:** default rank domain is non-archived hypotheses with `status in (draft, active)` and portfolio defaults `default_value_unit` + `default_value_horizon_days`
    - **Out-of-domain handling:** hypotheses with different unit/horizon are returned as blocked with `unit_horizon_mismatch` (no hard fail)
    - **Ambiguous-domain hard fail:** if portfolio default unit/horizon is missing and multiple EV-eligible unit/horizon pairs exist, return hard error `portfolio_default_domain_required`
    - **EV eligibility:** non-monetary units (or rate-like monetary units such as `USD_MRR`) are blocked with reason `non_monetary_unit_requires_conversion`
    - **Dependency-card completion mapping:** `dependency_card_ids` are considered resolved only when corresponding card status is one of `completed`, `done`, `shipped`, or `archived`
  - Parse error handling is explicit:
    - Invalid frontmatter does not crash ranking
    - Invalid hypotheses are returned in blocked list with reason `invalid_frontmatter`
    - Rank-ineligible hypotheses are returned in blocked list with explicit reason (not dropped)
  - Override logging behavior is explicit:
    - `set-status --status active --force` must persist override metadata in hypothesis frontmatter (reason/at/by)
- **Validation contract (VC-03):**
  - **VC-03-01:** Storage contract defines hypothesis-to-idea mapping with tag schema and frontmatter structure (`schema_version` included)
  - **VC-03-02:** Storage contract defines portfolio metadata storage location (stage-doc with specific stage key)
  - **VC-03-03:** Storage contract defines all CRUD operations with API endpoint paths and request/response shapes
  - **VC-03-04:** Storage contract defines query patterns for active hypotheses, by-type, by-dependency, and ranking domain
  - **VC-03-05:** Storage contract defines invalid frontmatter behavior (block with reason, no hard fail)
  - **VC-03-06:** Storage contract defines override audit persistence and domain-selection error behavior (`portfolio_default_domain_required`)
  - **Acceptance coverage:** VC-03-01 covers criteria 1; VC-03-02 covers criteria 1; VC-03-03 covers criteria 2; VC-03-04 covers criteria 3; VC-03-05 covers criteria 4; VC-03-06 covers criteria 6
  - **Validation type:** review checklist
  - **Validation location/evidence:** `docs/business-os/hypothesis-portfolio/storage-contract.md`
  - **Run/verify:** Read storage contract, verify all operations defined with examples

### HPM-04: Implement expected-value ranking engine — IMPLEMENT

- **Type:** IMPLEMENT
- **Status:** Pending
- **Deliverable:** TypeScript module (`packages/lib/src/hypothesis-portfolio/ranking.ts`)
- **Execution-Skill:** /lp-build
- **Confidence:** 78%
- **Effort:** M (4-5 days)
- **Depends on:** HPM-02, HPM-03
- **Acceptance:**
  - Expected-value calculation:
    - Formula: `EV = p * upside_estimate - (1 - p) * downside_estimate - required_spend - effort_cost` where `p = prior_confidence / 100`
    - Formula: `effort_cost = required_effort_days * loaded_cost_per_person_day`
    - Returns numeric EV score (can be positive or negative)
    - EV scoring precondition: hypothesis must have EV-eligible monetary `value_unit`; otherwise mark blocked with `non_monetary_unit_requires_conversion`
  - Time-to-signal scoring:
    - Use normalized window score directly: `time_norm = (maxW - W) / (maxW - minW)` (shorter window = higher score)
    - `W = detection_window_days`; if `detection_window_days` is null, substitute `default_detection_window_days` from portfolio metadata
    - Clamp `time_norm` to [0,1]; if `maxW == minW`, set all `time_norm = 1`
  - EV normalization (required before blending):
    - Rank domain default: hypotheses where `status in (draft, active)` and `value_unit/value_horizon_days` match portfolio defaults
    - Population for normalization excludes invalid frontmatter, out-of-domain (`unit_horizon_mismatch`), and non-EV-eligible hypotheses
    - Negative EV hypotheses are excluded from percentile/normalization population and mapped to 0 after scoring
    - Quantile algorithm: `nearest-rank` (explicit for deterministic tests)
    - If `N >= 10`: winsorize EV at p10/p90, then min-max to [0,1] as `ev_norm`
    - If `N < 10`: skip winsorization, use raw min-max on EV
    - If normalized denominator is 0 (flat distribution): set `ev_norm = 1` for all
    - If normalization population is empty after exclusions (for example all EV values are negative), set `ev_norm = 0` for all and rely on inadmissible reasons
  - Composite ranking:
    - Formula: `composite_score = ev_score_weight * ev_norm + time_score_weight * time_norm + cost_score_weight * cost_norm`
    - Formula: `cost_norm` is inverse-normalized `required_spend` only (cash-at-risk preference) in [0,1], using same normalization fallback policy as EV
    - Default weights: `ev_score_weight = 0.60`, `time_score_weight = 0.25`, `cost_score_weight = 0.15` (sum must equal 1)
    - Multi-objective rationale (explicit): EV remains net-of-cost; `cost_norm` is an intentional secondary bias toward low upfront cash risk and reversibility, not an accident
    - Weights configurable per business via portfolio metadata
  - Ranking function:
    - Input: array of hypotheses + portfolio metadata
    - Output: array of hypotheses sorted by composite_score DESC
    - Includes ties-broken-by: composite_score DESC > EV DESC > required_spend ASC
    - Negative EV hypotheses are returned with `inadmissible_reason: "negative_ev"` and excluded from default admissible list unless `include_inadmissible` is enabled
    - Out-of-domain hypotheses are returned with `inadmissible_reason: "unit_horizon_mismatch"` and excluded from default admissible list
  - Unit tests cover:
    - High EV + short detection → ranks first
    - High EV + long detection → ranks below high EV + short detection
    - Low EV + short detection → ranks below high EV experiments
    - Negative EV → marked inadmissible with explicit reason
    - Null detection window → fallback applied deterministically
    - Mixed units/horizons with portfolio defaults present → blocked per-item with `unit_horizon_mismatch` (no hard fail)
    - Missing portfolio defaults with multiple EV-eligible unit/horizon buckets → hard error `portfolio_default_domain_required`
    - Non-monetary or rate-like unit → blocked with explicit reason
    - Small-N normalization (`N < 10`) follows deterministic fallback
    - Flat EV distribution (`min == max`) yields stable `ev_norm` values (no division-by-zero)
    - Tie-breaking logic verified
- **Validation contract (VC-04):**
  - **VC-04-01:** EV calculation correct for p=0.6, upside=10000, downside=2000, required_spend=500, required_effort_days=3, loaded_cost_per_person_day=300 → EV = 3800
  - **VC-04-02:** Time scoring correct for W=7 days vs W=90 days (7-day receives higher `time_norm`)
  - **VC-04-03:** EV normalization and composite ranking produce deterministic order for 5 hypotheses with varying EV, window, and cost
  - **VC-04-04:** Negative EV handling marks hypotheses as inadmissible (not silently dropped)
  - **VC-04-05:** Mixed-unit/horizon hypotheses are blocked per-item with `unit_horizon_mismatch` when portfolio default domain is configured
  - **VC-04-06:** Non-monetary/rate-like units are blocked from EV scoring with explicit reason
  - **VC-04-07:** Normalization fallback behavior is deterministic for `N < 10`, flat distributions, and empty normalization populations
  - **VC-04-08:** Missing default domain with multiple EV-eligible buckets returns `portfolio_default_domain_required`
  - **Acceptance coverage:** VC-04-01 covers criteria 1; VC-04-02 covers criteria 2; VC-04-03 covers criteria 3; VC-04-04 covers criteria 4; VC-04-05 covers criteria 2; VC-04-06 covers criteria 1; VC-04-07 covers criteria 2; VC-04-08 covers criteria 2
  - **Validation type:** unit tests
  - **Validation location/evidence:** `packages/lib/src/hypothesis-portfolio/__tests__/ranking.test.ts`
  - **Run/verify:** `npx jest --testPathPattern=hypothesis-portfolio/ranking` — all tests pass, specific EV calculations verified

### HPM-05: Implement portfolio constraint checker — IMPLEMENT

- **Type:** IMPLEMENT
- **Status:** Pending
- **Deliverable:** TypeScript module (`packages/lib/src/hypothesis-portfolio/constraints.ts`)
- **Execution-Skill:** /lp-build
- **Confidence:** 75%
- **Effort:** M (3-4 days)
- **Depends on:** HPM-02
- **Acceptance:**
  - Constraint checker function:
    - Input: ranked hypotheses + portfolio metadata + current active hypotheses (+ optional activation candidate timestamp for status transitions)
    - Output: filtered hypotheses list (only hypotheses that satisfy portfolio constraints) + violation reasons for filtered-out hypotheses
  - Constraints enforced:
    - **Max concurrent experiments:** If count of `status: active` hypotheses >= `max_concurrent_experiments`, block new hypotheses with reason "Portfolio at max concurrent capacity (N/N active)"
    - **Budget cap:** Calendar-month model in v1. Attribute `required_spend` to month of `activated_date` in `budget_timezone` (default `Europe/Rome`); month spend includes all hypotheses activated in that month regardless of current status
    - **Budget cap candidate timestamp:** for rank/query checks, assume candidate activation date = `now` in `budget_timezone` unless `--activation-date` is provided; for status transitions, use requested/derived `activated_date`
    - **Budget cap check:** if month spend + candidate spend exceeds `monthly_experiment_budget`, block with reason "Monthly budget exhausted ($X / $Y)"
    - **Risk cap (optional):** If portfolio metadata includes `max_loss_if_false_per_experiment`, compute `max_loss_if_false = downside_estimate + required_spend + effort_cost` and block hypotheses where `max_loss_if_false > max_loss_if_false_per_experiment` with reason "Total loss exposure exceeds risk cap ($X > $Y)"
    - **Dependency gate:** If any `dependency_hypothesis_ids` are not `completed` or any `dependency_card_ids` are not in completion states (`completed|done|shipped|archived`), block with reason "Unresolved dependencies"
  - Constraint checker returns:
    - `admissible: Hypothesis[]` (hypotheses that satisfy all constraints)
    - `blocked: { hypothesis: Hypothesis, reasons: string[] }[]` (hypotheses blocked with reasons)
  - Unit tests cover:
    - Portfolio at max concurrent → new hypothesis blocked
    - Budget cap reached in same calendar month/timezone → new hypothesis blocked
    - Risk cap exceeded on `max_loss_if_false` → hypothesis blocked
    - Dependency unresolved → blocked with reason
    - All constraints satisfied → hypothesis admitted
- **Validation contract (VC-05):**
  - **VC-05-01:** Max concurrent constraint blocks 4th hypothesis when max_concurrent = 3
  - **VC-05-02:** Budget cap blocks hypothesis when month-attributed spend by `activated_date` (in `budget_timezone`) plus candidate spend exceeds `monthly_experiment_budget`
  - **VC-05-03:** Risk cap blocks hypothesis when `max_loss_if_false` exceeds `max_loss_if_false_per_experiment`
  - **VC-05-04:** Dependency gate blocks hypothesis when upstream hypothesis or dependency card is unresolved by defined completion-state mapping
  - **VC-05-05:** Activation gate integration: `set-status --status active` blocks transition when constraints fail (unless `--force`)
  - **VC-05-06:** All constraints satisfied → hypothesis admitted to admissible list
  - **Acceptance coverage:** VC-05-01 covers criteria 2; VC-05-02 covers criteria 2; VC-05-03 covers criteria 2; VC-05-04 covers criteria 2; VC-05-05 covers criteria 2; VC-05-06 covers criteria 1
  - **Validation type:** unit tests
  - **Validation location/evidence:** `packages/lib/src/hypothesis-portfolio/__tests__/constraints.test.ts`
  - **Run/verify:** `npx jest --testPathPattern=hypothesis-portfolio/constraints` — all tests pass, specific constraint violations verified

### HPM-06: Create hypothesis registry CLI / API endpoints — IMPLEMENT

- **Type:** IMPLEMENT
- **Status:** Pending
- **Deliverable:** CLI script (`scripts/src/hypothesis-portfolio/registry-cli.ts`) + optional API endpoints (if needed)
- **Execution-Skill:** /lp-build
- **Confidence:** 70%
- **Effort:** M (5-6 days)
- **Depends on:** HPM-04, HPM-05
- **Acceptance:**
  - CLI commands implemented:
    - `scripts/hypothesis-portfolio create --business <BIZ> --title "..." --type <type> --prior-confidence <0-100> --value-unit <unit> --value-horizon-days <days> --upside <number> --downside <number> [--detection-window-days <days>] --required-spend <number> --required-effort-days <days> --stopping-rule "..." [--dependency-hypothesis-ids <id1,id2,...>] [--dependency-card-ids <id1,id2,...>]`
      - Creates idea via Agent API with `tags: ["hypothesis", "hyp:<type>", "unit:<value_unit>"]` and frontmatter-structured content
      - Uses Agent API returned idea ID as canonical `id`; generates `hypothesis_key` with conflict retry on optimistic-concurrency failure
      - Returns hypothesis ID (idea entity ID) + hypothesis key
    - `scripts/hypothesis-portfolio update --id <HYP-ID> [field flags...]`
      - Updates hypothesis frontmatter fields via Agent API patch
      - Supports edits to priors, upside/downside, detection window, spend/effort, dependencies, stopping rule
    - `scripts/hypothesis-portfolio set-status --id <HYP-ID> --status <draft|active|stopped|completed|archived> [--activated-date <ISO>] [--stopped-date <ISO>] [--completed-date <ISO>] [--outcome <success|failure|inconclusive>] [--result-summary "..."] [--force --force-reason "..."]`
      - Applies lifecycle transition and optional outcome metadata
      - When transitioning to `active`, auto-sets `activated_date=now` if missing
      - When transitioning to `active`, runs constraint checker and blocks transition on violations unless `--force` is provided
      - When `--force` is used, writes override audit metadata (`activation_override`, `activation_override_reason`, `activation_override_at`, `activation_override_by`)
    - `scripts/hypothesis-portfolio list --business <BIZ> [--status <draft|active|stopped|completed|archived>] [--type <type>]`
      - Queries ideas via Agent API with tag filter
      - Parses frontmatter and displays table of hypotheses with key fields (id, title, EV, time-to-signal, status)
    - `scripts/hypothesis-portfolio rank --business <BIZ> [--statuses draft,active] [--activation-date <ISO>] [--show-blocked] [--include-inadmissible]`
      - Fetches hypotheses for ranking domain (default: `status in (draft, active)`, non-archived)
      - Uses portfolio default domain (`default_value_unit` + `default_value_horizon_days`) and returns out-of-domain hypotheses as blocked
      - Fetches portfolio metadata from stage-doc
      - Runs ranking engine (HPM-04)
      - Runs constraint checker (HPM-05)
      - Displays ranked list of admissible hypotheses with composite scores
      - Optionally displays blocked hypotheses with reasons
    - `scripts/hypothesis-portfolio portfolio set --business <BIZ> [--max-concurrent <n>] [--monthly-budget <n>] [--budget-timezone <IANA>] [--default-value-unit <unit>] [--default-value-horizon-days <n>] [--loaded-cost-per-person-day <n>] [--ev-weight <0-1>] [--time-weight <0-1>] [--cost-weight <0-1>] [--default-detection-window-days <n>]`
      - Updates portfolio configuration stage-doc for ranking and constraints
    - `scripts/hypothesis-portfolio archive --id <HYP-ID>`
      - Updates idea status to archived via Agent API
  - CLI uses Agent API for all persistence (no direct file writes)
  - CLI handles API errors gracefully (404, 409 conflict, etc.)
  - CLI output is human-readable (table format for list/rank commands)
- **Validation contract (VC-06):**
  - **VC-06-01:** `create` command successfully creates hypothesis via Agent API and returns ID
  - **VC-06-02:** `update` command successfully patches hypothesis fields with optimistic concurrency handling
  - **VC-06-03:** `set-status` command transitions lifecycle state, enforces lifecycle date invariants, and records optional outcome fields
  - **VC-06-04:** `list` command fetches and displays hypotheses in table format
  - **VC-06-05:** `rank` command produces deterministic ranked list with composite scores for 3 test hypotheses
  - **VC-06-06:** `rank --show-blocked` displays blocked hypotheses with constraint violation reasons
  - **VC-06-07:** `create` handles hypothesis key collision by retrying key allocation while preserving canonical idea `id`
  - **VC-06-08:** `set-status --status active` blocks activation when constraints fail, unless `--force` is provided
  - **VC-06-09:** `set-status --force` requires `--force-reason` and persists override audit fields
  - **VC-06-10:** `portfolio set` updates ranking/constraint configuration in stage-doc (including `budget_timezone` and default unit/horizon domain)
  - **VC-06-11:** `archive` command successfully updates hypothesis status via Agent API
  - **Acceptance coverage:** VC-06-01 covers criteria 1; VC-06-02 covers criteria 1; VC-06-03 covers criteria 1; VC-06-04 covers criteria 1; VC-06-05 covers criteria 1; VC-06-06 covers criteria 1; VC-06-07 covers criteria 1; VC-06-08 covers criteria 2; VC-06-09 covers criteria 6; VC-06-10 covers criteria 1; VC-06-11 covers criteria 1
  - **Validation type:** integration test (dry-run against Agent API)
  - **Validation location/evidence:** Manual CLI execution log with screenshots/output captures
  - **Run/verify:** Run each CLI command against test business, verify output matches expected format and content

### HPM-07: Integrate with `/lp-prioritize` — IMPLEMENT

- **Type:** IMPLEMENT
- **Status:** Pending
- **Deliverable:** Updated `/lp-prioritize` skill + integration documentation
- **Execution-Skill:** /lp-build
- **Confidence:** 68%
- **Effort:** M (4-5 days)
- **Depends on:** HPM-06
- **Acceptance:**
  - `/lp-prioritize` skill updated to inject hypothesis portfolio scores:
    - Primary linkage is explicit only: candidate item must include `hypothesis_id` (Agent idea entity ID) or `hypothesis:<id>` tag
    - Optional fuzzy matching may run only as advisory fallback and must be labeled `heuristic_link` (no automatic score injection without explicit confirmation)
    - If linked hypothesis exists and it matches portfolio default unit/horizon domain, inject `portfolio_score_normalized` (derived from HPM-04 composite score, mapped to 0-5)
    - Update combined score formula to incorporate portfolio signal: `combined_score = (Impact + Learning-Value + portfolio_score_normalized) / Effort`
    - Normalization rule for prioritize: robust portfolio-relative mapping where p10 composite = 1 and p90 composite = 5, clamped to [0,5], with same small-N/flat-distribution fallbacks as HPM-04
    - Negative EV, non-EV-eligible hypotheses (`non_monetary_unit_requires_conversion`), and domain-mismatch hypotheses (`unit_horizon_mismatch`) map to 0 unless explicitly included as admissible override
  - Integration does not break existing `/lp-prioritize` behavior:
    - Items without linked hypotheses continue to use original scoring (Impact + Learning-Value) / Effort
    - Portfolio query is optional (if portfolio metadata doesn't exist, skip hypothesis scoring)
  - Documentation updated:
    - `.claude/skills/lp-prioritize/SKILL.md` updated with hypothesis integration section
    - `docs/business-os/hypothesis-portfolio/integration-guide.md` created with step-by-step integration instructions
- **Validation contract (VC-07):**
  - **VC-07-01:** Prioritize run with explicit linked hypothesis injects `portfolio_score_normalized` and changes combined score deterministically
  - **VC-07-02:** Prioritize run without hypotheses continues to work (no regression)
  - **VC-07-03:** Portfolio metadata missing → prioritize skips hypothesis scoring gracefully (no errors)
  - **VC-07-04:** Fuzzy title/description linkage is reported as advisory-only and never silently used as canonical linkage
  - **Acceptance coverage:** VC-07-01 covers criteria 1,2; VC-07-02 covers criteria 3; VC-07-03 covers criteria 3; VC-07-04 covers criteria 1
  - **Validation type:** integration test
  - **Validation location/evidence:** Manual `/lp-prioritize` execution log with and without hypotheses
  - **Run/verify:** Run `/lp-prioritize` on test business with 2 items (one linked to hypothesis, one not), verify scoring difference

### HPM-08: End-to-end validation — VALIDATE

- **Type:** VALIDATE
- **Status:** Pending
- **Deliverable:** Validation report (`docs/plans/hypothesis-portfolio-manager-validation-report.md`)
- **Execution-Skill:** /lp-build
- **Confidence:** 75%
- **Effort:** S (2-3 days)
- **Depends on:** HPM-07
- **Acceptance:**
  - End-to-end validation scenario:
    1. Create test business portfolio metadata with `max_concurrent = 2`, `monthly_experiment_budget = 5000`, `budget_timezone = Europe/Rome`, `default_value_unit = USD_GROSS_PROFIT`, `default_value_horizon_days = 90`, `loaded_cost_per_person_day = 300`, `ev/time/cash-risk weights = 0.60/0.25/0.15`, `default_detection_window_days = 45`
    2. Create 5 test hypotheses in same `value_unit = USD_GROSS_PROFIT`, `value_horizon_days = 90` with explicit inputs:
       - HYP-001: `prior=60`, `upside=15000`, `downside=2000`, `required_spend=500`, `required_effort_days=2`, `detection_window_days=7` → EV = `0.6*15000 - 0.4*2000 - 500 - 600 = 7100`
       - HYP-002: `prior=60`, `upside=15000`, `downside=2000`, `required_spend=500`, `required_effort_days=2`, `detection_window_days=90` → EV = `7100` (same EV, slower signal)
       - HYP-003: `prior=50`, `upside=10000`, `downside=3000`, `required_spend=1200`, `required_effort_days=3`, `detection_window_days=14` → EV = `1400`
       - HYP-004: `prior=40`, `upside=8000`, `downside=6000`, `required_spend=2200`, `required_effort_days=4`, `detection_window_days=7` → EV = `3200 - 3600 - 2200 - 1200 = -3800`
       - HYP-005: `prior=55`, `upside=6000`, `downside=2000`, `required_spend=700`, `required_effort_days=1`, `detection_window_days=null` → EV = `3300 - 900 - 700 - 300 = 1400` with default window fallback applied in time score
    3. Run `scripts/hypothesis-portfolio rank --business TEST --activation-date <ISO> --show-blocked`
    4. Verify ranking:
       - HYP-001 ranks above HYP-002 (same EV, shorter detection window)
       - HYP-004 is returned as blocked/inadmissible with reason `negative_ev`
       - HYP-005 gets deterministic fallback time score from `default_detection_window_days`
    5. Activate HYP-001 and HYP-002 via `set-status --status active` (auto-sets `activated_date`)
    6. Attempt to activate HYP-003 via `set-status --status active` → blocked due to max_concurrent = 2; verify `--force` requires reason and writes override metadata
    7. Run `rank` again → HYP-003 appears in blocked list with capacity reason
    8. Run `/lp-prioritize` with candidate linked to HYP-003 → verify portfolio score injected
    9. Edge case: add one `SIGNUPS` hypothesis into same rank request → verify blocked with `non_monetary_unit_requires_conversion`
    10. Edge case: add one USD hypothesis with `value_horizon_days=30` → verify blocked with `unit_horizon_mismatch` (run continues)
    11. Edge case: inject invalid frontmatter in one hypothesis idea → verify it is blocked with `invalid_frontmatter` and process continues
  - Validation report documents:
    - All steps executed with screenshots/output captures
    - Ranking order matches expected composite score calculations
    - Constraint enforcement verified (max_concurrent blocks HYP-003, activation gate behavior validated, dependency/budget behavior validated)
    - Integration with `/lp-prioritize` verified (`portfolio_score_normalized` injection works with explicit linkage)
  - All unit tests passing (HPM-02, HPM-04, HPM-05)
  - All integration tests passing (HPM-06, HPM-07)
- **Validation contract (VC-08):**
  - **VC-08-01:** Ranking order matches expected order based on EV and time-to-signal calculations
  - **VC-08-02:** Constraint enforcement blocks HYP-003 when max_concurrent = 2 and 2 hypotheses already active
  - **VC-08-03:** `/lp-prioritize` integration injects `portfolio_score_normalized` and affects final ranking for explicitly linked items
  - **VC-08-04:** Null detection window fallback is applied deterministically
  - **VC-08-05:** Activation transition to `active` is blocked by constraints unless `--force` is used, and forced transitions persist override metadata
  - **VC-08-06:** Non-monetary hypothesis is blocked with `non_monetary_unit_requires_conversion`
  - **VC-08-07:** Domain-mismatch hypothesis is blocked with `unit_horizon_mismatch` without crashing the run
  - **VC-08-08:** Invalid frontmatter hypothesis is blocked with explicit reason and does not crash run
  - **Acceptance coverage:** VC-08-01 covers criteria 4; VC-08-02 covers criteria 6; VC-08-03 covers criteria 7; VC-08-04 covers criteria 4; VC-08-05 covers criteria 6; VC-08-06 covers criteria 1; VC-08-07 covers criteria 2; VC-08-08 covers criteria 9
  - **Validation type:** end-to-end integration test
  - **Validation location/evidence:** `docs/plans/hypothesis-portfolio-manager-validation-report.md`
  - **Run/verify:** Follow end-to-end scenario, document all outputs, verify expected behavior at each step

## Validation Strategy

1. **Unit tests for core logic:** EV calculation with always-incurred costs, monetary-unit eligibility, normalization logic/fallbacks, time scoring fallback, and constraint checking (HPM-02, HPM-04, HPM-05)
2. **Integration tests for CLI:** Create, update, set-status (with activation gate + override audit logging), list, rank (`--activation-date`), portfolio set (default domain config), archive commands against Agent API (HPM-06)
3. **Integration tests for `/lp-prioritize`:** Verify explicit-link portfolio score injection does not break existing scoring (HPM-07)
4. **Edge-case validation:** non-monetary units, unit/horizon mismatch blocking, invalid frontmatter, null detection windows, small-N normalization, and negative EV handling (HPM-04, HPM-08)
5. **End-to-end validation:** Full scenario with deterministic inputs, ranking, constraint enforcement, and prioritization integration (HPM-08)

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Users estimate P(success), upside, downside poorly | High | Provide calibration guidance and lightweight estimator examples; run sensitivity checks (±25% priors/upside/downside) before shipping recommendations |
| Non-monetary or rate-like value units create dimensionally invalid EV | High | Restrict v1 EV ranking to integrated monetary units only; block non-eligible units with explicit reason `non_monetary_unit_requires_conversion` |
| Identifier mismatch between hypothesis and idea entities causes linkage/CRUD drift | High | Define canonical `id` as Agent idea entity ID everywhere (CLI, dependencies, `/lp-prioritize` linkage, API paths) |
| EV systematically overstated by cost treatment drift | High | Lock EV semantics in schema; subtract `required_spend` and `effort_cost` explicitly in formula and tests |
| Cost preference appears as accidental double-penalty | Medium | State multi-objective intent explicitly; EV includes total cost while `cost_norm` captures separate cash-at-risk preference (`required_spend` only) |
| Time-to-signal difficult to estimate for seasonal/market-dependent experiments | Medium | Allow `detection_window_days = null` and use explicit portfolio fallback window |
| Domain ambiguity (multiple unit/horizon buckets) destabilizes ranking and prioritize scores | Medium | Require portfolio default domain (`default_value_unit`, `default_value_horizon_days`); block out-of-domain hypotheses with reason instead of hard-fail where possible |
| Portfolio constraints too rigid (blocks good experiments) | Medium | Make constraints configurable per business; enforce at activation with explicit blocked reasons and `--force` override workflow |
| Integration with `/lp-prioritize` requires significant refactoring | Medium | Keep integration additive and explicit-link based; no silent fuzzy linkage as canonical path |

## What Would Make Confidence >=90%

1. Complete HPM-01 with explicit value semantics and publish canonical schema examples (valid + invalid frontmatter)
2. Complete HPM-04 and verify EV/composite outputs against deterministic fixtures and spreadsheet cross-checks
3. Complete HPM-05 dependency/budget gates and validate blocked-reason outputs on real dependency chains
4. Complete HPM-07 explicit-link integration and run on one real business with 3 linked hypotheses
5. Add sensitivity analysis (how ranking changes with ±25% prior_confidence or upside/downside variation) and publish calibration guidance

## Decision Log

### DL-01: Storage location for hypotheses (HPM-03)

**Decided:** 2026-02-13 (proposed)
**Chosen option:** Store hypotheses as ideas with `tags: ["hypothesis", "hyp:<type>", "unit:<value_unit>"]` and structured frontmatter (`schema_version: 1`)

**Alternatives considered:**
1. **New D1 table `hypotheses`:** Requires schema migration, adds complexity; rejected because no new tables constraint
2. **Stage-docs only:** Hypotheses are not tied to cards in early ideation phase; rejected because stage-docs require cardId
3. **Flat markdown files:** No API integration, manual CRUD; rejected because must use Agent API for persistence
4. **Ideas with hypothesis tag:** Reuses existing ideas infrastructure, Agent API CRUD works out-of-box, filterable by tag; **chosen**

**Rationale:**
- Ideas already support tags, markdown content with frontmatter, and Agent API CRUD
- Hypotheses are semantically similar to ideas (both are "things to investigate")
- Tag-based filtering (`tags=hypothesis`) enables efficient queries
- Frontmatter structure keeps hypothesis metadata machine-parsable while preserving human-readable markdown body
- No new database tables required (constraint satisfied)
- Canonical hypothesis `id` is the Agent idea entity ID, so API addressing/linkage/dependencies remain single-source-of-truth

### DL-02: EV formula semantics and weighting (HPM-04)

**Decided:** 2026-02-13 (proposed)
**Chosen option:** `EV = P(success) * upside - P(failure) * downside - required_spend - effort_cost` with no asymmetric loss weighting in v1, and EV eligibility restricted to monetary value units

**Alternatives considered:**
1. **Gross upside/downside + explicit always-incurred costs + monetary-only EV units:** `EV = P(success) * upside - P(failure) * downside - required_spend - effort_cost`; **chosen for v1**
2. **Allow KPI units directly in EV math:** rejected as dimensionally invalid without explicit conversion
3. **Net-value fields only:** `EV = P(success) * upside_net - P(failure) * downside_net`; rejected for v1 due to high authoring inconsistency risk
4. **Loss aversion weighting:** `EV = P(success) * upside - 2 * P(failure) * downside - costs`; deferred to v2
5. **Logarithmic utility:** `EV = P(success) * log(upside) - P(failure) * log(downside)` — deferred to v2

**Rationale:**
- Explicit subtraction of always-incurred spend/effort prevents systematic EV overstatement
- Restricting EV to monetary units avoids invalid arithmetic (for example KPI counts minus currency)
- Gross-value semantics are easier to audit and compare across hypotheses than mixed net conventions
- Loss aversion is real but introduces subjectivity (what's the right multiplier? 2x? 2.5x?); deferred to v2
- In v1, `risk_tolerance` is policy annotation + optional hard cap (`max_loss_if_false_per_experiment`), not EV weighting

### DL-03: Integration point with `/lp-prioritize` (HPM-07)

**Decided:** 2026-02-13 (proposed)
**Chosen option:** Inject `portfolio_score_normalized` (derived from HPM-04 composite score) as additive scoring dimension, with explicit hypothesis linkage

**Alternatives considered:**
1. **Replace existing scoring:** Use EV as sole ranking criterion; rejected because loses existing Impact/Learning-Value intuition and breaks backward compatibility
2. **Separate hypothesis ranking:** Run hypothesis ranking independently, don't integrate with `/lp-prioritize`; rejected because doesn't leverage existing prioritization flow
3. **Inject EV only:** Add EV_score directly; rejected because speed/cost signals from portfolio composite would be dropped
4. **Inject normalized portfolio composite score:** Add `portfolio_score_normalized` to combined score formula; **chosen** because preserves existing scoring and keeps speed/cost signal

**Rationale:**
- Additive integration preserves existing behavior for items without hypotheses
- Using portfolio composite score avoids duplicating ranking logic inside `/lp-prioritize`
- Explicit `hypothesis_id` linkage avoids brittle title/description matching as canonical behavior
- Normalization with robust percentile anchors (p10->1, p90->5) is more stable than min/max on outlier-heavy sets
- Graceful degradation: if portfolio metadata or linkage missing, skip hypothesis scoring (no errors)

### DL-04: Portfolio source of truth and comparability guards (HPM-01/HPM-03)

**Decided:** 2026-02-13 (proposed)
**Chosen option:** Derive active/completed state from hypothesis `status`, and use a portfolio default domain (`default_value_unit`, `default_value_horizon_days`) for ranking

**Alternatives considered:**
1. **Duplicate lifecycle arrays in portfolio metadata:** rejected due to drift risk with hypothesis status
2. **Allow mixed units in one ranking run:** rejected due to meaningless cross-unit EV comparisons
3. **Partition into multiple ranked buckets:** deferred; complicates `/lp-prioritize` additive scoring in v1
4. **Default domain + per-item mismatch blocking:** **chosen for v1**

**Rationale:**
- Single source of truth (`status`) avoids synchronization bugs
- Unit/horizon guardrails prevent invalid rankings that appear numerically precise but are semantically wrong
- Default domain keeps ranking and `/lp-prioritize` score-space stable across runs
- If mixed units are needed, future versions can add explicit conversion operators rather than implicit blending

### DL-05: Composite scoring treatment of cost and normalization fallback policy (HPM-04)

**Decided:** 2026-02-13 (proposed)
**Chosen option:** Keep EV net-of-cost and retain a separate cash-risk preference signal (`cost_norm` on `required_spend` only), with deterministic normalization fallback rules

**Alternatives considered:**
1. **EV only (drop cost_norm):** simpler but weakens explicit low-cash-risk preference
2. **EV + cost_norm on total cost (`required_spend + effort_cost`):** rejected as redundant with EV effort monetization
3. **EV + cost_norm on `required_spend` only:** **chosen for v1**

**Rationale:**
- EV remains the primary expected-value signal with full cost internalization
- Separate cash-risk signal captures capital efficiency/reversibility preference explicitly
- Deterministic normalization rules for small-N and flat distributions prevent implementation-dependent rank instability

### DL-06: Budget attribution and enforcement point (HPM-05/HPM-06)

**Decided:** 2026-02-13 (proposed)
**Chosen option:** Attribute spend by `activated_date` in `budget_timezone` and enforce constraints at activation time (`set-status --status active`)

**Alternatives considered:**
1. **Query-time only enforcement:** rejected because success metric would not match operational behavior
2. **Attribute spend by `created_date`:** rejected; drafts can remain inactive for long periods
3. **Attribute spend by `activated_date` + activation gate:** **chosen for v1**

**Rationale:**
- Activation timestamp is the correct event for month-level budget accounting
- Activation gate prevents silent policy violations while preserving manual override (`--force`) for exceptional cases

### DL-07: Forced activation override auditability (HPM-01/HPM-06)

**Decided:** 2026-02-13 (proposed)
**Chosen option:** Require `--force-reason` and persist override metadata in hypothesis frontmatter for forced activation

**Alternatives considered:**
1. **Console-only warning logs:** rejected; not durable for audit/success metrics
2. **Separate audit table:** rejected in v1 due to no-new-table constraint
3. **Frontmatter audit fields on hypothesis entity:** **chosen for v1**

**Rationale:**
- Satisfies “overrides are explicit and logged” without new storage infrastructure
- Keeps audit trail co-located with the hypothesis record used for status transitions

### DL-08: Canonical identifier semantics (HPM-01/HPM-06/HPM-07)

**Decided:** 2026-02-13 (proposed)
**Chosen option:** Canonical hypothesis identifier `id` equals Agent idea entity ID everywhere

**Alternatives considered:**
1. **Separate internal UUID as canonical ID:** rejected due to API/dependency/linkage drift risk
2. **Dual canonical IDs (UUID + idea ID):** rejected due to operator confusion and broken reference integrity
3. **Idea ID canonical + optional `hypothesis_uuid` auxiliary field:** **chosen for v1**

**Rationale:**
- CLI/API paths already resolve on idea ID
- Dependency references and `/lp-prioritize` linkage remain unambiguous
- Optional UUID can still support offline analytics correlation without becoming a runtime foot-gun

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | HPM-01 | - | Schema definition is foundation for all implementation |
| 2 | HPM-02, HPM-03 | HPM-01 | Types/validation and storage contract can run in parallel (both depend on schema) |
| 3 | HPM-04, HPM-05 | HPM-02, HPM-03 | Ranking engine and constraint checker can run in parallel (both depend on types + storage) |
| 4 | HPM-06 | HPM-04, HPM-05 | CLI depends on both ranking and constraints being complete |
| 5 | HPM-07 | HPM-06 | Integration depends on CLI being functional (for testing) |
| 6 | HPM-08 | HPM-07 | End-to-end validation is final gate |

## Integration with Startup Loop

**S5A Prioritize (current):**
- Reads candidate go-items from upstream outputs (lp-readiness, lp-offer, lp-forecast)
- Scores on 3 dimensions: Effort, Impact, Learning-Value
- Ranks by combined score: (Impact + Learning-Value) / Effort

**S5A Prioritize (with hypothesis portfolio integration):**
- Reads candidate go-items from upstream outputs (unchanged)
- **NEW:** Resolves explicit hypothesis linkage (`hypothesis_id` / Agent idea ID or `hypothesis:<id>` tag)
- **NEW:** Applies portfolio default domain filter (`default_value_unit`, `default_value_horizon_days`) before score injection
- **NEW:** If hypothesis linked, injects `portfolio_score_normalized` (0-5) derived from portfolio composite score
- Scores on 4 dimensions: Effort, Impact, Learning-Value, **portfolio_score_normalized** (if hypothesis linked)
- Ranks by combined score: (Impact + Learning-Value + portfolio_score_normalized) / Effort
- Falls back to original formula if no hypothesis linked

**Storage locations:**
- Hypotheses: `ideas` table via Agent API, `tags: ["hypothesis", "hyp:<type>", "unit:<value_unit>"]`
- Portfolio metadata: `stage-docs` table via Agent API, `stage: portfolio-state`, `cardId` = business-level portfolio card

**Skills affected:**
- `/lp-prioritize` — updated to inject normalized portfolio scores (HPM-07)
- No other skills affected in v1

**Future integration points (v2+):**
- `/lp-experiment` (S10) — update hypothesis outcomes (actual vs. expected)
- `/lp-replan` — re-calibrate portfolio constraints based on experiment outcomes
- `/idea-generate` — propose new hypotheses during sweep

## Success Metrics

- **Adoption:** At least 1 business (BRIK or PIPE) uses hypothesis portfolio manager for 3+ experiments in first 90 days
- **Ranking accuracy:** Portfolio ranking aligns with recorded outcomes (`outcome` + observed metric) in ≥70% of cases (validated retrospectively, same unit/horizon sets only)
- **Constraint enforcement:** No unforced portfolio violations (max concurrent, budget cap, risk cap) in first 90 days; all overrides are explicit and logged via persisted `activation_override_*` fields
- **Integration stability:** No regressions in `/lp-prioritize` behavior for items without hypotheses (100% backward compatibility)
- **User feedback:** Hypothesis owners report that EV-based ranking "feels right" or "surfaced experiments we would have missed" (qualitative)

## Phase 0 Constraints

- TypeScript-only (no Python/Rust/sidecars)
- Must use Agent API for all persistence (no direct file writes)
- No new database tables (use ideas + stage-docs)
- Must integrate cleanly with existing `/lp-prioritize` skill (no breaking changes)
- Pete-triggered only (no automated scheduling in v1)

## References

- **Fact-find:** `docs/plans/advanced-math-algorithms-fact-find.md` (Opportunity N)
- **Prioritize skill:** `.claude/skills/lp-prioritize/SKILL.md`
- **Startup loop spec:** `docs/business-os/startup-loop/loop-spec.yaml`
- **Agent API docs:** (inferred from idea-develop, idea-advance skills)

## Next Steps

1. Review this plan with startup-loop owners; confirm integration approach with `/lp-prioritize`
2. Open `/lp-sequence` for HPM-01 (schema definition) to begin implementation
3. Gather 3 example hypotheses from recent BRIK or PIPE experiments to validate schema completeness
4. Build deterministic EV/composite fixtures (including null window and negative EV cases) and cross-check against spreadsheet before TypeScript implementation
