---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Infra
Workstream: Engineering
Created: 2026-02-21
Last-updated: 2026-02-21
Feature-Slug: jest-runaway-process-prevention
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/jest-runaway-process-prevention/plan.md
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID: none
---

# Jest Runaway Process Prevention Fact-Find Brief

## Scope
### Summary
Claude subagent sessions launch `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs --no-coverage` which spawns jest workers that hang indefinitely when open handles prevent graceful exit. Two such runs from a single Claude session (PID 9514, terminal s004) accumulated 1.5 GB RSS and 50+ min of combined CPU time running for 90+ minutes with no wall-clock timeout. The governed test runner's `wait "$command_pid"` blocks forever, the heartbeat keeps the test lock alive, and the cleanup trap never fires because the parent bash shell is never signalled.

### Goals
- Prevent jest processes from running longer than a configurable wall-clock timeout
- Ensure jest force-exits when open handles remain after tests complete
- Kill entire process trees (not just parent PIDs) during cleanup
- Escalate from SIGTERM to SIGKILL when processes don't respond
- Add admission timeout so the governor doesn't poll forever waiting for resources
- Detect and report orphaned jest processes proactively

### Non-goals
- Changing test content or fixing individual test open-handle leaks (separate work)
- Adding a system-wide process watchdog daemon (launchd/cron)
- Linux-specific memory pressure detection (CI already has timeout-minutes)

### Constraints & Assumptions
- Constraints:
  - Changes must be backward-compatible with existing `test:governed` invocations
  - CI mode (`CI=true`) must remain fast-path (bypasses scheduler/admission)
  - macOS `timeout` is not GNU timeout; must use portable approach or `gtimeout` fallback
- Assumptions:
  - 10-minute wall-clock timeout is sufficient for any single governed jest run locally
  - `--forceExit` is safe to enable globally (jest docs warn it can mask real cleanup issues; task seed 1 adds `--detectOpenHandles` alongside to provide diagnosis)
  - Process group isolation (via `setsid` or equivalent) is needed before tree-kill is safe; alternatively `pkill -P $pid` (kill by parent PID) avoids the PGID problem entirely
  - Governed runner commands are not piped through `tail` internally (the pipe is in the Claude shell wrapper, external to the governor)

## Evidence Audit (Current State)

### Entry Points
- `scripts/tests/run-governed-test.sh` - canonical governed test runner, the primary target
- `packages/config/jest.preset.cjs` - shared jest config factory, where `forceExit`/`testTimeout` can be set globally
- `scripts/agent-bin/pnpm` - agent proxy that routes test commands through governed runner
- `scripts/agents/guarded-shell-hooks.sh` - bash DEBUG trap catching ungoverned jest

### Key Modules / Files
- `scripts/tests/run-governed-test.sh` (358 lines) - lifecycle: lock → admission → run → heartbeat → RSS monitor → telemetry → release. **Gap: no wall-clock timeout on `wait "$command_pid"` (line ~312-324), no SIGKILL escalation, no process-tree kill in cleanup.**
- `scripts/tests/test-lock.sh` (729 lines) - lock primitive with heartbeat, stale detection (120s). Heartbeat keeps lock alive as long as governed runner is alive, even if jest is hung.
- `scripts/tests/resource-admission.sh` (401 lines) - memory pressure, RAM budget (60%), CPU slots (70%), active RSS scanning. **Gap: admission polling loop has no timeout.**
- `scripts/tests/runner-shaping.sh` (144 lines) - auto-injects `--maxWorkers=2`. Does not inject `--forceExit`.
- `packages/config/jest.preset.cjs` - shared jest config. **Gap: no `forceExit`, no `detectOpenHandles`, no `testTimeout` set.**
- `apps/brikette/jest.config.cjs` - extends preset. **Gap: no `forceExit`, no `testTimeout`.**
- `apps/reception/jest.config.cjs` - extends preset. Has `testTimeout: 10000` (only app with per-test timeout).
- `scripts/validate-changes.sh` (512 lines) - step 0 checks for orphan jest processes. Warns or fails depending on STRICT mode.
- `scripts/tests/telemetry-log.sh` (161 lines) - JSONL event logging with 20MB rotation.
- `scripts/tests/history-store.sh` (280 lines) - peak RSS history per test signature for P90 prediction.

