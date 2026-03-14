---
Type: Build-Record
Status: Complete
Domain: Repo / Agents
Last-reviewed: 2026-03-11
Feature-Slug: do-workflow-stage-handoff-packets
Execution-Track: mixed
Completed-date: 2026-03-11
artifact: build-record
---

# Build Record: DO Workflow Stage Handoff Packets

## Outcome Contract

- **Why:** The workflow now measures real token usage and shows that repeated stage-shell and thread carryover dominate cost, especially between analysis and plan.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Add deterministic stage handoff packets so downstream DO stages can load bounded structured sidecars first, escalate to full upstream markdown only when needed, and preserve engineering coverage expectations across the whole workflow.
- **Source:** operator

## What Was Built

Added a deterministic stage handoff packet generator in `packages/skill-runner` with a CLI entrypoint and shell wrapper. The generator now emits canonical `fact-find.packet.json`, `analysis.packet.json`, and `plan.packet.json` sidecars from the corresponding markdown artifacts, using compact structured payloads rather than copying whole sections or task blocks.

Added one canonical packet contract in `docs/business-os/startup-loop/contracts/do-stage-handoff-packet-contract.md` and updated the core workflow docs and stage skills so packet generation and packet-first loading are part of the standard feature-development (DO) flow. The updated skills now treat the full upstream markdown artifact as an escalation path rather than the default cross-stage input.

