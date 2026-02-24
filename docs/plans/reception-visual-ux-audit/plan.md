---
Type: Plan
Status: Draft
Domain: UI
Workstream: Engineering
Created: 2026-02-24
Last-reviewed: 2026-02-24
Last-updated: 2026-02-24
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-visual-ux-audit
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-design-spec, lp-design-qa
Overall-confidence: 75%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort (S=1,M=2,L=3)
Auto-Build-Intent: plan-only
Business-OS-Integration: on
Business-Unit: BRIK
Card-ID: none
---

# Reception Visual/UX Audit Remediation Plan

## Summary

Following a comprehensive visual/UX audit of ~80 reception app components, this plan addresses 15 defects across 4 critical, 4 high, and 7 medium priority items. The work is organized into 9 implementation tasks (including 1 INVESTIGATE) plus 1 checkpoint across 3 waves. Wave 1 (5 parallel tasks) fixes all critical and high-priority visual defects: undefined shade colour tokens, dark mode modal backdrops (~20 files), Tailwind-purged dynamic classes, raw colour escapes (~20 files), and component-level layout fixes. A checkpoint gates Wave 3, which handles modal unification (preceded by an audit INVESTIGATE), touch targets, and consistency polish. All tasks are CSS/component-level changes with instant git-revert rollback.

## Active tasks

- [x] TASK-01: Define 11 shade colour token families
- [x] TASK-02: Fix dark mode backdrops (~20 files)
- [x] TASK-03: Fix dynamic CSS class interpolation in CloseShiftForm
- [x] TASK-04: Replace raw Tailwind colour scales (~20 files)
- [x] TASK-05: Fix layout and component issues (5 files)
- [x] TASK-06: CHECKPOINT — Verify critical+high fixes
- [x] TASK-07a: INVESTIGATE — Audit custom modals for SimpleModal migration
- [x] TASK-07b: Unify custom modals to DS SimpleModal
- [x] TASK-08: Touch targets, active states, and UX polish
- [x] TASK-09: Border radius and table styling consistency

## Goals

- Fix all critical visual defects (broken colours, dark mode failures, Tailwind purge issues)
- Eliminate remaining raw Tailwind colours escaping the semantic token system
- Improve touch target sizes and interaction patterns for tablet/touchscreen use
- Achieve consistent border radius, spacing, and typography across all screens
- Unify modal implementation to single DS-backed pattern

## Non-goals

- Redesigning information architecture or navigation structure
- Adding new features or screens
- Changing business logic or data flows
- Mobile-first responsive redesign

## Constraints & Assumptions

- Constraints:
  - All colours via `hsl(var(--token))` — no raw hex, no raw Tailwind colour classes
  - New tokens registered in 3 places: `tokens.ts` → `tokens.css` → `globals.css @theme` block
  - Must preserve all `onClick`, `disabled`, `aria-*`, `type`, `data-*` attributes
  - Snapshot updates acceptable; no new test files required
- Assumptions:
  - Dark mode is the primary mode for night-shift staff
  - Bar/POS screens used on tablets — touch targets must be ≥44px
  - Shade colour palette: warm muted pastels matching family names (default assumption from fact-find)

## Fact-Find Reference

- Related brief: `docs/plans/reception-visual-ux-audit/fact-find.md`
- Key findings used:
  - 11 shade colour families (pinkShades through grayishShades) undefined in theme tokens — bar POS is monochrome
  - 20 files use `bg-foreground` backdrop/overlay that inverts in dark mode (verified via grep)
  - 5 dynamic template literal class constructions in CloseShiftForm purged by Tailwind
  - 20 files contain raw Tailwind numbered colour scales (`primary-600`, `red-700`, `gray-300`, `blue-500`, etc.) (verified via grep)
  - 17 files use custom `fixed inset-0` modal pattern — only SimpleModal has focus trapping

## Task Seed Mapping

| Fact-Find Seed | Plan Task | Notes |
|---|---|---|
| #1 Shade colour tokens | TASK-01 | |
| #2 Dark mode modal backdrops | TASK-02 | Expanded from 15 to 20 files |
| #3 Dynamic CSS classes | TASK-03 | |
| #4 Hardcoded text-primary-600 | TASK-04 | Merged with seed #6 |
| #5 Unify modals to SimpleModal | TASK-07a + TASK-07b | Split into INVESTIGATE + IMPLEMENT |
| #6 Raw Tailwind colours | TASK-04 | Expanded from 7 to 20 files |
| #7 Nav backdrop dark mode | TASK-02 | AppNav.tsx included in backdrop fix |
| #8 Login.tsx button | TASK-05 | |
| #9 Touch targets | TASK-08 | |
| #10 Remove side borders | TASK-05 | |
| #11 Border radius | TASK-09 | |
| #12 PageShell heading | TASK-05 | |
| #13 FormActionButtons cancel | TASK-05 | |
| #14 SalesScreen active state | TASK-08 | |
| #15 Table styling | TASK-09 | |

## Proposed Approach

