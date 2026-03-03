---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Startup-Loop
Workstream: Engineering
Created: 2026-03-03
Last-updated: 2026-03-03
Feature-Slug: assessment-completion-registry
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/assessment-completion-registry/plan.md
Trigger-Why:
Trigger-Intended-Outcome:
---

# Assessment Completion Registry Fact-Find Brief

## Scope

### Summary

14 ASSESSMENT stages (01-11, 13-15; ASSESSMENT-12 is skill-only, not a loop-spec stage) produce artifacts across 5 businesses, but there is no machine-queryable registry of which businesses have completed which stages and when. Determining completion state requires globbing `strategy/<BIZ>/assessment/*.md` and `strategy/<BIZ>/*.md` and parsing filenames. This investigation examines the current state, existing partial solutions, and integration points for a programmatic assessment completion registry.

### Goals

- Map how assessment completion is currently determined (advancement gates, intake sync, manual index files)
- Identify the schema requirements for a completion registry
- Identify integration points (mcp-preflight, derive-state, advancement gates, index files)
- Determine the right scope for a first implementation

### Non-goals

- Changing assessment gate logic (the registry is read infrastructure, not a new gate)
- Migrating the event ledger or derive-state.ts architecture
- Restructuring assessment artifact filesystem layout

### Constraints & Assumptions

- Constraints:
  - Must be backward-compatible with existing `cmd-advance.md` gate checks
  - Must not introduce external dependencies (all data is repo-local)
  - Registry must be deterministic — same filesystem state produces same registry output
- Assumptions:
  - 14 ASSESSMENT stages are defined across two sources: `stage-operator-dictionary.yaml` (01-11) and `loop-spec.yaml` (13-15 added in v3.14.0). ASSESSMENT-12 is skill-only, not a stage.
  - Assessment artifacts follow mixed filename patterns: most use `<YYYY-MM-DD>-<type>.user.md`, but some use undated names (e.g. `current-problem-framing.user.md`, `s1-readiness.user.md`). Scanner must handle both patterns.
  - No event ledger runs exist yet (`docs/business-os/startup-baselines/*/runs/` is empty)

## Outcome Contract

- **Why:** Assessment completion state is invisible to the loop without manual filesystem traversal. When deciding what stage a business is at, or which assessments remain, there's no single query — you have to glob 5 directories and parse dates from filenames. This makes stage-gating unreliable and blocks automation of assessment-to-measure advancement.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A programmatic assessment completion registry exists that can answer "which ASSESSMENT stages has `<BIZ>` completed and when?" from a single file read, populated by a deterministic scanner.
- **Source:** operator

## Access Declarations

None — all data sources are internal repo artifacts. No external services required.

## Evidence Audit (Current State)

### Entry Points

- `docs/business-os/strategy/<BIZ>/assessment/` — per-business assessment artifact directories (BRIK, HBAG, HEAD, PWRB, PET)
- `docs/business-os/startup-loop/specifications/stage-operator-dictionary.yaml` — ASSESSMENT stage definitions (01-11, plus ASSESSMENT container)
- `docs/business-os/startup-loop/specifications/loop-spec.yaml` — ASSESSMENT container stages (13-15 added in v3.14.0)
- `.claude/skills/startup-loop/modules/cmd-advance.md` — advancement gate logic that checks assessment completion inline via filesystem checks against `strategy/<BIZ>/` paths (not just `assessment/` subdirectory)

### Key Modules / Files

