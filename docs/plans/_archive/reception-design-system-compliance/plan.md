---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-03-13
Last-reviewed: 2026-03-13
Last-updated: 2026-03-13
Last-reviewed: 2026-03-13
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-design-system-compliance
Dispatch-ID: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 86%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/reception-design-system-compliance/analysis.md
---

# Reception Design System Compliance Plan

## Summary
Three classes of DS violation remain in the reception app: 6 inline `style={{}}` attributes in 4 files, 35 raw `<button>` elements in 17 files (DraftReviewPanel already uses DS Button), and exactly 14 `ds/enforce-layout-primitives` ESLint warnings across 11 files (confirmed via live lint run on 2026-03-13 — 8 warnings in inbox/ScreenHeader/DraftReviewPanel files covered by TASK-02; 6 warnings in hub/StaffAccountsForm files covered by TASK-03). All changes are mechanical className/import replacements with no behaviour changes. Three disjoint task groups enable full Wave 1 parallel execution. Completion is gated by ESLint `ds/enforce-layout-primitives` → 0 warnings, TypeScript typecheck clean, and 0 remaining inline `style={{}}` attributes.

## Active tasks
- [x] TASK-01: Fix all inline style attributes (4 files) — Complete (2026-03-13)
- [x] TASK-02: Convert inbox + ScreenHeader DS violations (8 files — raw buttons, layout warnings, bracket values) — Complete (2026-03-13)
- [x] TASK-03: Convert remaining raw buttons + hub ESLint warnings (12 files — bar, till, eod, stock, cash, analytics, userManagement, checkins, OfflineIndicator, withIconModal) — Complete (2026-03-13)

## Goals
- Zero inline `style={{}}` attributes across all reception components.
- All interactive elements use DS `Button` from `@acme/design-system/atoms`.
- All ESLint `ds/enforce-layout-primitives` warnings eliminated.

## Non-goals
- Semantic token compliance (already complete).
- Converting layout classes on elements not flagged by the ESLint rule.
- Design or UX changes — purely mechanical compliance fixes.

## Constraints & Assumptions
- Constraints:
  - DS Button imported from `@acme/design-system/atoms` — confirmed pattern in 10+ existing reception components. DS Button supports `compatibilityMode="passthrough"` prop (confirmed in `packages/design-system/src/primitives/button.tsx:48`) which bypasses structural BASE_CLASSES and renders only the provided className — used for withIconModal tile conversion.
  - DS layout primitives imported from `@acme/design-system/primitives` — `Inline`, `Stack`, `Cluster`, `Cover`, `Grid` — Turbopack-verified in SafeManagement.tsx (Cluster) and LoanedItemsList.tsx (Inline).
  - Reception app uses Turbopack — no webpack-specific import aliases needed.
  - Tests are CI-only — never run Jest locally.
- Assumptions:
  - Tooltip `zIndex: 9999` is redundant — `z-50` class already present on same element.
  - `_BookingTooltip.tsx` and `KeycardDepositMenu.tsx` JS-computed `top`/`left` values must remain (click-relative positioning); only the static `zIndex` portion can be removed.
  - DS Button variant selection can be determined from each button's existing className at build time.
  - Snapshot tests may need className updates — update in same commit.

## Inherited Outcome Contract

