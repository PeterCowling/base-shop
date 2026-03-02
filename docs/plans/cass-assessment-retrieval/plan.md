---
Type: Plan
Status: Active
Domain: Startup-Loop
Workstream: Engineering
Created: 2026-03-02
Last-reviewed: 2026-03-02
Last-updated: 2026-03-02T18:00:00Z
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: cass-assessment-retrieval
Deliverable-Type: code-change
Startup-Deliverable-Alias: startup-loop-gap-fill
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 87%
Confidence-Method: min(Implementation,Approach,Impact); overall avg of S-effort tasks
Auto-Build-Intent: plan+auto
---

# CASS Assessment Retrieval Plan

## Summary

CASS retrieval currently searches `docs/plans`, `docs/business-os/startup-loop`, and `.claude/skills` for prior-plan context. The `docs/business-os/strategy/` directory — which holds 104 strategic reference docs across 9 businesses — is absent from `DEFAULT_SOURCE_ROOTS`. This means every fact-find and plan runs without automatic access to brand identity decisions, solution selections, naming specs, or business plans made in prior assessment cycles. The fix is a one-element addition to `DEFAULT_SOURCE_ROOTS` plus an `export` keyword so tests can assert the value. Output is bounded to `topK=8` snippets regardless of corpus size, so cross-business noise is self-limiting. Two S-effort tasks: the code+runbook change, then unit tests.

## Active tasks
- [x] TASK-01: Add `docs/business-os/strategy` to `DEFAULT_SOURCE_ROOTS` + export + update runbook
- [ ] TASK-02: Add unit tests asserting the new default source roots

## Goals
- Make assessment-layer context available in every CASS retrieval invocation without any change to caller invocation patterns
- Export `DEFAULT_SOURCE_ROOTS` so the value is assertable in tests

## Non-goals
- Per-business `--business <BIZ>` scoping flag (deferred; topK=8 bound makes cross-business noise self-limiting at current corpus size)
- Semantic/vector CASS backend
- Changes to skill invocation patterns in `lp-do-fact-find/SKILL.md` or `lp-do-plan/SKILL.md` (no changes needed; default roots propagate automatically)

## Constraints & Assumptions
- Constraints:
  - `topK=8` default bounds total fallback-rg output to 8 snippets regardless of how many files exist in strategy docs
  - No production implementation changes allowed in planning mode
  - Tests run in CI only (`docs/testing-policy.md`)
- Assumptions:
  - The fallback-rg provider is the active path for all current invocations (no `CASS_RETRIEVE_COMMAND` configured)
  - `docs/business-os/strategy/` is a stable, well-formed directory — confirmed: 104 `.user.md` files across 9 business subdirectories
  - Adding strategy docs does not cause rg performance issues — 104 files is trivially small for rg with `topK=8`

## Inherited Outcome Contract

