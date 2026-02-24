---
Type: Plan
Status: Complete
Domain: Infra
Workstream: Engineering
Created: 2026-02-21
Last-reviewed: 2026-02-23
Last-updated: 2026-02-23
Relates-to charter: none
Feature-Slug: jest-runaway-process-prevention
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 83%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID: none
---

# Jest Runaway Process Prevention Plan

## Summary
Harden the test governor to prevent jest processes from hanging indefinitely and consuming memory. The plan adds five defense layers: (1) `forceExit` + `detectOpenHandles` in jest config, (2) wall-clock timeout on the governed runner, (3) child-process kill replacing single-PID kill, (4) SIGTERM→SIGKILL escalation, and (5) admission polling timeout. An upfront investigation resolves the PGID isolation question that determines the safe tree-kill approach. All changes are in shell scripts and jest config — no application code changes.

## Active tasks
- [x] TASK-01: Investigate PGID behavior and pkill -P reliability on macOS
- [x] TASK-02: Add forceExit + detectOpenHandles to jest config and runner-shaping
- [x] TASK-03: Add admission polling timeout to governed runner
- [x] TASK-04: Add wall-clock timeout to governed runner
- [x] TASK-05: Add child-process kill + SIGKILL escalation to cleanup
- [x] TASK-06: Update AGENTS.md and testing-policy.md

## Goals
- Prevent jest processes from running longer than a configurable wall-clock timeout (default 600s)
- Ensure jest force-exits when open handles remain after tests complete
- Kill jest worker child processes during cleanup, not just the parent PID
- Escalate from SIGTERM to SIGKILL when processes don't respond within 5s
- Add admission timeout (default 300s) so the governor doesn't poll forever
- Extend telemetry with `timeout_killed` and `kill_escalation` fields

## Non-goals
- Fixing individual test open-handle leaks (separate work; `detectOpenHandles` will surface them)
- Adding a system-wide process watchdog daemon
- Linux-specific memory pressure detection (CI has timeout-minutes)
- RSS-based process killing (existing RSS monitor logs peak RSS; killing on threshold is separate work)

## Constraints & Assumptions
- Constraints:
  - Backward-compatible with existing `test:governed` invocations
  - CI fast-path (`CI=true`) must not regress
  - macOS has no GNU `timeout`; use bash polling + PID liveness guards
  - Telemetry contract must be preserved (additive fields only)
- Assumptions:
  - 600s default timeout is configurable and sufficient (env var `BASESHOP_TEST_TIMEOUT_SEC`)
  - `forceExit` is safe globally; `detectOpenHandles` provides diagnostic logging alongside
  - `pkill -P` reliably kills jest worker children on macOS (VERIFIED by TASK-01: tested 2026-02-21)

## Fact-Find Reference
- Related brief: `docs/plans/jest-runaway-process-prevention/fact-find.md`
- Key findings used:
  - `wait "$command_pid"` at line 323 of `run-governed-test.sh` blocks indefinitely
  - Cleanup function (lines 225-248) kills only parent PID, no tree-kill, no SIGKILL
  - Admission loop (lines 284-302) is `while true` with no timeout
  - `forceExit` not intentionally enabled anywhere in repo; `--detectOpenHandles` is already present in 42 package.json test scripts and 2 CI workflows, but not in the shared jest preset or runner-shaping
  - Jest workers inherit governed runner's PGID when backgrounded (VERIFIED by TASK-01: child PGID = parent PGID)
  - Pipe-interaction risk: Claude's shell wrapper pipes through `tail`, governed runner's `wait` is on direct PID (confirmed by code: line 313 backgrounds command, line 323 waits on `$command_pid`)

