---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-06
Last-reviewed: 2026-03-06
Last-updated: 2026-03-06
Archived-date: 2026-03-06
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-sync-panel-ux
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# XA Uploader Sync Panel UX Plan

## Summary

The xa-uploader sync panel (`CatalogSyncPanel.client.tsx`) renders four sync checkboxes in a flat unstyled flex row using native `<input type="checkbox">` with no Tailwind classes. This is inconsistent with the rest of the operator tool, which uses `SECTION_HEADER_CLASS` dividers and design-system-compliant checkboxes (established in `RegistryCheckboxGrid.client.tsx`). This plan delivers three tightly scoped changes: (1) export a `CHECKBOX_CLASS` constant from `catalogStyles.ts` and update `RegistryCheckboxGrid.client.tsx` to import it, (2) add two new i18n section header keys to `uploaderI18n.ts` (EN + ZH) — `syncOptionGroupValidation` ("Validation") and `syncOptionGroupRunModifiers` ("Run modifiers"), and (3) restructure `CatalogSyncPanel.client.tsx` to render the four sync options in two visually grouped sections — "Validation" (`strict`, `recursive`, which affect what is validated/traversed) and "Run modifiers" (`replace`, `dryRun`, which affect write behaviour) — using `SECTION_HEADER_CLASS` and `CHECKBOX_CLASS`. All four options remain optional toggles; no option is a hard gate. No logic, state, API, or type changes are required.

## Active tasks

- [x] TASK-01: Export `CHECKBOX_CLASS` from `catalogStyles.ts`; update `RegistryCheckboxGrid` to import it
- [x] TASK-02: Add i18n section header keys to `uploaderI18n.ts` (`syncOptionGroupValidation`, `syncOptionGroupRunModifiers`)
- [x] TASK-03: Restructure `CatalogSyncPanel.client.tsx` with grouped sections and styled checkboxes

## Goals

- Replace native unstyled `<input type="checkbox">` in CatalogSyncPanel with design-system-compliant `CHECKBOX_CLASS`.
- Add visual section grouping (`SECTION_HEADER_CLASS`) to separate "Validation" options (`strict`, `recursive`) from "Run modifier" options (`replace`, `dryRun`). All four remain optional toggles; the grouping reflects what each option affects (scope/correctness vs write behaviour), not gating semantics.
- Centralise the checkbox style constant in `catalogStyles.ts` as the authoritative source.

## Non-goals

- Changing sync option names, labels, defaults, or server-side behaviour.
- Adding or removing sync options.
- Modifying `useCatalogConsole.client.ts`, `catalogConsoleActions.ts`, or `sync/route.ts`.
- Adding new test files (existing tests cover readiness/feedback text; `onChangeSyncOptions` wiring is unchanged — same prop, same merge expression, same handler reference). Note: the `checked` and `onChange` props are preserved exactly; the restructure only changes the wrapping layout and styling. Per testing policy (docs/testing-policy.md), new tests run in CI only and are not added locally for visual-only refactors. If CI regression appears, the fix is a revert.

## Constraints & Assumptions

- Constraints:
  - `catalogStyles.ts` is the single source of truth for style constants; `CHECKBOX_CLASS` must go there.
  - All Tailwind classes must use gate-* semantic tokens (no raw colour values).
  - ESLint `ds/enforce-layout-primitives` suppression on the checkbox container div in `CatalogSyncPanel.client.tsx` must be preserved.
  - No local jest/test runs; CI validates.
  - Writer lock must be acquired via `scripts/agents/with-writer-lock.sh` before any git commit.
- Assumptions:
  - `strict` and `recursive` are grouped as "Validation" options (they affect scope and correctness of what is validated/traversed); `replace` and `dryRun` are grouped as "Run modifiers" (they affect write behaviour). All four remain optional toggles — no option is a hard gate.
  - i18n keys are added inline to `uploaderI18n.ts` (not JSON files), both EN and ZH locale blocks.

## Inherited Outcome Contract

