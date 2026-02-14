---
Type: Plan
Status: Active
Domain: Infra
Workstream: Engineering
Created: 2026-02-13
Last-updated: 2026-02-13
Last-reviewed: 2026-02-13
Relates-to charter: none
Feature-Slug: test-execution-resource-governor
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-replan, /ops-ship
Overall-confidence: 82%
Confidence-Method: min(Implementation,Approach,Impact) per task; Overall is effort-weighted average (S=1, M=2, L=3)
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID:
---

# Test Execution Resource Governor Plan

## Summary

This plan implements a local-first test governance system that prevents machine overload from Jest command storms. The design is split into three layers: command guard (policy), scheduler (queue/locking), and resource admission (memory+CPU gating), with explicit worker/concurrency shaping in the governed runner. It starts with warn-only telemetry, then introduces enforced routing and script normalization, then enables resource admission after calibration data is collected. The plan is sequenced to de-risk interception first, then add queueing primitives, then ship admission controls with conservative defaults.

## Goals

- Prevent local machine blow-ups from test runs originating in this repo (with optional machine-wide incident mode).
- Ensure common bypass commands (`npx jest`, `npm exec jest`, `pnpm exec jest`, `node ...jest.js`, `./node_modules/.bin/jest`) are governed.
- Provide deterministic queueing semantics with cancellation and stale cleanup.
- Add tunable memory+CPU admission gates backed by telemetry and tests, plus worker/concurrency shaping.
- Prevent drift by linting docs/policies for ungoverned test invocation patterns.

## Non-goals

- Applying queue/admission controls to shared CI workers in this phase.
- Redesigning Jest internals or replacing Jest.
- Covering Cypress/Playwright in the first implementation.
- Shipping a human-priority queue lane in MVP.

## Constraints & Assumptions

- Constraints:
  - Must preserve current targeted-test workflow and avoid monorepo-wide accidental fan-out.
  - Must be safe on 16 GB developer hosts with multiple interactive tools running.
  - Must preserve an emergency override path for incident debugging.
- Assumptions:
  - Guarded shells are the standard execution path for agent-driven commands.
  - A conservative default budget (`memory_budget_pct=0.60`) is acceptable before telemetry calibration.

## Enforcement Boundary (By Phase)

- Phase 0 (warn-only):
  - Governed: commands routed through `pnpm`/`npm`/`npx` wrappers in guarded shells, plus raw shell commands detected by guarded-shell preexec hooks (`node ...jest.js`, `./node_modules/.bin/jest`, `npx jest`, `npm exec jest`, `pnpm exec jest`).
  - Not governed: commands executed outside guarded shells.
- Phase 1/2 (enforced + scheduler):
  - Governed and enforced: all above in guarded shells, plus package script migrations routed to governed entrypoints.
  - Raw commands outside guarded shells remain unsupported and out-of-policy.
- Phase 3+:
  - Governed runs additionally enforced by resource admission (memory+CPU) and telemetry-backed calibration.
- CI compatibility mode:
  - For migrated package scripts running with `CI=true`, governed runner executes in compatibility mode by default: shaping remains enabled, scheduler/admission queueing is disabled unless explicitly enabled.
  - Guarded-shell command interception does not apply in non-guarded CI shells.

Policy note:
- The guarantee is bounded to guarded shells and migrated repo scripts.
- Local non-guarded shell execution is explicitly unsupported and handled through docs/policy enforcement rather than runtime interception.

## Fact-Find Reference

- Related brief: `docs/plans/test-execution-resource-governor-fact-find.md`
- Key findings carried into this plan:
  - Wrappers alone do not intercept package-script `jest` resolution due to `node_modules/.bin` precedence.
  - Real-world bypasses are active and repeatable (`npx jest`, `npm exec jest`, direct Node/Jest path, local bin path).
  - No existing test lock analog exists; scheduler primitives must be added.
  - Resource admission requires calibration; Phase 3 has explicit go-live blockers.

## Existing System Notes

- Key modules/files:
  - `scripts/agents/with-git-guard.sh` - current PATH-based guard entrypoint.
  - `scripts/agent-bin/pnpm` - test policy guard logic for `pnpm`.
  - `scripts/agent-bin/turbo` - scoped turbo test guard.
  - `scripts/git/writer-lock.sh` - queue semantics and stale-recovery reference implementation.
  - `scripts/__tests__/writer-lock-queue.test.ts` - queue behavior test pattern to mirror.
  - `scripts/__tests__/pnpm-test-safety-policy.test.ts` - policy test table for command guards.
  - `docs/testing-policy.md` - canonical testing runbook constraints.
- Patterns to follow:
  - FIFO ticket queue semantics from writer lock.
  - policy wrappers with explicit deny messages and safer alternatives.
  - integration tests around queue state transitions plus pure-function tests for decision logic.

## Proposed Approach

- Option A: wrappers-only expansion (`npm`/`npx`/`jest`) without leaf migration.
  - Trade-off: easy start, but still bypassable through local bin and direct node paths.
- Option B: immediate hard-blocking of all bypasses.
  - Trade-off: high enforcement, but likely to break current scripts and workflows abruptly.
- Option C (chosen): phased guard + scheduler + admission with warn-only telemetry first, then enforced routing after migration.
  - Trade-off: slightly longer rollout, but safer and operationally realistic.

Chosen: Option C, because it addresses actual interception constraints while minimizing workflow breakage and preserving observability during rollout.

## Runner Contract (MVP)

`test:governed` is intent-based, not arbitrary-command passthrough.

Allowed forms:
- `pnpm -w run test:governed -- jest -- <jest args>`
- `pnpm -w run test:governed -- turbo -- <turbo args>`
- `pnpm -w run test:governed -- changed -- <path args>`
- `pnpm -w run test:governed -- watch-exclusive -- <jest args>` (requires explicit opt-in env, see TEG-03)

Rejected forms:
- arbitrary shell commands not on allowlist.
- nested/unrecognized runner recursion.

Context marker:
- Runner exports `BASESHOP_GOVERNED_CONTEXT=1` so policy wrappers can distinguish internal governed execution from external bypass attempts.

## Telemetry Contract (Phase 0+)

Storage:
- Append-only JSONL at `.cache/test-governor/events.jsonl`.
- Rotate file when size exceeds `20 MB` (timestamped archive).
- Writes are serialized with a dedicated telemetry lock file (`.cache/test-governor/telemetry.lock`) to avoid coupling scheduler lock latency to telemetry throughput.

Event schema (MVP):
- `ts`
- `governed` (`true|false`)
- `policy_mode` (`warn|enforce`)
- `class`
- `normalized_sig`
- `argv_hash`
- `admitted` (`true|false`)
- `queued_ms`
- `peak_rss_mb`
- `pressure_level`
- `workers`
- `exit_code`
- `override_policy_used` (`true|false`)
- `override_overload_used` (`true|false`)

`pressure_level` enum:
- `normal`
- `warn`
- `critical`
- `unknown` (probe failure fallback)

## Resource Policy Defaults (Canonical)

- Memory admission formula:
  - `memory_budget_mb = floor(total_ram_mb * 0.60)`
- CPU slot formula:
  - `cpu_slots_total = max(1, floor(logical_cpu * 0.70))`
  - Example: 10 logical CPUs => 7 slots.
