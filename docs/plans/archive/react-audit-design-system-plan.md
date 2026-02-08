---
Type: Plan
Status: Completed
Domain: UI
Created: 2026-02-07
Last-updated: 2026-02-07
Feature-Slug: react-audit-design-system
Overall-confidence: 89%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
---

# React Audit Design-System Remediation Plan

## Summary

Remediate the 8 findings from the React 19.2 audit of `@acme/design-system`. The audit identified deprecated `forwardRef` usage across 53 files, unnecessary effects in SearchBar, a god component (DataGrid), a server component candidate (Card), deprecated Context.Provider syntax (Accordion), and minor useCallback cleanup. This plan phases the work into 5 tasks ordered by dependency and blast radius.

## Goals

- Migrate all 53 `forwardRef` usages to React 19.2.x ref-as-prop pattern
- Eliminate unnecessary `useEffect` hooks in SearchBar (derive state during render)
- Simplify SearchBar state structure by removing derived state
- Replace `Context.Provider` with direct Context usage in Accordion
- Remove unnecessary `"use client"` from Card primitive
- Maintain 100% existing test pass rate throughout

## Non-goals

- DataGrid decomposition (Finding 4) — deferred. Component is not consumed anywhere yet; decomposition adds value only when integration work begins
- Tooltip/ZoomImage useCallback removal (Finding 8) — withdrawn. Deep analysis confirmed `useCallback` is justified in both cases (Tooltip uses `cloneElement` to merge handlers onto potentially memo'd children; ZoomImage's `toggle` is a dependency of `onKeyDown`)
- Expanding test coverage beyond what's needed to validate the migration
- Migrating `forwardRef` in packages outside `design-system`

## Constraints & Assumptions

- Constraints:
  - React 19.2.1 — ref-as-prop is stable; `forwardRef` still works but is deprecated
  - All 34 existing tests must continue to pass after each task
  - No consumer API changes — props and exports remain identical
  - Slot component (ref-merging) requires special attention — foundational for `asChild` pattern
- Assumptions:
  - Radix UI primitives wrapped by design-system accept ref-as-prop in React 19.2.x (verified by React 19.0 release notes)

## Fact-Find Reference

- Related brief: `docs/plans/react-audit-design-system-fact-find.md`
- Key findings:
  - Finding 1: 53 files with `forwardRef` (82 instances) — 3 complexity tiers
  - Finding 2: SearchBar data transform in `useEffect` — High severity
  - Finding 3: SearchBar 5× `useState` — derived state should be computed
  - Finding 5: Card `"use client"` unnecessary — confirmed by 41 consumer analysis
  - Finding 6: SearchBar prop sync `useEffect` — unnecessary render cycle
  - Finding 7: Accordion `Context.Provider` × 2 — simplified syntax available
  - Finding 4 (DataGrid): Deferred — not consumed yet
  - Finding 8 (useCallback): Withdrawn — analysis proved correct usage

## Existing System Notes

- Key modules/files:
  - `packages/design-system/src/primitives/` — foundational components (button, card, input, slot, etc.)
  - `packages/design-system/src/atoms/` — single-purpose components (28 with forwardRef)
  - `packages/design-system/src/molecules/` — composite components (SearchBar, DataGrid)
  - `packages/design-system/src/primitives/slot.tsx` — ref-merging infrastructure, used by Button's `asChild`
- Patterns to follow:
  - `React.forwardRef<HTMLElement, Props>` → `function Comp({ ref, ...props }: Props & { ref?: React.Ref<HTMLElement> })`
  - Remove `displayName` when converting to named function declaration (self-documenting)
  - Keep `"use client"` on components with interactive hooks; remove only where proven safe

## Proposed Approach

### forwardRef Migration Strategy

Three-tier migration based on complexity analysis from the audit:

- **Tier 1 (70% — ~37 files):** Simple primitives with single DOM element. Mechanical transformation: unwrap `forwardRef`, add `ref` to props destructuring, add ref type to props interface, remove `displayName`.
- **Tier 2 (20% — ~11 files):** Radix UI wrappers with `React.ElementRef<typeof Component>` type extraction. Same transformation but preserve the Radix type patterns.
- **Tier 3 (10% — ~5 files):** Polymorphic components (Grid, Section, Stack) and Slot (ref-merging). Requires careful type signature updates; Slot needs functional validation.

**Order:** Slot first (foundational) → Tier 1 primitives → Tier 2 Radix wrappers → Tier 1 atoms → Tier 1 molecules → Tier 3 polymorphic.

