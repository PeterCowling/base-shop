---
Type: Plan
Status: Complete
Domain: Platform
Workstream: Engineering
Created: 2026-03-06
Last-reviewed: 2026-03-06
Last-updated: 2026-03-06
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-placeholder-signal-hygiene
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: startup-loop, lp-do-ideas
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Startup Loop Placeholder Signal Hygiene Plan

## Summary
The self-evolving startup-loop runtime is ingesting `## New Idea Candidates` placeholder bullets such as `New open-source package — None.` and converting them into live observations and validated candidates. This plan fixes the placeholder-detection seam in the canonical build-output ingestion path, adds runtime hygiene so contaminated placeholder observations cannot generate candidates even if they already exist on disk, and remediates the current polluted BRIK runtime artifacts so the live report reflects trustworthy state.

## Active tasks
- [x] TASK-01: Prevent placeholder build-output ideas from entering self-evolving ingestion
- [x] TASK-02: Add runtime hygiene and remediate the current BRIK self-evolving store

## Goals
- Block category-labelled `None` placeholders from the self-evolving build-output bridge.
- Reuse one canonical placeholder detector across markdown parse, sidecar consumption, and runtime hygiene paths.
- Ensure placeholder observations already present in self-evolving storage cannot keep producing validated candidates.
- Remove the currently contaminated placeholder observations, events, candidates, and queue entries from BRIK runtime artifacts.
- Prove the repaired report no longer shows placeholder-derived candidates.

## Non-goals
- Redesigning the broader self-evolving governance model.
- Reworking scoring, routing, or autonomy policy beyond placeholder hygiene.
- Migrating trial/live queue formats or changing unrelated process-improvements behavior.

## Constraints & Assumptions
- Constraints:
  - No local Jest execution; validation is typecheck + lint + deterministic CLI/report checks only.
  - Keep existing self-evolving contracts backward compatible.
  - Limit scope to startup-loop scripts and the directly affected self-evolving runtime artifacts.
- Assumptions:
  - The BRIK runtime contamination seen on 2026-03-06 is representative of the failure mode to remediate.
  - Deterministic cleanup of placeholder-derived runtime entries is acceptable because those entries are known-invalid by contract.

## Inherited Outcome Contract
- **Why:** Placeholder text in results-review artifacts is being mistaken for actionable improvement work, which poisons the self-evolving runtime and breaks operator trust.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The self-evolving startup-loop runtime rejects placeholder `None` idea bullets at every build-output ingestion seam, ignores any existing placeholder observations during candidate generation, and the current BRIK runtime store no longer contains placeholder-derived observations or validated candidates.
- **Source:** operator

## Proposed Approach
- Introduce a shared placeholder-idea detector in the results-review parse module and consume it from all relevant callers.
- Harden `self-evolving-from-build-output.ts` with defense-in-depth filtering for both markdown and sidecar input paths, plus a final pre-observation seed guard.
- Add runtime hygiene helpers that identify placeholder-derived self-evolving observations/candidates from their signal hints and problem statements.
- Run a bounded remediation against the current BRIK runtime files so the on-disk store matches the repaired contract.

## Plan Gates
- Foundation Gate: Pass
- Build Gate: Pass
- Auto-Continue Gate: Pass

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Canonicalize placeholder detection across results-review parse and build-output ingestion | 91% | M | Complete (2026-03-06) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Add runtime hygiene, scrub BRIK placeholder artifacts, and verify clean self-evolving report output | 84% | M | Complete (2026-03-06) | TASK-01 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Shared detection first so remediation uses the final contract |
| 2 | TASK-02 | TASK-01 | Runtime cleanup depends on the new hygiene helpers |

## Tasks

