---
Type: Plan
Status: Archived
Domain: PRODUCTS
Workstream: XA
Created: 2026-03-04
Last-reviewed: 2026-03-04
Last-updated: 2026-03-04T2
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-b-design-polish
Deliverable-Type: frontend-ui-enhancement
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: frontend-design, tools-ui-contrast-sweep
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# xa-b Design Polish Plan

## Summary

Unify empty state styling across the xa-b storefront (product listing, cart, wishlist, designers) and align cart meta text with the established `xa-pdp-meta` class. Investigation reduced original scope from 4 gaps to 2 — New In badges and department landing pages were already implemented. Single IMPLEMENT task touching 4 files with clear patterns and an available design-system component.

## Active tasks
- [x] TASK-01: Unify empty states and align cart styling — Complete (2026-03-04)

## Goals
- Consistent empty state appearance across all xa-b pages using the design-system `EmptyState` component with xa-b achromatic overrides.
- Cart meta text uses `xa-pdp-meta` class for consistency with XaBuyBox and PDP.

## Non-goals
- New In badge (already implemented)
- Department landing redesign (already functional with image cards)
- New test files for empty states (visual verification via contrast sweep sufficient for S-effort visual polish)

## Constraints & Assumptions
- Constraints:
  - All changes within `apps/xa-b/` scope.
  - Must use xa-b achromatic design language (monochrome, sharp corners, wide letter-spacing).
  - Static export — no SSR, no route handlers.
- Assumptions:
  - EmptyState component's `className` prop allows full style override (verified: `cn()` merges passed className).
  - Existing i18n keys for empty state messages can be reused.

## Inherited Outcome Contract

- **Why:** A design audit identified visual inconsistency in empty states (3 different styling patterns) and minor cart styling drift from the established `xa-pdp-*` class system. These weaken the cohesive brand experience.
- **Intended Outcome Type:** UI polish
- **Intended Outcome Statement:** Empty states use a unified pattern with consistent borders, spacing, typography, and CTAs. Cart meta text uses `xa-pdp-meta` class.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/xa-b-design-polish/fact-find.md`
- Key findings used:
  - 4 empty state locations with 3 different styling patterns (fact-find Patterns table)
  - EmptyState component available at `packages/design-system/src/atoms/EmptyState.tsx` with `className`, `icon`, `title`, `description`, `action` props
  - Cart uses raw `text-xs text-muted-foreground` instead of `xa-pdp-meta` for meta text
  - Gap 2 (department landing) and Gap 3 (New In badges) were already resolved

## Proposed Approach
- Option A: Use the design-system `EmptyState` component directly with className overrides for xa-b styling.
- Option B: Create an xa-b-specific empty state wrapper component.
- Chosen approach: **Option A** — direct usage with className overrides is simpler, avoids a new component, and the EmptyState already accepts all needed props. The xa-b styling (border, radius, uppercase heading) can be applied via className and child element styling within the `action` slot.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Unify empty states and align cart styling | 85% | S | Complete (2026-03-04) | - | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Single task, no parallelism needed |

## Tasks

### TASK-01: Unify empty states and align cart styling
- **Type:** IMPLEMENT
- **Deliverable:** Code changes across 4 files in `apps/xa-b/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-04)
- **Affects:** `apps/xa-b/src/components/XaProductListing.client.tsx`, `apps/xa-b/src/app/cart/page.tsx`, `apps/xa-b/src/app/wishlist/page.tsx`, `apps/xa-b/src/app/designers/page.tsx`, `[readonly] packages/design-system/src/atoms/EmptyState.tsx`, `[readonly] apps/xa-b/src/app/xa-cyber-atelier.css`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% - All 4 target files identified with specific line numbers. EmptyState component verified (accepts className, icon, title, description, action). Styling patterns documented in fact-find.
  - Approach: 95% - Straightforward: import EmptyState, replace inline markup, apply xa-b classes. No architectural decisions.
  - Impact: 85% - High confidence the change achieves visual consistency. Empty states are infrequent user paths but will be visually cohesive when encountered.
- **Acceptance:**
  - [ ] All 4 empty state locations use a consistent visual pattern: centered layout, `rounded-sm` border, `border-border-1`, uppercase heading text with wide letter-spacing, muted description, and a CTA (button or link).
  - [ ] Cart meta text (size/price on cart line items) uses `xa-pdp-meta text-muted-foreground` instead of raw `text-xs text-muted-foreground`.
  - [ ] No new TypeScript errors introduced (`pnpm typecheck` passes for xa-b).
  - [ ] No new lint errors.
  - **Expected user-observable behavior:**
    - [ ] Empty cart page shows a bordered card with "Your cart is empty" heading and "Continue shopping" CTA.
    - [ ] Empty wishlist page shows a bordered card with "Your wishlist is empty" heading and "Discover new arrivals" CTA.
    - [ ] Product listing with no filter matches shows a bordered card with "No matches" heading and "Clear filters" button.
    - [ ] Designers page with no search results shows a bordered card with "No designers found" heading and descriptive text.
    - [ ] Cart line item size and price text renders at consistent size with PDP meta text.