- `docs/business-os/startup-loop/specifications/loop-spec.yaml` — v3.14.0; defines ASSESSMENT container stages (10, 11, 13, 14, 15), ordering constraints, and GATE-ASSESSMENT-01
- `docs/business-os/startup-loop/specifications/stage-operator-dictionary.yaml` — ASSESSMENT stages 01-11 with labels, artifacts, and conditional flags (13-15 defined in loop-spec.yaml only)
- `docs/business-os/startup-loop/ideas/standing-registry.json` — 15 artifact entries for change-detection; `registry.v2`; no completion dates
- `docs/business-os/strategy/HBAG/index.user.md` — manual per-business completion table (reference pattern, though stage mappings are not fully canonical — e.g. operator-context listed under ASSESSMENT-06 while loop-spec treats it as ASSESSMENT-08 output); tracks multiple ASSESSMENT and S-stages
- `scripts/src/startup-loop/derive-state.ts` — 157 lines; deterministic state derivation from event ledger; `stage_completed` events carry artifacts and timestamps
- `scripts/src/startup-loop/__tests__/derive-state.test.ts` — 258 lines; existing test coverage for derive-state
- `.claude/skills/startup-loop/modules/assessment-intake-sync.md` — reads 7 precursor artifacts (ASSESSMENT-01 through -04, -06, -07, -08; ASSESSMENT-05 is optional and not consumed), extracts frontmatter dates, detects drift
- `docs/business-os/startup-loop/artifact-registry.md` — canonical producer/consumer path contracts; includes ASSESSMENT-13, -14, -15 artifacts

### Patterns & Conventions Observed

- **Mixed artifact filename patterns**: most assessment outputs use `<YYYY-MM-DD>-<type>.user.md` (e.g. `2026-02-21-brand-identity-dossier.user.md`), but some use undated names (e.g. `current-problem-framing.user.md`, `s1-readiness.user.md`, `tagline-options.user.md`). Scanner must map both patterns to stages — evidence: HBAG assessment directory listing
- **Frontmatter status tracking**: artifacts carry `Status: Active|Draft` in YAML frontmatter — evidence: HBAG brand dossier
- **Event ledger pattern**: `derive-state.ts` replays `stage_started`/`stage_completed`/`stage_blocked` events to derive deterministic state — but no runs exist yet on disk
- **Manual index pattern**: HBAG `index.user.md` has `Startup-Loop Canonical Artifacts` table with Stage, Artifact, Path, Status, Last-reviewed columns — evidence: HBAG index lines 38-56
- **Standing registry pattern**: `standing-registry.json` uses `artifact_id`, `path`, `registered_at`, `last_known_sha`, `trigger_policy` — no `completed_at` or `completion_status`

### Data & Contracts

- Types/schemas:
  - `RunEvent.event`: `"stage_started" | "stage_completed" | "stage_blocked" | "run_aborted"` (derive-state.ts:15)
  - `StageState.status`: `"Pending" | "Active" | "Done" | "Blocked"` (derive-state.ts:26)
  - `DerivedState`: business, run_id, active_stage, stages record (derive-state.ts:33-40)
- Persistence:
  - Event ledger: `docs/business-os/startup-baselines/<BIZ>/runs/<run_id>/events.jsonl` — no runs exist yet
  - Standing registry: `docs/business-os/startup-loop/ideas/standing-registry.json`
  - Manual indices: `docs/business-os/strategy/<BIZ>/index.user.md` (4 of 5 businesses have one)

### Dependency & Impact Map

- Upstream dependencies:
  - Assessment skill outputs in `strategy/<BIZ>/assessment/` and `startup-baselines/<BIZ>/`
  - `stage-operator-dictionary.yaml` for canonical stage definitions
  - `loop-spec.yaml` for GATE-ASSESSMENT-01 pass conditions
- Downstream dependents:
  - `cmd-advance.md` — could consume registry instead of inline filesystem checks
  - `assessment-intake-sync.md` — could iterate registry for precursor drift detection
  - `mcp-preflight.ts` — could add an assessment-completion-status check
  - Operator index files — could be auto-generated from registry
- Likely blast radius:
  - Low: registry is additive read infrastructure. Existing advancement gates continue to work unchanged until explicitly wired to consume the registry.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (governed entrypoint via `tests/run-governed-test.sh`)
- Commands: `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --testPathPattern=<pattern>`
- CI integration: tests run in CI only (never locally per project policy)

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| derive-state | Unit | `scripts/src/startup-loop/__tests__/derive-state.test.ts` (258 lines) | Event replay, stage transitions, normalization |
| baselines-freshness | Unit + integration | `scripts/src/startup-loop/__tests__/baselines-freshness.test.ts` (462 lines) | Freshness scanning pattern (just built — reusable pattern) |
| mcp-preflight | Unit | `scripts/src/startup-loop/__tests__/mcp-preflight.test.ts` | Preflight check wiring |

#### Testability Assessment