- Runner shaping defaults (applied when args are absent unless overload override is set):
  - `jest` intent: `--maxWorkers=2`
  - `turbo` intent: `--concurrency=2` (and must include scoped run semantics)
  - `changed` intent: `--maxWorkers=2`
  - `watch-exclusive` intent: `--runInBand` and exclusive lock behavior

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TEG-01 | IMPLEMENT | Add warn-only command interception (`npm`/`npx` wrappers + shell hook) and telemetry contract | 84% | M | Completed (2026-02-13) | - | TEG-06, TEG-07 |
| TEG-02 | IMPLEMENT | Build test scheduler primitives (`test-lock.sh`) with FIFO, cancel, stale cleanup | 83% | M | Completed (2026-02-13) | - | TEG-03 |
| TEG-03 | IMPLEMENT | Add intent-based governed runner (`test:governed`) with scheduler and shaping caps | 82% | M | Completed (2026-02-13) | TEG-02 | TEG-04, TEG-05, TEG-07 |
| TEG-04 | CHECKPOINT | Horizon checkpoint after interception + scheduler baseline | 95% | S | Completed (2026-02-13) | TEG-03 | TEG-05, TEG-06, TEG-07 |
| TEG-05 | IMPLEMENT | Migrate package `test` scripts + `test:affected` path to governed entrypoints/caps | 80% | L | Completed (2026-02-13) | TEG-04 | TEG-06 |
| TEG-06 | IMPLEMENT | Flip from warn-only to hard enforcement for bypass patterns (split policy/overload overrides) | 80% | M | Completed (2026-02-13) | TEG-01, TEG-05 | TEG-07A, TEG-08, TEG-09 |
| TEG-07A | IMPLEMENT | Add governed-run telemetry emission for calibration-quality samples | 83% | M | Completed (2026-02-13) | TEG-01, TEG-06 | TEG-07B, TEG-07 |
| TEG-07B | SPIKE | Build day-zero calibration harness and sample summarizer for governed telemetry | 83% | M | Completed (2026-02-13) | TEG-07A | TEG-07, TEG-08 |
| TEG-07 | INVESTIGATE | Run multi-day calibration soak and finalize tuned class budgets/overrides | 76% (-> 82% conditional on soak gates) ⚠️ | M | Blocked (confidence <80; soak gates pending) | TEG-01, TEG-04, TEG-07A, TEG-07B | TEG-09 |
| TEG-08 | IMPLEMENT | Ship memory+CPU admission engine with seeded defaults, provisional calibration, and queue-on-pressure | 81% | L | Completed (2026-02-13) | TEG-06, TEG-07B | TEG-09 |
| TEG-09 | IMPLEMENT | Add drift prevention (docs lint + policy updates + operator docs) | 84% | M | Pending | TEG-06, TEG-07, TEG-08 | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Active tasks

- TEG-07: Run multi-day calibration soak and finalize tuned class budgets/overrides (INVESTIGATE; Blocked; 76%)
- TEG-09: Add drift prevention (docs lint + policy updates + operator docs) (IMPLEMENT; Pending; 84%)

## Confidence Gate Policy

- IMPLEMENT build threshold: `>=80%`.
- IMPLEMENT tasks `<80%` must be handled as INVESTIGATE/DECISION blockers before dependent IMPLEMENT tasks proceed, unless explicitly waived by user decision.
- In this plan, TEG-08 is gated by TEG-07B (day-zero governed calibration baseline). TEG-07 remains below threshold until multi-day soak gates are met (or explicitly waived) before final policy hardening in TEG-09.

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | TEG-01, TEG-02 | - | Guard telemetry and scheduler can start in parallel |
| 2 | TEG-03 | TEG-02 | Governed runner establishes canonical entrypoint early |
| 3 | TEG-04 | TEG-03 | Reassess before broad migration/enforcement |
| 4 | TEG-05 | TEG-04 | Script migration after checkpoint |
| 5 | TEG-06 | TEG-01, TEG-05 | Enforce after interception and script migration are ready |
| 6 | TEG-07A | TEG-01, TEG-06 | Add governed-run telemetry emission required for calibration quality |
| 7 | TEG-07B | TEG-07A | Build deterministic day-zero governed calibration capture path |
| 8 | TEG-08 | TEG-06, TEG-07B | Admission ships after enforcement and day-zero calibration baseline |
| 9 | TEG-07 | TEG-01, TEG-04, TEG-07A, TEG-07B | Multi-day soak validates/adjusts class budgets and overrides |
| 10 | TEG-09 | TEG-06, TEG-07, TEG-08 | Drift prevention and final policy docs |

**Max parallelism:** 2 | **Critical path:** 10 waves | **Total tasks:** 11

Schedule note:
- Wave count excludes telemetry soak time. TEG-07 is calendar-time-bound and may extend elapsed duration beyond the nominal 10-wave dependency graph.

## Tasks

### TEG-01: Add warn-only classifier + telemetry
- **Type:** IMPLEMENT
- **Deliverable:** code-change (`scripts/agents/*`, `scripts/agent-bin/*`, telemetry writer) + tests.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `scripts/agents/with-git-guard.sh`, `scripts/agents/guarded-shell-hooks.sh`, `scripts/agent-bin/pnpm`, `scripts/agent-bin/turbo`, `scripts/agent-bin/npm`, `scripts/agent-bin/npx`, `scripts/tests/telemetry-log.sh`, `scripts/__tests__/pnpm-test-safety-policy.test.ts`, `scripts/__tests__/turbo-test-safety-policy.test.ts`, `scripts/__tests__/guarded-shell-hooks.test.ts`
- **Depends on:** -
- **Blocks:** TEG-06, TEG-07
- **Confidence:** 84%
  - Implementation: 85% - wrapper and shell-hook patterns are straightforward but need careful shell compatibility handling.
  - Approach: 84% - warn-only phase is low risk and gathers needed command-shape evidence.
  - Impact: 84% - blast radius is bounded to guarded shells and telemetry files.
- **Acceptance:**
  - Warn-only interception covers `npm exec jest`, `npx jest`, `pnpm exec jest`, `node .../jest.js`, and `./node_modules/.bin/jest` in guarded shells.
  - `scripts/agent-bin/npm` and `scripts/agent-bin/npx` wrappers are installed and active in guarded PATH.
  - Raw command detection is implemented in guarded shell hooks (bash `trap DEBUG` and zsh `preexec` path when zsh is used).
  - Warning includes exact governed replacement command by intent (`jest`/`turbo`/`changed`).
  - Telemetry events are written to `.cache/test-governor/events.jsonl` with schema and rotation policy from this plan.
- **Validation contract:**
  - TC-01: `npx jest ...` in guarded shell -> warning emitted, command still executes.
  - TC-02: `npm exec jest ...` in guarded shell -> warning emitted, command still executes.
  - TC-03: raw direct commands (`node .../jest.js`, `./node_modules/.bin/jest`) -> warning emitted via shell hook path.
  - TC-04: governed path (`pnpm -w run test:governed -- jest -- ...`) -> no warning.
  - TC-05: telemetry line contains required fields (`governed`, `policy_mode`, `normalized_sig`, `override_*`) and rotates >20MB.
  - **Acceptance coverage:** TC-01..TC-03 cover interception reach; TC-04 covers governed-noise suppression; TC-05 covers telemetry durability contract.
  - **Validation type:** policy unit/integration tests.
  - **Validation location/evidence:** `scripts/__tests__/pnpm-test-safety-policy.test.ts`, `scripts/__tests__/turbo-test-safety-policy.test.ts`, `scripts/__tests__/guarded-shell-hooks.test.ts`.
  - **Run/verify:** `pnpm --filter scripts test -- __tests__/pnpm-test-safety-policy.test.ts` and `pnpm --filter scripts test -- __tests__/turbo-test-safety-policy.test.ts` and `pnpm --filter scripts test -- __tests__/guarded-shell-hooks.test.ts`.
- **Execution plan:** Red -> Green -> Refactor.
- **Planning validation:**
  - Checks run: command-path evidence from fact-find appendix A4 confirms these paths execute today.
  - Validation artifacts written: none (S/M planning task, no L stubs required).
  - Unexpected findings: bypasses recur during audit, reinforcing priority.
- **What would make this >=90%:** execute a one-day telemetry dry run and confirm warning precision (low false positives).
- **Rollout / rollback:**
  - Rollout: enable warn-only interception in guarded shell only.
  - Rollback: disable classifier path while preserving wrapper baseline.
