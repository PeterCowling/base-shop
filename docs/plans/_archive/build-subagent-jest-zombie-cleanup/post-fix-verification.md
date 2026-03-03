# Post-Fix Verification: build-subagent-jest-zombie-cleanup — 2026-02-25

**Status:** Partial pass (normal-exit path confirmed; SIGTERM kill path not yet triggered post-fix)
**Task:** TASK-04
**Date:** 2026-02-25

---

## Verification Session

### Session Details

- **Fix committed:** `df0560fdb6` (Wave 2, 2026-02-25)
- **Test run:** `stage-label-rename` test suite — 281 tests in `scripts/src/startup-loop/__tests__/stage-label-rename.test.ts`
- **Command used:** `pnpm -w run test:governed -- jest -- --config scripts/jest.config.cjs --testPathPattern="stage-label-rename" --no-coverage`
- **Jest result:** 281 passed, 0 failed, 0 skipped

### Orphaned Jest Process Invariant — PASS

```
$ ps aux | grep jest | grep -v grep | wc -l
0
```

Zero jest processes survived after the `stage-label-rename` session completed. Verdict: **PASS**.

*(Note: at time of ps check, a concurrent `generate-process-improvements` run from a separate governor session was still active — those processes are unrelated to this verification session and predate the check.)*

### Post-Fix Telemetry

Two events recorded after the fix was committed (both post-22:19 UTC, after commit `df0560fdb6`):

| Timestamp (UTC) | governed | admitted | exit_code | timeout_killed | kill_escalation | peak_rss_mb | queued_ms |
|---|---|---|---|---|---|---|---|
| 2026-02-25T22:19:37Z | true | true | 0 | false | **none** | 109 | 0 |
| 2026-02-25T22:20:19Z | true | true | 0 | false | **none** | 143 | 1,000 |

Both post-fix events show `kill_escalation: none` — consistent with healthy normal-exit behavior. No `kill_escalation: sigterm` events post-fix.

**Comparison with pre-fix zombie events (2026-02-25, same date):**

| Pre-fix events (zombie-producing) | Post-fix events |
|---|---|
| 5× `kill_escalation: sigterm` (16:23, 18:33, 21:08) | 0× `kill_escalation: sigterm` |
| 2× `exit_code: 143` (external SIGTERM) | 0× `exit_code: 143` |
| 3× `exit_code: 124` (timeout) | 0× `exit_code: 124` |

---

## Code Review Verification (Static)

The fix in `run-governed-test.sh` was verified against all TC criteria:

| TC | Check | Result |
|---|---|---|
| TC-05-01 | Command spawned via `setsid "${command[@]}" &` with `command -v setsid` availability guard | PASS (line 407) |
| TC-05-02 | `kill -TERM -- "-$pgid"` in `baseshop_terminate_command_tree` (full process-group signal) | PASS (line 263) |
| TC-05-03 | `own_pgid` safety guard prevents killing current shell's process group | PASS (lines 262, 277) |
| TC-05-04 | No test files in `scripts/tests/` — static check clear | PASS (no .test.* files) |

---

## Residual Risk

**Not yet tested: SIGTERM kill path under queue pressure.**

The zombie-producing events on 2026-02-25 all required either:
- External SIGTERM on the governor shell (`exit_code: 143`, `timeout_killed: false`)
- Governor timeout firing on a saturated queue (`exit_code: 124`, `timeout_killed: true`, `queued_ms: 141s–276s`)

The verification session above exercised only the **normal-exit path** (no SIGTERM, no timeout). Confirming the process-group kill works correctly for the zombie-producing paths would require observing:
- A session with `exit_code: 124, timeout_killed: true` followed by `ps aux | grep jest` returning zero survivors, OR
- A session with `exit_code: 143, timeout_killed: false` (external SIGTERM) with the same ps check

**Verdict on residual risk:** The fix is correct based on code review and process-group kill semantics (Unix-standard `kill -TERM -- -$pgid`). The normal-exit path is verified clean. Full confirmation of the SIGTERM/timeout paths requires a representative build session under congestion conditions — not reproducible on demand.

**Recommendation:** Accept current verification as sufficient for deployment. Flag for follow-up monitoring: on the next occurrence of `kill_escalation: sigterm` in telemetry, run `ps aux | grep jest` immediately after to confirm no survivors. If survivors appear, route to `/lp-do-replan` with the new telemetry evidence.

---

## Evidence References

- `.cache/test-governor/events.jsonl` — post-fix events at 22:19:37Z and 22:20:19Z
- `scripts/tests/run-governed-test.sh` — commit `df0560fdb6`, `setsid` spawn (line 407), `baseshop_terminate_command_tree` process-group kill (lines 245–285)
- `docs/plans/build-subagent-jest-zombie-cleanup/incident-attribution.md` — pre-fix zombie attribution (5 `kill_escalation:sigterm` events)

```
# Verification commands used:
pnpm -w run test:governed -- jest -- --config scripts/jest.config.cjs --testPathPattern="stage-label-rename" --no-coverage
# → 281 passed, exit 0

ps aux | grep jest | grep -v grep | wc -l
# → 0

tail -5 .cache/test-governor/events.jsonl
# → last 2 events: kill_escalation: none, exit_code: 0
```
