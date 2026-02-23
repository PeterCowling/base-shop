# cmd-advance — `/startup-loop advance`

## Inputs

- `--business <BIZ>` required

## Steps

Advance only when both are true:
1. Required stage artifact exists and is valid.
2. Required `bos_sync_actions` are confirmed complete.

If either fails: return `status: blocked` with exact reason and retry action.

---

## Hard Gates (Advance-Time)

### GATE-A08-00: Current situation required at ASSESSMENT-08→ASSESSMENT-09 (when start-point=problem)

**Gate ID**: GATE-A08-00 (Hard)
**Trigger**: Before advancing from ASSESSMENT-08 to ASSESSMENT-09. Only fires when `start-point=problem`.

**Check (filesystem-only):**

```bash
# Check for current situation artifact with Status: Active
grep -l "Status: Active" docs/business-os/strategy/<BIZ>/current-situation.user.md 2>/dev/null
# Match found  → gate passes
# No match     → gate blocked
```

**Decision table:**

| current-situation.user.md exists? | Status field | Gate result | Action |
|---|---|---|---|
| No | — | `blocked` | Run `/lp-do-assessment-08-current-situation --business <BIZ>` |
| Yes | `Active` | `pass` | Continue to ASSESSMENT intake sync |
| Yes | `Draft` or absent | `blocked` | Complete artifact (all sections A–D, Section E gaps listed) then set Status: Active |

**When blocked:**

Return blocked run packet:
- `blocking_reason`: `GATE-A08-00: Current situation artifact missing or not Active. Required before ASSESSMENT intake sync can run.`
- `next_action`: `Run /lp-do-assessment-08-current-situation --business <BIZ>. Artifact required at docs/business-os/strategy/<BIZ>/current-situation.user.md with Status: Active.`
- `prompt_file`: none (skill generates the artifact interactively)

**When passes:**

Proceed to ASSESSMENT intake sync. The sync module reads `current-situation.user.md` as its seventh precursor (`Precursor-ASSESSMENT-08`).

---

### GATE-ASSESSMENT-00: ASSESSMENT-09 Intake contract — completeness + quality + intake sync

**Gate ID**: GATE-ASSESSMENT-00 (Hard)
**Trigger**: Before advancing from ASSESSMENT-09 to ASSESSMENT-10. Always fires when start-point=problem.

**Named**: ASSESSMENT-09 Intake contract

Validates that all required ASSESSMENT precursor artifacts are present and meet minimum quality before the business can enter branding (`ASSESSMENT-10`), then runs intake sync to produce/refresh the intake packet.

**Check (filesystem-only):**

```bash
# ASSESSMENT-01: Problem Statement (Active + required sections)
grep -l "Status: Active" docs/business-os/strategy/<BIZ>/problem-statement.user.md 2>/dev/null &&
grep -Eq "## Problem|## Customer|## Evidence" docs/business-os/strategy/<BIZ>/problem-statement.user.md 2>/dev/null

# ASSESSMENT-02: Solution profiling results (any date prefix, >=3 options)
ls docs/business-os/strategy/<BIZ>/*-solution-profile-results.user.md 2>/dev/null | head -1

# ASSESSMENT-03: Solution select (selected option + rationale present)
ls docs/business-os/strategy/<BIZ>/solution-select.user.md 2>/dev/null &&
grep -Eq "Selected|Rationale|Assumption" docs/business-os/strategy/<BIZ>/solution-select.user.md 2>/dev/null

# ASSESSMENT-04: Candidate names (any date prefix, >=3 candidates) — skip check if name confirmed
ls docs/business-os/strategy/<BIZ>/*-candidate-names.user.md 2>/dev/null | head -1

# ASSESSMENT-06: Distribution profiling — Status + >=2 channel rows + primary channel
grep -l "Status: Active\|Status: Draft" docs/business-os/strategy/<BIZ>/distribution-profiling.user.md 2>/dev/null &&
grep -Eq "Primary channel|Chosen channel|Recommended channel" docs/business-os/strategy/<BIZ>/distribution-profiling.user.md 2>/dev/null

# ASSESSMENT-07: Measurement profiling — Status + tracking method + >=2 metrics + threshold
grep -l "Status: Active\|Status: Draft" docs/business-os/strategy/<BIZ>/measurement-profiling.user.md 2>/dev/null &&
grep -Eq "Tracking|Instrumentation|Method" docs/business-os/strategy/<BIZ>/measurement-profiling.user.md 2>/dev/null &&
grep -Eq "Threshold|Target|Trigger" docs/business-os/strategy/<BIZ>/measurement-profiling.user.md 2>/dev/null

# ASSESSMENT-08: Current situation — Active + sections A-E + open gaps section
grep -l "Status: Active" docs/business-os/strategy/<BIZ>/current-situation.user.md 2>/dev/null &&
grep -Eq "Section A|Section B|Section C|Section D|Section E|Open gaps|Evidence gaps" docs/business-os/strategy/<BIZ>/current-situation.user.md 2>/dev/null
```