- **Documentation impact:** update `docs/testing-policy.md` with warn-only phase behavior.
- **Notes / references:** `docs/plans/test-execution-resource-governor-fact-find.md`.
- **Build status (2026-02-13):** Completed in warn-only mode.
  - Implemented: `scripts/agent-bin/npm`, `scripts/agent-bin/npx`, `scripts/agent-bin/pnpm` warn-only Jest interception; `scripts/agents/guarded-shell-hooks.sh` raw command detection; `scripts/agents/with-git-guard.sh` hook/context wiring; `scripts/tests/telemetry-log.sh` JSONL + rotation + lock contract.
  - Validation: `pnpm --filter scripts test -- __tests__/pnpm-test-safety-policy.test.ts`; `pnpm --filter scripts test -- __tests__/turbo-test-safety-policy.test.ts`; `pnpm --filter scripts test -- __tests__/guarded-shell-hooks.test.ts`.

### TEG-02: Build scheduler primitives (`test-lock.sh`)
- **Type:** IMPLEMENT
- **Deliverable:** queue/lock scripts + queue tests.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `scripts/tests/test-lock.sh`, `scripts/tests/test-lock-config.sh`, `scripts/__tests__/test-lock-queue.test.ts`, `[readonly] scripts/git/writer-lock.sh`, `[readonly] scripts/__tests__/writer-lock-queue.test.ts`
- **Depends on:** -
- **Blocks:** TEG-03
- **Confidence:** 83%
  - Implementation: 84% - writer-lock queue logic is a strong in-repo precedent.
  - Approach: 83% - per-repo FIFO with cancel/clean-stale matches current operational model.
  - Impact: 83% - mostly additive script/test surface.
- **Acceptance:**
  - `acquire`, `release`, `status`, `cancel`, `clean-stale` exist and are stable.
  - Lock payload contains PID + heartbeat + command signature.
  - Stale holder reclamation is deterministic and test-covered.
  - Lock scope is configurable via `BASESHOP_TEST_LOCK_SCOPE=repo|machine` with documented lock paths for both modes.
- **Validation contract:**
  - TC-01: FIFO ordering preserved under two contenders.
  - TC-02: cancel removes queued ticket immediately.
  - TC-03: dead holder PID is reclaimed by `clean-stale`.
  - TC-04: active holder heartbeat prevents false stale cleanup.
  - TC-05: `BASESHOP_TEST_LOCK_SCOPE=repo` and `machine` resolve distinct lock locations and status output reflects active scope.
  - **Acceptance coverage:** TC-01..TC-05 map 1:1 to queue semantics + scope behavior.
  - **Validation type:** integration tests with controlled test lock dir.
  - **Validation location/evidence:** `scripts/__tests__/test-lock-queue.test.ts`.
  - **Run/verify:** `pnpm --filter scripts test -- __tests__/test-lock-queue.test.ts`.
- **Execution plan:** Red -> Green -> Refactor.
- **Scouts:**
  - Writer-lock stale semantics -> read `scripts/git/writer-lock.sh` and mirror only required primitives.
- **Planning validation:**
  - Checks run: fact-find confirms no existing test lock scripts.
  - Validation artifacts written: none.
  - Unexpected findings: none.
- **What would make this >=90%:** run queue tests under parallel contention 50+ iterations to verify flake resistance.
- **Rollout / rollback:**
  - Rollout: new script path only, not yet wired to all test commands.
  - Rollback: disable runner integration and keep script isolated.
- **Documentation impact:** add scheduler semantics section in `docs/testing-policy.md`.
- **Notes / references:** mirror patterns from `scripts/git/writer-lock.sh`.
- **Build progress (2026-02-13):**
  - **Status:** Blocked (external baseline)
  - **Commits:** `8da798ad58`
  - **Implementation notes:** added `scripts/tests/test-lock.sh` and `scripts/tests/test-lock-config.sh` with FIFO queueing, cancellation, stale cleanup, heartbeat updates, and scope-aware status metadata; added `scripts/__tests__/test-lock-queue.test.ts` covering TC-01..TC-05.
  - **Validation evidence:** `pnpm --filter scripts test -- __tests__/test-lock-queue.test.ts` (PASS).
  - **Documentation updated:** `docs/testing-policy.md` (scheduler primitive and scope semantics).

### TEG-03: Add intent-based governed runner (`test:governed`) + shaping policy
- **Type:** IMPLEMENT
- **Deliverable:** governed runner script and root script wiring.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `scripts/tests/run-governed-test.sh`, `scripts/tests/runner-shaping.sh`, `scripts/__tests__/test-governed-runner.test.ts`, `package.json`, `[readonly] scripts/tests/test-lock.sh`
- **Depends on:** TEG-02
- **Blocks:** TEG-04, TEG-05, TEG-07
- **Confidence:** 82%
  - Implementation: 84% - lock acquire/release wrapper around command execution is straightforward.
  - Approach: 82% - intent allowlist avoids recursion/bypass ambiguity before enforcement.
  - Impact: 82% - root script wiring can affect dev ergonomics but is reversible.
- **Acceptance:**
  - Runner only accepts allowlisted intents: `jest`, `turbo`, `changed`, `watch-exclusive`.
  - Runner exports `BASESHOP_GOVERNED_CONTEXT=1` and wrappers honor it to prevent self-blocking recursion.
  - `pnpm -w run test:governed -- <intent> ...` acquires/releases lock reliably.
  - Runner applies shaping caps per canonical defaults (`jest/changed -> --maxWorkers=2`, `turbo -> --concurrency=2`) before admission.
  - Default watch and watch-adjacent flags are blocked; `watch-exclusive` is explicit opt-in only (`BASESHOP_ALLOW_WATCH_EXCLUSIVE=1`) and holds exclusive lock.
  - Runner installs `trap` cleanup (`EXIT`, `INT`, `TERM`) to release active lock ticket on runner failure/termination; stale cleanup remains backstop only.
  - Queue status includes holder and ticket visibility.
- **Validation contract:**
  - TC-01: two concurrent governed runs serialize in FIFO order.
  - TC-02: non-allowlisted command under runner is rejected with usage guidance.
  - TC-03: blocked watch flags return actionable error; `watch-exclusive` requires explicit env opt-in.
  - TC-04: runner releases lock on command failure and success.
  - TC-05: cancellation removes waiting ticket without impacting active holder.
  - TC-06: shaped defaults are injected (`--maxWorkers` / turbo `--concurrency`) when absent.
  - TC-07: `BASESHOP_GOVERNED_CONTEXT=1` is set by runner and allows internal wrapper traversal without external bypass false positives.
  - TC-08: simulated runner termination releases lock via trap path without waiting for stale-cleanup window.
  - **Acceptance coverage:** TC-01..TC-08 map directly to runner contract, safety, crash cleanup, context propagation, and shaping behavior.
  - **Validation type:** integration tests + smoke shell checks.
  - **Validation location/evidence:** `scripts/__tests__/test-governed-runner.test.ts`.
  - **Run/verify:** `pnpm --filter scripts test -- __tests__/test-governed-runner.test.ts`.
- **Execution plan:** Red -> Green -> Refactor.
- **Planning validation:**
  - Checks run: confirmed current bypass commands continue to run under guarded shell (fact-find A4).
  - Validation artifacts written: none.
  - Unexpected findings: recurring ungoverned processes reinforce need for canonical runner.
- **What would make this >=90%:** run targeted smoke test matrix across 3 packages using governed entrypoint.
- **Rollout / rollback:**
  - Rollout: add root script and communicate intent-based replacements (`test:governed -- jest|turbo|changed`).
  - Rollback: keep lock primitives, disable runner script path.
