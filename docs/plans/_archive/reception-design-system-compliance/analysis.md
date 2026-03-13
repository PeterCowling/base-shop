---
Type: Analysis
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: reception-design-system-compliance
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/reception-design-system-compliance/fact-find.md
Related-Plan: docs/plans/reception-design-system-compliance/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Reception Design System Compliance — Analysis

## Decision Frame

### Summary
Three classes of DS violation remain in the reception app: inline `style={{}}` attributes (6 instances, 4 files), raw `<button>` elements (35 instances, 18 files), and raw flex/grid layout classes flagged by `ds/enforce-layout-primitives` ESLint rule (14 warnings, 7 files). The decision is how to sequence and execute the fixes — mechanically targeted per-file conversion vs. broader rewrites.

### Goals
- Zero inline `style={{}}` attributes across all reception components.
- All interactive elements use DS `Button` from `@acme/design-system/atoms`.
- All ESLint `ds/enforce-layout-primitives` warnings eliminated (DS layout primitives from `@acme/design-system/primitives`).

### Non-goals
- Semantic token compliance (complete). Structural component rewrites. UX/behaviour changes.

### Constraints & Assumptions
- DS Button: `@acme/design-system/atoms` — props: `color`, `tone`, `size`, `variant` (legacy), `asChild`, `leadingIcon`, `trailingIcon`. Pattern confirmed in 10+ existing reception components.
- DS layout primitives: `@acme/design-system/primitives` — `Inline`, `Stack`, `Cluster`, `Cover`, `Grid`. Pattern confirmed working in SafeManagement, LoanedItemsList (Turbopack-compatible).
- Dynamic JS-computed positions in Tooltip/BookingTooltip/KeycardDepositMenu must remain as computed values; only the static portions (z-index, redundant properties) are removable.

## Inherited Outcome Contract

- **Why:** Every reception screen should use a consistent, themeable visual language. Inline styles override the CSS cascade, raw buttons bypass DS interaction patterns, and unflagged layout classes make theming harder to iterate.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All reception app components use DS Button for interactive elements, DS layout primitives where the ESLint rule flags violations, and contain zero inline style attributes. ESLint `ds/enforce-layout-primitives` warning count drops to 0.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/reception-design-system-compliance/fact-find.md`
- Key findings used:
  - 35 raw `<button>` instances across 18 files (verified by grep)
  - 14 `ds/enforce-layout-primitives` ESLint warnings from last CI run (actionable set)
  - 6 inline style instances across 4 files (confirmed with file/line evidence)
  - DS Button `asChild` prop confirmed present — covers withIconModal HOC case
  - Dynamic positions in Tooltip/BookingTooltip/KeycardDepositMenu are JS-computed — cannot be pure Tailwind static classes

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Safety / blast radius | Changes spread across 18+ files; wrong variant choice causes visual regression | High |
| Completeness gate reliability | ESLint warning count must reach 0 — deterministic, not subjective | High |
| Execution speed | User requested parallel subagents; disjoint file groups enable this | Medium |
| Rollback ease | No schema/API changes; revert is always safe | Medium |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A — Targeted mechanical conversion | Per-file: read current className → pick DS Button variant/tone; replace ESLint-flagged flex/grid with DS primitives; remove inline styles with Tailwind equivalents (keep JS-computed dynamic values only) | Minimal blast radius; each file self-contained; 3 disjoint groups enable full parallelism | Requires reading each button's visual intent before choosing variant | Wrong variant on one button | Yes — **chosen** |
| B — Wholesale rewrite | Rewrite entire components fresh using DS components | Cleaner output | Much higher blast radius; triggers snapshot test failures across more areas; slower | High regression risk on complex inbox components | No |
| C — ESLint disable suppression | Add `// eslint-disable` comments to silence warnings | Zero code change risk | Does not fix the underlying issue; violates DS compliance goal | Permanent tech debt; blocks theme iteration | No |
| D — Remove inline styles only, defer buttons | Prioritise inline styles (immediate theme blocker) and defer raw buttons | Fastest for the critical path | Leaves 35 raw buttons unchecked; contradicts user directive to proceed with all at once | Incomplete | No |

## Engineering Coverage Comparison

| Coverage Area | Option A (targeted conversion) | Option B (wholesale rewrite) | Chosen implication |
|---|---|---|---|
| UI / visual | Per-button variant selection preserves visual intent; ESLint gate confirms completion | Wholesale rewrite risks visual regressions in complex components | Must read each button's current className before choosing DS Button variant |
| UX / states | DS Button provides hover/focus/disabled states automatically; replaces manual className patterns | Same result but higher change surface | DS Button states are additive improvements — no UX regression expected |
| Security / privacy | N/A — no auth or data changes | N/A | N/A |
| Logging / observability / audit | N/A | N/A | N/A |
| Testing / validation | ESLint `ds/enforce-layout-primitives` count = 0 is the deterministic gate; TypeScript typecheck validates imports; snapshot tests may need updates | More snapshot changes | ESLint gate is the primary completion signal |
| Data / contracts | No schema or API changes | No schema or API changes | N/A |
| Performance / reliability | CSS class changes only; no render path changes | Same | N/A |
| Rollout / rollback | No migration; rollback = revert commit | Same | Note in plan |