- **Why:** xa-uploader UI review found the sync panel uses a flat list with no grouping and native unstyled checkboxes, making it inconsistent with the rest of the gate-* design-system UI and harder for operators to orient quickly to what they need to confirm before publishing.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** CatalogSyncPanel.client.tsx renders sync options in two visually grouped sections ("Validation" for `strict`/`recursive`; "Run modifiers" for `replace`/`dryRun`), using design-system-styled checkboxes with gate-* tokens, consistent with RegistryCheckboxGrid.client.tsx and the rest of the xa-uploader operator tool. (Note: original dispatch used "publish-required / optional" taxonomy; this plan refines to "Validation / Run modifiers" because all four options are optional toggles and "publish-required gate" was rejected as misleading.)
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/xa-uploader-sync-panel-ux/fact-find.md`
- Key findings used:
  - Checkbox pattern: `CHECKBOX_CLASSNAME = "rounded border-gate-border text-gate-accent accent-gate-accent focus:ring-gate-accent"` from `RegistryCheckboxGrid.client.tsx` line 17–18 — defined locally; needs to move to `catalogStyles.ts`.
  - Section header pattern: `SECTION_HEADER_CLASS` in `catalogStyles.ts` line 44–45, used in `CatalogProductBaseFields.client.tsx` lines 739–760.
  - syncOptions defaults: `{ strict: false, dryRun: false, replace: false, recursive: true }` — `recursive` defaults true (standard operating mode), confirming it as a traversal/scope option grouped under "Validation".
  - i18n is inline in `uploaderI18n.ts`; sync option labels at lines 208–211 (EN) and 666–669 (ZH).
  - Existing tests (`sync-feedback.test.tsx`) test behaviour and readiness text, not checkbox DOM structure — no test regressions expected.

## Proposed Approach

- Option A: Define `CHECKBOX_CLASS` locally in `CatalogSyncPanel.client.tsx` (quick but duplicates `RegistryCheckboxGrid`'s local constant, diverging from the catalogStyles pattern).
- Option B: Export `CHECKBOX_CLASS` from `catalogStyles.ts`; update both `RegistryCheckboxGrid.client.tsx` and `CatalogSyncPanel.client.tsx` to import it (correct: DRY, consistent with established source-of-truth pattern).
- Chosen approach: **Option B**. `catalogStyles.ts` is the established source of truth for all style constants; every other style constant in the codebase (INPUT_CLASS, BTN_PRIMARY_CLASS, SECTION_HEADER_CLASS, etc.) is exported from there. Option A would create a second local definition of the same value, breaking the single-source-of-truth invariant.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes (critique Round 3 score 3.5; all three warnings addressed in final-round autofixes; proceeding with build per operator auto-handoff policy)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Export CHECKBOX_CLASS from catalogStyles.ts; update RegistryCheckboxGrid import | 95% | S | Complete (2026-03-06) | - | TASK-03 |
| TASK-02 | IMPLEMENT | Add syncOptionGroupValidation / syncOptionGroupRunModifiers i18n keys (EN + ZH) | 95% | S | Complete (2026-03-06) | - | TASK-03 |
| TASK-03 | IMPLEMENT | Restructure CatalogSyncPanel with grouped sections and CHECKBOX_CLASS | 90% | S | Complete (2026-03-06) | TASK-01, TASK-02 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Independent; can run in parallel |
| 2 | TASK-03 | TASK-01, TASK-02 | Depends on both wave-1 tasks |

## Tasks

### TASK-01: Export `CHECKBOX_CLASS` from `catalogStyles.ts`; update `RegistryCheckboxGrid` to import it

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/xa-uploader/src/components/catalog/catalogStyles.ts`, `apps/xa-uploader/src/components/catalog/RegistryCheckboxGrid.client.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-06)
- **Affects:** `apps/xa-uploader/src/components/catalog/catalogStyles.ts`, `apps/xa-uploader/src/components/catalog/RegistryCheckboxGrid.client.tsx`
- **Depends on:** -
- **Blocks:** TASK-03
- **Build evidence:** `CHECKBOX_CLASS` exported from `catalogStyles.ts` (after Labels & Headers block). `RegistryCheckboxGrid.client.tsx` imports `CHECKBOX_CLASS` from `./catalogStyles`; local `CHECKBOX_CLASSNAME` constant removed. `pnpm typecheck` and `pnpm lint` pass. Committed in `132b9fdce7`.
- **Confidence:** 95%
  - Implementation: 95% — exact constant string confirmed from source read (`"rounded border-gate-border text-gate-accent accent-gate-accent focus:ring-gate-accent"`); catalogStyles.ts has no existing checkbox entry; RegistryCheckboxGrid local definition confirmed.
  - Approach: 95% — direct DRY refactor with zero logic change; pattern identical to all other catalogStyles.ts exports.
  - Impact: 95% — `RegistryCheckboxGrid` is the only consumer of the local constant; updating its import is the complete blast radius; behaviour is identical.
- **Acceptance:**
  - `catalogStyles.ts` exports `export const CHECKBOX_CLASS = "rounded border-gate-border text-gate-accent accent-gate-accent focus:ring-gate-accent";`
  - `RegistryCheckboxGrid.client.tsx` imports `CHECKBOX_CLASS` from `./catalogStyles` and removes the local `CHECKBOX_CLASSNAME` constant.
  - TypeScript compiles without errors in `apps/xa-uploader`.
  - ESLint passes in `apps/xa-uploader`.
- **Validation contract (TC-01):**
  - TC-01: `catalogStyles.ts` exports `CHECKBOX_CLASS` → TypeScript resolves import in both consumers without error.
  - TC-02: `RegistryCheckboxGrid.client.tsx` no longer has a local `CHECKBOX_CLASSNAME` constant → no duplicate definition.
- **Execution plan:** Red: add `CHECKBOX_CLASS` export to `catalogStyles.ts` (after the Labels & Headers block, before Panels). Green: update `RegistryCheckboxGrid.client.tsx` — remove local `CHECKBOX_CLASSNAME`, add import from `./catalogStyles`, replace all usages of `CHECKBOX_CLASSNAME` with `CHECKBOX_CLASS`.
- **Planning validation (required for M/L):** None: S effort task; all evidence from direct file reads in fact-find.
- **Scouts:** None: exact constant string confirmed from source read; no assumptions remain.
- **Edge Cases & Hardening:** Only one consumer of the local constant (`RegistryCheckboxGrid` uses it in one place at line 61). No edge cases.
- **What would make this >=90%:** Already at 95%. Would reach 100% after CI pass.
- **Rollout / rollback:**
  - Rollout: Merged as part of the overall feature branch.
  - Rollback: Revert the two file changes — restore local `CHECKBOX_CLASSNAME` in `RegistryCheckboxGrid`, remove export from `catalogStyles.ts`.
- **Documentation impact:** None: catalogStyles.ts already has inline JSDoc comments per constant; add a matching one for `CHECKBOX_CLASS`.
- **Notes / references:** Fact-find `catalogStyles.ts` evidence, lines 1–51; `RegistryCheckboxGrid.client.tsx` lines 17–18.

---

### TASK-02: Add `syncOptionGroupValidation` and `syncOptionGroupRunModifiers` i18n keys to `uploaderI18n.ts`

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/xa-uploader/src/lib/uploaderI18n.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-06)
- **Affects:** `apps/xa-uploader/src/lib/uploaderI18n.ts`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 95%
  - Implementation: 95% — file structure confirmed (inline bilingual object), sync option key block identified at lines 208–211 (EN) and 666–669 (ZH); addition is mechanical.
  - Approach: 95% — follows established inline i18n pattern; no alternative approach exists.
  - Impact: 95% — additive change only; no existing keys modified; no consumers until TASK-03 adds them.
- **Acceptance:**
  - EN locale block contains `syncOptionGroupValidation: "Validation"` (or equivalent human-readable label — not "Publish gates").
  - EN locale block contains `syncOptionGroupRunModifiers: "Run modifiers"`.
  - ZH locale block contains matching keys with appropriate Chinese translations.
  - TypeScript infers the new keys from the `satisfies` / `as const` pattern used in `uploaderI18n.ts` without explicit type annotation changes (the type is derived from the EN object — new keys are automatically inferred).
  - `pnpm typecheck` passes in `apps/xa-uploader`.
- **Validation contract (TC-02):**
  - TC-01: Both new keys present in EN and ZH locale blocks → `t("syncOptionGroupValidation")` resolves without TypeScript error.
  - TC-02: Misspelled key → TypeScript error surfaced at compile time (confirms type inference is working).
- **Execution plan:** Red: add `syncOptionGroupValidation` and `syncOptionGroupRunModifiers` after the existing `syncOptionDryRun` entry in the EN locale block. Green: add the ZH translations in the ZH locale block at the matching position (after `syncOptionDryRun` ZH entry). Refactor: verify the `UploaderMessageKey` type (if explicitly declared) includes the new keys; if the type is inferred from the EN object, no change needed.
- **Planning validation (required for M/L):** None: S effort task; file structure confirmed from grep output in fact-find.
- **Scouts:** The `uploaderI18n.ts` key type pattern (inferred vs explicit union) should be confirmed on read — if it's an explicit union, the type declaration needs updating too. This is low risk (S effort either way) but must be checked before adding keys.
- **Edge Cases & Hardening:** If `UploaderMessageKey` is an explicit string-union type, the new keys must be added to the union. Check the type declaration on first read of the file.
- **What would make this >=90%:** Already at 95%. Would reach 100% after CI typecheck pass.
- **Rollout / rollback:**
  - Rollout: Merged as part of the overall feature branch.
  - Rollback: Remove the two key additions from both locale blocks.
- **Documentation impact:** None.
- **Notes / references:** Fact-find `uploaderI18n.ts` evidence, lines 208–211, 666–669. ZH translations: `syncOptionGroupValidation: "校验选项"`, `syncOptionGroupRunModifiers: "执行参数"` (proposed; adjust if a native speaker preference is documented).
- **Build evidence:** EN keys `syncOptionGroupValidation: "Validation"` and `syncOptionGroupRunModifiers: "Run modifiers"` added after `syncPublishReadinessZero` entry. ZH keys `syncOptionGroupValidation: "校验选项"` and `syncOptionGroupRunModifiers: "执行参数"` added at matching position. `UploaderMessageKey` type is inferred from EN object — no explicit union type change needed. `pnpm typecheck` pass confirmed. Committed in `132b9fdce7`.

---

### TASK-03: Restructure `CatalogSyncPanel.client.tsx` with grouped sections and `CHECKBOX_CLASS`

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/xa-uploader/src/components/catalog/CatalogSyncPanel.client.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-06)
- **Affects:** `apps/xa-uploader/src/components/catalog/CatalogSyncPanel.client.tsx`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — entry point fully read; current JSX at lines 138–152 is plain and well-understood; restructuring is mechanical. Minor deduction for label className decision (text-xs vs text-sm) resolved during execution.
  - Approach: 90% — pattern from `CatalogProductBaseFields.client.tsx` (lines 739–760) directly applicable. No ambiguity.
  - Impact: 90% — visual-only change; state wiring (`checked`, `onChange`) unchanged; existing test (`sync-feedback.test.tsx`) does not assert checkbox DOM structure.
- **Acceptance:**
  - The flat `div.mt-4.flex.flex-wrap.gap-4.text-sm` map is replaced with two grouped subsections.
  - First group: section header using `SECTION_HEADER_CLASS` with `t("syncOptionGroupValidation")` ("Validation") label; contains `strict` and `recursive` checkboxes.
  - Second group: section header using `SECTION_HEADER_CLASS` with `t("syncOptionGroupRunModifiers")` ("Run modifiers") label; contains `replace` and `dryRun` checkboxes.
  - Each `<input type="checkbox">` has `className={CHECKBOX_CLASS}`.
  - Labels use `className="flex items-center gap-2 text-xs text-gate-muted cursor-pointer"` (consistent with existing sync panel label style).
  - `CHECKBOX_CLASS` and `SECTION_HEADER_CLASS` are imported from `./catalogStyles`.
  - `SECTION_HEADER_CLASS` import is added to the existing destructuring import of `BTN_PRIMARY_CLASS, BTN_SECONDARY_CLASS, PANEL_CLASS`.
  - Two ESLint disable comments `// eslint-disable-next-line ds/enforce-layout-primitives -- XAUP-0001 operator-tool checkbox group` are placed on each `<div className="mt-2 flex flex-wrap gap-4">` row (the actual layout-primitive nodes), one per group. The outermost `<div className="mt-4 space-y-4">` wrapper does not carry the disable comment.
  - TypeScript compiles and ESLint passes.
  - **Expected user-observable behavior:**
    - Two section headers are visible in the sync panel, above the respective checkbox rows.
    - Checkboxes are visually styled (accent color on check, rounded corners, ring on focus) instead of bare native controls.
    - `strict` and `recursive` appear in the first group; `replace` and `dryRun` appear in the second group.
    - All four checkboxes remain functional (check/uncheck triggers `onChangeSyncOptions` correctly).
    - No change to readiness status display, feedback area, or sync output area.
