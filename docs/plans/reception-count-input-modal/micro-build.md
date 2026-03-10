---
Type: Micro-Build
Status: Active
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: reception-count-input-modal
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260309143500-0001
Related-Plan: none
---

# CountInputModal Extraction Micro-Build

## Scope
- Change: Extract shared `CountInputModal` component from `AddKeycardsModal` and `ReturnKeycardsModal`. Both components are 95%+ identical — only title and submit label differ. New component lives at `apps/reception/src/components/till/CountInputModal.tsx`. Both originals become thin wrappers.
- Non-goals: changing caller interfaces, changing visual design, changing validation logic.

## Execution Contract
- Affects:
  - `apps/reception/src/components/till/CountInputModal.tsx` (new)
  - `apps/reception/src/components/till/AddKeycardsModal.tsx`
  - `apps/reception/src/components/till/ReturnKeycardsModal.tsx`
- Acceptance checks:
  - TypeScript compiles with no errors on affected files
  - External props interface of AddKeycardsModal/ReturnKeycardsModal unchanged
  - Lint passes
- Validation commands:
  - `pnpm --filter @apps/reception typecheck`
  - `pnpm --filter @apps/reception lint`
- Rollback note: Revert the three file edits.

## Outcome Contract
- **Why:** Duplicate modal code creates maintenance burden — any pattern change must be applied to two identical files.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Single CountInputModal component replaces both AddKeycardsModal and ReturnKeycardsModal copy-paste pair.
- **Source:** auto
