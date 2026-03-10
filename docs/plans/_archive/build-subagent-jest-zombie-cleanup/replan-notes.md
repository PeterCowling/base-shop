---
Replan-round: 1
Created: 2026-02-25
Last-updated: 2026-02-25
---

# Replan Notes: build-subagent-jest-zombie-cleanup

## Round 1 — 2026-02-25

### Trigger

`/lp-do-replan` invoked following Round 4 critique (issue 4-01 Critical: primary zombie hypothesis contradicted by telemetry; issue 4-04 Moderate: TASK-02 Impact confidence over-stated pending attribution).

### Evidence Gathered

**Telemetry summary (2026-02-25, `.cache/test-governor/events.jsonl`):**

- Total events: 109
- `governed:false` events: 7, all `admitted:false` — zero ungoverned executions succeeded
  - `pnpm-exec-jest` class: 5 events (11:26, 12:47, 20:18, 20:24, 21:06)
  - `npx-jest` class: 2 events (16:57, 18:17) — new class not previously identified in plan
- `kill_escalation:sigterm` events: 5
  - 16:23:09: `timeout_killed:false, exit_code:143, queued_ms:2000` — external SIGTERM received by governor; cleanup trap fires
  - 16:23:56: `timeout_killed:false, exit_code:143, queued_ms:126000` — concurrent session, also killed externally; waited 2.1 min
  - 18:33:02: `timeout_killed:true, exit_code:124, peak_rss_mb:146` — true 600s timeout kill
  - 21:08:40: `timeout_killed:true, exit_code:124, queued_ms:141000, peak_rss_mb:143` — concurrent, timeout
  - 21:08:40: `timeout_killed:true, exit_code:124, queued_ms:276000, peak_rss_mb:149` — concurrent, timeout, 4.6 min queue
- Additional admission-timeout event: 21:05:43 (`governed:true, admitted:false, queued_ms:304000, exit_code:124`) — queue saturation, separate failure mode from zombie issue

**Governor script analysis (`scripts/tests/run-governed-test.sh`):**

- `baseshop_terminate_command_tree` (line 245-267) uses `pkill -TERM -P "$target_pid"` — kills only DIRECT children of command_pid
- Command spawned as: `"${command[@]}" &` where command = `pnpm exec jest`; command_pid = pnpm PID
- Process tree during test run: pnpm (command_pid) → jest master → jest workers (grandchildren of pnpm)
- `pkill -P pnpm_pid` sends SIGTERM to jest master only; jest workers (grandchildren) are NOT in scope
- When jest master exits after SIGTERM, jest workers become orphaned — no parent to clean them up
- This shallow-kill mechanism is the zombie creation path for BOTH:
  1. External SIGTERM (cleanup trap fires when governor receives SIGTERM): 16:23 events
  2. Timeout kill (watcher loop fires `baseshop_terminate_command_tree`): 18:33, 21:08 events

### Confidence Changes

**TASK-02** (Add governed Jest invocation contract to `build-code.md`):

- Impact: 85% → 75%
- Reason: telemetry confirms ungoverned path was never executed (all `admitted:false`); zombie source is `kill_escalation:sigterm` in governed runner, not ungoverned invocations; doc change is valid defense-in-depth but does not address the observed incident mechanism
- Note: also covers `npx-jest` invocation form discovered in telemetry (16:57, 18:17 events)
- New min: min(90, 85, 75) = 75%
- Proceeds below 80% IMPLEMENT threshold because: doc-only with zero breakage risk; TASK-01 is required precursor for impact validation; no execution confidence gap

### Topology Changes

**TASK-05 added:** IMPLEMENT — Harden `baseshop_terminate_command_tree` with process-group kill
- Target: `scripts/tests/run-governed-test.sh`, function `baseshop_terminate_command_tree` (line 245-267) and command spawn site (`"${command[@]}" &`)
- Fix approach: spawn command via `setsid` (new process group, command_pid becomes group leader), then terminate via `kill -TERM -- -$pgid` to cover full subtree; guard against pgid matching current shell
- Confidence: 80% (min(85, 80, 80))
- Depends on: TASK-01 (formal confirmation before execute)
- Blocks: TASK-04

**TASK-01 Blocks:** TASK-02 → TASK-02, TASK-05

**TASK-04 Depends on:** TASK-02 → TASK-02, TASK-05

**Parallelism:** Wave 2 now runs TASK-02 + TASK-05 in parallel (both gated on TASK-01, independent of each other)

### Open Issues Resolved

- **4-04** (TASK-02 Impact confidence of 85% over-stated): Resolved. Impact reduced to 75% with telemetry evidence. See confidence changes above.

### Remaining Open Issues

None from prior rounds. TASK-05 itself is new and carries no prior open issues.