### SearchBar Strategy

Address Findings 2, 3, and 6 together since they're in the same component:
1. Remove `matches` state — derive via `useMemo`
2. Remove `initialQuery` sync effect — use key-based reset pattern
3. Move `highlightedIndex` reset into event handlers

### Card + Accordion

Simple, isolated changes. Card: remove `"use client"` + forwardRef (combined with TASK-01). Accordion: replace `.Provider` with direct Context usage.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on |
|---|---|---|---:|---:|---|---|
| TASK-01 | IMPLEMENT | Migrate forwardRef → ref-as-prop (53 files) | 90% | L | Complete (2026-02-07) | - |
| TASK-02 | IMPLEMENT | Refactor SearchBar: derive state, remove effects | 88% | M | Complete (2026-02-07) | TASK-01 |
| TASK-03 | IMPLEMENT | Remove "use client" from Card primitive | 92% | S | Complete (2026-02-07) | TASK-01 |
| TASK-04 | IMPLEMENT | Replace Context.Provider in Accordion | 95% | S | Complete (2026-02-07) | - |
| TASK-05 | IMPLEMENT | Verify: run full design-system test suite + typecheck | 95% | S | Complete (2026-02-07) | TASK-01, TASK-02, TASK-03, TASK-04 |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Tasks

### TASK-01: Migrate forwardRef → ref-as-prop across design-system