**Decision table:**

| Sub-stage | Artifact | Status | Gate result |
|---|---|---|---|
| ASSESSMENT-01 | problem-statement.user.md | Active + problem/customer/evidence sections | ✅ pass |
| ASSESSMENT-01 | missing, not Active, or incomplete structure | — | ❌ blocked |
| ASSESSMENT-02 | *-solution-profile-results.user.md | exists + >=3 solution options profiled | ✅ pass |
| ASSESSMENT-02 | missing or thin (<3 options) | — | ❌ blocked |
| ASSESSMENT-03 | solution-select.user.md | selected option + rationale + assumptions | ✅ pass |
| ASSESSMENT-03 | missing or missing rationale/assumptions | — | ❌ blocked |
| ASSESSMENT-04 | *-candidate-names.user.md | exists + shortlist-quality candidate set | ✅ pass (or skipped if name confirmed) |
| ASSESSMENT-04 | missing (when required) or low-quality shortlist | — | ❌ blocked |
| ASSESSMENT-06 | distribution-profiling.user.md | Active/Draft + >=2 channels + primary channel chosen | ✅ pass |
| ASSESSMENT-06 | missing or quality minimum not met | — | ❌ blocked |
| ASSESSMENT-07 | measurement-profiling.user.md | Active/Draft + tracking method + >=2 metrics + threshold/trigger | ✅ pass |
| ASSESSMENT-07 | missing or quality minimum not met | — | ❌ blocked |
| ASSESSMENT-08 | current-situation.user.md | Active + sections A-E + gap logging present | ✅ pass |
| ASSESSMENT-08 | missing or quality minimum not met | — | ❌ blocked |

**When blocked:**

Return blocked run packet:
- `blocking_reason`: `GATE-ASSESSMENT-00: ASSESSMENT-09 Intake blocked — completeness/quality checks failed for [list sub-stages]. All required ASSESSMENT precursors must pass before ASSESSMENT-10.`
- `next_action`: For each failing sub-stage, specify the skill to run and the exact quality gap to close before re-running `/startup-loop advance --business <BIZ>`.
- `prompt_file`: none (skills generate artifacts interactively)

**When passes:**

Run ASSESSMENT intake sync (apply `modules/assessment-intake-sync.md`) and produce/refresh:
- `docs/business-os/startup-baselines/<BIZ>-intake-packet.user.md`

Then continue to ASSESSMENT-10.

---

### GATE-ASSESSMENT-01: ASSESSMENT container completeness + quality required at ASSESSMENT→MEASURE-01

**Gate ID**: GATE-ASSESSMENT-01 (Hard)
**Trigger**: Before advancing from ASSESSMENT (container) to `MEASURE-01`.

**Named**: ASSESSMENT quality gate

Validates that both branding sub-stage outputs exist and meet minimum quality before the container can progress to MEASURE entry.

**Check (filesystem-only):**

```bash
# ASSESSMENT-10 output: brand profiling quality contract
ls docs/business-os/strategy/<BIZ>/brand-profiling.user.md 2>/dev/null &&
grep -Eq "Status: (Draft|Active)" docs/business-os/strategy/<BIZ>/brand-profiling.user.md 2>/dev/null &&
grep -Eq "Section A|Section B|Section C|Section D|Section E" docs/business-os/strategy/<BIZ>/brand-profiling.user.md 2>/dev/null &&
grep -Eq "Voice|Tone|Personality|Audience" docs/business-os/strategy/<BIZ>/brand-profiling.user.md 2>/dev/null

# ASSESSMENT-11 output: brand identity quality contract
ls docs/business-os/strategy/<BIZ>/brand-identity.user.md 2>/dev/null &&
grep -Eq "Status: (Draft|Active)" docs/business-os/strategy/<BIZ>/brand-identity.user.md 2>/dev/null &&
grep -Eq "Color|Colour|Typography|Imagery|Token" docs/business-os/strategy/<BIZ>/brand-identity.user.md 2>/dev/null
```