- **Why:** When a fact-find or plan runs for any business, it needs to know what strategic decisions have already been made (brand identity, solution selection, naming). CASS retrieval currently only surfaces prior loop artifacts, not the assessment layer. Every new planning cycle must manually rediscover the same strategic context instead of having it pre-loaded.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** CASS retrieval extended to index assessment containers, so fact-finds and plans for a business automatically receive relevant assessment-layer context (brand decisions, solution evaluations, naming specs) without manual retrieval steps.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/cass-assessment-retrieval/fact-find.md`
- Key findings used:
  - `DEFAULT_SOURCE_ROOTS` at line 6 of `cass-retrieve.ts` — only 3 entries, `docs/business-os/strategy` absent
  - `lines.slice(0, options.topK)` at line 405 — total output bounded to topK=8 regardless of corpus
  - Only `runCassRetrieve` is exported; `DEFAULT_SOURCE_ROOTS`, `parseArgs`, `collectTerms` are all unexported — need export for tests
  - Zero existing tests for `cass-retrieve.ts` — new tests are additive only
  - Jest `testMatch: **/?(*.)+(spec|test).ts?(x)` picks up `scripts/src/startup-loop/__tests__/cass-retrieve.test.ts`

## Proposed Approach
- **Option A:** Add `docs/business-os/strategy` to `DEFAULT_SOURCE_ROOTS` + export (chosen)
- **Option B:** Add `--include-strategy` opt-in flag + update skill invocations (rejected — requires skill doc changes, adds friction, provides no benefit given topK=8 already limits noise)
- **Chosen approach:** Option A. Zero changes to caller patterns; takes effect immediately for all existing invocations; topK bound eliminates noise risk.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add `docs/business-os/strategy` to `DEFAULT_SOURCE_ROOTS`, export it, update runbook | 90% | S | Complete (2026-03-02) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Unit tests asserting `DEFAULT_SOURCE_ROOTS` content | 85% | S | Pending | TASK-01 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Code change + runbook update |
| 2 | TASK-02 | TASK-01 complete | Tests need the export added in TASK-01 |

## Tasks

---

### TASK-01: Add `docs/business-os/strategy` to `DEFAULT_SOURCE_ROOTS`, export it, update runbook
- **Type:** IMPLEMENT
- **Deliverable:** Updated `cass-retrieve.ts` + updated `docs/runbooks/startup-loop-cass-pilot.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** startup-loop-gap-fill
- **Effort:** S
- **Status:** Complete (2026-03-02)
- **Build evidence:**
  - TC-01-01: `grep "^export const DEFAULT_SOURCE_ROOTS"` → match at `cass-retrieve.ts:6` ✓
  - TC-01-02: `"docs/business-os/strategy"` present at `cass-retrieve.ts:10` ✓
  - TC-01-03: `tsc --noEmit` → 0 errors ✓
  - TC-01-04: Runbook updated with 4-entry source roots table including strategy dir ✓
- **Affects:**
  - `scripts/src/startup-loop/cass-retrieve.ts`
  - `docs/runbooks/startup-loop-cass-pilot.md`
  - `[readonly] docs/plans/cass-assessment-retrieval/fact-find.md`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 90%
  - Implementation: 97% — one element addition to array + `export` keyword; fully understood change
  - Approach: 95% — adding to defaults is the minimum viable change; option B rejected with clear rationale
  - Impact: 90% — takes effect on next invocation; all future fact-finds and plans gain assessment context
- **Acceptance:**
  - `DEFAULT_SOURCE_ROOTS` in `cass-retrieve.ts` is exported and contains exactly 4 entries: `"docs/plans"`, `"docs/business-os/startup-loop"`, `".claude/skills"`, `"docs/business-os/strategy"`
  - `docs/runbooks/startup-loop-cass-pilot.md` updated with the new source root in coverage documentation
  - TypeScript compiles without error in `scripts` package
- **Validation contract (TC-01):**
  - TC-01-01: `DEFAULT_SOURCE_ROOTS` is exported (`grep -n "^export const DEFAULT_SOURCE_ROOTS" scripts/src/startup-loop/cass-retrieve.ts` returns a match)
  - TC-01-02: Array contains `"docs/business-os/strategy"` (grep or import check)
  - TC-01-03: TypeScript compiles without error (`pnpm --filter scripts typecheck` passes)
  - TC-01-04: Runbook updated — `docs/business-os/strategy` appears in the source roots section
- **Execution plan:** Red → Green → Refactor
  - Red: Confirm `DEFAULT_SOURCE_ROOTS` does not currently contain `"docs/business-os/strategy"` (fast grep check)
  - Green: Add `"docs/business-os/strategy"` to the array at line 6–10; add `export` keyword; update runbook
  - Refactor: Verify TypeScript compiles; grep confirms export and new entry
- **Scouts:** None — change is fully understood from fact-find
- **Edge Cases & Hardening:**
  - `--source-roots` CLI override replaces `DEFAULT_SOURCE_ROOTS` entirely at `parseArgs:128-130` — override behaviour is unchanged
  - `"docs/business-os/strategy"` is a directory, not a glob; rg handles directory roots natively
  - If `docs/business-os/strategy` does not exist on a fresh clone, rg exits non-zero on that path — but `runFallbackRg` at line 395 handles rg non-zero with empty stderr as a pass (not an error), and output is bounded to topK anyway. Safe.
