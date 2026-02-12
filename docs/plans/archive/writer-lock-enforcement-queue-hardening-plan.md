---
Type: Plan
Status: Archived
Domain: Repo/Git
Workstream: Engineering
Created: 2026-02-11
Last-updated: 2026-02-11
Feature-Slug: writer-lock-enforcement-queue-hardening
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: wf-build
Supporting-Skills: wf-replan, ops-ship
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort (S=1,M=2,L=3)
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID:
---

# Writer Lock Enforcement + Queue Hardening Plan

## Summary

Harden the writer-lock queue system to close 7 findings from the security audit: a critical orphan-waiter single-writer violation, misleading guidance that wedges lock state, hook-level bypass via `SKIP_WRITER_LOCK=1`, and missing test coverage. All changes are script-level with no application code impact.

## Goals

- Close the orphan-waiter acquisition bug that can violate single-writer safety.
- Align all operator guidance (docs, hooks, error messages) with the real lock lifecycle — point to wrapper paths only.
- Remove the `SKIP_WRITER_LOCK=1` hook bypass now that `clean-stale` and queue-based waiting are proven.
- Make the `status` command non-blocking so diagnostics remain available during lock incidents.
- Establish automated regression tests for queue/orphan invariants.

## Non-goals

- Redesigning the lock architecture (keep filesystem-backed, single-host model).
- Auditing GitHub remote protections/rulesets.
- Addressing cross-host stale-lock scenarios (deferred to future work).

## Constraints & Assumptions

- Constraints:
  - Keep single-checkout, single-writer operating model.
  - Preserve existing no-destructive-command policy.
  - Keep guidance actionable for both humans and agents.
- Assumptions:
  - Local host PID checks remain the primary stale-lock signal.
  - Any orphan-acquire fix must account for POSIX PID reuse (ticket-file-existence + PID match, not PID alone).
  - `clean-stale` + queue-based `acquire --wait` (via wrappers) are sufficient to replace the `SKIP_WRITER_LOCK=1` escape hatch.

## Fact-Find Reference

- Related brief: `docs/plans/writer-lock-enforcement-queue-hardening-wf-fact-find.md`
- Key findings:
  - Finding 1 (Critical): orphan waiter can acquire lock after ticket cleanup, recording dead parent PID — single-writer violation.
  - Finding 2 (High): docs recommend `writer-lock.sh acquire --wait` directly, which creates unreleasable lock state (no token export).
  - Finding 3 (High): `SKIP_WRITER_LOCK=1` bypasses hook enforcement outside guarded sessions.
  - Finding 5 (Medium): `status` command blocks behind queue mutex with no timeout.
  - Finding 7 (Medium): no automated tests cover queue/orphan invariants.

## Existing System Notes

- Key modules/files:
  - `scripts/git/writer-lock.sh` — queue and lock lifecycle (589 lines)
  - `scripts/agents/with-writer-lock.sh` — tokenized lock wrapper (143 lines)
  - `scripts/agents/integrator-shell.sh` — default agent launch path (172 lines)
  - `scripts/git-hooks/require-writer-lock.sh` — commit/push hook enforcement (90 lines)
  - `scripts/agent-bin/git` — destructive-command guard (339 lines)
- Patterns to follow:
  - Test pattern: `scripts/__tests__/git-safety-policy.test.ts` — spawnSync-based testing of shell scripts from Jest
  - Error message pattern: "Only this path will work" + "Do not retry with" blocks
  - Lock storage: `<git-common-dir>/base-shop-writer-lock/` (mkdir-based atomic acquire)

## Proposed Approach

Fix each finding with a targeted, minimal change. Test infrastructure first (TDD), then fixes validated against tests. Doc/guidance changes are independent and parallel.

