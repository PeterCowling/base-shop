---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-10
Last-updated: 2026-03-10
Feature-Slug: startup-loop-results-review-queue-unification
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find, lp-do-ideas, startup-loop
Related-Plan: docs/plans/startup-loop-results-review-queue-unification/plan.md
Trigger-Source: direct-operator-decision: results-review-backlog-queue-unification
Trigger-Why: The visible process-improvements backlog is currently fed by both queue-state.json and archived/current build-review sidecars, so build-spotted ideas bypass canonical grading, queue lifecycle, and closure tracking.
Trigger-Intended-Outcome: "type: operational | statement: Queue state becomes the only canonical actionable backlog for idea items, while build-review outputs are admitted into that queue through regular grading, dedupe, and closure paths. | source: operator"
---

# Startup Loop Results-Review Queue Unification Fact-Find Brief

## Scope

### Summary

The current startup-loop backlog is split across two stores:

1. `docs/business-os/startup-loop/ideas/trial/queue-state.json`
2. `results-review.user.md` / `results-review.signals.json` items scraped from `docs/plans/**`

`generate-process-improvements.ts` merges both into one `IDEA_ITEMS` array for `process-improvements.user.html`, so the operator sees one backlog even though only part of it lives in queue lifecycle. That is architecturally weak. It means build-spotted ideas can appear in the visible backlog, be suppressed by `completed-ideas.json`, and influence review/calibration surfaces without ever becoming canonical queue dispatches.

The corrective direction is straightforward: queue must become the only canonical actionable backlog for idea items. Build-review artifacts should remain observation/intake artifacts, but any actionable idea they produce must enter the queue through the normal ideas admission path, with regular classification, dedupe, queue state, and completion.

### Goals

- Make `queue-state.json` the sole canonical actionable backlog for idea items.
- Route build-generated idea candidates through normal `lp-do-ideas` admission and grading instead of direct HTML scraping.
- Collapse closure semantics onto queue lifecycle so report suppression and completion no longer depend on a parallel results-review registry.
- Preserve build-review and pattern-reflection artifacts as evidence/intake, not as a second backlog database.

### Non-goals

- Replacing `results-review.user.md` as the operator-authored post-build observation artifact.
- Removing `risk` or `pending-review` sections from `process-improvements.user.html`.
- Redesigning self-evolving policy or autonomous promotion.
- Forcing a full historical migration in one cut if a bounded compatibility window is safer.

### Constraints & Assumptions

- Constraints:
  - `results-review.user.md` must remain operator-authored and readable as a narrative artifact.
  - Existing ideas classification and queue persistence should be reused rather than reimplemented inside build scripts.
  - Queue migration must stay additive and idempotent while the trial queue remains live.
  - Historical archived build-review artifacts may lack `pattern-reflection.entries.json`, so cutover needs a compatibility rule.
- Assumptions:
  - The correct architecture is “artifacts produce signals, queue owns work,” not “reports aggregate multiple work stores.”
  - `pattern-reflection.entries.json` is the preferred structured build-intake source when present; `results-review.signals.json` is an acceptable fallback during migration.

## Access Declarations

- None.

## Outcome Contract

- **Why:** The visible process-improvements backlog is currently fed by both queue-state.json and archived/current build-review sidecars, so build-spotted ideas bypass canonical grading, queue lifecycle, and closure tracking.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Queue state becomes the only canonical actionable backlog for idea items, while build-review outputs are admitted into that queue through regular grading, dedupe, and closure paths.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `scripts/src/startup-loop/build/generate-process-improvements.ts` - collects backlog items for the HTML and JSON report outputs.
- `scripts/src/startup-loop/build/lp-do-build-results-review-extract.ts` - turns `results-review.user.md` idea bullets into `results-review.signals.json`.
- `scripts/src/startup-loop/build/lp-do-build-pattern-reflection-extract.ts` - turns `pattern-reflection.user.md` into `pattern-reflection.entries.json`.
- `scripts/src/startup-loop/ideas/lp-do-ideas-codebase-signals-bridge.ts` - existing model for deterministic signal-to-queue bridging.
- `scripts/src/startup-loop/ideas/lp-do-ideas-agent-session-bridge.ts` - second existing signal-to-queue bridge.
- `scripts/src/startup-loop/ideas/lp-do-ideas-completion-reconcile.ts` - queue completion plus parallel completed-ideas registry maintenance.
- `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts` - current build-output consumer using results-review and pattern-reflection sidecars outside the canonical ideas queue.