- **Why:** Every reception screen should use a consistent, themeable visual language. Inline styles override the CSS cascade, raw buttons bypass DS interaction patterns, and unflagged layout classes make theming harder to iterate.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All reception app components use DS Button for interactive elements, DS layout primitives where the ESLint rule flags violations, and contain zero inline style attributes. ESLint `ds/enforce-layout-primitives` warning count drops to 0.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/reception-design-system-compliance/analysis.md`
- Selected approach inherited: Option A — targeted mechanical conversion, executed as 3 parallel tasks with fully disjoint file sets.
- Key reasoning used: Minimal blast radius; each file change is self-contained; disjoint file sets enable true parallel execution; ESLint gate provides deterministic completion verification.

## Selected Approach Summary
- What was chosen: Per-file mechanical conversion — read each button's current className → pick DS Button variant/tone; replace ESLint-flagged flex/grid with DS primitives; remove inline styles with Tailwind equivalents (keeping JS-computed dynamic values).
- Why planning is not reopening option selection: Option B (wholesale rewrite) has higher blast radius; Option C (ESLint suppression) defeats the purpose; Option D (partial scope) contradicts user directive. Analysis verdict was decisive.

## Fact-Find Support
- Supporting brief: `docs/plans/reception-design-system-compliance/fact-find.md`
- Evidence carried forward:
  - 6 inline style instances verified at exact file:line locations.
  - 35 raw `<button>` instances in 17 active files (DraftReviewPanel already converted).
  - 14 ESLint `ds/enforce-layout-primitives` warnings confirmed via live lint run (2026-03-13) across 11 files: 8 warnings in TASK-02 files (DraftReviewPanel×3, FilterBar×1, TemplatePicker×1, ThreadDetailPane×1, ThreadList×1, ScreenHeader×1); 6 warnings in TASK-03 files (AnalyticsHub×1, CashHub×1, EodHub×1, StockHub×1, StaffAccountsForm×2). Note: eslint.config.mjs annotation of "42 warnings" is stale — the live count of 14 is confirmed correct. No scope expansion needed.
  - DS Button `asChild` prop confirmed — covers HOC wrapper scenarios.
  - DS primitives import path confirmed working with Turbopack in reception.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Fix all inline style attributes (4 files) | 88% | S | Complete (2026-03-13) | - | - |
| TASK-02 | IMPLEMENT | Convert inbox + ScreenHeader DS violations (8 files) | 85% | M | Complete (2026-03-13) | - | - |
| TASK-03 | IMPLEMENT | Convert remaining raw buttons (12 files) | 87% | M | Complete (2026-03-13) | - | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | Per-button variant selection preserves visual intent; DS Button provides consistent hover/focus states | TASK-01, TASK-02, TASK-03 | Visual regression risk is Low — DS Button is additive improvement |
| UX / states | DS Button provides hover/focus/disabled states automatically; replaces manual className patterns | TASK-02, TASK-03 | No UX regression expected |
| Security / privacy | N/A | - | No auth or data exposure changes |
| Logging / observability / audit | N/A | - | No log or audit changes |
| Testing / validation | ESLint `ds/enforce-layout-primitives` → 0 warnings gate; TypeScript typecheck validates imports; snapshot updates in same commit | TASK-01, TASK-02, TASK-03 | CI-only test run; snapshot updates needed |
| Data / contracts | N/A | - | Purely presentational changes, no schema or API changes |
| Performance / reliability | N/A | - | CSS class changes only; no render path changes |
| Rollout / rollback | No migration; rollback = revert commit | All tasks | Low risk; purely visual |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03 | None | All 3 tasks are disjoint — zero file overlap. Run as parallel subagents. |

## Delivered Processes
None: no material process topology change — all changes are className/import replacements within component files.

## Tasks

---

### TASK-01: Fix all inline style attributes (4 files)
- **Type:** IMPLEMENT
- **Deliverable:** code-change — remove all `style={{}}` attributes from 4 reception component files
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Build evidence:** Commit `4234b13812`. Tooltip.tsx: removed 2× `style={{ zIndex: 9999 }}`; wrapped CustomTooltip in `<div className="ml-[100px]">` with targeted `ds/no-raw-spacing,ds/no-arbitrary-tailwind` eslint-disable [DS-06]. _BookingTooltip.tsx: removed `zIndex: 10000` from style object; added `z-50` to className. RowCell.tsx: added `"opacity-50": isDragging, "opacity-100": !isDragging` to clsx; removed `style={{ opacity: ... }}`. KeycardDepositMenu.tsx: no change needed (JS-computed position only, no static zIndex). TypeScript clean; ESLint 0 errors on affected files.
- **Affects:**
  - `apps/reception/src/components/checkins/tooltip/Tooltip.tsx`
  - `apps/reception/src/components/checkins/keycardButton/KeycardDepositMenu.tsx`
  - `apps/reception/src/components/roomgrid/components/Row/RowCell.tsx`
  - `apps/reception/src/components/roomgrid/_BookingTooltip.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 88%
  - Implementation: 90% — exact file:line locations confirmed; fix patterns are trivial (remove redundant zIndex, add conditional className, keep JS-computed positions)
  - Approach: 90% — `z-50` Tailwind class confirmed already present on Tooltip elements; `opacity-50`/`opacity-100` pattern is established; only marginLeft needs `ml-[100px]`
  - Impact: 82% — purely visual; z-index rendering differences would only appear if `z-50` is insufficient (confirmed it covers the need for these tooltip layers)
- **Acceptance:**
  - `grep -rn "style={{" apps/reception/src/components/checkins/tooltip/Tooltip.tsx` → 0 results
  - `grep -rn "zIndex" apps/reception/src/components/checkins/keycardButton/KeycardDepositMenu.tsx` → 0 results (style block remains but contains only JS-computed dynamic position values — no static properties to remove)
  - `grep -rn "style={{" apps/reception/src/components/roomgrid/components/Row/RowCell.tsx` → 0 results
  - `grep -n "zIndex" apps/reception/src/components/roomgrid/_BookingTooltip.tsx` → 0 results (style block retains JS-computed position/top/left after zIndex removal; `z-50` added to className)
  - TypeScript typecheck clean for affected files
  - Expected user-observable behavior: tooltips and booking popups continue to appear on top of other elements; room grid drag opacity still works (50% while dragging)
