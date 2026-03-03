---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Data
Workstream: Operations
Created: 2026-03-03
Last-updated: 2026-03-03
Feature-Slug: self-evolving-per-business-reorg
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/self-evolving-per-business-reorg/plan.md
Trigger-Why: self-evolving/ organises data by type (events/, observations/, candidates/) not by business. Finding all BRIK data requires checking 6 directories. Schemas mixed with data directories.
Trigger-Intended-Outcome: "type: operational | statement: self-evolving/ restructured to per-business directories (BRIK/, SIMC/) with schemas in schemas/. All self-evolving-*.ts path references updated. | source: operator"
---

# Self-Evolving Per-Business Reorg Fact-Find Brief

## Scope

### Summary

Restructure `docs/business-os/startup-loop/self-evolving/` from type-based subdirectories (candidates/, events/, observations/, startup-state/, backbone-queue/, reports/) to per-business subdirectories (BRIK/, SIMC/). Schemas remain in a shared `schemas/` directory. All TypeScript path constants, CLI defaults, and embedded path references updated.

### Goals

- All business data for a single business (BRIK or SIMC) lives in one directory
- Schemas separated from data into `schemas/` subdirectory
- All code path constants updated to construct per-business paths
- No stale path references remain

### Non-goals

- Renaming TypeScript module files (they keep `self-evolving-*.ts` names)
- Changing module APIs or type definitions
- Restructuring the scripts/src/startup-loop/ directory (separate dispatch: `startup-loop-scripts-domain-dirs`)

### Constraints & Assumptions

- Constraints:
  - Path construction pattern changes: currently `path.join(ROOT, businessId + ext)` where ROOT includes the type; new pattern needs `path.join(SELF_EVOLVING_ROOT, businessId, filename)`
  - Schema $id fields must match new file paths
- Assumptions:
  - Only 2 businesses exist: BRIK and SIMC
  - Reports directory naming convention changes from `{BUSINESS}-{date}-{type}.json` to just `{date}-{type}.json` inside business directory

## Outcome Contract

- **Why:** self-evolving/ organises data by type (events/, observations/, candidates/) not by business. Finding all BRIK data requires checking 6 directories. Schemas mixed with data directories.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** self-evolving/ restructured to per-business directories (BRIK/, SIMC/) with schemas in schemas/. All self-evolving-*.ts path references updated.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `docs/business-os/startup-loop/self-evolving/` — 16 files across 6 subdirectories (candidates/, events/, observations/, startup-state/, backbone-queue/, reports/) plus 4 root schemas and README

### Key Modules / Files

1. `scripts/src/startup-loop/self-evolving-candidates.ts` — defines `CANDIDATE_ROOT` constant (line 8-14), resolves to `self-evolving/candidates/{businessId}.json`
2. `scripts/src/startup-loop/self-evolving-events.ts` — defines `EVENTS_ROOT` (line 61-67) and `OBSERVATIONS_ROOT` (line 69-75), resolves events and observations paths
3. `scripts/src/startup-loop/self-evolving-startup-state.ts` — defines `STATE_ROOT` (line 10-16), resolves startup-state path
4. `scripts/src/startup-loop/self-evolving-from-ideas.ts` — defines `BACKBONE_QUEUE_ROOT` (line 14-20), plus CLI default for startup-state path (line 248-257)
5. `scripts/src/startup-loop/self-evolving-report.ts` — CLI defaults for observations path (line 28-37) and candidates path (line 39-47)
6. `scripts/src/startup-loop/self-evolving-index.ts` — barrel re-export of 19 modules (no path constants, just re-exports)
7. `scripts/src/startup-loop/self-evolving-contracts.ts` — type definitions and validators (no path constants)

### Patterns & Conventions Observed

- **Centralised path constants**: Each data type has one ROOT constant; all path resolution goes through a single `resolve*Path()` function — evidence: `self-evolving-candidates.ts:31-33`, `self-evolving-events.ts:77-83`
- **Business ID as filename**: Files named `{businessId}.json` or `{businessId}.jsonl` — evidence: all resolve functions
- **Schema validation is type-based, not path-based**: Validators check `schema_version` strings, not file path references — evidence: `self-evolving-contracts.ts`
- **Reports have embedded paths**: `BRIK-2026-03-02-live.json` contains `backbone_queue_path`, `startup_state_path`, `candidate_path` fields with full directory paths — evidence: `docs/business-os/startup-loop/self-evolving/reports/BRIK-2026-03-02-live.json:3,8,9`

### Data & Contracts

- Types/schemas:
  - 4 JSON Schema files at root: `startup-state.schema.json`, `meta-observation.schema.json`, `container-contract.schema.json`, `actuator-adapter.schema.json`
  - Each has a `$id` field matching its current path
  - Schema validation in code is in-memory type-based (no runtime file path references to schemas)
- Persistence:
  - JSON files: candidates (2), startup-state (2) — read/write via `readFileSync`/`writeFileSync`
  - JSONL files: events (2), observations (2), backbone-queue (1) — append-only logs
  - Reports (2): operator-placed JSON outputs
- API/contracts:
  - No API endpoints; all file-based

### Dependency & Impact Map

- Upstream dependencies: None (self-evolving reads its own data files)
- Downstream dependents:
  - `self-evolving-from-ideas.ts` reads dispatches from ideas/trial/ and writes to backbone-queue
  - `self-evolving-report.ts` reads observations and candidates, writes report to CLI-specified path
  - `self-evolving-orchestrator.ts` orchestrates candidates+events+startup-state (uses module imports, no direct path construction)