### Key Modules / Files

- `scripts/src/startup-loop/build/generate-process-improvements.ts`
  - Scans all of `docs/plans/**` for `results-review.user.md`.
  - Prefers `results-review.signals.json` sidecars when present.
  - Separately reads `docs/business-os/startup-loop/ideas/trial/queue-state.json`.
  - Merges both into one `ideaItems` array.
- `docs/business-os/process-improvements.user.html`
  - Renders one `IDEA_ITEMS` array and labels low-priority items as `Backlog`, masking the fact that those items come from two different lifecycle systems.
- `scripts/src/startup-loop/build/lp-do-build-results-review-extract.ts`
  - Classifies results-review bullets into `ProcessImprovementItem` records, but only writes sidecars; it does not enqueue them.
- `scripts/src/startup-loop/build/lp-do-build-pattern-reflection-extract.ts`
  - Emits `pattern-reflection.entries.json`, which is already more structured than raw results-review bullets.
- `scripts/src/startup-loop/ideas/lp-do-ideas-completion-reconcile.ts`
  - Reconciles queue completion and also persists `docs/business-os/_data/completed-ideas.json`, keeping results-review-derived ideas on a separate closure rail.
- `scripts/src/startup-loop/ideas/lp-do-ideas-keyword-calibrate.ts`
  - Depends on queue terminal states, but its fast-track path still pulls through the completion-reconcile snapshot and completed-ideas compatibility seam.
- `docs/plans/startup-loop-build-reflection-gate/fact-find.md`
  - Explicitly deferred wiring build reflection output into `generate-process-improvements.ts`, leaving the split architecture in place.

### Patterns & Conventions Observed

- The backlog report is an aggregate view over two stores, not a queue view.
  - Evidence: `collectProcessImprovements()` first harvests `results-review.user.md` / `results-review.signals.json`, then separately harvests `queue-state.json`.
- Archived plan artifacts are still active backlog inputs unless suppressed by `completed-ideas.json`.
  - Evidence: `generate-process-improvements.ts` recursively scans `docs/plans`, excludes `_templates`, but does not exclude `_archive`.
- Results-review idea candidates never enter normal ideas admission by default.
  - Evidence: `lp-do-build-results-review-extract.ts` only emits sidecars; repo search found no build-review-to-queue bridge analogous to the codebase or agent-session bridges.
- Structured build reflection already exists, but it feeds self-evolving rather than the canonical ideas queue.
  - Evidence: `pattern-reflection.entries.json` is consumed by `self-evolving-from-build-output.ts`; no canonical queue consumer was found.
- Queue completion and results-review backlog suppression are different mechanisms.
  - Evidence: queue lifecycle lives in `queue-state.json`, while report suppression for legacy review-derived ideas is keyed by `completed-ideas.json`.

### Data & Contracts

- Types/schemas/events:
  - `ProcessImprovementItem` is a report/render type, not a queue lifecycle contract.
  - `results-review.signals.v1` stores extracted review bullets as idea items.
  - `pattern-reflection.entries.v1` stores structured build patterns with `routing_target` and classifier-compatible fields.
  - `queue-state.json` persists canonical `dispatch` lifecycle.
  - `completed-ideas.v1` persists a second completion registry keyed by results-review source path/title or queue dispatch IDs.
- Persistence:
  - Report source artifacts: `docs/plans/**/results-review.user.md`, `results-review.signals.json`, `pattern-reflection.entries.json`
  - Canonical queue: `docs/business-os/startup-loop/ideas/trial/queue-state.json`
  - Parallel closure registry: `docs/business-os/_data/completed-ideas.json`
- API/contracts:
  - `classifyIdeaItem()` and the regular ideas classifier already exist for priority, urgency, effort, and reason code assignment.
  - `pattern-reflection` schema already carries routing metadata and classifier-compatible subsets, making it a better admission source than raw markdown scraping.