- **Engineering Coverage:**
  - UI / visual: Required — remove inline styles that override CSS cascade; z-index coverage verified via `z-50` class
  - UX / states: Required — RowCell opacity drag state preserved via conditional Tailwind class
  - Security / privacy: N/A — no auth or data changes
  - Logging / observability / audit: N/A
  - Testing / validation: Required — TypeScript typecheck clean; `grep` for remaining static `style={{` in affected files = 0 (dynamic JS-computed position style blocks in `_BookingTooltip.tsx` and `KeycardDepositMenu.tsx` intentionally remain)
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: Required — rollback = revert commit; no migration needed
- **Validation contract (TC-01):**
  - TC-01: `Tooltip.tsx` lines 59, 99 — `style={{ zIndex: 9999 }}` removed; `z-50` class already present ensures correct stacking → typecheck clean
  - TC-02: `Tooltip.tsx` line 101 — `style={{ marginLeft: "100px" }}` on `CustomTooltip` removed; replaced with `ml-[100px]` className → typecheck clean, no layout change
  - TC-03: `_BookingTooltip.tsx` line 31 — `style={{ position: "fixed", top: position.y + 10, left: position.x + 10, zIndex: 10000 }}` → keep `position: "fixed"`, `top: position.y + 10`, `left: position.x + 10` as JS-computed inline style (required for dynamic positioning); remove `zIndex: 10000` from the style object; add `z-50` to className instead → typecheck clean
  - TC-04: `KeycardDepositMenu.tsx` — style block at line 61 contains only JS-computed dynamic position values (`position: "absolute"`, `top: menuPosition.top`, `left: menuPosition.left`); these cannot be replaced with Tailwind classes. No static properties (e.g. zIndex) are present to remove. Verified state: style block remains exactly as-is; no change made; `grep -rn "zIndex" apps/reception/src/components/checkins/keycardButton/KeycardDepositMenu.tsx` → 0 results (i.e. no static zIndex removal needed). Note: the overall acceptance criterion `grep -rn "style={{" apps/reception/src/components/` WILL still match this file because JS-computed position must remain — the overall acceptance criterion should be scoped to exclude JS-computed dynamic position style blocks.
  - TC-05: `RowCell.tsx` line 158 — `style={{ opacity: isDragging ? 0.5 : 1 }}` → `className={cn({ "opacity-50": isDragging, "opacity-100": !isDragging })}` or equivalent → typecheck clean
- **Execution plan:**
  - Read each file to confirm current state before editing.
  - `Tooltip.tsx`: Remove `style={{ zIndex: 9999 }}` from lines 59 and 99 (both elements already have `z-50` className). Remove `style={{ marginLeft: "100px" }}` from `CustomTooltip` on line 101; add `className="ml-[100px]"` (or extend existing className prop if present).
  - `_BookingTooltip.tsx`: Edit style object to remove only the `zIndex: 10000` key; keep `position`, `top`, `left` as computed. Add `z-50` to className on the same element.
  - `KeycardDepositMenu.tsx`: Verify the style block contains only `position`, `top`, `left` (no static zIndex). If any static zIndex is present, remove it and add `z-50` className. If no zIndex, no change needed (style block already minimal).
  - `RowCell.tsx`: Replace `style={{ opacity: isDragging ? 0.5 : 1 }}` with `className={cn({ "opacity-50": isDragging, "opacity-100": !isDragging })}`. Ensure `cn` utility is imported.
  - Verify TypeScript compiles cleanly for all 4 files.
- **Planning validation:**
  - Checks run: `grep -n "style={{"` on all 4 files (confirmed exact locations); `grep -n "z-50\|z-\[" ` on Tooltip.tsx (confirms `z-50` already present on both elements at lines 59 and 99)
  - Validation artifacts: 6 inline style locations confirmed at known lines; `z-50` confirmed present
  - Unexpected findings: `KeycardDepositMenu.tsx` style block has no static zIndex (only position/top/left) — no zIndex removal needed there; TC-04 therefore verifies via grep rather than a style-object change
- **Scouts:** Read `Tooltip.tsx` lines 55-105 before editing to confirm `z-50` class is on the same element as the `style` prop (not a parent/child mismatch). Read `_BookingTooltip.tsx` lines 25-40 to confirm the full style object.
- **Edge Cases & Hardening:** The `CustomTooltip` component in `Tooltip.tsx` line 101 receives a `style` prop — check if it also accepts a `className` prop; if not, the marginLeft needs to be applied to a wrapper div instead.
- **What would make this >=90%:** Confirming that `CustomTooltip` accepts a `className` prop (or wrapping it in a `<div className="ml-[100px]">`) — this is trivially resolvable at build time.
- **Rollout / rollback:**
  - Rollout: Deploy with next reception app build; no migration.
  - Rollback: `git revert` the commit; no data to restore.
