---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-05
Last-updated: 2026-03-05
Feature-Slug: startup-loop-self-improvement-integrity-fixes
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find, lp-do-plan, lp-do-ideas
Related-Plan: docs/plans/startup-loop-self-improvement-integrity-fixes/plan.md
Trigger-Why: Repair the self-improving startup-loop runtime defects surfaced in the audit so the loop reports true state, separates live vs trial paths, recognizes repeat work across runs, suppresses placeholder observations, and aligns human-facing docs with the canonical loop spec.
Trigger-Intended-Outcome: "type: operational | statement: The self-improving startup loop reads real self-evolving data, keeps live and trial ideas paths distinct, clusters repeated work with stable fingerprints, ignores placeholder build artifacts, and has startup-loop operator docs/skill metadata aligned to loop-spec v3.14.0. | source: operator"
---

# Startup Loop Self-Improvement Integrity Fixes Fact-Find Brief

## Scope
### Summary
This repair set covers the self-improving startup-loop path from `lp-do-ideas` and `lp-do-build` into the self-evolving runtime and the operator-facing startup-loop docs. The target is not a redesign of the whole system; it is a bounded integrity fix for concrete defects already present in scripts, runtime data flow, and canonical documentation.

### Goals
- Fix `startup-loop:self-evolving-report` so it reads the actual self-evolving files when run from the `scripts` package.
- Remove live/trial command-path confusion in `lp-do-ideas` runtime entrypoints.
- Make repeat-work detection cluster semantically repeated signals instead of treating every build as unique.
- Suppress placeholder `None` bullets from self-evolving observation ingestion.
- Align startup-loop human/operator surfaces to the current canonical loop spec version and stage set.

### Non-goals
- Re-architecting the full self-evolving governance model.
- Introducing autonomous promotion of fact-find/plan/build without existing safety gates.
- Migrating the legacy trial queue JSON shape to a new canonical on-disk format.
- Running Jest locally; CI remains the test authority.

### Constraints & Assumptions
- Constraints:
  - Limit scope to startup-loop scripts/docs and their direct consumers.
  - Keep trial queue compatibility intact.
  - Use targeted validation only; no local Jest execution.
- Assumptions:
  - Existing runtime data under `docs/business-os/startup-loop/self-evolving/BRIK/` is representative enough to validate path and observation fixes.
  - Additive metadata on observations is acceptable because validators are permissive and downstream code is repo-local.

## Outcome Contract
- **Why:** Repair the self-improving startup-loop runtime defects surfaced in the audit so the loop reports true state, separates live vs trial paths, recognizes repeat work across runs, suppresses placeholder observations, and aligns human-facing docs with the canonical loop spec.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The self-improving startup loop reads real self-evolving data, keeps live and trial ideas paths distinct, clusters repeated work with stable fingerprints, ignores placeholder build artifacts, and has startup-loop operator docs/skill metadata aligned to loop-spec v3.14.0.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `scripts/package.json` - package script wiring for self-evolving report and ideas live/trial runs.
- `scripts/src/startup-loop/self-evolving/self-evolving-report.ts` - CLI report entrypoint returning false zero counts.
- `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts` - build-output observation bridge.
- `scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts` - ideas-to-observation bridge.
- `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts` - repeat detection, scoring, candidate generation.
- `.claude/skills/startup-loop/SKILL.md` - startup-loop wrapper output contract and stage table.
- `docs/business-os/startup-loop-workflow.user.md` - operator-facing canonical stage reference.

### Key Modules / Files
- `scripts/src/startup-loop/self-evolving/self-evolving-detector.ts` - groups by exact `hard_signature` and requires recurrence count >= 2 inside a 7-day window.
- `scripts/src/startup-loop/ideas/lp-do-ideas-live-hook.ts` - advisory live hook; no persistence writes by design.
- `scripts/src/startup-loop/ideas/lp-do-ideas-build-commit-hook.ts` - build-time live hook runner, currently passing queue/telemetry paths but not persisting results.
- `docs/business-os/startup-loop/self-evolving/BRIK/observations.jsonl` - actual observations already present for BRIK.
- `docs/business-os/startup-loop/ideas/live/queue-state.json` - empty live queue snapshot.
- `docs/business-os/startup-loop/ideas/trial/queue-state.json` - active trial queue with recent dispatches.