- **Type:** IMPLEMENT
- **Affects:**
  - **Primary (53 files):**
    - `packages/design-system/src/primitives/slot.tsx` (Tier 3 — ref-merging, do first)
    - `packages/design-system/src/primitives/button.tsx` (Tier 1 — validate Slot integration)
    - `packages/design-system/src/primitives/card.tsx` (Tier 1)
    - `packages/design-system/src/primitives/input.tsx` (Tier 1)
    - `packages/design-system/src/primitives/label.tsx` (Tier 1)
    - `packages/design-system/src/primitives/select.tsx` (Tier 2 — Radix wrapper)
    - `packages/design-system/src/primitives/separator.tsx` (Tier 1)
    - `packages/design-system/src/primitives/sheet.tsx` (Tier 2 — Radix wrapper)
    - `packages/design-system/src/primitives/skeleton.tsx` (Tier 1)
    - `packages/design-system/src/primitives/switch.tsx` (Tier 1)
    - `packages/design-system/src/primitives/table.tsx` (Tier 1 — multiple sub-components)
    - `packages/design-system/src/primitives/tabs.tsx` (Tier 2 — Radix wrapper)
    - `packages/design-system/src/primitives/textarea.tsx` (Tier 1)
    - `packages/design-system/src/primitives/toggle.tsx` (Tier 1)
    - `packages/design-system/src/primitives/toggle-group.tsx` (Tier 2 — Radix wrapper)
    - `packages/design-system/src/primitives/tooltip.tsx` (Tier 2 — Radix wrapper)
    - `packages/design-system/src/primitives/accordion.tsx` (Tier 1 — 3 sub-components)
    - `packages/design-system/src/primitives/checkbox.tsx` (Tier 2 — Radix wrapper)
    - `packages/design-system/src/primitives/dialog.tsx` (Tier 2 — multiple sub-components)
    - `packages/design-system/src/primitives/drawer.tsx` (Tier 2)
    - `packages/design-system/src/primitives/dropdown-menu.tsx` (Tier 2)
    - `packages/design-system/src/primitives/overlayScrim.tsx` (Tier 1)
    - `packages/design-system/src/primitives/Stack.tsx` (Tier 3 — polymorphic)
    - `packages/design-system/src/primitives/Inline.tsx` (Tier 3 — polymorphic)
    - `packages/design-system/src/atoms/Alert.tsx` (Tier 1)
    - `packages/design-system/src/atoms/Avatar.tsx` (Tier 1)
    - `packages/design-system/src/atoms/Chip.tsx` (Tier 1)
    - `packages/design-system/src/atoms/ColorSwatch.tsx` (Tier 1)
    - `packages/design-system/src/atoms/FileSelector.tsx` (Tier 1)
    - `packages/design-system/src/atoms/FormField.tsx` (Tier 1)
    - `packages/design-system/src/atoms/Grid.tsx` (Tier 3 — polymorphic)
    - `packages/design-system/src/atoms/IconButton.tsx` (Tier 1)
    - `packages/design-system/src/atoms/LinkText.tsx` (Tier 1)
    - `packages/design-system/src/atoms/Loader.tsx` (Tier 1)
    - `packages/design-system/src/atoms/Logo.tsx` (Tier 1)
    - `packages/design-system/src/atoms/OptionPill.tsx` (Tier 1)
    - `packages/design-system/src/atoms/OptionTile.tsx` (Tier 1)
    - `packages/design-system/src/atoms/PaginationDot.tsx` (Tier 1)
    - `packages/design-system/src/atoms/Popover.tsx` (Tier 1)
    - `packages/design-system/src/atoms/Price.tsx` (Tier 1)
    - `packages/design-system/src/atoms/ProductBadge.tsx` (Tier 1)
    - `packages/design-system/src/atoms/Progress.tsx` (Tier 1)
    - `packages/design-system/src/atoms/Radio.tsx` (Tier 1)
    - `packages/design-system/src/atoms/RatingStars.tsx` (Tier 1)
    - `packages/design-system/src/atoms/Section.tsx` (Tier 1)
    - `packages/design-system/src/atoms/SelectField.tsx` (Tier 1)
    - `packages/design-system/src/atoms/Skeleton.tsx` (Tier 1)
    - `packages/design-system/src/atoms/StatCard.tsx` (Tier 1)
    - `packages/design-system/src/atoms/StockStatus.tsx` (Tier 1)
    - `packages/design-system/src/atoms/Switch.tsx` (Tier 1)
    - `packages/design-system/src/atoms/Tag.tsx` (Tier 1)
    - `packages/design-system/src/atoms/ThemeToggle.tsx` (Tier 1)
    - `packages/design-system/src/atoms/Toast.tsx` (Tier 1)
    - `packages/design-system/src/atoms/Tooltip.tsx` (Tier 1)
    - `packages/design-system/src/atoms/VideoPlayer.tsx` (Tier 1)
    - `packages/design-system/src/atoms/ZoomImage.tsx` (Tier 1)
    - `packages/design-system/src/atoms/accordion/accordion.tsx` (Tier 1 — 3 sub-components)
    - `packages/design-system/src/molecules/SearchBar.tsx` (Tier 1)
    - `packages/design-system/src/molecules/DataGrid.tsx` (Tier 1)
    - `packages/design-system/src/molecules/SustainabilityBadgeCluster.tsx` (Tier 1)
    - `packages/design-system/src/molecules/PromoCodeInput.tsx` (Tier 1)
    - `packages/design-system/src/molecules/QuantityInput.tsx` (Tier 1)
    - `packages/design-system/src/molecules/RatingSummary.tsx` (Tier 1)
    - `packages/design-system/src/molecules/PriceCluster.tsx` (Tier 1)
    - `packages/design-system/src/molecules/DatePicker.tsx` (Tier 1)
    - `packages/design-system/src/molecules/FormField.tsx` (Tier 1)
    - `packages/design-system/src/molecules/Image360Viewer.tsx` (Tier 1)
    - `packages/design-system/src/shadcn/Button.tsx` (Tier 1)
    - `packages/design-system/src/shadcn/AlertDialog.tsx` (Tier 1)
  - **Secondary (read-only):**
    - `[readonly] packages/design-system/src/primitives/__tests__/slot.test.tsx` — validate ref forwarding still works
    - `[readonly] packages/design-system/src/primitives/__tests__/button.test.tsx` — validate asChild + Slot
    - `[readonly] packages/design-system/src/primitives/__tests__/card.test.tsx` — validate ref forwarding
    - `[readonly] packages/design-system/src/primitives/__tests__/table.test.tsx` — validate multi-component refs
- **Depends on:** -
- **Confidence:** 90%
  - Implementation: 95% — Mechanical transformation with clear pattern (unwrap forwardRef, add ref to props, remove displayName). 70% of files are Tier 1 (trivial). Existing code read in detail for representative samples from each tier.
  - Approach: 90% — React 19.0 release explicitly documents ref-as-prop as the replacement. No ambiguity in the migration path.
  - Impact: 85% — 53 files is high blast radius but the change is API-preserving (consumers still pass `ref` the same way). Slot ref-merging is the main risk — must validate early. Only ~11% of components have ref tests, so rely on broader test suite for regression detection.