- Option A: Fix all issues in one large PR — risky, hard to review
- Option B: Phased waves with checkpoint — enables incremental verification
- Chosen approach: Option B — Wave 1 fixes critical/high items in parallel, checkpoint verifies dark mode end-to-end, Wave 3 handles medium items

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No (plan-only mode)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Define 11 shade colour token families | 75% | M | Pending | - | TASK-06 |
| TASK-02 | IMPLEMENT | Fix dark mode backdrops (~20 files) | 85% | M | Pending | - | TASK-06 |
| TASK-03 | IMPLEMENT | Fix dynamic CSS class interpolation | 80% | S | Pending | - | TASK-06 |
| TASK-04 | IMPLEMENT | Replace raw Tailwind colour scales (~20 files) | 70% | M | Pending | - | TASK-06 |
| TASK-05 | IMPLEMENT | Fix layout and component issues | 80% | S | Pending | - | TASK-06 |
| TASK-06 | CHECKPOINT | Verify critical+high fixes | 95% | S | Pending | TASK-01..05 | TASK-07a..09 |
| TASK-07a | INVESTIGATE | Audit custom modals for SimpleModal migration | 85% | S | Pending | TASK-06 | TASK-07b |
| TASK-07b | IMPLEMENT | Unify custom modals to DS SimpleModal | 65% | L | Pending | TASK-07a | - |
| TASK-08 | IMPLEMENT | Touch targets, active states, UX polish | 75% | S | Pending | TASK-06 | - |
| TASK-09 | IMPLEMENT | Border radius and table styling consistency | 70% | S | Pending | TASK-06 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03, TASK-04, TASK-05 | - | All independent, can run in parallel worktrees |
| 2 | TASK-06 | Wave 1 complete | Checkpoint: run tests, typecheck, visual verify; scope TASK-08/09 |
| 3 | TASK-07a, TASK-08, TASK-09 | TASK-06 | 07a + 08 + 09 parallel; 07b follows 07a serially |

## Tasks

### TASK-01: Define 11 shade colour token families