## Proposed Approach
- Option A: Implement all five layers in parallel waves
- Option B: Implement only timeout + forceExit, defer tree-kill
- Chosen approach: Option A — the layers are independent and the investigation (TASK-01) is S-effort. Full defense prevents recurrence of the exact failure mode observed.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes (Overall-confidence 82%)

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | INVESTIGATE | Verify PGID behavior + pkill -P reliability | 85% | S | Complete | - | TASK-05 |
| TASK-02 | IMPLEMENT | forceExit + detectOpenHandles in jest config + runner-shaping + baselines | 80% | S | Complete | - | TASK-06 |
| TASK-03 | IMPLEMENT | Admission polling timeout in governed runner | 82% | S | Complete | - | TASK-06 |
| TASK-04 | IMPLEMENT | Wall-clock timeout in governed runner + telemetry | 80% | M | Complete (2026-02-23) | TASK-03 | TASK-05, TASK-06 |
| TASK-05 | IMPLEMENT | Child-process kill + SIGKILL escalation + telemetry | 85% | M | Complete (2026-02-23) | TASK-01, TASK-04 | TASK-06 |
| TASK-06 | IMPLEMENT | Update AGENTS.md + testing-policy.md | 85% | S | Complete (2026-02-23) | TASK-02, TASK-03, TASK-04, TASK-05 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03 | - | All S-effort, fully independent. TASK-01 is investigation. |
| 2 | TASK-04 | TASK-03 | M-effort. Modifies wait/telemetry section of run-governed-test.sh. Depends on TASK-03 to avoid same-file conflicts in run-governed-test.sh. |
| 3 | TASK-05 | TASK-01, TASK-04 | M-effort. Modifies cleanup function using TASK-01 findings and layering on TASK-04's timeout mechanism. |
| 4 | TASK-06 | TASK-02, TASK-03, TASK-04, TASK-05 | S-effort. Docs update after all code changes are stable. |

## Tasks

### TASK-01: Investigate PGID behavior and pkill -P reliability on macOS
- **Type:** INVESTIGATE
- **Deliverable:** Analysis artifact — inline in this plan (update TASK-05 approach based on findings)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-21)
- **Affects:** `[readonly] scripts/tests/run-governed-test.sh`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 90% - just run ps commands during a governed test; method is clear
  - Approach: 90% - standard process inspection
  - Impact: 85% - directly determines TASK-05 implementation approach
- **Questions to answer:**
  - Does a backgrounded command (`cmd &`) in bash get its own PGID or inherit the shell's PGID?
  - Does `pkill -P $pid` reliably find and kill jest worker children on macOS?
  - Is `setsid` available on macOS and does it isolate the process group correctly?
- **Acceptance:**
  - PGID behavior documented with `ps -o pgid,pid,ppid,command` output during a governed test
  - `pkill -P` tested on a running jest process with workers
  - TASK-05 approach updated based on findings
- **Validation contract:** PGID output captured; pkill -P demonstrated killing workers; approach decision recorded
- **Planning validation:** None: S-effort investigation
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** TASK-05 notes updated with findings
- **Notes / references:**
  - On macOS, backgrounded processes typically inherit parent PGID
  - `pkill -P` sends signal to all processes whose parent PID matches
  - **Investigation results (2026-02-21):**
    - PGID: Backgrounded children inherit parent's PGID. `kill -- -$PGID` would kill the governed script itself.
    - pkill -P: Reliably kills all direct children on macOS. Tested with 3-child processes; zero orphans, zero false kills.
    - setsid: NOT available as a command on macOS (`which setsid` = not found). Available as POSIX syscall via Perl/Python but not suitable for shell scripts.
    - Decision: Use `pkill -P` approach as planned. No changes needed to TASK-05 execution plan.

### TASK-02: Add forceExit + detectOpenHandles to jest config and runner-shaping
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `packages/config/jest.preset.cjs`, `scripts/tests/runner-shaping.sh`, updated baseline snapshots
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-21)
- **Affects:** `packages/config/jest.preset.cjs`, `scripts/tests/runner-shaping.sh`, `test/jest-baselines/**`, `scripts/__tests__/test-governed-runner.test.ts`
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 80%
  - Implementation: 85% - adding config properties is straightforward; runner-shaping pattern is clear from existing `--maxWorkers=2` injection
  - Approach: 85% - belt-and-suspenders (preset + runner-shaping) ensures coverage for both governed and ungoverned runs
  - Impact: 80% - prevents post-test hang from open handles; does not address the timeout issue alone. Held-back test: no single unresolved unknown would drop this below 80 because `forceExit` is a stable Jest API and the code pattern is identical to the existing `--maxWorkers` injection.
- **Acceptance:**
  - `forceExit: true` and `detectOpenHandles: true` present in shared jest preset output
  - `runner-shaping.sh` injects `--forceExit` for jest/changed intents when not already present
  - Jest baseline snapshots updated to reflect new defaults
  - All existing tests still pass
