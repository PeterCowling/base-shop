---
Type: Fact-Find
Outcome: Planning
Status: Proposed
Domain: Business-OS
Workstream: Venture-Studio
Created: 2026-02-11
Last-updated: 2026-02-11
Last-reviewed: 2026-02-11
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-from-spec-skill-library
Deliverable-Type: multi-deliverable
Execution-Track: mixed
Primary-Execution-Skill: lp-build
Supporting-Skills: lp-fact-find, lp-plan, idea-generate, idea-readiness
Business-OS-Integration: on
Business-Unit: BOS
---

# Startup-From-Spec Skill Library — Fact-Find Brief

## Scope

### Summary
Design a reusable, agent-executable startup skill library for venture-studio B2C businesses where the user provides a product spec and the system contributes heavily from the first run. The system must be startup-native (fast learning loops, commercial outcomes, bounded risk), while still handing approved execution into the existing delivery path: `lp-fact-find -> lp-plan -> lp-build`.

### Goals
- Convert one product spec into a 90-day execution system with minimal operator burden.
- Support high contribution by default: assume-and-proceed unless a question blocks a decision.
- Run two startup tracks in parallel now (`HEAD`, `PET`) with separate budgets and separate context windows.
- Produce adaptive downstream seeding volume based on context headroom and item complexity (not fixed Top-K).
- Keep output commercially biased toward first sales and decision quality.

### Non-goals
- Replacing mature-business governance for all businesses.
- Rewriting the entire `/idea-generate` system in this step.
- Hardcoding fixed budgets/channels/automation levels in advance of evidence.

### Confirmed User Constraints (from this thread)
1. Startup horizon: 90 days.
2. Preorders before stock: allowed.
3. Initial launch geography: Italy.
4. Initial rollout businesses: `HEAD` and `PET` (parallel, no single-pilot-only approach).
5. Budgets: separate per business.
6. Budget/channels/kill thresholds/manual-vs-automation should be computed by skills, not pre-specified.
7. Ideas stage may be bypassed, but any approved work must enter the existing `lp-fact-find -> lp-plan -> lp-build` pipeline.
8. Common scorecard is acceptable across startup businesses.
9. Supply lead-time assumption: ~60 days order-to-availability.

## Evidence Audit (Current State)

### Existing Ideas-Go-Faster behavior is structured but not startup-native
- Two current stances: `improve-data` and `grow-business`.
  - Evidence: `.claude/skills/idea-generate/SKILL.md:17`, `.claude/skills/idea-generate/SKILL.md:18`, `.claude/skills/idea-generate/SKILL.md:19`
- Sales-first split already encoded (`95%` direct sales outcomes, `<=5%` side-project platform work).
  - Evidence: `.claude/skills/idea-generate/SKILL.md:79`
- Fact-find seeding is currently fixed to global Top-K with `K=3` max.
  - Evidence: `.claude/skills/idea-generate/SKILL.md:763`, `.claude/skills/idea-generate/SKILL.md:780`, `.claude/skills/idea-generate/SKILL.md:1239`
- Existing flow already preserves downstream delivery path (`lp-fact-find -> lp-plan -> lp-build`).
  - Evidence: `.claude/skills/idea-generate/SKILL.md:825`, `.claude/skills/idea-generate/SKILL.md:1204`, `.claude/skills/idea-generate/SKILL.md:1206`

### Current startup data quality is low
- `HEAD` explicitly has no locked current-cycle outcome and unmeasured demand/conversion signals.
  - Evidence: `docs/business-os/strategy/HEAD/plan.user.md:18`, `docs/business-os/strategy/HEAD/plan.user.md:59`, `docs/business-os/strategy/HEAD/plan.user.md:63`
- `PET` is scaffolded and still has unmeasured demand/margin signals.
  - Evidence: `docs/business-os/strategy/PET/plan.user.md:17`, `docs/business-os/strategy/PET/plan.user.md:59`, `docs/business-os/strategy/PET/plan.user.md:63`
- Readiness remains blocked for idea generation reliability in current audit state.
  - Evidence: `docs/business-os/readiness/2026-02-11-idea-readiness.user.md:5`, `docs/business-os/readiness/2026-02-11-idea-readiness.user.md:12`

## Problem Statement

Current orchestration is strong on auditability and quality gates, but startup suboptimal in three specific ways:
1. Fixed seeding volume (`K=3`) does not match variable startup complexity and context headroom.
2. The process starts from idea portfolio mechanics rather than a direct spec-to-launch operating flow.
3. Startup questions (budget envelope, channel sequencing, kill thresholds, manual-vs-automation mode) are not first-class computed outputs.

