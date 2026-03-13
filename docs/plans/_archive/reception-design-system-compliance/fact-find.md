---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: Platform
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: reception-design-system-compliance
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/reception-design-system-compliance/analysis.md
Trigger-Source: operator
Trigger-Why: Every screen in the reception app should use a consistent, themeable visual language. The current state has three categories of violation that actively block the theme system or produce inconsistent UX: inline styles that override the cascade, raw button elements that bypass interaction patterns, and raw flex/grid classes where DS layout primitives should be used.
Trigger-Intended-Outcome: type: operational | statement: All reception app screens use DS Button for interactive elements, DS layout primitives (Inline/Stack/Cluster/Cover) wherever the ESLint rule flags raw flex/grid on leaf elements, and no inline style attributes remain in any component file. | source: operator
---

# Reception Design System Compliance — Fact-Find Brief

## Scope

### Summary
Three categories of design system violation remain in the reception app after prior theming passes (bar-pos and till-safe theming overhauls are complete, semantic tokens are used throughout). This fact-find scopes and verifies the remaining violations before planning targeted fixes.

### Goals
- Eliminate all inline `style={{}}` attributes that override the CSS cascade and block the theme system.
- Replace all raw `<button>` elements with the DS `Button` component for consistent interaction states, focus rings, and accessibility.
- Replace raw `flex`/`grid` className usage on elements flagged by `ds/enforce-layout-primitives` ESLint rule with DS layout primitives (`Inline`, `Stack`, `Cluster`, `Cover` from `@acme/design-system/primitives`).

### Non-goals
- Semantic token compliance (already complete — zero hardcoded palette colours found in audit).
- Converting layout classes on elements that are NOT flagged by the ESLint rule (the rule scopes correctly to leaf elements).
- Design or UX changes — purely mechanical compliance fixes.

### Constraints & Assumptions
- Constraints:
  - DS Button must be imported from `@acme/design-system/atoms` (established pattern throughout reception app).
  - DS layout primitives imported from `@acme/design-system/primitives` (established in SafeManagement.tsx, LoanedItemsList.tsx).
  - Reception app uses Turbopack — no webpack-specific import aliases needed.
  - CI-only tests; never run jest locally.
- Assumptions:
  - `RowCell.tsx` inline opacity for drag state can be replaced with `opacity-50` Tailwind class conditionally (`isDragging ? "opacity-50" : "opacity-100"`) — standard pattern.
  - Tooltip/BookingTooltip inline positions require Tailwind equivalents or a different positioning strategy; may need `absolute`/`fixed` Tailwind classes.
  - `withIconModal.tsx` raw button: this is a HOC and the conversion must preserve the rendered output contract.

## Outcome Contract

- **Why:** Every reception screen should use a consistent themeable visual language. Inline styles override the CSS cascade, raw buttons bypass DS interaction patterns, and unflagged layout classes make theming harder to iterate. The prior bar-pos and till-safe theming passes fixed semantic tokens; this pass fixes structural compliance.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All reception app components use DS Button for interactive elements, DS layout primitives where the ESLint rule flags violations, and contain zero inline style attributes. ESLint `ds/enforce-layout-primitives` warning count drops to 0.
- **Source:** operator

## Current Process Map

None: local code path only — no multi-step process, workflow, or CI/deploy lane changes.

## Evidence Audit (Current State)

### Entry Points
- `apps/reception/src/components/` — all component directories are affected

### Key Modules / Files

**Class 1 — Inline styles (4 files, 6 instances):**
- `apps/reception/src/components/checkins/tooltip/Tooltip.tsx` — `style={{ zIndex: 9999 }}` × 2 (lines 59, 99); `style={{ marginLeft: "100px" }}` (line 101); z-index redundant with `z-50` Tailwind class
- `apps/reception/src/components/roomgrid/_BookingTooltip.tsx` — `style={{ position: "fixed", top: position.y + 10, left: position.x + 10, zIndex: 10000 }}` (lines 31–36)
- `apps/reception/src/components/checkins/keycardButton/KeycardDepositMenu.tsx` — `style={{ position: "absolute", top: menuPosition.top, left: menuPosition.left }}` (lines 61–65)
- `apps/reception/src/components/roomgrid/components/Row/RowCell.tsx` — `style={{ opacity: isDragging ? 0.5 : 1 }}` (line 158)

**Class 2 — Raw `<button>` elements (18 files, ~35 instances):**

Inbox group (6 files, ~13 instances):
- `apps/reception/src/components/inbox/TemplatePicker.tsx` — 5 raw buttons (locale/browse toggles, template selection rows)
- `apps/reception/src/components/inbox/InboxWorkspace.tsx` — 3 raw buttons (mobile tab strip, back navigation)
- `apps/reception/src/components/inbox/FilterBar.tsx` — 2 raw buttons (filter toggles)
- `apps/reception/src/components/inbox/ThreadList.tsx` — 1 raw button (thread list item, clickable row)
- `apps/reception/src/components/inbox/ThreadDetailPane.tsx` — 1 raw button (load-earlier action)
- `apps/reception/src/components/inbox/AnalyticsSummary.tsx` — 1 raw button (retry)