### TASK-01: Canonicalize placeholder detection across results-review parse and build-output ingestion
- **Type:** IMPLEMENT
- **Deliverable:** code changes in the startup-loop results-review parse/extract/build-output ingestion path
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-06)
- **Affects:** `scripts/src/startup-loop/build/lp-do-build-results-review-parse.ts`, `scripts/src/startup-loop/build/lp-do-build-results-review-extract.ts`, `scripts/src/startup-loop/build/generate-process-improvements.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 91%
  - Implementation: 92% - localized to one parse module and its direct consumers.
  - Approach: 91% - one shared detector is safer than duplicated regex forks.
  - Impact: 91% - closes the specific ingestion seam that admitted placeholder bullets.
- **Acceptance:**
  - Category-labelled placeholder bullets such as `New open-source package — None.` are rejected by the canonical parse helpers.
  - `self-evolving-from-build-output.ts` filters placeholder items on both markdown and sidecar input paths.
  - Defense-in-depth prevents placeholder observation seeds from being generated even if an upstream caller passes one through.
- **Validation contract (TC-01):**
  - TC-01: Source inspection shows the build-output bridge imports the shared placeholder detector instead of duplicating regex logic.
  - TC-02: Archived results-review examples containing `New open-source package — None.` no longer yield build-output candidate bullets when parsed through the live bridge logic.
  - TC-03: `generate-process-improvements.ts` and `lp-do-build-results-review-extract.ts` continue to suppress placeholder ideas via the shared helper.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - `sed -n '1,320p' scripts/src/startup-loop/build/lp-do-build-results-review-parse.ts`
    - `sed -n '360,620p' scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts`
    - `sed -n '1,260p' docs/plans/_archive/agent-failure-instruction-contract/results-review.user.md`
    - `sed -n '1,260p' docs/plans/_archive/email-logging-observability/results-review.user.md`
  - Validation artifacts:
    - `docs/plans/_archive/agent-failure-instruction-contract/results-review.user.md`
    - `docs/plans/_archive/email-logging-observability/results-review.user.md`
  - Unexpected findings:
    - Placeholder bullets are still present in archived results-review artifacts and have already polluted BRIK runtime storage.
- **Consumer tracing (required):**
  - New outputs:
    - None: shared helper only; output shapes remain unchanged.
  - Modified behavior:
    - `extractResultsReviewSignals()` changes which idea bullets qualify for sidecar emission.
    - `runSelfEvolvingFromBuildOutput()` changes which idea bullets become observations.
    - `collectProcessImprovements()` changes which raw results-review bullets survive filtering, but only for placeholder text already intended to be ignored.
- **Edge Cases & Hardening:** Treat category-labelled placeholders and bare `None` variants as equivalent invalid inputs; do not suppress substantive ideas that merely mention the word `none` in a non-placeholder sentence.
- **Rollout / rollback:**
  - Rollout: immediate on next build-output bridge run.
  - Rollback: revert the parse/build-output files together.
- **Build completion evidence:**
  - Added shared `isNonePlaceholderIdeaCandidate()` logic in `lp-do-build-results-review-parse.ts`.
  - Replaced duplicated placeholder suppression in `generate-process-improvements.ts` and `lp-do-build-results-review-extract.ts` with the shared helper.
  - Hardened `self-evolving-from-build-output.ts` to filter placeholder bullets on markdown parse, sidecar read, and final observation generation.
  - Added regression coverage for category-labelled `None` placeholders in:
    - `scripts/src/startup-loop/__tests__/lp-do-build-results-review-extract.test.ts`
    - `scripts/src/startup-loop/__tests__/self-evolving-signal-integrity.test.ts`

### TASK-02: Add runtime hygiene, scrub BRIK placeholder artifacts, and verify clean self-evolving report output
- **Type:** IMPLEMENT
- **Deliverable:** runtime hygiene code plus deterministic remediation of the contaminated BRIK self-evolving files
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-06)
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-signal-helpers.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-events.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-backbone-consume.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-report.ts`, `docs/business-os/startup-loop/self-evolving/BRIK/observations.jsonl`, `docs/business-os/startup-loop/self-evolving/BRIK/events.jsonl`, `docs/business-os/startup-loop/self-evolving/BRIK/candidates.json`, `docs/business-os/startup-loop/self-evolving/BRIK/backbone-queue.jsonl`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 84%
  - Implementation: 84% - touches runtime behavior and on-disk remediation together.
  - Approach: 85% - hygiene plus cleanup is the smallest complete fix that restores trust.
  - Impact: 84% - removes the live false candidates the user cited.
