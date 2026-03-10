---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-06
Last-updated: 2026-03-06
Feature-Slug: xa-uploader-sync-panel-ux
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/xa-uploader-sync-panel-ux/plan.md
Trigger-Why: xa-uploader UI review found the sync panel uses a flat list with no grouping and native unstyled checkboxes, making it inconsistent with the rest of the gate-* design-system UI and harder for operators to orient quickly to what they need to confirm before publishing.
Trigger-Intended-Outcome: type: operational | statement: CatalogSyncPanel uses design-system-compliant checkboxes (gate-* tokens, accent-gate-accent pattern from RegistryCheckboxGrid) and groups sync options into two visually separated sections — publish-required gates vs optional flags — using SECTION_HEADER_CLASS from catalogStyles.ts. | source: operator
---

# XA Uploader Sync Panel UX Fact-Find Brief

## Scope

### Summary

The xa-uploader sync panel (`CatalogSyncPanel.client.tsx`) renders four sync option checkboxes in a flat, unwrapped flex row using native `<input type="checkbox">` with no Tailwind styling and no visual grouping. This is inconsistent with the rest of the xa-uploader operator tool, which uses `SECTION_HEADER_CLASS` dividers (as seen in `CatalogProductBaseFields.client.tsx`) and design-system-compliant checkboxes (as seen in `RegistryCheckboxGrid.client.tsx`). The work replaces the native checkboxes with the established `CHECKBOX_CLASSNAME` pattern and adds section headers to separate publish-required options from optional flags.

### Goals

- Classify the four sync options (`strict`, `recursive`, `replace`, `dryRun`) as publish-required gates vs optional flags.
- Add visual section grouping using `SECTION_HEADER_CLASS` from `catalogStyles.ts`.
- Replace native unstyled `<input type="checkbox">` with the design-system-compliant checkbox pattern (`rounded border-gate-border text-gate-accent accent-gate-accent focus:ring-gate-accent`).
- Export or co-locate the checkbox class constant in `catalogStyles.ts` for reuse.

### Non-goals

- Adding new sync options or changing sync behaviour.
- Changing i18n keys or label text (except possibly adding section header i18n keys if needed).
- Modifying `useCatalogConsole.client.ts` state or `catalogConsoleActions.ts` sync logic.
- Changing the sync readiness, feedback, or output areas of the panel.

### Constraints & Assumptions

- Constraints:
  - `catalogStyles.ts` is the single source of truth for style constants; new constants must go there.
  - All Tailwind classes must use gate-* semantic tokens (no raw colour values).
  - `RegistryCheckboxGrid.client.tsx` defines the established checkbox pattern; the sync panel must follow it, not diverge.
  - The `ds/enforce-layout-primitives` ESLint rule is already suppressed for the sync panel checkbox group with comment `XAUP-0001 operator-tool checkbox group` — the suppression stays in place.
  - No local tests should be run (`jest`, `pnpm test`); CI validates.
- Assumptions:
  - `strict` and `recursive` are publish-required gate options (they govern whether the sync validates fully and traverses sub-directories — both are correctness guards, not convenience flags).
  - `replace` and `dryRun` are optional flags (they are power-user overrides, not required for a standard publish).
  - Section headers can use existing i18n keys or hardcoded strings with an `// eslint-disable-next-line ds/no-hardcoded-copy` suppression (matching the existing pattern in `CatalogSyncPanel.client.tsx`).
  - The i18n system is inline-defined in `uploaderI18n.ts` (not JSON files); new keys require adding to both `en` and `zh` locale blocks.

## Outcome Contract

