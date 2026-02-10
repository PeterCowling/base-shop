---
Type: Plan
Status: Archived
Domain: Business-OS
Workstream: docs
Created: 2026-02-10
Last-updated: 2026-02-10
Last-reviewed: 2026-02-10
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: ideas-go-faster-process-hardening
Deliverable-Type: docs-change
Execution-Track: docs
Primary-Execution-Skill: build-feature
Supporting-Skills: sequence-plan
Overall-confidence: HIGH
Confidence-Method: All tasks are doc edits with verified evidence from fact-find. No runtime code changes.
Business-OS-Integration: off
Business-Unit: BOS
---

# Ideas-Go-Faster Process Hardening Plan

## Summary

Fix six documentation-level contract defects in the `ideas-go-faster` orchestrator and shared cabinet files. All changes are markdown edits with grep-verifiable acceptance criteria. The seventh defect (non-idempotent API creates, F2) is deferred to a separate plan because it requires D1 schema migration and runtime code changes that are out of proportion with the doc fixes.

No runtime code changes. No API modifications. No schema migrations.

## Goals
- Eliminate contradictory process rules in the orchestrator (F1, F5, F7).
- Align DGP and Contrarian Gate contracts across orchestrator and shared lifecycle docs (F3, F4, F6).
- Add grep-based drift checks that catch the specific defects found in this audit.

