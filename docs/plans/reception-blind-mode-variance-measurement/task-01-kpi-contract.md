---
Type: Spec
Status: Active
Domain: Platform
Last-updated: 2026-03-04
Feature-Slug: reception-blind-mode-variance-measurement
Task-ID: TASK-01
---

# TASK-01 KPI Contract

## Objective
Freeze one canonical KPI contract for blind-mode impact measurement so weekly reports are deterministic and comparable over time.

## KPI Definitions

### KPI-1: Cash Variance (signed)
- **Definition:** signed sum of per-shift `closeDifference` values for the day.
- **Formula:**
  - `cashVariance_day = Σ(closeDifference_shift)` for all closed shifts on Italy date `D`.
- **Sign convention:**
  - Positive: cash over expected.
  - Negative: cash short vs expected.
- **Code anchors:**
  - `apps/reception/src/schemas/tillShiftSchema.ts` (`closeDifference`)
  - `apps/reception/src/schemas/eodClosureSchema.ts` (`cashVariance`)
  - `apps/reception/src/hooks/mutations/useEodClosureMutations.ts` (`EodClosureSnapshot.cashVariance`)

### KPI-2: Stock Items Counted (coverage signal)
- **Definition:** number of distinct stock item IDs with at least one `count` ledger event on the day.
- **Formula:**
  - `stockItemsCounted_day = count(distinct itemId where entry.type == "count" and italyDate(entry.timestamp) == D)`
- **Code anchors:**
  - `apps/reception/src/schemas/eodClosureSchema.ts` (`stockItemsCounted`)
  - `apps/reception/src/hooks/mutations/useEodClosureMutations.ts` (`EodClosureSnapshot.stockItemsCounted`)

## Baseline vs Post Window Contract
- **Activation anchor date:** `BLIND_MODE_ACTIVATION_DATE` (to be set during TASK-02 from production deploy evidence).
- **Baseline window:** 28 full days immediately before activation anchor.
- **Post window:** rolling trailing 28 full days after activation anchor.
- **Comparison metric:**
  - `cashVarianceAbsMean = mean(abs(cashVariance_day))`
  - `improvementPercent = ((baselineAbsMean - postAbsMean) / baselineAbsMean) * 100`

## Exclusion Rules
- Exclude days where required till close records are missing (data completeness failure).
- Exclude days with manual correction flags once correction markers are available; until then, include but annotate in report.
- Do not mix timezone boundaries; use Italy date extraction consistently.

## Output Contract (for TASK-02 implementation)
Weekly artifact must include:
- activation anchor date
- baseline window range + value
- post window range + value
- improvement percent
- day counts included/excluded
- anomaly notes

## Acceptance Mapping
TASK-01 acceptance criteria are met by this document plus existing code anchors proving field-level schema support for `cashVariance` and `stockItemsCounted`.