- **Documentation impact:** None.
- **Notes / references:**
  - `z-50` is Tailwind's `z-index: 50` — confirmed sufficient for tooltip layers in this app
  - `ml-[100px]` is an acceptable arbitrary Tailwind value (there is no DS token for 100px; the inline style is the violation, not the pixel value)
  - `_BookingTooltip.tsx` and `KeycardDepositMenu.tsx` dynamic positions are JS-computed and must remain in the `style` prop

---

### TASK-02: Convert inbox + ScreenHeader DS violations (8 files)
- **Type:** IMPLEMENT
- **Deliverable:** code-change — replace raw `<button>` elements with DS Button; replace ESLint-flagged flex/grid with DS layout primitives; resolve 2 arbitrary bracket values; in 8 files (6 inbox + ScreenHeader + DraftReviewPanel)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-13)
- **Build evidence:** Commit `4234b13812`. TemplatePicker: Button+Cluster imports; locale/browse/category/chip buttons → DS Button. InboxWorkspace: back+tab buttons → DS Button. FilterBar: Button+Cluster imports; flex container → Cluster; filter+clear buttons → DS Button. ThreadList: Button+Inline imports; badge span → Inline; thread row → DS Button. ThreadDetailPane: Button import; load-earlier button → DS Button; removed `inline-flex items-center` from Button className (ESLint). AnalyticsSummary: Button import; retry → DS Button. ScreenHeader: Inline import; flex div → Inline. DraftReviewPanel: Inline+Grid imports; 3 flex/grid containers → DS primitives; fixed `justify="between"` → `className="justify-between"`; fixed `gap={1.5}` → `className="gap-1.5"`. TypeScript clean; 0 enforce-layout-primitives warnings in TASK-02 scope.
- **Affects:**
  - `apps/reception/src/components/inbox/TemplatePicker.tsx` (5 raw buttons + 1 ESLint layout warning)
  - `apps/reception/src/components/inbox/InboxWorkspace.tsx` (3 raw buttons)
  - `apps/reception/src/components/inbox/FilterBar.tsx` (2 raw buttons + 1 ESLint layout warning)
  - `apps/reception/src/components/inbox/ThreadList.tsx` (1 raw button + 1 ESLint inline-flex warning + `max-h-[calc(100vh-12rem)]` bracket value)
  - `apps/reception/src/components/inbox/ThreadDetailPane.tsx` (1 raw button + 1 ESLint inline-flex warning + `max-h-[50vh]` bracket value)
  - `apps/reception/src/components/inbox/AnalyticsSummary.tsx` (1 raw button)
  - `apps/reception/src/components/common/ScreenHeader.tsx` (1 ESLint flex warning — line 37)
  - `apps/reception/src/components/inbox/DraftReviewPanel.tsx` — already uses DS Button (no raw button conversion needed); ESLint layout primitive fixes only (3 warnings: lines 266 flex, 315 grid, 383 flex)
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 88% — all target files and line numbers confirmed via grep; DraftReviewPanel already uses DS Button (no button conversion needed there, layout primitives only)
  - Approach: 85% — DS Button and primitives import paths confirmed; `ThreadList` and `ThreadDetailPane` bracket values are layout heights that may need design decision on DS primitive equivalent
  - Impact: 82% — inbox is the most complex screen area; layout primitive conversion may have subtle visual delta requiring snapshot update