- **Type:** IMPLEMENT
- **Deliverable:** code-change — shade colour tokens in theme + registration
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/themes/reception/src/tokens.ts`, `packages/themes/reception/tokens.css`, `apps/reception/src/app/globals.css`
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 75%
  - Implementation: 85% — Token pipeline proven in Phase 1 overhaul; 11 families enumerated in CategoryHeader.tsx:26-100; row structure (row1-row5) documented in useProducts.ts:64-117
  - Approach: 75% — Colour palette choice has safe default (warm muted pastels matching family names) but no brand guide to validate against; design iteration may be needed
  - Impact: 85% — Fixes most visible defect: entire bar POS grid is monochrome gray
- **Acceptance:**
  - All 11 shade families defined with HSL values: pinkShades, coffeeShades, beerShades, wineShades, teaShades, greenShades, blueShades, purpleShades, spritzShades, orangeShades, grayishShades
  - Each family has rows 1-5 with progressive intensity
  - Light and dark mode variants provided
  - Tokens registered in tokens.ts, tokens.css, and globals.css @theme block
  - ProductGrid renders products with category-specific background colours
  - CategoryHeader renders with matching category background colours
- **Validation contract (TC-01):**
  - TC-01: `grep -r "Shades-row" apps/reception/src` returns only files that consume tokens (useProducts.ts, CategoryHeader.tsx) → all shade references resolve to defined tokens
  - TC-02: ProductGrid.tsx `product.bgColor` values from useProducts.ts resolve to visible background colours in browser (not transparent/fallback)
  - TC-03: Dark mode toggle → shade colours adapt (muted dark variants, not washed out)
  - TC-04: `pnpm --filter reception test` passes (snapshot updates acceptable)
- **Execution plan:** Red → Green → Refactor
  - Red: Verify shade classes produce no visual output currently (transparent backgrounds)
  - Green: Add HSL values to tokens.ts for all 11 families × 5 rows; generate tokens.css; register in globals.css @theme block; verify bar POS renders coloured grid
  - Refactor: Ensure dark mode variants use muted/desaturated versions; verify contrast ratios
- **Planning validation (required for M):**
  - Checks run: Read CategoryHeader.tsx CATEGORY_STYLES (14 categories across 11 shade families); read useProducts.ts shade assignments; read tokens.ts structure; read globals.css @theme block
  - Validation artifacts: CategoryHeader.tsx:26-100 defines exact shade family + row usage per category
  - Unexpected findings: orangeShades uses all 5 rows (Juices/Smoothies/Soda share); pinkShades uses 4 rows; most families only use rows 1-2
- **Scouts:** Verify no other files reference shade tokens beyond useProducts.ts and CategoryHeader.tsx
- **Edge Cases & Hardening:**
  - Categories not in CATEGORY_STYLES map fall through to default styles (already handled in CategoryHeader fallback logic)
  - Products without bgColor fall back to `bg-surface-2` (already handled in ProductGrid.tsx:35)
- **What would make this >=90%:**
  - Brand-approved colour palette for each shade family
  - Visual regression screenshot comparison before/after
- **Rollout / rollback:**
  - Rollout: CSS-only change, instant on deploy
  - Rollback: git revert — tokens removed, grid returns to monochrome
- **Documentation impact:** None
- **Notes / references:**
  - Shade families: pink (Sweet/Gelato), coffee (Coffee), tea (Tea), beer (Beer), wine (Wine), spritz (Spritz), blue (Mixed Drinks), purple (Cocktails), orange (Juices/Smoothies/Soda), green (Savory), grayish (Other)

---

### TASK-02: Fix dark mode backdrops (~20 files)

- **Type:** IMPLEMENT
- **Deliverable:** code-change — replace `bg-foreground` overlay/backdrop classes with appropriate alternatives
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - Modal/overlay backdrops (replace with `bg-black/50`): `apps/reception/src/hoc/withIconModal.tsx`, `apps/reception/src/components/appNav/AppNav.tsx`, `apps/reception/src/components/till/VoidTransactionModal.tsx`, `apps/reception/src/components/bar/orderTaking/preorder/PreorderButtons.tsx`, `apps/reception/src/components/safe/PettyCashForm.tsx`, `apps/reception/src/components/checkins/header/ArchiveConfirmationModal.tsx`, `apps/reception/src/components/checkins/header/DeleteConfirmationModal.tsx`, `apps/reception/src/components/prepayments/DisplayDialogue.tsx`, `apps/reception/src/components/roomgrid/BookingDetailsModal.tsx`, `apps/reception/src/components/prepayments/EntryDialogue.tsx`, `apps/reception/src/components/prepayments/DeleteBookingModal.tsx`, `apps/reception/src/components/loans/KeycardsModal.tsx`, `apps/reception/src/components/loans/LoanModal.tsx`, `apps/reception/src/components/till/EditTransactionModal.tsx`, `apps/reception/src/components/bar/ModalPreorderDetails.tsx`, `apps/reception/src/components/checkins/header/BookingModal.tsx`, `apps/reception/src/components/checkins/notes/BookingNotesModal.tsx`
  - Non-modal uses (need individual analysis): `apps/reception/src/components/bar/orderTaking/ProductGrid.tsx` (price badge overlay), `apps/reception/src/components/roomgrid/_BookingTooltip.tsx` (tooltip bg), `apps/reception/src/components/checkins/tooltip/CustomTooltip.tsx` (tooltip bg)
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 90% — 17 modal/overlay files need simple `bg-foreground` → `bg-black/50` replacement; 3 non-modal files need individual analysis (tooltip/badge overlays may need `bg-surface` instead)
  - Approach: 90% — `bg-black/50` is the standard dark overlay pattern; semantically correct in both light and dark mode
  - Impact: 85% — Fixes dark mode overlay across all modals; currently white/light overlay instead of darkening
- **Acceptance:**
  - Zero instances of `bg-foreground.*opacity` or `bg-foreground/` used as backdrop/overlay in reception app
  - All modal overlays render as semi-transparent dark overlay in both light and dark mode
  - Non-modal uses (tooltips, price badges) render with appropriate background in both modes
  - All modal content remains readable above the overlay
- **Validation contract (TC-02):**
  - TC-01: `grep -rn "bg-foreground.*opacity\|bg-foreground/" apps/reception/src` returns 0 matches
  - TC-02: Open any modal in dark mode → overlay is dark semi-transparent (not white/bright)
  - TC-03: Open any modal in light mode → overlay is dark semi-transparent (consistent)
  - TC-04: All `onClick`, `onClose`, form submit handlers still function correctly
  - TC-05: Tooltip overlays render readably in both modes
  - TC-06: `pnpm --filter reception test` passes
- **Execution plan:** Red → Green → Refactor
  - Red: Open a modal in dark mode (e.g., ArchiveConfirmationModal) → observe bright/white overlay
  - Green: (a) Replace `bg-foreground bg-opacity-50` with `bg-black/50` in legacy syntax files; (b) Replace `bg-foreground/50` with `bg-black/50` in modern syntax files; (c) For non-modal uses: replace `bg-foreground/50` in ProductGrid price badge with `bg-black/50`; replace `bg-foreground/75` in tooltips with `bg-surface` or `bg-surface-3`; verify in both modes
  - Refactor: Remove redundant `bg-opacity-50` classes where `bg-black/50` already includes opacity
- **Planning validation (required for M):**
  - Checks run: `grep -rn "bg-foreground.*opacity\|bg-foreground/" apps/reception/src` → 20 files verified
  - Validation artifacts: withIconModal.tsx:34 uses `bg-foreground/50`; ArchiveConfirmationModal.tsx:43 uses `bg-foreground bg-opacity-50`; ProductGrid.tsx uses `bg-foreground/50` for price badge (non-modal)
  - Unexpected findings: 3 non-modal uses (ProductGrid, _BookingTooltip, CustomTooltip) need different replacement than `bg-black/50`; ModalPreorderDetails is at `bar/ModalPreorderDetails.tsx` not `bar/orderTaking/modal/`
- **Scouts:** Check whether tooltip `bg-foreground/75` is intentionally high-contrast or a bug
- **Edge Cases & Hardening:**
  - AppNav.tsx backdrop is for mobile nav overlay, not a modal — same `bg-black/50` fix applies
  - ProductGrid price badge overlay: `bg-black/50` may be too dark — consider `bg-black/30` or `bg-surface-3/80`
  - Tooltips at `bg-foreground/75` are very opaque — `bg-surface-3` gives better dark mode behaviour
- **What would make this >=90%:**
  - Introduce a semantic `--color-overlay` token instead of hardcoded `bg-black/50`
- **Rollout / rollback:**
  - Rollout: CSS-only class change, instant on deploy
  - Rollback: git revert
- **Documentation impact:** None

---

### TASK-03: Fix dynamic CSS class interpolation in CloseShiftForm

- **Type:** IMPLEMENT
- **Deliverable:** code-change — replace template literal class construction with static class map
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/till/CloseShiftForm.tsx`
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 80%
  - Implementation: 85% — 5 interpolation sites at lines 227, 234, 235, 255, 319; class map pattern is standard
  - Approach: 90% — Static class map eliminates Tailwind purge risk entirely
  - Impact: 80% — Held-back test: would the reconciliation step being invisible in production drop this below 80? No — the fix is straightforward and the risk is contained to one file. No single unknown drops below 80.
