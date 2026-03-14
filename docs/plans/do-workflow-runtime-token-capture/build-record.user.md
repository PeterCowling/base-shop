---
Type: Build-Record
Status: Complete
Domain: Repo / Agents
Last-reviewed: 2026-03-11
Feature-Slug: do-workflow-runtime-token-capture
Execution-Track: mixed
Completed-date: 2026-03-11
artifact: build-record
---

# Build Record: DO Workflow Runtime Token Capture

## Outcome Contract

- **Why:** The workflow telemetry layer now records context and module cost, but the token fields still sit at 0% coverage because they are not populated from runtime metadata.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Auto-capture real workflow token usage for Codex-backed DO stages, keep the prompt path untouched, and support Claude when a concrete session-usage source is supplied while preserving manual fallback otherwise.
- **Source:** operator

## What Was Built

Added provider-aware runtime token capture in the workflow-step recorder. Codex-backed runs now resolve the current session from `CODEX_THREAD_ID`, and Claude-backed runs can also resolve runtime usage when the recorder is given an explicit Claude session id. The runtime helper converts provider-side cumulative totals into per-feature stage deltas and preserves provider/session/snapshot provenance in the telemetry record without writing home-directory paths into repo artifacts.

Updated the workflow contract and DO guidance so token measurement rules are explicit. The schema now describes Codex and explicit-session Claude capture, the feature workflow guide documents the `--claude-session-id` opt-in seam, and the DO stage skills now state the exact fallback rule instead of implying Claude is permanently unsupported.

