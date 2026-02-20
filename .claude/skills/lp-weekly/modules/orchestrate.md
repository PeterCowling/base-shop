# orchestrate — `/lp-weekly` Module 2

Executes the core weekly sequence: measurement compilation, decisioning handoff, audit/CI lane (`a`), and experiment lane (`c`). Receives preflight output and returns lane statuses for the publish module.

## Inputs (from preflight module)

| Input | Source |
|---|---|
| `preflight_status` | preflight.md output |
| `week_key` | preflight.md output |
| `run_root` | preflight.md output |
| `prior_decision_ref` | preflight.md output |
| `lane_b_restricted` | preflight.md output |
| `missing_inputs` | preflight.md output |

## Global Invariants

- Decision authority for weekly memo content is `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`. This module does not generate or replace that memo — it emits the handoff prompt and records the output path.
- Stage graph authority is `docs/business-os/startup-loop/loop-spec.yaml`. This module does not modify stage ordering or gate semantics.
- Failures in any lane produce a warning + REM entry and a lane status of `incomplete` or `restricted`. They do not block the weekly cycle close.

---

## Step 2 — Measurement Compilation (Lane `b`)

### Purpose

Normalize available KPI snapshots and denominator data into a measurement summary section for the weekly packet. If `lane_b_restricted` is `true`, skip compilation and emit a restricted-state summary.

### Sub-steps (when `lane_b_restricted: false`)

#### 2.1 — Collect KPI snapshots

For each required KPI family:
- Locate most recent snapshot artifact or operator-provided values in `run_root`.
- Record observed value, comparison period (prior week or prior month), and delta.

#### 2.2 — Denominator validity check

- Confirm denominator values are present and within plausible range.
- Note any denominator drift (e.g., cohort definition changed, tracking gap).
- Record `denominator_validity_state: valid | drift-noted | unknown`.

#### 2.3 — Data quality notes

- Summarize any data quality issues surfaced during collection.
- Assign a `data_quality_flag: clean | degraded | unknown` per KPI family.

#### 2.4 — Emit measurement summary

Produce a normalized measurement summary block for inclusion in the weekly packet:

```
measurement_summary:
  kpi_families:
    - family: <name>
      value: <observed>
      prior: <comparison value>
      delta: <+/- value or %>
      denominator_validity: valid | drift-noted | unknown
      data_quality: clean | degraded | unknown
  denominator_validity_state: valid | drift-noted | unknown
  data_quality_flag: clean | degraded | unknown
```

### Sub-steps (when `lane_b_restricted: true`)

- Emit `measurement_summary: restricted`.
- Record which KPI families are missing in the restricted note.
- Emit REM task: `REM-<BIZ>-<YYYYMMDD>-1: Lane b restricted — missing KPI families: <list>. Operator action required before next weekly close.`
- Set `lane_b_status: restricted`.

---

## Step 3 — Decisioning Handoff (Authoritative Prompt)

### Purpose

Hand off the KPCS weekly decision prompt to the operator for execution. Record the canonical decision artifact path once submitted.

### Sub-steps

#### 3.1 — Check for existing decision artifact this week

```
ls docs/business-os/strategy/<BIZ>/<as_of_date>-weekly-kpcs-decision.user.md 2>/dev/null
```

If present: record path in `kpcs_decision_ref`. Note: decision memo already exists for this week; proceeding with references.
If absent: emit handoff directive.

#### 3.2 — Emit decision prompt handoff (if not already produced)

Handoff directive to operator:
```
Prompt file: docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md
Required output path: docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-weekly-kpcs-decision.user.md
Next action: Execute the KPCS decision prompt for week <YYYY-Www>. Save the completed memo to the required output path, then continue the /lp-weekly sequence.
```

This step is advisory in orchestration flow — the decision prompt is an operator-executed authoritative document. `/lp-weekly` does not generate decision memo content.

#### 3.3 — Record decision artifact reference

- `kpcs_decision_ref`: path to decision artifact once it exists.
- If artifact not yet present at publish time: packet records `kpcs_decision_ref: pending — <YYYY-MM-DD>-weekly-kpcs-decision.user.md not found at publish time`.