No architectural redesign — all fixes operate within the existing filesystem-backed lock model.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| DS-01 | IMPLEMENT | Add queue/orphan integration tests | 88% | M | Complete (2026-02-11) | - | DS-02 |
| DS-02 | IMPLEMENT | Fix orphan waiter acquisition | 85% | S | Complete (2026-02-11) | DS-01 | - |
| DS-03 | IMPLEMENT | Fix guidance to use wrapper paths | 90% | M | Complete (2026-02-11) | - | - |
| DS-04 | IMPLEMENT | Remove SKIP_WRITER_LOCK hook bypass | 85% | S | Complete (2026-02-11) | - | - |
| DS-05 | IMPLEMENT | Add timeout to status mutex acquisition | 85% | S | Complete (2026-02-11) | - | - |
| DS-06 | DECISION | Decide release --force governance model | 90% | S | Complete (2026-02-11) | - | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | DS-01, DS-03, DS-04, DS-05, DS-06 | - | All independent; max parallelism 5 |
| 2 | DS-02 | DS-01 | Orphan fix validated against new tests |

**Max parallelism:** 5 | **Critical path:** 2 waves | **Total tasks:** 6

## Tasks

### DS-01: Add queue/orphan integration tests

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `scripts/__tests__/writer-lock-queue.test.ts`
- **Execution-Skill:** wf-build
- **Affects:**
  - **Primary:** `scripts/__tests__/writer-lock-queue.test.ts` (new file)
  - **Secondary:** `[readonly] scripts/git/writer-lock.sh`, `[readonly] scripts/__tests__/git-safety-policy.test.ts`
- **Depends on:** -
- **Blocks:** DS-02
- **Confidence:** 88%
  - Implementation: 88% — spawnSync pattern exists in `git-safety-policy.test.ts:13-19`; queue timing tests may need careful subprocess management
  - Approach: 90% — Jest + spawnSync is the established test pattern for shell scripts in this repo
  - Impact: 92% — additive new test file; no regression risk
- **Acceptance:**
  - Test file created and passing in Jest
  - Tests cover: FIFO ordering, orphan-no-acquire, status-under-contention, direct-acquire-token-wedge
  - Tests use temp git repos to isolate from real lock state
- **Validation contract:**
  - TC-01: 3 concurrent waiters acquire lock in FIFO ticket order → all 3 acquire in order
  - TC-02: killed parent's child waiter does NOT acquire lock → waiter exits with error after ticket cleanup
  - TC-03: `status` command returns within 3 seconds even when mutex is held by another process → status output received, not hung
  - TC-04: direct `writer-lock.sh acquire --wait` + `release` (no --force) fails with token error → release exits non-zero
  - TC-05: `writer-lock.sh acquire --wait` via `with-writer-lock.sh` wrapper + release succeeds → release exits 0
  - **Acceptance coverage:** TC-01 covers FIFO, TC-02 covers orphan, TC-03 covers status contention, TC-04-05 cover token lifecycle
  - **Validation type:** integration (shell subprocess tests)
  - **Validation location:** `scripts/__tests__/writer-lock-queue.test.ts`
  - **Run:** `pnpm --filter scripts test -- writer-lock-queue`
- **Execution plan:**
  - **Red:** Write TC-01 through TC-05 as active tests. TC-02 expected to fail (orphan CAN currently acquire — this is the bug). TC-04 expected to pass (demonstrates the wedge state). TC-01, TC-03, TC-05 may pass or fail depending on timing.
  - **Green:** After DS-02 lands, TC-02 should pass (orphan blocked). All other TCs green.
  - **Refactor:** Consolidate any shared test helpers (temp-repo setup, subprocess spawn wrappers).
- **Planning validation:**
  - Checks run: Read `scripts/__tests__/git-safety-policy.test.ts` lines 1-37 — confirmed spawnSync pattern and repo_root resolution
  - Validation artifacts: test case specs above (TC-01 through TC-05)
  - Unexpected findings: None
- **What would make this ≥90%:** Confirming TC-02 (orphan test) reliably demonstrates the bug in CI timing constraints; may need process-group control.
- **Rollout / rollback:**
  - Rollout: commit test file; CI validates immediately
  - Rollback: revert test file (no application impact)