- **Acceptance:**
  - `grep -rn "<button" apps/reception/src/components/inbox/ apps/reception/src/components/common/ScreenHeader.tsx` → 0 results
  - `pnpm --filter @apps/reception exec eslint src/components/inbox/ src/components/common/ScreenHeader.tsx 2>&1 | grep "enforce-layout-primitives"` → 0 lines (scoped to TASK-02 files only; hub file warnings are TASK-03's responsibility)
  - TypeScript typecheck clean for all 7 affected files
  - Snapshot tests updated if className changes trigger snapshot failures
  - Expected user-observable behavior: inbox tabs/filters/templates/thread items function identically; ScreenHeader layout unchanged; DS Button hover/focus states are applied uniformly
- **Engineering Coverage:**
  - UI / visual: Required — raw button → DS Button; flex container → DS layout primitive; bracket values remain (acceptable for dynamic viewport heights)
  - UX / states: Required — DS Button provides consistent hover/focus/disabled states; filter toggles and tab strip behaviour preserved
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — ESLint 0-warnings gate for inbox + ScreenHeader; TypeScript typecheck; snapshot updates if triggered
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: Required — rollback = revert commit
- **Validation contract (TC-02):**
  - TC-01: All `<button` instances in 6 inbox files replaced with `<Button` from `@acme/design-system/atoms` → grep shows 0 raw buttons; typecheck clean
  - TC-02: `ScreenHeader.tsx` and inbox files — `pnpm eslint --rule ds/enforce-layout-primitives` shows 0 warnings for these files
  - TC-03: `ThreadList.tsx` and `ThreadDetailPane.tsx` bracket values (`max-h-[calc(100vh-12rem)]`, `max-h-[50vh]`) — these are acceptable arbitrary values for dynamic viewport heights; they should NOT be flagged by `ds/enforce-layout-primitives` (which targets flex/grid, not sizing utilities); verify no ESLint warning on these lines
  - TC-04: `DraftReviewPanel.tsx` layout warnings resolved (3 flex containers → DS primitives); no new raw buttons introduced
- **Execution plan:**
  - For each of the 6 inbox files + ScreenHeader: read the file first to identify each raw `<button>`'s role (toggle? navigation? action?) → choose DS Button variant:
    - Navigation/back buttons: `<Button tone="ghost" color="default">`
    - Tab/filter toggles: `<Button tone="ghost" color="default">` with active state via className
    - Template selection rows (TemplatePicker): `<Button tone="ghost" color="default" className="w-full justify-start">`
    - Thread list item clickable row (ThreadList): `<Button tone="ghost" color="default" className="w-full text-left">`
    - Load-earlier action (ThreadDetailPane): `<Button tone="ghost" color="default">`
    - Retry action (AnalyticsSummary): `<Button tone="outline" color="default">`
  - For ESLint-flagged flex containers (TemplatePicker, FilterBar, ThreadList, ThreadDetailPane, DraftReviewPanel, ScreenHeader): replace `<div className="flex items-center gap-X">` with `<Inline gap={X}>`, `<div className="flex flex-col gap-X">` with `<Stack gap={X}>`, `<div className="flex flex-wrap gap-X">` with `<Cluster gap={X}>`. Import from `@acme/design-system/primitives`.
  - Bracket values `max-h-[calc(100vh-12rem)]` and `max-h-[50vh]`: verify these are NOT flagged by `ds/enforce-layout-primitives` (rule targets flex/grid, not max-height). If flagged, keep as-is and add targeted `// eslint-disable-next-line ds/enforce-layout-primitives` with comment explaining these are dynamic viewport heights with no DS token equivalent.
- **Planning validation:**
  - Checks run: `grep -rn "<button"` on all inbox files (counts confirmed); `grep -n "flex\|grid" apps/reception/src/components/common/ScreenHeader.tsx` (confirmed flex usage)
  - Validation artifacts: Button counts confirmed (13 total across 6 inbox files); DraftReviewPanel already using DS Button (confirmed import at line 6); ScreenHeader flex usage confirmed
  - Unexpected findings: DraftReviewPanel already imports `Button` and uses it for all 5 action buttons (lines 386-457) — no raw button conversion needed there; only layout primitive conversion for the 3 flex container warnings
- **Scouts:** Read `TemplatePicker.tsx` lines 120-270 before editing to understand the locale/browse toggle vs template row vs locale-selector button contexts — different variants needed for each.
- **Edge Cases & Hardening:** Filter toggle buttons in `FilterBar.tsx` that conditionally apply active styling — DS Button's `tone` prop may not directly expose an "active/selected" state. Use `className` prop on `Button` for the active state override, or use `tone="solid"` for active vs `tone="ghost"` for inactive.
- **What would make this >=90%:** Confirming DS Button's `className` prop correctly merges with its base classes (standard in DS Button implementations using `cn()`).
- **Rollout / rollback:**
  - Rollout: Deploy with next reception app build; no migration.
  - Rollback: `git revert` the commit.
- **Documentation impact:** None.
- **Notes / references:**
  - DraftReviewPanel already uses DS Button (already converted in a prior pass) — only its 3 layout primitive warnings need fixing
  - `max-h-[calc(100vh-12rem)]` and `max-h-[50vh]` are dynamic viewport heights with no token equivalent — acceptable arbitrary values; these are Class 4 violations (bracket values) but may not be flagged by the ESLint layout rule

---

### TASK-03: Convert remaining raw buttons and hub ESLint warnings (12 files)
- **Type:** IMPLEMENT
- **Deliverable:** code-change — replace raw `<button>` elements with DS Button AND fix ESLint `ds/enforce-layout-primitives` warnings in 12 remaining reception component files
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-13)
- **Build evidence:** Commit `4234b13812`. StaffAccountsForm: Button+Inline imports; 5 buttons → DS Button (primary/outline/danger); Inline for flex-wrap containers. EodChecklistContent: Button import; 3 buttons → DS Button (outline/solid/warning-outline). PayModal: Button import; SelectCard → Button passthrough; Cancel/Confirm → outline/solid. OrderList: Button import; Pay/Clear → solid/danger-outline. TillShiftHistory: Button added; expand → Button passthrough. StockHub/EodHub/CashHub/AnalyticsHub: Button+Inline imports; tab container div → Inline; tab buttons → Button passthrough. CheckinsTable: Button added; Rooms Ready → solid. OfflineIndicator: Button import; Retry → ghost. withIconModal: Button passthrough (already imported). TypeScript clean; 0 raw buttons; 0 enforce-layout-primitives warnings in TASK-03 scope.
- **Affects:**
  - `apps/reception/src/components/userManagement/StaffAccountsForm.tsx` (5 raw buttons + 2 ESLint warnings: lines 486, 558)
  - `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx` (3 raw buttons)
  - `apps/reception/src/components/bar/orderTaking/modal/PayModal.tsx` (3 raw buttons)
  - `apps/reception/src/components/bar/orderTaking/OrderList.tsx` (2 raw buttons)
  - `apps/reception/src/components/till/TillShiftHistory.tsx` (1 raw button)
  - `apps/reception/src/components/stock/StockHub.tsx` (1 raw button + 1 ESLint warning: line 20)
  - `apps/reception/src/components/eod/EodHub.tsx` (1 raw button + 1 ESLint warning: line 20)
  - `apps/reception/src/components/checkins/view/CheckinsTable.tsx` (1 raw button)
  - `apps/reception/src/components/cash/CashHub.tsx` (1 raw button + 1 ESLint warning: line 23)
  - `apps/reception/src/components/analytics/AnalyticsHub.tsx` (1 raw button + 1 ESLint warning: line 26)
  - `apps/reception/src/components/OfflineIndicator.tsx` (1 raw button)
  - `apps/reception/src/hoc/withIconModal.tsx` (1 raw button — icon-tile grid item with complex styling)
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 87%
  - Implementation: 90% — all files confirmed via grep; button counts confirmed; withIconModal already imports DS Button and Grid
  - Approach: 87% — DS Button variant selection is clear for most single-button hub files; `withIconModal.tsx` icon-tile uses `compatibilityMode="passthrough"` with full className override (avoids inline-flex/flex-col class conflict)
  - Impact: 83% — mostly simple hub-page buttons; withIconModal HOC change affects all icon-modal trigger sites (read consumers before changing)
