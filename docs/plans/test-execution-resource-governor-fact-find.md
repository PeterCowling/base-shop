---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Testing/Infra
Last-reviewed: 2026-02-13
Relates-to: docs/testing-policy.md
Workstream: Engineering
Created: 2026-02-13
Last-updated: 2026-02-13
Feature-Slug: test-execution-resource-governor
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: lp-build
Supporting-Skills: lp-replan, ops-ship
Related-Plan: docs/plans/test-execution-resource-governor-plan.md
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID:
---

# Test Execution Resource Governor - Fact-Find Brief

## Document Intent and Audience

This brief is structured for two audiences:
- Portable readers (no repo access): plain-language problem statement, controls, rollout, and decisions.
- Repo readers: reproducible audit appendix with exact commands, snapshot SHA, and full result lists.

If you cannot access the repository, treat Appendix A as an audit log snapshot.

## Problem Statement (Plain Language)

Current local test safety is not strong enough for machine stability on bursty agent/human workflows.

Observed and confirmed risks:
- Multiple independent test runs can start concurrently from separate terminals/agents.
- A single allowed command can still fan out internally (Turbo tasks + Jest workers).
- Several execution paths bypass guardrails entirely.

Primary goal:
Create the test equivalent of Git write protection: policy enforcement + scheduler + resource admission.

## Scope Boundary (Local vs CI)

This initiative is scoped to local and agent-driven development environments first.

CI behavior for Phases 0-3:
- CI remains on existing test entrypoints and CI-specific limits.
- Governor logic is local-default and CI-opt-out by default (`CI=true` path does not queue on shared CI workers).
- CI adoption is a separate follow-on decision after local stability is proven.

## Failure Modes and Primary Controls

| Failure mode | What breaks | Primary control |
| --- | --- | --- |
| FM-1: Multi-terminal collisions | Independent test trees compete for RAM/CPU | Global test scheduler with FIFO queue |
| FM-2: Internal fan-out from one command | One command spawns too many workers/tasks | Turbo concurrency cap + Jest worker caps |
| FM-3: Command-path bypass | Tests run outside governance entrypoint | Shell policy guard + leaf script normalization |
| FM-4: Long-lived watch starvation | Queue blocked indefinitely by watch process | Explicit watch policy (block by default) |

## Current Execution-Path Map

| Command path | Guarded today | Gap | Control point required |
| --- | --- | --- | --- |
| `pnpm test` at workspace root | Yes (`guard-broad-test-run.cjs`) | None for this exact path | Keep as-is |
| `turbo run test --affected` | Scope-guarded (`agent-bin/turbo`) | Can still fan out internally | Add explicit Turbo concurrency cap |
| `pnpm --filter <pkg> test -- <selector>` | Partially (`agent-bin/pnpm`) | No global scheduling/admission | Route through scheduler/governor |
| `pnpm --filter <pkg> exec jest ...` | Not blocked in current policy | Bypasses governance | Guard + reroute or block |
| `npm exec jest ...` | Not guarded | Full bypass | Shell policy guard + leaf normalization |
| `npx jest ...` | Not guarded | Full bypass | Shell policy guard + leaf normalization |
| `./node_modules/.bin/jest ...` | Not guarded | Full bypass | Shell policy guard + leaf normalization |
| `node ./node_modules/jest/bin/jest.js ...` | Not guarded | Full bypass | Shell policy guard (raw command matching) |
| package script: `test: "jest ..."` | Wrapper not reliable | `node_modules/.bin` precedes guard bin | Migrate scripts to governed entrypoint |

## Key Audit Findings

1. Existing controls are real but narrow:
- Broad root test fan-out is blocked.
- Unscoped Turbo test fan-out is blocked.
- Targeted test helper paths already exist.

2. Enforcement is not complete on real execution paths:
- `npx jest`, `npm exec jest`, and direct `node .../jest.js` are viable.
- `pnpm exec jest` is currently admissible under wrapper logic.

3. Wrappers alone are insufficient for package-script interception:
- In package scripts, `node_modules/.bin` is prepended to `PATH` ahead of agent guard bin.
- A `scripts/agent-bin/jest` wrapper therefore does not reliably intercept `npm/pnpm run test` script resolution.

