---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: BOS
Workstream: Engineering
Created: 2026-02-25
Last-updated: 2026-02-25
Feature-Slug: build-subagent-jest-zombie-cleanup
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/build-subagent-jest-zombie-cleanup/plan.md
Trigger-Source: operator_idea
Trigger-Why: Four Jest zombie processes (PIDs 4727, 84177, 90946, 13302) accumulated during a build session, consuming ~170% aggregate CPU and requiring manual kill. Root cause attributed to build subagents spawning Jest runs without ensuring process cleanup.
Trigger-Intended-Outcome: type: operational | statement: Eliminate Jest zombie processes produced by build subagents by updating skill instructions and/or shell wrapper so every subagent-initiated Jest run exits cleanly when complete. | source: operator
---

# Build Subagent Jest Zombie Cleanup — Fact-Find Brief

## Scope

### Summary

Build subagents (running via `/lp-do-build`) spawn Jest test runs as part of TDD validation cycles. On 2026-02-25, four Jest processes became zombies after the spawning subagents completed, accumulating ~170% aggregate CPU and requiring manual `kill`. The hypothesis is that subagents are running Jest directly (via `pnpm --filter <pkg> test`) rather than through the governed wrapper, bypassing the wrapper's process-tree cleanup on exit. The fix surface is: updating skill documentation (SKILL.md, build-code.md) and potentially the governed wrapper itself to ensure all subagent-initiated Jest runs exit cleanly.

### Goals

- Confirm the exact code path by which build subagents invoke Jest (direct vs governed wrapper)
- Determine whether the governed wrapper's `trap cleanup EXIT INT TERM` is sufficient when the _parent agent process_ exits, leaving Jest running in the background
- Identify which skill docs and shell scripts need changes
- Produce a planning-ready brief that scopes the minimum-change fix

### Non-goals

- Changing the Jest test suite itself or its coverage configuration
- Modifying how CI runs Jest (CI runs in `CI=true` governed compatibility mode)
- Building new process monitoring infrastructure (the governed wrapper already has telemetry)

### Constraints & Assumptions

- Constraints:
  - Must not change the existing `--forceExit` injection in `runner-shaping.sh` (already correct)
  - Must not alter the shared Jest preset `forceExit: true` (already set in `packages/config/jest.preset.cjs`)
  - Fix must work for the Claude Code (API-driven, non-interactive) agent execution environment
- Assumptions:
  - The zombie processes arose because build subagents ran Jest via an ungoverned path (direct `pnpm exec jest` or `pnpm --filter <pkg> test`) rather than via `pnpm -w run test:governed`
  - The subagent process group ended before Jest workers finished; because the workers were not children of the governed wrapper's `trap cleanup EXIT INT TERM`, they were not killed

## Outcome Contract

- **Why:** Build subagents left Jest zombie processes during a live build session, consuming ~170% CPU and requiring manual intervention. This is a known recurring risk (prior incident: 2026-01-16, 2.5GB RAM consumed by orphaned Jest workers).
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All Jest test runs initiated by build subagents exit within the wall-clock timeout window (≤600s) with no orphaned worker processes remaining; confirmed by checking `ps aux | grep jest` after a full build session.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `/Users/petercowling/base-shop/scripts/tests/run-governed-test.sh` — canonical governed test runner for agent-initiated runs (including package-CWD variants); installs `trap cleanup EXIT INT TERM`; calls `baseshop_terminate_command_tree` on exit
- `/Users/petercowling/base-shop/scripts/tests/runner-shaping.sh` — injects `--forceExit` automatically for `jest` and `changed` intents when not already present
- `/Users/petercowling/base-shop/.claude/skills/lp-do-build/modules/build-code.md` — the executor module invoked by build subagents for IMPLEMENT + code/mixed tasks; **contains no mention of how to run tests or which test command to use** — this is the primary gap

### Key Modules / Files

- `/Users/petercowling/base-shop/.claude/skills/lp-do-build/modules/build-code.md` (23 lines) — only mentions "Run required validations (typecheck/lint/tests per task/repo policy)" with no specific command
- `/Users/petercowling/base-shop/.claude/skills/lp-do-build/SKILL.md` — routes IMPLEMENT + code/mixed to `build-code.md`; no test invocation guidance
- `/Users/petercowling/base-shop/AGENTS.md` lines 95–109 — Testing Rules require targeted scope and orphan checks, and point to `docs/testing-policy.md`; it does **not** explicitly spell out the `test:governed` command
- `/Users/petercowling/base-shop/docs/testing-policy.md` — comprehensive; states the governed runner is canonical; documents cleanup semantics; Rule 1 prohibits ungoverned Jest; Rule 4 requires orphan check before starting any test run
- `/Users/petercowling/base-shop/packages/config/jest.preset.cjs` line 336 — `forceExit: true` in shared preset (applies when Jest itself loads the config)
- `/Users/petercowling/base-shop/scripts/tests/runner-shaping.sh` lines 92–97 — `has_force_exit` check; injects `--forceExit` when not present for `jest`/`changed` intents