Persisted the `fact-find -> analysis -> plan -> build-record` artifact chain for this slug, including the critique history that tightened the Claude boundary from “manual only” to “explicit-session only.” The end-to-end proof is completed by recording live workflow telemetry for this feature and summarizing it below.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm exec tsc -p scripts/tsconfig.json --noEmit` | Pass | Targeted scripts typecheck for recorder/helper/test changes. |
| `pnpm exec eslint scripts/src/startup-loop/ideas/workflow-runtime-token-usage.ts scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry.ts scripts/src/startup-loop/__tests__/lp-do-ideas-workflow-telemetry.test.ts` | Pass | Targeted lint after import-sort fix. |
| `bash scripts/validate-fact-find.sh docs/plans/do-workflow-runtime-token-capture/fact-find.md docs/plans/do-workflow-runtime-token-capture/critique-history.md` | Pass | Fact-find and critique-history validation. |
| `bash scripts/validate-engineering-coverage.sh docs/plans/do-workflow-runtime-token-capture/fact-find.md` | Pass | Fact-find engineering coverage validation. |
| `bash scripts/validate-engineering-coverage.sh docs/plans/do-workflow-runtime-token-capture/analysis.md` | Pass | Analysis engineering coverage validation. |
| `bash scripts/validate-plan.sh docs/plans/do-workflow-runtime-token-capture/plan.md` | Pass | Plan validation. |
| `bash scripts/validate-engineering-coverage.sh docs/plans/do-workflow-runtime-token-capture/plan.md` | Pass | Plan engineering coverage validation. |
| `bash scripts/validate-engineering-coverage.sh docs/plans/do-workflow-runtime-token-capture/build-record.user.md` | Pass | Final build-record engineering coverage validation. |
| `pnpm --filter scripts startup-loop:lp-do-ideas-record-workflow-telemetry -- --stage lp-do-ideas --feature-slug do-workflow-runtime-token-capture --input-path docs/plans/do-workflow-runtime-token-capture/fact-find.md --deterministic-check queue-admission-baseline` | Pass | Established the feature baseline with Codex runtime usage. |
| `pnpm --filter scripts startup-loop:lp-do-ideas-record-workflow-telemetry -- --stage lp-do-fact-find --feature-slug do-workflow-runtime-token-capture --module modules/outcome-a-code.md --module modules/outcome-a-business.md --module ../_shared/engineering-coverage-matrix.md --input-path docs/plans/do-workflow-runtime-token-capture/fact-find.md --deterministic-check scripts/validate-fact-find.sh --deterministic-check scripts/validate-engineering-coverage.sh` | Pass | Recorded fact-find stage runtime delta. |
| `pnpm --filter scripts startup-loop:lp-do-ideas-record-workflow-telemetry -- --stage lp-do-analysis --feature-slug do-workflow-runtime-token-capture --module modules/analyze-mixed.md --module ../_shared/engineering-coverage-matrix.md --input-path docs/plans/do-workflow-runtime-token-capture/fact-find.md --input-path docs/plans/do-workflow-runtime-token-capture/analysis.md --deterministic-check scripts/validate-engineering-coverage.sh` | Pass | Recorded analysis stage runtime delta. |
| `pnpm --filter scripts startup-loop:lp-do-ideas-record-workflow-telemetry -- --stage lp-do-plan --feature-slug do-workflow-runtime-token-capture --module modules/plan-mixed.md --module ../_shared/engineering-coverage-matrix.md --input-path docs/plans/do-workflow-runtime-token-capture/analysis.md --input-path docs/plans/do-workflow-runtime-token-capture/fact-find.md --deterministic-check scripts/validate-plan.sh --deterministic-check scripts/validate-engineering-coverage.sh` | Pass | Recorded plan stage runtime delta. |
| `pnpm --filter scripts startup-loop:lp-do-ideas-record-workflow-telemetry -- --stage lp-do-build --feature-slug do-workflow-runtime-token-capture --module modules/build-code.md --module modules/build-validate.md --input-path docs/plans/do-workflow-runtime-token-capture/plan.md --input-path docs/plans/do-workflow-runtime-token-capture/analysis.md --deterministic-check scripts/validate-engineering-coverage.sh --deterministic-check build-record-summary` | Pass | Recorded build stage runtime delta against the draft build record artifact. |
| `pnpm --filter scripts startup-loop:lp-do-ideas-report-workflow-telemetry -- --feature-slug do-workflow-runtime-token-capture --format markdown` | Pass | Returned 5 stage records with 100% token measurement coverage. |

## Workflow Telemetry Summary

Five workflow-step records were appended for this slug, covering `lp-do-ideas`, `lp-do-fact-find`, `lp-do-analysis`, `lp-do-plan`, and `lp-do-build`. Reporter summary: 100.0% token measurement coverage, `198978` context-input bytes, `31155` artifact bytes, `9` modules, `8` deterministic checks, `1665042` captured input tokens, and `1703` captured output tokens, with no missing stages and no missing context paths.

## Validation Evidence

### TASK-01
- TC-01-A: `workflow-runtime-token-usage.ts` resolves current-session Codex usage and explicit-session Claude usage into provider-scoped snapshots.
- TC-01-B: `lp-do-ideas-workflow-telemetry.test.ts` proves first-record fallback and later delta mode for both Codex and Claude fixtures.
- TC-01-C: targeted `tsc` and `eslint` passed for the recorder/helper/test surface.

### TASK-02
- TC-02-A: `docs/business-os/startup-loop/ideas/lp-do-ideas-telemetry.schema.md` documents runtime provider/session/snapshot fields and the explicit Claude session seam.
- TC-02-B: `docs/agents/feature-workflow-guide.md` and the DO stage skills document Codex auto-capture plus `--claude-session-id` / `CLAUDE_SESSION_ID` opt-in behavior.
- TC-02-C: the runtime-token-capture fact-find, analysis, plan, and critique-history artifacts reflect the updated Claude boundary.

### TASK-03
- TC-03-A: the persisted fact-find, analysis, and plan artifacts all passed their validators.
- TC-03-B: real workflow-step telemetry is recorded for this slug using the current Codex session as the feature baseline provider.
- TC-03-C: the final reporter summary below shows 5 stage records and 100.0% token measurement coverage for this slug.

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | N/A | Workflow/process change only. |
| UX / states | Stage recorder now distinguishes Codex auto, Claude explicit-session auto, and unknown/manual fallback | Prevents misleading “maybe automatic” behavior. |
| Security / privacy | Persisted telemetry stores provider/session IDs and numeric totals only | No home-directory paths are written into repo artifacts. |
| Logging / observability / audit | `runtime_usage_provider`, `runtime_session_id`, `runtime_usage_mode`, and runtime totals are recorded | Provides auditability for how token counts were derived. |
| Testing / validation | Targeted TS/lint plus plan/fact-find/coverage validators | Includes new fixture coverage for explicit-session Claude capture. |
| Data / contracts | Schema version bump and additive fields remain backward-compatible | Existing null/unknown behavior still fails open. |
| Performance / reliability | Codex still uses bounded tail scan; Claude remains opt-in rather than ambient-history guessing | Limits parser work and avoids brittle session attribution. |
| Rollout / rollback | Commands stay the same for Codex; Claude requires an explicit session id only when needed | Safe rollback is to omit the Claude session seam and fall back to unknown/manual. |

## Scope Deviations

Expanded the planned Claude boundary slightly. Instead of leaving Claude permanently manual/unknown, the build now supports explicit-session Claude capture because the local telemetry shape is good enough once session attribution is supplied directly. Implicit Claude session discovery from history/latest telemetry remains out of scope.