---

## Step 4 — Weekly Audit Lane (`a`) — Audit + CI Capture

### Purpose

Run Section H checks and monthly deep-audit trigger check; link signal-review and feedback-loop audit outputs; apply dedup rule; emit REM summary.

### Inputs

| Input | Source |
|---|---|
| KPCS decision artifact (or prior-week ref) | `prior_decision_ref` or step 3.3 ref |
| Exception tickets / CAP state | Operator-provided or `run_root` artifacts |
| Prior REM items | `docs/business-os/strategy/<BIZ>/` |
| Signal review artifact | Emitted by `/lp-signal-review` sub-flow |
| Feedback loop audit artifact | Emitted by GATE-LOOP-GAP-03 sub-flow |

### Sub-steps

#### 4.1 — GATE-BD-08 check (Brand Dossier staleness)

Check Brand Dossier `Last-reviewed` date from `docs/business-os/strategy/<BIZ>/index.user.md`. If >90 days ago: emit soft warning (non-blocking):
```
GATE-BD-08: Brand Dossier not reviewed in >90 days. Consider re-running BRAND-DR-01/02 and updating brand-dossier.user.md.
```

This check is inherited from `cmd-advance.md` GATE-BD-08 and must NOT be altered or suppressed here.

#### 4.2 — Feedback loop audit sub-flow

Check for feedback loop audit artifact this cycle:
```
ls docs/business-os/strategy/<BIZ>/feedback-loop-audit-<as_of_date>.md 2>/dev/null
```

If absent: dispatch sub-flow per GATE-LOOP-GAP-03 protocol:
```
/lp-do-fact-find --startup-loop-gap-fill --trigger feedback --biz <BIZ> --run-id <run_id>
```

Record output path as `feedback_audit_ref`.

#### 4.3 — Signal review sub-flow

Invoke `/lp-signal-review`:
```
/lp-signal-review --biz <BIZ> --run-root docs/business-os/strategy/<BIZ>/ --as-of-date <as_of_date>
```

Record emitted artifact path as `signal_review_ref`.

#### 4.4 — Section H weekly audit check

Using the KPCS decision artifact (or prior-week reference if current week is pending):
- Confirm Section H of the decision memo is present and completed.
- Record `section_h_status: complete | incomplete | pending-decision-memo`.
- If `incomplete`: emit REM task: `REM-<BIZ>-<YYYYMMDD>-2: Section H incomplete in weekly KPCS memo. Review and complete before next cycle.`

#### 4.5 — Monthly deep-audit trigger check

Check `docs/business-os/startup-loop/audit-cadence-contract-v1.md` monthly trigger rule:
- If this week is the monthly trigger week (as defined in the contract): emit advisory noting monthly deep-audit is due.
- Record `monthly_audit_trigger: due | not-due | unknown`.
- If `due` and no monthly audit artifact found for this month: emit REM task: `REM-<BIZ>-<YYYYMMDD>-3: Monthly deep-audit due. No audit artifact found for <YYYY-MM>. Schedule and complete before next weekly cycle.`

#### 4.6 — CI findings dedup

Collect finding IDs from:
- Signal review artifact (Finding Briefs).
- Feedback loop audit artifact (if emitted).

Apply dedup rule: if the same finding key appears in both artifacts (matched by process-artifact path or finding description), record it once in the REM delta. Do not emit duplicate REM tasks for the same root cause.

#### 4.7 — REM delta compilation

Compile all new REM tasks emitted in this step into a `rem_delta` block:
```
rem_delta:
  new:
    - id: REM-<BIZ>-<YYYYMMDD>-<n>
      source: <signal-review | feedback-audit | section-h | monthly-trigger>
      description: <summary>
  resolved: []  # operator-confirmed closures from prior REM list
  carryover: <count of prior unresolved REM tasks not yet closed>
```

### Lane `a` Exit Conditions

| State | Condition |
|---|---|
| `complete` | All sub-steps ran; Section H verified; signal review emitted; REM delta compiled |
| `incomplete` | One or more sub-steps failed or skipped; warning + REM emitted per gap |

---