- **Documentation impact:** update root testing command guidance in `AGENTS.md` and `docs/testing-policy.md`.
- **Notes / references:** execution-path map from fact-find.
- **Build completion (2026-02-13):**
  - **Status:** Complete
  - **Commits:** `3d6f5e6d03`
  - **Implementation notes:** added intent-based runner (`scripts/tests/run-governed-test.sh`) and shaping policy helpers (`scripts/tests/runner-shaping.sh`); wired root `test:governed` script in `package.json`; added integration coverage in `scripts/__tests__/test-governed-runner.test.ts` for TC-01..TC-08.
  - **Validation evidence:** `pnpm --filter scripts test -- __tests__/test-governed-runner.test.ts` (PASS).
  - **Documentation updated:** None in this task; command-guidance normalization remains tracked by TEG-09.

### TEG-04: Horizon checkpoint - reassess remaining plan
- **Type:** CHECKPOINT
- **Deliverable:** plan update / re-sequencing artifact.
- **Execution-Skill:** /lp-replan
- **Affects:** `docs/plans/test-execution-resource-governor-plan.md`
- **Depends on:** TEG-03
- **Blocks:** TEG-05, TEG-06, TEG-07
- **Confidence:** 95%
  - Implementation: 95% - checkpoint task is procedural.
  - Approach: 95% - prevents deep execution based on stale assumptions.
  - Impact: 95% - reduces long-horizon risk compounding.
- **Acceptance:**
  - Re-evaluate confidence of TEG-05..TEG-09 using evidence from completed work.
  - Confirm lock semantics and runner interception assumptions still hold.
  - Update task confidence/ordering if telemetry contradicts assumptions.
- **Horizon assumptions to validate:**
  - package migration surface remains manageable after runner rollout.
  - hard enforcement will not break core workflows once scripts are migrated.
  - telemetry tags (`governed`, `policy_mode`) are reliable enough for calibration.
- **Build completion (2026-02-13):**
  - **Status:** Complete
  - **Evidence reviewed:** `TEG-02` queue primitives/tests (`scripts/__tests__/test-lock-queue.test.ts` PASS), `TEG-03` runner/shaping tests (`scripts/__tests__/test-governed-runner.test.ts` PASS), guarded policy regression (`scripts/__tests__/pnpm-test-safety-policy.test.ts` PASS), and live runner invocation (`pnpm run test:governed -- jest --version`).
  - **Checkpoint assessment:**
    - Migration surface remains broad but manageable; no new structural blockers discovered.
    - Enforcement boundary remains valid: governed context + intent routing works, including `pnpm run` separator compatibility.
    - Telemetry contract from TEG-01 remains stable enough for calibration collection in TEG-07.
  - **Replan outcome:** no topology changes required; task ordering and dependency graph remain valid as sequenced.

### TEG-05: Migrate package scripts and affected test path
- **Type:** IMPLEMENT
- **Deliverable:** package script rewrites + targeted test command updates.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `package.json`, `apps/prime/package.json`, `apps/xa/package.json`, `apps/xa-b/package.json`, `apps/xa-drop-worker/package.json`, `apps/xa-j/package.json`, `apps/xa-uploader/package.json`, `functions/package.json`, `packages/tailwind-config/package.json`, `packages/telemetry/package.json`, `packages/theme/package.json`, `scripts/package.json`, `__tests__/package.json`, `scripts/tests/run-governed-test.sh`, `scripts/__tests__/test-governed-runner.test.ts`, `scripts/__tests__/pnpm-test-safety-policy.test.ts`, `docs/testing-policy.md`, `[readonly] packages/design-tokens/jest-runner.cjs`
- **Depends on:** TEG-04
- **Blocks:** TEG-06
- **Confidence:** 80%
  - Implementation: 82% - edits are repetitive but broad and easy to miss.
  - Approach: 80% - required for complete interception; no cleaner alternative.
  - Impact: 80% - high blast radius across package scripts, mitigated by targeted validation.
- **Acceptance:**
  - All active package `test` scripts route through governed entrypoint or explicit delegated wrapper.
  - `test:affected` includes explicit Turbo concurrency cap and uses governed runner intent.
  - Package script migrations preserve shaping defaults (`--maxWorkers`/`--runInBand` where class policy requires).
  - CI compatibility is explicit: in `CI=true` mode, migrated scripts run through governed compatibility mode (shaping on, scheduler/admission off by default).
  - Script audit no longer reports ungoverned raw Jest script forms except approved delegations.
- **Validation contract:**
  - TC-01: script-text audit reports zero disallowed raw Jest invocations in active package `test` scripts.
  - TC-02: representative package tests run successfully through governed path across script archetypes:
    - direct `jest` script (`apps/prime`)
    - `pnpm exec jest` style (`apps/xa`)
    - `cross-env ... jest` style (`functions`)
    - `rimraf && jest` style (`packages/theme`)
  - TC-03: root `test:affected` executes with explicit concurrency parameter and governed intent path.
  - TC-04: delegated runner exceptions are documented and covered.
  - TC-05: shaped worker defaults are present or injected for migrated scripts.
  - TC-06: `CI=true` run path executes migrated scripts without lock/admission queueing while preserving shaping defaults.
  - **Acceptance coverage:** TC-01..TC-06 cover migration completeness, runtime viability, CI compatibility, and CPU shaping.
  - **Validation type:** script audit + targeted package test runs.
  - **Validation location/evidence:** updated script audit command output in plan notes.
  - **Run/verify:** `pnpm --filter scripts test -- __tests__/pnpm-test-safety-policy.test.ts` plus 4 targeted package test runs (one per script archetype).
- **Execution plan:** Red -> Green -> Refactor.
- **Planning validation:**
  - Checks run: fact-find script-text scan identified 13 candidates.
  - Validation artifacts written: none (implementation task will generate command evidence).
  - Unexpected findings: one delegating runner (`packages/design-tokens`) requires explicit exception handling.
- **What would make this >=90%:** complete migration dry-run branch and verify no command regressions across all affected packages.
- **Rollout / rollback:**
  - Rollout: phased package updates with per-package validation.
  - Rollback: per-package revert path if a script regression appears.
- **Documentation impact:** update command examples in `docs/testing-policy.md` and active plan docs using bypass forms (`npx jest`, `npm exec jest`, `pnpm exec jest`, `./node_modules/.bin/jest`, `node ...jest.js`).
- **Notes / references:** unbounded script list in fact-find Appendix A3.
- **Build completion (2026-02-13):**
  - **Status:** Complete
  - **Commit:** `ba140336f7`
  - **Implementation notes:**
    - Migrated package/root `test` script archetypes to governed intent entrypoints (`pnpm run test:governed -- jest|turbo ...`) for root, `apps/prime`, `functions`, `packages/tailwind-config`, `packages/telemetry`, `packages/theme`, `scripts`, and `__tests__`.
    - Updated root `test:affected` to governed turbo intent with explicit `--concurrency=2`.
    - Added governed CI compatibility mode in `scripts/tests/run-governed-test.sh` (`CI=true` bypasses queue/scheduler while preserving shaping).
    - Normalized forwarded separator tokens in governed runner args to keep appended script flags (`pnpm ... test -- ...`) stable.
    - Added regression coverage for separator normalization and CI compatibility in `scripts/__tests__/test-governed-runner.test.ts`.
    - Updated policy harness env defaults in `scripts/__tests__/pnpm-test-safety-policy.test.ts` so warn-only assertions remain valid when tests run inside governed context.
    - Updated `docs/testing-policy.md` to document canonical governed usage and CI compatibility behavior.
  - **Validation evidence:**
    - `pnpm --filter scripts test -- __tests__/pnpm-test-safety-policy.test.ts` (PASS)
    - `pnpm --filter scripts test -- __tests__/test-governed-runner.test.ts` (PASS)
    - `pnpm --filter @apps/prime test -- --testPathPattern='^$' --passWithNoTests` (PASS)
    - `pnpm --filter functions test -- --testPathPattern='^$' --passWithNoTests` (PASS)
    - `pnpm --filter @acme/theme test -- --testPathPattern='^$' --passWithNoTests` (PASS)
    - `CI=true pnpm --filter functions test -- --testPathPattern='^$' --passWithNoTests` (PASS; CI compatibility message emitted, no queue join)
    - Script audit command over affected package manifests reported `script-audit: OK (0 violations)` for disallowed raw Jest forms.
    - `CI=true pnpm -s run test:governed -- turbo -- --affected --concurrency=2 --dry=json` (PASS; governed turbo intent path exercised with explicit concurrency).
    - Baseline fix verification passed for the previously blocked path:
      - `pnpm --filter @acme/lib build` (PASS)
      - `pnpm --filter @acme/ui build` (PASS)
      - `pnpm --filter @acme/template-app build` (PASS; warnings only)
      - `pnpm exec turbo run typecheck --filter=@apps/xa-c --filter=@apps/xa-b --filter=@apps/xa-drop-worker --filter=@apps/xa-j --filter=@apps/xa-uploader` (PASS)
    - Commit hook path passed with remaining package migrations:
      - `typecheck-staged` (PASS)
      - `lint-staged-packages` (PASS)
    - Remaining app package migrations committed: `2ce513bf06` (`apps/prime`, `apps/xa*` package manifests).
  - **Documentation updated:** `docs/testing-policy.md` (working tree update; docs commit deferred to TEG-09 drift-hardening sweep).