- **Acceptance:**
  - Placeholder-derived observations are excluded from candidate generation and downstream follow-up dispatch generation.
  - The current BRIK self-evolving observation/event/candidate/queue files no longer contain placeholder-derived runtime entries.
  - `startup-loop:self-evolving-report -- --business BRIK` reports zero placeholder-derived active candidates after remediation.
- **Validation contract (TC-02):**
  - TC-01: `rg -n 'None\\.|new open source package none|ai to mechanistic none' docs/business-os/startup-loop/self-evolving/BRIK` returns no live placeholder-derived observation/candidate hits after remediation.
  - TC-02: `pnpm --filter scripts startup-loop:self-evolving-report -- --business BRIK` succeeds and shows no placeholder-derived candidates in the ledger-backed totals.
  - TC-03: Source inspection shows orchestrator/runtime readers apply placeholder hygiene before repeat detection and follow-up routing.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - `sed -n '1,260p' scripts/src/startup-loop/self-evolving/self-evolving-events.ts`
    - `sed -n '1,320p' scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`
    - `rg -n 'None\\.|new open source package none|ai to mechanistic none' docs/business-os/startup-loop/self-evolving/BRIK -S`
    - `pnpm --filter scripts startup-loop:self-evolving-report -- --business BRIK`
  - Validation artifacts:
    - `docs/business-os/startup-loop/self-evolving/BRIK/observations.jsonl`
    - `docs/business-os/startup-loop/self-evolving/BRIK/events.jsonl`
    - `docs/business-os/startup-loop/self-evolving/BRIK/candidates.json`
    - `docs/business-os/startup-loop/self-evolving/BRIK/backbone-queue.jsonl`
  - Unexpected findings:
    - The current ledger contains two validated placeholder-derived candidates and the event log contains multiple placeholder-derived execution events.
- **Consumer tracing (required):**
  - New outputs:
    - None: hygiene helpers only; report schema remains unchanged.
  - Modified behavior:
    - `readMetaObservations()` / orchestrator consumption changes from “all stored observations” to “all valid non-placeholder observations”.
    - Candidate and queue remediation updates canonical runtime artifacts; downstream report and backbone consumer read the cleaned state without interface changes.
    - Event log cleanup is bounded to entries correlated to the invalid placeholder observations being removed.
- **Edge Cases & Hardening:** Keep genuine observations untouched even if they reference “none” in non-placeholder prose; cleanup must correlate events and candidates through observation ids/signatures rather than broad text deletion.
- **Rollout / rollback:**
  - Rollout: code + canonical runtime artifact update in one tranche.
  - Rollback: revert code changes and restore prior BRIK runtime files from git.
- **Build completion evidence:**
  - Added runtime placeholder hygiene in `self-evolving-signal-helpers.ts` and `self-evolving-orchestrator.ts` so placeholder build-output observations are ignored before candidate generation.
  - Added deterministic cleanup command `startup-loop:self-evolving-placeholder-hygiene`.
  - Applied the hygiene command to BRIK runtime state:
    - removed 7 placeholder observations
    - removed 7 correlated events
    - removed 2 validated placeholder candidates
    - removed 2 backbone queue entries
  - Verified `startup-loop:self-evolving-report -- --business BRIK` now reports `observations: 4`, `candidates: 0`, `active_candidates: 0`.

## Risks & Mitigations
- Placeholder detection could become overly broad and suppress legitimate ideas.
  - Mitigation: centralize detection in one helper and scope the pattern to canonical category-labelled placeholder forms and exact `None` values.
- Runtime cleanup could remove unrelated observations if matching is text-only.
  - Mitigation: correlate cleanup to the canonical placeholder detector plus observation ids/signature families before mutating candidate and event files.

## Observability
- Logging:
  - Use the self-evolving report output and direct grep of BRIK runtime artifacts as the verification surface.
- Metrics:
  - Candidate count and observation count from `startup-loop:self-evolving-report`.
  - Placeholder-hit count from deterministic `rg` scans over the BRIK self-evolving directory.

## Acceptance Criteria (overall)
- [x] Placeholder `None` idea bullets are rejected in the canonical build-output ingestion path.
- [x] BRIK self-evolving runtime files no longer contain placeholder-derived observations, events, candidates, or queue entries.
- [x] `startup-loop:self-evolving-report -- --business BRIK` returns a trustworthy non-placeholder-backed snapshot.