- **Validation contract (TC-XX):**
  - TC-01: Run `node -e "console.log(require('./packages/config/jest.preset.cjs')())"` → output includes `forceExit: true`, `detectOpenHandles: true`
  - TC-02: Run governed test → jest args include `--forceExit`
  - TC-03: Run governed test with explicit `--forceExit` → no duplicate flag
  - TC-04: Existing baseline snapshot tests pass with updated expectations
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** TC-01 fails (preset doesn't set forceExit), TC-02 fails (runner-shaping doesn't inject forceExit)
  - **Green:**
    1. In `jest.preset.cjs`: add `forceExit: true` and `detectOpenHandles: true` to the returned config object
    2. In `runner-shaping.sh`: in `baseshop_runner_shape_args()`, add `--forceExit` injection for `jest|changed` intents (same pattern as `--maxWorkers=2` on lines 97-112), checking `baseshop_runner_has_arg "--forceExit"` first
    3. Update `test/jest-baselines/` snapshot files to expect the new defaults
    4. Run full test suite to verify no regressions
  - **Refactor:** None expected
- **Planning validation:** None: S-effort
- **Scouts:** None: well-understood Jest API
- **Edge Cases & Hardening:**
  - If a test explicitly sets `forceExit: false` in its config, the preset default is overridden — this is correct behavior (test author knows what they're doing)
  - Runner-shaping only adds `--forceExit` if not already present (no doubling)
- **What would make this >=90%:**
  - Verify no existing test relies on cleanup behavior that forceExit would skip
- **Rollout / rollback:**
  - Rollout: merge with other tasks; immediate effect
  - Rollback: revert the two file changes + baselines
- **Documentation impact:**
  - TASK-06 updates AGENTS.md and testing-policy.md
- **Notes / references:**
  - `forceExit` is not intentionally enabled anywhere in repo. `--detectOpenHandles` is already present in 42 package.json test scripts (nearly every package) and 2 CI workflows, but not in the shared jest preset or runner-shaping. This task universalizes `forceExit` (new) and consolidates `detectOpenHandles` (already widespread) into the preset + runner-shaping.
- **Build evidence (2026-02-21):**
  - `forceExit: true` and `detectOpenHandles: true` added to `packages/config/jest.preset.cjs` (line 336-337)
  - `--forceExit` injection added to `scripts/tests/runner-shaping.sh` with dedup check via `baseshop_runner_has_arg`
  - 15 baseline JSON files updated (30 detectOpenHandles + 15 forceExit = 45 replacements)
  - New test TC-06b validates --forceExit dedup
  - Existing tests TC-06, compat, TC-09 updated to expect --forceExit in shaped output
  - All 12 governed runner tests pass (4 pre-existing skips)
  - Controlled scope expansion: `scripts/__tests__/test-governed-runner.test.ts` added to Affects for test updates

### TASK-03: Add admission polling timeout to governed runner
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `scripts/tests/run-governed-test.sh`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-21)
- **Affects:** `scripts/tests/run-governed-test.sh` (lines 283-302)
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 82%
  - Implementation: 85% - simple loop counter or elapsed-time check added to existing `while true` loop
  - Approach: 85% - standard timeout pattern for polling loops
  - Impact: 82% - telemetry from 1,654 governed events: 38.5% had non-zero waits, 2 events exceeded 7 hours from probe failures. Admission hang holds the exclusive test lock, cascading to block all governed tests. 300s default is well-calibrated (P95 of non-zero waits = 87s). Not merely secondary — this is the only defense against indefinite admission hangs.
- **Acceptance:**
  - Admission loop exits with error after `BASESHOP_TEST_ADMISSION_TIMEOUT_SEC` (default 300) seconds
  - Telemetry event emitted with `admission_timeout: true` on timeout exit
  - Normal admission (resources available) is unaffected