- **Validation contract (TC-03):**
  - TC-01: Checkbox group renders two `SECTION_HEADER_CLASS` header divs → verified by code review of produced JSX and TypeScript compile pass (no runtime test; visual-only structure).
  - TC-02: Existing `sync-feedback.test.tsx` passes in CI → confirms that the panel mounts, readiness text renders, and the "Run Sync" button is reachable. Note: this test does NOT assert checkbox presence or `onChangeSyncOptions` wiring. Wiring correctness is verified by code review: `checked` and `onChange` are the same expressions as the pre-refactor flat map, just separated into two explicit loops.
  - TC-03: `CHECKBOX_CLASS` applied to all four `<input>` elements → confirmed by JSX code review; TypeScript enforces prop types.
  - TC-04: Handler wiring verified by code review: `onChange={(e) => onChangeSyncOptions({ ...syncOptions, [key]: e.target.checked })` is identical to the original flat-map expression. No logic path changed. If CI regression appears on `sync-feedback.test.tsx`, revert TASK-03.
- **Execution plan:** Red: add `SECTION_HEADER_CLASS` and `CHECKBOX_CLASS` to the import from `./catalogStyles` in `CatalogSyncPanel.client.tsx`. Green: replace lines 138–152 (the flat map) with two explicit JSX groups:
  ```tsx
  <div className="mt-4 space-y-4">
    <div>
      <div className={SECTION_HEADER_CLASS}>{t("syncOptionGroupValidation")}</div>
      {/* eslint-disable-next-line ds/enforce-layout-primitives -- XAUP-0001 operator-tool checkbox group */}
      <div className="mt-2 flex flex-wrap gap-4">
        {(["strict", "recursive"] as const).map((key) => (
          <label key={key} className="flex items-center gap-2 text-xs text-gate-muted cursor-pointer">
            <input type="checkbox" checked={syncOptions[key]} onChange={(e) => onChangeSyncOptions({ ...syncOptions, [key]: e.target.checked })} className={CHECKBOX_CLASS} />
            {optionLabels[key]}
          </label>
        ))}
      </div>
    </div>
    <div>
      <div className={SECTION_HEADER_CLASS}>{t("syncOptionGroupRunModifiers")}</div>
      {/* eslint-disable-next-line ds/enforce-layout-primitives -- XAUP-0001 operator-tool checkbox group */}
      <div className="mt-2 flex flex-wrap gap-4">
        {(["replace", "dryRun"] as const).map((key) => (
          <label key={key} className="flex items-center gap-2 text-xs text-gate-muted cursor-pointer">
            <input type="checkbox" checked={syncOptions[key]} onChange={(e) => onChangeSyncOptions({ ...syncOptions, [key]: e.target.checked })} className={CHECKBOX_CLASS} />
            {optionLabels[key]}
          </label>
        ))}
      </div>
    </div>
  </div>
  ```
  Refactor: the ESLint disable (`ds/enforce-layout-primitives`) must be placed on each `flex flex-wrap` div directly (the actual layout-primitive nodes), not on any wrapper. Two suppress comments are needed — one per checkbox row div. Confirm SECTION_HEADER_CLASS already includes `border-t` which provides the divider — no additional divider element needed.
