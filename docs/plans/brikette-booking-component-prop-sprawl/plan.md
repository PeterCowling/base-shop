---
Type: Plan
Status: Active
Domain: UI
Workstream: Engineering
Created: 2026-03-11
Last-reviewed: 2026-03-11
Last-updated: 2026-03-11 (Wave 1 complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brikette-booking-component-prop-sprawl
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort (S=1,M=2)
Auto-Build-Intent: plan+auto
---

# Booking Component Prop Sprawl Plan

## Summary

Three booking UI components (`BookingCalendarPanel`, `OctorateCustomPageShell`, `SecureBookingPageClient`) expose 7–10 UI label strings as individual flat props. Every call site must enumerate these independently, creating verbosity and misconfiguration risk. This plan groups the label props into typed bag objects (`BookingCalendarPanelLabels`, `OctorateCustomPageShellLabels`) via two independent IMPLEMENT tasks. No runtime behaviour changes; TypeScript enforces atomic call-site migration in each task.

## Active tasks
- [x] TASK-01: BookingCalendarPanel — labels bag (Complete 2026-03-11)
- [x] TASK-02: OctorateCustomPageShell + SBPC — labels bag (Complete 2026-03-11)

## Goals
- Reduce `BookingCalendarPanel` visible props from 15 to 9 (7 label strings → 1 `labels` bag).
- Reduce `OctorateCustomPageShell` visible props from 19 to 10 (10 label strings → 1 `labels` bag).
- Eliminate `SecureBookingPageClient`'s 10 individual string props → 1 `labels` bag, keeping non-label props flat.
- All call sites updated atomically; `pnpm --filter brikette typecheck` passes after each task.

## Non-goals
- Grouping handlers/state props (`range`, `onRangeChange`, `pax`, `onPaxChange`) — these vary independently per call site.
- Widget config group (`widgetGlobalKey`, `widgetScriptSrc`, `widgetBootstrap`) — deferred; labels cleanup is the primary value.
- Hook-based i18n extraction from call sites — valid follow-on but out of scope here.

## Constraints & Assumptions
- Constraints:
  - No cross-package changes. All affected files are within `apps/brikette/src/`.
  - `OctorateCustomPageShell` is not exported from any package index (confirmed by grep).
- Assumptions:
  - No consumers exist outside `apps/brikette/src/` (grep confirmed at fact-find time).
  - `summaryLabels` (existing grouped prop on both components) stays unchanged — the new `labels` bag is separate.

## Inherited Outcome Contract

- **Why:** Flat 14-16 prop components force every call site to enumerate the same 7-11 string labels individually, creating repetition and misconfiguration risk. Grouping labels into typed objects reduces call-site noise and makes the component contract self-documenting.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `BookingCalendarPanel` and `OctorateCustomPageShell` each accept a `labels` typed bag; call sites pass a single object rather than 7-11 individual strings. All call sites updated, typecheck passes.
- **Source:** auto

## Fact-Find Reference
- Related brief: `docs/plans/brikette-booking-component-prop-sprawl/fact-find.md`
- Key findings used:
  - 6 call sites for `BookingCalendarPanel` all pass 7 label strings individually.
  - `summaryLabels` precedent already exists on `SecureBookingPageClient` and `OctorateCustomPageShell`.
  - `BookPageSections.BookPageSearchPanel` receives 5 labels from its parent, resolves 2 ARIA labels internally — bags both inline at the BCP call site.
  - `OctorateCustomPageShell` test uses `{...COPY}` spread — COPY fixture must be updated to grouped shape post-Task-2.
  - SBPC wraps OctorateCustomPageShell; all 10 SBPC label props flow verbatim to the inner shell (confirmed by reading SBPC source).

## Proposed Approach
- Chosen approach: **Labels-bag (additive type grouping)**. Define new typed objects `BookingCalendarPanelLabels` and `OctorateCustomPageShellLabels`. Replace individual label props with single `labels` objects on each component. All required fields — no optional labels. Update all call sites atomically within each task.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | BookingCalendarPanel labels bag | 85% | S | Complete (2026-03-11) | - | - |
| TASK-02 | IMPLEMENT | OctorateCustomPageShell + SBPC labels bag | 85% | M | Complete (2026-03-11) | - | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | — | Independent — different components and call sites, no shared files |

## Tasks

---

### TASK-01: BookingCalendarPanel — labels bag

- **Type:** IMPLEMENT
- **Deliverable:** Updated `BookingCalendarPanel.tsx` props type + 6 updated call sites
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-11)
- **Build evidence:** `BookingCalendarPanelLabels` type exported; Props replaced `labels: BookingCalendarPanelLabels`; all 7 body usages updated; all 6 call sites updated with inline labels bag. `pnpm --filter brikette typecheck` ✓ | `pnpm --filter brikette lint` ✓.
- **Affects:**
  - `apps/brikette/src/components/booking/BookingCalendarPanel.tsx`
  - `apps/brikette/src/app/[lang]/dorms/RoomsPageContent.tsx`
  - `apps/brikette/src/app/[lang]/private-rooms/double-room/book/DoubleRoomBookContent.tsx`
  - `apps/brikette/src/app/[lang]/private-rooms/book/ApartmentBookContent.tsx`
  - `apps/brikette/src/components/rooms/detail/RoomDetailBookingSections.tsx`
  - `apps/brikette/src/components/booking/BookPageSections.tsx`
  - `apps/brikette/src/components/landing/BookingWidget.tsx`