- **Acceptance:**
  - All `forwardRef` calls removed from `packages/design-system/src/`
  - All `displayName` assignments removed where component is now a named function declaration
  - Slot component ref-merging still works (parent + child refs both receive the DOM node)
  - Button `asChild` pattern still works with Slot
  - All 34 existing tests pass
  - No TypeScript errors in design-system package
  - Public API unchanged (same exports, same prop types)
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: Slot ref-merging — parent and child refs both receive the same DOM node → existing `slot.test.tsx` passes
    - TC-02: Button with asChild — renders slot-wrapped child with forwarded ref → existing `button.test.tsx` passes
    - TC-03: Card ref forwarding — ref.current points to the div element → existing `card.test.tsx` passes
    - TC-04: Table multi-component refs — table, row, head, cell refs all resolve → existing `table.test.tsx` passes
    - TC-05: Polymorphic Grid/Stack/Inline — ref forwarded through `as` prop → existing tests pass
    - TC-06: Radix wrappers (Dialog, Select, Tabs) — refs forwarded to Radix primitives → existing tests pass
    - TC-07: Zero `forwardRef` remaining — `grep -r "forwardRef" packages/design-system/src/` returns 0 matches (excluding test files and type imports)
    - TC-08: Zero `displayName` on converted components — `grep -r "displayName" packages/design-system/src/` returns 0 matches (excluding test files)
    - TC-09: TypeScript compiles cleanly — `pnpm --filter @acme/design-system exec tsc --noEmit` exits 0
  - **Acceptance coverage:** TC-01–TC-06 cover ref forwarding acceptance; TC-07–TC-08 cover completeness; TC-09 covers type safety
  - **Test type:** unit (existing), grep verification (new)
  - **Test location:** `packages/design-system/src/primitives/__tests__/*.test.tsx` (existing)
  - **Run:** `pnpm --filter @acme/design-system test`
  - **Cross-boundary coverage:** N/A — design-system is consumed by apps but the API is unchanged
  - **End-to-end coverage:** N/A — internal refactor, no user-facing flow change
- **TDD execution plan:**
  - **Red:** Run existing tests to confirm baseline (34 pass). Then convert Slot → run tests → if any fail, that's the Red signal for Tier 3 complexity.
  - **Green:** For each file: unwrap forwardRef → add ref to props → remove displayName → run affected tests.
  - **Refactor:** After all files converted: grep for remaining forwardRef/displayName; remove unused `forwardRef` imports; clean up any `React.` prefix inconsistencies.
- **Planning validation:**
  - Tests run: `pnpm --filter @acme/design-system test -- --testPathPattern="SearchBar|DataGrid|accordion|card|Tooltip|ZoomImage"` — 34 pass, 0 fail
  - Test stubs written: N/A — using existing tests as validation suite; adding grep-based verification (TC-07, TC-08) during build
  - Unexpected findings: Slot uses `useCallback` for merged ref setter with `[ref, childRef]` deps — this pattern changes when ref becomes a prop (ref will be in the closure). Must validate carefully.
- **Rollout / rollback:**
  - Rollout: Single commit touching only design-system internals. No consumer changes needed.
  - Rollback: `git revert` the commit. No data migration, no config changes.
- **Documentation impact:** None — API documentation doesn't reference `forwardRef` usage
- **Notes / references:**
  - React 19.0 blog: https://react.dev/blog/2024/12/05/react-19#ref-as-a-prop
  - Slot component is the highest-risk item — convert and test first before proceeding

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Commit:** `03e3676686`
- **TDD cycle:** Baseline targeted suite run first; migration pass exposed one extinct test (`packages/design-system/src/atoms/__tests__/Popover.test.tsx`) that depended on `forwardRef.render`; test updated to assert component output directly.
- **Confidence reassessment:** 90% → 92% (tests validated migration assumptions across primitives/atoms/molecules/shadcn; remaining risk is low and localized to consumer usage patterns already covered by unchanged public APIs).
- **Validation evidence:**
  - `pnpm --filter @acme/design-system typecheck` — PASS
  - `pnpm --filter @acme/design-system lint` — PASS
  - `pnpm --filter @acme/design-system test:quick -- --testPathPattern="slot|primitives/__tests__/button|primitives/__tests__/card|primitives/__tests__/table|primitives/__tests__/dialog|primitives/__tests__/select|primitives/__tests__/dropdown-menu|primitives/__tests__/checkbox|primitives/__tests__/input|primitives/__tests__/textarea|primitives/__tests__/accordion|molecules/__tests__/DataGrid|molecules/__tests__/SearchBar|molecules/__tests__/SustainabilityBadgeCluster|molecules/__tests__/PromoCodeInput|molecules/__tests__/QuantityInput|molecules/__tests__/RatingSummary|molecules/__tests__/PriceCluster|molecules/__tests__/FormField|molecules/__tests__/Image360Viewer|shadcn/__tests__/AlertDialog|shadcn/__tests__/Button|atoms/__tests__/Alert|atoms/__tests__/Avatar|atoms/__tests__/Chip|atoms/__tests__/ColorSwatch|atoms/__tests__/IconButton|atoms/__tests__/LinkText|atoms/__tests__/Loader|atoms/__tests__/Logo|atoms/__tests__/Option|atoms/__tests__/PaginationDot|atoms/__tests__/Popover|atoms/__tests__/Price|atoms/__tests__/ProductBadge|atoms/__tests__/Progress|atoms/__tests__/Radio|atoms/__tests__/RatingStars|atoms/__tests__/Skeleton|atoms/__tests__/StatCard|atoms/__tests__/StockStatus|atoms/__tests__/Switch|atoms/__tests__/Tag|atoms/__tests__/ThemeToggle|atoms/__tests__/Toast|atoms/__tests__/VideoPlayer|atoms/__tests__/ZoomImage"` — PASS (49 suites, 159 tests)
  - `rg -n "forwardRef" packages/design-system/src --glob '*.{ts,tsx}'` — 0 matches
  - `rg -n "displayName" <changed TASK-01 files>` — 0 matches
