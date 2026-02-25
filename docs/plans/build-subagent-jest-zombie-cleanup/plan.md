---
Type: Plan
Status: Draft
Domain: BOS
Workstream: Engineering
Created: 2026-02-25
Last-reviewed: 2026-02-25
Last-updated: 2026-02-25 (all tasks complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: build-subagent-jest-zombie-cleanup
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 75%
Confidence-Method: min(Implementation,Approach,Impact) per task; overall is effort-weighted average (S=1, M=2, L=3), rounded to nearest 5%
Auto-Build-Intent: plan-only
---

# Build Subagent Jest Zombie Cleanup Plan

## Summary
This plan closes the subagent Jest zombie risk via two parallel tracks after TASK-01 confirms attribution. **Track A (primary):** harden `baseshop_terminate_command_tree` in `run-governed-test.sh` — telemetry on 2026-02-25 shows 5 `kill_escalation:sigterm` events (both external-SIGTERM `exit_code:143` and timeout `exit_code:124`); the root cause is that `pkill -TERM -P $command_pid` kills only immediate children, orphaning Jest workers (grandchildren of pnpm). TASK-05 replaces this with process-group kill. **Track B (defense-in-depth):** documentation enforcement at the build executor point of use (`build-code.md`, `SKILL.md`) to reinforce policy against ungoverned invocations — all 7 ungoverned attempts on 2026-02-25 were blocked (`admitted:false`), but the instruction gap remains. TASK-04 verifies both tracks eliminate zombies after a real build session.

## Active tasks
- [x] TASK-01: Attribute incident source and verify non-interactive guard coverage
- [x] TASK-02: Add governed Jest invocation contract to `build-code.md`
- [x] TASK-03: Harden adjacent build docs (`SKILL.md` pointer and optional SPIKE note)
- [x] TASK-04: Validate post-fix runtime behavior and telemetry
- [x] TASK-05: Harden governed-runner kill escalation to prevent Jest worker orphaning

## Goals
- Confirm whether 2026-02-25 zombie processes came from a build subagent path or a human/operator path.
- Ensure build subagents executing IMPLEMENT code tasks receive an explicit governed Jest command contract at point-of-use.
- Reinforce the governed test policy in nearby build docs to reduce instruction drift.
- Verify no orphaned Jest processes remain after a real build session.
- Harden the governed runner's kill escalation to eliminate Jest worker orphaning: replace shallow `pkill -P` (kills only immediate pnpm children) with process-group kill that covers the full Jest worker subtree.

## Non-goals
- Changing Jest preset defaults or `runner-shaping.sh` force-exit behavior.
- Altering CI test orchestration.
- Building new process-monitoring infrastructure.

## Constraints & Assumptions
- Constraints:
  - Script-level changes are in scope for `run-governed-test.sh` (TASK-05) based on telemetry evidence; keep all other changes bounded to planning/docs.
  - Preserve existing governed runner defaults (`--maxWorkers` shaping and `--forceExit` injection).
  - Keep task scope within `lp-do-build` skill documents and verification artifacts.
- Assumptions:
  - Missing test-command guidance in `build-code.md` is a contributing factor to ungoverned invocation risk. **Telemetry evidence (strong, pending TASK-01 formal confirmation):** full inspection of `.cache/test-governor/events.jsonl` for 2026-02-25 shows 7 `governed:false` events, all `admitted:false` — zero ungoverned executions succeeded. Classes: `pnpm-exec-jest` (5 events) and `npx-jest` (2 events). Zombie-correlating events are all `kill_escalation:sigterm`: 16:23 (×2, `exit_code:143` — external SIGTERM, cleanup trap fires), 18:33 (timeout kill), 21:08 (×2, timeout kill). Ungoverned-path hypothesis not confirmed by telemetry. TASK-05 directly targets the `baseshop_terminate_command_tree` shallow-kill mechanism; doc change (TASK-02) remains valid defense-in-depth.
  - Existing command guards reduce but may not fully eliminate ungoverned risk in non-interactive contexts.

## Inherited Outcome Contract
- **Why:** Build subagents left Jest zombie processes during a live build session, consuming ~170% CPU and requiring manual intervention. This is a known recurring risk (prior incident: 2026-01-16, 2.5GB RAM consumed by orphaned Jest workers).
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All Jest test runs initiated by build subagents exit within the wall-clock timeout window (<=600s) with no orphaned worker processes remaining; confirmed by checking `ps aux | grep jest` after a full build session.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/build-subagent-jest-zombie-cleanup/fact-find.md`
- Key findings used:
  - `build-code.md` currently lacks explicit governed test invocation guidance.
  - Governed runner cleanup (`trap cleanup EXIT INT TERM` + process-tree termination) already exists.
  - Explicit governed command contract currently lives in `docs/testing-policy.md` and is not restated in `build-code.md`.
  - Incident-source attribution and non-interactive guard coverage still require targeted verification.

## Proposed Approach
- Option A:
  - Documentation-only enforcement at executor point-of-use (`build-code.md`), plus optional adjacent doc hardening, then live-session verification.
- Option B:
  - Script-level hardening first (governed wrapper/guards), then skill docs.
- Chosen approach: Two parallel tracks, both gated on TASK-01 attribution confirmation. **Track A (TASK-05, primary fix):** harden `baseshop_terminate_command_tree` in `run-governed-test.sh` — replace shallow `pkill -P` with process-group kill (spawn via `setsid`, kill via `kill -TERM -- -$pgid`) to cover the full Jest worker subtree. Added proactively based on telemetry evidence; TASK-01 must formally confirm before TASK-05 executes. **Track B (TASK-02/03, defense-in-depth):** doc enforcement at point-of-use, independent of SIGTERM fix. If TASK-01 reveals additional zombie paths not covered by these two tracks, route follow-up via `/lp-do-replan`.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No (plan-only mode)

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | INVESTIGATE | Attribute incident source and verify non-interactive guard coverage | 80% | S | Complete | - | TASK-02, TASK-05 |
| TASK-02 | IMPLEMENT | Add explicit governed test invocation contract to `build-code.md` | 75% | S | Complete | TASK-01 | TASK-03, TASK-04 |
| TASK-03 | IMPLEMENT | Add adjacent policy pointers (`lp-do-build/SKILL.md`, optional `build-spike.md`) | 85% | S | Complete | TASK-02 | - |
| TASK-04 | INVESTIGATE | Verify post-fix behavior (no zombies + telemetry consistency) | 70% | S | Complete | TASK-02, TASK-05 | - |
| TASK-05 | IMPLEMENT | Harden governed-runner kill escalation to prevent Jest worker orphaning | 80% | S | Complete | TASK-01 | TASK-04 |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Attribution gate; must confirm SIGTERM source and ungoverned-path status before any implementation. |
| 2 | TASK-02, TASK-05 | TASK-01 | Run in parallel: doc enforcement (Track B) and runner script hardening (Track A) are independent of each other. |
| 3 | TASK-03 | TASK-02 | Adjacent policy pointers; depends only on TASK-02. |
| 4 | TASK-04 | TASK-02, TASK-05 | Runtime verification; requires both implementation tracks complete before post-fix session test. |

## Tasks

### TASK-01: Attribute incident source and verify non-interactive guard coverage
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/build-subagent-jest-zombie-cleanup/incident-attribution.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-25)
- **Affects:** `docs/plans/build-subagent-jest-zombie-cleanup/incident-attribution.md`, `[readonly] .cache/test-governor/events.jsonl`, `[readonly] scripts/agents/guarded-shell-hooks.sh`, `[readonly] scripts/agent-bin/pnpm`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-05
- **Confidence:** 80% *(final — actor identity unresolvable from telemetry; all other questions answered definitively)*
  - Implementation: 85% - file/telemetry paths were known and locally inspectable.
  - Approach: 80% - actor identity could not be confirmed (telemetry lacks session/caller fields); all other questions resolved from telemetry + script analysis.
  - Impact: 85% - attribution confirmed: SIGTERM escalation path is zombie source; ungoverned hypothesis refuted; recommendations issued for TASK-02 and TASK-05.
- **Build evidence (2026-02-25):** `docs/plans/build-subagent-jest-zombie-cleanup/incident-attribution.md` produced. Key findings: (1) zero `governed:false, admitted:true` events — ungoverned hypothesis REFUTED; (2) 5 `kill_escalation:sigterm` events confirm `baseshop_terminate_command_tree` shallow-kill is zombie source in both external-SIGTERM (exit_code:143) and timeout (exit_code:124) paths; (3) guard coverage sufficient for `pnpm-exec-jest` and `npx-jest` via agent-bin wrappers; (4) `npx-jest` class (2 events, not previously identified in plan) needs explicit coverage in TASK-02.
- **Questions to answer:**
  - Did the 2026-02-25 zombie incident originate from a build subagent flow, a human/operator run, or mixed sources?
  - Are non-interactive build agent shells guaranteed to run the guarded command wrappers/hooks for Jest-blocking behavior?
  - Do any `governed:false` telemetry events on 2026-02-25 also show `admitted:true` (i.e., ungoverned invocations that actually executed past the guard)? If none, the ungoverned-path hypothesis is not confirmed by telemetry and the investigation must pivot to the governed-runner SIGTERM escalation as the candidate zombie source (`governed:true, timeout_killed:true, kill_escalation:sigterm` events exist at 21:08:40 on that date).
- **Acceptance:**
  - `incident-attribution.md` documents source attribution with evidence references and confidence level.
  - The report explicitly states whether any `governed:false, admitted:true` events exist on 2026-02-25 in telemetry. If none, the report concludes that the ungoverned-path hypothesis is not confirmed and recommends scope shift to governed-runner SIGTERM behavior.
  - The report cites the telemetry fields `governed`, `admitted`, `timeout_killed`, and `kill_escalation` as primary attribution sources with specific event timestamps.
  - The report states whether current guard coverage is sufficient, partial, or unknown for non-interactive execution.
  - The report recommends either proceed with doc-only remediation or add script-level follow-up (including governed-runner kill-escalation hardening if SIGTERM is the source).
- **Validation contract:** Evidence artifact includes: incident timeline, source attribution rationale citing `governed`/`admitted`/`timeout_killed`/`kill_escalation` telemetry fields, guard-coverage determination, and a binary recommendation for TASK-02 scope. If ungoverned hypothesis is not confirmed by telemetry, artifact must contain a specific alternative hypothesis with evidence.
- **Planning validation:** Checks run: `rg`/`sed`/`nl` against telemetry and guard scripts; Validation artifacts: command output excerpts in `incident-attribution.md`.
- **What would make this >=90%:**
  - Directly correlate one incident-time test command to actor identity with unambiguous session metadata.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** Adds investigation artifact used by downstream implementation and future postmortems.
- **Notes / references:**
  - `docs/plans/build-subagent-jest-zombie-cleanup/fact-find.md`

### TASK-02: Add governed Jest invocation contract to `build-code.md`
- **Type:** IMPLEMENT
- **Deliverable:** `code-change` in `.claude/skills/lp-do-build/modules/build-code.md` adding explicit governed test invocation guidance for Jest validation steps
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-25)
- **Affects:** `.claude/skills/lp-do-build/modules/build-code.md`, `[readonly] docs/testing-policy.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-04
- **Confidence:** 75% *(TASK-01 outcome: Neutral. Impact of 75% confirmed — ungoverned path was never executed (all admitted:false); doc change is defense-in-depth. Proceeds below 80% per Round 1 replan decision: doc-only, zero breakage risk, precursor TASK-01 now complete.)*
  - Implementation: 90% - single-file scoped edit with clear insertion point.
  - Approach: 85% - governed command language defined in testing policy; TASK-01 confirms `npx-jest` class (2 events at 16:57, 18:17) should also be explicitly mentioned in guidance.
  - Impact: 75% - prevents future ungoverned attempts from reaching the guard; does not address the observed `kill_escalation:sigterm` zombie source (TASK-05 handles that).
- **Acceptance:**
  - `build-code.md` includes explicit test invocation guidance requiring `pnpm -w run test:governed -- jest -- <args>`.
  - Guidance includes package-CWD variant for `./jest.config.cjs` use cases.
  - Guidance notes that `npx jest` and `pnpm exec jest` are blocked by the agent-bin guards (do not use these forms).
  - Section references `docs/testing-policy.md` as canonical rule source.
- **Validation contract (TC-02):**
  - TC-02-01: Read `build-code.md` -> explicit governed command string present.
  - TC-02-02: Read `build-code.md` -> package-CWD governed variant documented for config-path edge case.
  - TC-02-03: Read `build-code.md` -> no contradictory instruction allows direct `pnpm exec jest`/ungoverned forms.
- **Execution plan:** Red -> Green -> Refactor
  - Red: confirm current `build-code.md` has no explicit governed command mandate.
  - Green: add minimal explicit `Test Invocation` guidance section with canonical command + edge-case variant.
  - Refactor: tighten phrasing and remove ambiguity/duplicates; ensure consistency with `docs/testing-policy.md`.
- **Planning validation (required for M/L):** None: S-effort task; pre-validated by fact-find evidence.
- **Scouts:** None: bounded doc-surface change.
- **Edge Cases & Hardening:** Ensure instruction covers repo-root and package-CWD governed forms without duplicating low-level flag details.
- **What would make this >=90%:**
  - Evidence from TASK-04 that at least one post-fix build run used governed invocation with zero survivors.
- **Rollout / rollback:**
  - Rollout: commit scoped doc edit; consume in next `/lp-do-build` implementation cycle.
  - Rollback: revert the `build-code.md` section if unintended instruction conflicts appear.
- **Documentation impact:** Updates build executor contract at point of use.
- **Build evidence (2026-02-25):** `build-code.md` updated with explicit `## Test Invocation` section. TC-02-01: governed command string present (lines 30, 35). TC-02-02: Package-CWD variant documented (line 38). TC-02-03: blocked forms (`pnpm exec jest`, `npx jest`, direct invocations) enumerated; no contradictory permissive instruction. `npx-jest` class (2 events on 2026-02-25) now covered in blocked-forms list. Committed in Wave 2 (`df0560fdb6`).
- **Notes / references:**
  - `docs/testing-policy.md` Rule 1 governed entrypoint.

### TASK-03: Add adjacent policy pointers in build skill docs
- **Type:** IMPLEMENT
- **Deliverable:** `code-change` in `.claude/skills/lp-do-build/SKILL.md` shared utilities pointer to `docs/testing-policy.md`; optional defensive note in `.claude/skills/lp-do-build/modules/build-spike.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-25)
- **Affects:** `.claude/skills/lp-do-build/SKILL.md`, `.claude/skills/lp-do-build/modules/build-spike.md`, `[readonly] docs/testing-policy.md`
- **Depends on:** TASK-02
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% - small, isolated doc edits.
  - Approach: 85% - reinforces policy in parent skill context and adjacent module.
  - Impact: 85% - reduces drift/ambiguity across executor paths.
- **Acceptance:**
  - `lp-do-build/SKILL.md` shared utilities includes testing policy pointer for validation steps.
  - `build-spike.md` includes defensive governed-invocation note only when spike scope explicitly includes Jest execution.
  - No new contradictions with existing gates/policies.
- **Validation contract (TC-03):**
  - TC-03-01: Read `lp-do-build/SKILL.md` -> testing policy reference present in `Shared Utilities`.
  - TC-03-02: Read `build-spike.md` -> note is conditional (does not falsely imply all spikes run tests).
  - TC-03-03: Grep `lp-do-build` module docs -> no instruction conflicts with governed test entrypoint.
- **Execution plan:** Red -> Green -> Refactor
  - Red: verify absence of explicit testing policy pointer in shared utilities.
  - Green: add minimal pointer and optional conditional spike note.
  - Refactor: normalize wording to avoid duplicate or contradictory mandates.
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** None: low-risk policy reinforcement.
- **Edge Cases & Hardening:** Keep SPIKE note conditional to avoid implying mandatory test execution for all spike tasks.
- **What would make this >=90%:**
  - Demonstrated reduction of ambiguity in one complete build session transcript after TASK-02 and TASK-03.
- **Rollout / rollback:**
  - Rollout: ship alongside TASK-02 to keep policy references consistent.
  - Rollback: revert pointer/note if it introduces duplicated or stale guidance.
- **Documentation impact:** Hardens policy discoverability across build orchestration docs.
- **Build evidence (2026-02-25):** TC-03-01: `docs/testing-policy.md` pointer added to `Shared Utilities` section of `SKILL.md` (line 153). TC-03-02: `build-spike.md` note is conditional on "spike scope explicitly includes Jest test execution" — does not imply all spikes run tests. TC-03-03: grep of `lp-do-build` module docs confirms no instruction permits `npx jest`/`pnpm exec jest` — only blocked-forms lists reference these. Committed in `173d3f6fba`.
- **Status:** Complete (2026-02-25)
- **Notes / references:**
  - `.claude/skills/lp-do-build/modules/build-code.md`
  - `docs/testing-policy.md`

### TASK-04: Verify post-fix behavior and telemetry consistency
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/build-subagent-jest-zombie-cleanup/post-fix-verification.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-25)
- **Affects:** `docs/plans/build-subagent-jest-zombie-cleanup/post-fix-verification.md`, `[readonly] .cache/test-governor/events.jsonl`
- **Depends on:** TASK-02, TASK-05
- **Blocks:** -
- **Confidence:** 70%
  - Implementation: 75% - verification commands and telemetry path are known.
  - Approach: 70% - verification depends on running/observing a representative build session.
  - Impact: 75% - confirms whether planned remediation achieved intended operational outcome.
- **Questions to answer:**
  - After applying TASK-02 (and optionally TASK-03), do build-session test runs exit without residual Jest processes?
  - Do governed telemetry events align with expected healthy behavior (`kill_escalation: none` for normal runs)?
- **Acceptance:**
  - `post-fix-verification.md` includes command outputs and telemetry summary for at least one post-fix build session.
  - Report explicitly states pass/fail for “no orphaned Jest process” invariant.
  - If failed, report contains concrete follow-up recommendation for `/lp-do-replan`.
- **Validation contract:** Evidence artifact includes post-session `ps` check result, telemetry excerpt, and explicit verdict.
- **Planning validation:** None: runtime verification task; validation occurs during execution.
- **What would make this >=90%:**
  - Three consecutive post-fix build sessions with zero survivors and consistent healthy telemetry (`kill_escalation: none`).
- **Build evidence (2026-02-25):** `post-fix-verification.md` produced. Post-fix session: `stage-label-rename` (281 passed, exit 0). Telemetry at 22:19Z and 22:20Z: `kill_escalation: none`, `exit_code: 0`. `ps aux | grep jest` after session: 0 survivors. Orphaned process invariant: **PASS**. Residual risk noted: SIGTERM/timeout kill path not triggered post-fix; monitoring recommendation added. Verdict: partial pass — normal-exit path confirmed clean; full SIGTERM-path confirmation requires a future congestion-condition session.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** Adds operational verification artifact linked to this plan.
- **Notes / references:**
  - `docs/plans/build-subagent-jest-zombie-cleanup/fact-find.md`

### TASK-05: Harden governed-runner kill escalation to prevent Jest worker orphaning
- **Type:** IMPLEMENT
- **Deliverable:** `code-change` in `scripts/tests/run-governed-test.sh` — replace shallow `pkill -P` kill with process-group kill so Jest workers (grandchildren of the spawned pnpm process) are included in termination on timeout or external SIGTERM
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-25)
- **Affects:** `scripts/tests/run-governed-test.sh`
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 80% *(TASK-01 outcome: Affirming — confirmed baseshop_terminate_command_tree as zombie source via both kill paths; E2 uplift applied to Approach: 80% → 85%; min unchanged at 80%.)*
  - Implementation: 85% - `baseshop_terminate_command_tree` function confirmed at lines 245-267; `setsid` + `kill -TERM -- -$pgid` approach is a standard Unix pattern; main risk is pgid collision with current shell's process group (testable and avoidable with a guard).
  - Approach: 85% *(E2 uplift from TASK-01: confirmed that BOTH external-SIGTERM path (exit_code:143) and timeout path (exit_code:124) flow through baseshop_terminate_command_tree with the same shallow-kill mechanism; two-path confirmation raises approach confidence.)*
  - Impact: 80% - 5 `kill_escalation:sigterm` events on 2026-02-25 all flow through `baseshop_terminate_command_tree`; process-group kill directly closes the orphaning window for both kill paths.
- **Acceptance:**
  - `run-governed-test.sh` spawns the Jest command in a dedicated process group (via `setsid` or equivalent).
  - `baseshop_terminate_command_tree` sends kill signal to the entire process group (`kill -TERM -- -$pgid`), not only to direct children via `pkill -P`.
  - A guard prevents killing the current shell's process group if pgid unexpectedly matches.
  - No existing `scripts/tests/` test suite regressions.
- **Validation contract (TC-05):**
  - TC-05-01: Read `run-governed-test.sh` → command spawned via `setsid` or creates a new process group before exec.
  - TC-05-02: Read `baseshop_terminate_command_tree` → sends `kill -TERM -- -$pgid` (or equivalent process-group signal), not just `pkill -TERM -P $target_pid`.
  - TC-05-03: Grep `scripts/tests/` → pgid guard present (does not kill own shell group).
  - TC-05-04: Run `scripts/tests/` test suite → zero regressions.
- **Execution plan:** Red → Green → Refactor
  - Red: confirm `baseshop_terminate_command_tree` uses `pkill -P` (shallow); confirm `"${command[@]}" &` does NOT currently use `setsid`.
  - Green: wrap command spawn with `setsid`; update `baseshop_terminate_command_tree` to extract pgid and issue `kill -TERM -- -$pgid`; retain existing SIGKILL escalation path after grace period.
  - Refactor: add pgid guard (`[[ "$pgid" != "$$" && "$pgid" != "0" ]]`); ensure compatibility with `ci_compat_mode` path (which skips lock/admission but still spawns the command).
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** None: change is isolated to one function and one spawn site.
- **Edge Cases & Hardening:**
  - If `setsid` is not available on the host: fall back to existing `pkill -P` behaviour with a warning; do not break the governed runner entirely.
  - `ci_compat_mode` path bypasses the lock/admission scheduler but must still spawn in a new process group for consistent kill behaviour.
  - RSS monitor and heartbeat subprocesses are NOT in the Jest process group — ensure they are excluded from the process-group kill.
- **What would make this >=90%:**
  - TASK-04 post-fix session confirms zero survivors after a run that would previously have produced orphans (i.e., a run that includes a SIGTERM kill event in telemetry with `kill_escalation:sigterm` but no surviving jest processes visible in `ps aux`).
- **Rollout / rollback:**
  - Rollout: targeted edit to `scripts/tests/run-governed-test.sh`; no schema changes; backwards-compatible with existing telemetry fields.
  - Rollback: revert `setsid` spawn and restore `pkill -P` form if unexpected process-group side effects observed (e.g., RSS monitor or heartbeat killed inadvertently).
- **Documentation impact:** Adds inline comment explaining why `setsid` is used; no external doc changes required.
- **Build evidence (2026-02-25):** `run-governed-test.sh` hardened with two changes: (1) command spawn site now uses `setsid "${command[@]}" &` with `command -v setsid` availability check and fallback; (2) `baseshop_terminate_command_tree` rewritten to resolve `pgid` via `ps -o pgid=`, send `kill -TERM -- -$pgid` to full process group, with `own_pgid` safety guard (lines 259-284). SIGKILL escalation path preserved. All TC checks pass: TC-05-01 (setsid at line 407), TC-05-02 (kill -TERM -- -$pgid at line 263), TC-05-03 (own_pgid guard at lines 262, 277), TC-05-04 (no test files in scripts/tests/ — static check clear). Committed in Wave 2 (`df0560fdb6`).
- **Notes / references:**
  - `scripts/tests/run-governed-test.sh` — `baseshop_terminate_command_tree` function and `"${command[@]}" &` spawn site
  - `.cache/test-governor/events.jsonl` — 5 `kill_escalation:sigterm` events on 2026-02-25 as primary evidence

## Risks & Mitigations
- Misattributed incident source leads to ineffective remediation.
  - Mitigation: TASK-01 runs first and gates implementation scope.
- Zombie source is SIGTERM escalation within the governed runner: telemetry confirms 5 `kill_escalation:sigterm` events on 2026-02-25 (two external-SIGTERM `exit_code:143`, three timeout `exit_code:124`). Root cause is shallow `pkill -P` in `baseshop_terminate_command_tree` leaving Jest workers (grandchildren) as orphans. Doc-only fix is insufficient for this failure mode.
  - Mitigation: TASK-05 directly hardens `baseshop_terminate_command_tree` with process-group kill; gated on TASK-01 formal confirmation. TASK-04 verifies zero survivors after both tracks complete.
- Non-interactive guard coverage is partial/unknown.
  - Mitigation: TASK-01 explicitly verifies wrapper/hook coverage and escalates script-hardening via replan if needed.
- Doc updates become stale relative to testing policy.
  - Mitigation: TASK-02 and TASK-03 reference canonical policy doc rather than duplicating flag-level logic.
- Post-fix success appears transient or untestable without congestion scenario.
  - Mitigation: TASK-04 captures telemetry and explicitly requires follow-up recommendation on failure. If zombie condition requires queue pressure (304s queued + simultaneous timeout kills), a single routine verification session is insufficient; the report must acknowledge this and flag residual risk.

## Observability
- Logging:
  - Use build session output and captured verification artifacts under `docs/plans/build-subagent-jest-zombie-cleanup/`.
- Metrics:
  - Survivor count from `ps aux | grep jest | grep -v grep` after session.
  - Governed telemetry field trend: `kill_escalation` in `.cache/test-governor/events.jsonl`.
- Alerts/Dashboards:
  - None: no automated dashboard in scope; manual artifact review governs go/no-go.

## Acceptance Criteria (overall)
- [ ] Incident attribution and guard-coverage evidence captured in `incident-attribution.md`; report explicitly addresses whether `governed:false, admitted:true` events exist on 2026-02-25 and cites `timeout_killed` / `kill_escalation` telemetry fields.
- [ ] `build-code.md` explicitly mandates governed Jest invocation and config-path variant guidance.
- [ ] Adjacent build docs include consistent policy pointers without contradiction.
- [ ] Post-fix verification artifact shows no orphaned Jest processes for at least one representative build session, with explicit acknowledgement of whether the congestion scenario (concurrent runs under queue pressure) was or was not reproduced.
- [ ] Plan remains executable without unresolved DECISION tasks.

## Decision Log
- 2026-02-25: Selected plan-only mode because explicit auto-build intent was not requested.
- 2026-02-25: Chosen approach is documentation-first with evidence gate before any wrapper-script modifications.
- 2026-02-25: Sequenced investigation before implementation to avoid fixing the wrong source.
- 2026-02-25 (Replan Round 1): Added TASK-05 proactively based on telemetry evidence — all 7 ungoverned events had `admitted:false`; 5 `kill_escalation:sigterm` events confirm shallow `pkill -P` in `baseshop_terminate_command_tree` as zombie source. Two parallel implementation tracks: TASK-05 (primary script fix) + TASK-02/03 (defense-in-depth docs). TASK-02 Impact confidence reduced to 75%. Overall-confidence recalculated to 75%.

## Overall-confidence Calculation
- Task overall confidences:
  - TASK-01: 75% (S=1)
  - TASK-02: 75% (S=1) *(reduced from 85% — Impact downgraded to 75% based on telemetry evidence; see replan-notes.md Round 1)*
  - TASK-03: 85% (S=1)
  - TASK-04: 70% (S=1)
  - TASK-05: 80% (S=1) *(new — process-group kill hardening)*
- Weighted sum = (75*1 + 75*1 + 85*1 + 70*1 + 80*1) / (1+1+1+1+1) = 385/5 = 77%
- Rounded Overall-confidence: 75%

## Section Omission Rule
None: all core sections are relevant for this plan.