## Chosen Approach

- **Recommendation:** Option A — targeted mechanical conversion, executed as 3 parallel tasks with fully disjoint file sets.
- **Why this wins:** Minimal blast radius; each file change is self-contained and reviewable; the 3 task groups share zero files so subagents can run in parallel without conflict detection overhead; the ESLint gate provides deterministic completion verification; the DS Button variant selection is the only judgment call and each instance has visible className evidence to guide it.
- **What it depends on:** Reading each raw button's current className to determine the correct DS Button `color`/`tone`/`size` before replacing. For dynamic-position inline styles (Tooltip, BookingTooltip, KeycardDepositMenu), the JS-computed `top`/`left` values must remain — only the static `zIndex` and redundant properties are removed. RowCell opacity is trivially replaced with conditional Tailwind class (`isDragging ? "opacity-50" : "opacity-100"`).

### Approach detail — inline style handling

- `RowCell.tsx`: `style={{ opacity: isDragging ? 0.5 : 1 }}` → `className={isDragging ? "opacity-50" : "opacity-100"}` (or `cn({ "opacity-50": isDragging })`)
- `Tooltip.tsx`: Remove `style={{ zIndex: 9999 }}` (redundant with `z-50` class already present); remove `style={{ marginLeft: "100px" }}` → replace with Tailwind class `ml-[100px]` (acceptable arbitrary value — there is no DS token for 100px; the inline style is the violation, not the pixel value)
- `_BookingTooltip.tsx` / `KeycardDepositMenu.tsx`: Keep JS-computed top/left (required for click-relative positioning) but remove any hardcoded z-index from style — apply `z-50` via className instead

### Rejected Approaches

- Option B (wholesale rewrite) — higher blast radius; violates "over-engineering" rule; no added value for what is a mechanical compliance fix
- Option C (ESLint suppression) — defeats the purpose
- Option D (partial scope) — contradicts the user's explicit "all at once" directive

### Open Questions (Operator Input Required)

None — all decisions resolvable from existing code evidence and DS API.

## End-State Operating Model

None: no material process topology change — all changes are className/import replacements within component files.

## Planning Handoff

- Planning focus:
  - Decompose into 3 parallel IMPLEMENT tasks with strictly non-overlapping file sets
  - TASK-01: Inline styles (4 files in `checkins/` and `roomgrid/`)
  - TASK-02: Inbox + ScreenHeader DS violations (raw buttons + layout warnings + bracket values — 7 inbox files + ScreenHeader)
  - TASK-03: All remaining raw buttons (12 files across bar, till, cash, eod, stock, analytics, userManagement, checkins, OfflineIndicator, withIconModal HOC)
- Validation implications:
  - Each task: TypeScript typecheck clean after changes; ESLint warning count trending to 0
  - Post all tasks: `pnpm --filter @apps/reception exec eslint src/ --rule '{"ds/enforce-layout-primitives": "warn"}'` must show 0 warnings
  - Snapshot tests may need updates for className changes — update in same commit
- Sequencing constraints:
  - All 3 tasks are independent (disjoint file sets) — Wave 1 can run all 3 in parallel
  - No task has a dependency on any other
- Risks to carry into planning:
  - Tooltip/BookingTooltip: JS-computed positions must remain; don't remove the entire style block
  - withIconModal HOC: use `Button` with `asChild` (when wrapping a custom trigger child) or `variant="ghost"` (for a standalone button) — both are confirmed DS Button props; read the HOC before changing to verify which pattern applies
  - DS Button variant mismatch: build agents must read each button's current className before choosing variant (ghost vs outline vs default)

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Wrong DS Button variant chosen for a raw button | Low | Low | Requires reading each button's context at build time | Build agents must read file before editing; choose variant matching current visual intent |
| Tooltip static position removal breaks layout | Low | Low | Approach already decided: keep JS-computed top/left; remove only static zIndex (covered by `z-50` class) | Apply `z-50` className; do not remove the entire style block |
| withIconModal HOC output contract broken | Low | Low | Requires reading HOC consumer sites | Read withIconModal.tsx consumers before changing |
| Snapshot test failures require manual update | Low | Low | Cannot determine exact snapshot impact at analysis stage | Update snapshots in same commit; CI validates |

## Planning Readiness

- Status: Go
- Rationale: All violation locations are precisely enumerated with file/line evidence. The DS Button and primitives APIs are confirmed. The chosen approach is mechanical with a deterministic ESLint completion gate. Three disjoint task groups are ready for parallel wave execution.
