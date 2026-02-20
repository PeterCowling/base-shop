---
name: startup-loop
description: Chat command wrapper for operating Startup Loop runs. Supports /startup-loop start|status|submit|advance with strict stage gating, prompt handoff, and Business OS sync checks. Routes to lp-* stage skills at each stage.
---

# Startup Loop

Operate the Startup Loop through a single chat command surface. This skill is an operator wrapper. It does not replace `/lp-do-fact-find`, `/lp-do-plan`, or `/lp-do-build`.

## Operating Mode

**ORCHESTRATE + GATE + HANDOFF**

Allowed:
- Read canonical Startup Loop docs and current business artifacts.
- Determine current stage and gate status.
- Hand user exact prompt files and output paths when input/research is missing.
- Validate submitted artifact path and stage fit.
- Enforce Business OS sync actions before stage advance.

Not allowed:
- Silent stage skipping.
- Advancing while required artifacts or BOS sync actions are incomplete.
- Treating markdown mirrors of cards/ideas as source of truth.

## Invocation

- `/startup-loop start --business <BIZ> --mode <dry|live> --launch-surface <pre-website|website-live> [--start-point <problem|product>]`
  - `--start-point` is optional. Default is `product`. Existing runs that omit this flag are unaffected.
- `/startup-loop status --business <BIZ>`
- `/startup-loop submit --business <BIZ> --stage <S#> --artifact <path>`
- `/startup-loop advance --business <BIZ>`

## Command Module Routing

Load the relevant module per command:

| Command | Module |
|---|---|
| `start` | `modules/cmd-start.md` |
| `status` | `modules/cmd-status.md` |
| `submit` | `modules/cmd-submit.md` |
| `advance` | `modules/cmd-advance.md` |

## Required Output Contract

For `start`, `status`, and `advance`, return this exact packet:

```text
run_id: SFS-<BIZ>-<YYYYMMDD>-<hhmm>
business: <BIZ>
loop_spec_version: 1.7.0
current_stage: <S#>
status: <ready|blocked|awaiting-input|complete>
blocking_reason: <none or exact reason>
next_action: <single sentence command/action>
prompt_file: <path or none>
required_output_path: <path or none>
naming_gate: <skipped|blocked|complete>
bos_sync_actions:
  - <required sync action 1>
  - <required sync action 2>
```

## Stage Addressing

| Flag | Behavior |
|---|---|
| `--stage <ID>` | Canonical stage ID. Case-insensitive. Always primary. |
| `--stage-alias <slug>` | Deterministic slug from `stage-operator-map.json` alias_index. Fail-closed on unknown. |
| `--stage-label <text>` | Exact match against `label_operator_short` or `label_operator_long`. Case-sensitive. Fail-closed on near-match. |

Resolver: `scripts/src/startup-loop/stage-addressing.ts`
Canonical alias source: `docs/business-os/startup-loop/_generated/stage-operator-map.json`

When a stage reference cannot be resolved, return fail-closed with deterministic suggestions. Do not infer or guess stage IDs from near-matches.

## Stage Model

Canonical source: `docs/business-os/startup-loop/loop-spec.yaml` (spec_version 1.7.0).
Stage labels: `docs/business-os/startup-loop/_generated/stage-operator-map.json`.

Stages S0..S10 (22 stages total):

| Stage | Name | Skill | Conditional |
|---|---|---|---|
| S0A | Problem framing | `/lp-problem-frame` | start-point=problem |
| S0B | Solution-space scan | `/lp-solution-space` | start-point=problem |
| S0C | Option selection | `/lp-option-select` | start-point=problem |
| S0D | Naming handoff | `/brand-naming-research` | start-point=problem |
| S0 | Intake | `/startup-loop start` | — |
| S1 | Readiness check | `/lp-readiness` | — |
| S1B | Measurement setup | prompt handoff (pre-website) | — |
| S2A | Historical baseline | prompt handoff (website-live) | — |
| S2 | Market intelligence | Deep Research prompt handoff | — |
| S2B | Offer design | `/lp-offer` | — |
| S3 | Forecast (parallel with S6B) | `/lp-forecast` | — |
| S3B | Adjacent product research | `/lp-other-products` | growth_intent=product_range |
| S6B | Channel strategy + GTM | `/lp-channels`, `/lp-seo`, `/draft-outreach` | — |
| S4 | Baseline merge (join barrier) | `/lp-baseline-merge` | — |
| S5A | Prioritize | `/lp-prioritize` | — |
| S5B | BOS sync (sole mutation boundary) | `/lp-bos-sync` | — |
| S6 | Site-upgrade synthesis | `/lp-site-upgrade` | — |
| S7 | Fact-find | `/lp-do-fact-find` | — |
| S8 | Plan | `/lp-do-plan` | — |
| S9 | Build | `/lp-do-build` | — |
| S9B | QA gates | `/lp-launch-qa`, `/lp-design-qa` | — |
| S10 | Weekly decision | `/lp-experiment` (Phase 0 fallback) / `/lp-weekly` (Phase 1 default) | — |

## Global Invariants

- Never allow silent stage skipping.
- BOS sync must be confirmed complete before advance. See `modules/cmd-advance.md` for sync contract.
- Canonical source of truth is always `loop-spec.yaml` — not markdown mirrors of cards or ideas.
- All stage references are resolved via stage-addressing.ts — never guess stage IDs.
