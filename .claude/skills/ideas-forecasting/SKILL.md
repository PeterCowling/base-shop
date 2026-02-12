---
name: ideas-forecasting
description: Build a 90-day startup forecast and proposed goals from a business idea and product specs using web research (competitor analysis, price bands, channel benchmarks, demand signals). Use when a user provides idea/product inputs and wants the agent to set most targets, assumptions, risks, and validation metrics before SFS-00 or ideas-go-faster.
---

# Ideas Forecasting

Use this skill to invert planning: user provides the business idea and products, then the agent proposes practical 90-day targets from external evidence.

## Invocation

```bash
/ideas-forecasting
/ideas-forecasting --biz=HEAD
/ideas-forecasting --biz=PET --country=IT --horizon-days=90
```

Defaults:
- `horizon-days=90`
- `country=IT` if not provided
- focus: speed to first sales for startup businesses

## Inputs

Minimum required:
- `Business code`: e.g. `HEAD`, `PET`
- `Business idea`: one-paragraph concept
- `Products`: list of products with short specs

Strongly recommended:
- `Price intent` (if known): target price or range
- `Channels`: DTC site, marketplaces, social commerce, retail, etc.
- `Budget guardrails`: launch budget cap and ad budget guardrail
- `Stock timeline`: date first sellable stock is available
- `Constraints`: legal, ops, brand, geography, supply chain

## Operating Rules

1. Separate `observed` vs `inferred` in every numeric section.
2. Use scenario ranges (`P10`, `P50`, `P90`), never single-point certainty.
3. Prefer region-relevant recent sources; attach URL + access date.
4. Do not invent competitor metrics when not available.
5. Optimize recommendations for startup speed-to-revenue, not infrastructure perfection.
6. Treat outputs as forecast proposals requiring operator approval.

## Workflow

### Stage 1: Intake and Clarify

1. Capture required inputs.
2. Ask up to 3 high-impact clarification questions if blockers remain.
3. Freeze an intake packet for this run.

### Stage 2: Build Research Prompt

1. Load `references/deep-research-prompt-template.md`.
2. Fill placeholders from intake packet.
3. Keep expected outputs contract intact.

### Stage 3: Run Research

1. Run Deep Research using the filled prompt (preferred).
2. If Deep Research is unavailable, run equivalent manual web research with citation discipline.
3. Collect evidence in a source table before forecasting.

### Stage 4: Forecast and Goal Proposal

Produce:
1. 90-day scenario forecast (`P10/P50/P90`) for:
   - sessions
   - conversion rate
   - AOV
   - orders
   - gross revenue
   - gross margin
   - CAC (if paid channel assumed)
   - payback proxy (when enough data exists)
2. competitor benchmark table (pricing, offer structure, channel posture)
3. proposed targets for first 90 days and first 4 weeks
4. assumption register with confidence tags (`high/medium/low`)
5. risk register with mitigation actions
6. week-1/week-2 validation checklist to recalibrate forecast quickly

### Stage 5: Persist Outputs

Write:
- `docs/business-os/forecasts/<YYYY-MM-DD>-<BIZ>-forecast.user.md`

If this run is intended to seed SFS-00, also write:
- `docs/business-os/startup-baselines/<BIZ>-forecast-seed.user.md`

## Output Contract

`<YYYY-MM-DD>-<BIZ>-forecast.user.md` must include:

1. `Executive Summary` (<=12 bullets)
2. `Input Packet` (what user provided)
3. `Competitor Benchmark Table` (with source links)
4. `90-Day Forecast Table (P10/P50/P90)`
5. `Proposed Outcome Statement`
6. `Proposed Targets`
7. `Assumptions Register`
8. `Risk Register`
9. `First-14-Day Validation Plan`
10. `Source List` (URL + access date)
11. `Confidence and Caveats`

## Definition of Expected Outcomes

An expected outcome in this skill means a measurable 90-day business result with:
- `Outcome statement`: plain-language result
- `Baseline`: starting point now
- `Target`: expected value or range by deadline
- `Deadline`: exact date
- `Leading indicators`: weekly signals proving progress
- `Decision link`: what decision this outcome unlocks

Use forecast evidence to propose these fields; do not leave them blank.

## Integration with Existing Flow

1. Forecasting runs before idea prioritization when startup context is sparse.
2. Approved forecast outcomes seed `SFS-00` business intent baseline.
3. `ideas-go-faster` should use approved forecast outcomes as steering constraints.
4. `fact-find` / `plan-feature` / `build-feature` remain the delivery path for selected go items.

## Red Flags (invalid output)

1. Missing competitor citations for numeric claims.
2. Single-point target claims without scenario ranges.
3. No distinction between observed data and inferred estimates.
4. No first-14-day validation plan.
5. Proposed goals that ignore user budget/stock constraints.