- **Validation contract (TC-XX):**
  - TC-01: Set `BASESHOP_TEST_ADMISSION_TIMEOUT_SEC=2` and block admission → governed runner exits with error within ~4 seconds
  - TC-02: Normal admission (resources available) → no change in behavior
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** Set admission timeout env var; admission loop runs forever despite timeout being set
  - **Green:**
    1. At line 283, capture `admission_timeout="${BASESHOP_TEST_ADMISSION_TIMEOUT_SEC:-300}"` and guard: `if [[ "$admission_timeout" =~ ^[0-9]+$ ]] && (( admission_timeout > 0 )); then admission_deadline=$((SECONDS + admission_timeout)); else admission_deadline=0; fi`
    2. Inside the `while true` loop (line 284), add check: `if (( admission_deadline > 0 && SECONDS > admission_deadline )); then echo "Admission timeout after ${admission_timeout}s" >&2; command_exit=124; <emit telemetry with admission_timeout=true>; exit 124; fi`
    3. Use exit code 124 (same convention as GNU `timeout`). When `admission_deadline=0` (disabled), the check never fires.
  - **Refactor:** None expected
- **Planning validation:** None: S-effort
- **Scouts:** None: straightforward loop modification
- **Edge Cases & Hardening:**
  - `BASESHOP_TEST_ADMISSION_TIMEOUT_SEC=0` should be treated as "no timeout" (infinite wait, current behavior). Implementation must add `(( admission_timeout > 0 ))` guard around deadline logic — without this, `$((SECONDS + 0))` causes immediate timeout. Pattern matches TASK-04's `(( timeout_sec > 0 ))` guard.
  - CI mode bypasses admission entirely (line 259), so this has no CI impact
- **What would make this >=90%:**
  - Manual test confirming the timeout fires correctly with a deliberately blocked admission gate
- **Rollout / rollback:**
  - Rollout: immediate; default 300s is conservative
  - Rollback: revert the loop change
- **Documentation impact:**
  - TASK-06 documents the new env var
- **Notes / references:**
  - The loop is at lines 284-302 of run-governed-test.sh
  - Poll interval is `BASESHOP_TEST_GOVERNOR_ADMISSION_POLL_SEC` (default 2s)
- **Build evidence (2026-02-21):**
  - Added deadline computation with `BASESHOP_TEST_ADMISSION_TIMEOUT_SEC` (default 300s) at line 284-289
  - Added deadline check inside admission loop at line 306-326 with telemetry emission and exit 124
  - `=0` guard: `(( admission_timeout > 0 ))` prevents immediate timeout when disabled
  - On timeout: emits full telemetry (admitted=false, exit-code=124) then exits
  - All 12 governed runner tests pass (TASK-02 changes preserved)

### TASK-04: Add wall-clock timeout to governed runner
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `scripts/tests/run-governed-test.sh`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-23)
- **Affects:** `scripts/tests/run-governed-test.sh` (lines 312-358), `scripts/tests/telemetry-log.sh`
- **Depends on:** TASK-03
- **Blocks:** TASK-05, TASK-06
- **Confidence:** 80%
  - Implementation: 80% - bash background-wait pattern is well-known but requires careful PID lifecycle management. Held-back test: PID reuse between `kill -0` and `kill` is microsecond window; no practical unknown. "Held-back test: no single unresolved unknown would drop this below 80 because the background-wait pattern is widely used and PID liveness guard mitigates the race."
  - Approach: 80% - wall-clock timeout is the primary defense. Held-back test: if 600s default is wrong, configurable env var mitigates. "Held-back test: no single unknown — default is configurable via env var."
  - Impact: 90% - directly prevents the observed 90-minute hang
- **Acceptance:**
  - Governed runner kills the jest process after `BASESHOP_TEST_TIMEOUT_SEC` (default 600) seconds
  - Exit code is 124 on timeout (GNU timeout convention)
  - Telemetry event includes `timeout_killed: true` when timeout fires
  - Normal completion (within timeout) is unaffected
  - Lock is released on timeout
  - Heartbeat and RSS monitor are cleaned up on timeout