- **Acceptance:**
  - Zero template literal Tailwind class constructions in CloseShiftForm.tsx
  - Reconciliation step renders with correct warning/error colours in both modes
- **Validation contract (TC-03):**
  - TC-01: `grep -n '${.*?}.*-main' apps/reception/src/components/till/CloseShiftForm.tsx` returns 0 matches
  - TC-02: `isReconcile=true` renders warning-coloured border/bg/text
  - TC-03: `isReconcile=false` renders error-coloured border/bg/text
  - TC-04: `pnpm --filter reception test` passes
- **Execution plan:** Red → Green → Refactor
  - Red: Inspect production build CSS — dynamic classes are absent from output
  - Green: Create `const STEP_STYLES = { reconcile: { bg: "bg-warning-main", border: "border-warning-main", text: "text-warning-main" }, error: { bg: "bg-error-main", border: "border-error-main", text: "text-error-main" } }` map; replace all 5 interpolation sites with `STEP_STYLES[isReconcile ? "reconcile" : "error"]` lookups
  - Refactor: Extract duplicated close-button class string (lines 227, 319 are identical) into a shared constant
- **Planning validation:** `None: S-effort task with clear scope`
- **Scouts:** `None: single file, all 5 sites identified`
- **Edge Cases & Hardening:**
  - Verify `text-primary-fg` (used alongside dynamic classes at lines 227, 319) is a valid token
- **What would make this >=90%:**
  - Verified in production build that static classes appear in CSS output
- **Rollout / rollback:**
  - Rollout: Component-level change, instant on deploy
  - Rollback: git revert
- **Documentation impact:** None

---

### TASK-04: Replace raw Tailwind colour scales (~20 files)

