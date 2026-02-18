# Outcome A Module: Startup Loop Gap Fill

Use this module only when:
- `Startup-Deliverable-Alias: startup-loop-gap-fill`

This is a loop-internal branch. Do not run generic code/business checklists. Trigger type drives scope.

## Trigger Types

Three trigger types route this module to different evidence slices and output paths. Read the trigger argument (or infer from context) to determine which path applies.

| Trigger | Fired by | Output path |
|---|---|---|
| `block` | `stage_blocked` event in events.jsonl | `docs/business-os/startup-baselines/<BIZ>/runs/<run_id>/block-brief-<stage>.md` |
| `bottleneck` | New `critical` or `moderate` constraint in bottleneck-diagnosis.json | `docs/business-os/startup-baselines/<BIZ>/runs/<run_id>/bottleneck-gap-fill-<date>.md` |
| `feedback` | Pre-S10 feedback loop audit (S9B→S10 transition) | `docs/business-os/strategy/<BIZ>/feedback-loop-audit-<date>.md` |

If trigger type cannot be determined, ask one targeted question: "Is this triggered by a blocked stage, a bottleneck metric miss, or the pre-S10 feedback audit?"

---

## Schema References

Before investigating, read and hold open:
- `docs/business-os/startup-loop/event-state-schema.md` — stage status transitions, event ledger format
- `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md` — constraint key format, severity bands, replan trigger lifecycle

---

## Trigger: `block` — Stage-Blocked Briefing

**Outcome**: `briefing` (Outcome B posture — understanding only, no implementation tasks)

**Evidence slices** (in order):

1. Blocking event
   - Read `events.jsonl` for the run. Extract the most recent `stage_blocked` entry.
   - Capture: `stage`, `blocking_reason`, `timestamp`.

2. Missing artifact or condition
   - What artifact or approval is the advance gate waiting on?
   - Check the relevant gate definition in `cmd-advance.md` for the exact expected path.

3. Decision owner
   - Who must act to unblock? Operator, external party, or agent task?
   - Is there a Human Judgment Gate (P10) involved?

4. Evidence to unblock
   - What information, data point, or completed action would satisfy the gate?
   - Is it a missing artifact (write path known), a missing approval (owner known), or a missing data point (source unknown)?

5. Estimated resolution path
   - Short (same session), medium (next cycle), or blocked-until-external?

**Output format**: Use `docs/briefs/_templates/briefing-note.md`.

**Downstream consumer**: Operator review. May feed manual `/lp-replan` invocation if block persists across runs.

---

## Trigger: `bottleneck` — Bottleneck Root-Cause Investigation

**Outcome**: `planning` (Outcome A posture — feeds `/lp-replan`)

**Pre-check**: Read `bottleneck-diagnosis.json` for the run. Confirm at least one constraint has severity `critical` or `moderate` that is NEW (not present in the prior snapshot in `bottleneck-history.jsonl`). If no new constraints, emit a one-line note and exit: "No new bottleneck constraints found. Prior constraints already in investigation queue."

**Evidence slices** (in order):

1. Constraint inventory
   - List all active constraints from `bottleneck-diagnosis.json` with key, metric, severity, miss magnitude.
   - Identify which are NEW vs. persisting from prior cycles.

2. Ground truth data availability (P04)
   - For each new critical/moderate constraint: does a real, traceable data source exist?
   - Check: GA4 exports, booking system reports, CRM records, payment processor data.
   - Mark each as `confirmed`, `partial`, or `missing` with exact source path or gap.

3. Prior cycle feedback (P08)
   - Read `bottleneck-history.jsonl`. What was the prior value for this metric?
   - Has the miss been improving, stable, or worsening across cycles?
   - Which assumptions in `plan.user.md` or the forecast artifact should be updated from actuals?

4. Attribution limits
   - Are conversion events firing in production? (Check measurement-verification artifact.)
   - Are there multi-touch attribution gaps that make the metric unreliable?

5. Root cause hypothesis
   - For each new critical constraint: what is the most parsimonious root cause?
   - Is the miss from: insufficient traffic, conversion failure, data measurement gap, or external factor?
   - Confidence in hypothesis: `high` / `medium` / `low` with one-line rationale.

6. Replan trigger state
   - Read `replan-trigger.json`. Is a trigger already `open` or `acknowledged` for this constraint key?
   - If trigger is `open`: flag that `/lp-replan` must be invoked before this cycle advances.

**Output format**: Use `docs/plans/_templates/fact-find-planning.md`.

**Downstream consumer**: `/lp-replan` — include constraint key(s) and root cause hypotheses in frontmatter.

---

## Trigger: `feedback` — Pre-S10 Feedback Loop Audit

**Outcome**: `briefing` (Outcome B posture — inventory only, feeds S10 KPCs memo)

**Evidence slices** (in order):

1. Stage outcomes this cycle
   - For each stage marked `Done` in `state.json`, list the primary artifact path and its key output claim.
   - Identify which outputs included numeric targets or assumptions.

2. Actuals vs. assumptions
   - For each numeric assumption in `plan.user.md` or forecast artifact: is there a real measured value to compare against?
   - Categorize each as: `confirmed-match`, `confirmed-miss`, `untracked` (no measurement), or `pending` (measurement not yet available).

3. Prior feed-forward state (P08)
   - Are prior-cycle outcome metrics cited as priors in this cycle's plan or forecast artifact? (`plan.user.md` §Prior-Cycle section or equivalent.)
   - Mark `present`, `absent`, or `partial`.

4. Feedback loop artifacts
   - List all artifacts that contain backward-looking signals: bottleneck-history.jsonl, prior signal-review-*.md files, prior KPCs memos.
   - Flag any gap: signal that exists in reality but is not cited in current-cycle documents.

5. Priority priors to update before S10
   - Rank top 3 assumptions that can be updated from this cycle's actuals, with evidence source and recommended updated value.

**Output format**: Use `docs/briefs/_templates/briefing-note.md`.

**Downstream consumer**: S10 weekly KPCs memo — operator should reference this audit when completing the decision memo.

---

## Evidence Limits

- Max 8 open questions (per global invariant).
- Max 10 key files/modules in primary evidence list.
- Unknowns must include a concrete verification path.

## Confidence Inputs

For `bottleneck` trigger (planning outcome only):
- `Implementation`: confidence in constraint diagnosis accuracy
- `Approach`: confidence in root cause hypothesis
- `Impact`: confidence that resolving this constraint moves the primary business metric
- `Delivery-Readiness`: data sources confirmed available

For `block` and `feedback` triggers (briefing outcome): omit Confidence Inputs section — not required for understanding-only outputs.