### Patterns & Conventions Observed
- Repo-root-aware CLI scripts usually derive `rootDir` with `process.cwd().endsWith("/scripts") ? .. : cwd`.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-build-commit-hook.ts`
- Trial/live separation is intended at the command and packet level.
  - Evidence: `scripts/src/startup-loop/ideas/lp-do-ideas-live.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts`
- Startup-loop docs are expected to align to `loop-spec.yaml`, but version strings are duplicated manually.
  - Evidence: `docs/business-os/startup-loop/specifications/loop-spec.yaml`, `.claude/skills/startup-loop/SKILL.md`, `docs/business-os/startup-loop-workflow.user.md`

### Data & Contracts
- Types/schemas/events:
  - `MetaObservation` and `ImprovementCandidate` live in `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`.
  - Trial/live dispatch packets originate in `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts`.
- Persistence:
  - Self-evolving observations are append-only JSONL under `docs/business-os/startup-loop/self-evolving/<BIZ>/`.
  - Trial queue state is hand-authored dispatch format; do not migrate in this scope.
- API/contracts:
  - `startup-loop:self-evolving-report` should summarize self-evolving observations/candidates.
  - `startup-loop:lp-do-ideas-live-run` should not point at trial artifact paths.

### Dependency & Impact Map
- Upstream dependencies:
  - `lp-do-build` completion flow invokes `startup-loop:self-evolving-from-build-output`.
  - `lp-do-ideas` emits dispatch packets consumed by `self-evolving-from-ideas`.
- Downstream dependents:
  - Operator diagnostics that rely on `startup-loop:self-evolving-report`.
  - Any future self-evolving candidate routing or backbone queue consumption.
  - Startup-loop operator docs/skill output packets.
- Likely blast radius:
  - `scripts` package only for runtime code.
  - Two canonical docs plus the startup-loop skill for drift repair.

### Hypothesis & Validation Landscape
#### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | The zero-count report is caused by relative path resolution from `scripts/` rather than missing data. | Existing BRIK observation files | Low | Low |
| H2 | Repeat detection is starved because current hard signatures embed plan- or artifact-specific values. | Observation builders + detector grouping | Medium | Low |
| H3 | Placeholder `None` bullets are entering the observation log because the extractor only suppresses exact `none`. | Build-output extractor | Low | Low |
| H4 | Startup-loop contract drift can be materially reduced by updating duplicated version/stage references in current docs/skill. | Canonical spec v3.14.0 | Low | Low |

#### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Report returns zero while observation log already contains 5 records | `self-evolving-report.ts`, `observations.jsonl` | High |
| H2 | Observation builders use plan slug, label, first location anchor, and `artifact_id`; detector groups exact hard signatures only | `self-evolving-from-build-output.ts`, `self-evolving-from-ideas.ts`, `self-evolving-detector.ts` | High |
| H3 | Observation log contains `idea:New skill — None.`-style records | `observations.jsonl` | High |
| H4 | Skill/operator doc versions disagree with spec and omit ASSESSMENT-13..15 | `loop-spec.yaml`, `startup-loop-workflow.user.md`, `startup-loop/SKILL.md` | High |

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest under governed runner in `scripts` package.
- Commands: `pnpm --filter scripts test` exists but local Jest execution is disallowed by repo policy.
- CI integration: governed by repo testing policy; use typecheck/lint locally only.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Self-evolving ideas integration | Unit/integration | `scripts/src/startup-loop/__tests__/self-evolving-orchestrator-integration.test.ts` | Covers ideas -> observations -> candidate generation happy path |
| Live hook | Unit/integration | `scripts/src/startup-loop/__tests__/lp-do-ideas-live-hook.test.ts`, `lp-do-ideas-live-integration.test.ts` | Covers pure hook and persistence adapter separately |
| Build failure bridge | Unit/integration | `scripts/src/startup-loop/__tests__/self-evolving-from-build-failure.test.ts` | Covers failure observations |
| Write-back | Unit/integration | `scripts/src/startup-loop/__tests__/self-evolving-write-back.test.ts` | Covers write-back safety gating |

#### Coverage Gaps
- No direct test coverage for `self-evolving-report.ts` path resolution from `scripts/` working directory.
- No direct coverage for placeholder suppression in `self-evolving-from-build-output.ts`.
- No direct coverage for stable repeat-work identity across multiple plans/dispatches.

### Recent Git History (Targeted)
- Archived build `docs/plans/_archive/bos-ideas-dispatch-20260303-followthrough/` introduced the first build-output bridge and loop-closure utilities, but the current defects remain in follow-on runtime usage.

## Questions
### Resolved
- Q: Is the BRIK self-evolving store actually empty?
  - A: No. `observations.jsonl` and `events.jsonl` contain 5 records dated 2026-03-04, while the report command still returns zeros.
  - Evidence: `docs/business-os/startup-loop/self-evolving/BRIK/observations.jsonl`, `scripts/src/startup-loop/self-evolving/self-evolving-report.ts`
- Q: Is live mode isolated from trial mode at the package script layer?
  - A: No. `startup-loop:lp-do-ideas-live-run` points to `ideas/trial/queue-state.json` and `ideas/trial/telemetry.jsonl`.
  - Evidence: `scripts/package.json`
- Q: Are placeholder “None” bullets currently ingested as observations?
  - A: Yes. The current observation log contains three `idea:* None.` entries from one build-output bridge run.
  - Evidence: `docs/business-os/startup-loop/self-evolving/BRIK/observations.jsonl`
- Q: Are the startup-loop human-facing surfaces aligned to the current spec version?
  - A: No. The spec is `3.14.0`, the operator guide says `3.13.0`, and the skill output contract still says `3.12.0`.
  - Evidence: `docs/business-os/startup-loop/specifications/loop-spec.yaml`, `docs/business-os/startup-loop-workflow.user.md`, `.claude/skills/startup-loop/SKILL.md`

### Open (Operator Input Required)
None. The required decisions are engineering decisions bounded by existing repo contracts.

## Confidence Inputs
- Implementation: 88%
  - Basis: the defects are localized to a small set of scripts/docs with existing patterns to copy.
  - To reach >=90: finish consumer tracing for every changed script entrypoint and run targeted validation cleanly.
- Approach: 86%
  - Basis: fixes are additive and bounded, but repeat-identity changes need careful calibration to avoid false positives.
  - To reach >=90: add explicit observation hints and stable fingerprint normalization rather than one-off string tweaks.
- Impact: 90%
  - Basis: all identified defects materially affect operator trust in the self-improving loop.
  - To reach >=90: confirm the repaired report and observation pipeline on current BRIK data.
- Delivery-Readiness: 91%
  - Basis: no external access is required and runtime fixtures already exist in repo.
  - To reach >=90: maintained.
- Testability: 82%
  - Basis: unit/integration tests exist for adjacent behavior, but local execution is constrained by policy.
  - To reach >=90: add targeted coverage for path resolution and placeholder suppression before pushing to CI.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Fingerprint normalization becomes too broad and creates noisy repeat candidates | Medium | High | Use stable semantic keys, preserve separate soft cluster IDs, and keep recurrence threshold unchanged |
| Live/trial path fix accidentally mutates trial queue behavior | Low | High | Keep trial script untouched; update only live entrypoints and their docs |
| Startup-loop doc alignment misses another stale stage list | Medium | Medium | Search all direct spec version references in targeted operator surfaces before finalizing |

## Planning Constraints & Notes
- Must-follow patterns:
  - Use repo-root resolution pattern for CLI defaults.
  - Keep observation contracts additive; do not break existing JSONL readers.
  - Respect testing policy: no local Jest execution.
- Rollout/rollback expectations:
  - Rollout is repo-local code/doc deployment via normal dev branch flow.
  - Rollback is revertable per task because changes are isolated to scripts/docs.
- Observability expectations:
  - Validate repaired report output against existing BRIK observation data.
  - Validate live/trial command wiring by inspecting script entries and deterministic CLI output.

## Access Declarations
None.

## Simulation Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Self-evolving report CLI | Yes | None | No |
| Ideas live/trial entrypoints | Yes | None | No |
| Observation identity + detector path | Yes | None | No |
| Build-output placeholder suppression | Yes | None | No |
| Startup-loop contract surfaces | Yes | None | No |

## Scope Signal
Signal: right-sized

Rationale: The defect set is concrete, repo-local, and already evidenced in runtime files and command behavior. The work can be delivered as a bounded multi-file repair without expanding into a general redesign of self-evolving governance or queue format migration.