- **Type:** IMPLEMENT
- **Deliverable:** code-change — replace numbered colour scales with semantic tokens
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/components/appNav/CurrentPageIndicator.tsx`, `apps/reception/src/components/search/FilterBar.tsx`, `apps/reception/src/components/search/_FilterBar.tsx`, `apps/reception/src/components/search/SortableHeader.tsx`, `apps/reception/src/components/search/BulkActionsToolbar.tsx`, `apps/reception/src/components/search/CopyableBookingRef.tsx`, `apps/reception/src/components/search/ConfirmCancelModal.tsx`, `apps/reception/src/components/search/BookingSearchTable.tsx`, `apps/reception/src/components/search/FinancialTransactionSearch.tsx`, `apps/reception/src/components/search/FinancialTransactionAuditSearch.tsx`, `apps/reception/src/components/common/PinInput.tsx`, `apps/reception/src/components/common/PinLoginInline.tsx`, `apps/reception/src/components/till/CopyBookingRefPill.tsx`, `apps/reception/src/components/till/CopyOccupantIdPill.tsx`, `apps/reception/src/components/checkins/docInsert/AutoComplete.tsx`, `apps/reception/src/components/checkins/keycardButton/KeycardDepositMenu.tsx`, `apps/reception/src/components/checkins/header/DeleteConfirmationModal.tsx`, `apps/reception/src/components/checkins/header/DeleteButton.tsx`, `apps/reception/src/components/bar/orderTaking/preorder/PreorderButtons.tsx`, `apps/reception/src/components/loans/KeycardsModal.tsx`
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 70%
  - Implementation: 70% — 20 files verified via grep, but each file needs individual analysis to determine correct semantic token mapping; `primary-50`, `primary-500`, `red-200`, `red-300` also present beyond the originally identified set; M effort with incomplete per-file mapping caps at 75
  - Approach: 80% — Semantic token equivalents exist for all numbered scales; core mapping proven: `primary-600` → `primary-main`, `blue-500` → `ring`, `red-700` → `error-dark`. Held-back test: no single unknown drops below 80.
  - Impact: 80% — Held-back test: if some raw classes resolve to default Tailwind palette colours that look correct, replacement could change appearance. But the reception theme uses custom HSL tokens so numbered scales resolve to nothing/fallback. No single unknown drops below 80.
- **Acceptance:**
  - Zero numbered Tailwind colour scales in reception app (primary-NNN, red-NNN, gray-NNN, blue-NNN patterns)
  - All affected elements use semantic tokens that resolve correctly in both modes
- **Validation contract (TC-04):**
  - TC-01: `grep -rn "\b\(primary\|red\|gray\|blue\|green\|yellow\|orange\|purple\|pink\)-[0-9]\{2,3\}\b" apps/reception/src` returns 0 matches
  - TC-02: CurrentPageIndicator active label renders with primary colour
  - TC-03: FilterBar submit button renders with primary background
  - TC-04: PinInput focus state renders with primary highlight
  - TC-05: Financial transaction search inputs render with correct focus ring
  - TC-06: `pnpm --filter reception test` passes
- **Execution plan:** Red → Green → Refactor
  - Red: Verify `primary-600` produces no visible styling (falls through to default)
  - Green: Replace per mapping across all 20 files: `text-primary-600` → `text-primary-main`, `bg-primary-600` → `bg-primary-main`, `hover:bg-primary-700` → `hover:bg-primary-dark`, `focus:ring-primary-600` → `focus:ring-ring`, `primary-500` → `primary-main`, `primary-50` → `primary-light`, `hover:bg-red-700` → `hover:bg-error-dark`, `red-200` → `error-light`, `red-300` → `error-light`, `focus-visible:ring-blue-500` → `focus-visible:ring-ring`, `hover:bg-blue-700` → `hover:bg-info-dark`, `focus-visible:ring-gray-300` → `focus-visible:ring-border-2`
  - Refactor: Check if `_FilterBar.tsx` is still imported — if dead code, delete instead of fixing
- **Planning validation (required for M):**
  - Checks run: `grep -rn "primary-[0-9]\|red-[0-9]\|gray-[0-9]\|blue-[0-9]" apps/reception/src` → 20 files
  - Validation artifacts: Full file list from grep verified
  - Unexpected findings: 13 additional files beyond fact-find's 7 — includes FinancialTransactionSearch (8 instances), PinInput, PinLoginInline, CopyBookingRefPill, CopyOccupantIdPill, AutoComplete, KeycardDepositMenu, DeleteButton, BookingSearchTable, PreorderButtons, DeleteConfirmationModal, KeycardsModal
- **Scouts:** Check if `_FilterBar.tsx` is imported anywhere — if dead code, delete instead of fixing
- **Edge Cases & Hardening:**
  - `primary-50` (very light tint) may need `primary-light` or `primary-soft` depending on context
  - `red-200`/`red-300` (light red) maps to `error-light` — verify visual contrast
  - Some files may have intentional use of numbered scales for gradient/emphasis — verify each replacement
- **What would make this >=90%:**
  - Per-file replacement mapping verified and documented before execution
- **Rollout / rollback:**
  - Rollout: CSS class change, instant on deploy
  - Rollback: git revert
- **Documentation impact:** None

---

### TASK-05: Fix layout and component issues (4 files)

- **Type:** IMPLEMENT
- **Deliverable:** code-change — PageShell heading, AuthenticatedApp borders, FormActionButtons cancel, Login button
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/common/PageShell.tsx`, `apps/reception/src/components/AuthenticatedApp.tsx`, `apps/reception/src/components/common/FormActionButtons.tsx`, `apps/reception/src/app/Login.tsx`
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 80%
  - Implementation: 85% — All 4 files read and validated; changes are single-line edits
  - Approach: 85% — Each fix is straightforward: reduce heading size, remove thick borders, change cancel colour, remove conflicting className
  - Impact: 80% — Held-back test: removing the 4px border changes the visual container boundary. But the border uses `border-border-2` (a subtle semantic colour), so the 4px thickness is the issue, not the colour. Reducing to 1px or removing is safe. No single unknown drops below 80.
- **Acceptance:**
  - PageShell heading uses `text-2xl` or `text-3xl` (not `text-5xl`)
  - AuthenticatedApp uses `border border-border-2` (1px) or no side borders
  - FormActionButtons cancel defaults to `color="default"` tone `"outline"`
  - Login.tsx buttons use DS Button `color`/`tone` props without conflicting `className` overrides
- **Validation contract (TC-05):**
  - TC-01: PageShell h1 renders at reasonable operations-app size (not hero-banner size)
  - TC-02: AuthenticatedApp content area has subtle or no side border
  - TC-03: FormActionButtons cancel button renders as neutral/outline (not info/solid)
  - TC-04: Login page buttons render correctly with DS styling
  - TC-05: `pnpm --filter reception test` passes
- **Execution plan:** Red → Green → Refactor
  - Red: Verify current rendering: PageShell heading is oversized, borders are thick, cancel is blue info
  - Green: PageShell.tsx:28 `text-5xl` → `text-2xl`; AuthenticatedApp.tsx:25 `border-l-4 border-r-4` → `border-l border-r` (or remove); FormActionButtons.tsx:24 `cancelColor = "info"` → `cancelColor = "default"` + line 34 `tone="solid"` → `tone="outline"`; Login.tsx remove className colour overrides on Button components
  - Refactor: Verify no callers of FormActionButtons pass explicit `cancelColor="info"` that would break
- **Planning validation:** `None: S-effort task with clear scope`
- **Scouts:** Grep for `cancelColor=` usage across reception to check for explicit overrides
- **Edge Cases & Hardening:**
  - FormActionButtons has `cancelColor` prop — callers explicitly passing `"info"` would be unaffected by default change
- **What would make this >=90%:**
  - Visual comparison screenshots before/after
- **Rollout / rollback:**
  - Rollout: Component-level changes, instant on deploy
  - Rollback: git revert
- **Documentation impact:** None

---

### TASK-06: CHECKPOINT — Verify critical+high fixes

- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence via /lp-do-replan
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/reception-visual-ux-audit/plan.md`
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04, TASK-05
- **Blocks:** TASK-07a, TASK-08, TASK-09
- **Confidence:** 95%
  - Implementation: 95% — process is defined
  - Approach: 95% — prevents deep dead-end execution on medium-priority polish tasks
  - Impact: 95% — controls downstream risk; validates dark mode end-to-end before further work
- **Acceptance:**
  - `pnpm --filter reception test -- -u` passes (snapshot updates applied)
  - `pnpm typecheck` passes with no new errors in reception
  - Manual dark mode verification: bar POS grid has coloured categories, all modal overlays are dark
  - `grep -rn "bg-foreground.*opacity\|bg-foreground/" apps/reception/src` returns 0
  - `/lp-do-replan` run on TASK-07a, TASK-07b, TASK-08, TASK-09 with updated evidence
  - Detailed file list and scope established for TASK-08 and TASK-09 based on post-Wave-1 audit
- **Horizon assumptions to validate:**
  - Shade colour palette is visually acceptable (may trigger design iteration)
  - SimpleModal can replace all custom modal patterns (for TASK-07)
  - Touch target increases don't break bar POS layout (for TASK-08)
- **Validation contract:** All acceptance criteria above verified and documented
- **Planning validation:** Replan evidence from completed Wave 1 tasks
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** Plan updated with replan evidence for downstream tasks

---

### TASK-07a: INVESTIGATE — Audit custom modals for SimpleModal migration

- **Type:** INVESTIGATE
- **Deliverable:** Per-modal migration guide documenting props interface, state management, event handlers, and SimpleModal prop mapping for each of 17 custom modal files
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `[readonly]` all 17 files with `fixed inset-0` pattern (see TASK-07b for full list)
- **Depends on:** TASK-06
- **Blocks:** TASK-07b
- **Confidence:** 85%
  - Implementation: 85% — Read-only audit of 17 files; each modal's API surface is small (isOpen, onClose, optional onSubmit, content)
  - Approach: 90% — Structured audit template: for each modal, document (a) props, (b) internal state, (c) event handlers, (d) SimpleModal prop mapping, (e) migration complexity (S/M/L)
  - Impact: 85% — Directly unblocks TASK-07b with evidence-based confidence
- **Acceptance:**
  - Migration guide created at `docs/plans/reception-visual-ux-audit/task-07a-modal-audit.md`
  - All 17 custom modals documented with props, state, handlers, and SimpleModal mapping
  - Each modal classified as S/M/L migration complexity
  - `withIconModal.tsx` consumers enumerated
  - Recommendation on whether to migrate as batch or in sub-groups
- **Validation contract (TC-07a):**
  - TC-01: Guide covers all 17 files from `grep -rn "fixed inset-0" apps/reception/src`
  - TC-02: Each entry includes isOpen/onClose prop mapping to SimpleModal equivalents
  - TC-03: Form-containing modals flagged for `shouldCloseOnOverlayClick` handling
- **Execution plan:**
  - Read each of 17 custom modal files
  - Document props interface, state, event handlers
  - Map to SimpleModal API (isOpen, onClose, title, maxWidth, footer)
  - Flag edge cases: nested modals, complex sizing, form state preservation
  - Classify migration complexity and recommend execution grouping
- **Planning validation:** `None: S-effort investigation task`
- **Scouts:** `None: this task IS the scout for TASK-07b`
- **Edge Cases & Hardening:** `None: read-only investigation`
- **What would make this >=90%:** `None: already at 85%`
- **Rollout / rollback:** `None: investigation produces documentation only`
- **Documentation impact:** Creates `docs/plans/reception-visual-ux-audit/task-07a-modal-audit.md`

---

### TASK-07b: Unify custom modals to DS SimpleModal

- **Type:** IMPLEMENT
- **Deliverable:** code-change — migrate custom `fixed inset-0` modal wrappers to DS SimpleModal
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Pending
- **Affects:** `apps/reception/src/hoc/withIconModal.tsx`, `apps/reception/src/components/checkins/header/ArchiveConfirmationModal.tsx`, `apps/reception/src/components/checkins/header/DeleteConfirmationModal.tsx`, `apps/reception/src/components/checkins/header/BookingModal.tsx`, `apps/reception/src/components/checkins/notes/BookingNotesModal.tsx`, `apps/reception/src/components/prepayments/DisplayDialogue.tsx`, `apps/reception/src/components/roomgrid/BookingDetailsModal.tsx`, `apps/reception/src/components/prepayments/EntryDialogue.tsx`, `apps/reception/src/components/prepayments/DeleteBookingModal.tsx`, `apps/reception/src/components/loans/KeycardsModal.tsx`, `apps/reception/src/components/loans/LoanModal.tsx`, `apps/reception/src/components/till/EditTransactionModal.tsx`, `apps/reception/src/components/till/VoidTransactionModal.tsx`, `apps/reception/src/components/bar/ModalPreorderDetails.tsx`, `apps/reception/src/components/bar/orderTaking/preorder/PreorderButtons.tsx`, `apps/reception/src/components/safe/PettyCashForm.tsx`, `apps/reception/src/components/appNav/AppNav.tsx`
- **Depends on:** TASK-07a
- **Blocks:** -
- **Confidence:** 65%
  - Implementation: 65% — 17 custom modal implementations with varying complexity; confidence will be revised upward after TASK-07a audit provides per-modal migration mapping; M/L reasoning-only evidence caps at 75
  - Approach: 75% — SimpleModal is clearly the right target (Radix Dialog with focus trapping); per-modal migration path will be documented by TASK-07a
  - Impact: 80% — Improves accessibility (focus trapping, portal rendering) and consistency; held-back test: no single unknown drops below 80
- **Acceptance:**
  - All reception modals use DS SimpleModal (or Radix Dialog) for overlay/backdrop
  - `grep -rn "fixed inset-0" apps/reception/src` returns 0 matches
  - Focus trapping works on all modals (Tab key stays within modal)
  - Escape key closes each modal
  - All existing event handlers, form state, and close behaviours preserved
  - `withIconModal.tsx` HOC deprecated or migrated
- **Validation contract (TC-07b):**
  - TC-01: `grep -rn "fixed inset-0" apps/reception/src` returns 0 matches
  - TC-02: Tab focus stays within each modal when open
  - TC-03: Escape key closes each modal
  - TC-04: All form submission handlers still function
  - TC-05: `pnpm --filter reception test` passes
- **Execution plan:** Red → Green → Refactor
  - Red: Verify custom modals lack focus trapping (Tab key escapes modal)
  - Green: Per TASK-07a migration guide, wrap each modal's content in `<SimpleModal>` replacing the `fixed inset-0` wrapper; preserve all internal content and handlers; apply per-modal prop mapping
  - Refactor: Delete `withIconModal.tsx` HOC if all consumers migrated; unify modal sizing via SimpleModal `maxWidth` prop
- **Planning validation (required for L):**
  - Checks run: `grep -rn "fixed inset-0" apps/reception/src` → 17 files; AlertModal.tsx:13-57 confirmed as reference SimpleModal implementation
  - Validation artifacts: AlertModal.tsx shows canonical usage pattern
  - Unexpected findings: `ModalContainer.tsx` is a content container (not a backdrop) — excluded from migration scope
- **Consumer Tracing:** Deferred to TASK-07a audit output
- **Scouts:** Deferred to TASK-07a audit output
- **Edge Cases & Hardening:**
  - Modals with form inputs must prevent close on overlay click during editing
  - Nested modals need z-index management
  - `BookingDetailsModal` may have complex content needing larger `maxWidth`
  - `PreorderButtons.tsx` renders inline overlay — needs extraction to standalone modal component
- **What would make this >=90%:**
  - TASK-07a migration guide complete with per-modal prop mapping
  - Each modal tested individually with focus trapping verification
- **Rollout / rollback:**
  - Rollout: Component-level changes, instant on deploy
  - Rollback: git revert
- **Documentation impact:** None
- **Notes / references:**
  - May be broken into sub-tasks per modal group at replan based on TASK-07a complexity classifications

---

### TASK-08: Touch targets, active states, and UX polish

- **Type:** IMPLEMENT
- **Deliverable:** code-change — touch target sizes, SalesScreen filter active state
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/bar/orderTaking/OrderTakingScreen.tsx`, `apps/reception/src/components/bar/orderTaking/ProductGrid.tsx`, `apps/reception/src/components/bar/orderTaking/CategoryHeader.tsx`, `apps/reception/src/components/bar/orderTaking/PaymentSection.tsx`, `apps/reception/src/components/bar/sales/SalesScreen.tsx`
- **Depends on:** TASK-06
- **Blocks:** -
- **Confidence:** 75%
  - Implementation: 75% — Need to audit exact current touch target sizes across bar POS to determine specific changes; minimum 44px requirement is clear but implementation details depend on current sizing
  - Approach: 85% — Standard `min-h-11` (44px) / `min-w-11` Tailwind utility approach
  - Impact: 75% — Important for tablet use but no specific user complaints cited; improvement is preventive