**Decision table:**

| Artifact | Completeness + quality | Gate result |
|---|---|---|
| brand-profiling.user.md | Exists + Draft/Active + sections A-E + voice/personality content | ✅ pass |
| brand-profiling.user.md | Missing or quality minimum not met | ❌ blocked |
| brand-identity.user.md | Exists + Draft/Active + visual identity sections + token guidance | ✅ pass |
| brand-identity.user.md | Missing or quality minimum not met | ❌ blocked |

**When blocked:**

Return blocked run packet:
- `blocking_reason`: `GATE-ASSESSMENT-01: ASSESSMENT container blocked — branding completeness/quality contract not met (brand-profiling.user.md + brand-identity.user.md required at quality minimum) before MEASURE entry.`
- `next_action`: `Run /lp-do-assessment-10-brand-profiling and/or /lp-do-assessment-11-brand-identity to close listed quality gaps, then re-run /startup-loop advance --business <BIZ>.`
- `prompt_file`: none (skills generate artifacts interactively)

**When passes:**

Proceed to `MEASURE-01`.

---

### GATE-BD-03: Messaging Hierarchy required at MARKET-06 Done

**Gate ID**: GATE-BD-03 (Hard)
**Trigger**: MARKET-06 completion check — MARKET-06 is not Done until both offer artifact AND messaging-hierarchy.user.md (Draft minimum) exist.

**Rule**: Check Messaging Hierarchy Status column in index.user.md. Default to blocked (fail-closed) if Status cannot be parsed.

```bash
grep "Messaging Hierarchy" docs/business-os/strategy/<BIZ>/index.user.md | grep -E "Draft|Active"
```

**When blocked**:
- Blocking reason: `GATE-BD-03: Messaging Hierarchy missing or not at Draft minimum. MARKET-06 is not Done until messaging-hierarchy.user.md exists.`
- Next action: `Create messaging-hierarchy.user.md at Draft minimum using BRAND-DR-03/04 prompts, then update index.user.md Status to Draft.`

---

### GATE-PRODUCT-02-01: Adjacent product research advisory (PRODUCT container) at MARKET-06 Done

**Gate ID**: GATE-PRODUCT-02-01 (Soft — advisory, does not block advance)
**Trigger**: MARKET-06 completion check — evaluated when MARKET-06 is Done and intake packet has `growth_intent` referencing product range expansion, or operator manually invokes. Stage is `PRODUCT-02` and belongs to the PRODUCT container.

**Rule**: Check whether `lp-other-products-prompt.md` exists under `docs/business-os/strategy/<BIZ>/`.

```bash
ls docs/business-os/strategy/<BIZ>/lp-other-products-prompt.md 2>/dev/null
```

**When triggered** (MARKET-06 Done + condition met + prompt absent):
- Advisory: `GATE-PRODUCT-02-01: Growth intent references product range expansion. Run /lp-other-products <BIZ> to generate the adjacent product research prompt, then drop it into a deep research tool (OpenAI Deep Research or equivalent). Save results to docs/business-os/strategy/<BIZ>/lp-other-products-results.user.md for S5A (lp-prioritize) to pick up as additional go-item candidates.`
- Does NOT block S3/SELL-01 fan-out or S4 join barrier.

**When skipped**: Condition not met (growth_intent absent or does not reference product range expansion), OR prompt already exists.

---

### GATE-WEBSITE-DO-01: WEBSITE-01 Active handover to DO fact-find

**Gate ID**: GATE-WEBSITE-DO-01 (Hard)
**Trigger**: Before advancing from `WEBSITE` container to `DO` when `launch-surface=pre-website`.

**Rule**: WEBSITE-01 is not considered handoff-complete until its active first-build contract has been converted into a DO fact-find artifact.