- **Depends on:** —
- **Blocks:** —
- **Confidence:** 85%
  - Implementation: 85% — all 6 call sites read; TypeScript enforces completeness; `BookPageSections` hybrid (5 pre-resolved + 2 ARIA from `resolveBookingControlLabels`) is understood.
  - Approach: 90% — labels-bag pattern is established (`summaryLabels` precedent); hook alternative explicitly evaluated and ruled out.
  - Impact: 90% — pure structural refactor; identical runtime behaviour; no visible change to end users.
  - Held-back test: "What would push any dimension below 80?" — `BookPageSections` receives 5 labels from its parent `BookPageSearchPanelProps`; constructing the bag inline at the BCP call site is slightly more verbose but requires no parent change. No single unknown would drop implementation below 80.
- **Acceptance:**
  - `BookingCalendarPanelLabels` type exported from `BookingCalendarPanel.tsx`:
    ```ts
    type BookingCalendarPanelLabels = {
      stayHelper: string;
      clearDates: string;
      checkIn: string;
      checkOut: string;
      guests: string;
      decreaseGuests: string;
      increaseGuests: string;
    };
    ```
  - `BookingCalendarPanel` accepts `labels: BookingCalendarPanelLabels` (required) and no longer accepts the 7 individual label string props.
  - All 6 call sites pass a `labels` bag; none pass individual label props.
  - `pnpm --filter brikette typecheck` passes with 0 errors.
  - `pnpm --filter brikette lint` passes with 0 errors.
  - No visible change to UI behaviour.
- **Validation contract (TC-01):**
  - TC-01: TypeScript type for `BookingCalendarPanel` — `labels: BookingCalendarPanelLabels` is present and all 7 prior individual props are absent from the Props type → confirmed by reading the updated file.
  - TC-02: All 6 call sites compile without type errors → `pnpm --filter brikette typecheck` passes.
  - TC-03: `BookPageSections.BookPageSearchPanel` constructs the bag inline using its own 5 label props + 2 from `resolveBookingControlLabels` → confirmed by reading the updated file.
- **Execution plan:**
  - **Read** current `BookingCalendarPanel.tsx` props type; confirm exact field names.
  - **Define** `BookingCalendarPanelLabels` type above the props type in the same file.
  - **Update** `BookingCalendarPanelProps` to replace 7 individual string props with `labels: BookingCalendarPanelLabels`.
  - **Update** internal usages inside the component body (e.g., `labels.checkIn`, `labels.stayHelper`).
  - **Update** each of the 6 call sites:
    - `RoomsPageContent.tsx` — build bag inline from existing `t(...)` calls.
    - `DoubleRoomBookContent.tsx` — build bag inline.
    - `ApartmentBookContent.tsx` — build bag inline.
    - `RoomDetailBookingSections.tsx` — receives labels from parent; build bag from existing props.
    - `BookPageSections.tsx` (`BookPageSearchPanel`) — construct bag from 5 parent props + 2 from `resolveBookingControlLabels`.
    - `BookingWidget.tsx` — build bag inline from `resolveTranslatedCopy(t(...), ...)` calls.
  - **Run** `pnpm --filter brikette typecheck` and fix any errors.
  - **Run** `pnpm --filter brikette lint` and fix any import-sort issues.
