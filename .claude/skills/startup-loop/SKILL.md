---
name: startup-loop
description: Chat command wrapper for operating Startup Loop runs. Supports /startup-loop start|status|submit|advance with strict stage gating, prompt handoff, and Business OS sync checks. Routes to lp-* stage skills at each stage.
---

# Startup Loop

Operate the Startup Loop through a single chat command surface:

- `/startup-loop start --business <BIZ> --mode <dry|live> --launch-surface <pre-website|website-live>`
- `/startup-loop status --business <BIZ>`
- `/startup-loop submit --business <BIZ> --stage <S#> --artifact <path>`
- `/startup-loop advance --business <BIZ>`

This skill is an operator wrapper. It does not replace `/lp-fact-find`, `/lp-plan`, or `/lp-build`.

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

## Canonical References

- **Loop spec (runtime authority):** `docs/business-os/startup-loop/loop-spec.yaml`
- Workflow contract: `docs/business-os/startup-loop-workflow.user.md`
- Prompt index: `docs/business-os/workflow-prompts/README.user.md`
- Operator handoff template:
  - `docs/business-os/workflow-prompts/_templates/startup-loop-operator-handoff-prompt.md`

## Required Output Contract

For `start`, `status`, and `advance`, return this exact packet:

```text
run_id: SFS-<BIZ>-<YYYYMMDD>-<hhmm>
business: <BIZ>
loop_spec_version: 1.3.0
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

## Stage Model

Canonical source: `docs/business-os/startup-loop/loop-spec.yaml` (spec_version 1.3.0).

Stages: `S0`..`S10` (17 stages total):

- `S0`  Intake — `/startup-loop start`
- `S1`  Readiness preflight — `/lp-readiness`
- `S1B` Pre-website measurement bootstrap — prompt handoff (conditional: pre-website)
- `S2A` Existing-business historical baseline — prompt handoff (conditional: website-live)
- `S2`  Market intelligence — Deep Research prompt handoff
- `S2B` Offer design — `/lp-offer`
- ── parallel fan-out (S3 and S6B run concurrently) ──
- `S3`  Forecast — `/lp-forecast`
- `S6B` Channel strategy + GTM — `/lp-channels`, `/lp-seo`, `/draft-outreach`
- ── parallel fan-in ──
- `S4`  Baseline merge (join barrier) — `/lp-baseline-merge`
- `S5A` Prioritize (pure ranking, no side effects) — `/lp-prioritize`
- `S5B` BOS sync (sole mutation boundary) — `/lp-bos-sync`
- `S6`  Site-upgrade synthesis — `/lp-site-upgrade`
- `S7`  Fact-find — `/lp-fact-find`
- `S8`  Plan — `/lp-plan`
- `S9`  Build — `/lp-build`
- `S9B` QA gates — `/lp-launch-qa`, `/lp-design-qa`
- `S10` Weekly readout + experiments — `/lp-experiment`

## Command Behavior

### 1) `/startup-loop start`

Inputs:
- `--business <BIZ>` required
- `--mode <dry|live>` required
- `--launch-surface <pre-website|website-live>` required

Steps:
1. Resolve the business context from canonical artifacts under `docs/business-os/`.
2. Determine highest completed stage and next required stage.
3. Apply hard gates (below).
4. Return run packet with exact next action.

### 2) `/startup-loop status`

Inputs:
- `--business <BIZ>` required

Steps:
1. Read latest stage artifacts for that business.
2. Re-evaluate gates and sync requirements.
3. Return run packet with current stage/status.

### 3) `/startup-loop submit`

Inputs:
- `--business <BIZ>` required
- `--stage <S#>` required
- `--artifact <path>` required

Steps:
1. Verify artifact exists at provided path.
2. Verify artifact satisfies expected stage output contract.
3. If artifact is a `*.user.md` doc, render HTML companion:
   - `pnpm docs:render-user-html -- <artifact>`