- **Acceptance:**
  - All interactive elements in bar POS area meet 44px minimum touch target
  - SalesScreen filter buttons have clear active/selected state
- **Validation contract (TC-08):**
  - TC-01: Smallest interactive element in ProductGrid measures ≥44px in both dimensions
  - TC-02: SalesScreen active filter has distinct background/border treatment vs inactive
  - TC-03: `pnpm --filter reception test` passes
- **Execution plan:** Red → Green → Refactor
  - Red: Audit current touch target sizes with browser DevTools; identify elements below 44px
  - Green: Add `min-h-11` to undersized elements; add `data-active` or conditional class to SalesScreen filter buttons
  - Refactor: Ensure touch target increases don't break grid layout alignment
- **Planning validation:** `None: S-effort task; detailed sizing audit deferred to checkpoint`
- **Scouts:** `None: specific measurements deferred to post-checkpoint audit`
- **Edge Cases & Hardening:**
  - Increasing button sizes may cause text wrapping or grid overflow in ProductGrid
- **What would make this >=90%:**
  - Post-checkpoint sizing audit with specific px measurements for each element
- **Rollout / rollback:**
  - Rollout: CSS-only changes, instant on deploy
  - Rollback: git revert
- **Documentation impact:** None

---

### TASK-09: Border radius and table styling consistency