**Check (filesystem-only):**

```bash
# Check 1: WEBSITE-01 first-build contract is Active
grep -l "Status: Active" docs/business-os/strategy/<BIZ>/site-v1-builder-prompt.user.md 2>/dev/null

# Check 2: strategy index row is also Active (authoritative gate row)
grep "Site V1 Builder Prompt" docs/business-os/strategy/<BIZ>/index.user.md | grep "Active"

# Check 3: DO handover fact-find exists and is ready
grep -l "Status: Ready-for-planning" docs/plans/<biz>-website-v1-first-build/fact-find.md 2>/dev/null
```

**Decision table:**

| WEBSITE-01 contract status | WEBSITE first-build fact-find status | Gate result | Action |
|---|---|---|---|
| Missing or `Draft` | — | `blocked` | Run WEBSITE-01 prompt handoff first |
| `Active` | Missing or not `Ready-for-planning` | `blocked` | Dispatch `/lp-do-fact-find` with WEBSITE first-build alias |
| `Active` | `Ready-for-planning` | `pass` | Continue DO progression (`/lp-do-plan`), then `/lp-do-build` only after `plan.md` is `Status: Active` |

**When blocked (WEBSITE-01 missing/draft):**
- `blocking_reason`: `GATE-WEBSITE-DO-01: WEBSITE-01 first-build contract is not Active. DO handover requires an active site-v1-builder-prompt artifact.`
- `next_action`: `Run docs/business-os/workflow-prompts/_templates/website-first-build-framework-prompt.md and save docs/business-os/strategy/<BIZ>/site-v1-builder-prompt.user.md with Status: Active, then re-run /startup-loop advance --business <BIZ>.`

**When blocked (needs DO fact-find handover):**
- `blocking_reason`: `GATE-WEBSITE-DO-01: WEBSITE-01 is Active but DO fact-find handover has not been executed.`
- `next_action`: `Run /lp-do-fact-find --website-first-build-backlog --biz <BIZ> --feature-slug <biz>-website-v1-first-build --source docs/business-os/strategy/<BIZ>/site-v1-builder-prompt.user.md, then re-run /startup-loop advance --business <BIZ>.`
- `required_output_path`: `docs/plans/<biz>-website-v1-first-build/fact-find.md`

**Pass contract note:**
- Passing this gate authorizes DO planning entry (`/lp-do-plan`) only.
- `/lp-do-build` remains blocked until `docs/plans/<biz>-website-v1-first-build/plan.md` exists and is `Status: Active`.

---

### S10 Phase 1 Weekly Advance Dispatch

**Trigger**: S10 weekly advance (Phase 1 default route).

**Invocation**:

```
/lp-weekly --biz <BIZ> --week <YYYY-Www>
```

Where:
- `<BIZ>` is the business ID from the `--business` flag on the advance command
- `<YYYY-Www>` is the ISO week of the weekly cycle being advanced (e.g. `2026-W08`)

**Subsumes note**: This dispatch orchestrates GATE-BD-08, signal-review, feedback-audit, KPCS decision, and experiment lane. When `/lp-weekly` is invoked, the standalone dispatches below are the Phase 0 fallback path.

**Fallback**: If `/lp-weekly` is unavailable, proceed with GATE-BD-08 → Signal Review Dispatch as the fallback sequence.

---

### GATE-BD-08: Brand Dossier staleness warning at S10

**Gate ID**: GATE-BD-08 (Soft — warning, not block)
**Trigger**: S10 weekly readout review.

**Rule**: Check Brand Dossier `Last-reviewed` date in `docs/business-os/strategy/<BIZ>/index.user.md`. If Last-reviewed > 90 days ago: emit warning (do not block).
- Warning: `GATE-BD-08: Brand Dossier not reviewed in >90 days. Consider re-running BRAND-DR-01/02 and updating brand-identity.user.md.`

---

### S10 Signal Review Dispatch (weekly signal strengthening)

**Trigger**: During S10 weekly readout, after GATE-BD-08 check completes (whether warning or clear).

**Do NOT alter**: GATE-BD-08, the weekly-kpcs prompt handoff reference in `startup-loop/SKILL.md`, or any other S10 gate.

