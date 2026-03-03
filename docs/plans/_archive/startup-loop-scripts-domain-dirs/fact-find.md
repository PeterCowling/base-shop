---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Infra
Workstream: Engineering
Created: 2026-03-03
Last-updated: 2026-03-03
Feature-Slug: startup-loop-scripts-domain-dirs
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Trigger-Source: dispatch-routed
Dispatch-ID: IDEA-DISPATCH-20260303120000-0132
Trigger-Why: 79 TypeScript files in one flat directory. Domain groups (self-evolving, ideas, diagnostics, website, build) are only distinguishable by filename prefix. As more files are added, grep becomes the only navigation method.
Trigger-Intended-Outcome: "type: operational | statement: Domain subdirectories created (self-evolving/, ideas/, diagnostics/, website/, build/, s10/, s2/, baselines/). All import paths and test references updated. TypeScript compilation clean. | source: operator"
---

# Startup Loop Scripts Domain Dirs — Fact-Find Brief

## Scope

### Summary

`scripts/src/startup-loop/` contains 79 `.ts` source files in a single flat directory (plus 7 files in an existing `naming/` subdirectory and 72 test files in `__tests__/`). Files are distinguishable only by filename prefix (`self-evolving-*`, `lp-do-ideas-*`, `s10-*`, etc.). The investigation classifies every file into a domain group, maps all internal imports and test references, and assesses the effort required to reorganise into subdirectories.

### Goals

- Classify all 79 root-level `.ts` files by domain group
- Map all internal import relationships and identify cross-domain dependencies
- Map all 72 test files to their source files and document import update scope
- Identify files that should remain at root (cross-cutting infrastructure)
- Assess package.json script entries that reference startup-loop file paths

### Non-goals

- Reorganising `__tests__/` into domain subdirectories (test files stay flat, only imports updated)
- Adding TypeScript path aliases or barrel exports (identified as adjacent-later in dispatch)
- Reorganising the `naming/` subdirectory (already structured)

## Outcome Contract

- **Why:** 79 TypeScript files in one flat directory. Domain groups (self-evolving, ideas, diagnostics, website, build) are only distinguishable by filename prefix. As more files are added, grep becomes the only navigation method.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Domain subdirectories created (self-evolving/, ideas/, diagnostics/, website/, build/, s10/, s2/, baselines/). All import paths and test references updated. TypeScript compilation clean.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `scripts/src/startup-loop/` — 79 `.ts` source files at root level, 7 in `naming/`, 72 test files in `__tests__/`

### Key Modules / Files

#### Domain Classification (79 files → 8 domains + 13 root)

