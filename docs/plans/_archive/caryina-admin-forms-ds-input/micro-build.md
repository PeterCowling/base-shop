---
Type: Micro-Build
Status: Archived
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: caryina-admin-forms-ds-input
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260313163000-0002
Related-Plan: none
---

# Caryina Admin Forms DS Input Micro-Build

## Scope
- Change: Replace raw `<input>` elements (text, number, url types) in `ProductForm.client.tsx` and `InventoryEditor.client.tsx` with `<Input />` from `@acme/ui/components/atoms/shadcn`. The checkbox (`type="checkbox"`) stays as raw `<input>` — it is a separate primitive not covered by the DS Input component.
- Non-goals: Changing form logic, validation, submit handling, `<select>` elements, `<textarea>`, or any other component.

## Execution Contract
- Affects:
  - `apps/caryina/src/components/admin/ProductForm.client.tsx`
  - `apps/caryina/src/components/admin/InventoryEditor.client.tsx`
- Acceptance checks:
  1. No raw `<input type="text|number|url"` elements remain in the two files
  2. `Input` is imported from `@acme/ui/components/atoms/shadcn`
  3. TypeScript compiles without errors for caryina
- Validation commands:
  - `pnpm --filter @apps/caryina typecheck`
- Rollback note: Revert both component files. No schema or data changes.

## Outcome Contract
- **Why:** Admin product and inventory forms used basic browser input fields built from scratch. The shared design system has a polished Input component that handles focus, error, and disabled states consistently. Using it means admin forms align with the rest of the platform automatically.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** ProductForm and InventoryEditor use the shared Input component from @acme/ui, with styling and behaviour consistent with the rest of the platform.
- **Source:** operator