- **Planning validation:**
  - Checks run: Direct read of `CatalogSyncPanel.client.tsx` (full file), `catalogStyles.ts` (full file), `RegistryCheckboxGrid.client.tsx` (full file), `CatalogProductBaseFields.client.tsx` (lines 730–763), `sync-feedback.test.tsx` (lines 1–60).
  - Validation artifacts: Lines 138–152 of CatalogSyncPanel confirmed as the full checkbox group scope; SECTION_HEADER_CLASS confirmed to include `border-t border-gate-border pt-4`; CHECKBOX_CLASS confirmed as exact string from RegistryCheckboxGrid.
  - Unexpected findings: None. The `div.text-sm` wrapper class on line 138 carries the text-sm that was the label's font size context — this is superseded by the explicit label className in the new structure.
- **Consumer tracing:**
  - New imports (`CHECKBOX_CLASS`, `SECTION_HEADER_CLASS`) — consumed locally in this file only.
  - `t("syncOptionGroupValidation")`, `t("syncOptionGroupRunModifiers")` — new i18n keys added in TASK-02; no other consumers until this task renders them.
  - `syncOptions`, `onChangeSyncOptions`, `optionLabels` — existing; wiring unchanged; all four keys still accessed.
  - `RegistryCheckboxGrid.client.tsx` — not a consumer of CatalogSyncPanel; not affected.