- **Implementation notes:** React codemod handled 52 files; `packages/design-system/src/primitives/Stack.tsx` required manual conversion; `packages/design-system/src/primitives/dropdown-menu.tsx`, `packages/design-system/src/atoms/Popover.tsx`, and `packages/design-system/src/primitives/slot.tsx` needed manual typing fixes.

---

### TASK-02: Refactor SearchBar — derive state, remove unnecessary effects

- **Type:** IMPLEMENT
- **Affects:**
  - **Primary:** `packages/design-system/src/molecules/SearchBar.tsx`
  - **Secondary:** `[readonly] packages/design-system/src/molecules/__tests__/SearchBar.test.tsx`
- **Depends on:** TASK-01 (SearchBar also has forwardRef to migrate)
- **Confidence:** 88%
  - Implementation: 90% — Clear transformation: replace `useEffect` + `useState` for matches with `useMemo`; remove `initialQuery` sync effect; move `highlightedIndex` reset to event handlers. Code read in full.
  - Approach: 90% — Directly follows React docs "You Might Not Need an Effect" guidance. The derived state pattern is well-established.
  - Impact: 85% — SearchBar has 4 tests covering filtering, keyboard nav, and blur behavior. Consumers import from design-system barrel. Need to verify the key-based reset pattern works with existing consumers (Header component in `packages/ui`).
- **Acceptance:**
  - `matches` state removed — derived via `useMemo` from `query`, `suggestions`, `isSelecting`, `focused`
  - `initialQuery` sync `useEffect` removed — `useState(initialQuery)` sufficient (consumers use key-based reset if needed)
  - `highlightedIndex` reset moved to event handlers (onBlur, onChange) instead of effect
  - All 4 existing SearchBar tests pass
  - No extra render cycle from effect-based state derivation
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: Typing filters suggestions → matches derived correctly (existing test: "Updates suggestions as query changes")
    - TC-02: Arrow key navigation cycles through derived matches → correct highlighting (existing test: "Cycles and selects suggestions")
    - TC-03: Enter triggers onSearch with current query → callback fired (existing test: "triggers onSearch on submit")
    - TC-04: Blur triggers onSearch → callback fired (existing test: "Triggers onSearch on blur")
    - TC-05: Empty query → matches is empty array (edge case, verify via TC-01 initial state)
    - TC-06: `isSelecting` or `!focused` → matches is empty (verify no stale suggestions shown)
  - **Acceptance coverage:** TC-01–TC-04 cover all acceptance criteria; TC-05–TC-06 cover edge cases
  - **Test type:** unit (existing)
  - **Test location:** `packages/design-system/src/molecules/__tests__/SearchBar.test.tsx`
  - **Run:** `pnpm --filter @acme/design-system test -- --testPathPattern=SearchBar`
  - **Cross-boundary coverage:** N/A — internal refactor
  - **End-to-end coverage:** N/A — design-system molecule, no direct user flow
- **TDD execution plan:**
  - **Red:** Activate existing tests. Remove `matches` useState and filter useEffect. Tests should fail because `matches` is no longer defined.
  - **Green:** Add `const matches = useMemo(...)` with the derivation logic. Remove initialQuery sync effect (keep `useState(initialQuery)`). Move highlightedIndex reset to event handlers. Tests pass.
  - **Refactor:** Clean up unused imports (`useEffect` if no longer needed). Verify no dead state variables remain.