Persisted the full workflow artifact chain for this feature slug, generated real packet sidecars for it, and recorded packet-aware workflow telemetry across `lp-do-ideas`, `lp-do-fact-find`, `lp-do-analysis`, `lp-do-plan`, and `lp-do-build`. The proof run now shows packet paths in analysis/plan/build context instead of forcing markdown-only upstream inputs.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @acme/skill-runner typecheck` | Pass | Targeted package typecheck for the new packet generator, parser helpers, CLI, and exports. |
| `pnpm --filter @acme/skill-runner lint` | Pass | No blocking lint errors; package warning backlog remains, including existing non-i18n/internal-string and non-literal path warnings. |
| `bash scripts/validate-fact-find.sh docs/plans/do-workflow-stage-handoff-packets/fact-find.md docs/plans/do-workflow-stage-handoff-packets/critique-history.md` | Pass | Fact-find and critique-history validation. |
| `bash scripts/validate-engineering-coverage.sh docs/plans/do-workflow-stage-handoff-packets/fact-find.md` | Pass | Fact-find engineering coverage validation. |
| `bash scripts/validate-engineering-coverage.sh docs/plans/do-workflow-stage-handoff-packets/analysis.md` | Pass | Analysis engineering coverage validation. |
| `bash scripts/validate-plan.sh docs/plans/do-workflow-stage-handoff-packets/plan.md` | Pass | Plan validation. |
| `bash scripts/validate-engineering-coverage.sh docs/plans/do-workflow-stage-handoff-packets/plan.md` | Pass | Plan engineering coverage validation. |
| `bash scripts/generate-stage-handoff-packet.sh docs/plans/do-workflow-stage-handoff-packets/fact-find.md` | Pass | Wrote `fact-find.packet.json`. |
| `bash scripts/generate-stage-handoff-packet.sh docs/plans/do-workflow-stage-handoff-packets/analysis.md` | Pass | Wrote `analysis.packet.json`. |
| `bash scripts/generate-stage-handoff-packet.sh docs/plans/do-workflow-stage-handoff-packets/plan.md` | Pass | Wrote `plan.packet.json`. |
| `pnpm --filter scripts startup-loop:lp-do-ideas-record-workflow-telemetry -- --stage lp-do-ideas ...` | Pass | Established the feature baseline for packet-aware workflow telemetry. |
| `pnpm --filter scripts startup-loop:lp-do-ideas-record-workflow-telemetry -- --stage lp-do-fact-find ...` | Pass | Recorded fact-find stage telemetry for the persisted slug. |
| `pnpm --filter scripts startup-loop:lp-do-ideas-record-workflow-telemetry -- --stage lp-do-analysis ... --input-path docs/plans/do-workflow-stage-handoff-packets/fact-find.packet.json` | Pass | Recorded analysis stage using the upstream packet sidecar. |
| `pnpm --filter scripts startup-loop:lp-do-ideas-record-workflow-telemetry -- --stage lp-do-plan ... --input-path docs/plans/do-workflow-stage-handoff-packets/analysis.packet.json --input-path docs/plans/do-workflow-stage-handoff-packets/fact-find.packet.json` | Pass | Recorded plan stage using packet-first upstream context. |
| `pnpm --filter scripts startup-loop:lp-do-ideas-record-workflow-telemetry -- --stage lp-do-build ... --input-path docs/plans/do-workflow-stage-handoff-packets/plan.packet.json --input-path docs/plans/do-workflow-stage-handoff-packets/analysis.packet.json` | Pass | Recorded build stage with packet-first upstream context and an existing build record artifact. |
| `pnpm --filter scripts startup-loop:lp-do-ideas-report-workflow-telemetry -- --feature-slug do-workflow-stage-handoff-packets --format markdown` | Pass | Returned a 5-stage summary with 100.0% token coverage and no missing context paths. |
| `DOCS_LINT_INCLUDE_UNTRACKED=1 pnpm docs:lint` | Fail | `docs/registry.json` regenerated successfully, but changed-doc lint still failed on unrelated pre-existing changed docs outside this feature scope. Our new packet contract and critique-history issues were fixed before the final rerun. |
| `git diff --check -- <touched files>` | Pass | No whitespace or conflict-marker issues in the touched set. |
| `bash scripts/validate-engineering-coverage.sh docs/plans/do-workflow-stage-handoff-packets/build-record.user.md` | Pass | Final build-record engineering coverage validation. |

## Workflow Telemetry Summary

Five workflow-step records were appended for this slug, covering `lp-do-ideas`, `lp-do-fact-find`, `lp-do-analysis`, `lp-do-plan`, and `lp-do-build`. Reporter summary: 100.0% token measurement coverage, `226000` context-input bytes, `32420` artifact bytes, `9` modules, `8` deterministic checks, `2738572` captured input tokens, and `5152` captured output tokens, with no missing stage records, no missing token measurements, and no missing context paths.

## Validation Evidence

### TASK-01
- TC-01-A: `generate-stage-handoff-packet.ts` extracts bounded stage payloads and envelope fields from canonical markdown artifacts.
- TC-01-B: the CLI and shell wrapper write packet sidecars to the canonical `docs/plans/<slug>/*.packet.json` paths.
- TC-01-C: `@acme/skill-runner` typecheck and lint passed for the new generator surface.

### TASK-02
- TC-02-A: `do-stage-handoff-packet-contract.md` is now the canonical packet contract for load order, envelope fields, and stage payload requirements.
- TC-02-B: `loop-output-contracts.md` and `feature-workflow-guide.md` now reference the sidecars as the bounded progressive-disclosure handoff.
- TC-02-C: `lp-do-ideas`, `lp-do-fact-find`, `lp-do-analysis`, `lp-do-plan`, and `lp-do-build` now describe packet generation/consumption in the correct stage order.

### TASK-03
- TC-03-A: the persisted fact-find, analysis, and plan artifacts all passed their validators.
- TC-03-B: the slug emitted real `fact-find.packet.json`, `analysis.packet.json`, and `plan.packet.json` files.
- TC-03-C: workflow telemetry records for analysis, plan, and build explicitly include packet sidecar paths in the stage context.

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | N/A | Workflow/process change only. |
| UX / states | Packet-first loading is now explicit in the workflow guide and DO stage skills | Stages escalate to full markdown only when needed. |
| Security / privacy | Packet files are source-derived extracts from repo docs only | No new runtime or external data source is persisted into the packets. |
| Logging / observability / audit | Workflow telemetry now records packet sidecar paths for analysis, plan, and build | Packet usage becomes measurable rather than assumed. |
| Testing / validation | Targeted `skill-runner` typecheck/lint plus fact-find/plan/engineering validators all passed | The feature proof includes real packet generation, not just doc updates. |
| Data / contracts | One canonical packet contract defines envelope, payload, and load order | Prevents packet semantics drifting into multiple stage files. |
| Performance / reliability | Packet payloads are bounded and compact; plan packet carries runnable task briefs instead of full task blocks | This is the deterministic progressive-disclosure improvement targeted by the feature. |
| Rollout / rollback | Sidecars are additive next to the canonical markdown artifacts | Full upstream markdown remains the fallback path. |

## Scope Deviations

None.
