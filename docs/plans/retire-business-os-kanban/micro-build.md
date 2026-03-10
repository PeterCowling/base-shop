---
Type: Micro-Build
Status: Active
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: retire-business-os-kanban
Execution-Track: mixed
Deliverable-Type: multi-deliverable
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-202603091730-RETIRE-KANBAN
Related-Plan: none
---

# Retire Business OS Kanban Micro-Build

## Scope
- Change:
  - Reframe `apps/business-os` from a kanban-first product to a workflow-first console.
  - Mark board/card entrypoints as legacy compatibility surfaces in primary UI copy and repo docs.
  - Shift top-level navigation and landing copy toward ideas, plans, and workflows.
- Non-goals:
  - Removing board/card routes or D1 schema.
  - Migrating existing card data.
  - Redesigning startup-loop mechanics.

## Execution Contract
- Affects:
  - `apps/business-os/src/app/page.tsx`
  - `apps/business-os/src/components/navigation/NavigationHeader.tsx`
  - `apps/business-os/src/app/ideas/page.tsx`
  - `apps/business-os/src/app/ideas/new/page.tsx`
  - `apps/business-os/src/app/cards/new/page.tsx`
  - `apps/business-os/src/components/my-work/MyWorkView.tsx`
  - `apps/business-os/src/lib/business-catalog.ts`
  - `apps/business-os/README.md`
- Acceptance checks:
  - Top-level app framing no longer presents kanban boards as the main future-facing product surface.
  - Board links that remain are explicitly labeled legacy.
  - README describes Business OS as workflow-first and demotes boards/cards to compatibility status.
- Validation commands:
  - `pnpm --filter @apps/business-os typecheck`
  - `pnpm --filter @apps/business-os lint`
- Rollback note:
  - Revert the above files if the product should remain board-first.

## Outcome Contract
- **Why:** Retire the kanban system as the intended operating model and align the product around startup-loop and self-improvement workflows.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Business OS entrypoints and documentation describe a workflow-first operating console, with board/card flows retained only as legacy compatibility surfaces.
- **Source:** operator