- **Planning validation:**
  - Checks run: Read all 6 call sites in full; read `BookingCalendarPanel.tsx` props.
  - Validation artifacts: fact-find Investigation section; BookPageSections.tsx read confirming hybrid label pattern.
  - Unexpected findings: `BookPageSections` passes 5 labels from its own parent props (not i18n direct) — handled by building bag from those 5 + 2 ARIA from `resolveBookingControlLabels` inline.
- **Scouts:** None: all call sites read and patterns confirmed.
- **Edge Cases & Hardening:**
  - `BookingWidget.tsx` uses `resolveTranslatedCopy(t(...), fallback, key)` for some labels — these already return `string`, so they are compatible with the bag fields directly.
  - `decreaseGuests` and `increaseGuests` in the bag correspond to `decreaseGuestsAriaLabel` and `increaseGuestsAriaLabel` on the old props — confirm field name mapping is applied correctly in the component body.
- **What would make this >=90%:**
  - Verify `BookingWidget.tsx` label resolution produces `string` in all cases (not `string | undefined`).
- **Rollout / rollback:**
  - Rollout: atomic TypeScript change — either all call sites compile or none.
  - Rollback: revert the single commit.
- **Documentation impact:** None: internal refactor; no public API or docs.
- **Notes / references:**
  - Fact-find: `docs/plans/brikette-booking-component-prop-sprawl/fact-find.md`

---

### TASK-02: OctorateCustomPageShell + SBPC — labels bag

- **Type:** IMPLEMENT
- **Deliverable:** Updated `OctorateCustomPageShell.tsx`, `SecureBookingPageClient.tsx`, `secure-booking/page.tsx`, and test COPY fixture
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-11)
- **Build evidence:** `OctorateCustomPageShellLabels` type exported from `OctorateCustomPageShell.tsx`; Props replaced with `labels: OctorateCustomPageShellLabels`; all 10 body usages updated. `SecureBookingPageClient` Props updated with `labels: OctorateCustomPageShellLabels`; OCPS call passes `labels={labels}`. `secure-booking/page.tsx` assembles bag from `resolveLabel(tBook, ...)` calls; `continueLabel` retained as local var for `<noscript>` use. Test COPY fixture restructured to nested `labels: { ... }` sub-object; all 5 test renders use `{...COPY}` spread. `pnpm --filter brikette typecheck` ✓ | `pnpm --filter brikette lint` ✓.
- **Affects:**
  - `apps/brikette/src/components/booking/OctorateCustomPageShell.tsx`
  - `apps/brikette/src/components/booking/SecureBookingPageClient.tsx`
  - `apps/brikette/src/app/[lang]/book/secure-booking/page.tsx`
  - `apps/brikette/src/test/components/octorate-custom-page-shell.test.tsx`
- **Depends on:** —
- **Blocks:** —
- **Confidence:** 85%
  - Implementation: 85% — all 4 affected files read; OctorateCustomPageShell test COPY structure confirmed; SBPC boundary defined in plan.
  - Approach: 85% — SBPC passes `labels: OctorateCustomPageShellLabels` from its RSC caller; OctorateCustomPageShell receives the same bag and maps internally. Pattern is consistent with `summaryLabels` precedent.
  - Impact: 90% — pure structural refactor; test fixture must be updated but test logic is unchanged.
  - Held-back test: "What would push any dimension below 80?" — SBPC keeps `bookingCode`, `bookPath`, `ratePlanLabels`, `roomLabels`, `summaryLabels`, `widgetGlobalKey?`, `widgetScriptSrc?` unchanged; only the 10 individual string props become `labels`. Test COPY shape is a flat object that becomes `{ ...COPY_base, labels: { ... } }`. No known unknown would push below 80.