- **Scouts:** Confirm `SECTION_HEADER_CLASS` first char includes `border-t` (so the second group gets a top divider separating from the first group — if not, a `border-t` must be added to the second group wrapper). Evidence from fact-find confirms: `"border-t border-gate-border pt-4 text-xs font-semibold uppercase tracking-label-lg text-gate-accent"` — confirmed, both groups get top dividers, which is consistent with the pattern in `CatalogProductBaseFields.client.tsx`.
- **Edge Cases & Hardening:**
  - The `SECTION_HEADER_CLASS` `border-t` on the first group would create a divider above it too (between readiness area and the options). This is consistent with how `CatalogProductBaseFields.client.tsx` uses it (each section header starts with a divider). The `mt-4` top margin on the outer wrapper maintains existing spacing.
  - `optionLabels` object still references all four keys — no key access change.
- **What would make this >=90%:** Already at 90%. Would reach 95% after CI typecheck pass; 100% after visual review by operator.
- **Rollout / rollback:**
  - Rollout: Merged as part of the overall feature branch.
  - Rollback: Revert `CatalogSyncPanel.client.tsx` to the flat map structure.
- **Documentation impact:** None.
- **Notes / references:** Fact-find `CatalogSyncPanel.client.tsx` evidence, lines 138–152; `CatalogProductBaseFields.client.tsx` pattern lines 739–760; `catalogStyles.ts` SECTION_HEADER_CLASS line 44–45.
- **Build evidence:** Flat map replaced with two section groups. `SECTION_HEADER_CLASS` and `CHECKBOX_CLASS` imported from `./catalogStyles`. ESLint disable comments placed on each `mt-2 flex flex-wrap gap-4` div (immediate parent of layout divs). `pnpm typecheck` and `pnpm lint` pass. Committed in `132b9fdce7`.