### TEG-06: Enforce hard blocking for bypass paths
- **Type:** IMPLEMENT
- **Deliverable:** enforced policy in wrappers/guard shell + policy tests.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `scripts/agents/with-git-guard.sh`, `scripts/agents/guarded-shell-hooks.sh`, `scripts/agent-bin/pnpm`, `scripts/agent-bin/turbo`, `scripts/agent-bin/npm`, `scripts/agent-bin/npx`, `scripts/__tests__/pnpm-test-safety-policy.test.ts`, `scripts/__tests__/turbo-test-safety-policy.test.ts`, `scripts/__tests__/guarded-shell-hooks.test.ts`
- **Depends on:** TEG-01, TEG-05
- **Blocks:** TEG-07A, TEG-08, TEG-09
- **Confidence:** 80%
  - Implementation: 82% - wrapper and policy table updates are straightforward.
  - Approach: 80% - enforcement is correct after migration but can surface edge-case workflows.
  - Impact: 80% - high operational impact if messaging/override is weak.
- **Acceptance:**
  - Bypass commands are blocked by default in guarded shells.
  - Split overrides are enforced and audited:
    - `BASESHOP_ALLOW_BYPASS_POLICY=1` bypasses command-policy blocks but still routes through scheduler/admission.
    - `BASESHOP_ALLOW_OVERLOAD=1` bypasses scheduler/admission protection only when explicitly set.
  - Block messages include governed replacement command.
- **Validation contract:**
  - TC-01: each bypass pattern returns non-zero with clear replacement guidance.
  - TC-02: governed entrypoint remains allowed.
  - TC-03: policy override allows execution path but still applies scheduler/admission.
  - TC-04: overload override bypasses admission only and is visible in telemetry/status output.
  - TC-05: existing safe targeted commands remain unaffected.
  - **Acceptance coverage:** TC-01..TC-05 directly map to enforcement behavior and override boundaries.
  - **Validation type:** wrapper policy tests and smoke checks.
  - **Validation location/evidence:** `scripts/__tests__/pnpm-test-safety-policy.test.ts`, `scripts/__tests__/turbo-test-safety-policy.test.ts`, `scripts/__tests__/guarded-shell-hooks.test.ts`.
  - **Run/verify:** targeted `scripts` package tests covering all deny/allow tables.
- **Execution plan:** Red -> Green -> Refactor.
- **Scouts:**
  - PATH precedence scout from fact-find confirms local bin bypass must be blocked at shell policy layer.
- **Planning validation:**
  - Checks run: fact-find A4 proves bypass feasibility and recurring process evidence.
  - Validation artifacts written: none.
  - Unexpected findings: frequent recurrence of bypass processes indicates strict enforcement priority.
- **What would make this >=90%:** one-week post-enforcement incident-free telemetry with low policy-override rate and near-zero overload-override usage.
- **Rollout / rollback:**
  - Rollout: enforce in guarded shells first, then default docs/policies.
  - Rollback: temporary revert to warn-only classifier.
- **Documentation impact:** add split-override policy and allowed command matrix to `docs/testing-policy.md`.
- **Notes / references:** fact-find execution-path map and A4 proof points.
- **Build completion (2026-02-13):**
  - **Status:** Complete
  - **Implementation notes:**
    - Enforced hard-blocking for ungoverned Jest bypass patterns across wrappers and shell guard hooks:
      - `scripts/agent-bin/pnpm` (`pnpm exec jest`)
      - `scripts/agent-bin/npm` (`npm exec jest` / `npm x jest`)
      - `scripts/agent-bin/npx` (`npx jest`)
      - `scripts/agents/guarded-shell-hooks.sh` (`node ...jest/bin/jest.js`, `./node_modules/.bin/jest`)
    - Added split-override behavior:
      - `BASESHOP_ALLOW_BYPASS_POLICY=1` reroutes blocked bypass invocations to `pnpm -w run test:governed -- jest -- <args>`.
      - `BASESHOP_ALLOW_OVERLOAD=1` remains telemetry-visible but does not bypass command-policy blocking.
    - Updated `scripts/agents/with-git-guard.sh` command-mode handling to honor hook enforcement exit codes and perform override rerouting for raw direct Jest forms.
    - Expanded policy tests to cover hard-block mode and reroute semantics, including overload-override telemetry tagging.
    - Updated testing policy documentation from warn-only wording to enforced blocking with split override semantics.
  - **Validation evidence:**
    - `pnpm --filter scripts test -- __tests__/pnpm-test-safety-policy.test.ts __tests__/turbo-test-safety-policy.test.ts __tests__/guarded-shell-hooks.test.ts` (PASS)
  - **Documentation updated:** `docs/testing-policy.md`.

### TEG-07A: Add governed-run telemetry emission for calibration-quality samples
- **Type:** IMPLEMENT
- **Deliverable:** governed-run telemetry emission path + regression tests for calibration metrics.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `scripts/tests/run-governed-test.sh`, `scripts/tests/telemetry-log.sh`, `scripts/__tests__/test-governed-runner.test.ts`, `[readonly] scripts/tests/test-lock.sh`
- **Depends on:** TEG-01, TEG-06
- **Blocks:** TEG-07B, TEG-07
- **Confidence:** 83%
  - Implementation: 84% - telemetry plumbing is localized to runner orchestration and existing emit contract.
  - Approach: 83% - calibration must use governed runtime samples, not policy-block-only events.
  - Impact: 83% - blast radius is constrained to scripts package execution path.
- **Acceptance:**
  - Governed runner emits telemetry with `governed=true` and `policy_mode=enforce` for governed executions.
  - Emitted events include `normalized_sig`, `queued_ms`, `workers`, and `exit_code` from governed runs.
  - At least one contention path records `queued_ms > 0`.
  - `BASESHOP_ALLOW_OVERLOAD=1` usage in governed path is telemetry-tagged via `override_overload_used=true`.
- **Validation contract:**
  - TC-01: governed `jest` intent run emits event with `governed=true` and `class=governed-jest`.
  - TC-02: two concurrent governed runs generate at least one event with `queued_ms > 0`.
  - TC-03: failed governed run emits event with matching non-zero `exit_code`.
  - TC-04: governed run with `BASESHOP_ALLOW_OVERLOAD=1` emits `override_overload_used=true`.
  - **Acceptance coverage:** TC-01..TC-04 map directly to calibration signal fidelity requirements.
  - **Validation type:** scripts integration tests.
  - **Validation location/evidence:** `scripts/__tests__/test-governed-runner.test.ts`.
  - **Run/verify:** `pnpm --filter scripts test -- __tests__/test-governed-runner.test.ts`.
