---
Type: Build-Record
Status: Complete
Feature-Slug: reflection-prioritization-policy-implementation
Completed-date: 2026-02-26
artifact: build-record
---

# Build Record — Reflection Prioritization Policy Implementation

## What Was Built

**TASK-01 + TASK-02 (Wave 1+2): Types and classifier module**

Created `scripts/src/startup-loop/lp-do-ideas-classifier.ts` — a new pure-function classifier module implementing the externally-reviewed canonical idea prioritization policy (v2). Exports `classifyIdea(input, options)` which applies an 8-tier decision tree (P0/P0R/P1+proximity/P1M/P2–P5), evidence-gated urgency admission (U0–U3), auto-demotion on missing evidence, and `effective_priority_rank` computation. All types are exported: `PriorityTier`, `Proximity`, `Urgency`, `Effort`, `ReasonCode`, `IdeaClassificationInput`, `IdeaClassification`, `ClassifierOptions`, `OWN_PRIORITY_RANK`. The module is side-effect-free with an injectable clock for deterministic `classified_at` timestamps. Commit: `29d15c577e` (reclassified under `6282567ca1` after rebase).

**TASK-03 (Wave 3): Classifier tests**

Created `scripts/src/startup-loop/__tests__/lp-do-ideas-classifier.test.ts` with 33 test cases across 6 describe blocks covering: all 8 decision tree branches, all 3 auto-demotion paths, U0/U1/U2/U3 urgency gates, all 10 `own_priority_rank` values, Phase 1 defaults (`effort: "M"`, `is_prerequisite: false`, `parent_idea_id: null`), and `OWN_PRIORITY_RANK` constant. Fixed ESLint simple-import-sort violation. All 33 pass. Commit: `4b6a1f3964`.

**TASK-05 (Wave 3): Persistence and trial contract**

Pre-existing: `appendClassifications()` in `lp-do-ideas-persistence.ts`, `classifications.jsonl` (empty), and the trial contract Section 6 row were all already implemented. Wave 3 analysis confirmed no additional work was needed. Accepted as-is.

**TASK-06 (Wave 3): SKILL.md evidence field guidance**

Added `## Evidence Fields for Classification` section to `.claude/skills/lp-do-ideas/SKILL.md`. Table of 12 evidence fields with plain-language guidance on when to ask for each. Concrete examples. Advisory tone — absence does not block intake. Commit: `4b6a1f3964`.

**TASK-04 (Wave 4): Orchestrator wiring**

Extended `TrialOrchestratorResult` with `classifications: IdeaClassification[]`. Added `classifyIdea()` call after each `dispatched.push()` in `runTrialOrchestrator()`, wrapped in non-fatal try/catch with stderr logging. Populated `IdeaClassificationInput` from packet `trigger`, `artifact_id`, `area_anchor`, and `evidence_refs`. JSDoc on the new field directs callers to persist via `appendClassifications()`. Fixed ESLint import sort. 87/87 existing tests pass. Commit: `f4c6edfcfc`.

## Tests Run

| Command | Result |
|---|---|
| `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --testPathPattern=lp-do-ideas-classifier` | 33/33 pass |
| `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --testPathPattern=lp-do-ideas-trial` | 87/87 pass |
| `npx tsc --project scripts/tsconfig.json --noEmit` | 0 errors |
| `pnpm lint` (scripts package) | 0 errors, 0 warnings |

## Validation Evidence

**TASK-01 / TASK-02:**
- TC-01: `IdeaClassification` has all 22+ fields — confirmed (720-line file, all Section 4.1–4.4 fields present)
- TC-02: `proximity === null` for non-P1 tiers — confirmed (TC-21–25 in test suite)
- TC-03: `RULE_INSUFFICIENT_EVIDENCE` in `ReasonCode` — confirmed; TC-10/11 exercise auto-demotion path
- TC-04–TC-10: All classifier decision tree acceptance cases — confirmed via test suite

**TASK-03:**
- 33 test cases covering all 8 tiers, all 3 demotion paths, all urgency gates, all rank values
- `classified_by === "lp-do-ideas-classifier-v1"` asserted in every describe block
- Leakage U0 gate disabled by default confirmed (TC covering `u0_leakage_threshold: undefined`)

**TASK-04:**
- `result.classifications` contains one `IdeaClassification` per dispatched packet
- Non-fatal error path: classifier throw → dispatch continues, error logged to stderr
- 87/87 existing orchestrator tests pass (additive change — no regressions)

**TASK-05:**
- `appendClassifications`, `classifications.jsonl`, trial contract row all pre-existing and confirmed present
- No new test failures introduced

**TASK-06:**
- "## Evidence Fields for Classification" section present in SKILL.md
- All 12 Section 4.4 field names present in the table
- No system-internal nouns in guidance text

## Scope Deviations

None. All work was strictly within the scope of the six tasks. TASK-05 was confirmed pre-existing (no additional code needed) — this is a scope reduction, not an expansion.

## Outcome Contract

- **Why:** The current pipeline generates dispatch packets with no canonical classification. Any priority assignment is ad-hoc. The externally-reviewed policy v2 defines an auditable, deterministic schema that, once implemented in advisory mode, lets the operator calibrate tier and urgency distributions before enforcement is turned on.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Advisory-phase classifier module implemented — every idea dispatched through the trial pipeline receives a complete canonical classification record (priority_tier, urgency, effort, reason_code, effective_priority_rank) persisted to the trial artifact store, without gating or blocking existing pipeline flow. Rollout Phase 1 of the canonical policy is complete.
- **Source:** operator