---

## Risks & Mitigations

- ESLint `ds/enforce-layout-primitives` position shift — the suppression comment must be on the immediate parent of each layout div (each `flex flex-wrap` row), not on a grandparent or outermost wrapper. Execution plan places two comments correctly (one per row). ESLint (not TypeScript) would catch a misplacement. Validate with `pnpm lint` in `apps/xa-uploader`.
- `UploaderMessageKey` type is an explicit string union — if so, TASK-02 must add the new keys to the union. Scouts note in TASK-02 covers this; it is low-risk and self-caught by TypeScript.
- `SECTION_HEADER_CLASS` adds `border-t` to both group headers, including the first — this creates a separator above "Validation" that visually separates the checkbox area from the readiness/publishReadiness paragraphs above. This is the intended and consistent pattern.

## Observability

- Logging: None: no runtime logging changes.
- Metrics: None: operator-tool visual change only.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)

- [ ] `catalogStyles.ts` exports `CHECKBOX_CLASS`.
- [ ] `RegistryCheckboxGrid.client.tsx` imports `CHECKBOX_CLASS` from `catalogStyles.ts` and removes its local `CHECKBOX_CLASSNAME`.
- [ ] `uploaderI18n.ts` contains `syncOptionGroupValidation: "Validation"` and `syncOptionGroupRunModifiers: "Run modifiers"` in EN, and matching ZH entries.
- [ ] `CatalogSyncPanel.client.tsx` renders two section groups with `SECTION_HEADER_CLASS` headers and `CHECKBOX_CLASS` on each checkbox.
- [ ] `pnpm typecheck` passes in `apps/xa-uploader`.
- [ ] `pnpm lint` passes in `apps/xa-uploader`.
- [ ] Existing `sync-feedback.test.tsx` tests pass in CI.