### Patterns & Conventions Observed

- `--forceExit` is injected at two independent levels:
  1. Shared preset (`packages/config/jest.preset.cjs`): `forceExit: true` — applies when config is loaded
  2. Governed wrapper (`runner-shaping.sh`): injects CLI `--forceExit` if not already present
- The governed wrapper installs a `trap cleanup EXIT INT TERM` that calls `baseshop_terminate_command_tree` — evidence: `run-governed-test.sh` lines 245–295
- `baseshop_terminate_command_tree` sends `SIGTERM` to the process tree, waits 5s, then escalates to `SIGKILL` — evidence: `run-governed-test.sh` `baseshop_terminate_command_tree` function
- The `build-code.md` executor says "Run required validations (typecheck/lint/tests per task/repo policy)" but **delegates test command selection to the agent**, which may choose an ungoverned path
- `docs/testing-policy.md` mandates governed test entrypoints; `AGENTS.md` links to that policy but does not restate the command

### Data & Contracts

- Types/schemas/events:
  - Governed test telemetry at `.cache/test-governor/events.jsonl` — fields include `timeout_killed` and `kill_escalation`
  - Zombie process diagnosis: `ps aux | grep jest | grep -v grep`
- Persistence:
  - Test lock state: `.cache/test-governor/test-lock`
- API/contracts:
  - `pnpm -w run test:governed -- jest -- <args>` — canonical governed invocation
  - `bash ../../scripts/tests/run-governed-test.sh -- jest -- --config ./jest.config.cjs` — package-CWD variant (see testing-policy.md Rule 1)

### Dependency & Impact Map

- Upstream dependencies:
  - `lp-do-build` SKILL.md → `build-code.md` → agent decides test command
  - `AGENTS.md` Testing Rules — global policy context that is not restated inside `build-code.md`
  - `docs/testing-policy.md` — explicit command policy source that is not referenced directly inside `build-code.md`
- Downstream dependents:
  - Any build session where a code task requires test validation
  - `ops-ship` SKILL.md already references checking for orphaned test processes (`ps aux | grep jest | grep -v grep`) as a pre-check
- Likely blast radius:
  - `build-code.md` — needs explicit governed test command mandate
  - `lp-do-build/SKILL.md` — may need a shared utilities reference or a testing-rules pointer
  - `AGENTS.md` Testing Rules — may benefit from a backlink to `build-code.md` for reinforcement (low priority)

### Delivery & Channel Landscape

- Audience/recipient: Build subagents (Claude Code, Codex) executing IMPLEMENT + code tasks; the deliverables are repo file edits (skill docs), not user-facing content
- Channel constraints: Changes are to `.claude/skills/` files and optionally a shell script; these are code-track deliverables routed via `build-code.md` executor with TC contracts, not VC contracts
- Existing templates/assets: `docs/plans/_templates/fact-find-planning.md` used for this artifact
- Approvals/owners: Operator (sole reviewer); no formal approval gate
- Compliance constraints: None beyond repo invariants (no tests to break, no schema changes)
- Measurement hooks: Post-fix, verify with `ps aux | grep jest | grep -v grep` after a build session; governed telemetry `kill_escalation` field should remain `none` for normal runs

### Hypothesis & Validation Landscape

#### Key Hypotheses

| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | Build subagents run Jest via ungoverned path (e.g. `pnpm --filter <pkg> test` or `pnpm exec jest`) rather than via `pnpm -w run test:governed` | Code path in build executor; session logs | Low (check next build session) | 1 session |
| H2 | Adding an explicit governed-runner mandate in `build-code.md` materially reduces ungoverned invocations in build-subagent flows | H1 confirmed | Low (update skill doc, observe next session) | 1 session |
| H3 | `--forceExit` alone (already in preset) is insufficient when the subagent process exits before Jest worker processes complete; the governed wrapper's `trap` is required for process-tree cleanup | Understanding of process group semantics | Medium (reproduce zombie condition) | 1 session |