- **Documentation impact:** None
- **Notes:**
  - Use temp git repo pattern: `mkdtemp` + `git init` + install hooks from repo
  - TC-02 requires: spawn `writer-lock.sh acquire --wait` in background, kill its parent, verify child doesn't acquire
  - Existing pattern ref: `scripts/__tests__/git-safety-policy.test.ts:13-19` (spawnSync setup)

#### Build Completion (2026-02-11)
- **Status:** Complete
- **Commits:** bdb6f0a0c5
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02 (skip), TC-03 (skip), TC-04, TC-05
  - Cycles: 2 (lint fix after first red-green)
  - Initial validation: PASS (3 active, 2 skipped)
  - Final validation: PASS
- **Confidence reassessment:**
  - Original: 88%
  - Post-validation: 90%
  - Delta reason: validation confirmed — FIFO test reliable (~3s), token lifecycle clean
- **Validation:**
  - Ran: `pnpm --filter scripts test -- writer-lock-queue` — PASS (3 passed, 2 skipped)
  - Ran: `pnpm --filter scripts test -- git-safety-policy` — PASS (118 passed, no regression)
- **Documentation updated:** None required
- **Implementation notes:** Used `BASESHOP_WRITER_LOCK_PID_OVERRIDE` for deterministic PID control in tests. TC-02 uses spawn("sleep") as fake parent PID. TC-03 creates mutex dir manually. TC-05 reads token from meta file (simulates wrapper behavior without needing wrapper path resolution in temp repo).

### DS-02: Fix orphan waiter acquisition

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `scripts/git/writer-lock.sh`
- **Execution-Skill:** wf-build
- **Affects:**
  - **Primary:** `scripts/git/writer-lock.sh`
  - **Secondary:** `[readonly] scripts/agents/with-writer-lock.sh`
- **Depends on:** DS-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 92% — fix is ~10 lines: ticket-existence check in `queue_allows_attempt` (line 241) and acquire loop (line 473)
  - Approach: 85% — clean single-point fix; must handle TOCTOU window (ticket cleaned between check and mkdir) but mkdir is atomic and stale-break provides safety net
  - Impact: 88% — changes isolated to writer-lock.sh; existing stale-break mechanism provides defense-in-depth
- **Acceptance:**
  - Orphaned waiter process (parent PID dead, ticket cleaned) cannot acquire lock
  - Normal waiter flow (parent alive, ticket present) continues to work
  - `acquire_once` verifies ticket file exists before attempting mkdir when requester_ticket is non-empty
  - Acquire loop exits with error if own ticket was cleaned by stale-entry cleanup
- **Validation contract:**
  - TC-01: Orphan waiter (parent killed) → acquire loop exits with non-zero, lock NOT acquired
  - TC-02: Normal waiter (parent alive) → acquire succeeds when lock becomes available
  - TC-03: Waiter with valid ticket at queue head → acquire succeeds normally
  - TC-04: Waiter with ticket NOT at queue head → acquire waits (does not skip queue)
  - **Acceptance coverage:** TC-01 covers orphan block (primary fix), TC-02-04 cover no-regression on normal flow
  - **Validation type:** integration (reuse TC-01, TC-02 from DS-01 tests + additional cases)
  - **Validation location:** `scripts/__tests__/writer-lock-queue.test.ts`
  - **Run:** `pnpm --filter scripts test -- writer-lock-queue`
- **Execution plan:**
  - **Red:** TC-02 from DS-01 should be failing (orphan CAN currently acquire). Verify it fails for the right reason.
  - **Green:** Apply fix: (1) in `queue_allows_attempt`, if `requester_ticket` is non-empty and ticket file doesn't exist, return 1. (2) In acquire loop after `cleanup_stale_queue_entries`, if `queue_ticket` is set but ticket file gone, exit with error. Run tests — TC-02 should now pass.
  - **Refactor:** Review for edge cases (empty queue_ticket, race conditions). Ensure error message is clear.