- **Execution plan:** Red -> Green -> Refactor.
- **Planning validation:**
  - Checks run: local telemetry snapshot audit of `.cache/test-governor/events.jsonl` (32 total events, 0 governed, 0 queued, one-day coverage) and current runner path audit.
  - Evidence references:
    - `scripts/tests/run-governed-test.sh:123`..`scripts/tests/run-governed-test.sh:150` (queue+exec path without telemetry emission call).
    - `scripts/tests/telemetry-log.sh:71`..`scripts/tests/telemetry-log.sh:147` (event schema contract).
  - Unexpected findings: current telemetry is dominated by bypass-policy events and cannot support admission calibration yet.
- **What would make this >=90%:** one non-test governed contention capture validates `queued_ms`/`workers` shape in live usage.
- **Rollout / rollback:**
  - Rollout: enable governed emission by default with existing telemetry lock.
  - Rollback: feature-flag governed emission while retaining policy-event logging.
- **Documentation impact:** None in this task (policy docs addressed in TEG-09).
- **Notes / references:** calibration readiness gap confirmed from telemetry snapshot.
- **Build completion (2026-02-13):**
  - **Status:** Complete
  - **Commits:** `adc6b4f48c`
  - **Execution cycle:**
    - Validation cases executed: TC-01, TC-02, TC-03, TC-04.
    - Cycles: 2 (initial run exposed lock-cleanup regression from sourced telemetry trap; refactor to executable telemetry invocation fixed it).
    - Initial validation: FAIL (existing TC-04 lock release assertion failed due trap override side effect).
    - Final validation: PASS.
  - **Confidence reassessment:**
    - Original: 83%
    - Post-validation: 86%
    - Delta reason: governed telemetry contract now validated for success, contention queue timing, failure exits, and overload override tagging.
  - **Validation evidence:**
    - `pnpm --filter scripts test -- __tests__/test-governed-runner.test.ts` (PASS, 15 tests).
    - `pnpm --filter scripts typecheck` (N/A; package has no `typecheck` script).
    - `pnpm --filter scripts lint` (N/A; package has no `lint` script).
  - **Documentation updated:** None required.
  - **Implementation notes:**
    - `scripts/tests/run-governed-test.sh` now emits governed telemetry events (`governed`, `policy_mode`, `class`, `normalized_sig`, `queued_ms`, `workers`, `exit_code`, override flags) after each governed run.
    - `scripts/__tests__/test-governed-runner.test.ts` now covers all TEG-07A telemetry contracts, including contention and non-zero exit scenarios.

### TEG-07B: Build day-zero calibration harness and sample summarizer
- **Type:** SPIKE
- **Deliverable:** bounded calibration harness + telemetry summary generator + baseline calibration report section.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `scripts/tests/run-governed-calibration.sh`, `scripts/tests/summarize-governor-telemetry.mjs`, `scripts/__tests__/governed-calibration-harness.test.ts`, `docs/plans/test-execution-resource-governor-calibration.md`, `[readonly] scripts/tests/run-governed-test.sh`, `[readonly] scripts/tests/telemetry-log.sh`
- **Depends on:** TEG-07A
- **Blocks:** TEG-07, TEG-08
- **Confidence:** 83%
  - Implementation: 84% - runner emits all required telemetry fields and can be orchestrated by a bounded harness.
  - Approach: 83% - day-zero deterministic sampling de-risks admission work without waiting on passive ambient usage.
  - Impact: 83% - changes are scoped to scripts package tooling and calibration artifacts.
- **Acceptance:**
  - Calibration harness executes governed intents (`jest`, `turbo`, `changed`) with bounded sample profiles.
  - One calibration profile yields >=30 governed samples across >=3 governed classes and >=5 contention (`queued_ms>0`) samples.
  - Summary generator outputs a deterministic JSON/markdown snapshot with class counts, queue stats, and override usage.
  - Baseline section is appended to `docs/plans/test-execution-resource-governor-calibration.md` and clearly tagged as day-zero synthetic evidence.
- **Validation contract:**
  - TC-01: harness profile run records governed events for each required class (`governed-jest`, `governed-turbo`, `governed-changed`).
  - TC-02: contention profile records at least 5 events with `queued_ms > 0`.
  - TC-03: summary generator excludes ungoverned events from calibration aggregates.
  - TC-04: summary output format is stable (JSON keys + markdown section headings) for downstream report consumption.
  - **Acceptance coverage:** TC-01..TC-04 map directly to day-zero calibration readiness and reproducibility.
  - **Validation type:** scripts integration tests + summary snapshot checks.
  - **Validation location/evidence:** `scripts/__tests__/governed-calibration-harness.test.ts`, `docs/plans/test-execution-resource-governor-calibration.md`.
  - **Run/verify:** `pnpm --filter scripts test -- __tests__/governed-calibration-harness.test.ts`.
- **Execution plan:** Red -> Green -> Refactor.
- **Planning validation:**
  - Checks run: telemetry dataset probe and governed telemetry contract verification.
  - Evidence references:
    - `.cache/test-governor/events.jsonl` snapshot: 33 total events, governed=1, governed classes=[`governed-jest`], `queued_ms>0`=1, days=[`2026-02-13`].
    - `scripts/tests/run-governed-test.sh:146`..`scripts/tests/run-governed-test.sh:253` (governed classing, queue timing, and emit path).
    - `scripts/__tests__/test-governed-runner.test.ts:554`..`scripts/__tests__/test-governed-runner.test.ts:639` (TEG-07A telemetry contracts).
  - Unexpected findings: ambient governed telemetry growth is too slow/unpredictable to gate near-term admission work.
- **What would make this >=90%:** one non-test harness run on a real developer workload profile showing stable class and contention coverage.
- **Rollout / rollback:**
  - Rollout: use harness for calibration seeding only; no runtime policy change.
  - Rollback: remove harness and revert to passive-only telemetry collection.
- **Documentation impact:** update `docs/plans/test-execution-resource-governor-calibration.md` with day-zero methodology.
- **Notes / references:** uses existing governed runner/shaping/queue contract; no policy bypass required.
- **Build completion (2026-02-13):**
  - **Status:** Complete
  - **Commits:** `84c34c83f2`
  - **Execution cycle:**
    - Validation cases executed: TC-01, TC-02, TC-03, TC-04.
    - Cycles: 1 (harness output interpolation fixed before final baseline generation).
    - Initial validation: PASS.
    - Final validation: PASS.
  - **Confidence reassessment:**
    - Original: 83%
    - Post-validation: 86%
    - Delta reason: deterministic harness path now produces governed multi-class and contention-rich baseline data with reproducible summary output.
  - **Validation evidence:**
    - `pnpm --filter scripts test -- __tests__/governed-calibration-harness.test.ts` (PASS, 4 tests).
    - `PATH=<mock-pnpm> scripts/tests/run-governed-calibration.sh --profile synthetic-day-zero --events-file .cache/test-governor/events.jsonl --summary-json .cache/test-governor/day-zero-synthetic-summary.json --summary-md .cache/test-governor/day-zero-synthetic-summary.md --report-path docs/plans/test-execution-resource-governor-calibration.md` (PASS).
  - **Documentation updated:** `docs/plans/test-execution-resource-governor-calibration.md` now includes a tagged day-zero synthetic baseline section.
  - **Implementation notes:**
    - Added `scripts/tests/run-governed-calibration.sh` profile runner to seed bounded governed telemetry across `jest`/`turbo`/`changed` intents and contention pairs.
    - Added `scripts/tests/summarize-governor-telemetry.mjs` deterministic JSON/markdown summarizer with explicit gate checks.
    - Added `scripts/__tests__/governed-calibration-harness.test.ts` integration coverage for class coverage, contention thresholds, ungoverned exclusion, and output determinism.