#### Existing Signal Coverage

| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | `build-code.md` contains no test command guidance, leaving command selection to the agent; explicit governed command policy is in `docs/testing-policy.md` (not in executor module text) | Code inspection | High — structural gap is confirmed |
| H2 | Pattern: `ops-ship` SKILL.md references orphan check; adding equivalent to `build-code.md` follows established pattern | Code inspection | High |
| H3 | `--forceExit` in Jest config forces Jest to exit even with open handles; the governed wrapper's `trap` handles cases where the runner is still alive when the parent exits | Code inspection | Medium — exact failure mode (background vs foreground) unclear without session log |

#### Recommended Validation Approach

- Quick probes:
  - Review prior build session to see if any test command appears in subagent output without `test:governed` prefix (session log audit)
  - Run `ps aux | grep jest | grep -v grep` immediately after next build session to count survivors
- Structured tests:
  - After implementing fix: run a code IMPLEMENT task and confirm Jest exits cleanly (no zombie)
- Deferred validation:
  - Governed telemetry `kill_escalation` field over 5 build sessions — expect `none` for healthy runs

### Test Landscape

#### Test Infrastructure

- Frameworks:
  - Jest (governed via `scripts/tests/run-governed-test.sh` and `test:governed` intent routing)
- Commands:
  - Canonical: `pnpm -w run test:governed -- jest -- <args>`
  - Package-CWD variant: `bash ../../scripts/tests/run-governed-test.sh -- jest -- --config ./jest.config.cjs`
- CI integration:
  - `CI=true` uses governed compatibility mode (shaping stays on; scheduler/admission bypassed)

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Governed runner cleanup + kill escalation | Contract/behavioral shell path | `scripts/tests/run-governed-test.sh` | Cleanup trap and process-tree termination implemented |
| Argument shaping (`--maxWorkers`, `--forceExit`) | Shell argument policy | `scripts/tests/runner-shaping.sh` | Injects worker/force-exit defaults when omitted |
| Build executor command selection | Skill-doc behavior contract | `.claude/skills/lp-do-build/modules/build-code.md` | Gap: no explicit governed command mandate |

#### Coverage Gaps

- Untested paths:
  - Build subagent instruction path currently permits implicit/agent-selected test command choice in `build-code.md`
- Extinct tests:
  - None identified in this fact-find scope

#### Testability Assessment

- Easy to test:
  - Verify no residual Jest processes immediately after a build task (`ps aux | grep jest | grep -v grep`)
  - Verify governed telemetry emits expected `kill_escalation` values for normal runs
- Hard to test:
  - Attribution of historical zombie incidents when session logs are incomplete
- Test seams needed:
  - Deterministic linkage between build-subagent task IDs and governed test telemetry entries

#### Recommended Test Approach

- Unit tests for:
  - N/A (documentation-only change surface)
- Integration tests for:
  - One real `/lp-do-build` code task that invokes targeted Jest via the governed path
- E2E tests for:
  - N/A in this fix scope
- Contract tests for:
  - Post-build invariant: no orphaned Jest processes after task completion

## Questions

### Resolved

- Q: Does the shared Jest preset already enforce `forceExit`?
  - A: Yes. `packages/config/jest.preset.cjs` line 336 sets `forceExit: true`. The governed runner also injects `--forceExit` via `runner-shaping.sh` as a belt-and-suspenders measure.
  - Evidence: `/Users/petercowling/base-shop/packages/config/jest.preset.cjs` line 336

- Q: Does the governed wrapper kill child processes when it exits?
  - A: Yes. `run-governed-test.sh` installs `trap cleanup EXIT INT TERM` and `cleanup()` calls `baseshop_terminate_command_tree` which sends `SIGTERM` to `pkill -P $command_pid` then waits 5s and escalates to `SIGKILL`. This is only effective if the governed wrapper is the process running when the cleanup signal arrives.
  - Evidence: `/Users/petercowling/base-shop/scripts/tests/run-governed-test.sh` cleanup function

- Q: Is the governed wrapper mandated in `build-code.md`?
  - A: No. `build-code.md` only says "Run required validations (typecheck/lint/tests per task/repo policy)" with no specific command reference. This is the primary documentation gap.
  - Evidence: `/Users/petercowling/base-shop/.claude/skills/lp-do-build/modules/build-code.md` (full file, 23 lines)