- Likely blast radius:
  - 5 path constant definitions in 4 files
  - 2 CLI default path strings in 2 files
  - 4 schema `$id` values
  - 11 data files moved physically
  - 2 report files with embedded paths
  - 1 archived plan artifact with embedded paths
  - 1 registry.json entry

### Test Landscape

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Contracts/types | Unit | `__tests__/self-evolving-contracts.test.ts` | Type validation; no path fixtures |
| Detector scoring | Unit | `__tests__/self-evolving-detector-scoring.test.ts` | In-memory scoring; no path fixtures |
| Lifecycle container | Unit | `__tests__/self-evolving-lifecycle-container.test.ts` | State transitions; no path fixtures |
| Orchestrator | Integration | `__tests__/self-evolving-orchestrator-integration.test.ts` | Uses temp dirs, not hardcoded paths |
| Release replay | Unit | `__tests__/self-evolving-release-replay.test.ts` | Event replay; no path fixtures |

#### Testability Assessment

- Tests do NOT contain hardcoded `self-evolving/` subdirectory paths (verified by grep)
- Tests use temp directories or in-memory data structures
- No test changes needed for the reorganisation

## Access Declarations

None — pure file/directory reorganisation with no external data sources.

## Questions

### Resolved

- Q: Do tests contain hardcoded self-evolving subdirectory paths that would break?
  - A: No. All 5 test suites use temp directories or in-memory data. Verified by grep — zero matches for `self-evolving/(candidates|events|observations|startup-state|backbone)` in test files.
  - Evidence: `grep -r 'self-evolving/(candidates|events|observations)' scripts/src/startup-loop/__tests__/` returns no matches

- Q: Are schema files referenced by path in code?
  - A: No. Schema validation uses `schema_version` string matching in `self-evolving-contracts.ts`, not runtime file path references. The `$id` field is for schema identification only.
  - Evidence: `self-evolving-contracts.ts` validates via `schema_version` property checks

- Q: Are there skill docs or CI scripts referencing self-evolving subdirectories?
  - A: No. Grep of `.claude/skills/` and `scripts/*.sh` returned zero matches for `self-evolving`.
  - Evidence: grep confirmed no matches

- Q: How are reports paths generated?
  - A: Reports are written to a CLI-specified `--output` path, not a hardcoded directory. The `reports/` directory is operator-managed. CLI defaults for observations/candidates paths are in `self-evolving-report.ts:28-47`.
  - Evidence: `self-evolving-from-ideas.ts:295-297` writes to `args.outputPath`; `self-evolving-report.ts:28-47` defines CLI default paths for observations and candidates

### Open (Operator Input Required)

None — all questions resolved.

## Confidence Inputs

- Implementation: 90% — centralised path constants make the change mechanical; 5 constants + 2 CLI defaults + 4 schema IDs + data moves
- Approach: 90% — per-business structure is the obvious correct organisation; mirrors how the code already resolves files by business ID
- Impact: 85% — operational improvement to directory navigation; no runtime behaviour change
- Delivery-Readiness: 90% — no external dependencies, no test changes needed
- Testability: 85% — existing tests are path-agnostic; verification via typecheck + grep for stale paths

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Embedded paths in report JSONs missed | Low | Medium | Comprehensive grep for old type-directory paths in docs/ after move |
| Path construction pattern change introduces bugs | Low | High | Path constants are centralised; change is mechanical and verifiable by typecheck |
| New business code added during build | Very Low | Low | Only BRIK and SIMC exist; any new business would follow new per-business pattern |

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| TypeScript path constants (5 in 4 files) | Yes | None | No |
| CLI default paths (2 in 2 files) | Yes | None | No |
| Schema $id values (4 files) | Yes | None | No |
| Data file moves (11 files) | Yes | None | No |
| Report embedded paths (2+1 files) | Yes | None | No |
| Test fixtures | Yes | None — tests are path-agnostic | No |
| Skill/CI references | Yes | None — no matches found | No |
| Registry.json entry | Yes | 1 entry to update | No |
| Inter-module imports | Yes | None — relative imports unchanged | No |

## Scope Signal

- Signal: right-sized
- Rationale: Clear boundary (5 path constants + 2 CLI defaults + 4 schema IDs), centralised path construction pattern, tests are path-agnostic, no skill/CI references to update. Total affected files ~25 with mechanical changes.

## Suggested Task Seeds (Non-binding)

1. Create per-business directories (BRIK/, SIMC/) and schemas/ directory; move all data files
2. Update 5 TypeScript path constants and 2 CLI defaults to use per-business paths
3. Update 4 schema `$id` values
4. Update embedded paths in report JSONs and archived plan artifacts
5. Update registry.json entry
6. Verification: typecheck + comprehensive grep for stale type-directory paths

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: typecheck passes, lint passes, comprehensive grep confirms zero stale `self-evolving/(candidates|events|observations|startup-state|backbone-queue|reports)` paths
- Post-delivery measurement plan: N/A (operational improvement)

## Evidence Gap Review

### Gaps Addressed

- Verified test fixtures are path-agnostic (no hardcoded subdirectory paths)
- Verified no skill or CI script references to self-evolving subdirectories
- Confirmed schema validation is type-based, not path-based
- Confirmed reports use CLI-specified output path, not hardcoded directory

### Confidence Adjustments

- None — initial investigation was comprehensive

### Remaining Assumptions

- Only 2 businesses (BRIK, SIMC) exist in data files — verified by `ls`
- Schema $id updates are cosmetic (not used for runtime path resolution) — verified by code review

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan self-evolving-per-business-reorg --auto`