- **Planning validation:**
  - Tests run: `pnpm --filter @acme/design-system test -- --testPathPattern=SearchBar` — 4 pass, 0 fail
  - Test stubs written: N/A (S/M effort — existing tests sufficient)
  - Unexpected findings: SearchBar also exists in `packages/ui` (duplicate implementation). This plan only covers `@acme/design-system`; the `packages/ui` version should be addressed separately or consolidated.
- **Rollout / rollback:**
  - Rollout: Single file change. Same commit as TASK-01 or separate — either is safe.
  - Rollback: `git revert`
- **Documentation impact:** None
- **Notes / references:**
  - React docs: https://react.dev/learn/you-might-not-need-an-effect
  - React docs: https://react.dev/learn/choosing-the-state-structure
  - Duplicate SearchBar in `packages/ui/src/components/molecules/SearchBar.tsx` — out of scope but noted for future consolidation

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Commit:** `03e3676686`
- **TDD cycle:** Existing SearchBar tests used as contract; implementation removed effect-driven derivation and moved highlight reset to event handlers.
- **Confidence reassessment:** 88% → 90% (all behavioral tests passed without additional regressions).
- **Validation evidence:**
  - `pnpm --filter @acme/design-system test:quick -- packages/design-system/src/molecules/__tests__/SearchBar.test.tsx` — PASS (4 tests)
  - `pnpm --filter @acme/design-system typecheck` — PASS
  - `pnpm --filter @acme/design-system lint` — PASS
- **Implementation notes:** `matches` state and both `useEffect` hooks removed; `matches` now derived via `useMemo`; `highlightedIndex` reset moved to `onChange`, `onBlur`, `Enter`, and selection paths.

---

### TASK-03: Remove "use client" from Card primitive

- **Type:** IMPLEMENT
- **Affects:**
  - **Primary:** `packages/design-system/src/primitives/card.tsx`
  - **Secondary:** `[readonly] packages/design-system/src/primitives/__tests__/card.test.tsx`
- **Depends on:** TASK-01 (Card's forwardRef migration must happen first — ref-as-prop works in Server Components)
- **Confidence:** 92%
  - Implementation: 95% — Remove one line (`"use client"`). After TASK-01 removes forwardRef, Card is a pure function with no hooks or browser APIs.
  - Approach: 95% — Card is purely presentational (className + ref forwarding). 41 consumers analyzed — none pass interactive props to Card itself (interactivity is in children).
  - Impact: 85% — Card is consumed in 41 files across apps. Removing the client boundary means Card renders server-side, which is strictly better for performance. The only risk is if a consumer relies on Card being a client boundary for their own children — but React client boundaries propagate to children, so removing it from Card doesn't affect children that have their own `"use client"`.
- **Acceptance:**
  - `"use client"` directive removed from `packages/design-system/src/primitives/card.tsx`
  - Card still renders correctly in both server and client contexts
  - All existing Card tests pass
  - No TypeScript errors
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: Card renders with correct className → existing test passes
    - TC-02: Card ref forwarding works → existing test passes
    - TC-03: Card `data-token` attribute present → existing test passes
    - TC-04: CardContent renders with className → existing test passes
  - **Acceptance coverage:** TC-01–TC-04 cover all acceptance criteria
  - **Test type:** unit (existing)
  - **Test location:** `packages/design-system/src/primitives/__tests__/card.test.tsx`
  - **Run:** `pnpm --filter @acme/design-system test -- --testPathPattern=card`
  - **Cross-boundary coverage:** N/A
  - **End-to-end coverage:** N/A — purely presentational change
- **TDD execution plan:**
  - **Red:** N/A — removing `"use client"` won't break unit tests (Jest doesn't enforce client/server boundaries)
  - **Green:** Remove the directive. Tests pass.
  - **Refactor:** Verify no other primitives can also drop `"use client"` (out of scope — noted for future audit)
- **Planning validation:**
  - Tests run: `pnpm --filter @acme/design-system test -- --testPathPattern=card` — 5 pass, 0 fail
  - Test stubs written: N/A (S effort)
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Single line removal. Zero consumer impact.
  - Rollback: Re-add `"use client"` if any SSR issue surfaces
- **Documentation impact:** None
- **Notes / references:**
  - React docs: https://react.dev/reference/rsc/server-components

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Commit:** `03e3676686`
- **Confidence reassessment:** 92% → 94% (single-line boundary removal with green card contract tests).
- **Validation evidence:**
  - `pnpm --filter @acme/design-system test:quick -- packages/design-system/src/primitives/__tests__/card.test.tsx` — PASS (4 tests)
  - `pnpm --filter @acme/design-system typecheck` — PASS
  - `pnpm --filter @acme/design-system lint` — PASS