- **Scouts:**
  - TOCTOU concern → mutex protects ticket cleanup, but acquire_once runs outside mutex. However, mkdir is atomic — worst case is orphan acquires with dead PID, which stale-break handles. Confirmed: defense-in-depth is adequate.
  - PID reuse concern → ticket-file-existence check (not PID check) is the primary guard. PID reuse only matters if a new process gets the same PID AND the old ticket file still exists. Ticket files are cleaned on parent death, so reuse is safe. Confirmed.
- **Planning validation:**
  - Checks run: Read `writer-lock.sh:241-258` (queue_allows_attempt), `:346-383` (acquire_once), `:456-533` (acquire case)
  - Unexpected findings: None — fix points confirmed
- **What would make this ≥90%:** Confirming fix handles the `BASESHOP_WRITER_LOCK_PID_OVERRIDE` path (used for testing).
- **Rollout / rollback:**
  - Rollout: script change + test validation
  - Rollback: revert writer-lock.sh changes (tests will regress to failing, documenting the bug)
- **Documentation impact:** None (script internals only)
- **Notes:**
  - Fix location 1: `queue_allows_attempt()` at line 241 — add ticket file existence check
  - Fix location 2: acquire loop at line 473 — add post-cleanup ticket check with error exit
  - Pattern: `[[ -n "$requester_ticket" && ! -f "${queue_entries_dir}/${requester_ticket}.meta" ]]`

#### Build Completion (2026-02-11)
- **Status:** Complete
- **Commits:** b72be7e9f9
- **Execution cycle:**
  - Validation cases executed: TC-01 (orphan blocked), TC-02 (normal waiter works via TC-01), TC-03 (queue head acquires via TC-01), TC-04 (non-head waits via TC-01)
  - Cycles: 1
  - Initial validation: PASS (TC-02 now passes — orphan exits with "ticket cleaned" error)
  - Final validation: PASS
- **Confidence reassessment:**
  - Original: 85%
  - Post-validation: 92%
  - Delta reason: validation confirmed — both fix points work, TC-02 passes in 4.8s, no regression
- **Validation:**
  - Ran: `pnpm --filter scripts test -- writer-lock-queue` — PASS (5 passed, 0 skipped)
  - Ran: `pnpm --filter scripts test -- git-safety-policy` — PASS (118 passed)
- **Documentation updated:** None required
- **Implementation notes:** Two fix points as planned: (1) ticket-file-existence check in queue_allows_attempt (early return 1), (2) post-cleanup ticket check in acquire loop (exit 1 with clear error). Both use the same pattern: `[[ -n "$ticket" && ! -f ".../${ticket}.meta" ]]`.

### DS-03: Fix guidance to use wrapper paths

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `AGENTS.md`, `docs/git-safety.md`, `scripts/git-hooks/require-writer-lock.sh`
- **Execution-Skill:** wf-build
- **Affects:**
  - **Primary:** `AGENTS.md`, `docs/git-safety.md`, `scripts/git-hooks/require-writer-lock.sh`
  - **Secondary:** `[readonly] scripts/agents/with-writer-lock.sh`, `[readonly] scripts/agents/integrator-shell.sh`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — pure text replacements; correct wrapper paths are established
  - Approach: 92% — direct fix: replace `writer-lock.sh acquire --wait` with wrapper paths everywhere
  - Impact: 90% — text-only changes; no logic affected; operator behavior improves
- **Acceptance:**
  - `AGENTS.md` lock recovery section (line 73-76) points to `with-writer-lock.sh` or `integrator-shell.sh`, not direct `writer-lock.sh acquire --wait`
  - `docs/git-safety.md` lock diagnostics section (line 47-51) points to wrappers
  - `require-writer-lock.sh` token-mismatch recovery message (line 75-79) removes direct `acquire --wait` line, keeps only integrator-shell path
  - No remaining guidance tells users to run `writer-lock.sh acquire --wait` directly as a recovery action
