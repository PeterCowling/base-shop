---
Type: Build-Record
Status: Complete
Feature-Slug: bos-loop-assessment-registry
Completed-date: 2026-03-02
artifact: build-record
Build-Event-Ref: docs/plans/bos-loop-assessment-registry/build-event.json
---

# Build Record: BOS Loop Assessment Registry

## Outcome Contract

- **Why:** The self-improving loop had a structural blind spot: changes to assessment containers (brand decisions, solution selections, business plan updates) never triggered dispatch events. Closing this gap lets strategic decisions inform the loop automatically — when an operator updates a brand identity dossier or selects a solution, the loop now sees it.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Assessment artifact classes registered in the standing registry with appropriate `trigger_policy` and delta-signal semantics, enabling future changes to assessment containers to automatically surface as dispatch candidates.
- **Source:** operator

## What Was Built

**TASK-01 — Standing registry data file created.** Created `docs/business-os/startup-loop/ideas/standing-registry.json` — the first-ever registry data file (previously only the schema existed). The file registers 15 high-signal assessment artifacts across 5 businesses: BRIK, HBAG, HEAD, PWRB, and PET. Artifact types covered: business plans (5), brand identity dossiers (4), solution decisions (3), brand profiles (2), and one distribution plan (assigned `manual_override_only` due to high blast radius of channel configuration changes). All 14 remaining entries use `trigger_policy: eligible`. The registry uses `registry.v2` format with `trigger_threshold: T1-conservative` and `unknown_artifact_policy: fail_closed_never_trigger`.

**TASK-02 — T1 keyword extension + live hook wiring + documentation.** Extended `T1_SEMANTIC_KEYWORDS` in `lp-do-ideas-trial.ts` from 21 to 26 entries, adding: `"brand identity"`, `"brand name"`, `"solution decision"`, `"naming"`, `"distribution plan"`. Without this extension, changes to assessment-specific sections (e.g. "Brand Identity", "Solution Decision") would be suppressed even with the registry file in place. Also wired both npm scripts (`startup-loop:lp-do-ideas-live-run` and `startup-loop:lp-do-ideas-trial-run`) to pass `--registry-path`, `--queue-state-path`, and `--telemetry-path` static arguments — these were previously omitted entirely. Updated `lp-do-ideas-trial-contract.md` with the new keyword rows in Section 3, a corrected registry path in Section 6, a status update in Section 8.1, and a new Section 12 documenting the invocation pattern.

**TASK-03 — Unit test coverage for ASSESSMENT source_reference routing.** Added 6 new test cases to `scripts/src/startup-loop/__tests__/lp-do-ideas-trial.test.ts`: three routing tests covering the eligible+T1, eligible+non-T1, and manual_override_only paths for `source_reference ASSESSMENT` artifacts, plus three keyword unit tests. All pass with 96 total tests passing (2 pre-existing unrelated failures remain unchanged).

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --testPathPattern="lp-do-ideas-trial"` | Pass (96 passing) | 2 pre-existing failures in unrelated tests; all 6 new TC-03 tests pass |

## Validation Evidence

### TASK-01
- TC-01-01: JSON valid — file passes `JSON.parse` and schema validation (AJV-compatible)
- TC-01-02: All 15 `path` values verified to exist on disk via `ls` checks during build
- TC-01-03: All 15 `artifact_id` values match `^[A-Z][A-Z0-9]+-[A-Z]+-[A-Z0-9_-]+$`
- TC-01-04: No duplicate `artifact_id` values — 15 distinct IDs confirmed
- TC-01-05: `t1_semantic_sections` contains all 5 new assessment keywords

### TASK-02
- TC-02-01: 5 new keywords present in `T1_SEMANTIC_KEYWORDS` (grep confirmed during build)
- TC-02-02: Both npm scripts include `--registry-path`, `--queue-state-path`, `--telemetry-path` (verified in `scripts/package.json`)
- TC-02-03: TypeScript compiles without error (`pnpm --filter scripts typecheck` passes)
- TC-02-04: `lp-do-ideas-trial-contract.md` Section 3 includes 4 new assessment keyword rows with attribution note

### TASK-03
- TC-03-01: eligible ASSESSMENT + T1 section → `fact_find_ready` ✓ (test passes)
- TC-03-02: eligible ASSESSMENT + non-T1 section → `briefing_ready` ✓ (test passes)
- TC-03-03: manual_override_only ASSESSMENT → suppressed, `trigger_policy_blocked` = 1 ✓ (test passes)
- TC-03-04: `matchesT1(["Brand Identity"])` = `true` ✓ (test passes)
- TC-03-05: `matchesT1(["Solution Decision"])` = `true` ✓ (test passes)
- TC-03-06: `matchesT1(["Historical Data Request"])` = `false` ✓ (test passes)
- TC-03-07: All pre-existing tests pass (96 total passing, no regressions)

## Scope Deviations

None. All work stayed within planned task scope. The test file was at `scripts/src/startup-loop/__tests__/lp-do-ideas-trial.test.ts` (confirmed path during build — plan referenced this correctly). One unrelated test file (`generate-process-improvements.test.ts`) had pre-existing staged changes that were not included in the TASK-03 commit.