- **Acceptance:**
  - `grep -rn "<button" apps/reception/src/components/userManagement/ apps/reception/src/components/eodChecklist/ apps/reception/src/components/bar/orderTaking/ apps/reception/src/components/till/ apps/reception/src/components/stock/ apps/reception/src/components/eod/ apps/reception/src/components/checkins/view/ apps/reception/src/components/cash/ apps/reception/src/components/analytics/ apps/reception/src/components/OfflineIndicator.tsx apps/reception/src/hoc/withIconModal.tsx` → 0 results
  - `pnpm --filter @apps/reception exec eslint src/components/userManagement/StaffAccountsForm.tsx src/components/stock/StockHub.tsx src/components/eod/EodHub.tsx src/components/cash/CashHub.tsx src/components/analytics/AnalyticsHub.tsx 2>&1 | grep "enforce-layout-primitives"` → 0 lines
  - TypeScript typecheck clean for all 12 files
  - `withIconModal.tsx` HOC consumers render identically (icon-tile grid layout preserved)
  - Expected user-observable behavior: bar, till, eod, stock, cash, analytics hub buttons get consistent DS hover/focus states; staff account form actions preserved; offline indicator retry button works; icon-modal tile grid unchanged in appearance
- **Engineering Coverage:**
  - UI / visual: Required — raw button → DS Button; visual intent preserved via variant/tone selection
  - UX / states: Required — DS Button adds consistent hover/focus/disabled states; no regressions expected
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — TypeScript typecheck; grep for remaining `<button` in affected files = 0; ESLint enforce-layout-primitives → 0 warnings for hub/StaffAccountsForm files
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: Required — rollback = revert commit
- **Validation contract (TC-03):**
  - TC-01: All `<button` instances in 12 files replaced with `<Button` from DS atoms → grep 0 raw buttons; typecheck clean
  - TC-02: `withIconModal.tsx` HOC — icon-tile button converted to `<Button compatibilityMode="passthrough" disabled={!effectiveInteractive} onClick={...} className={cn("flex flex-col ...")}>` — `compatibilityMode="passthrough"` bypasses DS Button BASE_CLASSES to avoid `inline-flex` vs `flex-col` class conflict; tile visual appearance unchanged; TypeScript typecheck clean; no `<button` raw instances remain in `withIconModal.tsx`
  - TC-03: Hub files (StockHub, EodHub, CashHub, AnalyticsHub) — each has 1 simple action button; variant choice: `tone="outline" color="default"` or `tone="ghost" color="default"` based on existing className evidence
  - TC-04: ESLint layout warnings in hub files and StaffAccountsForm fixed — `pnpm exec eslint src/components/analytics/AnalyticsHub.tsx src/components/cash/CashHub.tsx src/components/eod/EodHub.tsx src/components/stock/StockHub.tsx src/components/userManagement/StaffAccountsForm.tsx 2>&1 | grep "enforce-layout-primitives"` → 0 lines