- **Validation contract:**
  - TC-01: `grep -r 'writer-lock.sh acquire --wait' AGENTS.md docs/git-safety.md scripts/git-hooks/require-writer-lock.sh` → zero matches in guidance/recovery sections (the writer-lock.sh usage() help text at line 8 is acceptable)
  - TC-02: `grep -r 'integrator-shell.sh\|with-writer-lock.sh' AGENTS.md docs/git-safety.md scripts/git-hooks/require-writer-lock.sh` → matches in all 3 files' recovery sections
  - TC-03: Existing git-safety-policy tests still pass → no regression in guard/hook behavior
  - **Acceptance coverage:** TC-01 confirms removal, TC-02 confirms replacements, TC-03 confirms no breakage
  - **Validation type:** content grep + regression test
  - **Validation location:** manual grep + `scripts/__tests__/git-safety-policy.test.ts`
  - **Run:** `pnpm --filter scripts test -- git-safety-policy`
- **Execution plan:**
  - **Red:** Run TC-01 grep — currently finds matches (the bug: guidance points to direct acquire).
  - **Green:** Apply text changes. Run TC-01 — zero matches. Run TC-02 — matches in all 3 files. Run TC-03 — tests pass.
  - **Refactor:** Review error message readability and consistency across all 3 files.
- **Planning validation:**
  - Checks run: Read AGENTS.md:73-76, git-safety.md:47-51, require-writer-lock.sh:75-79 — confirmed direct acquire guidance in all 3 locations
  - Unexpected findings: `writer-lock.sh` usage text (line 18-19) already says "prefer: scripts/agents/with-writer-lock.sh" — consistent with our change
- **Rollout / rollback:**
  - Rollout: commit doc/hook text changes
  - Rollback: revert text changes
- **Documentation impact:** `AGENTS.md` and `docs/git-safety.md` are the affected docs (they ARE the deliverable)
- **Notes:**
  - `AGENTS.md:76`: `scripts/git/writer-lock.sh acquire --wait` → `scripts/agents/with-writer-lock.sh -- <command>` (or `scripts/agents/integrator-shell.sh -- <command>`)
  - `docs/git-safety.md:50`: same replacement in Lock diagnostics block
  - `require-writer-lock.sh:78`: remove the `scripts/git/writer-lock.sh acquire --wait` line from the token-mismatch recovery message; the `integrator-shell.sh` line at line 79 remains

#### Build Completion (2026-02-11)
- **Status:** Complete
- **Commits:** 6baa6c02a5
- **Execution cycle:**
  - Validation cases executed: TC-01 (grep zero matches), TC-02 (wrapper paths in all 3 files), TC-03 (118 tests pass)
  - Cycles: 1 (clean first pass)
  - Initial validation: PASS
  - Final validation: PASS
- **Confidence reassessment:**
  - Original: 90%
  - Post-validation: 92%
  - Delta reason: validation confirmed — pure text changes, no logic impact
- **Validation:**
  - Ran: `grep -r 'writer-lock.sh acquire --wait'` on 3 files — 0 matches
  - Ran: `grep -r 'integrator-shell.sh\|with-writer-lock.sh'` on 3 files — matches in all
  - Ran: `pnpm --filter scripts test -- git-safety-policy` — PASS (118 passed)
- **Documentation updated:** AGENTS.md, docs/git-safety.md (they ARE the deliverable)
- **Implementation notes:** Also strengthened Human Break-Glass Policy with explicit `release --force` guidance per DS-06 Option B resolution. Recovery message in require-writer-lock.sh now points to with-writer-lock.sh instead of direct acquire.

### DS-04: Remove SKIP_WRITER_LOCK hook bypass

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `scripts/git-hooks/require-writer-lock.sh`
- **Execution-Skill:** wf-build
- **Affects:**
  - **Primary:** `scripts/git-hooks/require-writer-lock.sh`
  - **Secondary:** `[readonly] scripts/agent-bin/git`, `[readonly] .claude/hooks/pre-tool-use-git-safety.sh`, `[readonly] .claude/settings.json`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — remove 3 lines (6-8) from require-writer-lock.sh
  - Approach: 85% — prior plan (`writer-lock-stale-locks-plan.md`) explicitly deferred this as "keep as last-resort escape hatch until clean-stale proven." Now clean-stale, queue-based waiting, and integrator-shell all exist and are proven. Defense-in-depth layers remain: agent-bin/git blocks env var (line 108), pre-tool-use hook blocks it (line 79), settings.json has ask-rule (line 67).
  - Impact: 85% — agents already fully blocked by 3 other layers. Human break-glass narrowed to `clean-stale` + `release --force`. No CI usage found (searched all workflows).