- Easy to test:
  - Filesystem scanner (temp dirs with fixture files, same pattern as baselines-freshness tests)
  - JSON registry output (schema validation, deterministic output assertions)
  - CLI wrapper (same pattern as baselines-freshness-cli.ts)
- Hard to test:
  - Not investigated: no external dependencies or async operations involved

#### Recommended Test Approach

- Unit tests: scanner produces correct registry from fixture assessment directories
- Unit tests: conditional stage logic (ASSESSMENT-15 physical-product gate, ASSESSMENT-05 optional)
- Integration tests: mcp-preflight wiring (if added)

## Questions

### Resolved

- Q: Should the registry replace or augment existing advancement gates?
  - A: Augment. The registry is read infrastructure that answers "what's complete?" — the gates continue to enforce "is this complete enough to advance?" independently. Wiring gates to consume the registry is a separate follow-on concern.
  - Evidence: `cmd-advance.md` inline checks are functional today; changing them increases blast radius unnecessarily.

- Q: Should this extend standing-registry.json or be a new file?
  - A: New file. `standing-registry.json` serves a different purpose (change-detection triggers for the ideas pipeline). Assessment completion tracking is orthogonal — it records per-business per-stage completion state, not artifact-level delta triggers.
  - Evidence: standing-registry.json has no `completed_at` field and uses `artifact_class`/`trigger_policy` semantics that don't apply to completion tracking.

- Q: Should the registry be populated by a scanner or by assessment skill completion hooks?
  - A: Scanner. Assessment skills run in skill mode (markdown instructions, not TypeScript), so they can't call a registration function. A deterministic scanner that reads the filesystem and produces the registry is simpler, testable, and idempotent.
  - Evidence: `baselines-freshness.ts` established exactly this pattern — filesystem scan → structured output.

- Q: What constitutes "completion" for each ASSESSMENT stage?
  - A: File existence matching a stage-specific filename pattern (dated or undated depending on stage) + `Status: Active` or `Status: Draft` in frontmatter (either is sufficient — Draft means created but not fully reviewed; Active means reviewed). The key signal is "has the business produced an artifact for this stage?" Each stage needs its own pattern rule since filenames are not uniform.
  - Evidence: HBAG index uses `Active`/`Draft`/`—` vocabulary; GATE-ASSESSMENT-01 checks for file existence + quality minimum. Some artifacts are dated (`2026-02-21-brand-identity-dossier.user.md`), others are not (`current-problem-framing.user.md`, `s1-readiness.user.md`).

- Q: Should the registry include the conditional stages (01-08) or just the ASSESSMENT container stages (10-15)?
  - A: All 14 stages (01-11, 13-15). The conditional stages (01-08) are only required when `start-point=problem`, but the registry should record what exists regardless of whether it was required. The registry answers "what has been done?" not "what was required?" ASSESSMENT-12 is skill-only (dossier promotion) and not a loop-spec stage; it is excluded.
  - Evidence: `assessment-intake-sync.md` reads all 7 precursors (01-08) for intake; completeness of 01-08 is meaningful even if conditional. `loop-spec.yaml` note: "ASSESSMENT-12 (dossier promotion) remains skill-only and is NOT in loop-spec".

### Open (Operator Input Required)

None. All design questions are resolvable from evidence.

## Confidence Inputs

- Implementation: 90% — clear filesystem scanner pattern (baselines-freshness.ts establishes it), well-defined input paths, simple JSON output. Would reach 95% with a prototype confirming stage-to-filename mapping across all 5 businesses.
- Approach: 90% — deterministic scanner is the right approach; standing-registry.json extension was considered and rejected for good reasons. Would reach 95% with operator confirmation of the completion definition.
- Impact: 80% — immediate value for operator visibility; enables downstream automation (mcp-preflight, auto-generated index files). Would reach 90% when a consumer (mcp-preflight check or advancement gate) is wired up.
- Delivery-Readiness: 90% — no external dependencies, established test patterns, clear integration points.
- Testability: 95% — filesystem scanner with temp dirs is well-established in this codebase.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Stage-to-filename mapping is inconsistent across businesses | Medium | Medium | HBAG has both dated and undated filenames; scanner must use stage-specific pattern rules, not a single regex. Verify mapping against all 5 businesses during build. |
| Conditional stages produce false "incomplete" for businesses that don't need them | Medium | Low | Registry records what exists, not what's required; consumer logic handles conditionals |
| Assessment skills change artifact patterns in future | Low | Low | Scanner reads canonical stage list from both `stage-operator-dictionary.yaml` (01-11) and `loop-spec.yaml` (13-15); artifact patterns are well-established |