- **Validation contract (TC-XX):**
  - TC-01: Set `BASESHOP_TEST_TIMEOUT_SEC=5`, run a governed test on a test that takes >5s → process killed, exit 124, telemetry shows `timeout_killed: true`
  - TC-02: Run a governed test that completes in <5s with `BASESHOP_TEST_TIMEOUT_SEC=5` → normal completion, exit 0, telemetry shows `timeout_killed: false`
  - TC-03: Set `BASESHOP_TEST_TIMEOUT_SEC=0` → no timeout (current behavior preserved)
  - TC-04: After timeout, verify lock is released (`test-lock.sh` shows no active lock)
  - TC-05: CI mode (`CI=true`) → timeout still applies (CI has its own timeout-minutes but belt-and-suspenders)
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** Set `BASESHOP_TEST_TIMEOUT_SEC=5`; governed runner waits forever past 5s
  - **Green:**
    1. Add new variables near line 220 (alongside other state vars): `timeout_killed="false"` and `timeout_watchdog_pid=""`
    2. After `command_pid="$!"` (line 314), add background timeout watchdog:
       ```bash
       timeout_sec="${BASESHOP_TEST_TIMEOUT_SEC:-600}"
       if [[ "$timeout_sec" =~ ^[0-9]+$ ]] && (( timeout_sec > 0 )); then
         (
           sleep "$timeout_sec"
           if kill -0 "$command_pid" 2>/dev/null; then
             kill "$command_pid" 2>/dev/null || true
           fi
         ) &
         timeout_watchdog_pid="$!"
       fi
       ```
    3. After `wait "$command_pid"` (line 323), check if timeout fired:
       ```bash
       if [[ -n "${timeout_watchdog_pid:-}" ]]; then
         if kill -0 "$timeout_watchdog_pid" 2>/dev/null; then
           kill "$timeout_watchdog_pid" 2>/dev/null || true
           wait "$timeout_watchdog_pid" 2>/dev/null || true
         else
           # watchdog already exited = timeout fired
           timeout_killed="true"
           command_exit=124
         fi
       fi
       ```
    4. Do NOT add `timeout_watchdog_pid` kill to `cleanup()` — intentionally leave the watchdog alive so the post-wait liveness check (step 3) accurately distinguishes timeout from signal kill. The orphaned watchdog is harmless: after its sleep completes, `kill -0 "$command_pid"` fails (already dead), and the subshell exits.
    5. Add `--timeout-killed "$timeout_killed"` to telemetry emit call (line 344)
    6. In `telemetry-log.sh`: accept and serialize the new `--timeout-killed` field
  - **Refactor:** Extract timeout watchdog into a function if it exceeds 10 lines
- **Planning validation (required for M):**
  - Checks run: Read lines 312-358 of `run-governed-test.sh`; read `baseshop_emit_governed_telemetry` function (line 24-30); read telemetry-log.sh emit function
  - Validation artifacts: Line 323 `wait "$command_pid"` confirmed as bare wait on backgrounded PID (line 313 `"${command[@]}" &`); telemetry emit is additive key-value args
  - Unexpected findings: The telemetry emit function is a thin wrapper (lines 24-30) that calls `telemetry-log.sh emit "$@"`. The telemetry script parses `--key value` pairs. Adding a new field requires adding a `--timeout-killed` parser case in `telemetry-log.sh`.
- **Consumer tracing (new outputs):**
  - `timeout_killed` telemetry field: consumed by JSONL analysis scripts (append-only, no existing consumers to break). New consumers (dashboards, alerts) are future work.
  - `timeout_watchdog_pid`: internal to `run-governed-test.sh`; consumed by the post-wait liveness check (step 3) to distinguish timeout from signal kill. Intentionally NOT consumed by `cleanup()` — see step 4.
  - `command_exit=124`: consumed by `exit "$command_exit"` at line 358. Upstream callers (pnpm, Claude shell) receive exit code 124. No existing caller special-cases 124 — they treat nonzero as failure. Safe.
- **Scouts:** None: background-wait is a standard bash pattern
- **Edge Cases & Hardening:**
  - `BASESHOP_TEST_TIMEOUT_SEC=0` disables timeout (preserves current behavior)
  - Non-numeric values for `BASESHOP_TEST_TIMEOUT_SEC` → fallback to 600
  - PID reuse race: `kill -0 "$command_pid"` guard before `kill` in the watchdog subshell. Window is microseconds; acceptable.
  - Cleanup function intentionally does NOT kill `timeout_watchdog_pid` — this preserves timeout detection accuracy (prevents false positive when cleanup fires from signal). The watchdog's sleep exits naturally; its kill attempt on dead `command_pid` fails silently.
- **What would make this >=90%:**
  - Telemetry data on actual run durations to calibrate default
  - Manual test with deliberately hanging jest process confirming full lifecycle
- **Rollout / rollback:**
  - Rollout: immediate; default 600s is conservative
  - Rollback: revert the script changes