Result: early-stage businesses risk either under-activation (too few obvious Go items) or capability collapse (context overload on complex decisions).

## Proposed Target Model: Spec-to-Launch Skill Library

### Top-level orchestrator
`/startup-from-spec`

Input: one product specification.

Output: one startup execution pack per business track (initially `HEAD` and `PET`) including:
- 90-day outcome contract
- budget envelope recommendation
- channel strategy (Italy)
- no-stock demand test (preorder allowed)
- unit economics frame
- 60-day supply plan
- weekly kill/pivot/continue/scale loop
- adaptive Go-item seeding manifest for downstream execution

### Operating principle: high contribution first
- Default policy: propose full draft decisions with explicit assumptions.
- Ask questions only when unanswered data blocks a specific decision or introduces unacceptable risk.
- Every assumption must be logged with confidence and fastest falsification test.

### Baseline Context Contract (Mandatory before startup pack generation)

Startup execution must begin with explicit baseline ingestion, not greenfield ideation.

#### Stage 0a: Business Intent Harvest
Read and normalize, per business (`HEAD`, `PET`):
1. Strategy plan (`docs/business-os/strategy/<BIZ>/plan.user.md`).
2. Outcome/readiness context (current blockers, missing metrics, decision links).
3. Constraints and timing assumptions (Italy-first, 90-day horizon, 60-day supply lead).

#### Stage 0b: Existing Work Harvest (Kanban + Ideas)
Read and normalize via Business OS sources:
1. Existing cards by lane/priority/business/blocked state.
2. Existing ideas (`inbox` + `worked`) and prior stage-doc context.
3. Existing lp-fact-find/plan/build artifacts linked to active cards.

#### Stage 0c: Startup Baseline Merge
Produce one merged baseline per business:
1. `Business-Now` summary (intent + constraints + measured/unmeasured signals).
2. `Existing-Work-Now` summary (cards/ideas already in motion).
3. Candidate classification for proposed actions:
   - `reuse-existing`
   - `adapt-existing`
   - `new`
4. Coverage flags where baseline confidence is low or stale.

This baseline is a required input to startup decision-pack generation.

## Proposed Reusable Skills (Library)

| Skill | Purpose | Core Output |
|---|---|---|
| `startup-spec-intake-normalize` | Convert raw product spec into structured decision input | Normalized startup brief |
| `startup-clarify-blockers` | Ask only blocker questions | Blocker resolution log |
| `startup-outcome-contract` | Set one 90-day commercial outcome | Outcome contract + decision link |
| `startup-budget-envelope` | Compute Lean/Base/Push budget scenarios | Budget envelope + spend categories |
| `startup-channel-selector-italy` | Rank channel strategy for Italy launch | Primary + fallback channels + no-go list |
| `startup-offer-unit-econ` | Build first-pass pricing/cost/margin decision model | Unit economics table + kill threshold |
| `startup-preorder-demand-test` | Design no-stock traction test (preorders allowed) | Demand test protocol + success gates |
| `startup-60d-supply-plan` | Align demand decisions to 60-day lead time | Order decision timeline + checkpoints |
| `startup-ops-mode` | Choose manual now vs automate later | Stage-gated ops mode contract |
| `startup-weekly-kpcs-loop` | Weekly Kill/Pivot/Continue/Scale governance | Weekly decision memo template |
| `startup-go-seeding-adaptive` | Compute how many Go items can be safely seeded | Dynamic seeding manifest |
| `startup-handoff-delivery` | Push approved work into existing pipeline | `lp-fact-find` seeds + plan handoff list |

## Adaptive Seeding Contract (Context-Budget Driven)

### Why
Fixed `Top-K` is appropriate for controlled idea sweeps, but startup execution requires variable throughput: many simple obvious moves in some weeks, very few complex moves in others.

### Contract
Per business run (`HEAD` and `PET` independently):
1. Reserve context headroom for synthesis/reconciliation (`30%` reserve).
2. Score each Go item for complexity:
   - `simple` cost = `1`
   - `medium` cost = `4`
   - `complex` cost = `16`
3. Compute value density for ranking:
   - `value_density = (priority_weight * confidence * impact) / complexity_cost`
4. Seed in rank order until available budget is exhausted.
5. Apply bounds:
   - floor: `1` (if at least one valid Go exists)
   - cap: `20`