### Dependency & Impact Map

- Upstream dependencies:
  - `/lp-do-build` results-review generation
  - `/lp-do-build` pattern-reflection generation
  - build-side sidecar extraction scripts
- Downstream dependents:
  - `process-improvements.user.html`
  - queue reporting and operator review
  - completion reconcile
  - keyword calibration
  - self-evolving build-output intake
- Likely blast radius:
  - build-side extract/bridge layer
  - ideas queue admission
  - process-improvements generation
  - completion/closure compatibility surfaces
  - migration/backfill utilities for historical review candidates

### Hypothesis & Validation Landscape

#### Key Hypotheses

| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | Queue-only backlog will improve process integrity because every actionable item shares one grading and closure path. | Queue can admit build-review candidates without large noise increase. | Medium | Short |
| H2 | `pattern-reflection.entries.json` is a better primary intake source than raw `results-review.signals.json` because it is already structured for routing. | Pattern-reflection coverage is present for current builds or has a fallback. | Low | Short |
| H3 | `completed-ideas.json` can be retired from “active backlog suppression” once queue-backed closure and report generation are unified. | Queue completion covers all actionable idea origins. | Medium | Medium |

#### Existing Signal Coverage

| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Direct code evidence of dual-source backlog aggregation and parallel closure registry | `generate-process-improvements.ts`, `lp-do-ideas-completion-reconcile.ts` | High |
| H2 | Pattern-reflection extractor and schema already exist, plus classifier compatibility was documented earlier | `lp-do-build-pattern-reflection-extract.ts`, `startup-loop-build-reflection-gate/task-01-schema-spec.md` | High |
| H3 | Completion-reconcile already joins queue state and completed-ideas; retirement path is plausible but not yet implemented | `lp-do-ideas-completion-reconcile.ts`, `lp-do-ideas-keyword-calibrate.ts` | Medium |

#### Falsifiability Assessment

- Easy to test:
  - Whether a build-review-origin idea can be admitted into queue with normal classifier output.
  - Whether `process-improvements` can render idea backlog from queue only.
  - Whether archived results-review items disappear from active backlog unless queued.
- Hard to test:
  - Historical migration completeness without deciding a cutover policy.
  - Whether build-review queue intake causes unacceptable queue noise without a short live trial.
- Validation seams needed:
  - Build-review-to-queue bridge tests.
  - Generator/report tests asserting queue-only idea sourcing.
  - Completion compatibility tests during registry retirement or demotion.

### Test Landscape

#### Test Infrastructure

- Frameworks:
  - TypeScript unit/integration tests under `scripts/src/startup-loop/__tests__`
- Commands:
  - `pnpm exec tsc -p scripts/tsconfig.json --noEmit`
  - `pnpm --filter scripts lint`
  - `bash scripts/validate-changes.sh`
- CI integration:
  - Jest is CI-only per repo policy.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Process improvements generator | Unit/integration | `scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts` | Covers item extraction, sidecar preference, completed-ideas suppression, and HTML updates. |
| Results-review extraction | Unit | `scripts/src/startup-loop/__tests__/lp-do-build-results-review-extract.test.ts` | Covers sidecar emission and fail-open behavior. |
| Queue completion reconcile | Unit/integration | `scripts/src/startup-loop/__tests__/lp-do-ideas-completion-reconcile.test.ts` | Covers queue closure plus completed registry updates. |
| Build-output self-evolving intake | Integration | `scripts/src/startup-loop/__tests__/self-evolving-signal-integrity.test.ts` | Confirms results-review and pattern-reflection sidecars are read for self-evolving. |

#### Coverage Gaps

- Untested paths:
  - No build-review-to-queue bridge exists yet.
  - No queue-only report mode exists for idea backlog.
  - No migration/backfill tests exist for historical results-review candidates into queue.
- Extinct tests:
  - None identified.

#### Testability Assessment

- Easy to test:
  - Queue bridge input/output and dedupe.
  - Generator behavior after removing direct results-review idea sourcing.
  - Completed-ideas compatibility or retirement rules.
