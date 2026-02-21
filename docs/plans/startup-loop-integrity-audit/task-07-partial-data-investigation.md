---
Type: Investigation
Status: Complete
Plan: docs/plans/startup-loop-integrity-audit/plan.md
Task: TASK-07
Investigator: lp-do-build (Wave 1 analysis subagent)
Date: 2026-02-20
---

# TASK-07: Investigation — diagnosis_status partial_data trigger

## Summary

**Verdict: GO** — the `partial_data` trigger condition is clear, deterministic, and implementable in a single expression at `bottleneck-detector.ts:287`. Two existing tests (TC-04, TC-09 in `bottleneck-detector.test.ts`) currently assert `'ok'` but will require assertion updates after implementation.

---

## Q1: What is the correct trigger condition for `partial_data`?

**From `bottleneck-diagnosis-schema.md` Section 7 (Status Transition Rules):**

> `partial_data`: At least one metric missing/excluded, but diagnosis still possible (status would be `ok` or `no_bottleneck`)

**Operationally:**

```
diagnosis_status === 'partial_data' when:
  (data_quality.missing_targets.length > 0 ||
   data_quality.missing_actuals.length > 0 ||
   data_quality.excluded_metrics.length > 0)
  AND status would otherwise be 'ok' or 'no_bottleneck'
  (i.e. at least one rank-eligible metric or blocked stage exists — candidates > 0)
```

The `data_quality` arrays are populated at Steps 6–7 of the bottleneck detection algorithm (in `bottleneck-detector.ts`). By Step 9 where `diagnosis_status` is set, these arrays are already fully populated and available.

---

## Q2: Is the deferral deliberate or accidental?

**Deliberate.** `bottleneck-detector.ts:287` contains:

```typescript
diagnosis_status: 'ok',  // TODO: implement partial_data when data_quality arrays are non-empty
```

The comment is present but no TODO issue was filed. The schema (Section 7) defines the condition precisely. The implementation gap is a known deferral, not an oversight.

---

## Q3: Can a deterministic test be written?

**Yes.** The fixture setup is minimal:
- Write S3 forecast with `targets` for some but not all metrics (e.g., only `cvr` and `cac`)
- Write S10 readout with `actuals` for all metrics
- Call `diagnoseFunnelMetrics()` (or the equivalent entry point in `bottleneck-detector.ts`)
- Assert `diagnosis_status === 'partial_data'`

The condition is purely data-driven: `data_quality.missing_targets.length > 0` when S3 only provides partial targets. No timing or external state required.

---

## Q4: Is this an IMPLEMENT-eligible follow-on task?

**GO.** The implementation is:
1. At `bottleneck-detector.ts` Step 9 (where `diagnosis_status: 'ok'` is hardcoded):
   - Check `data_quality.missing_targets.length > 0 || data_quality.missing_actuals.length > 0 || data_quality.excluded_metrics.length > 0`
   - If true and status would be `ok` or `no_bottleneck`: set `diagnosis_status = 'partial_data'`
2. Update TC-04 (line ~352) and TC-09 (line ~788) in `bottleneck-detector.test.ts` to assert `'partial_data'` instead of `'ok'`

---

## Downstream Test Impact

Two existing tests in `scripts/src/startup-loop/__tests__/bottleneck-detector.test.ts` will require assertion updates after this implementation:

| Test ID | Approx line | Current assertion | Post-implementation assertion |
|---|---|---|---|
| TC-04 | ~352 | `expect(result.diagnosis_status).toBe('ok')` | `expect(result.diagnosis_status).toBe('partial_data')` |
| TC-09 | ~788 | `expect(result.diagnosis_status).toBe('ok')` | `expect(result.diagnosis_status).toBe('partial_data')` |

Both tests use fixtures with partial `data_quality` arrays (missing actuals or targets), which is exactly the `partial_data` trigger condition.

---

## Recommended Follow-on Task

Add an IMPLEMENT task via `/lp-do-replan` after Wave 1/2 complete:

```
Type: IMPLEMENT
Title: Implement diagnosis_status partial_data in bottleneck-detector.ts
Affects:
  - scripts/src/startup-loop/bottleneck-detector.ts
  - scripts/src/startup-loop/__tests__/bottleneck-detector.test.ts
Confidence: 90% (trigger condition fully specified; implementation is single boolean expression)
TC: partial_data trigger test (new) + TC-04 + TC-09 assertion updates
```
