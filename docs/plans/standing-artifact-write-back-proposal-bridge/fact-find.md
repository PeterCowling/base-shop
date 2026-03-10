---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: BOS
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: standing-artifact-write-back-proposal-bridge
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/standing-artifact-write-back-proposal-bridge/plan.md
Trigger-Why: The prior deterministic write-back build closed only the apply phase. The self-evolving pipeline still cannot turn observed factual KPI updates into bounded write-back payloads without a human assembling ProposedUpdate JSON by hand.
Trigger-Intended-Outcome: type: operational | statement: Add a deterministic bridge that compiles mapped KPI observations into safe write-back proposals and can hand them to the existing write-back engine. | source: operator
---

# Standing Artifact Write-Back Proposal Bridge Fact-Find Brief

## Scope
### Summary

`self-evolving-write-back.ts` already applies bounded `ProposedUpdate[]` payloads to standing artifacts, but the pipeline still has no deterministic seam that produces those payloads from observed facts. The archived March 4 plan therefore solved only half of the original idea.

The revised scope is narrower and evidence-backed: compile rule-mapped KPI observations into `ProposedUpdate[]` files that the existing write-back engine can dry-run or apply. Generic prose observations remain out of scope because current `MetaObservation` records do not carry patch-target fields or replacement text.

### Goals
- Close the missing proposal-generation seam between KPI observations and the existing write-back applicator.
- Keep the bridge deterministic and fail-closed.
- Reuse the existing `applyWriteBack()` engine instead of duplicating artifact patch logic.
- Bound the bridge to observations that already carry machine-usable fields: `kpi_name`, `kpi_value`, `sample_size`, `data_quality_status`, and evidence refs.

### Non-goals
- Replacing the full fact-find -> plan -> build workflow for structural or semantic changes.
- Inferring free-form section edits from prose observations.
- Modifying the standing-registry schema.
- Authoring business-specific live mappings beyond the bridge contract itself.

### Constraints & Assumptions
- Constraints:
  - Must remain deterministic and file-based.
  - Must fail closed when mappings are missing or invalid.
  - Must preserve the existing T1 safety boundary enforced by `self-evolving-write-back.ts`.
  - Must not assume non-KPI observations contain enough structure to patch artifacts.
- Assumptions:
  - KPI observations with `data_quality_status: "ok"` and sufficient `sample_size` are the only current observation class suitable for deterministic proposal compilation.
  - A small per-business mapping file is the lowest-risk way to connect KPI names to artifact targets.

## Outcome Contract

- **Why:** The prior deterministic write-back work delivered only the apply engine. The self-evolving pipeline still cannot turn observed factual KPI updates into bounded write-back payloads without manual JSON assembly, so the observation-to-artifact gap remains operationally open.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Add a deterministic bridge that compiles mapped KPI observations into safe write-back proposals and can hand them to the existing write-back engine.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `scripts/src/startup-loop/self-evolving/self-evolving-write-back.ts` - existing bounded apply engine; requires `--updates-file`
- `scripts/src/startup-loop/self-evolving/self-evolving-events.ts` - reads `observations.jsonl`
- `docs/business-os/startup-loop/self-evolving/<BUSINESS>/observations.jsonl` - current observation persistence location

### Key Modules / Files
- `scripts/src/startup-loop/self-evolving/self-evolving-write-back.ts` - accepts `ProposedUpdate[]`, applies eligibility and SHA gates, writes audit entries
- `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts` - `MetaObservation` contract shows current machine-usable observation fields
- `scripts/src/startup-loop/self-evolving/self-evolving-events.ts` - exposes `readMetaObservations()`
- `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts` - current readiness logic treats `sample_size >= 30` as the minimum measurement-ready floor
- `docs/plans/_archive/standing-artifact-deterministic-write-back/fact-find.md` - archived scope assumed a direct observation-to-write-back seam that the shipped code did not add

### Patterns & Conventions Observed
- Deterministic self-evolving CLIs live under `scripts/src/startup-loop/self-evolving/` and are exposed via `scripts/package.json`.
- Observation reads are per-business and file-backed via `readMetaObservations(rootDir, business)`.
- Measurement readiness already uses a default minimum `sample_size` of `30` in the self-evolving pipeline.
- Existing write-back safety is artifact-centric: registry eligibility, T1 section rejection, SHA concurrency, append-only audit log.

### Data & Contracts
- Types/schemas/events:
  - `MetaObservation` includes `kpi_name`, `kpi_value`, `sample_size`, `data_quality_status`, `measurement_window`, `aggregation_method`, `traffic_segment`, and `evidence_refs`.
  - `ProposedUpdate` is the current write-back input contract.
- Persistence:
  - Observations: `docs/business-os/startup-loop/self-evolving/<BUSINESS>/observations.jsonl`
  - Existing write-back audit: `docs/business-os/startup-loop/self-evolving/<BUSINESS>/write-back-audit.jsonl`
- API/contracts:
  - `applyWriteBack()` is the canonical apply path and should be reused rather than reimplemented.

### Dependency & Impact Map
- Upstream dependencies:
  - `readMetaObservations()` for reading candidate KPI observations.
  - Existing `applyWriteBack()` for optional apply-mode handoff.