4. Return run packet (usually `awaiting-input` until BOS sync actions are done, or `ready` to advance).

### 4) `/startup-loop advance`

Inputs:
- `--business <BIZ>` required

Advance only when both are true:
1. Required stage artifact exists and is valid.
2. Required `bos_sync_actions` are confirmed complete.

If either fails: return `status: blocked` with exact reason and retry action.

## Hard Gates

### Gate A: Pre-website measurement bootstrap (S1B)

Condition:
- `launch-surface = pre-website`

Rule:
- Do not progress beyond S1 without S1B artifact.

Prompt handoff:
- `prompt_file`: `docs/business-os/workflow-prompts/_templates/pre-website-measurement-bootstrap-prompt.md`
- `required_output_path`: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-pre-website-measurement-setup.user.md`

### Gate B: Existing-business historical baseline (S2A)

Condition:
- `launch-surface = website-live`

Rule:
- S2/S6 blocked until S2A baseline exists with `Status: Active`.

If baseline blocked by missing data:
- `prompt_file`: `docs/business-os/workflow-prompts/_templates/historical-data-request-prompt.md`
- `required_output_path`: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-historical-data-request-prompt.user.md`

If data pack exists but baseline not consolidated:
- `prompt_file`: `docs/business-os/workflow-prompts/_templates/existing-business-historical-baseline-prompt.md`
- `required_output_path`: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-historical-performance-baseline.user.md`

### Gate C: S2/S6 deep research completion

Rule:
- If `latest.user.md` is missing, stale, or points to `Status: Draft`, stop and hand prompt.

S2 handoff:
- `prompt_file`: `docs/business-os/market-research/_templates/deep-research-market-intelligence-prompt.md`
- `required_output_path`: `docs/business-os/market-research/<BIZ>/<YYYY-MM-DD>-market-intelligence.user.md`

S6 handoff:
- `prompt_file`: `docs/business-os/site-upgrades/_templates/deep-research-business-upgrade-prompt.md`
- `required_output_path`: `docs/business-os/site-upgrades/<BIZ>/<YYYY-MM-DD>-upgrade-brief.user.md`

### GATE-BD-00: Business naming research required at S0→S1 (when name unconfirmed)

Gate ID: GATE-BD-00 (Hard)
Trigger: Before advancing from S0 to S1 — evaluated during `/startup-loop advance` when S0 is current.

Runs before GATE-BD-01. Does not trigger for businesses with a confirmed name.

**`naming_gate` computation (filesystem-only, no stored state):**

```bash
# Step 1 — read business_name_status from intake packet
grep -i "Business name status" docs/business-os/startup-baselines/<BIZ>-intake-packet.user.md 2>/dev/null \
  | grep -i "unconfirmed"