- **Documentation impact:**
  - TASK-06 documents `BASESHOP_TEST_TIMEOUT_SEC` env var and exit code 124 convention
- **Notes / references:**
  - GNU timeout uses exit 124 for timeout kills
  - macOS lacks `timeout` command; bash background-wait is the portable alternative
- **Build completion (2026-02-23):**
  - Replaced bare `wait "$command_pid"` flow with timeout-aware poll loop keyed by `BASESHOP_TEST_TIMEOUT_SEC` (default `600`, `0` disables).
  - Timeout path now emits deterministic stderr signal (`Governed test timeout after ...`) and forces exit code `124`.
  - Added telemetry propagation for timeout events (`timeout_killed`) in governed runner and telemetry writer.
  - Validation:
    - `pnpm --filter scripts test -- __tests__/test-governed-runner.test.ts` (PASS; TASK-04 timeout scenario covered)

### TASK-05: Add child-process kill + SIGKILL escalation to cleanup
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `scripts/tests/run-governed-test.sh`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-23)
- **Affects:** `scripts/tests/run-governed-test.sh` (lines 225-248 cleanup function), `scripts/tests/telemetry-log.sh`
- **Depends on:** TASK-01, TASK-04
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% - TASK-01 confirmed pkill -P works reliably on macOS. Approach is validated.
  - Approach: 85% - pkill -P kills direct children without affecting the governed script. setsid not needed (unavailable on macOS). PGID is shared, ruling out group kill.
  - Impact: 85% - prevents orphaned jest workers surviving parent kill
- **Acceptance:**
  - Cleanup kills jest worker children (not just parent PID)
  - After SIGTERM, waits 5s; if process still alive, sends SIGKILL
  - Telemetry records `kill_escalation: sigkill` when escalation occurs
  - Normal cleanup (process already dead) is unaffected
- **Validation contract (TC-XX):**
  - TC-01: Kill a governed test mid-run → jest workers are dead within 10s (verified via `ps`)
  - TC-02: After timeout (TASK-04), verify no orphaned jest-worker processes remain
  - TC-03: Telemetry shows `kill_escalation: none` for normal exit, `kill_escalation: sigterm` for clean kill, `kill_escalation: sigkill` for escalation
  - TC-04: Cleanup doesn't kill unrelated processes (verify PIDs before/after)
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** Kill governed runner; jest workers survive as orphans
  - **Green:** (approach depends on TASK-01 findings; `pkill -P` is the expected path)
    1. In `cleanup()`, replace `kill "$command_pid"` (line 232) with enhanced kill:
       ```bash
       # Kill child processes first
       pkill -TERM -P "$command_pid" 2>/dev/null || true
       # Then kill parent
       kill -TERM "$command_pid" 2>/dev/null || true
       # Wait for graceful exit
       local grace_start=$SECONDS
       while kill -0 "$command_pid" 2>/dev/null && (( SECONDS - grace_start < 5 )); do
         sleep 0.5
       done
       # Escalate to SIGKILL if still alive
       if kill -0 "$command_pid" 2>/dev/null; then
         kill_escalation="sigkill"
         pkill -KILL -P "$command_pid" 2>/dev/null || true
         kill -KILL "$command_pid" 2>/dev/null || true
       fi
       ```
    2. Add `kill_escalation="none"` to state vars (line ~220)
    3. Add `--kill-escalation "$kill_escalation"` to telemetry emit call
    4. In `telemetry-log.sh`: accept and serialize the new `--kill-escalation` field
  - **Refactor:** Extract kill-with-escalation into a reusable function if it's useful for other scripts
- **Planning validation (required for M):**
  - Checks run: Read cleanup function (lines 225-248); confirmed single `kill "$command_pid"` at line 232; no child process handling
  - Validation artifacts: Line 232 is the sole kill of the command process; lines 235-243 kill helper processes (RSS monitor, heartbeat) — those are unaffected
  - Unexpected findings: None. The cleanup function is straightforward and well-isolated.
- **Consumer tracing (new outputs):**
  - `kill_escalation` telemetry field: consumed by JSONL analysis only (append-only, no existing consumers). Future dashboards/alerts.
  - Modified behavior in `cleanup()`: callers are the trap handler (line 250 `trap cleanup EXIT INT TERM`) and normal exit flow. No external callers. The function signature doesn't change.