- **Why:** xa-uploader UI review found the sync panel uses a flat list with no grouping and native unstyled checkboxes, making it inconsistent with the rest of the gate-* design-system UI and harder for operators to orient quickly to what they need to confirm before publishing.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** CatalogSyncPanel.client.tsx renders sync options in two visually grouped sections (publish-required / optional), using design-system-styled checkboxes with gate-* tokens, consistent with RegistryCheckboxGrid.client.tsx and the rest of the xa-uploader operator tool.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/xa-uploader/src/components/catalog/CatalogSyncPanel.client.tsx` — the component under change; renders flat checkbox group at line 138–152 using native `<input type="checkbox">` with no className, inside `div.mt-4.flex.flex-wrap.gap-4.text-sm`.

### Key Modules / Files

- `apps/xa-uploader/src/components/catalog/catalogStyles.ts` — single source of truth for style constants. Defines `SECTION_HEADER_CLASS` (line 44–45: `border-t border-gate-border pt-4 text-xs font-semibold uppercase tracking-label-lg text-gate-accent`), `BTN_PRIMARY_CLASS`, `BTN_SECONDARY_CLASS`, `PANEL_CLASS`, `FIELD_LABEL_CLASS`, `INPUT_CLASS`, `INPUT_INLINE_CLASS`, `SELECT_CLASS`. No checkbox constant exists yet.
- `apps/xa-uploader/src/components/catalog/RegistryCheckboxGrid.client.tsx` — defines the established checkbox pattern at line 17–18: `const CHECKBOX_CLASSNAME = "rounded border-gate-border text-gate-accent accent-gate-accent focus:ring-gate-accent"`. Uses gate-* tokens throughout. This is the design-system-compliant pattern to follow.
- `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts` — state owner for `syncOptions`: `{ strict: false, dryRun: false, replace: false, recursive: true }` (lines 139–144). Default value for `recursive` is `true`; all others default `false`. Type is `{ strict: boolean; dryRun: boolean; replace: boolean; recursive: boolean }`.
- `apps/xa-uploader/src/components/catalog/CatalogProductBaseFields.client.tsx` — reference implementation for `SECTION_HEADER_CLASS` dividers (lines 739–760): pattern is `<div className={SECTION_HEADER_CLASS}>{sectionLabel}</div>` followed by field components. No wrapper card — just a divider + label element.
- `apps/xa-uploader/src/lib/uploaderI18n.ts` — inline i18n; sync option labels at lines 208–211 (EN) and 666–669 (ZH). No section header keys exist yet.
- `apps/xa-uploader/src/components/catalog/__tests__/sync-feedback.test.tsx` — existing tests for `CatalogSyncPanel`; passes `syncOptions={{ strict: true, recursive: true, replace: false, dryRun: false }}` and `onChangeSyncOptions={() => undefined}`. Tests cover readiness messaging and feedback display, not checkbox rendering or grouping.

### Patterns & Conventions Observed

- **Section header pattern**: `<div className={SECTION_HEADER_CLASS}>{label}</div>` — used in `CatalogProductBaseFields.client.tsx`, exported from `catalogStyles.ts`. The constant includes `border-t` which creates the visual divider.
- **Checkbox pattern**: local constant `CHECKBOX_CLASSNAME = "rounded border-gate-border text-gate-accent accent-gate-accent focus:ring-gate-accent"` in `RegistryCheckboxGrid.client.tsx`. Currently not exported from `catalogStyles.ts` — the sync panel needs to either import from `RegistryCheckboxGrid` (bad: coupling) or move the constant to `catalogStyles.ts` (correct: DRY, consistent with existing style source of truth).
- **Label pattern**: `RegistryCheckboxGrid` uses `className="flex items-center gap-2 text-sm text-gate-ink cursor-pointer"` on labels. `CatalogSyncPanel` currently uses `className="inline-flex items-center gap-2 text-xs text-gate-muted"`.
- **ESLint suppression pattern**: `// eslint-disable-next-line ds/enforce-layout-primitives -- XAUP-0001 operator-tool checkbox group` is already present on the checkbox container div.
- **Hardcoded copy suppressions**: `// eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id` is the existing pattern for unavoidable strings.

### Data & Contracts

- Types/schemas/events:
  - `syncOptions` type: `{ strict: boolean; dryRun: boolean; replace: boolean; recursive: boolean }` — defined inline in `CatalogSyncPanel.client.tsx` prop type and `useCatalogConsole.client.ts`.
  - `onChangeSyncOptions` callback: `(next: { strict: boolean; dryRun: boolean; replace: boolean; recursive: boolean }) => void` — called with full merged object on each checkbox change.
- API/contracts:
  - `SyncOptions` in `apps/xa-uploader/src/app/api/catalog/sync/route.ts` (lines 59–66): `{ strict?, dryRun?, replace?, recursive?, confirmEmptyInput?, mediaValidationPolicy? }`. The four UI options map directly to four of these server-side fields.

### Dependency & Impact Map

- Upstream dependencies:
  - `catalogStyles.ts` — will gain a new exported `CHECKBOX_CLASS` constant.
  - `uploaderI18n.ts` — may gain new section header keys if i18n approach is chosen over hardcoded strings with suppressions.
- Downstream dependents:
  - `CatalogSyncPanel.client.tsx` — the only consumer of the checkbox group being changed.
  - `RegistryCheckboxGrid.client.tsx` — if `CHECKBOX_CLASSNAME` is moved to `catalogStyles.ts` (as `CHECKBOX_CLASS`), `RegistryCheckboxGrid` should import it from there.
- Likely blast radius:
  - Visual change only — no state, logic, API, or type changes. The checkbox DOM structure changes but `checked` and `onChange` wiring is unchanged.
  - Existing tests (`sync-feedback.test.tsx`) test behaviour and readiness text, not checkbox DOM structure or styling — they will not break.