- **Acceptance:**
  - `OctorateCustomPageShellLabels` type exported from `OctorateCustomPageShell.tsx`:
    ```ts
    type OctorateCustomPageShellLabels = {
      continue: string;
      heading: string;
      loading: string;
      ready: string;
      fallbackTitle: string;
      fallbackBody: string;
      security: string;
      step: string;
      supporting: string;
      widgetHost: string;
    };
    ```
  - `OctorateCustomPageShell` accepts `labels: OctorateCustomPageShellLabels` (required) and no longer accepts the 10 individual label string props (`continueLabel`, `heading`, `loadingText`, `readyText`, `fallbackTitle`, `fallbackBody`, `securityNote`, `stepLabel`, `supportingText`, `widgetHostLabel`).
  - `SecureBookingPageClient` accepts `labels: OctorateCustomPageShellLabels` (required) instead of its 10 individual string label props (all shared with `OctorateCustomPageShell`'s 10 label props).
  - `secure-booking/page.tsx` RSC assembles the `labels` bag from `resolveLabel(tBook, ...)` calls and passes it as a single prop.
  - Test COPY fixture in `octorate-custom-page-shell.test.tsx` restructured to `labels: { ... }` — test spread usage maintained: `<OctorateCustomPageShell {...COPY} directUrl={directUrl} ... />` where `COPY` now includes `labels` as a sub-object.
  - `pnpm --filter brikette typecheck` passes with 0 errors.
  - `pnpm --filter brikette lint` passes with 0 errors.
- **Validation contract (TC-02):**
  - TC-01: `OctorateCustomPageShell.tsx` Props type has `labels: OctorateCustomPageShellLabels` and no individual label string props → confirmed by reading updated file.
  - TC-02: `SecureBookingPageClient.tsx` Props type has `labels: OctorateCustomPageShellLabels` and no individual label string props → confirmed by reading updated file.
  - TC-03: `secure-booking/page.tsx` assembles and passes `labels` bag as single prop → confirmed by reading updated file.
  - TC-04: Test COPY fixture uses `labels: { ... }` sub-object; all 5 test renders compile → `pnpm --filter brikette typecheck` passes.
- **Execution plan:**
  - **Read** current `OctorateCustomPageShell.tsx` to confirm exact field names for the 10 label props.
  - **Define** `OctorateCustomPageShellLabels` type. Export it so SBPC can import and use it.
  - **Update** `OctorateCustomPageShell` Props: replace 10 individual label props with `labels: OctorateCustomPageShellLabels`. Update component body usages (e.g., `labels.continue`, `labels.widgetHost`).
  - **Update** `SecureBookingPageClient` Props: replace 10 individual string label props (all map directly to `OctorateCustomPageShellLabels` fields; `continueLabel` → `labels.continue`, `widgetHostLabel` → `labels.widgetHost`, etc.) with `labels: OctorateCustomPageShellLabels`. Update the internal pass-through to `OctorateCustomPageShell`.
  - **Update** `secure-booking/page.tsx`: assemble `labels` bag from existing `resolveLabel(tBook, ...)` calls; pass as `labels={...}`.
  - **Update** test COPY fixture: extract label fields from flat `COPY` into `labels: { ... }`. Update type annotation if explicit. Ensure all 5 test renders using `{...COPY}` spread work with new shape.
  - **Run** `pnpm --filter brikette typecheck` and fix any errors.
  - **Run** `pnpm --filter brikette lint` and fix any import-sort issues.
- **Planning validation:**
  - Checks run: Read all 4 affected files; confirmed SBPC wraps OctorateCustomPageShell; confirmed COPY spread in test; confirmed `summaryLabels` stays unchanged.
  - Validation artifacts: fact-find Investigation section; test file confirmed at fact-find time.
  - Unexpected findings: None.
- **Consumer tracing (new outputs):**
  - New `OctorateCustomPageShellLabels` type: consumed by `OctorateCustomPageShell` (props), `SecureBookingPageClient` (props import), `secure-booking/page.tsx` (RSC assembler). All three addressed in this task.
  - Modified: `OctorateCustomPageShell` Props type — sole caller is `SecureBookingPageClient`; addressed in this task.
  - Modified: `SecureBookingPageClient` Props type — sole caller is `secure-booking/page.tsx`; addressed in this task.
- **Scouts:** None: all consumers identified and addressed within this task.
- **Edge Cases & Hardening:**
  - `continueLabel` in SBPC maps to `labels.continue` in the bag. Confirm field name is consistent when passed to OctorateCustomPageShell (which uses `labels.continue` → renders as `continue` button label).
  - Test COPY spread (`{...COPY}`) must still work post-update since `COPY` will now include `labels` as a nested object — this is spread correctly to `labels={COPY.labels}` implicitly. Confirm TypeScript is satisfied.
- **What would make this >=90%:**
  - Confirm field-by-field mapping of 10 OctorateCustomPageShell label props to bag field names before writing.
- **Rollout / rollback:**
  - Rollout: atomic TypeScript change — 4-file co-update.
  - Rollback: revert the single commit.
- **Documentation impact:** None: internal refactor; no public API or docs.
- **Notes / references:**
  - Fact-find: `docs/plans/brikette-booking-component-prop-sprawl/fact-find.md`
  - Test file: `apps/brikette/src/test/components/octorate-custom-page-shell.test.tsx`

---

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: BookingCalendarPanel labels bag | Yes — all 6 call sites read; props type read | None | No |
| TASK-02: OctorateCustomPageShell + SBPC labels bag | Yes — all 4 affected files read; SBPC boundary defined | None | No |

Both tasks are independent — no shared affected files. Wave 1 can execute in parallel.

---

## Risks & Mitigations

- **Call-site type breakage** — TypeScript enforces completeness; partial migration is impossible. Low risk.
- **Test fixture shape mismatch** — COPY spread test pattern: after refactor `COPY` contains `labels` as sub-object; spread `{...COPY}` passes it correctly. TypeScript confirms at TC-04.
- **`summaryLabels` naming conflict** — the new `labels` bag is a distinct prop from `summaryLabels` on both components; no naming conflict.
- **TASK-01 and TASK-02 touching different files** — parallel execution safe; no shared files.

## Observability
None: internal refactor with no runtime behaviour change, no logging or metrics needed.

## Acceptance Criteria (overall)
- [ ] `BookingCalendarPanel` has `labels: BookingCalendarPanelLabels` prop; 7 individual label props removed.
- [ ] All 6 `BookingCalendarPanel` call sites pass labels bag.
- [ ] `OctorateCustomPageShell` has `labels: OctorateCustomPageShellLabels` prop; 10 individual label props removed.
- [ ] `SecureBookingPageClient` has `labels: OctorateCustomPageShellLabels` prop; 10 individual label props removed.
- [ ] Test COPY fixture updated; all 5 renders compile.
- [ ] `pnpm --filter brikette typecheck` passes after each task.
- [ ] `pnpm --filter brikette lint` passes after each task.

## Decision Log
- 2026-03-11: Hook-based alternative (`useBookingCalendarLabels`) evaluated and deferred — labels-bag keeps component pure; hook extraction at call sites is optional follow-on.
- 2026-03-11: Widget config group (`widgetGlobalKey`, `widgetScriptSrc`, `widgetBootstrap`) deferred — labels cleanup is the primary value; widget group is adjacent scope.
- 2026-03-11: `embedTitle?` (optional OCPS prop; used as iframe `title` with `heading` as fallback) excluded from labels bag — optional prop with fallback is low-noise; exclusion consistent with widget config group deferral pattern.
- 2026-03-11: TASK-01 and TASK-02 are independent — no shared files; wave-1 parallel dispatch eligible.

## Overall-confidence Calculation
- TASK-01: S=1, 85% → 85
- TASK-02: M=2, 85% → 170
- Overall = (85 + 170) / 3 = 85%