- **Execution plan:**
  - For each file: read the file first to identify each raw `<button>`'s role and current className → choose DS Button variant.
  - Hub files (StockHub, EodHub, CashHub, AnalyticsHub) — each has 1 button with a simple action (e.g. "Go to X"). Use `<Button tone="outline" color="default">` if bordered, `tone="ghost"` if borderless.
  - `TillShiftHistory.tsx` — 1 button (likely a row action or expand). Read line 254 context; use `tone="ghost" color="default"`.
  - `CheckinsTable.tsx` — 1 button. Read line 156 context; likely a row action. Use `tone="ghost" color="default"`.
  - `OfflineIndicator.tsx` — 1 button (retry). Use `tone="outline" color="default"`.
  - `StaffAccountsForm.tsx` — 5 buttons. Read lines 425, 432, 502, 546, 578. Likely form actions (save, cancel, toggle). Use `color="primary" tone="solid"` for primary actions, `tone="ghost"` for secondary/cancel.
  - `EodChecklistContent.tsx` — 3 buttons. Read lines 242, 271, 282. Likely checklist item actions.
  - `PayModal.tsx` — 3 buttons (line 33 is likely a payment type selector, lines 113/120 confirm/cancel). Use appropriate variants based on context.
  - `OrderList.tsx` — 2 buttons (lines 90, 98). Likely order item actions.
  - `withIconModal.tsx` — icon-tile `<button>` at line 87: already imports `Button` from DS; convert to `<Button compatibilityMode="passthrough" disabled={!effectiveInteractive} onClick={() => handleActionClick(action.route)} className={cn("flex flex-col items-center justify-center gap-3 rounded-lg border bg-surface-2 p-5 transition-all duration-150 text-center", effectiveInteractive ? "cursor-pointer border-border-2 text-primary-main hover:border-primary hover:bg-primary-soft active:scale-95" : "cursor-not-allowed border-border-1 text-muted-foreground opacity-40")}>`. Use `compatibilityMode="passthrough"` to bypass DS Button's BASE_CLASSES (which includes `inline-flex`) — this prevents an `inline-flex` vs `flex-col` class conflict with the tile layout. Ensure `asChild` is NOT used here (complex multi-child content: Icon + span requires Slot to receive exactly one child element, which it cannot).
  - For ESLint-flagged flex containers in hub files (AnalyticsHub:26, CashHub:23, EodHub:20, StockHub:20) and StaffAccountsForm (486, 558): replace `<div className="flex ...">` with the appropriate DS primitive (`<Inline>` for horizontal, `<Stack>` for vertical). Import `Inline` or `Stack` from `@acme/design-system/primitives` if not already imported in that file.
- **Planning validation:**
  - Checks run: `grep -rn "<button"` on all 12 files (counts confirmed); checked `withIconModal.tsx` — already imports `Button` and `Grid` from DS
  - Validation artifacts: withIconModal confirmed to import DS Button (line 5) and Grid (line 6); existing DS Button use at line 78 confirms API familiarity
  - Unexpected findings: withIconModal HOC renders icon-tiles with complex multi-child content (Icon + span) — `asChild` is NOT appropriate; use `Button` with `compatibilityMode="passthrough"` and full className override. ESLint layout warnings DO exist in 5 of the 12 files (AnalyticsHub, CashHub, EodHub, StockHub, StaffAccountsForm — live lint confirmed on 2026-03-13); this task covers both raw button conversion AND layout primitive fixes for those files.
- **Scouts:** Read `PayModal.tsx` lines 25-130 to understand the 3-button layout (payment method selector, confirm, cancel) before choosing variants. Read `StaffAccountsForm.tsx` lines 420-590 to understand the 5-button form flow. Read the single `<button>` in each hub file (StockHub.tsx, EodHub.tsx, CashHub.tsx, AnalyticsHub.tsx) and record its current className before choosing DS Button variant — the outline/ghost decision must be pre-committed from the className evidence, not inferred at edit time.
- **Edge Cases & Hardening:** `withIconModal.tsx` — with `compatibilityMode="passthrough"`, DS Button renders ONLY the provided className; the DS Button's BASE_CLASSES (including `inline-flex`, `disabled:opacity-50`) are NOT applied. This means the tile's manual `cursor-not-allowed` and `opacity-40` classes in the className are the only disabled-state styles — no duplication risk. Verify the `disabled` prop still prevents click events (it does: `compatibilityMode="passthrough"` still forwards `disabled` to the underlying `<button>` element).
- **What would make this >=90%:** Reading `PayModal.tsx` and `StaffAccountsForm.tsx` before writing the task to confirm variant choices — fully resolvable at build time.
- **Rollout / rollback:**
  - Rollout: Deploy with next reception app build; no migration.
  - Rollback: `git revert` the commit.