## Questions

### Resolved

- Q: Should `strict` be classified as a publish-required gate or an optional flag?
  - A: Publish-required gate. The label "full validation" (EN) / "完整校验" (ZH) indicates it governs correctness of the sync operation. Defaulting to `false` means it is not forced on, but architecturally it is a correctness guard (not a convenience toggle like `dryRun`). Grouping it with gates makes the tradeoff visible to the operator.
  - Evidence: `uploaderI18n.ts` lines 208, 666; `CatalogSyncPanel.client.tsx` line 47.

- Q: Should `recursive` be classified as a publish-required gate or an optional flag?
  - A: Publish-required gate. It controls whether sub-directories are traversed during sync. Default is `true` (line 143 of `useCatalogConsole.client.ts`), meaning it is the standard operating mode. Grouping it with gates reflects its structural role.
  - Evidence: `useCatalogConsole.client.ts` line 143.

- Q: Should `replace` be classified as a publish-required gate or an optional flag?
  - A: Optional flag. It is a power-user override (replace existing images rather than skip them). Default `false`. Grouped with optional flags.
  - Evidence: `uploaderI18n.ts` line 210.

- Q: Should `dryRun` be classified as a publish-required gate or an optional flag?
  - A: Optional flag. It suppresses actual writes (演练（不写入）— "dry run, no write"). Explicitly a testing/preview mode, not a production gate. Default `false`.
  - Evidence: `uploaderI18n.ts` lines 211, 669.

- Q: Should the checkbox class constant be exported from `catalogStyles.ts` or stay local?
  - A: Export from `catalogStyles.ts`. This is the established pattern for all other style constants. `RegistryCheckboxGrid` should also be updated to import from there, removing the local definition. This makes the pattern authoritative and reusable.
  - Evidence: `catalogStyles.ts` — all existing constants are exported; `RegistryCheckboxGrid.client.tsx` line 17–18.

- Q: What is the correct visual grouping approach — section headers with dividers, separate cards, or dividers only?
  - A: Section headers using `SECTION_HEADER_CLASS` (which includes `border-t` divider). This exactly matches the established pattern in `CatalogProductBaseFields.client.tsx` lines 739–760. Separate cards would add DOM nesting that is not present in the existing pattern.
  - Evidence: `catalogStyles.ts` line 44–45; `CatalogProductBaseFields.client.tsx` lines 739–760.

- Q: Are i18n keys needed for the section headers, or can hardcoded strings with ESLint suppressions be used?
  - A: New i18n keys should be added. The codebase uses i18n consistently for all operator-visible text. Hardcoded-copy suppressions exist only for test IDs and module specifiers. Adding two short keys (`syncOptionGroupGates` / `syncOptionGroupOptional` or similar) to `uploaderI18n.ts` is low effort and keeps the bilingual operator tool consistent.
  - Evidence: `uploaderI18n.ts` — all UI labels are i18n keys; `CatalogSyncPanel.client.tsx` pattern of using `t("...")` throughout.

- Q: Does moving `CHECKBOX_CLASSNAME` to `catalogStyles.ts` affect any other file?
  - A: Yes — `RegistryCheckboxGrid.client.tsx` currently defines it locally. That file should be updated to import `CHECKBOX_CLASS` from `catalogStyles.ts` and remove the local constant.
  - Evidence: `RegistryCheckboxGrid.client.tsx` lines 17–18; `catalogStyles.ts` import pattern across all catalog components.

### Open (Operator Input Required)

None — all questions resolved from evidence and business constraints.

## Confidence Inputs

- Implementation: 95%
  - Evidence: Entry point, key files, and pattern source fully read. Change is pure UI restructuring: add constant, add i18n keys, restructure JSX. No logic changes.
  - Would reach 100% only after seeing CI pass.
- Approach: 95%
  - Evidence: `RegistryCheckboxGrid.client.tsx` and `CatalogProductBaseFields.client.tsx` provide the exact patterns to follow. No ambiguity.
- Impact: 90%
  - Evidence: Visual-only change. State, API, and test contracts unchanged. Existing tests do not assert checkbox DOM structure, so no test regressions expected.
- Delivery-Readiness: 92%
  - Evidence: All required files identified and read, all decisions made. No open questions. Change is bounded to three files plus i18n additions.
