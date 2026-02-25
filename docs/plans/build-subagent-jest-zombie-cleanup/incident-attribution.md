# Incident Attribution: Jest Zombie Processes — 2026-02-25

**Status:** Complete
**Task:** TASK-01
**Confidence:** 80% (actor identity unresolvable from telemetry; all other questions answered definitively)
**Date:** 2026-02-25

---

## Summary

The 2026-02-25 zombie incident was caused by the **governed runner's shallow kill mechanism**, not by ungoverned Jest invocations. All ungoverned invocation attempts that day were blocked before execution. The zombie source is `baseshop_terminate_command_tree` in `run-governed-test.sh`, which uses `pkill -TERM -P $target_pid` — killing only direct children of the pnpm process, leaving Jest workers (grandchildren) as orphans.

**Binary recommendation:** Proceed with both TASK-05 (script hardening — primary fix) and TASK-02 (doc enforcement — defense-in-depth). Do not scope TASK-02 as the primary zombie fix.

---

## Incident Timeline

| Timestamp (UTC) | Event | governed | admitted | exit_code | timeout_killed | kill_escalation | queued_ms |
|---|---|---|---|---|---|---|---|
| 16:23:09 | Governor shell received external SIGTERM; cleanup trap fired | true | true | 143 | false | sigterm | 2,000 |
| 16:23:56 | Concurrent governor session also killed externally | true | true | 143 | false | sigterm | 126,000 |
| 18:33:02 | Governed runner's own 600s timeout fired | true | true | 124 | true | sigterm | 0 |
| 21:05:43 | Admission timeout: waited 304s for admission gate; exit without run | true | false | 124 | false | none | 304,000 |
| 21:08:40 | Two concurrent governed runs timed out simultaneously | true | true | 124 | true | sigterm | 141,000 |
| 21:08:40 | (concurrent, second run) | true | true | 124 | true | sigterm | 276,000 |

**Total `kill_escalation:sigterm` events:** 5 (all governed:true, admitted:true)
**Total `governed:false` events:** 7 (all admitted:false — zero executed)

---

## Question 1: Actor Attribution

**Question:** Did the 2026-02-25 zombie incident originate from a build subagent flow, a human/operator run, or mixed sources?

**Finding:** **Cannot confirm definitively.** Telemetry events do not include session identifiers, actor IDs, or PID-of-caller fields. The following circumstantial evidence is consistent with build subagent activity:

- Two concurrent governed sessions at 16:23 with `queued_ms:126000` (2.1 min) — parallel subagent workload pattern
- All governed invocations use the `governed-jest` class, meaning they were invoked via `pnpm -w run test:governed -- jest -- <args>` (the governed entrypoint), consistent with `build-code.md` executor guidance
- The 21:08 concurrent runs with queue times of 141s and 276s are consistent with multiple subagent sessions queuing behind each other

The 16:23 events (`exit_code:143`, `timeout_killed:false`) indicate the governor scripts received **external SIGTERM** — i.e., they were killed by their parent process (likely the operator closing the session or the agent orchestrator terminating subagents), not by the governor's own timeout watcher.

**Attribution verdict:** Likely build subagent flow, but not provable from available telemetry. Actor identity cannot be determined without session metadata not currently logged.

**What would make this >=90%:** Add a `session_id` or `caller_pid` field to the governed telemetry event schema so future incidents can be correlated to actor.

---

## Question 2: Non-Interactive Guard Coverage

**Question:** Are non-interactive build agent shells guaranteed to run the guarded command wrappers/hooks for Jest-blocking behavior?

**Finding:** Two independent guard layers exist; coverage is **sufficient for the common cases** but **partial for direct binary invocations**.

### Layer 1: `scripts/agent-bin/` command wrappers (non-interactive safe)

| Wrapper | Blocks | Mechanism | Works in non-interactive shells |
|---|---|---|---|
| `scripts/agent-bin/pnpm` | `pnpm exec jest` → `pnpm-exec-jest` class | PATH shim, command-level check | **Yes** — no shell hooks needed |
| `scripts/agent-bin/npx` | `npx jest` → `npx-jest` class | PATH shim, command-level check | **Yes** — confirmed by 2 blocked `npx-jest` events at 16:57 and 18:17 |

These wrappers are **not hook-dependent**. They fire as long as `scripts/agent-bin` is early in `PATH`. Both forms were blocked on 2026-02-25.

### Layer 2: `scripts/agents/guarded-shell-hooks.sh` (interactive/sourced only)

The shell debug hook (`trap __baseshop_guard_debug_hook DEBUG` for bash, `preexec` for zsh) is installed only when:
- `BASESHOP_GUARD_ENABLE_HOOKS=1` is set AND `baseshop_guard_install_hooks` is called

This covers invocation forms the agent-bin wrappers do not intercept:
- `./node_modules/.bin/jest` (classified as `local-bin-jest`)
- `node node_modules/jest/bin/jest.js` (classified as `node-jest-bin`)

**Non-interactive coverage gap:** If a build agent shell does NOT source `guarded-shell-hooks.sh` (i.e., `BASESHOP_GUARD_ENABLE_HOOKS!=1`), direct binary invocations (`./node_modules/.bin/jest`) would **not** be blocked. This is a theoretical gap; no events of class `local-bin-jest` or `node-jest-bin` appear in telemetry on 2026-02-25.

**Coverage verdict:** Sufficient for `pnpm exec jest` and `npx jest` forms (agent-bin wrappers cover both, non-interactive contexts). Partial for direct binary invocations (requires shell hook sourcing). No evidence that the gap was exploited on 2026-02-25.

---

## Question 3: Ungoverned Path Check (`governed:false, admitted:true`)

