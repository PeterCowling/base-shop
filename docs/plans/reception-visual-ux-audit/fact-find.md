---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-24
Last-updated: 2026-02-24
Feature-Slug: reception-visual-ux-audit
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-design-spec, lp-design-qa
Related-Plan: docs/plans/reception-visual-ux-audit/plan.md
Business-OS-Integration: on
Business-Unit: BRIK
Card-ID: none
direct-inject: true
direct-inject-rationale: Visual/UX audit triggered by operator after completing Phase 1-7 design overhaul — systematic quality inspection of remaining issues
---

# Reception App Visual/UX Audit Fact-Find Brief

## Scope

### Summary

Following a 7-phase design system migration (font tokens, dark mode fixes, PageShell extraction, Button migration, icon consolidation, chart tokens, legacy cleanup), a comprehensive visual/UX audit of ~80 component files across all major reception app screens was conducted. The audit evaluated colour usage, typography, spacing, component styling, dark/light mode consistency, and overall visual quality for a hostel staff operations app.

The app is significantly improved but retains **4 critical**, **4 high**, and **7 medium** priority issues (15 task seeds) that prevent it from reaching the "modern, attractive, engaging but functional" bar. The most impactful issues are: (1) bar/POS product grid renders as monochrome gray because 11 category shade colour families are undefined tokens (sourced from `useProducts.ts` and `CategoryHeader.tsx`), (2) ~15 modal/overlay components use `bg-foreground` backdrop which inverts in dark mode, (3) raw Tailwind numbered colour scales (`primary-600`, `red-700`, `gray-300`, `blue-500`) escape the token system in ~8 files, and (4) interaction patterns hostile to touchscreen use.

### Goals

- Fix all critical visual defects (broken colours, dark mode failures, Tailwind purge issues)
- Eliminate remaining raw Tailwind colours escaping the semantic token system
- Unify modal implementation to single DS-backed pattern
- Improve touch target sizes and interaction patterns for tablet/touchscreen use
- Achieve consistent border radius, spacing, and typography across all screens

### Non-goals

- Redesigning information architecture or navigation structure
- Adding new features or screens
- Changing business logic or data flows
- Mobile-first responsive redesign (reception is primarily used on desktop/tablet)

### Constraints & Assumptions

- Constraints:
  - Must use existing DS token system (HSL triplets, `hsl(var(--token))` pattern)
  - Must preserve all existing `onClick`, `disabled`, `aria-*`, `type`, `data-*` attributes
  - Must not break existing test assertions (snapshot updates acceptable)
  - Tailwind CSS v4 `@theme` block for utility registration