4. No test scheduler exists yet:
- There is no test lock/queue analog to `scripts/git/writer-lock.sh`.

5. Resource governance is missing:
- No memory/CPU admission model currently gates local test starts.

## Design Model (Three Layers)

### Layer 1: Command Guard (Policy)

Purpose: decide which commands are allowed and which must route through governor entrypoints.

Required behavior:
- Detect disallowed raw test invocations in guarded shells:
  - `npx jest ...`
  - `npm exec jest ...`
  - `pnpm exec jest ...`
  - `./node_modules/.bin/jest ...`
  - `node .../jest/bin/jest.js ...`
- Provide exact replacement command in error/warn output.
- Support staged rollout:
  - Phase 1a: warn-only telemetry.
  - Phase 1b: hard-block after observed command distribution is stable.

Important feasibility constraint:
- Wrapper scripts (`agent-bin/*`) are useful but not sufficient.
- Reliable interception for package-script and absolute-path cases needs either:
  - shell preexec policy in guarded agent shells, and/or
  - leaf script normalization so package `test` scripts call repo-owned governed wrappers.

Decision for this initiative:
- Treat leaf script normalization as required for complete enforcement, not optional cleanup.

Package script normalization target (concrete pattern):
- Root-level governed entrypoint to implement:
  - `pnpm -w run test:governed -- <runner and args>`
- Package `test` script migration example:
  - Before: `"test": "pnpm exec jest --config ../../jest.config.cjs"`
  - After: `"test": "pnpm -w run test:governed -- jest --config ../../jest.config.cjs --maxWorkers=2"`

### Layer 2: Scheduler (Queue + Fairness)

Purpose: prevent concurrent roots from overwhelming the machine.

Proposed component:
- `scripts/tests/test-lock.sh` with:
  - `acquire --wait --timeout --ticket-file`
  - `release --ticket <id>`
  - `cancel --ticket <id>`
  - `status`
  - `clean-stale`

Queue semantics:
- FIFO ordering.
- Ticket cancellation removes queued entries immediately.
- Dead ticket cleanup on holder PID exit.

Lock holder crash detection mechanism:
- Lock payload stores `holder_pid`, `holder_start_ts`, `last_heartbeat_ts`, and command signature.
- Holder updates heartbeat on a short interval (for example, every 5 seconds).
- Waiters use `kill -0 <holder_pid>` plus heartbeat age threshold to detect stale holders.
- If PID is dead or heartbeat exceeds stale threshold, lock becomes reclaimable via `clean-stale`.

Lock scope decision:
- Default: per-repo lock key (hash of canonical repo root path).
- Optional: machine-global lock mode via explicit env flag for incident response.

Queue priority decision:
- MVP uses strict FIFO only (no human/agent priority lane) for deterministic behavior and easier debugging.
- Priority classes are deferred until telemetry proves FIFO causes unacceptable human wait times.

Watch mode policy:
- MVP: block watch mode under governor (`--watch`, `--watchAll`, `--watchman`) with clear message.
- MVP also blocks interactive watch-adjacent patterns unless explicitly one-shot (`--onlyChanged`, `--lastCommit`, `--changedSince` must include `--watch=false` when routed through governor).
- Later: add explicit long-slot class only if demand is proven.

### Layer 3: Resource Model (Admission)

Purpose: decide run-now vs queue based on bounded memory and CPU budgets.

Admission model (MVP, deterministic and stable):
- `total_ram_mb`: from `sysctl -n hw.memsize`.
- `memory_budget_mb = floor(total_ram_mb * memory_budget_pct)`.
- `memory_budget_pct` default: `0.60` (tunable via env after calibration).
- `running_test_rss_mb`: RSS sum for tracked governor-managed test process trees.
- `predicted_peak_mb`: command-class budget (then P90 historical override).
- `cpu_slots_total = max(1, floor(logical_cpu * 0.70))`.
- `cpu_slots_needed`: estimated workers for requested class.

Admit when both are true:
- `running_test_rss_mb + predicted_peak_mb <= memory_budget_mb`
- `running_cpu_slots + cpu_slots_needed <= cpu_slots_total`