| Domain | Count | Files |
|---|---|---|
| **self-evolving/** | 21 | self-evolving-actuator, -autofix, -backbone, -boundary, -candidates, -containers, -contracts, -dashboard, -detector, -events, -experiment, -from-ideas, -index, -lifecycle, -orchestrator, -pilot, -release-controls, -replay, -report, -scoring, -startup-state |
| **ideas/** | 15 | lp-do-ideas-autonomous-gate, -classifier, -fingerprint, -live-hook, -live, -metrics-rollup, -metrics-runner, -persistence, -propagation, -queue-audit, -queue-state-completion, -registry-migrate-v1-v2, -routing-adapter, -trial-queue, -trial |
| **diagnostics/** | 8 | bottleneck-detector, bottleneck-history, diagnosis-snapshot, event-validation, funnel-metrics-extractor, growth-metrics-adapter, metrics-aggregate, validate-process-assignment |
| **website/** | 6 | compile-website-content-packet, lint-website-content-packet, map-artifact-delta-to-website-backlog, map-logistics-policy-blocks, materialize-site-content-payload, website-iteration-throughput-report |
| **baselines/** | 5 | baseline-merge, baseline-priors, learning-compiler, learning-ledger, prior-update-writer |
| **build/** | 4 | generate-build-summary, generate-process-improvements, lp-do-build-event-emitter, lp-do-build-reflection-debt |
| **s2/** | 4 | hospitality-scenarios, market-intelligence-pack-lint, s2-market-intelligence-handoff, s2-operator-capture |
| **s10/** | 3 | s10-diagnosis-integration, s10-growth-accounting, s10-learning-hook |
| **root (stay)** | 13 | cass-retrieve, contract-lint, derive-state, generate-stage-operator-views, manifest-update, mcp-preflight, mcp-preflight-config, recovery, replan-trigger, run-concurrency, s6b-gates, stage-addressing, stage-id-compat |

#### Root-staying rationale

The 13 files that remain at root are cross-cutting infrastructure with no strong domain affinity:
- **State/control plane:** derive-state, manifest-update, recovery, run-concurrency, replan-trigger
- **Stage addressing:** stage-addressing, stage-id-compat, generate-stage-operator-views, s6b-gates
- **Infrastructure:** mcp-preflight, mcp-preflight-config, contract-lint, cass-retrieve

### Patterns & Conventions Observed

- **Filename-prefix convention:** Files naturally cluster by prefix (`self-evolving-*`, `lp-do-ideas-*`, `s10-*`, `s2-*`, `baseline-*`, `lp-do-build-*`). Evidence: 66 of 79 files have unambiguous prefix-based domain membership.
- **Domain isolation is strong:** 4 cross-domain import edges exist across the entire 79-file codebase (see Internal Import Map below). All other files import only within their domain, from root-level utilities, or from external packages.
- **`self-evolving-contracts.ts` is the type hub:** Imported by 10+ self-evolving files as the shared type definition. Moving this to `self-evolving/` keeps the dependency tree clean.
- **Tests are flat in `__tests__/`:** 72 test files with no subdirectory structure. Most are 1:1 source-mapped; ~13 are integration tests spanning multiple source files.
- **Package.json scripts use full paths:** `scripts/package.json` has 3 script entries referencing startup-loop file paths directly (all for `generate-process-improvements`).

### Internal Import Map (Key Dependencies)

| Source Domain | Imports From | Files Affected |
|---|---|---|
| self-evolving/* | self-evolving-contracts (types) | 10+ files within self-evolving/ |
| ideas/* | lp-do-ideas-trial (core orchestrator) | lp-do-ideas-live, lp-do-ideas-fingerprint |
| baselines/* | baseline-priors (extraction/serialization) | learning-compiler, prior-update-writer |
| s10/* | baseline-priors, learning-compiler, learning-ledger | s10-learning-hook |
| diagnostics/* | bottleneck-detector | diagnosis-snapshot, replan-trigger (root) |
| diagnostics/* | stage-id-compat (root) | funnel-metrics-extractor, growth-metrics-adapter |
| build/* | lp-do-ideas-classifier, lp-do-build-reflection-debt | generate-process-improvements |
| s2/* | hospitality-scenarios | s2-operator-capture |

Cross-domain imports (files importing from a different proposed domain):
- `s10-learning-hook` → `baselines/baseline-priors`, `baselines/learning-compiler`, `baselines/learning-ledger` (s10 → baselines)
- `generate-process-improvements` → `ideas/lp-do-ideas-classifier`, `build/lp-do-build-reflection-debt` (build → ideas, build internal)
- `replan-trigger` → `diagnostics/bottleneck-history` (root → diagnostics)
- `self-evolving-from-ideas` → imports from ideas domain (self-evolving → ideas bridge)

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (governed runner via `pnpm -w run test:governed`)
- Commands: `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --testPathPattern=startup-loop`
- CI integration: Tests run in CI only (per `docs/testing-policy.md`)

#### Existing Test Coverage

| Domain | Test Count | 1:1 Mapped | Integration |
|---|---|---|---|
| self-evolving/ | 5 | 1 (contracts) | 4 (detector-scoring, lifecycle-container, orchestrator-integration, release-replay) |
| ideas/ | 17 | 15 | 2 (dispatch-v2, live-integration) |
| diagnostics/ | 8 | 8 (bottleneck-detector, bottleneck-history, diagnosis-snapshot, event-validation, funnel-metrics-extractor, growth-metrics-adapter, metrics-aggregate, validate-process-assignment) | 0 |
| website/ | 7 | 5 (compile, lint, materialize, map-artifact-delta, throughput-report) | 2 (map-logistics-policy-blocks, website-contract-parity) |
| baselines/ | 7 | 5 (baseline-merge, baseline-priors, learning-compiler, learning-ledger, prior-update-writer) | 2 (baseline-priors-extraction, baseline-priors-migration) |
| build/ | 4 | 4 (build-event-emitter, reflection-debt, build-summary, process-improvements) | 0 |
| s10/ | 5 | 3 (diagnosis-integration, growth-accounting, learning-hook) | 2 (packet-linkage, weekly-routing) |
| s2/ | 5 | 4 (hospitality-scenarios, market-intelligence-pack-lint, operator-capture, market-intelligence-handoff) | 1 (operator-captured-data) |
| root | 12 | 8 (cass-retrieve, contract-lint, derive-state, generate-stage-operator-views, manifest-update, mcp-preflight, recovery, run-concurrency) | 4 (replan-trigger, s6b-gate-simulation, stage-addressing, stage-label-rename) |
| naming/ | 2 | 0 | 2 (rdap-client, sidecar) |
| **Total** | **72** | — | — |

#### Test Import Pattern

All test files import source via relative paths like `from '../<filename>'`. After source files move to subdirectories, test imports change to `from '../<domain>/<filename>'`. This is a mechanical find-and-replace with verification via TypeScript compilation.

### External Consumers

The startup-loop scripts directory is **self-contained**. No cross-package imports exist from `apps/` or `packages/` into `scripts/src/startup-loop/`. External consumption is exclusively via:
- Shell script wrappers (e.g., `scripts/git-hooks/generate-process-improvements.sh`)
- `package.json` script entries (3 entries reference startup-loop paths)
- Skill documentation references (`.claude/skills/lp-do-build/SKILL.md`)

### Package.json Script Entries

Three entries in `scripts/package.json` reference `src/startup-loop/generate-process-improvements.ts`:
```
"generate-stage-operator-views": "node --import tsx src/startup-loop/generate-stage-operator-views.ts && ..."
"startup-loop:generate-process-improvements": "node --import tsx src/startup-loop/generate-process-improvements.ts"
"check-process-improvements": "node --import tsx src/startup-loop/generate-process-improvements.ts --check"
```

The `generate-stage-operator-views` script chains 3 file invocations (generate-stage-operator-views, generate-build-summary, generate-process-improvements). All paths need updating.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| File classification (79 files → domains) | Yes | None — all 79 files classified with evidence | No |
| Internal import map | Yes | None — cross-domain imports identified and documented | No |
| Test file mapping (72 tests) | Yes | None — all mapped to source domains | No |
| Package.json script paths | Yes | None — 3 entries identified for update | No |
| External consumer audit | Yes | None — confirmed self-contained (no cross-package imports) | No |
| Cross-domain dependency analysis | Yes | None — only 4 cross-domain import edges identified, all manageable | No |
| Root-staying file classification | Yes | None — 13 files with clear cross-cutting rationale | No |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** All 79 source files classified, 72 test files mapped, all import dependencies documented, package.json paths identified. Domain groupings are evidence-based (filename prefix + import graph). The 8 subdirectory structure matches the natural coupling boundaries in the codebase. No additional investigation needed.

## Questions

### Resolved

- Q: Should `__tests__/` mirror the domain subdirectory structure?
  - A: No. Keeping tests flat in `__tests__/` and only updating import paths minimises blast radius while achieving the primary goal (source organisation). Test discoverability is already good via the 1:1 naming convention.
  - Evidence: 72 test files would need both moving AND import updating if mirrored; import-only update is ~50% less work with the same compile-time verification.

- Q: Should `s10-learning-hook.ts` go in `s10/` or `baselines/`?
  - A: `s10/` — it is the S10 stage integration point for the learning pipeline. Its imports from baselines/ are cross-domain dependencies (s10 → baselines), which is the natural direction.
  - Evidence: File name prefix is `s10-`; its purpose is S10 stage orchestration; it consumes baselines as inputs.

- Q: How should `generate-process-improvements.ts` be classified given its cross-domain imports?
  - A: `build/` — it is a build pipeline report generator. Its imports from ideas/ (classifier) and build/ (reflection-debt) are cross-domain reads that don't make it an ideas file.
  - Evidence: Invoked by build completion protocol step 5; outputs `process-improvements.user.html`.

- Q: Are there any root-level source files that import from the `naming/` subdirectory?
  - A: No root-level source files import from `naming/`. The naming subsystem is fully isolated. (Two test files — `naming-rdap-client.test.ts` and `naming-sidecar.test.ts` — import from `../naming/` but these are test-only references and do not affect source organisation.)
  - Evidence: No import statements referencing `./naming/` found in any root-level source file.

- Q: Will `git mv` preserve git history for renamed files?
  - A: Yes. `git mv` followed by commit preserves rename detection. The files are only being moved to subdirectories with no content changes, so git's rename detection (>50% similarity) will track them perfectly.

### Open (Operator Input Required)

None — all questions resolved from evidence.

## Confidence Inputs

- Implementation: 90% — mechanical file moves + import path updates; TypeScript compilation is the verification gate
- Approach: 90% — domain groupings map directly to filename prefixes and import graph boundaries; only 4 cross-domain edges
- Impact: 90% — zero runtime behaviour change; all changes are directory structure and import paths
- Delivery-Readiness: 90% — self-contained codebase change with CI verification; no external dependencies

All scores at 90% because the only risk is a missed import path update, which TypeScript compilation catches deterministically.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Missed import path in test file | Low | Low | TypeScript compilation catches all broken imports; CI re-verifies |
| Package.json script path not updated | Low | Medium | Explicit checklist of 3 script entries; `pnpm startup-loop:generate-process-improvements` smoke test |
| Skill/doc references to old paths | Low | Low | Grep for `src/startup-loop/<moved-file>` patterns after move; update any hits |
| Git history fragmentation | Very Low | Low | `git mv` preserves rename detection; single commit per wave |

## Access Declarations

None — all artifacts are repo-local.

## Planning Constraints & Notes

- Must-follow patterns:
  - Use `git mv` for all file moves (preserve history)
  - Update all import paths to use `.js` extension (existing convention: `from './foo.js'`)
  - Run scoped typecheck (`pnpm --filter scripts tsc --noEmit`) after each wave
- Rollout/rollback expectations:
  - Single branch, atomic commit per task wave
  - Rollback: `git revert` the commit
- Observability expectations:
  - CI pipeline passes (typecheck + lint + tests)

## Suggested Task Seeds (Non-binding)

1. **TASK-01:** Move self-evolving/ (21 files) — largest domain, tightly coupled, clean boundaries
2. **TASK-02:** Move ideas/ (15 files) — second largest, moderately coupled
3. **TASK-03:** Move diagnostics/ (8 files) + website/ (6 files) + baselines/ (5 files) — three medium domains in one task
4. **TASK-04:** Move build/ (4 files) + s2/ (4 files) + s10/ (3 files) — three small domains; update package.json scripts
5. **TASK-05:** Final verification — full typecheck, grep for stale paths, update any remaining references (CI validates tests)

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - TypeScript compilation clean (`pnpm --filter scripts tsc --noEmit`)
  - All tests pass (CI)
  - Zero grep hits for old import paths in moved files
  - Package.json script entries updated and smoke-tested
- Post-delivery measurement plan:
  - Not applicable (internal infrastructure change)

## Evidence Gap Review

### Gaps Addressed

- Confirmed all 79 files classified by domain with import evidence
- Confirmed all 72 test files mapped to source domains
- Confirmed package.json script entries identified (3 entries)
- Confirmed no external consumers (self-contained)
- Confirmed cross-domain imports are minimal (4 edges)

### Confidence Adjustments

None — evidence fully supports the domain classification and approach.

### Remaining Assumptions

- Assumption: `git mv` rename detection will work for all 66 moved files. Risk: very low (files move with no content changes).

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan startup-loop-scripts-domain-dirs --auto`