**Question:** Do any `governed:false` events on 2026-02-25 also show `admitted:true`?

**Finding:** **None.** Zero `governed:false, admitted:true` events on 2026-02-25.

Full inventory of `governed:false` events:

| Timestamp | Class | admitted | Notes |
|---|---|---|---|
| 11:26:35 | pnpm-exec-jest | false | Blocked by `scripts/agent-bin/pnpm` |
| 12:47:23 | pnpm-exec-jest | false | Blocked by `scripts/agent-bin/pnpm` |
| 16:57:02 | npx-jest | false | Blocked by `scripts/agent-bin/npx` |
| 18:17:59 | npx-jest | false | Blocked by `scripts/agent-bin/npx` |
| 20:18:43 | pnpm-exec-jest | false | Blocked by `scripts/agent-bin/pnpm` |
| 20:24:02 | pnpm-exec-jest | false | Blocked by `scripts/agent-bin/pnpm` |
| 21:06:32 | pnpm-exec-jest | false | Blocked by `scripts/agent-bin/pnpm` |

**Ungoverned-path hypothesis verdict: REFUTED.** No ungoverned invocation executed. The documentation gap in `build-code.md` did not result in a live zombie-producing test run on 2026-02-25.

Note: `npx-jest` class (16:57, 18:17) was not previously identified in planning assumptions. Two build agents attempted `npx jest` — a form not explicitly referenced in `build-code.md`. Both were blocked. TASK-02 should cover this form in its invocation guidance.

---

## Root Cause: Governed Runner Shallow Kill

The actual zombie source is `baseshop_terminate_command_tree` in `scripts/tests/run-governed-test.sh` (lines 245–267):

```bash
pkill -TERM -P "$target_pid" 2>/dev/null || true   # kills only direct children of pnpm
kill -TERM "$target_pid" 2>/dev/null || true         # kills pnpm itself
```

**Process tree when Jest runs:**
```
run-governed-test.sh (governor)
  └─ pnpm (command_pid = target_pid)
       └─ jest master (direct child of pnpm — killed by pkill -P)
            ├─ jest worker 1 (grandchild — NOT killed by pkill -P)
            └─ jest worker 2 (grandchild — NOT killed by pkill -P)
```

When the governor calls `baseshop_terminate_command_tree`:
1. `pkill -TERM -P pnpm_pid` → kills jest master
2. `kill -TERM pnpm_pid` → kills pnpm
3. Jest workers (grandchildren) are now **orphaned** — neither pnpm nor jest master is alive to clean them up

This mechanism fires in two paths:
- **External SIGTERM** (16:23 events, `exit_code:143`, `timeout_killed:false`): governor receives SIGTERM from its parent; `trap cleanup EXIT INT TERM` fires; `cleanup()` calls `baseshop_terminate_command_tree`
- **Timeout kill** (18:33, 21:08 events, `exit_code:124`, `timeout_killed:true`): governor's timeout watcher loop calls `baseshop_terminate_command_tree` directly

Both paths produce orphaned Jest workers via the same shallow-kill function.

---

## Guard Coverage Determination

| Invocation form | Blocked in non-interactive shell | Mechanism |
|---|---|---|
| `pnpm -w run test:governed -- jest -- <args>` | N/A — this IS the governed path | Proceeds through governor |
| `pnpm exec jest` | **Yes** | `scripts/agent-bin/pnpm` (PATH shim) |
| `npx jest` | **Yes** | `scripts/agent-bin/npx` (PATH shim) |
| `./node_modules/.bin/jest` | Requires shell hooks | `guarded-shell-hooks.sh` (only if sourced) |
| `node node_modules/.bin/jest.js` | Requires shell hooks | `guarded-shell-hooks.sh` (only if sourced) |

**Verdict:** Coverage is sufficient for agent-bin wrappers. Shell-hook-dependent forms are a theoretical gap not exploited on 2026-02-25.

---

## Recommendation

**Primary fix:** Proceed with **TASK-05** — harden `baseshop_terminate_command_tree` in `run-governed-test.sh` with process-group kill (spawn command via `setsid`; kill via `kill -TERM -- -$pgid`). This is the only mechanism that closes the observed zombie path.

**Defense-in-depth:** Proceed with **TASK-02** — add explicit governed invocation guidance to `build-code.md`. Include both `pnpm -w run test:governed` form and a note that `npx jest` and `pnpm exec jest` are blocked by the guard. The `npx-jest` form (not previously documented) should be explicitly called out.

**Optional future improvement (out of scope for this plan):** Add `session_id` or `caller_pid` to telemetry event schema to enable actor attribution in future incidents.

---

## Evidence References

- `.cache/test-governor/events.jsonl` — primary telemetry source; 109 events on 2026-02-25
- `scripts/tests/run-governed-test.sh` — `baseshop_terminate_command_tree` function (lines 245–267) and command spawn site (`"${command[@]}" &`, line 385)
- `scripts/agent-bin/pnpm` — `pnpm exec jest` guard (lines 209–238)
- `scripts/agents/guarded-shell-hooks.sh` — shell hook guard for direct binary invocations

```
# Telemetry verification commands used:
grep -c "2026-02-25" .cache/test-governor/events.jsonl
# → 109

grep "2026-02-25" .cache/test-governor/events.jsonl | grep '"governed":false'
# → 7 events, all admitted:false

grep "2026-02-25" .cache/test-governor/events.jsonl | grep '"kill_escalation":"sigterm"'
# → 5 events: 16:23×2, 18:33, 21:08×2

grep "2026-02-25" .cache/test-governor/events.jsonl | grep '"governed":false' | grep '"admitted":true'
# → 0 events
```