**Directive**: Invoke `/lp-signal-review` for the current business to audit the run and emit a Signal Review artifact. This is advisory in v1 — it does not block S10 advance.

**Invocation**:

```
/lp-signal-review --biz <BIZ> --run-root docs/business-os/strategy/<BIZ>/ --as-of-date <YYYY-MM-DD>
```

Where:
- `<BIZ>` is the business ID from the `--business` flag on the advance command
- `<YYYY-MM-DD>` is today's date
- `run_root` is always deterministically `docs/business-os/strategy/<BIZ>/` — no operator input needed

**Output**: `docs/business-os/strategy/<BIZ>/signal-review-<YYYYMMDD>-<HHMM>-W<ISOweek>.md`

**v1 posture (advisory)**: Signal Review is emitted for operator review. Findings are presented as Finding Briefs which the operator promotes to `/lp-do-fact-find` manually. This dispatch does NOT block S10 advance regardless of finding count or severity.

**GATE-S10-SIGNAL-01**: Reserved for v1.1 (artifact existence soft warning). Not active in v1.

---

### GATE-SELL-STRAT-01: Strategy design gate

**Gate ID**: GATE-SELL-STRAT-01 (Hard)
**Trigger**: Before SELL-01 (Channel Strategy + GTM) begins — evaluated at the MARKET-06→SELL-01 fan-out.

**Rationale**: Channel selection, GTM planning, and messaging strategy can validly precede measurement readiness — strategy design is not spend commitment.

**Rule — must pass**: A valid Demand Evidence Pack (DEP) artifact exists for this business and passes the schema pass floor: `docs/business-os/startup-baselines/<BIZ>/demand-evidence-pack.md`

**When blocked**:
- Blocking reason: `GATE-SELL-STRAT-01: No valid DEP artifact. Channel strategy requires demand evidence — run /lp-readiness or capture DEP records before starting SELL-01.`
- Next action: `Complete DEP capture, verify it passes the schema pass floor (demand-evidence-pack-schema.md §2), then re-run /startup-loop status --business <BIZ>.`

---

### GATE-SELL-ACT-01: Spend activation gate

**Gate ID**: GATE-SELL-ACT-01 (Hard)
**Trigger**: Before any paid channel spend is committed from SELL-01 channel selection.

**Rationale**: Channel spend before working measurement is structurally invalid. CAC, CVR, and channel performance cannot be evaluated if key conversion events are not firing in production.

**Rule — all three checks must pass**:
1. Measurement verification artifact exists with `Status: Active`:
   `docs/business-os/strategy/<BIZ>/*measurement-verification*.user.md`
2. No active measurement risks at `Severity: High` or `Severity: Critical` in `plan.user.md`.
3. Key conversion-intent events are verified firing in production (non-zero in the locked 7-day baseline or a subsequent verified period).

```bash
# Check 1: measurement verification doc exists and is Active
grep "Status: Active" docs/business-os/strategy/<BIZ>/*measurement-verification*.user.md 2>/dev/null

# Check 2: no High/Critical measurement signal risks
grep -i "measurement" docs/business-os/strategy/<BIZ>/plan.user.md | grep -iE "severity: (high|critical)"

# Check 3: conversion events non-zero (begin_checkout, add_to_cart, or equivalent)
grep -iE "begin_checkout|add_to_cart|conversion" docs/business-os/strategy/<BIZ>/plan.user.md | grep -v "| 0$\|0.00%\| 0 "
```

**When blocked**:
- Blocking reason: `GATE-SELL-ACT-01: Decision-grade measurement signal not verified. Channel spend before working measurement is waste.`
- Next action: `Resolve active measurement risks, verify conversion events firing in production, and update measurement-verification artifact to Status: Active. Then re-run /startup-loop status --business <BIZ>.`

Surface this gate when the business moves from channel strategy completion (plan done) to channel activation planning (budget allocation, first ad spend). Strategy design output may be completed and persisted without triggering this gate.

---

### SELL-01 Secondary Skill Dispatch (after lp-channels completes)

**Trigger**: After `/lp-channels` produces a completed channel strategy artifact and the SELL-01 stage doc is committed.

**Do NOT alter**: the `/lp-channels` invocation itself, GATE-SELL-STRAT-01, or GATE-SELL-ACT-01.