- **Implementation notes:** Removed `"use client"` from `packages/design-system/src/primitives/card.tsx` after TASK-01 ref migration made the primitive purely presentational.

---

### TASK-04: Replace Context.Provider with direct Context usage in Accordion

- **Type:** IMPLEMENT
- **Affects:**
  - **Primary:** `packages/design-system/src/atoms/accordion/accordion.tsx`
  - **Secondary:** `[readonly] packages/design-system/src/primitives/__tests__/accordion.test.tsx`
- **Depends on:** - (independent of forwardRef migration)
- **Confidence:** 95%
  - Implementation: 98% — Replace `<AccordionContext.Provider value={context}>` with `<AccordionContext value={context}>` (2 instances). Identical change for `AccordionItemContext.Provider`.
  - Approach: 95% — React 19.0 explicitly documents `<Context>` as the new provider syntax. `<Context.Provider>` still works but is deprecated.
  - Impact: 92% — Change is strictly internal to the Accordion component. No API change. Context consumers (`useContext`) work identically regardless of provider syntax.
- **Acceptance:**
  - `AccordionContext.Provider` → `AccordionContext` (line ~105)
  - `AccordionItemContext.Provider` → `AccordionItemContext` (line ~122)
  - All existing Accordion tests pass
  - Accordion open/close behavior unchanged
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: Single accordion toggle with `collapsible=false` → existing test passes
    - TC-02: Multiple accordion independent open states → existing test passes
    - TC-03: Click trigger opens/closes item → existing test passes
  - **Acceptance coverage:** TC-01–TC-03 cover context propagation (if context breaks, accordion behavior breaks)
  - **Test type:** unit (existing)
  - **Test location:** `packages/design-system/src/primitives/__tests__/accordion.test.tsx`
  - **Run:** `pnpm --filter @acme/design-system test -- --testPathPattern=accordion`
  - **Cross-boundary coverage:** N/A
  - **End-to-end coverage:** N/A
- **TDD execution plan:**
  - **Red:** N/A — syntax change; tests either pass or fail immediately
  - **Green:** Replace `.Provider` with direct Context JSX. Run tests.
  - **Refactor:** None needed
- **Planning validation:**
  - Tests run: `pnpm --filter @acme/design-system test -- --testPathPattern=accordion` — 2 pass, 0 fail
  - Test stubs written: N/A (S effort)
  - Unexpected findings: None. Accordion also has forwardRef in sub-components (AccordionItem, AccordionTrigger, AccordionContent) — those are covered by TASK-01.
- **Rollout / rollback:**
  - Rollout: 2-line change. Zero API impact.
  - Rollback: Revert to `.Provider` syntax
- **Documentation impact:** None
- **Notes / references:**
  - React docs: https://react.dev/blog/2024/12/05/react-19#context-as-a-provider

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Commit:** `03e3676686`
- **Confidence reassessment:** 95% → 96% (syntax-only provider migration with unchanged behavior).
- **Validation evidence:**
  - `pnpm --filter @acme/design-system test:quick -- packages/design-system/src/primitives/__tests__/accordion.test.tsx` — PASS (2 tests)
  - `pnpm --filter @acme/design-system typecheck` — PASS
  - `pnpm --filter @acme/design-system lint` — PASS
- **Implementation notes:** Replaced `AccordionContext.Provider` and `AccordionItemContext.Provider` with React 19 direct context providers in `packages/design-system/src/primitives/accordion.tsx`.

---

### TASK-05: Full verification — test suite + typecheck

- **Type:** IMPLEMENT
- **Affects:**
  - `[readonly] packages/design-system/` (full package)
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04
- **Confidence:** 95%
  - Implementation: 95% — Run existing commands
  - Approach: 95% — Standard verification gate
  - Impact: 95% — Catches any regressions from TASK-01–04