- Hard to test:
  - Historical archive backfill behavior against the real repo without introducing fragile fixture drift.
- Test seams needed:
  - A stable build-review bridge module with pure input/output logic.
  - Report generator seams for “queue-only idea mode”.

### Recent Git History (Targeted)

- `docs/plans/startup-loop-build-reflection-gate/fact-find.md`
  - Deliberately preserved `results-review.user.md` as operator-authored and deferred report-pipeline integration, which left actionable build reflection outside the canonical queue.
- `docs/plans/startup-loop-build-reflection-gate/plan.md`
  - Completed `pattern-reflection.user.md` and sidecar generation, so the repo now has a structured build-reflection artifact but still no queue admission for it.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Backlog generation path | Yes | Major: report backlog is sourced from both queue and build-review sidecars, so “backlog” is not a canonical queue view. | Yes |
| Build-review structured signal path | Yes | Major: structured build reflection exists, but it routes to self-evolving and promotion tooling, not to canonical ideas admission. | Yes |
| Completion and suppression model | Partial | Major: `completed-ideas.json` acts as a parallel closure rail for review-derived ideas and still influences active backlog visibility. | Yes |
| Historical archive behavior | Partial | Moderate: archived results-review files remain active backlog inputs unless suppressed, so cutover needs either migration or an explicit compatibility boundary. | Yes |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** the problem is tightly bounded to canonical idea intake, backlog rendering, and closure semantics. It does not require a redesign of build reflection, self-evolving, or the broader startup-loop routing model.

## Questions

### Resolved

- Q: Is this only a presentation problem in `process-improvements.user.html`?
  - A: No. The HTML is just the symptom. The underlying issue is that actionable items are being stored and closed through two different systems.
  - Evidence: `generate-process-improvements.ts`, `lp-do-ideas-completion-reconcile.ts`, `completed-ideas.json`
- Q: Do we already have a repo pattern for signal-to-queue admission?
  - A: Yes. The codebase and agent-session bridges already use deterministic bridge scripts to admit signals into the ideas queue.
  - Evidence: `lp-do-ideas-codebase-signals-bridge.ts`, `lp-do-ideas-agent-session-bridge.ts`
- Q: Should raw `results-review.user.md` bullets become queue entries directly?
  - A: Not as raw markdown. The repo already has structured build-review sidecars, and `pattern-reflection.entries.json` is the cleaner primary source because it carries routing semantics and classifier-compatible data.
  - Evidence: `lp-do-build-results-review-extract.ts`, `lp-do-build-pattern-reflection-extract.ts`, `startup-loop-build-reflection-gate/task-01-schema-spec.md`
- Q: Should results-review be retired?
  - A: No. The narrative review artifact remains valuable as operator evidence. The change is to stop treating it as a backlog database.
  - Evidence: `startup-loop-build-reflection-gate/fact-find.md`

### Open (Operator Input Required)

None.

## Confidence Inputs

- **Implementation:** 84%
  - Evidence basis: the core seams are explicit and already modular: build extraction, ideas bridges, queue generation, and completion reconcile.
  - What raises this to >=80: already satisfied.
  - What raises this to >=90: a call-site map for every remaining `completed-ideas.json` consumer plus a chosen historical cutover strategy.
- **Approach:** 90%
  - Evidence basis: “artifacts as signals, queue as work” matches the repo’s better patterns and uses existing classifier/bridge infrastructure instead of inventing another store.
  - What raises this to >=80: already satisfied.
  - What raises this to >=90: confirm the preferred intake order (`pattern-reflection` primary, `results-review.signals` fallback) in plan detail and prove no missing current-build coverage.
- **Impact:** 93%
  - Evidence basis: this fixes a direct integrity problem in visible backlog state, grading, and closure reporting.
  - What raises this to >=80: already satisfied.
  - What raises this to >=90: already satisfied.
- **Delivery-Readiness:** 85%
  - Evidence basis: the bridge pattern and test surfaces already exist, but the cutover touches multiple queue/report/compatibility seams.
  - What raises this to >=80: already satisfied.
  - What raises this to >=90: choose whether historical archive ideas are backfilled or explicitly excluded after cutover.