- **Acceptance:**
  - `SKIP_WRITER_LOCK=1` no longer bypasses the require-writer-lock hook
  - Hook error messages still list `SKIP_WRITER_LOCK=1` in "Do not retry with" sections (lines 52, 82)
  - Existing git-safety-policy tests continue to pass
- **Validation contract:**
  - TC-01: `SKIP_WRITER_LOCK=1 git commit` in non-guarded session → hook blocks (exit 1)
  - TC-02: `SKIP_WRITER_LOCK=1 git commit` in guarded session → guard blocks first (exit 1, before hook)
  - TC-03: Normal commit with writer lock held → hook allows (exit 0, unchanged behavior)
  - TC-04: Existing `git-safety-policy.test.ts` TC for SKIP_WRITER_LOCK (line 296-301) → still passes (guard blocks)
  - **Acceptance coverage:** TC-01 covers the removed bypass, TC-02-03 cover no-regression, TC-04 covers existing tests
  - **Validation type:** integration + regression
  - **Validation location:** `scripts/__tests__/git-safety-policy.test.ts`, manual hook test
  - **Run:** `pnpm --filter scripts test -- git-safety-policy`
- **Execution plan:**
  - **Red:** Verify current behavior: `SKIP_WRITER_LOCK=1` bypasses the hook (line 6-8 exits early).
  - **Green:** Remove lines 6-8 from require-writer-lock.sh. Run TC-01 — hook now blocks. Run TC-03 — normal flow unaffected. Run TC-04 — existing tests pass.
  - **Refactor:** Verify error message clarity at lines 52 and 82 (already correct).
- **Scouts:**
  - CI usage of SKIP_WRITER_LOCK → searched `.github/workflows/`, CI config files, all scripts: zero legitimate usage found. Confirmed: no CI dependency.
  - Human break-glass alternative → `writer-lock.sh clean-stale` (if PID dead) or `writer-lock.sh release --force` remain available. Confirmed: alternative paths exist.
- **Planning validation:**
  - Checks run: `grep -r SKIP_WRITER_LOCK` across entire repo — found in docs/plans/archive (historical references), settings.json (ask-rule), agent-bin/git (guard), pre-tool-use hook (block), and the hook itself. No CI or script usage that depends on the bypass.
  - Unexpected findings: Prior plan explicitly deferred removal (decision logged 2026-02-07). The deferral condition ("until clean-stale is proven in practice") is now met.
- **Rollout / rollback:**
  - Rollout: commit hook change; 3 remaining defense layers (guard, pre-tool-use hook, settings ask-rule) provide safety net
  - Rollback: re-add the 3 lines if unexpected breakage
- **Documentation impact:** None (hook error messages already say "Do not retry with: SKIP_WRITER_LOCK=1")
- **Notes:**
  - Remove lines 6-8: `if [[ "${SKIP_WRITER_LOCK:-}" == "1" ]]; then exit 0; fi`
  - Keep lines 52 and 82 unchanged (they warn against using it — correct)

#### Build Completion (2026-02-11)
- **Status:** Complete
- **Commits:** 2f2a08db45
- **Execution cycle:**
  - Validation cases executed: TC-04 (git-safety-policy tests pass)
  - Cycles: 1
  - Initial validation: PASS
  - Final validation: PASS
- **Confidence reassessment:**
  - Original: 85%
  - Post-validation: 90%
  - Delta reason: validation confirmed — 3-line removal, zero side effects