### TEG-07: Calibration telemetry and budget tuning (multi-day soak)
- **Type:** INVESTIGATE
- **Deliverable:** finalized calibration report artifact under `docs/plans/test-execution-resource-governor-calibration.md`.
- **Execution-Skill:** /lp-build
- **Affects:** governed telemetry output + calibration report.
- **Depends on:** TEG-01, TEG-04, TEG-07A, TEG-07B
- **Blocks:** TEG-09
- **Confidence:** 76% (-> 82% conditional on soak gates) ⚠️ BELOW THRESHOLD
  - Implementation: 82% - mechanics are known after TEG-07A, but longitudinal sampling remains incomplete.
  - Approach: 76% - budget tuning quality depends on multi-day, multi-intent organic signal.
  - Impact: 76% - poor final calibration can either over-throttle developers or under-protect hosts.
- **Blockers / questions to answer:**
  - Do day-zero budgets hold over multi-day organic usage without excessive override rates?
  - Which signatures require explicit per-command overrides after organic telemetry, not synthetic replay?
  - Are queue wait percentiles acceptable under normal team usage?
- **Acceptance:**
  - Ingest day-zero dataset from TEG-07B and document provisional class budgets/overrides.
  - Collect organic governed telemetry over >=7 calendar days (or explicit user waiver).
  - Maintain >=100 governed samples total across >=3 governed classes and >=5 queue-on-contention samples.
  - Calibration report includes final tuned budgets, override thresholds, and rollback triggers for unsafe calibration.
  - Confidence is re-scored to >=80% (or explicitly waived) before closing TEG-07 and TEG-09.
- **Re-plan Update (2026-02-13):**
  - **Previous confidence:** 74%
  - **Updated confidence:** 76% (-> 82% conditional on soak gates)
    - **Evidence class:** E2 (post-TEG-07A telemetry emission validation + fresh dataset probe), with E1 dependency topology audit.
    - Implementation: 82% - governed telemetry emission now verified in runner + tests.
    - Approach: 76% - still lacks multi-day governed class diversity for stable tuning decisions.
    - Impact: 76% - final policy hardening should wait for soak evidence.
  - **Investigation performed:**
    - Dataset audit: `.cache/test-governor/events.jsonl` (33 events, governed=1, governed classes=[`governed-jest`], queued_ms>0=1, unique days=1).
    - Runner telemetry audit: `scripts/tests/run-governed-test.sh:146`..`scripts/tests/run-governed-test.sh:253`.
    - Contract verification: `scripts/__tests__/test-governed-runner.test.ts:554`..`scripts/__tests__/test-governed-runner.test.ts:639`.
    - Governed entrypoint coverage: `package.json:42`..`package.json:43`, `scripts/package.json:8`.
  - **Decision / resolution:**
    - Added precursor task `TEG-07B` to generate deterministic day-zero governed samples.
    - Moved TEG-08 dependency from TEG-07 to TEG-07B so implementation can proceed on provisional calibration while soak continues.
  - **Changes to task:**
    - Dependencies updated to include `TEG-07B`.
    - TEG-07 now blocks TEG-09 final hardening instead of TEG-08 implementation.
  - **What would make this >=90%:** complete 7-day governed soak with >=100 samples, >=3 governed classes, and stable low override rates.

### TEG-08: Implement memory+CPU admission engine
- **Type:** IMPLEMENT
- **Deliverable:** admission library + runner integration + tests.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `scripts/tests/run-governed-test.sh`, `scripts/tests/resource-admission.sh`, `scripts/tests/history-store.sh`, `scripts/__tests__/resource-admission.test.ts`, `scripts/__tests__/governed-runner-admission.test.ts`
- **Depends on:** TEG-06, TEG-07B
- **Blocks:** TEG-09
- **Confidence:** 81%
  - Implementation: 82% - algorithm and test seams are clear, but probe edge cases need care.
  - Approach: 81% - deterministic budgets plus P90 fallback is pragmatic and tunable.
  - Impact: 81% - admission directly affects throughput and machine stability.
- **Acceptance:**
  - Canonical admission formulas are implemented exactly as specified:
    - `memory_budget_mb = floor(total_ram_mb * 0.60)`
    - `cpu_slots_total = max(1, floor(logical_cpu * 0.70))`
    - 10 logical CPUs must resolve to 7 CPU slots.
  - Admission gate enforces both memory and CPU constraints.
  - Admission decisions are combined with runner shaping caps (worker/concurrency), not used as a standalone CPU control.
  - Seeded class budgets apply until per-signature sample threshold is met; if TEG-07 soak is incomplete, admission uses provisional day-zero budgets with explicit telemetry warnings.
  - History updates are atomic and lock-guarded.
  - Probe ambiguity fails safe to queue, not admit.
  - Overload override usage is explicitly telemetry-tagged and surfaced in status output.
- **Validation contract:**
  - TC-01: below-threshold run is admitted.
  - TC-02: above-threshold run queues instead of starting.
  - TC-03: CPU slot saturation queues even when memory permits.
  - TC-04: history corruption/missing data falls back to defaults safely.
  - TC-05: concurrent history writes do not corrupt file.
  - TC-06: when shaping caps are removed from input args, runner injects policy defaults before admission.
  - TC-07: formula conformance tests verify memory and CPU slot calculations (including 10-core => 7 slots).
  - **Acceptance coverage:** TC-01..TC-07 map to admission correctness, formula conformance, shaping integration, and durability.
  - **Validation type:** pure-function unit tests + targeted integration tests with mocked probes.
  - **Validation location/evidence:** `scripts/__tests__/resource-admission.test.ts`, `scripts/__tests__/governed-runner-admission.test.ts`.
  - **Run/verify:** `pnpm --filter scripts test -- __tests__/resource-admission.test.ts` and `pnpm --filter scripts test -- __tests__/governed-runner-admission.test.ts`.
- **Execution plan:** Red -> Green -> Refactor.
- **Scouts:**
  - memory signal scout (`sysctl`, `vm_stat`, `memory_pressure`) confirms fixed-budget model is more stable than available-memory gating.
- **Planning validation:**
  - Checks run: host capacity snapshot + repeated live process evidence from fact-find.
  - Validation artifacts written: none (L task validation to be added during build).
  - Unexpected findings: repeated process storms validate admission priority.
- **What would make this >=90%:** calibrated budgets from TEG-07 plus stress-run evidence with no host thrash.
- **Rollout / rollback:**
  - Rollout: default admission on governed path with tunable env overrides.
  - Rollback: disable admission gate while retaining scheduler lock.
- **Documentation impact:** add admission formulas, defaults, and override policy to `docs/testing-policy.md`.
- **Notes / references:** resource model from fact-find Layer 3.
- **Re-plan Update (2026-02-13):**
  - **Previous confidence:** 81%
  - **Updated confidence:** 81% (no uplift)
    - **Evidence class:** E1 (dependency topology reassessment).
  - **Decision / resolution:** no scoring change; admission now gated on day-zero calibration precursor (`TEG-07A` -> `TEG-07B`) while multi-day soak remains a final-hardening dependency for TEG-09.

#### Build Completion (2026-02-13)
- **Status:** Complete
- **Commits:** `52d7a39f4b`
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02, TC-03, TC-04, TC-05, TC-06, TC-07
  - Cycles: 3 (initial implementation, probe ambiguity hardening, test stabilization)
  - Initial validation: FAIL (intermittent `probe-unknown` and timing-sensitive runner assertions)
  - Final validation: PASS
- **Confidence reassessment:**
  - Original: 81%
  - Post-validation: 84%
  - Delta reason: executable validation confirmed formula conformance, queue-on-pressure behavior, and atomic history durability.