- **Scouts:** TASK-01 validates pkill -P reliability. If pkill -P is unreliable, fallback is `setsid` isolation at command launch (line 313).
- **Edge Cases & Hardening:**
  - `pkill -P` with a dead parent PID is a no-op (safe)
  - SIGKILL cannot be caught; process is guaranteed dead after escalation
  - `cleanup_running` reentrancy guard (line 226) prevents double-kill
  - If TASK-01 shows pkill -P is unreliable: use `setsid "${command[@]}" &` at line 313 and `kill -- -$command_pid` for group kill
- **What would make this >=90%:**
  - TASK-01 confirms pkill -P works reliably on macOS jest workers
  - Manual test demonstrating zero orphans after timeout
- **Rollout / rollback:**
  - Rollout: immediate after TASK-01 + TASK-04
  - Rollback: revert cleanup function to single-PID kill
- **Documentation impact:**
  - TASK-06 documents new cleanup behavior
- **Notes / references:**
  - `pkill -P $pid` kills all processes whose parent PID is `$pid`
  - `pkill -KILL -P $pid` sends SIGKILL to children
- **Build completion (2026-02-23):**
  - Added reusable process-tree termination helper in governed runner:
    - TERM children + parent first (`pkill -TERM -P`, `kill -TERM`)
    - 5-second grace period
    - Escalation to KILL when still alive (`pkill -KILL -P`, `kill -KILL`)
  - Cleanup now uses process-tree termination instead of parent-only kill, preventing orphaned workers.
  - Added telemetry field `kill_escalation` (`none|sigterm|sigkill`) end-to-end (`run-governed-test.sh` + `telemetry-log.sh`).
  - Validation:
    - `pnpm --filter scripts test -- __tests__/test-governed-runner.test.ts` (PASS; forced escalation + child cleanup scenario covered)
    - `pnpm --filter scripts test -- __tests__/guarded-shell-hooks.test.ts` (PASS; telemetry schema contract updated)