Other screens (~12 files, ~22 instances):
- `apps/reception/src/components/userManagement/StaffAccountsForm.tsx` — 5 raw buttons
- `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx` — 3 raw buttons
- `apps/reception/src/components/bar/orderTaking/modal/PayModal.tsx` — 3 raw buttons
- `apps/reception/src/components/bar/orderTaking/OrderList.tsx` — 2 raw buttons
- `apps/reception/src/components/till/TillShiftHistory.tsx` — 1 raw button
- `apps/reception/src/components/stock/StockHub.tsx` — 1 raw button
- `apps/reception/src/components/eod/EodHub.tsx` — 1 raw button
- `apps/reception/src/components/checkins/view/CheckinsTable.tsx` — 1 raw button
- `apps/reception/src/components/cash/CashHub.tsx` — 1 raw button
- `apps/reception/src/components/analytics/AnalyticsHub.tsx` — 1 raw button
- `apps/reception/src/components/OfflineIndicator.tsx` — 1 raw button
- `apps/reception/src/hoc/withIconModal.tsx` — 1 raw button (HOC, needs extra care)

**Class 3 — ESLint layout primitive warnings (7+ files, 14 flagged instances):**
- `apps/reception/src/components/inbox/DraftReviewPanel.tsx` — 3 warnings (flex containers)
- `apps/reception/src/components/userManagement/StaffAccountsForm.tsx` — 2 warnings
- `apps/reception/src/components/inbox/FilterBar.tsx` — 1 warning
- `apps/reception/src/components/inbox/TemplatePicker.tsx` — 1 warning
- `apps/reception/src/components/inbox/ThreadDetailPane.tsx` — 1 warning (inline-flex)
- `apps/reception/src/components/inbox/ThreadList.tsx` — 1 warning (inline-flex)
- `apps/reception/src/components/common/ScreenHeader.tsx` — 1 warning (flex)

**Class 4 — Arbitrary Tailwind bracket values (2 instances):**
- `apps/reception/src/components/inbox/ThreadList.tsx:197` — `max-h-[calc(100vh-12rem)]`
- `apps/reception/src/components/inbox/ThreadDetailPane.tsx:260` — `max-h-[50vh]`