- **Validation contract (TC-01):**
  - TC-01: Empty cart state → renders bordered card with heading, description, and CTA link to `/collections/all`
  - TC-02: Empty wishlist state → renders bordered card with heading, description, and CTA link to `/new-in`
  - TC-03: Product listing with zero filter matches → renders bordered card with heading, description, and "Clear filters" button
  - TC-04: Designers search with no results → renders bordered card with heading and description
  - TC-05: Cart line items → size/price meta text uses `xa-pdp-meta` class
  - TC-06: `pnpm typecheck` passes for xa-b app
- **Execution plan:**
  1. Import `EmptyState` from `@acme/design-system/atoms` in each of the 4 files.
  2. Replace inline empty state markup in `XaProductListing.client.tsx` (lines 148-160) with `EmptyState` using: `className="rounded-sm border border-border-1"`, `title` with xa-b uppercase styling, `description` from existing i18n key, `action` slot with the existing "Clear filters" button.
  3. Replace inline empty state markup in `cart/page.tsx` (lines 74-85) with `EmptyState` using: same className pattern, title from existing i18n key, `action` slot with "Continue shopping" link.
  4. Replace inline empty state markup in `wishlist/page.tsx` (lines 118-130) with `EmptyState` using: same className pattern, title from existing i18n key, `action` slot with "Discover new arrivals" link.
  5. Replace inline empty state markup in `designers/page.tsx` (lines 88-93) with `EmptyState` using: same className pattern, `rounded-sm` (not `rounded-lg`), title and description from existing i18n keys.
  6. In `cart/page.tsx`, change cart line item meta text classes from `text-xs text-muted-foreground` to `xa-pdp-meta text-muted-foreground` (lines 126-136).
  7. Run `pnpm typecheck` to verify no type errors.
- **Scouts:** None: S-effort with well-understood patterns.
- **Edge Cases & Hardening:**
  - EmptyState title element is `<h3>` — verify this doesn't conflict with page-level heading hierarchy. For product listing (inside a section with no h2/h3), this is acceptable. For cart/wishlist/designers (where h1 exists), h3 is appropriate.
  - The `action` prop accepts `React.ReactNode` — existing Button and Link elements pass through without issues.
  - i18n: Existing keys reused. No new keys needed since messaging stays the same.
- **What would make this >=90%:**
  - Verified via running dev server and visually confirming all 4 empty states render identically.
- **Rollout / rollback:**
  - Rollout: Static export rebuild, deploy to Cloudflare Pages.
  - Rollback: Revert commit — purely visual change, no data impact.
- **Documentation impact:** None.
- **Build Evidence (2026-03-04):**
  - All 4 empty states now use `EmptyState` from `@acme/design-system/atoms` with consistent `className="rounded-sm border border-border-1 [&_h3]:text-xs [&_h3]:uppercase [&_h3]:tracking-wide [&_h3]:text-muted-foreground"`.
  - Cart meta text changed from `text-xs text-muted-foreground` to `xa-pdp-meta text-muted-foreground` for size and price fields.
  - TC-06: `pnpm --filter xa-b typecheck` — PASS (0 errors).
  - Lint: PASS (0 new warnings; 36 pre-existing warnings unchanged).
  - Adaptation note: EmptyState `title` prop is `string` (not ReactNode), so xa-b uppercase heading style applied via `[&_h3]:` Tailwind arbitrary variant selectors on the parent className. This overrides the component's default `text-lg font-semibold` with xa-b's `text-xs uppercase tracking-wide`. Specificity: descendant selector beats direct class.
- **Notes / references:**
  - EmptyState component: `packages/design-system/src/atoms/EmptyState.tsx` — uses `cn()` for className merging (line 30-31)
  - xa-b heading pattern for labels: `text-xs font-semibold uppercase tracking-wide` (matches existing cart/wishlist headings)
  - Product listing currently has `py-16` while cart/wishlist have `py-12` — unify to `py-12` via EmptyState default

## Risks & Mitigations
| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| 1 | EmptyState `<h3>` title conflicts with heading hierarchy | Low | Low | Verified: h3 is appropriate under h1 on all 4 pages |
| 2 | `xa-pdp-meta` font-size (0.82rem) vs `text-xs` (0.75rem) causes layout shift in cart table | Low | Low | 0.07rem difference is sub-pixel; table cells are flexible |

## Observability
None: visual polish, no runtime metrics or logging needed.

## Acceptance Criteria (overall)
- [ ] All 4 empty states visually consistent (same border, radius, typography pattern)
- [ ] Cart meta text uses `xa-pdp-meta` class
- [ ] TypeScript and lint pass
- [ ] No regression in existing functionality

## Decision Log
- 2026-03-04: Merged TASK-02 (cart meta text) into TASK-01 to avoid file conflict on `cart/page.tsx`. Both changes are S-effort and touch the same file.
- 2026-03-04: Chose EmptyState component direct usage over xa-b wrapper (simpler, no new component file).

## Overall-confidence Calculation
- TASK-01: S=1, confidence=85%
- Overall = (85 * 1) / 1 = 85%

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Unify empty states and align cart styling | Yes — all 4 target files exist, EmptyState component available and exported, className prop verified, i18n keys exist | None | No |

## Section Omission Rule

Sections not relevant to this plan have been omitted or marked `None`.
