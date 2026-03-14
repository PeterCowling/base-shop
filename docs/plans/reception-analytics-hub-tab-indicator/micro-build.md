---
Type: Plan
Status: Active
Domain: UI
Feature-Slug: reception-analytics-hub-tab-indicator
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Deliverable-Type: code-change
Dispatch-ID: IDEA-DISPATCH-20260314070000-BRIK-REC-007
Last-updated: 2026-03-14
---

# Micro-Build: Reception analytics tab — active tab highlight missing bg-primary/10

## Source Dispatch

- Dispatch ID: `IDEA-DISPATCH-20260314070000-BRIK-REC-007`
- Queue route: `micro_build_ready → lp-do-build`
- Area anchor: Reception analytics screen — selected tab looks the same as other tabs

## Scope

Add `bg-primary/10` to the active-tab className in `AnalyticsHub.tsx`, matching the identical fix already applied to `CashHub`, `EodHub`, and `StockHub` in the previous `reception-dark-mode-ui-fixes` build.

**One file, one line change.**

## Affected Files

- `apps/reception/src/components/analytics/AnalyticsHub.tsx` — active tab className

## Execution Plan

1. Change line 37 of `AnalyticsHub.tsx`:
   - Before: `"border-primary text-primary"`
   - After: `"border-primary text-primary bg-primary/10"`

## Validation

- TC-01: Grep confirms `bg-primary/10` present in active-tab className in `AnalyticsHub.tsx`
- TC-02: No other hub components missing `bg-primary/10` (grep cross-check)

## Outcome Contract

- **Why:** All four hub components (Cash, Eod, Stock, Analytics) should have consistent active-tab styling. Analytics was missed in the previous build.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** AnalyticsHub active tab shows `bg-primary/10` highlight, visually consistent with CashHub, EodHub, and StockHub.
- **Source:** auto

## Task Summary

| ID | Type | Title | Status | Confidence |
|---|---|---|---|---|
| TASK-01 | IMPLEMENT | Add bg-primary/10 to AnalyticsHub active tab | Pending | 98 |