- Downstream dependents:
  - Operators or future orchestrators can run the bridge to generate or apply proposal payloads.
  - Per-business mapping files become the explicit contract between observed KPIs and standing artifact targets.
- Likely blast radius:
  - New self-evolving CLI
  - New test file
  - `scripts/package.json`

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest with `@jest/globals`
- Commands: CI-only Jest policy; local targeted `tsc`/`eslint` allowed
- CI integration: `scripts` package governed test entrypoint

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Existing write-back applicator | Unit + integration | `scripts/src/startup-loop/__tests__/self-evolving-write-back.test.ts` | Covers classification, eligibility, apply path, anti-loop registration |
| Observation contracts | Unit | `scripts/src/startup-loop/__tests__/self-evolving-contracts.test.ts` | Confirms `MetaObservation` requirements |

#### Coverage Gaps
- No compiler from observations to `ProposedUpdate[]`
- No mapping contract for KPI -> artifact target resolution
- No end-to-end test that compiles proposals and hands them into the existing apply engine

#### Testability Assessment
- Easy to test:
  - Mapping validation
  - KPI observation filtering
  - Deterministic template rendering
  - End-to-end proposal compile + apply with temp-dir fixtures
- Hard to test:
  - Real business mappings, because no live mapping file exists yet

#### Recommended Test Approach
- Unit tests for mapping validation, filtering, and templating
- Integration tests for compile-only and compile+apply flows in temp directories

### Recent Git History (Targeted)
- `standing-artifact-deterministic-write-back` was completed on 2026-03-04, but the implementation stopped at manual `--updates-file` ingestion.
- Recent self-evolving work continues to emit observations and candidates, but nothing in the current tree produces `ProposedUpdate[]` from those observations.

## Access Declarations

None. All evidence is local filesystem state.

## Questions
### Resolved
- Q: What part of the original idea is still genuinely missing?
  - A: Proposal generation. The existing tool applies updates but does not create them from observation artifacts.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-write-back.ts`

- Q: Which observation class can support deterministic compilation today?
  - A: KPI observations only. They already carry structured values (`kpi_name`, `kpi_value`, `sample_size`, `data_quality_status`) needed for deterministic rule evaluation.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`, `docs/business-os/startup-loop/self-evolving/SIMC/observations.jsonl`

- Q: Why not compile directly from generic build-record observations?
  - A: Those observations mostly carry prose in `signal_hints` and lack patch-target metadata or canonical field/value structure, so any direct patch generation would be heuristic rather than deterministic.
  - Evidence: `docs/business-os/startup-loop/self-evolving/BRIK/observations.jsonl`

### Open (Operator Input Required)
None.

## Confidence Inputs
- Implementation: 88%
  - Evidence basis: existing `readMetaObservations()` and `applyWriteBack()` already cover IO on both sides of the bridge.
  - >=90 with: working end-to-end temp-dir test proving compile+apply.
- Approach: 90%
  - Evidence basis: rule-mapped KPI observations are the smallest seam consistent with current schema.
  - >=90 with: explicit mapping file contract and collision handling.
- Impact: 78%
  - Evidence basis: bridge closes a real infra gap, but no live business mapping is in scope for this build.
  - >=90 with: first production business mapping and successful applied write-back.
- Delivery-Readiness: 86%
  - Evidence basis: no external services; bounded code surface.
  - >=90 with: package script entry and targeted validation.
- Testability: 92%
  - Evidence basis: temp-dir fixtures can cover the full path without touching real standing artifacts.
  - >=90 with: compile-only plus compile+apply regression tests.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Mapping file points a KPI at the wrong artifact field | Medium | Medium | Fail closed on invalid mappings; keep live business mappings out of this build |
| Observations with insufficient evidence generate noisy proposals | Low | Medium | Require `data_quality_status: "ok"`, non-empty evidence refs, and minimum sample size |
| Overlapping rules produce conflicting updates to the same target | Medium | Medium | Deterministically collapse to the latest qualifying observation per target key |

## Planning Constraints & Notes
- Must-follow patterns:
  - Reuse `applyWriteBack()` and `readMetaObservations()`
  - Keep CLIs under `scripts/src/startup-loop/self-evolving/`
  - Use per-business filesystem defaults under `docs/business-os/startup-loop/self-evolving/<BUSINESS>/`
- Rollout/rollback expectations:
  - Default mode should write proposal files only; apply mode remains explicit
  - Rollback is standard git revert / file deletion
- Observability expectations:
  - CLI stderr summary with proposal counts and skip reasons
  - Output file written even when proposal set is empty

## Suggested Task Seeds (Non-binding)
- IMPLEMENT: add `self-evolving-write-back-proposals.ts` to compile rule-mapped KPI observations into `ProposedUpdate[]`
- IMPLEMENT: add targeted tests for compile-only and compile+apply paths
- VALIDATE: run targeted `tsc` and `eslint` on touched files

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - none
- Deliverable acceptance package:
  - New bridge CLI
  - Tests
  - Fresh plan/build artifacts
- Post-delivery measurement plan:
  - Add live business mappings in a follow-on build and measure proposal volume vs applied volume