### Patterns & Conventions Observed
- **Lock-heartbeat-cleanup triangle**: test lock heartbeat keeps lock alive; cleanup trap releases on EXIT/INT/TERM; but cleanup only fires when the *bash shell* exits, not when jest hangs - evidence: `run-governed-test.sh` lines 225-248 (cleanup), lines 260-275 (heartbeat)
- **Process group not used**: `kill "$command_pid"` kills only the immediate process, not the process group - evidence: `run-governed-test.sh` cleanup function
- **`--detectOpenHandles` widespread but `--forceExit` absent**: `--detectOpenHandles` is present in 42 package.json test scripts and 2 CI workflow files, but is NOT in the shared jest preset (`jest.preset.cjs`) or runner-shaping. `--forceExit` is not intentionally enabled anywhere (baseline snapshots show `false` default only). The governed runner injects neither flag. - evidence: `grep -r "detectOpenHandles" --include="*.json"` returns 52 matches across 42 files; `grep -r "forceExit" --include="*.cjs" --include="*.js"` returns only baseline `false` defaults
- **CI has timeout-minutes on every test job**: 10-40 min depending on scope - evidence: `.github/workflows/ci.yml`, `.github/workflows/test.yml`
- **Agent-bin proxies are comprehensive**: block ungoverned jest at pnpm/npm/npx/turbo level - evidence: `scripts/agent-bin/`

### Data & Contracts
- Types/schemas/events:
  - Telemetry JSONL schema: `{governed, policy_mode, class, sig, admitted, queued_ms, peak_rss_mb, pressure_level, workers, exit_code, overrides}`
  - Lock meta format: `version=1, token, user, host, pid, started_at, branch, cwd, note`
  - History store: JSON `{<signature>: [{peak_rss_mb, ts}]}`
- Persistence:
  - `.cache/test-governor/` - lock dir, history.json, events.jsonl
- API/contracts:
  - `BASESHOP_GOVERNED_CONTEXT=1` env var signals governed context to shell hooks
  - `BASESHOP_TEST_LOCK_STALE_SEC` (default 120) configures staleness
  - `BASESHOP_TEST_LOCK_HEARTBEAT_SEC` (default 30) configures heartbeat interval

### Dependency & Impact Map
- Upstream dependencies:
  - All Claude subagent test invocations flow through `scripts/agent-bin/pnpm` → `run-governed-test.sh`
  - `validate-changes.sh` (pre-push hook) also runs jest through the governed runner
- Downstream dependents:
  - Test lock system relied on by all concurrent test invocations
  - Telemetry events consumed by history store for admission P90 prediction
  - `validate-changes.sh` orphan check reads `ps` output
- Likely blast radius:
  - Low for timeout/tree-kill/escalation: changes are additive to existing runner
  - Medium for `forceExit` in shared preset: affects all packages globally including CI. Tree-kill approach needs PGID isolation analysis before implementation.

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest 29.7.0 via `jest-worker` processes
- Commands: `pnpm -w run test:governed -- jest -- --config=<app>/jest.config.cjs`
- CI integration: GitHub Actions with timeout-minutes per job

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Runner shaping | Unit (bash) | Not found | Runner-shaping logic is untested |
| Governed runner | Integration (bash) | Not found | Full lifecycle untested |
| Agent-bin proxies | Unit (bash) | Not found | Proxy blocking logic untested |
| validate-changes orphan check | Integration | `scripts/validate-changes.sh` | Only tests ps grep pattern |

#### Coverage Gaps
- Untested paths:
  - Wall-clock timeout behavior (does not exist yet)
  - Cleanup function's process-tree kill (does not exist yet)
  - SIGKILL escalation (does not exist yet)
  - Admission timeout (does not exist yet)
- Extinct tests: none

#### Testability Assessment
- Easy to test: `runner-shaping.sh` flag injection (pure function)
- Easy to test: `forceExit`/`testTimeout` in jest config (snapshot baseline tests already exist in `test/jest-baselines/`)
- Hard to test: wall-clock timeout in governed runner (needs a mock hung process)
- Hard to test: process-tree kill (needs real forked processes)

#### Recommended Test Approach
- Unit tests for: runner-shaping flag injection of `--forceExit`
- Integration tests for: jest baseline snapshots updated to reflect `forceExit: true`
- Manual validation for: timeout and tree-kill behavior with a deliberately hanging test

### Delivery & Channel Landscape
Not investigated: code-track infrastructure change with no external delivery channel.

### Website Upgrade Inputs
Not investigated: not a website upgrade.

### Best-Of Synthesis Matrix
Not investigated: not a website upgrade.

### Prioritized Website Upgrade Backlog Candidates
Not investigated: not a website upgrade.

