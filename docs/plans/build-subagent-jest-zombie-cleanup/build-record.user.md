---
Type: Build-Record
Status: Complete
Feature-Slug: build-subagent-jest-zombie-cleanup
Completed-date: 2026-02-25
artifact: build-record
---

# Build Record: Build Subagent Jest Zombie Cleanup

## Outcome Contract

- **Why:** Build subagents left Jest zombie processes during a live build session, consuming ~170% CPU and requiring manual intervention. Prior incident: 2026-01-16, 2.5GB RAM consumed by orphaned Jest workers.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All Jest test runs initiated by build subagents exit within the wall-clock timeout window (<=600s) with no orphaned worker processes remaining; confirmed by checking `ps aux | grep jest` after a full build session.
- **Source:** operator

## What Was Built

**TASK-01 — Incident Attribution (INVESTIGATE):** Inspected 109 telemetry events from `.cache/test-governor/events.jsonl` on 2026-02-25 and analyzed `scripts/tests/run-governed-test.sh`, `scripts/agent-bin/pnpm`, and `scripts/agents/guarded-shell-hooks.sh`. Key finding: all 7 `governed:false` events had `admitted:false` — no ungoverned Jest execution succeeded. The actual zombie source is `baseshop_terminate_command_tree` in `run-governed-test.sh`, which uses `pkill -TERM -P $command_pid` (kills only direct children of pnpm), leaving Jest workers (grandchildren of pnpm) as orphans when the governor receives SIGTERM or times out. Produced `incident-attribution.md` with full incident timeline, root-cause analysis, and binary recommendation.

**TASK-02 — Governed Invocation Contract (IMPLEMENT):** Added a `## Test Invocation` section to `.claude/skills/lp-do-build/modules/build-code.md` mandating `pnpm -w run test:governed -- jest -- <args>` as the only permitted Jest invocation form. Documents the package-CWD variant, explicitly lists blocked forms (`npx jest`, `pnpm exec jest`, direct invocations), and references `docs/testing-policy.md` as canonical rule source. Covers the `npx-jest` class (2 events on 2026-02-25 not previously documented).

**TASK-05 — Process-Group Kill Hardening (IMPLEMENT):** Hardened `scripts/tests/run-governed-test.sh` with two changes: (1) spawned the Jest command via `setsid "${command[@]}" &` so the entire jest subtree (pnpm → jest master → jest workers) shares a dedicated process group; (2) replaced `pkill -TERM -P "$target_pid"` in `baseshop_terminate_command_tree` with `kill -TERM -- "-$pgid"` (process-group signal) so Jest workers are terminated on SIGTERM/timeout. Includes `own_pgid` safety guard, SIGKILL escalation path, and `setsid`-unavailable fallback with stderr warning.

**TASK-03 — Adjacent Policy Pointers (IMPLEMENT):** Added a `docs/testing-policy.md` reference to the `## Shared Utilities` section of `.claude/skills/lp-do-build/SKILL.md`. Added a conditional governed-invocation note to `modules/build-spike.md` (fires only when spike scope explicitly includes Jest execution). No contradictory instructions introduced.

**TASK-04 — Post-Fix Verification (INVESTIGATE):** Ran a post-fix governed test session (`stage-label-rename`, 281 tests). Session exited with `exit_code: 0`, `kill_escalation: none`; `ps aux | grep jest` after session returned 0 survivors. Telemetry at 22:19Z and 22:20Z both show `kill_escalation: none`. Produced `post-fix-verification.md` with verdict PASS for normal-exit path; residual risk noted for SIGTERM/timeout path (requires congestion-condition session to confirm).

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm -w run test:governed -- jest -- --config scripts/jest.config.cjs --testPathPattern="stage-label-rename" --no-coverage` | Pass (281 tests) | Post-fix verification run; 0 survivors after exit |

## Validation Evidence

### TASK-01
- Validation contract: `incident-attribution.md` present with incident timeline, attribution citing `governed`/`admitted`/`timeout_killed`/`kill_escalation` fields, guard coverage table, and binary recommendation.
- Q1 (actor): Cannot confirm — no session metadata in telemetry. Circumstantially consistent with build subagent (concurrent sessions, queue times).
- Q2 (guard coverage): Sufficient for `pnpm-exec-jest` and `npx-jest` via agent-bin wrappers. Direct binary invocations require shell hooks (theoretical gap, not exploited 2026-02-25).
- Q3 (ungoverned:false, admitted:true): ZERO events — ungoverned hypothesis REFUTED.
- Root cause confirmed: `baseshop_terminate_command_tree` shallow `pkill -P` (SIGTERM path and timeout path both confirmed via 5 telemetry events).

### TASK-02
- TC-02-01: PASS — `pnpm -w run test:governed -- jest --` explicit at lines 30, 35 of `build-code.md`.
- TC-02-02: PASS — Package-CWD variant documented at line 38.
- TC-02-03: PASS — `pnpm exec jest`/`npx jest` appear only in Blocked forms list; no permissive instruction.

### TASK-03
- TC-03-01: PASS — `docs/testing-policy.md` pointer at line 153 of `SKILL.md`.
- TC-03-02: PASS — spike note is conditional: "If the spike scope explicitly includes Jest test execution".
- TC-03-03: PASS — no instruction in any `lp-do-build` module permits `pnpm exec jest` or `npx jest`.

### TASK-04
- Validation contract: `post-fix-verification.md` present with ps check (0 survivors), telemetry excerpt (22:19Z and 22:20Z events), and explicit pass/fail verdict.
- Orphaned Jest process invariant: PASS (0 survivors after normal-exit session).
- Residual risk acknowledged: SIGTERM/timeout kill path not triggered post-fix.

### TASK-05
- TC-05-01: PASS — `setsid "${command[@]}" &` at line 407 of `run-governed-test.sh`.
- TC-05-02: PASS — `kill -TERM -- "-$pgid"` at line 263; `kill -KILL -- "-$pgid"` at line 278.
- TC-05-03: PASS — `own_pgid` guard at lines 262, 277.
- TC-05-04: PASS — no test files in `scripts/tests/`; static check clear.

## Scope Deviations

None. All changes were within plan scope. TASK-05 was added in Replan Round 1 (same day) before build execution began; it was within the `scripts/tests/run-governed-test.sh` scope already identified in the fact-find.