- Assumptions:
  - Bar/POS screens are used on tablets — touch targets must be ≥44px
  - Dark mode is the primary mode for hostel night-shift staff
  - Category shade colours (pinkShades, coffeeShades, etc.) are intentional product-type colour coding

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/app/layout.tsx` — Root layout, font loading, theme provider
- `apps/reception/src/components/AuthenticatedApp.tsx` — Main authenticated shell with nav + content
- `apps/reception/src/providers/ReceptionThemeProvider.tsx` — Theme context and dark mode management

### Key Modules / Files

- `packages/themes/reception/src/tokens.ts` — Theme token source of truth (HSL values, font tokens, chart palette)
- `apps/reception/src/app/globals.css` — TW v4 @theme block, CSS reset, dark mode selectors
- `apps/reception/src/hooks/data/bar/useProducts.ts` — Product data definitions with undefined shade colour classes (`bg-pinkShades-row1`, etc.)
- `apps/reception/src/components/bar/orderTaking/CategoryHeader.tsx` — Category style map (`CATEGORY_STYLES`) defining 11 shade families, all undefined
- `apps/reception/src/components/bar/orderTaking/ProductGrid.tsx` — Bar product grid consuming shade colours from product data (fallback: `bg-surface-2`)
- `apps/reception/src/components/common/AlertModal.tsx` — DS SimpleModal-based modal (correct pattern)
- `apps/reception/src/hoc/withIconModal.tsx` — HOC with `bg-foreground/50` backdrop (broken in dark mode)
- `apps/reception/src/components/till/CloseShiftForm.tsx` — Dynamic CSS class generation (Tailwind purge issue)
- `apps/reception/src/components/appNav/CurrentPageIndicator.tsx` — Hardcoded `text-primary-600`

### Patterns & Conventions Observed

- **Token system is working**: Most components correctly use semantic tokens (`bg-surface`, `text-foreground`, `border-border-1`) — evidence: ~65/80 files audited
- **DS Button adoption complete**: All buttons migrated to `<Button color="" tone="">` — evidence: zero `ReceptionButton` references
- **Lucide icon consolidation complete**: All icons use `lucide-react` — evidence: zero `@fortawesome` or `@heroicons` references
- **PageShell adopted**: 10 screens use shared `<PageShell>` wrapper — evidence: `components/common/PageShell.tsx`
- **Three modal patterns coexist**: (1) `SimpleModal` from DS (correct), (2) custom `fixed inset-0` divs with `bg-foreground` backdrop (~15 files), (3) `withIconModal` HOC — evidence: AlertModal.tsx (correct) vs withIconModal.tsx, ArchiveConfirmationModal.tsx, DeleteConfirmationModal.tsx, DisplayDialogue.tsx, BookingDetailsModal.tsx, EntryDialogue.tsx, DeleteBookingModal.tsx, KeycardsModal.tsx, LoanModal.tsx, EditTransactionModal.tsx, ModalPreorderDetails.tsx, VoidTransactionModal.tsx, PreorderButtons.tsx, PettyCashForm.tsx, AppNav.tsx
- **Shade colour system is architecture, not accident**: `useProducts.ts` assigns shade classes to products and `CategoryHeader.tsx` defines `CATEGORY_STYLES` mapping 11 categories to shade families (pink, coffee, beer, wine, tea, green, blue, purple, spritz, orange, grayish) with 5 rows per shade — evidence: `useProducts.ts:64-117`, `CategoryHeader.tsx:26-100`

### Data & Contracts

- Types/schemas/events:
  - `ShadeFamily` type with `row1`–`row5` keys used by ProductGrid and CategoryHeader
  - DS Button API: `color` (primary/accent/success/info/warning/danger/default), `tone` (solid/soft/outline/ghost/quiet), `size` (sm/md/lg)
- Persistence: Not investigated — UI-only changes
- API/contracts: Not investigated — UI-only changes

### Dependency & Impact Map

- Upstream dependencies:
  - `packages/themes/reception/` — token definitions (may need new shade tokens)
  - `packages/design-system/` — Button, SimpleModal, Dialog primitives
  - `apps/reception/src/app/globals.css` — `@theme` block (must register any new tokens)
- Downstream dependents:
  - All ~80 reception components consume tokens
  - Snapshot tests will need updates
- Likely blast radius:
  - High: shade colour fix touches useProducts.ts + CategoryHeader.tsx + globals.css + tokens.ts + tokens.css (5 files, affects entire bar POS)
  - Medium-High: modal backdrop fix touches ~15 files with `bg-foreground` overlay pattern; modal unification is a separate larger effort
  - Low: individual colour/spacing fixes are isolated per-file

### Delivery & Channel Landscape

Not investigated: UI engineering changes only.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + React Testing Library, snapshot tests
- Commands: `pnpm --filter reception test`, `pnpm --filter reception test -- -u` (snapshot update)
- CI integration: Pre-commit hooks run typecheck-staged.sh and lint-staged-packages.sh

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| TableHeader | Snapshot + unit | `TableHeader.test.tsx` | Recently updated for Lucide icons |
| CategoryHeader | Unit | `CategoryHeader.test.tsx` | Tests rendering, not visual |
| SalesComponents | Unit | `SalesComponents.test.tsx` | Pre-existing crypto.randomUUID failure |
| GridComponents | Unit + snapshot | `GridComponents.test.tsx` | RoomGrid rendering |
| Checkout | Unit | `Checkout.test.tsx`, `CheckoutTable.component.test.tsx` | Component behaviour |
| Parity tests | Snapshot | 5 route snapshots | Will need -u after visual changes |

#### Coverage Gaps

- No visual regression tests for dark mode
- No tests for shade colour rendering in ProductGrid
- No accessibility tests for touch target sizes

#### Recommended Test Approach

- Snapshot updates (`-u` flag) after each fix batch
- Manual dark mode verification via browser for backdrop/modal changes
- No new test files needed — existing coverage is adequate for regression detection

## Questions

### Resolved

- Q: Are the shade colours (pinkShades, coffeeShades, etc.) intentional product category coding?
  - A: Yes — `useProducts.ts` assigns shade classes to products and `CategoryHeader.tsx` defines an 11-category style map
  - Evidence: `apps/reception/src/hooks/data/bar/useProducts.ts:64-117`, `apps/reception/src/components/bar/orderTaking/CategoryHeader.tsx:26-100`

- Q: Is the `bg-foreground` backdrop pattern a migration artifact or intentional?
  - A: Migration artifact — it produces a white/light overlay in dark mode because `--color-fg` flips to a light value. Should use `bg-black/50` or semantic backdrop token.
  - Evidence: ~15 files use this pattern — `withIconModal.tsx`, `AppNav.tsx`, `VoidTransactionModal.tsx`, `PreorderButtons.tsx`, `PettyCashForm.tsx` (modern `/50` syntax) and `ArchiveConfirmationModal.tsx`, `DeleteConfirmationModal.tsx`, `DisplayDialogue.tsx`, `BookingDetailsModal.tsx`, `EntryDialogue.tsx`, `DeleteBookingModal.tsx`, `KeycardsModal.tsx`, `LoanModal.tsx`, `EditTransactionModal.tsx`, `ModalPreorderDetails.tsx` (legacy `bg-opacity-50` syntax)

- Q: Which modal pattern is canonical?
  - A: `SimpleModal` from DS (Radix Dialog-based with focus trapping and portal rendering). Custom `fixed inset-0` modals lack focus trapping and proper backdrop.
  - Evidence: `AlertModal.tsx` (correct) vs `ModalContainer.tsx` (custom)

### Open (User Input Needed)

- Q: What colours should the bar product category shades be?
  - Why it matters: The entire bar POS grid is monochrome gray without them. These define the visual identity of the most-used screen.
  - Decision impacted: Token definitions in `tokens.ts` and `globals.css`
  - Decision owner: Product/Design
  - Default assumption: Use warm, muted pastel variants of the shade names (pink → rose, coffee → amber, pistachio → green, etc.) in both light and dark mode with 5 intensity levels per family.

- Q: Should the 4px side borders on the main content area be removed?
  - Why it matters: They create a thick visual frame that feels heavy for a modern operations app
  - Decision impacted: `AuthenticatedApp.tsx` border styling
  - Decision owner: Product/Design
  - Default assumption: Remove or reduce to 1px — risk: low

## Confidence Inputs

- Implementation: 80% — Most issues have clear file locations, token patterns, and DS component APIs. Shade colour system requires 11 families of tokens (more than initially estimated). Modal backdrop fix scope is ~15 files (larger than initially estimated). Would reach 90% after confirming complete file lists via grep.
- Approach: 85% — Token-first approach is proven by the Phase 1-7 overhaul. Modal unification requires choosing between refactoring custom modals to SimpleModal vs wrapping with DS Dialog. SimpleModal is the clear winner.
- Impact: 80% — Fixing the monochrome bar grid and dark mode backdrops are high-impact. Individual colour and spacing fixes have cumulative but individually modest impact.
- Delivery-Readiness: 85% — All DS components and token infrastructure are in place from the overhaul. No new packages or architecture needed.
- Testability: 75% — Snapshot tests catch regressions but don't verify visual correctness. Dark mode issues require manual verification. Would reach 85% with visual regression testing (Playwright screenshot comparison).

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Shade colour design may not match brand intent | Medium | High | Default to warm muted pastels; get design approval before merge |
| Modal migration breaks event handlers in bar POS | Low | High | Preserve all onClick/onSubmit/onClose handlers; test each modal individually |
| Dynamic CSS classes (CloseShiftForm) have broader scope than identified | Low | Medium | Grep for template literal class patterns across all reception files |
| Snapshot test churn creates noisy diffs | High | Low | Batch changes per-phase and update snapshots once per phase |
| DS Button className overrides may not compose correctly | Low | Medium | Test Login.tsx button styling after removing conflicting classes |

## Planning Constraints & Notes

- Must-follow patterns:
  - All colours via `hsl(var(--token))` pattern — no raw hex, no raw Tailwind colour classes
  - New tokens registered in 3 places: `tokens.ts` → `tokens.css` → `globals.css @theme` block
  - Modals via `SimpleModal` or Radix Dialog from DS — no custom `fixed inset-0` implementations
  - DS `Button` with `color`/`tone`/`size` props — no `className` colour overrides
- Rollout/rollback expectations:
  - All changes are CSS/component-level — instant rollback via git revert
  - No data migrations or API changes
- Observability expectations:
  - None required — visual changes only

## Suggested Task Seeds (Non-binding)

### Critical Priority

1. **Define bar product shade colour tokens** — Add 11 shade families (pinkShades, coffeeShades, beerShades, wineShades, teaShades, greenShades, blueShades, purpleShades, spritzShades, orangeShades, grayishShades) with 5 intensity rows each to `tokens.ts`, `tokens.css`, and `globals.css @theme` block. Source files: `useProducts.ts` (product data) and `CategoryHeader.tsx` (CATEGORY_STYLES map). Verify both render with correct colours.

2. **Fix dark mode modal backdrops** — Replace `bg-foreground bg-opacity-50` and `bg-foreground/50` with `bg-black/50` across ~15 files: `withIconModal.tsx`, `AppNav.tsx`, `VoidTransactionModal.tsx`, `PreorderButtons.tsx`, `PettyCashForm.tsx`, `ArchiveConfirmationModal.tsx`, `DeleteConfirmationModal.tsx`, `DisplayDialogue.tsx`, `BookingDetailsModal.tsx`, `EntryDialogue.tsx`, `DeleteBookingModal.tsx`, `KeycardsModal.tsx`, `LoanModal.tsx`, `EditTransactionModal.tsx`, `ModalPreorderDetails.tsx`. Verify overlay renders correctly in both light and dark mode.

3. **Fix Tailwind-purged dynamic CSS classes** — Replace dynamic `bg-${shade}-main` pattern in `CloseShiftForm.tsx` with a safelist or explicit class map. Verify reconciliation step colours render.

4. **Remove hardcoded `text-primary-600`** — Replace with `text-primary-main` in `CurrentPageIndicator.tsx`.

### High Priority

5. **Unify modal pattern to SimpleModal** — Migrate custom `fixed inset-0` modal wrappers (`withIconModal.tsx` HOC and individual modal components) to use DS `SimpleModal` or Radix Dialog. Preserve all event handlers, form state, and focus behaviour. Note: `ModalContainer.tsx` is a content container (not a backdrop) — it may not need migration.

6. **Fix remaining raw Tailwind colours** — Replace `primary-600`, `primary-700`, `red-700`, `gray-300`, `blue-500`, `blue-700` etc. in `FilterBar.tsx`, `_FilterBar.tsx`, `SortableHeader.tsx`, `BulkActionsToolbar.tsx`, `CopyableBookingRef.tsx`, and `ConfirmCancelModal.tsx` with semantic tokens.

7. **Fix nav backdrop dark mode** — Replace `bg-foreground/50` in `AppNav.tsx` mobile overlay with `bg-black/50`.

8. **Fix Login.tsx button composition** — Remove `className` colour overrides that conflict with DS Button `color`/`tone` props.

### Medium Priority

9. **Increase bar POS touch targets** — Ensure all interactive elements in OrderTakingScreen, ProductGrid, CategoryHeader, and PaymentSection meet 44px minimum touch target.

10. **Remove 4px side borders** — Replace `border-l-4 border-r-4 border-border-2` in `AuthenticatedApp.tsx` with a subtler treatment (1px border or none).

11. **Unify border radius** — Standardise on `rounded-lg` for cards/panels and `rounded-md` for buttons/inputs across all screens.

12. **Fix PageShell heading size** — Reduce `text-5xl` to `text-2xl` or `text-3xl` for operations context.

13. **Fix FormActionButtons cancel colour** — Change cancel button from `color="info"` to `color="default"` tone `"outline"`.

14. **Add active state to SalesScreen filter buttons** — Currently no visual distinction between active and inactive filter.

15. **Standardise table styling** — Unify table header backgrounds, row hover states, and border patterns across Checkins, Checkout, Search, Till, Loans views.

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: `lp-design-spec` (for shade colour design), `lp-design-qa` (for post-fix verification)
- Deliverable acceptance package:
  - Zero raw Tailwind colour classes in reception app (grep verification)
  - All modals use DS SimpleModal/Dialog
  - Bar POS grid renders with category-specific shade colours
  - Dark mode renders correctly on all screens (manual verification)
  - `pnpm --filter reception test` passes
  - `pnpm typecheck` passes with no new errors
- Post-delivery measurement plan:
  - Visual regression baseline via Playwright screenshots (future)

## Evidence Gap Review

### Gaps Addressed

- All 80+ component files audited across 5 parallel agents covering every major screen area
- Token system traced end-to-end: `tokens.ts` → `tokens.css` → `globals.css @theme` → component usage
- DS Button API confirmed for all button migration patterns
- Modal patterns catalogued with specific file references
- Shade colour architecture documented with explicit mapping logic

### Confidence Adjustments

- Implementation confidence set at 80% — most issues have clear file locations and proven fix patterns from the Phase 1-7 overhaul, but shade colour scope (11 families) and modal backdrop scope (~15 files) are larger than initially estimated
- Approach confidence at 85% — shade colour token design is the main uncertainty but architecture is well-understood

### Remaining Assumptions

- Shade colour palette choice (warm muted pastels) may need design iteration — documented as open question
- 4px side border removal assumed desirable — documented as open question
- Double-click bar POS interaction pattern is a UX concern but out of scope for this visual audit (would require business logic changes)

## Planning Readiness

- Status: Ready-for-planning
- Blocking items:
  - None — open questions have safe default assumptions
- Recommended next step:
  - `/lp-do-plan` to break task seeds into implementation phases