**Directive**: Dispatch `lp-seo` and `draft-outreach` in parallel simultaneously via the Task tool in a SINGLE message. Do not dispatch them sequentially — both must be launched in the same Task tool call batch.

Protocol reference: `.claude/skills/_shared/subagent-dispatch-contract.md` (Model A — analysis phase; orchestrator applies diffs after both complete).

**Required steps**:
1. Confirm `/lp-channels` artifact is committed and SELL-01 stage doc is updated.
2. In a single message, spawn two Task tool calls in parallel:
   - Task A: `/lp-seo` — SEO strategy for the business, scoped to SELL-01 outputs.
   - Task B: `draft-outreach` — outreach draft, scoped to SELL-01 channel and offer artifacts.
3. Await both completions before advancing SELL-01 stage doc to Done.
4. Synthesize both outputs into the SELL-01 stage doc before triggering the S4 join barrier.

**Blocked if**: either subagent returns `status: fail` — quarantine the failed result, flag in SELL-01 stage doc, and surface to operator before advancing.

---

## Ongoing Gap-Fill Gates (lp-do-fact-find complement)

These gates fire on live loop events — not just at weekly review time. They are **advisory by default** (do not block advance) unless the condition has persisted long enough to open a replan trigger (GATE-LOOP-GAP-02 hard mode). Each gate dispatches `/lp-do-fact-find` with `startup-loop-gap-fill` alias and the appropriate trigger type.

---

### GATE-LOOP-GAP-01: Stage-blocked briefing

**Gate ID**: GATE-LOOP-GAP-01 (Soft — advisory, does not block advance)
**Trigger**: Any `advance` call where `events.jsonl` contains a `stage_blocked` entry for the current run that does not yet have a corresponding `block-brief-<stage>.md` artifact.

**Check**:

```bash
# Step 1 — find most recent stage_blocked event for this run
grep '"event":"stage_blocked"' docs/business-os/startup-baselines/<BIZ>/runs/<run_id>/events.jsonl \
  | tail -1 | python3 -c "import sys,json; e=json.load(sys.stdin); print(e['stage'])"

# Step 2 — check if block-brief already exists for that stage
ls docs/business-os/startup-baselines/<BIZ>/runs/<run_id>/block-brief-<stage>.md 2>/dev/null
```

**When triggered** (blocked event found, no existing brief):

Dispatch `/lp-do-fact-find` with:
```
/lp-do-fact-find --startup-loop-gap-fill --trigger block --biz <BIZ> --run-id <run_id> --stage <blocked_stage>
```

Present output to operator before showing next-action. Do NOT block advance — advisory only.

**Skipped when**: No `stage_blocked` event in current run, or brief already exists.

---

### GATE-LOOP-GAP-02: Bottleneck severity gap-fill

**Gate ID**: GATE-LOOP-GAP-02 (Soft advisory → Hard when replan trigger is `open`)
**Trigger**: Any `advance` call where `bottleneck-diagnosis.json` for the current run contains a constraint with severity `critical` or `moderate` that is NEW relative to the prior entry in `bottleneck-history.jsonl`.

**Check**:

```bash
# Step 1 — get active constraint keys at critical/moderate severity
python3 -c "
import json
diag = json.load(open('docs/business-os/startup-baselines/<BIZ>/runs/<run_id>/bottleneck-diagnosis.json'))
print([c['key'] for c in diag.get('constraints', []) if c.get('severity') in ('critical', 'moderate')])
"

# Step 2 — compare against prior snapshot in bottleneck-history.jsonl (last entry before this run)
# Flag any key present in current but absent from prior snapshot

# Step 3 — check replan trigger state
python3 -c "
import json
t = json.load(open('docs/business-os/startup-baselines/<BIZ>/replan-trigger.json'))
print(t.get('status', 'none'))
"
```

**Decision table**:

| New constraints found | replan-trigger.json status | Action |
|---|---|---|
| No | any | Skip gate |
| Yes | `none` or `acknowledged` | Advisory: dispatch gap-fill, surface to operator, continue advance |
| Yes | `open` | **Hard block**: `GATE-LOOP-GAP-02: Replan trigger is open for a persisting bottleneck constraint. Run /lp-do-fact-find --startup-loop-gap-fill --trigger bottleneck first, then /lp-do-replan before advancing.` |