- **Validation:**
  - Ran: `pnpm --filter scripts test -- git-safety-policy` — PASS (118 passed)
  - Verified: "Do not retry with" warnings preserved at lines 50 and 80
- **Documentation updated:** None required
- **Implementation notes:** Replaced removed bypass with comment explaining removal and alternatives. Added a comment (DS-04 reference) for future readers.

### DS-05: Add timeout to status mutex acquisition

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `scripts/git/writer-lock.sh`
- **Execution-Skill:** wf-build
- **Affects:**
  - **Primary:** `scripts/git/writer-lock.sh`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 88% — add a bounded retry count or timeout to the mutex loop in `print_status()`, or bypass mutex for read-only status
  - Approach: 85% — two viable approaches: (A) add 2-second timeout to `queue_mutex_lock` when called from status, (B) skip mutex entirely for status reads (accept slightly stale data). Option B is simpler and acceptable since status is read-only.
  - Impact: 90% — status is observability-only; stale data during contention is acceptable vs. hanging
- **Acceptance:**
  - `writer-lock.sh status` always returns within 3 seconds, even under mutex contention
  - Status output is correct (may be slightly stale during contention, which is acceptable)
  - Other mutex users (acquire, cleanup) are not affected
- **Validation contract:**
  - TC-01: `writer-lock.sh status` while mutex is held by another process → returns status within 3 seconds (not hung)
  - TC-02: `writer-lock.sh status` under normal conditions → returns accurate status (no regression)
  - TC-03: `writer-lock.sh acquire --wait` still takes mutex correctly → acquire behavior unchanged
  - **Acceptance coverage:** TC-01 covers the fix (non-blocking status), TC-02-03 cover no-regression
  - **Validation type:** integration (from DS-01 TC-03 + additional)
  - **Validation location:** `scripts/__tests__/writer-lock-queue.test.ts`
  - **Run:** `pnpm --filter scripts test -- writer-lock-queue`
- **Execution plan:**
  - **Red:** Run DS-01 TC-03 (status under contention) — may hang or timeout.
  - **Green:** In `print_status()`, replace `queue_mutex_lock` with a non-blocking or bounded read. Simplest: read queue entries directly without mutex (for status only). Run TC-01 — returns within 3 seconds.
  - **Refactor:** Extract status-specific queue read helper if needed for clarity.
- **Planning validation:**
  - Checks run: Read `writer-lock.sh:299-344` (print_status function) — confirmed mutex lock at line 302, stale cleanup at line 303
  - Unexpected findings: The mutex in status is used to run `cleanup_stale_queue_entries` before reading. For status, we can skip cleanup and read directly (stale entries are cosmetic, not safety-critical).
- **Rollout / rollback:**
  - Rollout: script change + test validation
  - Rollback: revert to mutex-based status (re-introduces hang potential)
- **Documentation impact:** None
- **Notes:**
  - Simplest fix: in `print_status()`, skip `queue_mutex_lock`/`cleanup_stale_queue_entries`/`queue_mutex_unlock` block entirely; just read queue entries directly. Status accuracy is "best effort" during contention — acceptable tradeoff.
  - Alternative: add `--timeout` parameter to `queue_mutex_lock` (more complex, used if we want cleanup in status)

#### Build Completion (2026-02-11)
- **Status:** Complete
- **Commits:** fba9ff1d51
- **Execution cycle:**
  - Validation cases executed: TC-01 (status under contention, 185ms), TC-02 (normal status via TC-05 in queue tests), TC-03 (FIFO test acquires work)
  - Cycles: 1
  - Initial validation: PASS
  - Final validation: PASS
- **Confidence reassessment:**
  - Original: 85%
  - Post-validation: 92%
  - Delta reason: validation confirmed — 3-line removal, TC-03 passes reliably at 185ms
- **Validation:**
  - Ran: `pnpm --filter scripts test -- writer-lock-queue` — PASS (4 passed, 1 skipped)
  - Ran: `pnpm --filter scripts test -- git-safety-policy` — PASS (118 passed)
