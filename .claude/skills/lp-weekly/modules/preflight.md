# preflight — `/lp-weekly` Module 1

Validates all required inputs before the orchestration sequence begins. Produces `preflight_status: ready` or `preflight_status: restricted` and a `missing_inputs` list. This module never blocks the weekly cycle — `restricted` is a documented state, not a hard gate.

## Inputs

| Input | Source | Required |
|---|---|---|
| Business code (`--biz`) | Invocation parameter | Yes |
| Week anchor (`--week`) | Invocation parameter or UTC date derivation | Yes |
| Run root directory | Derived: `docs/business-os/strategy/<BIZ>/` | Yes |
| Prior-week decision artifact | `docs/business-os/strategy/<BIZ>/<prior-date>-weekly-kpcs-decision.user.md` | Soft — absence noted, not blocking |
| KPI source references | Operator-supplied or inferred from strategy directory | Soft — absence triggers `restricted` on lane `b` |
| Denominator validity data | Operator-supplied or prior measurement artifact | Soft — absence triggers `restricted` on lane `b` |

## Steps

### Step 1.1 — Business directory check

Verify `docs/business-os/strategy/<BIZ>/` exists and is readable.

```
ls docs/business-os/strategy/<BIZ>/ 2>/dev/null
```

If absent: fail-closed immediately. Return:
```
Error: preflight fail-closed — docs/business-os/strategy/<BIZ>/ not found.
lp-weekly cannot proceed. Check --biz value.
```

### Step 1.2 — Week key derivation and validation

If `--week` is provided:
- Validate format matches `YYYY-Www` (e.g., `2026-W07`).
- If malformed: fail-closed with format error.

If `--week` is not provided:
- Derive from `--as-of-date` (or today) using ISO 8601 week numbering, UTC Monday anchor.
- Zero-pad week number to two digits.
- Record derived week key in preflight output.

### Step 1.3 — Idempotency check

Check whether a weekly packet already exists for this week key:

```
ls docs/business-os/strategy/<BIZ>/s10-weekly-packet-<YYYY-Www>.md 2>/dev/null
```

If present:
- Emit advisory: `Existing packet found for week <YYYY-Www>. Rerun will overwrite in-place per idempotency policy.`
- Continue (do not block).

If absent: continue.

### Step 1.4 — Prior-week decision artifact check

Look for the most recent KPCS decision artifact:

```
ls docs/business-os/strategy/<BIZ>/*-weekly-kpcs-decision.user.md 2>/dev/null | sort -r | head -1
```

If found: record path in `prior_decision_ref`. Continue.
If absent: record in `missing_inputs` as `prior_kpcs_decision_artifact (soft)`. Continue. This absence informs lane `a` audit quality but does not block preflight.

### Step 1.5 — KPI source and denominator check

For each required KPI family (as defined for this business; default families: traffic, revenue, conversion, CAC/LTV):

- Check whether any KPI snapshot artifact or inline operator note is present for this cycle.
- Denominator check: verify denominator values (e.g., session counts, user cohort sizes) have been noted or are inferable from prior artifacts.

**If one or more KPI families have no source data and no denominator value:**
- Add missing families to `missing_inputs`.
- Set `lane_b_restricted: true`.

**If all required KPI families have at least a partial source:**
- Set `lane_b_restricted: false`.

Note: partial data with data-quality notes is acceptable for lane `b` entry. The `restricted` state applies only when a required KPI family has zero source material.

## Outputs

```
preflight_status: ready | restricted
missing_inputs:
  - <item 1 (soft)>   # advisory items; do not block
  - <item 2 (hard)>   # required items missing; set lane_b_restricted
prior_decision_ref: <path or null>
lane_b_restricted: true | false
week_key: <YYYY-Www>
run_root: docs/business-os/strategy/<BIZ>/
```

`preflight_status: ready` — all required fields resolved; lane `b` may have full or partial data.
`preflight_status: restricted` — one or more hard-required inputs missing (e.g., `run_root` not found or `week_key` invalid). In practice this should only occur on invocation errors; missing KPI data sets `lane_b_restricted` not `preflight_status: restricted`.

## Week-key and Rerun Handling

- Week key is immutable once derived; all downstream modules use the key from this module's output.
- On rerun: preflight re-validates all inputs and overwrites preflight output. Prior `lane_b_restricted` state is recomputed — if missing inputs have been supplied since the prior run, `lane_b_restricted` becomes `false` and lane `b` proceeds normally.
- If preflight detects a different week key than the existing packet's key (e.g., operator passed `--week 2026-W08` but a `W07` packet exists), treat as a new week — do not overwrite the prior week's packet.

## Failure Handling

| Condition | Status | Action |
|---|---|---|
| `run_root` not found | `fail-closed` | Stop; emit error; do not proceed |
| `week_key` malformed | `fail-closed` | Stop; emit format error; do not proceed |
| KPI families missing | `restricted` (lane `b`) | Record in `missing_inputs`; emit REM task; continue orchestration |
| Prior decision artifact absent | Advisory | Record in `missing_inputs` as soft; continue |
