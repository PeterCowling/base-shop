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

### GATE-BD-00: Business naming research required at S0→S1 (when name unconfirmed)

**Gate ID**: GATE-BD-00 (Hard)
**Trigger**: Before advancing from S0 to S1. Runs before GATE-BD-01. Does not trigger for businesses with a confirmed name.

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

**Parse error handling:** If `business_name_status` field is present but value cannot be parsed, treat as `confirmed` (fail-open) and emit: `Warning: GATE-BD-00: Could not parse business_name_status — treating as confirmed. Check intake packet for malformed field.`

---

### GATE-BD-01: Brand Dossier bootstrap required at S1 advance

**Gate ID**: GATE-BD-01 (Hard)
**Trigger**: Before advancing from S1 to S2 (or S1B/S2A for conditional stages).

**Rule**: Check `docs/business-os/strategy/<BIZ>/index.user.md` — read Brand Dossier Status column. Gate passes if Brand Dossier Status = `Draft` or `Active`. Gate blocks if Status = `—` (not created) or file is missing.

```bash
grep "Brand Dossier" docs/business-os/strategy/<BIZ>/index.user.md | grep -E "Draft|Active"
```

**When blocked**:
- Blocking reason: `GATE-BD-01: Brand Dossier missing or not at Draft minimum. Cannot advance past S1.`
- Next action: `Run /lp-brand-bootstrap <BIZ> to create brand-dossier.user.md, then update index.user.md Status to Draft.`

---

### GATE-BD-03: Messaging Hierarchy required at S2B Done

**Gate ID**: GATE-BD-03 (Hard)
**Trigger**: S2B completion check — S2B is not Done until both offer artifact AND messaging-hierarchy.user.md (Draft minimum) exist.

**Rule**: Check Messaging Hierarchy Status column in index.user.md. Default to blocked (fail-closed) if Status cannot be parsed.

```bash
grep "Messaging Hierarchy" docs/business-os/strategy/<BIZ>/index.user.md | grep -E "Draft|Active"
```

**When blocked**:
- Blocking reason: `GATE-BD-03: Messaging Hierarchy missing or not at Draft minimum. S2B is not Done until messaging-hierarchy.user.md exists.`
- Next action: `Create messaging-hierarchy.user.md at Draft minimum using BRAND-DR-03/04 prompts, then update index.user.md Status to Draft.`

---

### GATE-BD-08: Brand Dossier staleness warning at S10

**Gate ID**: GATE-BD-08 (Soft — warning, not block)
**Trigger**: S10 weekly readout review.

**Rule**: Check Brand Dossier `Last-reviewed` date in `docs/business-os/strategy/<BIZ>/index.user.md`. If Last-reviewed > 90 days ago: emit warning (do not block).
- Warning: `GATE-BD-08: Brand Dossier not reviewed in >90 days. Consider re-running BRAND-DR-01/02 and updating brand-dossier.user.md.`

---

### GATE-S6B-STRAT-01: Strategy design gate

**Gate ID**: GATE-S6B-STRAT-01 (Hard)
**Trigger**: Before S6B (Channel Strategy + GTM) begins — evaluated at the S2B→S6B fan-out.

**Rationale**: Channel selection, GTM planning, and messaging strategy can validly precede measurement readiness — strategy design is not spend commitment.

**Rule — must pass**: A valid Demand Evidence Pack (DEP) artifact exists for this business and passes the schema pass floor: `docs/business-os/startup-baselines/<BIZ>/demand-evidence-pack.md`

**When blocked**:
- Blocking reason: `GATE-S6B-STRAT-01: No valid DEP artifact. Channel strategy requires demand evidence — run /lp-readiness or capture DEP records before starting S6B.`
- Next action: `Complete DEP capture, verify it passes the schema pass floor (demand-evidence-pack-schema.md §2), then re-run /startup-loop status --business <BIZ>.`

---

### GATE-S6B-ACT-01: Spend activation gate

**Gate ID**: GATE-S6B-ACT-01 (Hard)
**Trigger**: Before any paid channel spend is committed from S6B channel selection.

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
- Blocking reason: `GATE-S6B-ACT-01: Decision-grade measurement signal not verified. Channel spend before working measurement is waste.`
- Next action: `Resolve active measurement risks, verify conversion events firing in production, and update measurement-verification artifact to Status: Active. Then re-run /startup-loop status --business <BIZ>.`

Surface this gate when the business moves from channel strategy completion (plan done) to channel activation planning (budget allocation, first ad spend). Strategy design output may be completed and persisted without triggering this gate.

---

### S6B Secondary Skill Dispatch (after lp-channels completes)

**Trigger**: After `/lp-channels` produces a completed channel strategy artifact and the S6B stage doc is committed.

**Do NOT alter**: the `/lp-channels` invocation itself, GATE-S6B-STRAT-01, or GATE-S6B-ACT-01.

**Directive**: Dispatch `lp-seo` and `draft-outreach` in parallel simultaneously via the Task tool in a SINGLE message. Do not dispatch them sequentially — both must be launched in the same Task tool call batch.

Protocol reference: `.claude/skills/_shared/subagent-dispatch-contract.md` (Model A — analysis phase; orchestrator applies diffs after both complete).

**Required steps**:
1. Confirm `/lp-channels` artifact is committed and S6B stage doc is updated.
2. In a single message, spawn two Task tool calls in parallel:
   - Task A: `/lp-seo` — SEO strategy for the business, scoped to S6B outputs.
   - Task B: `draft-outreach` — outreach draft, scoped to S6B channel and offer artifacts.
3. Await both completions before advancing S6B stage doc to Done.
4. Synthesize both outputs into the S6B stage doc before triggering the S4 join barrier.

**Blocked if**: either subagent returns `status: fail` — quarantine the failed result, flag in S6B stage doc, and surface to operator before advancing.

---

## Business OS Sync Contract (Required Before Advance)

For each stage, require appropriate sync actions:

- `S0`: update `docs/business-os/strategy/<BIZ>/plan.user.md` scope and constraints.
- `S1/S1B/S2/S3/S10`: persist strategy/readiness artifacts under `docs/business-os/...` and update any `latest.user.md` pointers.
- `S5A`: no BOS sync (pure ranking, no side effects).
- `S5B`: create/update ideas/cards via Business OS API (`/api/agent/ideas`, `/api/agent/cards`); commit manifest pointer.
- `S7/S8/S9`: upsert stage docs and lane transitions via `/api/agent/stage-docs` and `/api/agent/cards`.

Never allow stage advance when BOS sync has failed.

---

## Failure Handling

When blocked, always provide:
1. Exact failing gate.
2. Exact prompt file.
3. Exact required output path.
4. One command-like next step.

Example:
- `Run Deep Research with prompt_file and save output to required_output_path, then run /startup-loop submit --business <BIZ> --stage S2 --artifact <path>.`

---

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