# If no match → status is absent or confirmed → naming_gate: skipped
```

```bash
# Step 2 (only if unconfirmed) — check for returned shortlist
ls docs/business-os/strategy/<BIZ>/*-naming-shortlist.user.md 2>/dev/null
# If match found → naming_gate: complete
# If no match     → naming_gate: blocked
```

**Decision table:**

| `business_name_status` | Shortlist exists? | `naming_gate` | Action |
|---|---|---|---|
| absent or `confirmed` | either | `skipped` | Continue to GATE-BD-01 |
| `unconfirmed` | no | `blocked` | Generate prompt (idempotent); block advance |
| `unconfirmed` | yes | `complete` | Write stable pointer; emit advisory; continue to GATE-BD-01 |

**When `naming_gate: blocked`:**

1. Check if naming prompt already exists (idempotent — do not overwrite):
   ```bash
   ls docs/business-os/strategy/<BIZ>/*-naming-prompt.md 2>/dev/null
   ```
2. If prompt absent: read intake packet fields, populate template, write prompt:
   - Template: `docs/business-os/market-research/_templates/deep-research-naming-prompt.md`
   - Output path: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-naming-prompt.md`
3. Return blocked run packet:
   - `blocking_reason`: `GATE-BD-00: Business name status is unconfirmed and no naming shortlist has been returned.`
   - `next_action`: `Run the naming prompt at docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-naming-prompt.md through Deep Research (or Perplexity). Save the returned document — including the required YAML front matter — to docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-naming-shortlist.user.md, then run /startup-loop advance --business <BIZ>.`
   - `prompt_file`: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-naming-prompt.md`
   - `required_output_path`: `docs/business-os/strategy/<BIZ>/*-naming-shortlist.user.md (any date prefix accepted)`

**When `naming_gate: complete`:**

1. Identify the most recent shortlist file (pick `max(date)` if multiple):
   ```bash
   ls docs/business-os/strategy/<BIZ>/*-naming-shortlist.user.md 2>/dev/null | sort -r | head -1
   ```
2. Write stable pointer (copy to fixed path for `lp-brand-bootstrap`):
   ```bash
   cp "<latest-shortlist-path>" docs/business-os/strategy/<BIZ>/latest-naming-shortlist.user.md
   ```
3. Emit non-blocking advisory:
   `GATE-BD-00: Naming shortlist accepted. Recommended name extracted for lp-brand-bootstrap. Consider updating business_name in the intake packet and setting business_name_status to confirmed.`
4. Continue to GATE-BD-01.

**Parse error handling:** If `business_name_status` field is present but value cannot be parsed (malformed YAML or unexpected value), treat as `confirmed` (fail-open) and emit:
`Warning: GATE-BD-00: Could not parse business_name_status — treating as confirmed. Check intake packet for malformed field.`

### GATE-BD-01: Brand Dossier bootstrap required at S1 advance

Gate ID: GATE-BD-01 (Hard)
Trigger: Before advancing from S1 to S2 (or S1B/S2A for conditional stages).

Rule:
- Check `docs/business-os/strategy/<BIZ>/index.user.md` — read Brand Dossier Status column.
- Gate passes if Brand Dossier Status = `Draft` or `Active`.
- Gate blocks if Brand Dossier Status = `—` (not created) or file is missing.

Check command:
```bash
grep "Brand Dossier" docs/business-os/strategy/<BIZ>/index.user.md | grep -E "Draft|Active"
```

When blocked:
- Blocking reason: `GATE-BD-01: Brand Dossier missing or not at Draft minimum. Cannot advance past S1.`
- Next action: `Run /lp-brand-bootstrap <BIZ> to create brand-dossier.user.md, then update index.user.md Status to Draft.`

### GATE-BD-03: Messaging Hierarchy required at S2B Done

Gate ID: GATE-BD-03 (Hard)
Trigger: S2B completion check — S2B is not Done until both offer artifact AND messaging-hierarchy.user.md (Draft minimum) exist.

Rule:
- Check `docs/business-os/strategy/<BIZ>/index.user.md` — read Messaging Hierarchy Status column.
- Gate passes if Messaging Hierarchy Status = `Draft` or `Active`.
- Gate blocks if Status = `—` or file is missing. Default to blocked (fail-closed) if Status cannot be parsed.

Check command:
```bash
grep "Messaging Hierarchy" docs/business-os/strategy/<BIZ>/index.user.md | grep -E "Draft|Active"
```

When blocked:
- Blocking reason: `GATE-BD-03: Messaging Hierarchy missing or not at Draft minimum. S2B is not Done until messaging-hierarchy.user.md exists.`
- Next action: `Create messaging-hierarchy.user.md at Draft minimum using BRAND-DR-03/04 prompts, then update index.user.md Status to Draft.`

### GATE-BD-08: Brand Dossier staleness warning at S10

Gate ID: GATE-BD-08 (Soft — warning, not block)
Trigger: S10 weekly readout review.

Rule:
- Check Brand Dossier `Last-reviewed` date in `docs/business-os/strategy/<BIZ>/index.user.md`.
- If Last-reviewed > 90 days ago: emit warning (do not block).
- Warning message: `GATE-BD-08: Brand Dossier not reviewed in >90 days. Consider re-running BRAND-DR-01/02 and updating brand-dossier.user.md.`

### GATE-MEAS-01: Decision-grade measurement required before S6B

Gate ID: GATE-MEAS-01 (Hard)
Trigger: Before S6B (Channel Strategy + GTM) can start — evaluated at the S2B→S6B fan-out.

Rationale: Channel strategy without working measurement is structurally invalid. CAC, CVR, and
channel performance cannot be evaluated if key conversion events are not firing in production.
This is not a one-off deferral decision — it is always true that channel spend before measurement
is waste. There is never a valid reason to start S6B while measurement is unverified.

Rule — all three checks must pass:
1. A measurement verification artifact exists with `Status: Active`:
   `docs/business-os/strategy/<BIZ>/*measurement-verification*.user.md`
2. No active measurement risks at `Severity: High` or `Severity: Critical` in `plan.user.md`.
3. Key conversion-intent events are verified firing in production (non-zero in the locked
   7-day baseline or a subsequent verified period).

Check commands:
```bash
# Check 1: measurement verification doc exists and is Active
grep "Status: Active" docs/business-os/strategy/<BIZ>/*measurement-verification*.user.md 2>/dev/null

# Check 2: no High/Critical measurement signal risks
grep -i "measurement" docs/business-os/strategy/<BIZ>/plan.user.md | grep -iE "severity: (high|critical)"

# Check 3: conversion events non-zero (begin_checkout, add_to_cart, or equivalent)
grep -iE "begin_checkout|add_to_cart|conversion" docs/business-os/strategy/<BIZ>/plan.user.md | grep -v "| 0$\|0.00%\| 0 "
```

When blocked:
- Blocking reason: `GATE-MEAS-01: Decision-grade measurement signal not verified. Channel strategy without working measurement is waste — CAC, CVR, and channel performance cannot be evaluated.`
- Next action: `Resolve active measurement risks, verify conversion events firing in production, and update measurement-verification artifact to Status: Active. Then re-run /startup-loop status --business <BIZ>.`

## Business OS Sync Contract (Required Before Advance)

For each stage, require appropriate sync actions:

- `S0`: update `docs/business-os/strategy/<BIZ>/plan.user.md` scope and constraints.
- `S1/S1B/S2/S3/S10`: persist strategy/readiness artifacts under `docs/business-os/...` and update any `latest.user.md` pointers.
- `S5A`: no BOS sync (pure ranking, no side effects).
- `S5B`: create/update ideas/cards via Business OS API (`/api/agent/ideas`, `/api/agent/cards`); commit manifest pointer.
- `S7/S8/S9`: upsert stage docs and lane transitions via `/api/agent/stage-docs` and `/api/agent/cards`.

Never allow stage advance when BOS sync has failed.

## Failure Handling

When blocked, always provide:
1. Exact failing gate.
2. Exact prompt file.
3. Exact required output path.
4. One command-like next step.

Example blocked `next_action`:
- `Run Deep Research with prompt_file and save output to required_output_path, then run /startup-loop submit --business <BIZ> --stage S2 --artifact <path>.`

## Recommended Operator Sequence

1. `/startup-loop start --business <BIZ> --mode dry --launch-surface <...>`
2. `/startup-loop status --business <BIZ>` after each major output
3. `/startup-loop submit --business <BIZ> --stage <S#> --artifact <path>` after producing artifact
4. `/startup-loop advance --business <BIZ>` when ready to move

## Red Flags (invalid operation)

1. Advancing a stage while required output is missing.
2. Advancing a stage while required BOS sync action is incomplete.
3. Skipping S1B for pre-website businesses.
4. Skipping S2A for website-live businesses.
5. Continuing S2/S6 with stale/draft research artifacts.
