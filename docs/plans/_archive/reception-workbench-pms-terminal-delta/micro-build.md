---
Type: Micro-Build
Status: Archived
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-workbench-pms-terminal-delta
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260314161500-0008
Related-Plan: none
---

# Workbench PMS CC vs Terminal Delta Micro-Build

## Scope
- Change: Add a summary row showing PMS CC total vs Terminal Batch total (their difference) in the reconciliation table
- Non-goals: Changing the existing POS/drawer/PMS/terminal rows

## Execution Contract
- Affects: `apps/reception/src/components/till/ReconciliationWorkbench.tsx`
- Acceptance checks:
  - New row "PMS vs Terminal" shows PMS CC total, Terminal total, and their delta
  - Delta styled green when zero, red otherwise
  - TypeScript passes
- Validation commands:
  - `pnpm --filter @apps/reception typecheck`

## Outcome Contract
- **Why:** The workbench showed PMS CC vs POS CC and Terminal vs POS CC separately but never the direct PMS CC vs Terminal comparison, which is the primary card payment reconciliation check.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Staff can directly see whether PMS card payments match the terminal batch total.
- **Source:** operator
