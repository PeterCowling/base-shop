---
Type: Spec
Status: Active
Domain: Platform
Last-updated: 2026-03-09
Feature-Slug: reception-blind-mode-variance-measurement
Task-ID: TASK-01
---

# TASK-01 KPI Contract

## Objective
Freeze one canonical KPI contract for blind-mode impact measurement so weekly reports are deterministic and comparable over time from the existing discrepancy records written by the till close flow.

## KPI Definitions

### KPI-1: Cash Discrepancy Variance
- **Definition:** daily aggregate of cash discrepancy records stored under `/cashDiscrepancies`.
- **Formula:**
  - `cashAbs_day = Σ(abs(amount_record))` for all cash discrepancy records on Italy date `D`
  - `cashSigned_day = Σ(amount_record)` for all cash discrepancy records on Italy date `D`
- **Primary weekly comparator:** `cashAbsMean = mean(cashAbs_day)` across included dates.
- **Diagnostic secondary metric:** `cashSignedMean = mean(cashSigned_day)` across included dates.
- **Code anchors:**
  - `apps/reception/src/schemas/cashDiscrepancySchema.ts`
  - `apps/reception/src/hooks/data/useCashDiscrepanciesData.ts`
  - `scripts/src/reception/blind-mode-variance-report.ts`

### KPI-2: Keycard Discrepancy Variance
- **Definition:** daily aggregate of keycard discrepancy records stored under `/keycardDiscrepancies`.
- **Formula:**
  - `keycardAbs_day = Σ(abs(amount_record))` for all keycard discrepancy records on Italy date `D`
  - `keycardSigned_day = Σ(amount_record)` for all keycard discrepancy records on Italy date `D`
- **Primary weekly comparator:** `keycardAbsMean = mean(keycardAbs_day)` across included dates.
- **Diagnostic secondary metric:** `keycardSignedMean = mean(keycardSigned_day)` across included dates.
- **Code anchors:**
  - `apps/reception/src/schemas/keycardDiscrepancySchema.ts`
  - `apps/reception/src/hooks/data/useKeycardDiscrepanciesData.ts`
  - `scripts/src/reception/blind-mode-variance-report.ts`

### KPI-3: Combined Blind-Mode Variance
- **Definition:** combined daily discrepancy burden across cash and keycard counting.
- **Formula:**
  - `combinedAbs_day = cashAbs_day + keycardAbs_day`
  - `combinedSigned_day = cashSigned_day + keycardSigned_day`
- **Primary decision metric:** `combinedAbsMean = mean(combinedAbs_day)` across included dates.
- **Improvement metric:** `combinedAbsImprovementPercent = ((baselineCombinedAbsMean - postCombinedAbsMean) / baselineCombinedAbsMean) * 100`
- **Use:** This is the threshold-driving KPI referenced by the weekly review cadence.

## Baseline vs Post Window Contract
- **Activation anchor date:** `BLIND_MODE_ACTIVATION_DATE` (to be set during TASK-02 from production deploy evidence).
- **Baseline window:** 28 full days immediately before activation anchor.
- **Post window:** rolling trailing 28 full days after activation anchor.
- **Comparison metric:**
  - `cashAbsMean = mean(cashAbs_day)`
  - `keycardAbsMean = mean(keycardAbs_day)`
  - `combinedAbsMean = mean(combinedAbs_day)`
  - `improvementPercent = ((baselineCombinedAbsMean - postCombinedAbsMean) / baselineCombinedAbsMean) * 100`

## Exclusion Rules
- Use Italy date extraction consistently; do not mix timezone boundaries.
- Current generator contract treats dates with no discrepancy rows as zero-discrepancy days inside the requested window.
- Current live export does not carry a completeness marker, so missing-close vs genuine-zero days cannot yet be distinguished; this remains a known limitation and must be annotated rather than silently excluded.
- If manual correction markers are added later, exclude corrected days only after the report generator is updated to detect them deterministically.

## Output Contract (for TASK-02 implementation)
Weekly artifact must include:
- activation anchor date
- baseline window range + cash/keycard/combined values
- post window range + cash/keycard/combined values
- combined improvement percent
- signed means for diagnostic context
- included date counts and any truncation warnings
- anomaly / data-quality notes

## Acceptance Mapping
TASK-01 acceptance criteria are met by this document plus existing code anchors proving field-level schema support for cash/keycard discrepancy records and the deterministic weekly aggregator.