Why this model:
- Avoids oscillation from fragile "available memory" signals.
- Uses fixed budget from total RAM + explicit CPU guard.
- Fails safe by queueing when probes are uncertain.

Budget rationale:
- `0.60` memory budget reserves `40%` for OS + IDE + browser + background tooling.
- On 16 GB hosts this yields ~9.6 GB for test working set, intentionally conservative for local usability.
- Both memory and CPU budget factors are explicitly tunable after calibration data is collected.

Initial predictor seeding (before history exists):

| Command class | Initial `predicted_peak_mb` | Initial `cpu_slots_needed` |
| --- | --- | --- |
| single-test-file (`--runTestsByPath`, one file) | 1200 | 1 |
| targeted-related (`--findRelatedTests`, <= 5 files) | 1800 | 2 |
| package-targeted (`pnpm --filter <pkg> test -- <selector>`) | 2800 | 2 |
| package-unbounded (allowed only via governed override) | 3600 | 3 |
| affected-sweep (`turbo run test --affected`) | 4800 | 4 |

Seeding behavior:
- Use table defaults until command signature has at least 5 successful samples.
- After 5+ samples, use rolling P90 observed peak for that signature.
- If history is missing/corrupt, fall back to class default and fail-safe queue on probe errors.

Process accounting approximation:
- Use RSS sum as approximation of working set.
- Known over/under-count risk is acceptable for conservative admission.
- Default behavior on probe ambiguity: queue (not admit).

Predictor history storage:
- Store observations in `.cache/test-governor-history.json`.
- Write updates only while scheduler lock is held.
- Use temp-write + atomic rename on each update.
- Periodically compact entries by command signature and keep rolling window.

## Minimal Viable Enforcement That Actually Bites

### Phase 0: Instrumentation (warn-only)

- Add shell-level command classifier in guarded shells.
- Log all blocked-candidate command patterns with normalized signatures.
- Emit non-blocking warning + governed alternative.

Exit criterion:
- At least 7 calendar days of telemetry and at least 100 normalized command samples.

### Phase 1: Hard policy + fan-out caps

- Flip warnings to blocking for bypass patterns.
- Update `test:affected` and/or guarded Turbo entrypoints with explicit concurrency cap.
- Begin leaf-level package script migration to governed entrypoint.

Exit criterion:
- No remaining active package test script that directly invokes raw Jest without governed wrapper.

### Phase 2: Scheduler

- Implement `test-lock.sh` FIFO queue and cancellation semantics.
- Route governed test entrypoint through scheduler acquire/release.

Exit criterion:
- Proven serialization under contention in integration tests.

### Phase 3: Resource admission

- Add deterministic memory+CPU admission checks before run start.
- Add predictor history write/read path with atomic updates.
- Queue instead of reject on temporary pressure.

Exit criterion:
- Controlled stress test shows queueing instead of host thrash.

Phase 3 go-live blockers:
- Minimum telemetry baseline captured:
  - 20+ governed runs across at least 3 command classes.
  - 5+ queue-on-pressure events to validate admission behavior.
- Initial class budgets reviewed against observed peaks and adjusted before default enablement.
- History file concurrency behavior validated (atomic write + lock-held update path).

### Phase 4: Drift prevention

- Add docs lint rule warning/failing on raw `npx jest` patterns in non-archive docs.
- Add policy tests covering all bypass command forms.

Exit criterion:
- New docs/scripts cannot reintroduce disallowed invocation patterns silently.

## Validation Strategy

Unit tests (primary):
- Pure-function admission decision tests (memory + CPU).
- Pure-function command classification tests.
- Queue state transition tests (ticket lifecycle, cancel, stale cleanup).

Integration tests (limited and targeted):
- Lock FIFO ordering under two-to-three contenders.
- Cancel queued ticket behavior.
- Wrapper/policy smoke tests for blocked patterns.

Flakiness controls:
- Keep OS process probing behind mockable interfaces (`MemoryProbe`, `ProcessProbe`).
- Run only a small set of real process integration tests.

## Risks, Unknowns, and Mitigations