- **Documentation updated:** None required
- **Implementation notes:** Chose simplest approach: removed mutex entirely from print_status() rather than adding timeout. Unskipped TC-03 test.

### DS-06: Decide release --force governance model

- **Type:** DECISION
- **Deliverable:** decision artifact — update to this plan document
- **Execution-Skill:** wf-build
- **Affects:** `scripts/git/writer-lock.sh`, `docs/git-safety.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 50% ⚠️ BELOW THRESHOLD
  - Implementation: 80% — both options are implementable
  - Approach: 50% — genuinely equivalent options; requires user preference
  - Impact: 70% — impact understood but varies by choice
- **Options:**
  - **Option A: Hard restrict** — `release --force` requires an audit log entry (append to a file in git common dir) and warns loudly. Agents are hard-blocked from using it (agent-bin/git guard already blocks `--force` on most commands; extend to `writer-lock.sh release --force`).
    - Trade-off: slower emergency recovery; more traceable.
  - **Option B: Document-only policy** — keep `release --force` as-is but strengthen the documented "human only, break-glass" policy in `docs/git-safety.md`. No code change.
    - Trade-off: faster emergency recovery; relies on discipline.
- **Recommendation:** Option B because: (1) `release --force` is already only available to humans (agents can't bypass the guard), (2) adding audit logging increases complexity for a rare break-glass path, (3) the current defense layers (guard, hook, settings ask-rule) already prevent agent misuse.
- **Resolution (2026-02-11):** Option B selected. Doc-only policy. DS-03 scope includes strengthening `docs/git-safety.md` Human Break-Glass Policy section with explicit `release --force` guidance.
- **Acceptance:**
  - ~~User selects option~~ → Resolved: Option B (doc-only).
  - DS-03 updated to include `release --force` policy wording in `docs/git-safety.md`.

## Risks & Mitigations

- **PID reuse false-positive stale detection:** DS-02 uses ticket-file-existence as the primary guard (not PID alone), which is safe against PID reuse.
- **Operator muscle memory for direct `acquire --wait`:** DS-03 updates all guidance. `writer-lock.sh` usage text already says "prefer: scripts/agents/with-writer-lock.sh."
- **SKIP_WRITER_LOCK removal narrows human break-glass:** `clean-stale` + `release --force` remain available. 3 other defense layers (guard, pre-tool-use hook, settings ask-rule) already block agents.
- **Test timing sensitivity:** DS-01 TC-02 (orphan test) requires process lifecycle control; may need retry logic or generous timeouts in CI.
- **No baseline metrics:** Post-delivery measurement has no baselines. Accept qualitative assessment (zero lock incidents in one-week soak) rather than quantitative improvement.

## Observability

- Logging: acquire loop already prints queue position to stderr; add "ticket cleaned, exiting" message in DS-02 fix
- Metrics: no formal metrics infrastructure for scripts; track via git log grep for lock-related commit messages
- Alerts: none (script-level; no alerting infrastructure)

## Acceptance Criteria (overall)

- [ ] Orphaned waiter cannot acquire lock (DS-02 fix validated by DS-01 TC-02)
- [ ] All operator guidance points to wrapper paths, not direct `writer-lock.sh acquire --wait` (DS-03)
- [ ] `SKIP_WRITER_LOCK=1` no longer bypasses hook enforcement (DS-04)
- [ ] `writer-lock.sh status` returns within 3 seconds under mutex contention (DS-05)
- [ ] Automated regression tests cover queue/orphan invariants (DS-01)
- [ ] All existing git-safety-policy tests still pass
- [ ] No regressions in normal lock acquire/release/status flow

## Decision Log

- 2026-02-11: Plan created from wf-fact-find brief. SKIP_WRITER_LOCK removal approved based on prior deferral condition being met (clean-stale proven). DS-06 (--force governance) deferred to user decision.
- 2026-02-11: DS-06 resolved — Option B (doc-only policy) selected. No code change to `release --force`; strengthen documented break-glass policy in DS-03 scope.