- **Testability:** 83%
  - Evidence basis: most of the hard changes are deterministic data-flow transformations with existing test harnesses nearby.
  - What raises this to >=80: already satisfied.
  - What raises this to >=90: add fixture-driven historical migration tests and queue-only report drift checks in the plan.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Naively enqueueing every build-review bullet creates queue noise | Medium | High | Use structured build sidecars and the existing ideas classifier/dedupe path; do not ingest raw markdown directly. |
| Queue-only cutover breaks historical backlog visibility | Medium | Medium | Decide explicitly between bounded backfill of historical build-review ideas or an operator-visible cutover boundary. |
| `completed-ideas.json` retirement breaks downstream consumers | High | Medium | Migrate report suppression and calibration consumers together, or demote the registry to a derived compatibility artifact before removal. |
| Pattern-reflection and results-review sidecars could both admit the same idea | Medium | Medium | Define source precedence and stable dedupe identity in the bridge contract. |

## Planning Constraints & Notes

- Must-follow patterns:
  - Queue is the only canonical actionable backlog for idea items.
  - Build-review artifacts remain evidence/intake only.
  - Prefer `pattern-reflection.entries.json` as primary queue bridge input; use `results-review.signals.json` only as compatibility fallback.
  - Reuse existing ideas classifier and queue persistence contracts.
  - The report may continue to source `risk` and `pending-review` from their current artifacts even after idea backlog unification.
- Rollout/rollback expectations:
  - Safe sequence is: add bridge -> validate queue admission -> switch report to queue-only ideas -> migrate/demote `completed-ideas.json`.
  - Rollback should be possible by keeping the direct report source behind a temporary compatibility branch until queue-backed build intake is proven.
- Observability expectations:
  - Report/data output should expose whether an idea item is queue-backed and whether its origin was build-review intake.
  - Cutover should produce an explicit count of build-origin queue items so queue starvation or over-admission is visible.

## Suggested Task Seeds (Non-binding)

1. Implement a deterministic build-review-to-queue bridge that prefers `pattern-reflection.entries.json` and falls back to `results-review.signals.json`, reusing standard ideas classification and dedupe.
2. Change `generate-process-improvements.ts` so `ideaItems` come only from canonical queue state, not directly from results-review sidecars or markdown.
3. Migrate or demote `completed-ideas.json` so active backlog suppression and completion are queue-derived rather than registry-derived.
4. Define and implement a bounded historical cutover: either backfill archived build-review-origin ideas into queue or explicitly exclude pre-cutover review artifacts from active backlog.

## Execution Routing Packet

- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `lp-do-ideas`
  - `startup-loop`
- Deliverable acceptance package:
  - queue bridge code and tests
  - process-improvements generator/report update and tests
  - completion compatibility update and tests
  - explicit cutover/backfill decision recorded in plan
- Post-delivery measurement plan:
  - verify every active backlog idea in `process-improvements.user.html` is traceable to a queue dispatch
  - verify build-origin idea candidates receive normal queue classification fields
  - verify completing a build-origin idea closes it through queue lifecycle without requiring direct `completed-ideas.json` suppression

## Evidence Gap Review

### Gaps Addressed

- Confirmed the backlog report is sourced from both results-review sidecars and queue state.
- Confirmed there is no existing build-review-to-queue bridge.
- Confirmed structured build reflection already exists in `pattern-reflection.entries.json`.
- Confirmed completion/suppression still uses a parallel `completed-ideas.json` registry.

### Confidence Adjustments

- Approach confidence increased because the repo already contains the right building blocks: signal bridges, classifier, pattern-reflection sidecars, and queue completion logic.
- Delivery confidence remains below 90 because historical cutover and registry retirement are still planning choices, not solved code paths.

### Remaining Assumptions

- Current build workflows generate enough structured reflection data for queue admission without requiring another artifact format.
- Historical archive behavior can be handled by either bounded backfill or explicit cutover, without needing indefinite dual-read mode.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items:
  - None.
- Recommended next step:
  - `/lp-do-plan`