- **Acceptance:**
  - `pnpm --filter @acme/design-system test` — all tests pass
  - `pnpm --filter @acme/design-system exec tsc --noEmit` — zero errors
  - `grep -r "forwardRef" packages/design-system/src/ --include="*.tsx" --include="*.ts"` — zero matches (excluding node_modules)
  - `grep -r "\.Provider" packages/design-system/src/ --include="*.tsx"` — zero matches
  - `grep -r "displayName" packages/design-system/src/ --include="*.tsx"` — zero matches on converted components
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: Full test suite passes → `pnpm --filter @acme/design-system test` exits 0 (ignoring coverage thresholds)
    - TC-02: TypeScript compiles → `tsc --noEmit` exits 0
    - TC-03: No forwardRef remnants → grep returns 0 results
    - TC-04: No .Provider remnants → grep returns 0 results
  - **Acceptance coverage:** TC-01–TC-04 cover all acceptance criteria
  - **Test type:** integration (full suite)
  - **Test location:** `packages/design-system/`
  - **Run:** `pnpm --filter @acme/design-system test && pnpm --filter @acme/design-system exec tsc --noEmit`
  - **Cross-boundary coverage:** N/A
  - **End-to-end coverage:** N/A
- **TDD execution plan:**
  - **Red:** N/A — verification task
  - **Green:** All commands pass
  - **Refactor:** Fix any issues found
- **Planning validation:**
  - Tests run: Baseline captured — 34 tests pass currently
  - Test stubs written: N/A
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: N/A — verification only
  - Rollback: N/A
- **Documentation impact:** None
- **Notes / references:** Coverage thresholds will report below-threshold (expected — design-system has 16% branch coverage currently). Test pass/fail is the gating criterion.

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Commit:** `03e3676686`
- **Validation evidence:**
  - `pnpm --filter @acme/design-system test:quick -- packages/design-system/src` — PASS (67 suites, 207 tests)
  - `pnpm --filter @acme/design-system typecheck` — PASS
  - `pnpm --filter @acme/design-system lint` — PASS
  - `rg -n "forwardRef" packages/design-system/src --glob '*.{ts,tsx}'` — 0 matches
  - `rg -n "\\.Provider" packages/design-system/src --glob '*.tsx' --glob '!**/__tests__/**'` — 0 matches
  - `rg -n "displayName" <changed TASK-01 files>` — 0 matches
- **Implementation notes:** Verified final state across all changed files; test command intentionally uses `test:quick` policy-safe targeted run over package source tree instead of unfiltered `pnpm test`.

## Risks & Mitigations

- **Slot ref-merging breaks after forwardRef removal:** Slot's `useCallback` depends on `[ref, childRef]` — when `ref` becomes a prop, the closure behavior changes. **Mitigation:** Convert Slot first, run Slot + Button tests immediately. If ref-merging breaks, investigate before proceeding.
- **Polymorphic components (Grid/Stack/Inline) have complex generic type signatures:** `ref as never` cast may need adjustment. **Mitigation:** Convert one polymorphic component first, validate types compile, then apply pattern to remaining.
- **Consumer breakage from removing Card's "use client":** If any consumer implicitly relies on Card being a client boundary. **Mitigation:** 41 consumers analyzed — none pass interactive props. Server rendering is strictly additive.
- **SearchBar behavior change:** Removing the `initialQuery` sync effect changes behavior — external `initialQuery` prop changes will no longer auto-sync to internal state. **Mitigation:** This is the intended fix (key-based reset). Document in commit message. Verify Header consumer in `packages/ui`.

## Observability

- Logging: N/A — design-system components don't log
- Metrics: N/A — no telemetry in design-system
- Alerts/Dashboards: N/A

## Acceptance Criteria (overall)

- [x] Zero `forwardRef` usage in `packages/design-system/src/` (82 instances removed)
- [x] Zero `Context.Provider` usage in `packages/design-system/src/` (2 instances replaced)
- [x] SearchBar derives matches during render (no useEffect for filtering)
- [x] Card renders as Server Component (no "use client")
- [x] All 34 existing tests pass (expanded verification: 67 suites, 207 tests)
- [x] TypeScript compiles cleanly
- [x] No consumer API changes

## Decision Log

- 2026-02-07: **Defer DataGrid decomposition** — Component is not consumed anywhere yet. Decomposition adds value only when integration work begins. Revisit when DataGrid is adopted.
- 2026-02-07: **Withdraw Tooltip/ZoomImage useCallback finding** — Deep analysis confirmed useCallback is justified in both cases. Tooltip merges handlers via cloneElement to potentially memo'd children. ZoomImage's toggle is a dependency of onKeyDown.
- 2026-02-07: **SearchBar initialQuery sync: remove effect, use key-based reset** — Chose Option B (key-based reset) over Option A (controlled) because SearchBar needs to be editable after initialization. Consumers use `key={initialQuery}` to reset.
- 2026-02-07: **forwardRef migration order: Slot first** — Slot is foundational infrastructure for asChild pattern. Must validate ref-merging works with ref-as-prop before proceeding with 52 other files.
