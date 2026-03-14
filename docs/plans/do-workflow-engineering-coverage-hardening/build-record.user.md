---
Type: Build-Record
Status: Complete
Domain: Repo / Agents
Last-reviewed: "2026-03-11"
Feature-Slug: do-workflow-engineering-coverage-hardening
Execution-Track: mixed
Completed-date: "2026-03-11"
artifact: build-record
---

# Build Record: DO Workflow Engineering Coverage Hardening

## Outcome Contract

- **Why:** The DO workflow still spends tokens on repeated fixed rules and does not consistently force code-bearing work to cover UX, security, observability, testing, contracts, reliability, and rollout concerns end to end.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Introduce one shared engineering coverage contract plus deterministic validation, and wire it through the `lp-do-ideas -> lp-do-build` workflow.
- **Source:** operator

## What Was Built

Added a shared engineering coverage contract in `.claude/skills/_shared/engineering-coverage-matrix.md`, updated the canonical DO templates and loop output contract to carry explicit coverage sections/blocks, and extended `packages/skill-runner` with a deterministic engineering coverage validator plus CLI wrapper. The DO workflow skills now point to the shared contract and validator instead of re-describing fixed coverage doctrine in multiple places, and the stale fact-find validator wording was aligned to the `fact-find -> analysis -> plan` flow.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @acme/skill-runner typecheck` | Pass | package typecheck clean |
| `pnpm --filter @acme/skill-runner exec eslint src/validate-engineering-coverage.ts src/cli/validate-engineering-coverage.ts src/validate-fact-find.ts` | Pass | warnings only; no errors |
| `pnpm --filter @acme/skill-runner lint` | Pass | exits `0`; package still has pre-existing warning backlog |
| `bash scripts/validate-fact-find.sh docs/plans/do-workflow-engineering-coverage-hardening/fact-find.md docs/plans/do-workflow-engineering-coverage-hardening/critique-history.md` | Pass | ready `true`, score `4.6`, no blockers |
| `bash scripts/validate-engineering-coverage.sh docs/plans/do-workflow-engineering-coverage-hardening/fact-find.md` | Pass | `artifactType=fact-find`, `track=mixed`, no errors |
| `bash scripts/validate-engineering-coverage.sh docs/plans/do-workflow-engineering-coverage-hardening/analysis.md` | Pass | `artifactType=analysis`, `track=mixed`, no errors |
| `bash scripts/validate-plan.sh docs/plans/do-workflow-engineering-coverage-hardening/plan.md` | Pass | active IMPLEMENT tasks: `TASK-01`, `TASK-02`, `TASK-03` |
| `bash scripts/validate-engineering-coverage.sh docs/plans/do-workflow-engineering-coverage-hardening/plan.md` | Pass | `artifactType=plan`, `track=mixed`, no errors |
| `bash scripts/validate-engineering-coverage.sh docs/plans/do-workflow-engineering-coverage-hardening/build-record.user.md` | Pass | `artifactType=build-record`, `track=mixed`, no errors |
| `git diff --check -- <touched files>` | Pass | no whitespace or conflict-marker issues on touched set |

## Validation Evidence

### TASK-01
- Added shared contract and inserted canonical coverage sections into fact-find, analysis, plan, task, and build-record templates.
- Updated loop output contract and feature workflow guide to reflect the new sections and deterministic helpers.

### TASK-02
- Added `validate-engineering-coverage.ts`, CLI entrypoint, and shell wrapper.
- Updated `validate-fact-find.ts` to use `Analysis Readiness` / `Ready-for-analysis`.
- `@acme/skill-runner` typecheck passed; targeted ESLint pass confirmed no errors in the touched validator files.

### TASK-03
- Wired shared contract and validator references through ideas, fact-find, analysis, plan, build, and critique docs.
- Shifted code/mixed delivery rehearsal toward the shared engineering coverage matrix while keeping business-artifact delivery rehearsal lighter.
- Artifact-chain validators passed for `fact-find.md`, `analysis.md`, `plan.md`, and `build-record.user.md`.

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | Shared matrix + template/task/build wiring | preserved existing frontend rigor |
| UX / states | Shared matrix + plan/build/critique wiring | no longer only a late-stage lens |
| Security / privacy | Shared matrix + ideas/fact-find/plan/critique wiring | normalized across stages |
| Logging / observability / audit | Shared matrix + validator + build/plan wiring | newly first-class |
| Testing / validation | Shared matrix + validator + build/plan wiring | complements TC/VC contracts |
| Data / contracts | Shared matrix + validator + fact-find/plan wiring | aligns with consumer tracing |
| Performance / reliability | Shared matrix + build/analysis/fact-find wiring | elevated beyond one fact-find bullet |
| Rollout / rollback | Shared matrix + task/build/template wiring | preserved as first-class concern |

## Scope Deviations

None. The work stayed within workflow docs, templates, and the deterministic skill-runner package.