**When dispatching** (advisory path):

```
/lp-do-fact-find --startup-loop-gap-fill --trigger bottleneck --biz <BIZ> --run-id <run_id>
```

Output path: `docs/business-os/startup-baselines/<BIZ>/runs/<run_id>/bottleneck-gap-fill-<YYYY-MM-DD>.md`

**When hard blocked**:
- Blocking reason: `GATE-LOOP-GAP-02: Replan trigger is open. A bottleneck constraint has persisted for multiple consecutive runs at moderate+ severity. Evidence investigation required before advancing.`
- Next action: `Run /lp-do-fact-find --startup-loop-gap-fill --trigger bottleneck --biz <BIZ>, review the output, then run /lp-do-replan --biz <BIZ>. When replan-trigger.json status is acknowledged, re-run /startup-loop advance --business <BIZ>.`

---

### GATE-LOOP-GAP-03: Pre-S10 feedback loop audit

**Gate ID**: GATE-LOOP-GAP-03 (Soft — advisory, does not block S10 advance)
**Trigger**: Before S10 becomes Active (S9B→S10 transition), when no `feedback-loop-audit-<YYYY-MM-DD>.md` exists for the current cycle's date.

**Check**:

```bash
# Check if feedback loop audit already run this cycle
ls docs/business-os/strategy/<BIZ>/feedback-loop-audit-<YYYY-MM-DD>.md 2>/dev/null
```

Where `<YYYY-MM-DD>` is the current date. If file exists: gate passes silently. If absent: dispatch.

**When triggered**:

Dispatch `/lp-do-fact-find` with:
```
/lp-do-fact-find --startup-loop-gap-fill --trigger feedback --biz <BIZ> --run-id <run_id>
```

Output path: `docs/business-os/strategy/<BIZ>/feedback-loop-audit-<YYYY-MM-DD>.md`

Present output summary to operator alongside the S10 weekly-kpcs prompt — this audit is the input context for the decision memo. Do NOT delay S10 advance if operator wishes to proceed.

**Advisory message**: `GATE-LOOP-GAP-03: Feedback loop audit dispatched. Review feedback-loop-audit-<date>.md before completing the S10 KPCs memo — it lists which assumptions can now be updated from this cycle's actuals.`

---

## Business OS Sync Contract (Required Before Advance)

For each stage, require appropriate sync actions:

- `ASSESSMENT-09`: validate required ASSESSMENT precursor artifacts, then write/refresh `docs/business-os/startup-baselines/<BIZ>-intake-packet.user.md`.
- `MEASURE-01/PRODUCT-01/MARKET-01..MARKET-06/S3/S10`: persist strategy/readiness artifacts under `docs/business-os/...` and update any `latest.user.md` pointers.
- `S5A`: no BOS sync (pure ranking, no side effects).
- `S5B`: create/update ideas/cards via Business OS API (`/api/agent/ideas`, `/api/agent/cards`); commit manifest pointer.
- `DO`: upsert stage docs and lane transitions via `/api/agent/stage-docs` and `/api/agent/cards`.

Never allow stage advance when BOS sync has failed.

---

## Failure Handling

When blocked, always provide:
1. Exact failing gate.
2. Exact prompt file.
3. Exact required output path.
4. One command-like next step.

Example:
- `Run Deep Research with prompt_file and save output to required_output_path, then run /startup-loop submit --business <BIZ> --stage MARKET-01 --artifact <path>.`

---

## Recommended Operator Sequence

1. `/startup-loop start --business <BIZ> --mode dry --launch-surface <...>`
2. `/startup-loop status --business <BIZ>` after each major output
3. `/startup-loop submit --business <BIZ> --stage <STAGE_ID> --artifact <path>` after producing artifact
4. `/startup-loop advance --business <BIZ>` when ready to move

## Red Flags (invalid operation)

1. Advancing a stage while required output is missing.
2. Advancing a stage while required BOS sync action is incomplete.
3. Skipping MEASURE-01 (Agent-Setup) before downstream stages.
4. Skipping MEASURE-02 (Results) before PRODUCT-01.
5. Skipping PRODUCT-01 (Product from photo) before MARKET-01.
5. Continuing MARKET/SELL execution with stale or draft-only research artifacts.