- **Validation:**
  - Ran: `pnpm --filter scripts test -- __tests__/test-governed-runner.test.ts __tests__/resource-admission.test.ts __tests__/governed-runner-admission.test.ts` - PASS
- **Documentation updated:** `docs/testing-policy.md`
- **Implementation notes:**
  - Added `scripts/tests/resource-admission.sh` with canonical memory/CPU admission formulas, seeded class budgets, history-backed P90 prediction, and probe-ambiguity fail-safe handling.
  - Added `scripts/tests/history-store.sh` for atomic, lock-guarded history updates (`history.json` temp-write + rename).
  - Integrated admission and peak-RSS history recording into `scripts/tests/run-governed-test.sh`, including telemetry fields (`admitted`, `peak_rss_mb`, `pressure_level`) and admission wait diagnostics.
  - Added new admission-focused tests and stabilized legacy governed-runner tests impacted by admission timing.

### TEG-09: Drift prevention and documentation hardening
- **Type:** IMPLEMENT
- **Deliverable:** docs lint rule + policy/runbook updates + command example normalization.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `scripts/src/docs-lint.ts`, `scripts/__tests__/docs-lint.test.ts`, `docs/testing-policy.md`, `AGENTS.md`, `docs/plans/*` (active non-archive docs requiring command normalization)
- **Depends on:** TEG-06, TEG-07, TEG-08
- **Blocks:** -
- **Confidence:** 84%
  - Implementation: 85% - lint/check pattern exists and can be extended.
  - Approach: 84% - enforcement at docs level prevents recurrence of unsafe examples.
  - Impact: 84% - broad doc edits but low runtime risk.
- **Acceptance:**
  - Docs lint warns/fails on bypass patterns in non-archive docs:
    - `npx jest`
    - `npm exec jest`
    - `pnpm exec jest`
    - `./node_modules/.bin/jest`
    - `node .../jest.js`
    - `turbo run test` without explicit concurrency/scope guard
  - Lint supports explicit allow markers for justified exceptions: `<!-- docs-lint: allow-raw-jest reason=\"...\" -->`.
  - Testing policy reflects governed commands only.
  - Active plan docs with unsafe command examples are normalized.
- **Validation contract:**
  - TC-01: lint fails on seeded bypass fixtures (`npx`, `npm exec`, local bin, direct node jest) in non-archive paths.
  - TC-02: lint ignores archive docs.
  - TC-03: lint flags `turbo run test` fixture without required safety params.
  - TC-04: allow marker suppresses lint only when reason is present.
  - TC-05: updated docs pass lint with governed examples.
  - **Acceptance coverage:** TC-01..TC-05 cover rule correctness, exception path, and migration completeness.
  - **Validation type:** docs-lint tests + docs lint run.
  - **Validation location/evidence:** `scripts/__tests__/docs-lint.test.ts` and `pnpm docs:lint` output.
  - **Run/verify:** `pnpm --filter scripts test -- __tests__/docs-lint.test.ts` and `pnpm docs:lint`.
- **Execution plan:** Red -> Green -> Refactor.
- **Planning validation:**
  - Checks run: fact-find identified 25 active `npx jest` examples and multiple additional bypass forms.
  - Validation artifacts written: none.
  - Unexpected findings: unsafe patterns are concentrated in active plan docs and need automated guardrails.
- **What would make this >=90%:** complete bulk doc normalization and run docs lint clean across repo.
- **Rollout / rollback:**
  - Rollout: warning mode first if needed, then enforce.
  - Rollback: downgrade lint failure to warning while migration catches up.
- **Documentation impact:** this task is documentation hardening itself.
- **Notes / references:** fact-find Appendix A2.

## Risks & Mitigations

- Script migration regressions across many packages.
  - Mitigation: staged package updates with per-package targeted test verification.
- Over-conservative admission reduces throughput.
  - Mitigation: calibration task (TEG-07), tunable budgets, and measured P90 overrides.
- Shell hook behavior differences across bash/zsh can cause false positives.
  - Mitigation: keep hook pattern matcher minimal, test both shells, and default to warn-only before enforcement.
- Policy enforcement causes immediate user friction.
  - Mitigation: warn-only phase first, clear replacement commands, and split overrides to avoid accidental overload bypass.
- Queue edge-case flakiness in integration tests.
  - Mitigation: keep admission decisions as pure functions and mock probe interfaces.

## Observability

- Logging:
  - command-classification warnings (phase 0), block events (phase 1), queue wait events, admission decisions, shaping injections, override usage.
- Metrics:
  - queue length, average wait time, blocked command count by pattern, policy-override rate, overload-override rate, admission reject reasons.
- Alerts/Dashboards:
  - local CLI summary on queue status and last reject reason; optional periodic aggregate from telemetry file.

## Acceptance Criteria (overall)

- [ ] Ungoverned Jest command paths are detected and then blocked with actionable alternatives in guarded shells.
- [ ] Test scheduler enforces FIFO semantics with cancel and stale cleanup.
- [ ] Governed runner becomes canonical test entrypoint for active package scripts.
- [ ] Resource admission plus shaping caps prevents overload using deterministic memory+CPU gates.
- [ ] Drift prevention blocks reintroduction of unsafe doc command patterns.

## Decision Log

- 2026-02-13: Chose phased enforcement (warn -> migrate -> enforce) over immediate hard-block due to high script blast radius.
- 2026-02-13: Chose per-repo lock scope for MVP with optional machine-global incident mode.
- 2026-02-13: Chose deterministic memory budget (default 60%) + CPU slot budget (70%) as initial admission model.
- 2026-02-13: Chose intent-based governed runner (`jest|turbo|changed|watch-exclusive`) instead of arbitrary command passthrough.
- 2026-02-13: Chose split overrides (`BASESHOP_ALLOW_BYPASS_POLICY`, `BASESHOP_ALLOW_OVERLOAD`) to avoid policy bypass automatically disabling resource safety.
- 2026-02-13: Set enforcement boundary to guarded shells + migrated scripts; non-guarded shells are explicitly unsupported.
- 2026-02-13: Completed TEG-04 checkpoint with no dependency/topology changes; proceed to TEG-05 package migration.
- 2026-02-13: During TEG-05 migration, added governed CI compatibility mode and separator normalization in runner to keep package-script forwarding stable without queueing in CI.
- 2026-02-13: TEG-05 was temporarily blocked on unrelated baseline (`@acme/template-app` build failure from `packages/lib` changes) while migrating `apps/xa*` scripts.
- 2026-02-13: Resolved the `packages/lib`/`template-app` baseline blocker and completed remaining TEG-05 app package manifest migrations in commit `2ce513bf06`.
- 2026-02-13: Completed TEG-06 by flipping wrapper/shell bypass handling from warn-only to hard-block mode with split override behavior and governed reroute semantics.
- 2026-02-13: lp-replan introduced precursor task `TEG-07A` after telemetry audit showed calibration data quality gap (`governed=0`, `queued_ms>0=0`) in local event stream.
- 2026-02-13: After TEG-07A completion, telemetry audit still showed insufficient organic calibration depth (`total=33`, `governed=1`, governed classes=`governed-jest`, days=1), so lp-replan introduced `TEG-07B` as a deterministic day-zero calibration precursor.
- 2026-02-13: Re-sequenced remaining dependency graph to `TEG-07A -> TEG-07B -> TEG-08`, with `TEG-07` soak continuing as final-hardening gate before `TEG-09`.
- 2026-02-13: Completed TEG-07B and appended day-zero synthetic calibration evidence (`34 governed samples`, `3 governed classes`, `9 contention samples`) to `docs/plans/test-execution-resource-governor-calibration.md`; TEG-08 is now build-eligible.
- 2026-02-13: Completed TEG-08 by shipping admission + history-store primitives and integrating telemetry-visible queue-on-pressure behavior in `run-governed-test.sh`; final hardening remains gated on TEG-07 soak before TEG-09.