6. On context degradation signals:
   - mild degradation: clamp `K_dynamic <= 3`
   - severe degradation: clamp `K_dynamic = 1`

### Expected behavior
- If Go items are obvious and simple, seeding can be high (e.g., 10-20).
- If Go items are complex/high-unknown, seeding stays narrow (e.g., 1-3).

## Parallel Execution Model (HEAD + PET)

1. Run separate coordinator contexts for `HEAD` and `PET`.
2. Maintain separate budget envelopes and decision ledgers.
3. Share only common policy artifacts (scorecard definition, gate rules), not per-business deliberation context.
4. Merge only final summaries and approved handoff manifests.

This prevents cross-business context inflation and preserves decision quality.

## Kanban Usage Boundaries

The existing Business OS kanban is used heavily, but as one of two required sources.

Use kanban for:
1. Existing work inventory (ideas/cards/stage-docs).
2. Progress/blocked/dependency state.
3. Prior deliberation evidence and execution history.

Do not use kanban alone for:
1. Defining current business outcomes.
2. Defining startup commercial thresholds (demand, conversion, margin, channel strategy).
3. Replacing explicit outcome contracts and decision links in strategy/readiness artifacts.

## Common Startup Scorecard (Shared Across HEAD and PET)

1. Demand signal quality.
2. Conversion signal quality.
3. Unit economics viability (margin proxy).
4. Acquisition efficiency (CAC/payback proxy).
5. Supply/fulfillment readiness against 60-day lead assumptions.
6. Learning velocity (cycle time from hypothesis to decision).

## Handoff Contract to Existing Delivery System

By design, this startup library may bypass classic idea-generation output, but not execution discipline.

Approved Go items must route to:
1. `lp-fact-find` (deep dive)
2. `lp-plan` (confidence-gated plan)
3. `lp-build` (implementation)

No direct bypass of delivery gates for implementation work.

## Input Contract: Product Spec (Minimum)

Required from user:
1. Product concept statement.
2. Intended customer segment.
3. Problem/value proposition hypothesis.
4. Any known constraints (cost, sourcing, legal, brand, delivery).

Optional (system can assume and test):
- Target price band.
- Candidate channels.
- Margin expectations.
- Ops constraints.

When optional fields are missing, the system must:
1. create explicit assumptions,
2. assign confidence,
3. attach falsification tests,
4. continue unless blocked.

## Risks and Controls

1. Risk: over-assuming without operator visibility.
   - Control: assumption ledger + blocker-only question policy.
2. Risk: context loss in high-volume seeding.
   - Control: adaptive seeding with reserve + degradation clamps.
3. Risk: startup speed undermines quality gates.
   - Control: retain downstream `lp-fact-find -> lp-plan -> lp-build` contract.
4. Risk: parallel business runs cross-contaminate priorities.
   - Control: strict per-business context and budget separation.

## Open Decisions (Needs User Confirmation Later)

1. Default risk cap per startup before mandatory operator check (cash-at-risk ceiling).
2. Minimum compliance checklist for Italy-first launch in each product category.
3. Whether adaptive seeding should expose manual override (`--seed-cap`) for exceptional weeks.

## Confidence Inputs (for /lp-plan)

- Implementation: 80%
  - Rationale: mostly skill-contract and orchestration changes, not deep platform rewrite.
- Approach: 86%
  - Rationale: directly aligned to user constraints and current process gaps.
- Impact: 92%
  - Rationale: materially improves startup throughput without discarding delivery rigor.
- Testability: 74%
  - Rationale: behavior can be validated by dry-runs across HEAD/PET, but adaptive context metrics need explicit validation harness.

### What would make confidence >=90%
1. Add deterministic test fixtures for simple/medium/complex Go-item pools and verify `K_dynamic` behavior.
2. Run paired dry-runs for `HEAD` and `PET` and verify separate-budget/separate-context outputs.
3. Validate degraded-context clamp behavior under simulated context pressure.
4. Confirm Italy compliance baseline checklist per category.

## Suggested Planning Task Seeds (Non-binding)

1. Define `/startup-from-spec` orchestration contract and invocation syntax.
2. Implement `startup-spec-intake-normalize` + `startup-clarify-blockers`.
3. Implement budget/channel/econ/supply skill set with Italy-first defaults.
4. Implement adaptive seeding engine and manifest schema.
5. Wire handoff to `lp-fact-find -> lp-plan -> lp-build`.
6. Add dry-run validation suite for HEAD/PET parallel execution.
7. Update operator docs and runbooks.