## Planning Constraints & Notes

- Must-follow patterns:
  - Follow baselines-freshness.ts scanner pattern (injectable options, testable, no side effects)
  - Output as JSON (consistent with standing-registry.json, queue-state.json)
  - Place scanner in `scripts/src/startup-loop/` alongside existing startup-loop tooling
- Rollout/rollback expectations:
  - Additive only — no existing behaviour changes
  - CLI script for operator visibility (same as check-baselines-freshness)
- Observability expectations:
  - CLI output shows per-business per-stage completion matrix
  - Optional mcp-preflight integration for automated visibility

## Suggested Task Seeds (Non-binding)

1. **Scanner module** — `scripts/src/startup-loop/assessment/assessment-completion-scanner.ts`: reads `strategy/<BIZ>/assessment/` directories, maps files to ASSESSMENT stages, produces JSON registry
2. **CLI wrapper** — `scripts/src/startup-loop/assessment/assessment-completion-cli.ts`: human-readable output, `pnpm check-assessment-completion` script
3. **Tests** — unit tests for scanner logic, integration tests for mcp-preflight wiring
4. **Optional: mcp-preflight check** — `assessment-completion-status` check showing per-business completion gaps

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - JSON registry output with per-business per-stage completion data
  - CLI script producing human-readable matrix
  - Unit tests for scanner (TC contracts matching baselines-freshness pattern)
- Post-delivery measurement plan:
  - Run scanner against all 5 businesses; verify output matches manual HBAG index
  - Confirm all 14 ASSESSMENT stages are mapped

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| ASSESSMENT stage definitions (stage-operator-dictionary.yaml + loop-spec.yaml) | Yes | None — 14 stages sourced from both files (01-11 from dictionary, 13-15 from loop-spec) | No |
| Per-business assessment artifact inventory | Yes | None — all 5 businesses inventoried | No |
| Existing completion tracking mechanisms | Yes | None — confirmed: manual index files only, no programmatic solution | No |
| derive-state.ts integration boundary | Yes | None — event ledger has no runs yet; registry is independent | No |
| standing-registry.json boundary | Yes | None — confirmed orthogonal purpose (change-detection vs completion tracking) | No |
| Test landscape for scanner pattern | Yes | None — baselines-freshness.ts provides exact reusable pattern | No |
| Conditional stage logic (ASSESSMENT-05 optional, -15 physical-product) | Yes | None — registry records what exists, consumers handle conditionals | No |

## Scope Signal

- Signal: right-sized
- Rationale: The scanner + CLI + tests is a well-bounded deliverable with clear filesystem patterns, established test infrastructure, and no external dependencies. The mcp-preflight integration is additive and can be deferred if scope grows. No evidence supports constraining further (the 14-stage scope is inherent) or expanding (wiring advancement gates to consume the registry is a separate concern).

## Evidence Gap Review

### Gaps Addressed

- Mapped all 14 ASSESSMENT stages from stage-operator-dictionary.yaml (01-11) and loop-spec.yaml (13-15) with conditional flags
- Confirmed GATE-ASSESSMENT-01 pass conditions from loop-spec.yaml
- Inventoried assessment artifacts across all 5 businesses
- Verified no programmatic completion tracking exists (globbed for `*completion*`, `*tracker*`, `*status*`)
- Confirmed standing-registry.json serves different purpose
- Identified reusable scanner pattern from baselines-freshness.ts (just built)
- Confirmed no event ledger runs exist yet

### Confidence Adjustments

- No adjustments needed. Evidence is comprehensive for a scanner-scoped deliverable.

### Remaining Assumptions

- Stage-to-filename mapping can be defined for all 14 stages (verified for HBAG which has the broadest coverage; mapping rules must handle both dated and undated filename patterns)

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan assessment-completion-registry --auto`
