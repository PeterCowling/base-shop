# `cmd-advance` — Gap-Fill Gates

## Ongoing Gap-Fill Gates (`lp-do-fact-find` complement)

These gates fire on live loop events — not just at weekly review time. They are advisory by default (do not block advance) unless the condition has persisted long enough to open a replan trigger (`GATE-LOOP-GAP-02` hard mode). Each gate dispatches `/lp-do-fact-find` with `startup-loop-gap-fill` alias and the appropriate trigger type.

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

**Gate ID**: GATE-LOOP-GAP-02 (Soft advisory -> Hard when replan trigger is `open`)
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
| Yes | `open` | Hard block: `GATE-LOOP-GAP-02: Replan trigger is open for a persisting bottleneck constraint. Run /lp-do-fact-find --startup-loop-gap-fill --trigger bottleneck first, then /lp-do-replan before advancing.` |

**When dispatching** (advisory path):

```
/lp-do-fact-find --startup-loop-gap-fill --trigger bottleneck --biz <BIZ> --run-id <run_id>
```

Output path: `docs/business-os/startup-baselines/<BIZ>/runs/<run_id>/bottleneck-gap-fill-<YYYY-MM-DD>.md`

**When hard blocked**:
- Blocking reason: `GATE-LOOP-GAP-02: Replan trigger is open. A bottleneck constraint has persisted for multiple consecutive runs at moderate+ severity. Evidence investigation required before advancing.`
- Next action: `Run /lp-do-fact-find --startup-loop-gap-fill --trigger bottleneck --biz <BIZ>, review the output, then run /lp-do-replan --biz <BIZ>. When replan-trigger.json status is acknowledged, re-run /startup-loop advance --business <BIZ>.`

---

### GATE-LOOP-GAP-03: Pre-SIGNALS feedback loop audit

**Gate ID**: GATE-LOOP-GAP-03 (Soft — advisory, does not block SIGNALS/S10 advance)
**Trigger**: Before SIGNALS becomes Active (legacy transition label `S9B→S10`), when no `feedback-loop-audit-<YYYY-MM-DD>.md` exists for the current cycle's date.

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

Present output summary to operator alongside the SIGNALS weekly-kpcs prompt — this audit is the input context for the decision memo. Do NOT delay SIGNALS advance if operator wishes to proceed.

**Advisory message**: `GATE-LOOP-GAP-03: Feedback loop audit dispatched. Review feedback-loop-audit-<date>.md before completing the SIGNALS (legacy S10) KPCs memo — it lists which assumptions can now be updated from this cycle's actuals.`