- Risk: strict blocking breaks existing operator habits.
  - Mitigation: warn-only Phase 0 with telemetry before enforcement.

- Risk: per-repo lock still allows cross-repo host contention.
  - Mitigation: optional machine-global incident mode.

- Risk: watch mode causes starvation.
  - Mitigation: block watch in MVP.

- Risk: predictor drift or corruption.
  - Mitigation: lock-guarded atomic writes + bounded rolling history.

## Planning Readiness

Status: ready for planning with concrete controls and reproducible evidence.

First implementation scope recommended:
1. Phase 0 and Phase 1 (policy path hardening + Turbo fan-out cap + leaf migration start).
2. Phase 2 scheduler skeleton with FIFO and cancel semantics.

## Appendix A - Reproducible Audit Snapshot

Audit snapshot SHA:
- `c6650f2e91dd51a5ecd25b16118086b6b5291c9d`

Audit timestamp (UTC):
- `2026-02-13T18:21:13Z`

Host capacity snapshot:
- `sysctl -n hw.memsize` -> `17179869184` (16 GB)
- `sysctl -n hw.logicalcpu` -> `10`

### A1. Commands Used

```bash
# Snapshot identity
git rev-parse HEAD
date -u +%Y-%m-%dT%H:%M:%SZ
sysctl -n hw.memsize && sysctl -n hw.logicalcpu

# Find ungoverned doc command patterns
rg -n "\bnpx jest\b" docs/plans --glob '!docs/plans/archive/**' --glob '!docs/plans/test-execution-resource-governor-fact-find.md'
rg -n "\bnpx jest\b" docs/plans --glob '!docs/plans/archive/**' --glob '!docs/plans/test-execution-resource-governor-fact-find.md' | wc -l

# Find unbounded Jest package test scripts (script-text scan)
node -e 'const fs=require("fs"),path=require("path");function walk(d,arr=[]){for(const n of fs.readdirSync(d,{withFileTypes:true})){if(n.name==="node_modules"||n.name.startsWith("."))continue;const p=path.join(d,n.name);if(n.isDirectory())walk(p,arr);else if(n.isFile()&&n.name==="package.json")arr.push(p);}return arr;}const files=walk(".");const rows=[];for(const f of files){try{const j=JSON.parse(fs.readFileSync(f,"utf8"));const t=j?.scripts?.test;if(typeof t!=="string")continue;const hasJest=/\bjest\b/.test(t);if(!hasJest)continue;const bounded=/--runInBand|--maxWorkers/.test(t);if(!bounded)rows.push({file:f.replace(/^\.\//,""),script:t});}catch{}}rows.sort((a,b)=>a.file.localeCompare(b.file));console.log(`UNBOUNDED_JEST_TEST_SCRIPTS=${rows.length}`);for(const r of rows)console.log(`${r.file}\t${r.script}`);'

# Validate guard coverage gaps empirically
scripts/agents/with-git-guard.sh -- bash -lc 'cd apps/prime && npm run env --silent | rg "^PATH="'
scripts/agents/with-git-guard.sh -- node ./node_modules/jest/bin/jest.js --version
scripts/agents/with-git-guard.sh -- pnpm --filter ./packages/guide-system exec jest --version
pgrep -fl jest

# Test-lock script presence check
rg --files scripts | rg 'test-lock|run-governed-test|tests/.+lock|tests/.+govern' || true
```

### A2. Full Result: `npx jest` Matches in Active Plans

Count:
- `25`

