---
Type: Build-Record
Status: Complete
Feature-Slug: startup-loop-assessment-post-build-refresh
Completed-date: 2026-03-09
artifact: build-record
---

# Build Record: startup-loop-assessment-post-build-refresh

## Outcome Contract

- **Why:** The assessment layer represents the accumulated strategic knowledge of a business. Builds can change strategic facts such as brand name, solution posture, or product naming, but the assessment balance sheet is not refreshed after the build cycle, so it drifts out of sync with accumulated loop learnings.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A defined mechanism exists for assessment containers to be updated after builds that touch strategy-relevant artifacts, preventing the assessment layer from drifting out of sync with accumulated loop learnings.
- **Source:** operator

## What Was Built

Added a deterministic post-build assessment refresh utility at `scripts/src/startup-loop/build/lp-do-build-assessment-refresh.ts` and exposed it through `scripts/package.json` as `startup-loop:assessment-post-build-refresh`. The first bounded mapping supports later name decisions (`DEC-<BIZ>-NAME-*`) and updates only the intake packet naming summary, Section B naming fields, and the revision-mode naming constraint row.

Updated the architecture and process contracts so this path is explicit and bounded. `two-layer-model.md`, `loop-output-contracts.md`, `carry-mode-schema.md`, and `.claude/skills/lp-do-build/SKILL.md` now distinguish standing `results-review` feedback from deterministic assessment refresh, and they explicitly protect seed-once/live-owned docs from re-seeding.

Added fixture-backed regression coverage in `scripts/src/startup-loop/__tests__/lp-do-build-assessment-refresh.test.ts` for qualifying decision detection, confirmed-name intake refresh, no-op behavior for unrelated changed files, idempotent rerun behavior, and seed-once doc preservation.

Applied the new refresh path to the live HEAD drift case. `docs/business-os/startup-baselines/HEAD/2026-02-12-assessment-intake-packet.user.md` now reflects `Facilella` as the confirmed business name, updates the naming summary and territory, and replaces the stale provisional naming constraint with the confirmed decision state from `DEC-HEAD-NAME-01`.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm exec tsc -p scripts/tsconfig.json --noEmit` | Pass | Targeted scripts package typecheck for the new utility |
| `pnpm exec eslint --no-ignore --no-warn-ignored scripts/src/startup-loop/build/lp-do-build-assessment-refresh.ts scripts/src/startup-loop/__tests__/lp-do-build-assessment-refresh.test.ts` | Pass | Targeted lint for changed scripts files |
| `node --import tsx scripts/src/startup-loop/build/lp-do-build-assessment-refresh.ts --root-dir . --changed-file docs/business-os/strategy/HEAD/assessment/DEC-HEAD-NAME-01.user.md --dry-run` | Pass | Preview showed the bounded HEAD targets before mutation |
| `node --import tsx scripts/src/startup-loop/build/lp-do-build-assessment-refresh.ts --root-dir . --changed-file docs/business-os/strategy/HEAD/assessment/DEC-HEAD-NAME-01.user.md` | Pass | Applied the live HEAD refresh |
| same command rerun immediately | Pass | Returned `noop` with `intake_already_matches_decision`, proving idempotence |

## Validation Evidence

### TASK-01
- TC-01: qualifying `DEC-<BIZ>-NAME-*` changed files are recognized as refresh-eligible sources.
- TC-02: the utility updates only bounded intake targets; no seed-once/live-owned docs are part of the mapping.
- TC-03: contract docs and build skill now describe the same bounded refresh path.

### TASK-02
- TC-01: the new fixture suite covers confirmed-name refresh into intake.
- TC-02: the suite includes a no-op case for unrelated changed files.
- TC-03: the suite checks that a seed-once `current-problem-framing.user.md` fixture remains unchanged.
- Note: Jest was not run locally because repo policy reserves test execution for CI.

### TASK-03
- TC-01: the HEAD intake packet was refreshed from `Nidilo` to `Facilella` using the new utility.
- TC-02: targeted typecheck passed.
- TC-03: targeted lint passed.
- Follow-up validation: immediate rerun produced `noop`, confirming idempotence on the live target.

## Scope Deviations

None.