## Non-goals
- API idempotency (F2) — see Deferred Work section.
- Re-architecting the cabinet model or reducing lens scope.
- Building observability infrastructure (no metrics pipeline exists; don't pretend one is coming).

## Fact-Find Reference
- Related brief: `docs/plans/ideas-go-faster-process-hardening-fact-find.md`
- Findings addressed by this plan: F1, F3, F4, F5, F6, F7.
- Finding deferred: F2 (non-idempotent POST creates).

## Existing System Notes
- Orchestrator: `.claude/skills/ideas-go-faster/SKILL.md`
- Cabinet contracts:
  - `.claude/skills/_shared/cabinet/data-gap-lifecycle.md`
  - `.claude/skills/_shared/cabinet/lens-code-review.md`
  - `.claude/skills/_shared/cabinet/prioritize-drucker-porter.md`
- Stage 7b memo: `docs/plans/business-os-stage-7b-backfill-decision-memo.md`

## Proposed Approach
Prompt-only patching. All defects addressed in this plan are documentation contradictions fixable with targeted markdown edits. The one runtime defect (F2) is extracted to its own plan where it can be properly scoped with schema migration, test infrastructure, and compatibility analysis.

## Task Summary
| Task ID | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---|---|---|---|
| TASK-01 | Fix orchestrator contradictions and internal consistency | HIGH | S | Complete (2026-02-10) | - | TASK-03 |
| TASK-02 | Align DGP, resurfacing, and Stage 7b contracts | HIGH | S | Complete (2026-02-10) | - | TASK-03 |
| TASK-03 | Add contract drift-check script | HIGH | S | Complete (2026-02-10) | TASK-01, TASK-02 | - |

## Parallelism Guide
| Wave | Tasks | Notes |
|------|-------|-------|
| 1 | TASK-01, TASK-02 | Independent doc edits on different file sets. Run in parallel. |
| 2 | TASK-03 | Write drift checks after both doc tasks land. |

**Max parallelism:** 2 | **Critical path:** 2 waves | **Total tasks:** 3

## Tasks

### TASK-01: Fix orchestrator contradictions and internal consistency
- **Deliverable:** Updated `.claude/skills/ideas-go-faster/SKILL.md`.
- **Affects:** `.claude/skills/ideas-go-faster/SKILL.md`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** HIGH — all edits are localized, evidence-backed, and verified in fact-find.
- **Specific changes:**
  1. **Remove deferred-cabinet contradiction (F1):** Delete the line at ~L877 (`Technical cabinet deferred: Conditional on CS-13 completion`) in the Phase 0 Constraints section. The technical cabinet is already active with explicit trigger conditions (L604) and `lens-code-review.md` already exists. The "deferred pending CS-13" reference at ~L851 in the Integration table should be updated to reflect the active trigger contract.
  2. **Fix lens identity mismatch (F5):** Change `Originator-Lens: engineering` to `Originator-Lens: code-review` at ~L620. The canonical name in `lens-code-review.md:3` is `code-review`.
  3. **Fix fatal-fallback paradox (F7):** At ~L84-86, the failure policy says "STOP before persistence" but then says "write a minimal sweep report." Reword to: stop the pipeline stages, then write the failure report (the report write is the final act, not a contradiction of the stop).
  4. **Fix duplicate section numbering (F7):** At ~L700-701, sections 8 and 8 (Munger/Buffett and Drucker/Porter) — renumber to 8 and 9, cascade remaining sections.
- **Acceptance:**
  - No contradictory deferred-vs-active statements for technical cabinet.
  - `Originator-Lens` uses canonical `code-review` naming everywhere.
  - Failure policy reads coherently without paradox.
  - Report section numbers are sequential with no duplicates.
- **Validation:**
  - `rg -n "Technical cabinet deferred|CS-13" .claude/skills/ideas-go-faster/SKILL.md` → zero matches.
  - `rg -n "Originator-Lens: engineering" .claude/skills/ideas-go-faster/SKILL.md` → zero matches.
  - `rg -n "Originator-Lens: code-review" .claude/skills/ideas-go-faster/SKILL.md` → matches at L620.
  - Manual read of failure policy section → no logical contradiction.
  - Manual read of report sections → sequential numbering 1-19.
- **Notes:** Fact-find F1, F5, F7.

### TASK-02: Align DGP, resurfacing, and Stage 7b contracts
- **Deliverable:** Consistent contracts across orchestrator and shared cabinet docs.
- **Affects:**
  - `.claude/skills/ideas-go-faster/SKILL.md`
  - `.claude/skills/_shared/cabinet/data-gap-lifecycle.md`
  - `.claude/skills/_shared/cabinet/prioritize-drucker-porter.md`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** HIGH — contract deltas are explicit and verified in fact-find.
- **Specific changes:**
  1. **Add `gate-unresolved` tag to orchestrator (F3):** At ~L418, the held-idea tag list omits `gate-unresolved`. `data-gap-lifecycle.md:214` requires it for VOI boost and artifact-specific resurfacing. Add `"gate-unresolved"` to the Contrarian Gate UNRESOLVED hold tag example.
  2. **Specify resurfacing query semantics (F4):** At ~L191, resurfacing requires `status=raw` but doesn't specify `location`. The ideas API defaults to `location=inbox` when unspecified (`route.ts:68`). Add an explicit note that resurfacing queries must pass `location=all` (or omit location filter) to avoid missing eligible items outside inbox.
  3. **Add Stage 7b invocation surface (F6):** At ~L573, `stage7b_backfill_enabled=true` is documented as a run-level flag but it doesn't appear in the invocation examples at ~L17. Add `--stage7b` to the invocation examples block.
- **Acceptance:**
  - Orchestrator hold-tag examples include `gate-unresolved` for Contrarian UNRESOLVED holds.
  - Resurfacing contract specifies location query behavior explicitly.
  - Stage 7b has a documented invocation path in the examples block.
- **Validation:**
  - `rg -n "gate-unresolved" .claude/skills/ideas-go-faster/SKILL.md` → matches in hold-tag section.
  - `rg -n "gate-unresolved" .claude/skills/_shared/cabinet/data-gap-lifecycle.md` → matches (existing, confirms alignment).
  - `rg -n "stage7b" .claude/skills/ideas-go-faster/SKILL.md` → matches in both invocation and contract sections.
  - `rg -n "location" .claude/skills/ideas-go-faster/SKILL.md` → resurfacing section specifies query behavior.
- **Notes:** Fact-find F3, F4, F6.

### TASK-03: Add contract drift-check script
- **Deliverable:** `scripts/check-ideas-go-faster-contracts.sh` — a shell script that greps for the specific invariants fixed in TASK-01 and TASK-02.
- **Affects:** `scripts/check-ideas-go-faster-contracts.sh` (new file)
- **Depends on:** TASK-01, TASK-02
- **Blocks:** -
- **Confidence:** HIGH — it's a shell script running grep commands. The exact checks are already defined in TASK-01/TASK-02 validation sections.
- **Script contract:**
  ```
  #!/usr/bin/env bash
  # Contract drift checks for ideas-go-faster orchestrator.
  # Exits non-zero if any known-bad pattern is detected.
  set -euo pipefail
  FAIL=0

  # F1: No deferred-cabinet contradiction
  if rg -q "Technical cabinet deferred|CS-13" .claude/skills/ideas-go-faster/SKILL.md; then
    echo "FAIL: Deferred-cabinet contradiction still present (F1)"
    FAIL=1
  fi

  # F5: No stale lens identity
  if rg -q "Originator-Lens: engineering" .claude/skills/ideas-go-faster/SKILL.md; then
    echo "FAIL: Stale lens identity 'engineering' (F5)"
    FAIL=1
  fi

  # F3: gate-unresolved present in orchestrator hold tags
  if ! rg -q "gate-unresolved" .claude/skills/ideas-go-faster/SKILL.md; then
    echo "FAIL: gate-unresolved missing from orchestrator (F3)"
    FAIL=1
  fi

  # F6: stage7b invocation surface exists
  if ! rg -q "stage7b" .claude/skills/ideas-go-faster/SKILL.md; then
    echo "FAIL: stage7b invocation surface missing (F6)"
    FAIL=1
  fi

  # F7: No duplicate section numbering (two lines starting with "8.")
  SECTION_8_COUNT=$(rg -c "^8\." .claude/skills/ideas-go-faster/SKILL.md || echo 0)
  # (Exact check will depend on report format — validate manually on first run)

  exit $FAIL
  ```
- **Acceptance:**
  - Script exits 0 on clean state after TASK-01/TASK-02 edits.
  - Script exits non-zero if any fixed defect is reintroduced.
- **Validation:**
  - Run script against current (pre-fix) state → should fail on F1, F5, F3.
  - Run script against post-fix state → should pass.
- **Notes:** Fact-find F1, F3, F5, F6, F7. This script is intentionally narrow — it checks only for the specific defects we fixed, not for general "contract health." Broad contract checks overfit and become noisy.

## Deferred Work: API Idempotency (F2)

The fact-find's F2 finding (non-idempotent POST creates + retry guidance = duplicate entity risk) is real but is a fundamentally different class of work from the doc fixes above. It requires:

- **D1 schema changes** to store idempotency keys or deduplication state.
- **Response contract design**: what to return on duplicate detection (200 with original entity? 409?).
- **Three separate routes** with different ID strategies (sequential counters for ideas/cards, timestamp+random for stage-docs).
- **Backward compatibility**: existing sweep doesn't send idempotency keys.
- **Partial-failure semantics**: if the create succeeded but the response was lost, the idempotency layer needs to return the original response — which means storing responses.

This deserves its own fact-find and plan. The current retry guidance in the orchestrator (3 attempts with backoff) is a tolerable risk given that:
1. The sweep runs infrequently (human-triggered).
2. Duplicate entities are detectable and deletable.
3. The sweep report documents what was created.

**Recommended next step:** `/fact-find api-idempotency-agent-endpoints` when this becomes a priority.

## Risks and Mitigations
- **Risk:** Edits to SKILL.md accidentally break other sweep behavior.
  - Mitigation: changes are surgical (specific lines identified). Review diff before merge.
- **Risk:** Drift-check script produces false positives on unrelated content.
  - Mitigation: checks grep for exact known-bad patterns, not broad heuristics.

## Acceptance Criteria (overall)
- [x] Technical cabinet run policy is unambiguous and consistent.
- [x] Lens identity uses canonical `code-review` naming.
- [x] DGP tag and resurfacing semantics are aligned across orchestrator and lifecycle spec.
- [x] Stage 7b has a documented invocation path.
- [x] Report section numbering is sequential.
- [x] Drift-check script passes on clean state.

## Decision Log
- 2026-02-10: Initialized from `docs/plans/ideas-go-faster-process-hardening-fact-find.md`.
- 2026-02-10: Restructured plan after critique. Removed DECISION gate for cabinet policy (answer is obvious: keep active, delete stale deferral). Extracted API idempotency (F2) to deferred work — it needs its own fact-find with schema migration scoping. Collapsed 6 tasks to 3. Removed false-precision confidence percentages. Made contract-check task concrete with actual script content.
- 2026-02-10: Completed TASK-01. Implemented active technical-cabinet policy throughout orchestrator, removed stale CS-13/deferred references, normalized `Originator-Lens` to `code-review`, rewrote fatal preflight wording to remove stop/report paradox, and fixed report-section numbering to sequential 1-19.
- 2026-02-10: Completed TASK-02. Added `gate-unresolved` handling to Contrarian UNRESOLVED DGP holds, added explicit resurfacing query location semantics (`location=all` or equivalent dual-query), and added `--stage7b` invocation example for optional backfill activation.
- 2026-02-10: Completed TASK-03. Added executable drift-check script at `scripts/check-ideas-go-faster-contracts.sh` and validated clean pass on current state.
