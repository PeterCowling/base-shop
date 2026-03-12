---
Type: Micro-Build
Status: Complete
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: xa-uploader-accessibility-ux
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260312150000-C010
Related-Plan: none
---

# XA-Uploader Accessibility & UX Fixes Micro-Build

## Scope
- Change: Add i18n keys for image alt text (en/zh), add ARIA attributes and keyboard navigation to filter dropdown (aria-haspopup, aria-expanded, role=listbox/option, Escape key), add peerBusyRef to coordinate save/publish buttons, fix ThemeToggle to use lazy initializer for correct initial theme
- Non-goals: Full WCAG audit, design system component extraction, comprehensive keyboard navigation

## Execution Contract
- Affects:
  - `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx`
  - `apps/xa-uploader/src/components/catalog/EditProductFilterSelector.client.tsx`
  - `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx`
  - `apps/xa-uploader/src/components/ThemeToggle.client.tsx`
  - `apps/xa-uploader/src/lib/uploaderI18n.ts`
- Acceptance checks:
  - Image alt text uses i18n keys with title interpolation
  - Filter dropdown has aria-haspopup, aria-expanded, role=listbox, role=option, aria-selected
  - Escape key closes dropdown
  - Save and publish buttons are mutually exclusive via peerBusyRef
  - ThemeToggle reads initial theme synchronously (no flash)
- Validation commands:
  - `pnpm --filter @apps/xa-uploader typecheck`
  - `pnpm --filter @apps/xa-uploader lint`
- Rollback note: Pure additive a11y and UX — revert commit reverts all changes

## Outcome Contract
- **Why:** Staff using screen readers or keyboard navigation cannot properly use the filter dropdown, image descriptions are stuck in English, save/publish can be clicked simultaneously causing confusion, and theme flashes on every page load
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Filter dropdown has full ARIA attributes and keyboard navigation; image alt text uses i18n keys for en/zh; save/publish buttons mutually exclusive; ThemeToggle initializes correctly
- **Source:** operator