- **What would make this >=95%:** Confirm rg gracefully handles missing directory (verified: line 395 logic)
- **Rollout / rollback:**
  - Rollout: Immediate on next `pnpm startup-loop:cass-retrieve` invocation; no deploy needed
  - Rollback: Remove `"docs/business-os/strategy"` from array
- **Documentation impact:** `docs/runbooks/startup-loop-cass-pilot.md` — add source roots coverage note
- **Notes / references:** `cass-retrieve.ts:6-10`, `cass-retrieve.ts:128-130`, `cass-retrieve.ts:395`

---

### TASK-02: Unit tests asserting `DEFAULT_SOURCE_ROOTS` content
- **Type:** IMPLEMENT
- **Deliverable:** New test file `scripts/src/startup-loop/__tests__/cass-retrieve.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** startup-loop-gap-fill
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `scripts/src/startup-loop/__tests__/cass-retrieve.test.ts` (new)
  - `[readonly] scripts/src/startup-loop/cass-retrieve.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — simple import + assertion; follows established patterns from `lp-do-ideas-trial.test.ts`
  - Approach: 92% — direct array assertion on exported constant is the minimal, correct test
  - Impact: 85% — confirms the feature works and prevents future regression (someone removing the entry)
- **Acceptance:**
  - `scripts/src/startup-loop/__tests__/cass-retrieve.test.ts` exists
  - TC-02-01 through TC-02-03 pass
  - No existing tests regress
- **Validation contract (TC-02):**
  - TC-02-01: `DEFAULT_SOURCE_ROOTS` includes `"docs/business-os/strategy"`
  - TC-02-02: `DEFAULT_SOURCE_ROOTS` includes all 3 original roots (`"docs/plans"`, `"docs/business-os/startup-loop"`, `".claude/skills"`) — regression guard
  - TC-02-03: `DEFAULT_SOURCE_ROOTS` has exactly 4 entries — prevents silent additions
- **Execution plan:** Red → Green → Refactor
  - Red: Write test stubs; confirm they fail without TASK-01's export (or verify TASK-01 is already complete before running)
  - Green: After TASK-01 completes, all 3 TCs pass
  - Refactor: Confirm test isolation; no shared mutable state
- **Scouts:** None — test patterns clear from `lp-do-ideas-trial.test.ts`
- **Edge Cases & Hardening:**
  - Import path: `import { DEFAULT_SOURCE_ROOTS } from "../cass-retrieve.js"` (ESM `.js` extension per existing patterns in `lp-do-ideas-trial.test.ts`)
- **What would make this >=90%:** Add a test for `collectTerms` stop-word filtering (optional — deferred to avoid scope expansion)
- **Rollout / rollback:**
  - Rollout: Tests run in CI; no runtime impact
  - Rollback: N/A
- **Documentation impact:** None
- **Notes / references:** Test import pattern: `import { X } from "../cass-retrieve.js"` (ESM `.js` extension required per `scripts/jest.config.cjs` preset)

---

## Risks & Mitigations
- **alphabetical bias in fallback-rg**: first 8 lines from rg output are alphabetically biased (BRIK docs appear before HBAG). Advisory-context-only framing in runbook and `cass-context.md` header mitigates this — agents are told to treat as non-authoritative.
- **topK=8 may not surface the most relevant strategy doc**: CASS retrieval is a supplement, not a substitute, for direct fact-find investigation. The advisory-only framing is the correct mitigation.

## Overall-confidence Calculation
- S=1 weight each
- TASK-01: 90% × 1 = 90
- TASK-02: 85% × 1 = 85
- Overall = (90 + 85) / 2 = **87.5% → 87%**
- Both tasks meet IMPLEMENT threshold ≥80% ✓

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Add to DEFAULT_SOURCE_ROOTS + export | Yes — line numbers verified in fact-find | None | No |
| TASK-02: Unit tests | Partial — depends on TASK-01 export | [Minor] Import path requires `.js` extension per ESM preset; noted in task Edge Cases | No |