- Testability: 80%
  - Evidence: Existing tests cover behaviour not styling. CI (typecheck + lint) will catch import errors. Manual visual verification is the primary validation path. No new tests are required by the change (styling constants and grouping are not unit-testable in the current test suite structure).

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| ESLint `ds/enforce-layout-primitives` fires on restructured checkbox container | Low | Low | Suppression comment already present on that div; restructuring the children does not move or remove it. |
| TypeScript error if `CHECKBOX_CLASS` export name clashes with something in `catalogStyles.ts` | Very low | Low | `catalogStyles.ts` has no existing checkbox-related export; name is unambiguous. |
| `RegistryCheckboxGrid.client.tsx` update introduces a regression in its own tests | Very low | Low | Change is purely removing a local constant and importing the same value from `catalogStyles.ts`; behaviour is identical. |
| i18n keys missing for one locale | Low | Low | `uploaderI18n.ts` has inline bilingual structure; both EN and ZH blocks must be updated in the same edit. |

## Planning Constraints & Notes

- Must-follow patterns:
  - `CHECKBOX_CLASS` must be exported from `catalogStyles.ts` (not defined locally in `CatalogSyncPanel`).
  - Section headers use `SECTION_HEADER_CLASS` — do not create a custom class for grouping.
  - i18n keys for section labels go in `uploaderI18n.ts`, both EN and ZH locales.
  - Label `className` should align with `RegistryCheckboxGrid`: `flex items-center gap-2 text-sm text-gate-ink cursor-pointer` (or `text-xs text-gate-muted` if smaller text is preferred in the sync panel context — this is a minor decision for the build step).
  - The render order of checkboxes within each section group should preserve the existing iteration order: gates first (`strict`, `recursive`), flags second (`replace`, `dryRun`).
- Rollout/rollback expectations:
  - No feature flag needed — visual-only change, operator tool only (not customer-facing).
  - Rollback is a revert of the single component file, styles file, and i18n file.

## Suggested Task Seeds (Non-binding)

- TASK-01: Export `CHECKBOX_CLASS` from `catalogStyles.ts`; update `RegistryCheckboxGrid.client.tsx` to import it.
- TASK-02: Add i18n keys `syncOptionGroupGates` and `syncOptionGroupOptional` to `uploaderI18n.ts` (both EN and ZH locales).
- TASK-03: Restructure `CatalogSyncPanel.client.tsx` checkbox group — replace flat map with two grouped sections using `SECTION_HEADER_CLASS` and the new i18n keys; apply `CHECKBOX_CLASS` to each checkbox input; update label `className`.

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `catalogStyles.ts` exports `CHECKBOX_CLASS` constant.
  - `RegistryCheckboxGrid.client.tsx` imports `CHECKBOX_CLASS` from `catalogStyles.ts`.
  - `CatalogSyncPanel.client.tsx` renders two sections with `SECTION_HEADER_CLASS` headers and `CHECKBOX_CLASS` on each checkbox.
  - `uploaderI18n.ts` has two new keys in EN and ZH.
  - `pnpm typecheck && pnpm lint` pass in `apps/xa-uploader`.
- Post-delivery measurement plan:
  - Visual review by operator on next sync panel open.
  - CI typecheck and lint pass.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| CatalogSyncPanel.client.tsx — current checkbox rendering | Yes | None | No |
| catalogStyles.ts — existing constants and naming conventions | Yes | None | No |
| RegistryCheckboxGrid.client.tsx — established checkbox pattern | Yes | None | No |
| useCatalogConsole.client.ts — syncOptions type and defaults | Yes | None | No |
| uploaderI18n.ts — sync option labels, locale coverage | Yes | None | No |
| CatalogProductBaseFields.client.tsx — section header pattern | Yes | None | No |
| sync-feedback.test.tsx — test blast radius | Yes | None | No |
| sync route.ts — server-side option mapping | Yes | None | No |

## Scope Signal

- **Signal: right-sized**
- **Rationale:** Three files changed (plus i18n additions). All patterns are established and directly reusable. No logic, state, API, or type changes. No new tests required. Change is self-contained to the operator tool with no customer-facing surface.

## Evidence Gap Review

### Gaps Addressed

- Confirmed checkbox pattern source (`RegistryCheckboxGrid.client.tsx`) — exact Tailwind class string captured.
- Confirmed section header pattern source (`CatalogProductBaseFields.client.tsx`) — exact usage pattern captured.
- Confirmed `catalogStyles.ts` has no existing checkbox constant — new export is unambiguous.
- Confirmed i18n file structure — both EN and ZH inline locale blocks identified.
- Confirmed test blast radius — existing tests do not assert checkbox DOM structure.

### Confidence Adjustments

- None required. All key files read directly; no gaps remain.

### Remaining Assumptions

- Label font size for the new groups (`text-sm text-gate-ink` vs `text-xs text-gate-muted`) is a minor stylistic decision deferred to the build step. Either is acceptable within design system constraints.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan xa-uploader-sync-panel-ux --auto`