Matches:
- `docs/plans/prime-find-booking-api-fix-fact-find.md:136`
- `docs/plans/composite-email-templates-fact-find.md:94`
- `docs/plans/bottleneck-locator-plan.md:279`
- `docs/plans/bottleneck-locator-plan.md:332`
- `docs/plans/bottleneck-locator-plan.md:377`
- `docs/plans/bottleneck-locator-plan.md:421`
- `docs/plans/bottleneck-locator-plan.md:470`
- `docs/plans/bottleneck-locator-plan.md:512`
- `docs/plans/prime-hardcoded-copy-i18n-remediation-plan.md:523`
- `docs/plans/prime-hardcoded-copy-i18n-remediation-plan.md:592`
- `docs/plans/prime-hardcoded-copy-i18n-remediation-plan.md:593`
- `docs/plans/hypothesis-portfolio-manager-plan.md:207`
- `docs/plans/hypothesis-portfolio-manager-plan.md:321`
- `docs/plans/hypothesis-portfolio-manager-plan.md:362`
- `docs/plans/advanced-similarity-metrics-plan.md:173`
- `docs/plans/advanced-similarity-metrics-plan.md:218`
- `docs/plans/advanced-similarity-metrics-plan.md:262`
- `docs/plans/advanced-similarity-metrics-plan.md:309`
- `docs/plans/advanced-similarity-metrics-plan.md:352`
- `docs/plans/advanced-similarity-metrics-plan.md:383`
- `docs/plans/advanced-similarity-metrics-plan.md:387`
- `docs/plans/growth-accounting-kernel-plan.md:168`
- `docs/plans/growth-accounting-kernel-plan.md:286`
- `docs/plans/growth-accounting-kernel-plan.md:322`
- `docs/plans/growth-accounting-kernel-plan.md:356`

### A3. Full Result: Unbounded Jest Script-Text Scan

Command result:
- `UNBOUNDED_JEST_TEST_SCRIPTS=13`

Full list:
- `__tests__/package.json` -> `jest --config ../jest.config.cjs`
- `apps/prime/package.json` -> `jest --config jest.config.cjs --passWithNoTests`
- `apps/xa-b/package.json` -> `pnpm exec jest --config ../../jest.config.cjs`
- `apps/xa-drop-worker/package.json` -> `pnpm exec jest --config ../../jest.config.cjs`
- `apps/xa-j/package.json` -> `pnpm exec jest --config ../../jest.config.cjs`
- `apps/xa-uploader/package.json` -> `pnpm exec jest --config ../../jest.config.cjs`
- `apps/xa/package.json` -> `pnpm exec jest --config ../../jest.config.cjs`
- `functions/package.json` -> `cross-env JEST_FORCE_CJS=1 jest --config ../jest.config.cjs`
- `packages/design-tokens/package.json` -> `pnpm exec node ./jest-runner.cjs`
- `packages/tailwind-config/package.json` -> `pnpm exec jest --config ./jest.config.cjs`
- `packages/telemetry/package.json` -> `rimraf dist && jest --config ../../jest.config.cjs`
- `packages/theme/package.json` -> `rimraf dist && jest --config ../../jest.config.cjs`
- `scripts/package.json` -> `cross-env JEST_FORCE_CJS=1 jest --config ../jest.config.cjs`

Note:
- This is a script-text detector; it intentionally flags delegating runners (for example, `packages/design-tokens/package.json`) for manual confirmation.

### A4. Empirical Proof Points for Wrapper Limitations

1. Package-script PATH precedence still favors local bins:
- Command:
  - `scripts/agents/with-git-guard.sh -- bash -lc 'cd apps/prime && npm run env --silent | rg "^PATH="'`
- Observed:
  - PATH starts with `apps/prime/node_modules/.bin` before `scripts/agent-bin`.

2. Direct Node Jest path executes under guarded shell:
- Command:
  - `scripts/agents/with-git-guard.sh -- node ./node_modules/jest/bin/jest.js --version`
- Result:
  - `29.7.0`

3. `pnpm exec jest` executes under guarded shell:
- Command:
  - `scripts/agents/with-git-guard.sh -- pnpm --filter ./packages/guide-system exec jest --version`
- Result:
  - `29.7.0`

4. Direct local-bin Jest path appears in live process trees:
- Command:
  - `pgrep -fl jest`
- Observed:
  - active commands include `./node_modules/.bin/jest ...` when tests are started outside governed entrypoints.

5. No existing test-lock/governor scripts found:
- Command:
  - `rg --files scripts | rg 'test-lock|run-governed-test|tests/.+lock|tests/.+govern' || true`
- Result:
  - no matches

## Pending Audit Work

- Verify Linux probe parity for devcontainers/CI before cross-platform rollout.
- Confirm whether machine-global lock mode is needed in daily usage or only as incident control.