## Step 5 — Experiment Lane (`c`) — Portfolio Rollup

### Purpose

Roll up active and recently-completed experiment readouts; update the next-cycle experiment backlog with new specs or carry-forward actions.

### Inputs

| Input | Source |
|---|---|
| Experiment readouts | `docs/business-os/strategy/<BIZ>/` experiment readout artifacts |
| Decision class from KPCS memo | Step 3 output (if decision memo present) |
| Prior experiment backlog | Most recent backlog artifact in `run_root` or operator-provided |

### Sub-steps

#### 5.1 — Discover active experiments

Locate all active experiment spec artifacts:
```
ls docs/business-os/strategy/<BIZ>/*-experiment-spec*.md 2>/dev/null | sort -r
```

For each active experiment, check for a corresponding readout artifact produced this cycle:
```
ls docs/business-os/strategy/<BIZ>/*-experiment-readout*.md 2>/dev/null | sort -r | head -5
```

#### 5.2 — Invoke `/lp-experiment readout` per active experiment (if readouts not yet produced)

For each active experiment without a readout this week:
```
/lp-experiment readout --business <BIZ> --experiment <name>
```

Record decision recommendation (CONTINUE / PIVOT / SCALE / KILL) per experiment.

#### 5.3 — Produce experiment portfolio rollup

Summarize all active experiments and their current readout status:

```
experiment_portfolio_summary:
  active:
    - name: <experiment-name>
      readout_status: complete | pending
      decision: CONTINUE | PIVOT | SCALE | KILL | pending
      prior_refs: [<artifact_scope#prior_id>]  # if applicable
  completed_this_week:
    - name: <experiment-name>
      verdict: PASS | FAIL | INCONCLUSIVE
      decision: SCALE | KILL | PIVOT
```

#### 5.4 — Update next-cycle experiment backlog

Using decision class from KPCS memo and experiment readout recommendations (see decision-to-action mapping table in `s10-weekly-orchestration-contract-v1.md` Section 7):
- For SCALE decisions: add to production rollout backlog.
- For PIVOT decisions: design next variant spec or carry-forward action.
- For KILL decisions: record learning; note freed experiment slot.
- For CONTINUE decisions: record expected readout date.

Update or create the experiment backlog artifact:
`docs/business-os/strategy/<BIZ>/experiment-backlog-<YYYY-Www>.md`

Record delta as `next_cycle_backlog_delta`:
```
next_cycle_backlog_delta:
  added: <count>
  carried_forward: <count>
  removed: <count>
  backlog_ref: <path to updated backlog artifact>
```

#### 5.5 — Failure handling

If a readout cannot be produced for an active experiment (missing data, experiment not yet mature):
- Emit warning: `Warning: Experiment readout for <name> could not be completed. Missing: <reason>.`
- Emit carry-forward action: `Carry forward: <name> — revisit next cycle. Owner: <experiment owner or operator>.`
- Set `lane_c_status: carry-forward` if any experiments are carried.

### Lane `c` Exit Conditions

| State | Condition |
|---|---|
| `complete` | All active experiments have readouts or carry-forward actions; backlog updated |
| `carry-forward` | One or more experiments carried forward with explicit rationale; backlog reflects delta |

---

## Step Summary Output

On completion of all steps, this module returns:

```
lane_b_status: ready | restricted
lane_a_status: complete | incomplete
lane_c_status: complete | carry-forward
kpcs_decision_ref: <path or pending>
signal_review_ref: <path or null>
feedback_audit_ref: <path or null>
measurement_summary: <block or restricted>
rem_delta: <block>
experiment_portfolio_summary: <block>
next_cycle_backlog_delta: <block>
```

Pass all outputs to `modules/publish.md`.

## Week-key and Rerun Handling

- All sub-steps use `week_key` from preflight as the canonical grouping key.
- On rerun: each sub-step re-checks for existing artifacts before invoking sub-flows. If a signal review or feedback audit was already emitted for the same `as_of_date`, do not re-invoke — record the existing artifact path and proceed.
- Idempotency for experiment readouts: if a readout artifact already exists for this week and experiment, record it without re-invoking `/lp-experiment readout`.