- **Type:** IMPLEMENT
- **Deliverable:** code-change — unified border radius and table styling across all screens
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** Multiple files across checkins, checkout, search, till, loans views (specific list determined at checkpoint)
- **Depends on:** TASK-06
- **Blocks:** -
- **Confidence:** 70%
  - Implementation: 70% — "Standardise table styling" and "Unify border radius" have broad scope; no specific target file list established; need audit of current patterns first
  - Approach: 80% — Semantic tokens exist for borders and backgrounds; `rounded-lg` for cards, `rounded-md` for inputs is standard DS pattern. Held-back test: no single unknown drops below 80.
  - Impact: 70% — Cumulative polish; no individual change is high-impact but consistency matters for professional appearance
- **Acceptance:**
  - Consistent `rounded-lg` on all card/panel containers
  - Consistent `rounded-md` on all buttons and inputs
  - Table headers use consistent background and border pattern across all views
  - `pnpm --filter reception test -- -u` passes (snapshot updates applied)
  - Grep verification: `grep -rn "rounded-sm\|rounded-xl\|rounded-2xl\|rounded-3xl" apps/reception/src` returns 0 (only `rounded`, `rounded-md`, `rounded-lg`, `rounded-full` allowed)
- **Validation contract (TC-09):**
  - TC-01: Border radius audit — all cards use `rounded-lg`, all inputs/buttons use `rounded-md`
  - TC-02: Table styling — all data tables have consistent header bg, row hover, and border pattern
  - TC-03: `pnpm --filter reception test -- -u` passes
- **Execution plan:** Red → Green → Refactor
  - Red: Grep for `rounded-` variants; catalogue current inconsistencies across views
  - Green: Standardise border radius per DS pattern; unify table header classes
  - Refactor: Extract shared table styling into a utility class or component if pattern repeats more than 5 times
- **Planning validation:** `None: S-effort task; detailed audit deferred to checkpoint`
- **Scouts:** Grep for `rounded-` usage across reception app to quantify scope
- **Edge Cases & Hardening:**
  - Some components may intentionally use `rounded-full` (avatar, badges) — exclude from standardisation
- **What would make this >=90%:**
  - Complete file list from checkpoint audit
  - Before/after screenshot comparison
- **Rollout / rollback:**
  - Rollout: CSS class changes, instant on deploy
  - Rollback: git revert
- **Documentation impact:** None

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Shade colour palette doesn't match brand intent | Medium | High | Use warm muted pastels as default; iterate after checkpoint visual review |
| Modal SimpleModal migration breaks event handlers | Low | High | Preserve all handlers; test each modal individually; checkpoint gates migration |
| Dynamic CSS fix pattern has broader scope | Low | Medium | Grep for `${` template literals in Tailwind classes across all reception files |
| Snapshot test churn | High | Low | Batch snapshot updates per wave |
| Touch target increases break bar POS layout | Low | Medium | Audit sizing at checkpoint before applying |
| DS Button className overrides may not compose correctly | Low | Medium | Test Login.tsx button styling after removing conflicting classes; TASK-05 TC-04 covers this |

## Observability

None: visual CSS/component changes only.

## Acceptance Criteria (overall)

- [ ] Zero instances of `bg-foreground.*opacity` or `bg-foreground/` in reception app
- [ ] Zero numbered Tailwind colour scales (`primary-600`, `red-700`, etc.) in reception app
- [ ] Zero dynamic template literal Tailwind class constructions
- [ ] Bar POS grid renders with category-specific shade colours
- [ ] All modals render dark overlay in both light and dark mode
- [ ] `pnpm --filter reception test` passes
- [ ] `pnpm typecheck` passes with no new errors in reception

## Decision Log

- 2026-02-24: Plan created from fact-find. Mode: plan-only. Shade colours use default warm pastel assumption.
- 2026-02-24: TASK-07 split into TASK-07a (INVESTIGATE, 85%) + TASK-07b (IMPLEMENT, 65%) after critique identified 65% L-effort IMPLEMENT as under-evidenced for direct execution.
- 2026-02-24: TASK-04 expanded from 7 to 20 files and S→M effort after live grep revealed 13 additional files with raw numbered colour scales.
- 2026-02-24: TASK-02 expanded from 15 to 20 files after grep revealed 5 additional files; 3 non-modal uses identified for individual analysis.
- 2026-02-24: TASK-08, TASK-09 detailed scope deferred to checkpoint audit.

## Overall-confidence Calculation

TASK-06 (checkpoint) excluded — procedural task, not implementation.

| Task | Effort | Weight | Confidence | Weighted |
|---|---|---|---|---|
| TASK-01 | M | 2 | 75% | 150 |
| TASK-02 | M | 2 | 85% | 170 |
| TASK-03 | S | 1 | 80% | 80 |
| TASK-04 | M | 2 | 70% | 140 |
| TASK-05 | S | 1 | 80% | 80 |
| TASK-07a | S | 1 | 85% | 85 |
| TASK-07b | L | 3 | 65% | 195 |
| TASK-08 | S | 1 | 75% | 75 |
| TASK-09 | S | 1 | 70% | 70 |

Total weight: 14 | Total weighted: 1045 | **Overall-confidence: 75%**