## Decision Log

- 2026-03-06: Chosen approach Option B — export `CHECKBOX_CLASS` from `catalogStyles.ts`. All other style constants follow this pattern; DRY and single-source-of-truth.
- 2026-03-06: `strict` and `recursive` grouped as "Validation" options; `replace` and `dryRun` grouped as "Run modifiers". Rationale: `strict` and `recursive` affect what the sync validates and traverses (scope + correctness of the operation); `replace` and `dryRun` affect how the sync executes (write behaviour). Neither group is a hard gate — all four are optional. "Publish gates" label was rejected (codemoot critique Round 1) because `strict` defaults false and sync runs without it, so calling it a "gate" is misleading.
- 2026-03-06: Label className for new groups: `flex items-center gap-2 text-xs text-gate-muted cursor-pointer` — matches existing sync panel label style (text-xs, gate-muted) rather than RegistryCheckboxGrid (text-sm, gate-ink) because sync panel is a compact operator panel, not a product data form.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Export CHECKBOX_CLASS from catalogStyles.ts | Yes — no prior state needed | None | No |
| TASK-01: Update RegistryCheckboxGrid import | Yes — catalogStyles.ts export added in same task | None | No |
| TASK-02: Add i18n keys (EN + ZH) | Yes — no prior state needed | None — UploaderMessageKey type check noted as Scout, handled in execution plan | No |
| TASK-03: Add imports to CatalogSyncPanel | Yes — TASK-01 must be complete | None | No |
| TASK-03: Replace checkbox group JSX | Yes — TASK-01 (CHECKBOX_CLASS) and TASK-02 (i18n keys) both complete | None | No |
| TASK-03: Preserve ESLint disable comment | Yes — two disable comments, one per flex-wrap div | Advisory (Round 2 critique): disable must be on immediate parent of layout div, not outer wrapper. Resolved: execution plan places comment on each `mt-2 flex flex-wrap gap-4` div. | No |
| TASK-03: Verify SECTION_HEADER_CLASS border-t on first group | Yes — confirmed via fact-find | Advisory: border-t on first group creates divider above "Validation" group — consistent with established CatalogProductBaseFields pattern | No |

## Overall-confidence Calculation

- TASK-01: confidence 95%, Effort S (weight 1)
- TASK-02: confidence 95%, Effort S (weight 1)
- TASK-03: confidence 90%, Effort S (weight 1)
- Overall-confidence = (95 + 95 + 90) / 3 = 93.3% → per rounding rule (multiples of 5 only) and downward bias rule (when uncertain between adjacent scores, assign lower) → **90%**. Header updated to 90%.
