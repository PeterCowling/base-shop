---
Type: Guide
Status: Active
Domain: Repo / Agents
Last-reviewed: 2026-03-12
---

# Feature Workflow Guide (All Agents)

This is the **entrypoint** for feature work in Base-Shop. It is intentionally short: follow it to pick the right mode, then open the corresponding skill doc for full instructions.

## Start Here

1. Read `AGENTS.md` (universal rules, safety, commands).
2. Read your agent overlay:
   - Codex: `CODEX.md`
   - Claude Code: `CLAUDE.md`
3. Use the workflow below for any non-trivial change.

## The Workflow (Progressive Disclosure)

Read only the skill you need for the current phase:

- **Briefing (understand only):** `.claude/skills/lp-do-briefing/SKILL.md`
- **Fact-find (planning):** `.claude/skills/lp-do-fact-find/SKILL.md`
- **Analysis (choose approach):** `.claude/skills/lp-do-analysis/SKILL.md`
- **Plan:** `.claude/skills/lp-do-plan/SKILL.md` (auto-runs `/lp-do-sequence` at the end)
- **Build:** `.claude/skills/lp-do-build/SKILL.md`
- **Re-plan:** `.claude/skills/lp-do-replan/SKILL.md` (auto-runs `/lp-do-sequence` at the end)

For non-code deliverables, `/lp-do-build` dispatches to progressive execution skills (for example: `/draft-email`, `/biz-product-brief`, `/draft-marketing`, `/biz-spreadsheet`, `/draft-whatsapp`).

## Phase Selection (Decision Tree)

- **You want to understand a system without planning a change** → Briefing (`/lp-do-briefing`)
- **You don't understand current behavior or blast radius yet, and intend to change it** → Fact-find
- **You understand the current state and need to compare/select the right approach** → Analysis
- **You need tasks + acceptance criteria + confidence** → Plan-feature (includes sequencing)
- **You have an approved plan + an eligible task** → Build-feature
- **Task is below its execution threshold (`IMPLEMENT/SPIKE <80`, `INVESTIGATE <60`), blocked, or scope changes during build** → Re-plan (includes sequencing)
- **You need to reorder an existing plan or check parallelism opportunities** → Sequence-plan (standalone)

## Plan Confidence

In plan docs, use **confidence** / **Overall-confidence** terminology for planning confidence.

- **Confidence ≥90:** target/motivation (aim for it when credible)
- **Confidence 80–89:** implementation/spike build-eligible when unblocked
- **Confidence 60–79:** caution; often planning-only unless task type is INVESTIGATE
- **Confidence <60:** do not build; lp-do-replan first

**Build gates:**
- **IMPLEMENT** and **SPIKE** tasks require **≥80%** confidence and unblocked dependencies.
- **INVESTIGATE** tasks require **≥60%** confidence and unblocked dependencies.
- **CHECKPOINT** is procedural and handled by `/lp-do-build` checkpoint flow.

## Scientific Re-Plan Rules

When running `/lp-do-replan`, confidence increases must be evidence-led:

- Do not raise confidence from narrative reasoning alone.
- Use an evidence ladder:
  - **E1:** static repo audit (small uplift only)
  - **E2:** executable verification (tests/probes/scripts)
  - **E3:** precursor spike/prototype outcome
- If uncertainty remains after audit, add explicit **precursor INVESTIGATE/SPIKE tasks** and make blocked tasks depend on them.
- Avoid promoting tasks from **<80% to ≥80%** unless key unknowns are closed with E2+ evidence.

## Quality Gates (Non-negotiable)

- Targeted tests only; never run unfiltered `pnpm test` (see `docs/testing-policy.md`).
- `pnpm typecheck && pnpm lint` is the baseline validation gate (also enforced by git hooks where available).
- Avoid destructive git commands; follow `AGENTS.md` and `docs/git-safety.md`.
- For `Execution-Track: code | mixed`, use the shared engineering contract at `.claude/skills/_shared/engineering-coverage-matrix.md` across fact-find, analysis, plan, and build artifacts.
- Deterministic workflow helpers:
  - `scripts/validate-analysis.sh`
  - `scripts/validate-fact-find.sh`
  - `scripts/validate-plan.sh`
  - `scripts/validate-engineering-coverage.sh`
  - `scripts/generate-stage-handoff-packet.sh`

## Progressive Handoff Packets

The DO workflow now uses bounded stage sidecars as the default cross-stage handoff:

- `fact-find.md` -> `fact-find.packet.json`
- `analysis.md` -> `analysis.packet.json`
- `plan.md` -> `plan.packet.json`

Contract: `docs/business-os/startup-loop/contracts/do-stage-handoff-packet-contract.md`

Default load order:
1. upstream packet sidecar
2. current stage artifact
3. full upstream markdown only if the packet is insufficient

For process-changing work, the upstream packet is also expected to carry a compact `process_topology` payload derived from:
- `## Current Process Map`
- `## End-State Operating Model`
- `## Delivered Processes`

Generate/update the packet after the stage validators pass:

```bash
scripts/generate-stage-handoff-packet.sh docs/plans/<feature-slug>/fact-find.md
scripts/generate-stage-handoff-packet.sh docs/plans/<feature-slug>/analysis.md
scripts/generate-stage-handoff-packet.sh docs/plans/<feature-slug>/plan.md
```

## Workflow Telemetry

The ideas queue already records admission/cycle telemetry. DO stages should append `workflow_step` records to the same telemetry stream so token cost can be measured instead of inferred.