### Patterns & Conventions Observed
- `Button` import: `import { Button } from "@acme/design-system/atoms"` — established in ActionButtons, CloseShiftForm, CreditSlipRegistry, man/*, loans/*
- Layout primitives import: `import { Cluster } from "@acme/design-system/primitives"` (SafeManagement), `import { Inline } from "@acme/design-system/primitives"` (LoanedItemsList) — path confirmed working in reception with Turbopack
- DS also exports `Stack`, `Cover`, `Sidebar`, `Grid` from same path
- Semantic token compliance is already complete — no hardcoded palette colours found

### Data & Contracts
- Types/schemas/events: None — all changes are className/import only, no data model changes
- Persistence: N/A
- API/contracts: N/A — purely presentational

### Dependency & Impact Map
- Upstream dependencies: `@acme/design-system/atoms` (Button), `@acme/design-system/primitives` (Inline, Stack, Cluster, Cover)
- Downstream dependents: No consumers of these components outside the reception app
- Likely blast radius: Visual-only; interaction semantics preserved (same events, same props)

### Test Landscape

#### Test Infrastructure
- Framework: Jest + React Testing Library
- Commands: CI-only (`pnpm --filter @apps/reception run test` — never run locally per policy)
- CI integration: Governed test runner in GitHub Actions

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Inbox | Unit | `apps/reception/src/test/` | Snapshot tests may capture className changes |
| Till | Unit | `apps/reception/src/hooks/__tests__/` | Hook tests, not component markup |
| Common | Unit | Various | Focused on behaviour, not layout class names |

#### Coverage Gaps
- No visual regression tests; layout class changes are not caught by existing unit tests
- Snapshot tests may need updating if they capture exact className strings

#### Testability Assessment
- Easy to test: TypeScript typecheck will catch import errors; ESLint will catch remaining violations
- Hard to test: Visual layout correctness requires manual review
- Test seams: The `ds/enforce-layout-primitives` ESLint rule provides deterministic validation — warning count must reach 0

### Recent Git History (Targeted)
- `aea95ee6b0` (2026-03-12) — `fix(reception/bar-pos-theming)`: Fixed 14 bar/POS theming issues; semantic tokens complete
- `0f96cd61fe` (2026-03-13) — `fix(reception)`: Till reconciliation 5 bug fixes; ActionButtons already uses DS Button

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | 18 files with raw buttons; 4 files with inline styles; 14 ESLint layout warnings | Inline styles block cascade; raw buttons inconsistent hover/focus; layout classes not themed | Yes — verify DS Button props match existing button intent (ghost, outline, default variants) |
| UX / states | Required | Existing buttons have hover/active states via manual className | DS Button provides consistent states automatically; risk of subtle visual delta on hover/active | Yes — confirm DS Button variant matches each raw button's visual role |
| Security / privacy | N/A | No auth or data exposure changes | — | No |
| Logging / observability / audit | N/A | No log or audit changes | — | No |
| Testing / validation | Required | ESLint rule provides deterministic gate; TypeScript typecheck catches import errors | Snapshot tests may need updates for className changes | Yes — validate ESLint warning count hits 0 post-build |
| Data / contracts | N/A | Purely presentational changes, no schema or API changes | — | No |
| Performance / reliability | N/A | CSS class changes, no render path changes | — | No |
| Rollout / rollback | Required | No migration; rollback = revert commit | Low risk; purely visual | Yes — note in plan |

## Confidence Inputs

- Implementation: 95% — all violations precisely enumerated; fix patterns are established in existing code
- Approach: 92% — DS Button and primitives path confirmed working in reception; import pattern established
- Impact: 88% — purely visual/structural; no business logic touched
- Delivery-Readiness: 93% — three non-overlapping task groups, full parallel execution possible
- Testability: 90% — ESLint rule provides deterministic post-build validation; typecheck gates import errors

What would raise each to ≥90: Already ≥90 for most. Impact could be raised to 92 by confirming DS Button `variant`/`tone`/`size` props cover all existing button visual patterns before build.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| DS Button default variant looks wrong in context | Low | Medium | Each raw button must specify the correct variant/tone; analysis agent reads each button's current className before choosing variant |
| Tooltip inline position replacement breaks layout | Medium | Medium | RowCell opacity is trivial; Tooltip/BookingTooltip absolute/fixed positions need Tailwind equivalent — may need `left-0 top-0` + JS-based transform or CSS variable injection |
| Snapshot test failures from className changes | Low | Low | Update snapshots in same task commit; tests are CI-only |
| withIconModal HOC raw button affects consuming components | Low | Low | HOC wraps a button — convert to DS Button with `asChild` or `variant="ghost"` and verify consuming sites |

## Planning Constraints & Notes
- Must-follow patterns:
  - `Button` from `@acme/design-system/atoms`
  - Layout primitives from `@acme/design-system/primitives`
  - `ds/enforce-layout-primitives` ESLint warning count must be 0 after build
- Rollout/rollback expectations: No migration; rollback = revert commit
- Observability expectations: N/A

## Suggested Task Seeds (Non-binding)
- TASK-01: Fix all inline styles (4 files — Tooltip.tsx, KeycardDepositMenu.tsx, RowCell.tsx, _BookingTooltip.tsx) — highest priority
- TASK-02: Inbox + ScreenHeader violations (raw buttons + layout warnings + bracket values — 7 files)
- TASK-03: All other raw buttons (12 files across bar, till, cash, eod, stock, analytics, userManagement, checkins, OfflineIndicator, withIconModal)

TASK-01, TASK-02, TASK-03 have fully disjoint file sets — eligible for parallel wave execution.

## Execution Routing Packet
- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: ESLint `ds/enforce-layout-primitives` 0 warnings; TypeScript typecheck clean; 0 inline style attributes remaining
- Post-delivery measurement plan: N/A

## Evidence Gap Review

### Gaps Addressed
- Raw button count: Verified via `grep -rn "<button"` — 35 instances in 18 files (not 97 as initial audit estimated)
- Layout violations: Confirmed 14 ESLint warnings from last CI run; these are the actionable set (not 118+ raw flex classes)
- DS primitives availability: Confirmed `@acme/design-system/primitives` exports Inline, Stack, Cluster, Cover, Grid; path works in reception (Turbopack verified via SafeManagement.tsx and LoanedItemsList.tsx)
- DS Button path: Confirmed `@acme/design-system/atoms` for Button — used in 10+ existing reception components
- Inline style locations: Confirmed exact files via `grep -rn "style={{"`

### Confidence Adjustments
- Button count reduced from 97 → 35 (audit was counting different things); confidence in scope raised to 95%
- Layout violations scoped to 14 ESLint-flagged instances (not all 242 raw flex uses); confidence in measurable completion gate raised to 90%

### Remaining Assumptions
- DS Button `variant`/`tone` props will cover all existing button roles without visual regressions — needs per-button analysis during build
- Tooltip inline position may need a different approach than pure Tailwind (dynamic JS positions) — analysis to confirm

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Inline styles (4 files) | Yes | None | No |
| Inbox raw buttons (6 files) | Yes | None | No |
| Other raw buttons (12 files) | Yes | [Advisory] withIconModal HOC needs extra care with asChild pattern | No |
| ESLint layout warnings (7 files) | Yes | None | No |
| Arbitrary bracket values (2 files) | Yes | [Advisory] dynamic height calc may need design decision | No |
| DS primitives import path | Yes | None | No |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** All violations precisely enumerated with file/line evidence. Three disjoint fix groups enable full parallel execution. Fix patterns established in existing code. Completion gated by deterministic ESLint check.

## Analysis Readiness
- Status: Ready-for-analysis
- Blocking items: None
- Recommended next step: `/lp-do-analysis reception-design-system-compliance`