- **Documentation impact:** None.
- **Notes / references:**
  - `withIconModal.tsx` already imports DS Button (line 5) and Grid (line 6) — partial conversion was done previously. The icon-tile raw button at line 87 is the only remaining violation. Use `compatibilityMode="passthrough"` to avoid DS Button BASE_CLASSES class conflict with the tile layout's `flex-col` requirement.
  - 5 of the 12 files (AnalyticsHub, CashHub, EodHub, StockHub, StaffAccountsForm) have ESLint `ds/enforce-layout-primitives` warnings (6 total: lines confirmed from live lint). Both raw button conversion AND layout primitive fixes are required for those 5 files.

---

## Risks & Mitigations
- Wrong DS Button variant on a hub button: Low likelihood, Low impact. Build agent reads each button's className before choosing variant. Rollback = revert.
- `withIconModal` HOC visual regression: Low likelihood, Low impact. Icon-tile uses `Button` with `compatibilityMode="passthrough"` (not `asChild`); only the provided className applies — no class conflict from DS Button BASE_CLASSES.
- Snapshot test failures from className changes: Low likelihood, Low impact. Update snapshots in same task commit; CI validates.
- ESLint `ds/enforce-layout-primitives` count does not reach 0: Low likelihood. Live lint run (2026-03-13) confirms exactly 14 warnings across 11 files — all covered by TASK-02 (8 warnings in inbox/ScreenHeader/DraftReviewPanel) and TASK-03 (6 warnings in hub/StaffAccountsForm files). No scope expansion needed.

## Observability
- Logging: None required.
- Metrics: None required.
- Alerts/Dashboards: None required.

## Acceptance Criteria (overall)
- [ ] `grep -rn "style={{" apps/reception/src/components/` → 0 results excluding `KeycardDepositMenu.tsx` and `_BookingTooltip.tsx` (which retain JS-computed dynamic position values that have no Tailwind equivalent); all static-only style blocks removed (TASK-01 complete)
- [ ] `grep -rn "<button" apps/reception/src/` → 0 results (TASK-02 + TASK-03 complete)
- [ ] `pnpm --filter @apps/reception lint 2>&1 | grep "enforce-layout-primitives"` → 0 lines (TASK-02 + TASK-03 complete)
- [ ] TypeScript typecheck clean for apps/reception
- [ ] All snapshot tests updated and passing in CI

## Decision Log
- 2026-03-13: Chose Option A (targeted mechanical conversion, 3 parallel tasks). Options B (wholesale rewrite), C (ESLint suppression), D (partial scope) rejected. See analysis.md.
- 2026-03-13: `withIconModal.tsx` HOC: use `Button` with `compatibilityMode="passthrough"` (not `asChild`, not plain variant). Reason: (1) `asChild` requires exactly one child element — tile has multiple children (Icon + span); (2) plain variant approach causes `inline-flex` from DS Button BASE_CLASSES to conflict with tile layout's `flex-col` in className; (3) `compatibilityMode="passthrough"` is a confirmed DS Button API prop (`ButtonCompatibilityMode` type in `primitives/button.tsx:18`) that renders the button using only the provided className, eliminating the class conflict.
- 2026-03-13: `max-h-[calc(100vh-12rem)]` and `max-h-[50vh]` bracket values retained — these are dynamic viewport heights with no DS token equivalent; Class 4 violations but not flagged by `ds/enforce-layout-primitives` (layout rule targets flex/grid, not sizing).

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Fix inline styles | Yes — all 4 files confirmed with exact line numbers | _BookingTooltip.tsx and KeycardDepositMenu.tsx retain JS-computed position style blocks (not removable); acceptance criteria scoped to zIndex grep, not full style= grep | Acceptance criteria updated; no execution block |
| TASK-02: Inbox + ScreenHeader | Yes — ESLint baseline confirmed at 14 warnings via live lint; 8 warnings in TASK-02 scope files confirmed | None | No |
| TASK-03: Remaining raw buttons + hub ESLint | Yes — 12 files confirmed; withIconModal already imports DS Button; 6 ESLint warnings in 5 hub/StaffAccountsForm files confirmed | withIconModal conversion uses compatibilityMode="passthrough" to avoid inline-flex/flex-col class conflict; ESLint warnings in hub files added to scope | No |
| Wave 1 (all 3 parallel) | Yes — zero file overlap between all 3 tasks confirmed | None | No |

## Overall-confidence Calculation
- S=1, M=2, L=3
- TASK-01: 88% × 1 = 88
- TASK-02: 85% × 2 = 170
- TASK-03: 87% × 2 = 174
- Overall = (88 + 170 + 174) / (1 + 2 + 2) = 432 / 5 = **86%**