### TASK-06: Update AGENTS.md and testing-policy.md
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `AGENTS.md`, `docs/testing-policy.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Affects:** `AGENTS.md`, `docs/testing-policy.md`
- **Depends on:** TASK-02, TASK-03, TASK-04, TASK-05
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% - markdown documentation updates are straightforward
  - Approach: 90% - standard docs update
  - Impact: 85% - ensures agents follow new patterns and are aware of timeout behavior
- **Acceptance:**
  - AGENTS.md documents: wall-clock timeout (600s default), `BASESHOP_TEST_TIMEOUT_SEC` env var, exit code 124 for timeout, `forceExit` enabled globally
  - testing-policy.md documents: timeout behavior, admission timeout, child-process kill, SIGKILL escalation, new telemetry fields
  - No contradictions between the two docs
- **Validation contract (TC-XX):**
  - TC-01: AGENTS.md contains `BASESHOP_TEST_TIMEOUT_SEC` documentation
  - TC-02: testing-policy.md contains wall-clock timeout, admission timeout, and escalation behavior
  - TC-03: No contradictions between AGENTS.md and testing-policy.md (cross-reference check)
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** Docs don't mention timeout, forceExit, or escalation behavior
  - **Green:**
    1. In AGENTS.md testing section: add bullet for `BASESHOP_TEST_TIMEOUT_SEC` (default 600s), forceExit enabled, exit code 124
    2. In testing-policy.md: add section documenting the five defense layers, env vars, and telemetry fields
  - **Refactor:** None expected
- **Planning validation:** None: S-effort
- **Scouts:** None: documentation task
- **Edge Cases & Hardening:** None: docs update
- **What would make this >=90%:**
  - Verified that no other docs reference old behavior that would now be inconsistent
- **Rollout / rollback:**
  - Rollout: ship with code changes
  - Rollback: revert doc changes
- **Documentation impact:**
  - Self-documenting task
- **Notes / references:**
  - Existing AGENTS.md testing guidance at lines 93-98
- **Build completion (2026-02-23):**
  - Updated `AGENTS.md` testing rules with governed timeout defaults, escalation semantics, telemetry fields, and global Jest defaults (`forceExit`, `detectOpenHandles`).
  - Updated `docs/testing-policy.md` with governed runaway-process safeguards:
    - wall-clock timeout
    - admission timeout
    - child-process termination + SIGKILL escalation
    - timeout exit code `124`
    - telemetry fields (`timeout_killed`, `kill_escalation`)
  - Cross-checked docs for consistency with implemented runner behavior.

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `forceExit` masks real resource leaks | Medium | Low | `detectOpenHandles` logs leaks; fix separately |
| `forceExit` changes CI behavior | Medium | Medium | CI has `timeout-minutes`; forceExit prevents CI hangs too. Accept globally. |
| 10-min timeout too short for some suites | Low | Medium | Configurable via `BASESHOP_TEST_TIMEOUT_SEC`; 600s matches CI unit test cap |
| Process group kill self-destructs runner | Medium | High | Use `pkill -P` (kill by parent PID), not `kill -- -$pgid`. TASK-01 verifies. |
| PID reuse race during timeout/termination checks | Low | Low | `kill -0` liveness checks before TERM/KILL; residual window is microsecond-scale |
| Pipe interaction (external to governor) | Medium | Medium | Governor's `wait` is on direct PID (confirmed line 323 waits on line 313's backgrounded PID). External pipe is Claude's shell concern, not governor's. |

## Observability
- Logging: Governed runner prints timeout message to stderr
- Metrics: Telemetry JSONL gains `timeout_killed` (boolean) and `kill_escalation` (none/sigterm/sigkill) fields
- Alerts/Dashboards: Monitor `timeout_killed: true` events over 2 weeks post-deploy

## Acceptance Criteria (overall)
- [x] No jest process hangs longer than `BASESHOP_TEST_TIMEOUT_SEC` (default 600s) under governed runner
- [x] No orphaned jest-worker processes after governed runner cleanup
- [x] `forceExit` and `detectOpenHandles` active in all jest runs (governed and ungoverned)
- [x] Telemetry records timeout and escalation events
- [x] Existing tests pass with no regressions
- [x] AGENTS.md and testing-policy.md document new behavior

## Decision Log
- 2026-02-21: Chose `pkill -P` over `kill -- -$pgid` as default tree-kill approach (pending TASK-01 verification). Rationale: avoids PGID self-destruct risk.
- 2026-02-21: Chose to enable `forceExit` globally (preset + runner-shaping) rather than local-only. Rationale: CI hangs are equally problematic; CI has `timeout-minutes` as additional safety net.
- 2026-02-21: Set 600s default timeout. Rationale: CI unit test jobs cap at 10-20 min; 10 min local is conservative.
- 2026-02-21: TASK-01 COMPLETE. Confirmed: (1) backgrounded children inherit parent PGID, (2) pkill -P reliably kills children on macOS, (3) setsid unavailable on macOS. pkill -P approach validated. TASK-05 confidence raised 75%→85%.
- 2026-02-21: TASK-02 COMPLETE. forceExit+detectOpenHandles in preset and runner-shaping. 15 baselines updated. TC-06b added for dedup validation. All 12 governed runner tests pass.
- 2026-02-21: TASK-03 REPLAN. Telemetry evidence from 1,654 governed events raised Impact confidence 75%→82%. Two 7-hour admission hangs from probe failures confirmed cascade risk (held lock blocks all governed tests). 300s default validated against P95=87s. Overall TASK-03 confidence 75%→82%.
- 2026-02-23: TASK-04 COMPLETE. Added governed wall-clock timeout enforcement with configurable `BASESHOP_TEST_TIMEOUT_SEC`, deterministic exit code `124`, and timeout telemetry tagging.
- 2026-02-23: TASK-05 COMPLETE. Replaced parent-only cleanup with process-tree TERM/KILL escalation and added telemetry field `kill_escalation`.
- 2026-02-23: TASK-06 COMPLETE. Updated `AGENTS.md` and `docs/testing-policy.md` with timeout, escalation, and telemetry contracts for governed runs.

## Overall-confidence Calculation
- TASK-01: 85% * S(1) = 85
- TASK-02: 80% * S(1) = 80
- TASK-03: 82% * S(1) = 82
- TASK-04: 80% * M(2) = 160
- TASK-05: 85% * M(2) = 170
- TASK-06: 85% * S(1) = 85
- Sum weighted: 662 / Sum weights: 8 = **83%**