### Hypothesis & Validation Landscape
Not investigated: code-track infrastructure change; validation is empirical (test runs, telemetry).

### Recent Git History (Targeted)
- `scripts/tests/` - governed runner system was built iteratively; most recent changes added RSS monitoring and admission gating. No timeout mechanism was ever added.

## Questions
### Resolved
- Q: Does macOS have GNU `timeout`?
  - A: No. macOS ships with no `timeout` command. Must use bash background-wait pattern (`cmd & wait_pid; sleep $timeout; kill`) or require `coreutils` (`gtimeout`).
  - Evidence: macOS man pages, coreutils homebrew formula
- Q: Is `--forceExit` safe to enable globally?
  - A: Jest docs warn it can mask resource leaks. However, combined with `--detectOpenHandles` (which logs what's open), it's standard practice. The alternative (hung processes) is worse.
  - Evidence: Jest documentation, per-package scripts already using `--detectOpenHandles`
- Q: Are the 12780-12788 jest workers also orphaned?
  - A: No, they were already dead by the time we investigated (parent processes gone, workers had no parent). Only the 21110/21111 and 47517/47518 batches were live orphans.

### Open (User Input Needed)
- Q: What wall-clock timeout is appropriate for local governed jest runs?
  - Why it matters: Too short = kills legitimate long test suites; too long = doesn't prevent the problem
  - Decision impacted: `BASESHOP_TEST_TIMEOUT_SEC` default value
  - Decision owner: Peter
  - Default assumption (if any) + risk: 600 seconds (10 min) — risk: some test suites may legitimately take longer, but CI caps at 10-20 min for unit tests
- Q: Should `forceExit` be in the shared preset or only in `runner-shaping.sh`?
  - Why it matters: Shared preset affects `pnpm test` in every package (including direct non-governed runs). Runner shaping only affects governed runs.
  - Decision impacted: Where to inject `--forceExit`
  - Decision owner: Peter
  - Default assumption (if any) + risk: Both — preset sets `forceExit: true` as default, runner shaping also injects `--forceExit` flag as belt-and-suspenders. Risk: minimal, `forceExit` is a safety net.

## Confidence Inputs
- Implementation: 82% — changes are in well-understood shell scripts and jest config; tree-kill feasibility requires PGID isolation analysis (setsid or pkill -P) before implementation
  - To >=90: confirm PGID behavior on macOS with backgrounded jest; verify `pkill -P` reliably catches jest workers
- Approach: 78% — the five-layer defense is comprehensive; pipe-interaction hypothesis and PGID isolation are unresolved; forceExit CI-vs-local strategy needs decision
  - To >=90: resolve pipe-interaction question; decide CI forceExit policy; validate timeout default against telemetry duration data
- Impact: 95% — directly prevents the observed failure mode (hung jest workers consuming RAM indefinitely)
- Delivery-Readiness: 90% — no external dependencies, no API changes, no migrations
- Testability: 70% — jest config changes are testable via baselines; shell script timeout/tree-kill behavior is hard to integration-test automatically

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| `forceExit` masks a real resource leak in tests | Medium | Low | Task seed 1 adds `--detectOpenHandles` alongside `--forceExit` to log leaks; fix leaks separately. Note: `--detectOpenHandles` already exists in 42 package.json files but `--forceExit` is not deployed anywhere. |
| `forceExit` in shared preset changes CI behavior | Medium | Medium | Consider keeping `forceExit: false` in CI (where jobs have `timeout-minutes`) and only enabling locally via governed runner injection. Or accept globally and rely on `detectOpenHandles` logging. |
| 10-min timeout kills a legitimate long test run | Low | Medium | Make timeout configurable via `BASESHOP_TEST_TIMEOUT_SEC`; default 600s. No telemetry data on actual run durations to calibrate — history store tracks RSS but not elapsed time. |
| Process group kill self-destructs governed runner | Medium | High | Jest likely inherits the governed runner's PGID when backgrounded. `kill -- -$pgid` would kill the runner, heartbeat, and RSS monitor. Use `pkill -P $command_pid` (kill by parent PID) instead, or isolate jest with `setsid` before backgrounding. |
| macOS `timeout` portability / PID reuse race | Medium | Low | Use bash background-wait pattern; guard with `kill -0 $pid` liveness check before sending kill to mitigate PID reuse window. |
| Pipe interaction prevents `wait` return | Medium | Medium | The original hung processes were invoked through Claude's shell wrapper which pipes through `tail`. If jest exits but the pipe buffer isn't flushed, `wait` on the pipeline may not return. Verify that the governed runner's internal `wait "$command_pid"` is on the direct PID, not a pipeline. |
| Admission timeout causes false rejection | Low | Low | Default 300s admission wait; log timeout event in telemetry for tuning |

## Planning Constraints & Notes
- Must-follow patterns:
  - All changes to governed runner must preserve existing telemetry contract
  - Lock/heartbeat lifecycle must remain correct (release on timeout too)
  - CI fast-path (`CI=true`) must not regress
- Rollout/rollback expectations:
  - Rollback: revert the script changes; jest config change is also trivially revertible
- Observability expectations:
  - Telemetry events should include `timeout: true` when a run is killed by wall-clock timeout
  - Telemetry should record `kill_escalation: sigkill` when SIGTERM fails and SIGKILL is used

## Suggested Task Seeds (Non-binding)
1. Add `forceExit: true` and `detectOpenHandles: true` to shared jest preset (`packages/config/jest.preset.cjs`). Consider whether CI should override `forceExit: false` to surface open-handle leaks — CI already has `timeout-minutes` as a safety net.
2. Add `--forceExit` injection to `runner-shaping.sh` (belt-and-suspenders for governed runs)
3. Add wall-clock timeout to `run-governed-test.sh` (background timer kills command PID after `BASESHOP_TEST_TIMEOUT_SEC`, default 600)
4. Replace single-PID kill with child-process kill in cleanup function. Prefer `pkill -P $command_pid` (kill by parent PID) over `kill -- -$pgid` (process group kill) — jest likely shares the governed runner's PGID unless isolated with `setsid`. Investigate PGID behavior during implementation.
5. Add SIGTERM → wait 5s → SIGKILL escalation in cleanup function
6. Add admission polling timeout (default 300s) to `run-governed-test.sh`
7. Update jest baseline snapshots to reflect new `forceExit`/`detectOpenHandles` defaults
8. Add `timeout_killed` and `kill_escalation` fields to telemetry schema
9. Update `AGENTS.md` and `docs/testing-policy.md` with new timeout behavior

## Execution Routing Packet
- Primary execution skill:
  - lp-do-build
- Supporting skills:
  - none
- Deliverable acceptance package:
  - Jest baseline snapshots pass with updated defaults
  - Governed runner timeout verified manually with a deliberately hanging test
  - Telemetry events include new fields
  - Existing tests still pass under governed runner
- Post-delivery measurement plan:
  - Monitor telemetry for `timeout_killed` events over next 2 weeks
  - Check for orphan jest processes in `validate-changes.sh` output

## Evidence Gap Review
### Gaps Addressed
- All key scripts read in full: `run-governed-test.sh`, `test-lock.sh`, `resource-admission.sh`, `runner-shaping.sh`, `validate-changes.sh`
- All jest configs inspected for `forceExit`/`detectOpenHandles`/`testTimeout`
- Agent-bin proxies verified as comprehensive guard layer
- CI timeout coverage confirmed across all workflows
- Process tree of the actual hung processes fully traced to root cause
- [Post-critique] `detectOpenHandles` claim corrected — `--detectOpenHandles` is present in 42 package.json test scripts and 2 CI workflows; `--forceExit` is not intentionally enabled anywhere. Neither flag is in the shared jest preset or runner-shaping.
- [Post-critique] PGID isolation risk for tree-kill added to risks and task seed 4
- [Post-critique] Pipe-interaction hypothesis added to risks
- [Post-critique] CI vs local `forceExit` strategy question surfaced

### Confidence Adjustments
- Testability reduced from 80% to 70% due to difficulty of integration-testing shell timeout/tree-kill behavior
- [Post-critique] Implementation reduced from 90% to 82% due to unresolved PGID isolation question
- [Post-critique] Approach reduced from 85% to 78% due to pipe-interaction hypothesis and CI forceExit strategy question

### Remaining Assumptions
- 600s default timeout is appropriate (configurable, so low risk)
- `forceExit` does not cause test result inaccuracy (it doesn't — only affects process lifecycle after tests complete)
- Bash background-wait pattern is sufficient for portable timeout with PID liveness guard (no GNU coreutils dependency)
- `pkill -P` reliably catches jest child workers on macOS (to be verified during implementation)
- Governed runner's internal `wait` is on a direct PID, not a pipeline (to be verified during implementation)

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None (open questions have safe defaults)
- Recommended next step:
  - `/lp-do-plan` to create implementation tasks from the 9 task seeds
