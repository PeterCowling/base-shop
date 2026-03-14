---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: Repo / Agents
Workstream: Engineering
Created: "2026-03-11"
Last-updated: "2026-03-11"
Feature-Slug: do-workflow-runtime-token-capture
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas, lp-do-fact-find, lp-do-analysis, lp-do-plan, lp-do-build, lp-do-critique
Related-Analysis: docs/plans/do-workflow-runtime-token-capture/analysis.md
Trigger-Source: "direct-operator-decision: proceed with automatic token-source ingestion for the DO workflow"
Trigger-Why: The workflow telemetry layer now records context and module cost, but the token fields still sit at 0% coverage because they are not populated from runtime metadata.
Trigger-Intended-Outcome: "type: operational | statement: Auto-capture real workflow token usage for Codex-backed DO stages, keep the prompt path untouched, and support Claude when a concrete session-usage source is supplied while preserving manual fallback otherwise. | source: operator"
artifact: fact-find
---

# DO Workflow Runtime Token Capture Fact-Find Brief

## Scope
### Summary
Add automatic runtime token capture to workflow-step telemetry by reading current-session Codex usage metadata, converting cumulative totals into per-stage deltas, and supporting Claude when an explicit Claude session id is supplied.

### Goals
- capture real token usage without adding prompt-path overhead,
- establish a feature baseline at `lp-do-ideas` so later stages can use exact deltas,
- make the provider boundary explicit rather than pretending Codex and Claude expose the same telemetry surface.

### Non-goals
- reverse-engineering Claude telemetry into the hot path now,
- changing ideas queue semantics or rollup logic,
- adding model-specific logic to the skill markdown beyond command guidance.

### Constraints & Assumptions
- Constraints:
  - runtime token capture must fail open,
  - stage recording must stay deterministic and append-only,
  - current-session discovery must not depend on browsing or external APIs.
- Assumptions:
  - `CODEX_THREAD_ID` plus local `~/.codex/sessions/**/*.jsonl` is stable enough for Codex auto-capture,
  - Claude token telemetry exists locally and includes session-level usage events, but safe auto-capture depends on an explicit Claude session id rather than guessing from ambient history.

## Outcome Contract

- **Why:** The workflow telemetry layer now records context and module cost, but the token fields still sit at 0% coverage because they are not populated from runtime metadata.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Auto-capture real workflow token usage for Codex-backed DO stages, keep the prompt path untouched, and support Claude when a concrete session-usage source is supplied while preserving manual fallback otherwise.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry.ts` - current recorder with optional manual token fields only.
- `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry-report.ts` - current summary path showing 0% token coverage.
- `docs/business-os/startup-loop/ideas/lp-do-ideas-telemetry.schema.md` - workflow-step schema contract.
- `~/.codex/sessions/**/*.jsonl` - Codex runtime session logs.
- `~/.claude/telemetry/*.json` - Claude internal telemetry dumps.

### Key Findings
- Current Codex sessions expose structured `token_count` events with both cumulative totals and latest-response usage.
- The current environment exposes `CODEX_THREAD_ID`, which is enough to resolve the active Codex session log deterministically.
- Claude exposes token-related telemetry fields in local telemetry dumps, but not through a clean current-session log equivalent to Codex.
- The recorder already has a natural seam for provider-aware capture because token fields are optional and fail-open.

## Engineering Coverage Matrix
| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | N/A | workflow/process change only | no product UI | N/A: process-only |
| UX / states | Required | workflow summary already reports token coverage gaps | current stage summaries report `0.0%` token coverage | compare Codex auto-capture only vs Codex plus explicit-session Claude support |
| Security / privacy | Required | Codex session logs are local files | recorder must not leak home-dir paths into repo artifacts | keep only provider/session IDs and numeric totals |
| Logging / observability / audit | Required | workflow-step records already exist | no runtime snapshot provenance fields yet | add provider/session/snapshot fields additively |
| Testing / validation | Required | scripts package already validates telemetry code deterministically | new provider reader needs unit coverage for fallback and delta modes | add codex log fixture tests |
| Data / contracts | Required | schema already allows nullable token fields | needs additive runtime snapshot fields and clearer semantics | extend schema to describe delta/fallback behavior |
| Performance / reliability | Required | local sideband session logs avoid prompt overhead | first stage needs a baseline and file scanning must remain bounded | use `lp-do-ideas` as the baseline stage and tail-scan only |
| Rollout / rollback | Required | token fields already fail open | Claude path could become brittle if session attribution is guessed | allow Claude only behind an explicit session-id seam |

## Confidence Inputs
- Implementation: 90% - Codex exposes the exact usage event shape needed for bounded local parsing.
- Approach: 91% - provider-aware auto-capture with explicit-session Claude support is clearer than pretending parity exists.
- Impact: 88% - token coverage should become real for Codex-backed runs, though Claude remains partial.

## Analysis Readiness
- Ready: Yes
- Recommended next step: `lp-do-analysis`
- Rationale:
  - the main decision is scope of automatic support, not whether the runtime seam exists,
  - operator-only input is not required,
  - the code path is bounded to scripts + workflow docs.

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Codex current-session usage | Yes | None | No |
| Feature-baseline capture | Partial | [Moderate] first stage needs a baseline rule to avoid total-overcounting | Yes |
| Claude telemetry parity | Partial | [Moderate] safe use requires an explicit session-id seam rather than implicit current-session discovery | Yes |