- Q: Does `AGENTS.md` itself mandate the governed runner command?
  - A: No. It mandates targeted tests, orphan checks, and links the full policy; the explicit governed-runner command contract is in `docs/testing-policy.md`.
  - Evidence: `/Users/petercowling/base-shop/AGENTS.md` lines 95–109; `/Users/petercowling/base-shop/docs/testing-policy.md` Rule 1

- Q: Is the fix better placed in `build-code.md` or in `SKILL.md`?
  - A: Both. `build-code.md` should get the explicit governed test command mandate (as the point-of-use executor). `SKILL.md` shared utilities section should get a pointer to the testing policy. Belt-and-suspenders approach mirrors how `ops-ship` handles the orphan check.
  - Evidence: `ops-ship` SKILL.md already contains `ps aux | grep jest | grep -v grep` as a pre-check; `build-code.md` has no equivalent

- Q: Should `--forceExit` be added as a literal flag to the canonical command in the skill doc?
  - A: No — it is already injected by `runner-shaping.sh` and set in the preset. Repeating it in the skill doc would create a redundancy that diverges over time. The skill doc should mandate `pnpm -w run test:governed` as the entry point; the wrapper handles the flags.
  - Evidence: `runner-shaping.sh` `has_force_exit` check and auto-inject logic

- Q: Are there other executor modules that need the same treatment?
  - A: `build-spike.md` may run targeted tests for exploratory validation. `build-investigate.md` dispatches read-only subagents that should not run tests. `build-biz.md` and `build-checkpoint.md` are non-code tracks. Only `build-code.md` and potentially `build-spike.md` are at risk.
  - Evidence: `/Users/petercowling/base-shop/.claude/skills/lp-do-build/modules/` directory listing; SPIKE tasks may include test validation per `SPIKE ≥80%` confidence threshold in `SKILL.md`

### Open (Operator Input Required)

None — all questions are resolvable from evidence.

## Confidence Inputs

- Implementation: 90%
  - The change surface is fully identified: `build-code.md` (23 lines), possibly `build-spike.md` (optional, low-priority — its executor spec has no Jest test step), and optionally a pointer in `SKILL.md`. No code changes required. The exact wording of the mandate is a minor drafting task.
  - What would raise to ≥95%: review a session log to confirm the zombie processes came from `pnpm --filter <pkg> test` and not from another ungoverned path.
- Approach: 88%
  - Mandating the governed runner in the executor module is the canonical pattern (established precedent in `ops-ship`). Belt-and-suspenders with the preset and runner-level `--forceExit` is already in place; the gap is purely the skill doc instruction.
  - What would raise to ≥95%: confirm that `build-code.md` is the only executor module the zombies came from (vs. `build-spike.md` or a wave-dispatch subagent).
- Impact: 85%
  - If agents follow the skill doc mandate, zombies are prevented. `--forceExit` in the preset handles the residual case where an agent bypasses the wrapper. The governed wrapper's process-tree cleanup handles the case where a run is still in progress at subagent exit.
  - What would raise to ≥95%: observe zero zombie processes over 3 build sessions after the fix.
- Delivery-Readiness: 95%
  - Owner: sole operator/author. No approval gate. Change is two doc edits + optional shell-script note. No migration, no CI change required.
- Testability: 80%
  - Observable via `ps aux | grep jest | grep -v grep` post-session. Governed telemetry `kill_escalation` field provides secondary signal.
  - What would raise to ≥90%: automated post-task check in governed wrapper that emits a warning if any Jest process is still alive after the runner exits.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Agents ignore skill doc mandate and run Jest via ungoverned path anyway | Medium | Medium (zombie processes return) | Mechanical guards in `scripts/agent-bin/*` and hook-based blocks reduce exposure; confirm non-interactive hook/wrapper coverage before treating this as fully mitigated |
| `build-spike.md` is also an ungoverned risk path | Low (`build-spike.md` has no Jest test step; spikes produce prototype/benchmark artifacts, not test suite runs; risk applies only if a spike task explicitly scopes Jest execution) | Low (SPIKE zombies unlikely given executor spec) | Optionally add mandate to `build-spike.md`; lower priority than `build-code.md` fix |
| `--forceExit` in preset is overridden by a package-level jest.config.cjs | Low | Low (would be a pre-existing issue visible in test telemetry) | Confirm not overridden by checking per-package configs; no evidence of override found |
| Fix increases governed runner usage, briefly surfacing admission-pressure warnings during heavy build sessions | Low | Very low (informational warning only; telemetry-visible) | BASESHOP_ALLOW_OVERLOAD=1 available as override for incident/debug |
| Human operator (not a build subagent) was the actual zombie source | Medium | Medium (fix would not address this; zombies could recur) | Pre-fix verification: check `.cache/test-governor/events.jsonl` near incident timestamp; compare with subagent session output to confirm source |
| `guarded-shell-hooks.sh` is not active in non-interactive Claude Code agent shells | Unknown | Medium (mechanical guard effectiveness as fallback is unclear) | Confirm hook activation in non-interactive mode before treating it as a reliable backstop |