- Recorder:
  - `pnpm --filter scripts startup-loop:lp-do-ideas-record-workflow-telemetry -- --stage <lp-do-ideas|lp-do-fact-find|lp-do-analysis|lp-do-plan|lp-do-build> --feature-slug <slug> [--module <stage-local-module>] [--input-path <repo-relative-path>] [--deterministic-check <command-or-check-id>]`
- Reporter:
  - `pnpm --filter scripts startup-loop:lp-do-ideas-report-workflow-telemetry -- --feature-slug <slug> --format markdown`

Minimum expectation per stage:
- record the canonical persisted artifact for the stage,
- record the stage shell plus explicitly loaded modules,
- record any deterministic validators/checks run at that stage,
- record upstream `*.packet.json` paths when those bounded sidecars were part of the actual context load,
- let the recorder auto-capture token counts from Codex session metadata when `CODEX_THREAD_ID` is available,
- let the recorder auto-capture Claude token counts only when a concrete Claude session id is supplied (`--claude-session-id <session-id>` or `CLAUDE_SESSION_ID=<session-id>`); otherwise leave Claude on manual/unknown fallback.

## Outputs by Phase

- **Fact-find:** `docs/plans/<feature>/fact-find.md` (evidence + impact map)
- **Analysis:** `docs/plans/<feature>/analysis.md` (options compared + chosen approach + planning handoff)
- **Plan-feature:** `docs/plans/<feature>/plan.md` (atomic tasks + per-task confidence)
- **Build-feature:** code and/or business artifacts + plan updated per task; commits tied to TASK IDs
- **Re-plan:** plan updated with evidence/decisions/confidence (no implementation changes)

For `fact-find`, `analysis`, and `plan`, the canonical bounded handoff packet is also emitted alongside the markdown artifact.

## Optional CASS Pilot (Session Retrieval)

To accelerate startup-loop continuity across runs, run retrieval before fact-find/plan:

```bash
pnpm startup-loop:cass-retrieve -- --mode fact-find --slug <feature-slug> --topic "<topic>"
pnpm startup-loop:cass-retrieve -- --mode plan --slug <feature-slug> --topic "<topic>"
```

Default advisory output:
- `docs/plans/<feature-slug>/artifacts/cass-context.md`

Configuration:
- `CASS_RETRIEVE_COMMAND` is optional. If unset, the built-in CASS-compatible session-history provider is used.
- Set `CASS_RETRIEVE_COMMAND` to your external CASS invocation when available.
- Runtime env passed to the command: `CASS_QUERY`, `CASS_TOP_K`, `CASS_SOURCE_ROOTS`.
- If external CASS is unavailable, script falls back to local `rg` retrieval and the workflow continues (fail-open).
- Detailed setup: `docs/runbooks/startup-loop-cass-pilot.md`

## Business OS Card Tracking

DO workflow skills (`/lp-do-fact-find`, `/lp-do-analysis`, `/lp-do-plan`, `/lp-do-build`) are **filesystem-only**. They do not create or update BOS cards, stage docs, or lane transitions. Card and lane tracking for DO-stage work is done manually via `/idea-advance` when needed.

### What is automated via BOS API

- `/idea-generate`: creates prioritized ideas/cards and seeds top-K `lp-do-fact-find` stage docs.

All DO workflow artifacts are tracked through the `docs/plans/<feature-slug>/` filesystem namespace.

### Discovery freshness

`docs/business-os/_meta/rebuild-discovery-index.sh` reads plan and fact-find artifact status from the filesystem. Run it after adding or moving plans to refresh `docs/business-os/_meta/discovery-index.json`.

**Shared helpers:** `.claude/skills/_shared/card-operations.md` and `.claude/skills/_shared/stage-doc-operations.md`

## Special-Purpose Workflows

- **Business OS coordination:** `docs/business-os/agent-workflows.md` (idea management, card lifecycle, plan updates)
- **Pre-intake problem-first entry:** Use when beginning a startup from a customer problem rather than a committed product. Add `--start-point problem` to `/startup-loop start`. This routes through ASSESSMENT-01 to ASSESSMENT-04 before ASSESSMENT-09 intake:
  - ASSESSMENT-01 Problem framing → `/lp-do-assessment-01-problem-statement` → `docs/business-os/strategy/<BIZ>/problem-statement.user.md`
  - ASSESSMENT-02 Solution-space scan → `/lp-do-assessment-02-solution-profiling` → deep research prompt + operator-filled results artifact
  - ASSESSMENT-03 Solution selection → `/lp-do-assessment-03-solution-selection` → decision record with shortlist and elimination rationale; explicit kill gate if no viable option
  - ASSESSMENT-04 Candidate names → `/lp-do-assessment-04-candidate-names` → naming pipeline (spec, generate 250 candidates, RDAP check, rank shortlist → `<YYYY-MM-DD>-candidate-names.user.md`)
  - ASSESSMENT-05 Name selection → `/lp-do-assessment-05-name-selection` → naming generation spec (Part 1 of the pipeline, invoked by ASSESSMENT-04)
  - Default (`--start-point product` or flag absent) bypasses ASSESSMENT-01 to ASSESSMENT-04 entirely — no behavior change for existing operators.
  - After ASSESSMENT completion, startup-loop advances through `MEASURE-00` (Problem framing and ICP) before `MEASURE-01`; this keeps MARKET-01 and DO context aligned with current problem framing.
  - See gate routing: `.claude/skills/startup-loop/modules/cmd-start.md` Gate D