## Planning Constraints & Notes

- Must-follow patterns:
  - All test invocations must use `pnpm -w run test:governed -- jest -- <args>` (or the package-CWD bash variant for `--config ./jest.config.cjs` cases; see testing-policy.md Rule 1)
  - Skill doc changes are the authoritative source; shell script changes are additive only
  - Do not add `--forceExit` as a hard-coded flag in the skill doc — it is already handled by the runner
- Rollout/rollback expectations:
  - Rollback is trivial: revert the 2–3 lines added to `build-code.md` and optionally `build-spike.md`
  - No migration required; existing plans are unaffected
  - Pre-fix verification (required first task): check `.cache/test-governor/events.jsonl` near the 2026-02-25 incident timestamp and session output to confirm subagent ungoverned invocation was the actual zombie source (not a human-operator run)
  - Confirm `guarded-shell-hooks.sh` is loaded in non-interactive Claude Code agent shells before treating it as a reliable mechanical backstop.
- Observability expectations:
  - Post-fix: `ps aux | grep jest | grep -v grep` after next build session should return empty
  - Governed telemetry `.cache/test-governor/events.jsonl` should show `kill_escalation: none` for normal runs

## Suggested Task Seeds (Non-binding)

1. INVESTIGATE: Attribute the 2026-02-25 zombie source by correlating `.cache/test-governor/events.jsonl` with session output; confirm build-subagent vs human-operator origin
2. IMPLEMENT: Update `build-code.md` — add explicit `## Test Invocation` section mandating `pnpm -w run test:governed` and cross-referencing `docs/testing-policy.md`
3. IMPLEMENT (optional, low-priority): Update `build-spike.md` — add a note that if a spike explicitly scopes Jest test execution, it must use the governed runner. Note: `build-spike.md` has no Jest test step in its current spec; this is a defensive addition only.
4. IMPLEMENT (optional): Add a pointer in `lp-do-build/SKILL.md` `## Shared Utilities` section linking to `docs/testing-policy.md` as a required pre-read for any validation step
5. CHECKPOINT: After next build session, run `ps aux | grep jest | grep -v grep` and confirm zero survivors

## Execution Routing Packet

- Primary execution skill: lp-do-build (routes to `build-code.md` executor; code track; TC contracts apply — not VC contracts)
- Supporting skills: none
- Deliverable acceptance package:
  - `build-code.md` updated with explicit governed test mandate (TC: read the updated file and confirm `pnpm -w run test:governed` is present)
  - `build-spike.md` optionally updated (if in scope — low priority)
  - Post-fix session check: `ps aux | grep jest | grep -v grep` returns empty
- Post-delivery measurement plan:
  - Check governed telemetry `kill_escalation` over next 5 sessions
  - If any zombie is observed, run `ps aux | grep jest` immediately after next build session to capture the entry point

## Evidence Gap Review

### Gaps Addressed

- Confirmed `build-code.md` has no test command guidance (read the full file: 23 lines, no mention of governed runner)
- Confirmed `runner-shaping.sh` already injects `--forceExit` for `jest`/`changed` intents
- Confirmed `packages/config/jest.preset.cjs` already sets `forceExit: true`
- Confirmed governed wrapper installs `trap cleanup EXIT INT TERM` with process-tree kill on exit
- Confirmed `AGENTS.md` Testing Rules do not restate the `test:governed` command; explicit governed-runner command policy is in `docs/testing-policy.md`
- Confirmed `ops-ship` SKILL.md already uses the orphan-check pattern (`ps aux | grep jest`)

### Confidence Adjustments

- Implementation confidence raised from initial ~70% to 90% after confirming `build-code.md` is the single clear gap and no code changes are needed
- No downward adjustments required

### Remaining Assumptions

- The zombie processes came specifically from build subagents running `pnpm --filter <pkg> test` rather than another ungoverned path; this is the highest-probability explanation given `build-code.md`'s absence of command guidance, but has not been confirmed by session log review

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan build-subagent-jest-zombie-cleanup`
