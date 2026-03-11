---
Type: Fact-Find
Status: Ready-for-planning
Feature-Slug: brikette-booking-component-prop-sprawl
Dispatch-ID: IDEA-DISPATCH-20260311100002-3102
Business: BRIK
Date: 2026-03-11
Outcome: planning
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
---

# Fact-Find: Booking Component Prop Sprawl

## Trigger

Three core booking UI components expose all configuration options as flat props rather than grouping
them into semantically cohesive shapes. The result is verbose, repetitive call sites that are easy
to mis-configure and costly to extend.

## Access Declarations

None — investigation is fully codebase-local. No external APIs or services required.

---

## Investigation

### BookingCalendarPanel — 15 props, 6 call sites

**File:** `apps/brikette/src/components/booking/BookingCalendarPanel.tsx`

Props:
```
lang?, range, onRangeChange, pax, onPaxChange, minPax?, maxPax?,
stayHelperText, clearDatesText, checkInLabelText, checkOutLabelText,
guestsLabelText, decreaseGuestsAriaLabel, increaseGuestsAriaLabel,
actionSlot?
```

**Natural groups already visible:**
- **Date control** (6 props): `range`, `onRangeChange`, `checkInLabelText`, `checkOutLabelText`, `stayHelperText`, `clearDatesText`
- **Pax control** (5 props): `pax`, `onPaxChange`, `minPax`, `maxPax`, `guestsLabelText`, `decreaseGuestsAriaLabel`, `increaseGuestsAriaLabel`
- **Misc** (2): `lang`, `actionSlot`

**Call sites (6 locations):**
- `apps/brikette/src/app/[lang]/dorms/RoomsPageContent.tsx` — passes 13 props
- `apps/brikette/src/app/[lang]/private-rooms/double-room/book/DoubleRoomBookContent.tsx` — passes 14 props
- `apps/brikette/src/app/[lang]/private-rooms/book/ApartmentBookContent.tsx` — passes 14 props
- `apps/brikette/src/components/rooms/detail/RoomDetailBookingSections.tsx` — passes 13 props
- `apps/brikette/src/components/booking/BookPageSections.tsx` — passes 14+ props
- `apps/brikette/src/components/landing/BookingWidget.tsx` — passes 14 props

Every call site repeats the full set of 7 string label props individually. Label resolution
is duplicated across all 6 parents via `t(...)` or `resolveTranslatedCopy(t(...))` calls.

**Key pain point:** The 7 label strings (`stayHelperText`, `clearDatesText`, `checkInLabelText`,
`checkOutLabelText`, `guestsLabelText`, `decreaseGuestsAriaLabel`, `increaseGuestsAriaLabel`)
are resolved identically from the same i18n keys in at least 4 of the 6 call sites (confirmed).
`RoomDetailBookingSections` receives pre-resolved strings from its parent; `BookPageSections`
requires a full read to confirm whether its label source is i18n-direct or pre-resolved.

### SecureBookingPageClient — 16 props, 1 call site

**File:** `apps/brikette/src/components/booking/SecureBookingPageClient.tsx`

Props:
```
bookingCode, bookPath, continueLabel, fallbackBody, fallbackTitle, heading,
loadingText, readyText, ratePlanLabels, roomLabels, securityNote, stepLabel,
supportingText, summaryLabels, widgetGlobalKey?, widgetHostLabel, widgetScriptSrc?
```

Single call site: `apps/brikette/src/app/[lang]/book/secure-booking/page.tsx` (RSC).
The RSC resolves all 11 individual string labels from `tBook(...)` and passes them down.
`summaryLabels` is already grouped (5 fields → 1 prop) — a pattern established at some point.

**Pattern observation:** `summaryLabels` already demonstrates the grouped-labels approach.
The 11 individual string label props are candidates for a `labels: SecureBookingLabels` bag
on the same pattern.

### OctorateCustomPageShell — 19 props, 1 production call site + test usage

**File:** `apps/brikette/src/components/booking/OctorateCustomPageShell.tsx`

Props:
```
continueLabel, directUrl, embedTitle?, embedUrl?, fallbackBody, fallbackTitle,
heading, loadingText, readyText, securityNote, stepLabel, supportingText,
summary, summaryLabels, widgetHostLabel, widgetGlobalKey?, widgetScriptSrc?,
widgetBootstrap?
```

**Group: widget config** (4 props): `widgetGlobalKey`, `widgetScriptSrc`, `widgetBootstrap`, `widgetHostLabel`
**Group: embed config** (2 props): `directUrl`, `embedUrl`, `embedTitle`
**Group: UI labels** (9 props): `continueLabel`, `fallbackBody`, `fallbackTitle`, `heading`, `loadingText`, `readyText`, `securityNote`, `stepLabel`, `supportingText`
**Group: booking data** (2 props): `summary`, `summaryLabels`

**Critical observation:** The test file already uses a `COPY` spread:
```tsx
<OctorateCustomPageShell {...COPY} directUrl={directUrl} ... />
```
The `COPY` object contains all string labels as a flat object. This is exactly the grouped-labels
pattern — test authors already found the pattern to be the ergonomic solution.

### Overlap Between SecureBookingPageClient and OctorateCustomPageShell

`SecureBookingPageClient` wraps `OctorateCustomPageShell` and passes most of its props through
verbatim. 10 of the 11 string label props in `SecureBookingPageClient` flow directly to the inner
`OctorateCustomPageShell`. This means grouping labels at the `OctorateCustomPageShell` level
simultaneously cleans up `SecureBookingPageClient`'s pass-through.

### What a Labels-Group Refactor Would Look Like

For `BookingCalendarPanel`:
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
// Prop: labels: BookingCalendarPanelLabels
// Removes 7 flat string props, adds 1 typed object prop
```

For `OctorateCustomPageShell` / `SecureBookingPageClient`:
```ts
type BookingUiLabels = {
  continue: string; heading: string; loading: string; ready: string;
  fallbackTitle: string; fallbackBody: string; security: string;
  step: string; supporting: string; widgetHost: string;
};
// Removes 10 flat string props, adds 1 typed object prop
```

### Is There a Booking Config Bag Pattern (Full Config Object)?

Examined whether a `bookingConfig` bag (grouping *all* props including handlers) makes sense.
**Evidence suggests no** for `BookingCalendarPanel`:
- `range`, `onRangeChange`, `pax`, `onPaxChange` are stateful and vary independently at call sites.
- Grouping handlers into a bag makes partial updates awkward and introduces unnecessary indirection.
- Labels are the natural candidate for a single grouped type — they're always static strings.

A `bookingConfig` bag would over-engineer. Label grouping is the bounded, high-value change.

### Hook Alternative Considered and Ruled Out

A `useBookingCalendarLabels(t, tModals?)` hook could resolve all 7 labels internally and return
a `BookingCalendarPanelLabels` object, eliminating the i18n duplication at source (inside each
parent component) rather than just at the prop boundary. This is a valid alternative.

**Why labels-bag is preferred here:**
- `BookingCalendarPanel` is a presentational component; giving it i18n context via a hook
  couples it to the i18n namespace structure and makes it harder to use in isolation or tests.
- The labels-bag approach keeps the component pure: it accepts strings, renders strings.
- A hook could wrap the labels-bag at each call site as a follow-on improvement if desired.

Decision: labels-bag for the component; hook extraction at call sites is a separate, optional step.

### Widget Config Group for OctorateCustomPageShell

`widgetGlobalKey`, `widgetScriptSrc`, `widgetBootstrap` are already optional and co-vary —
three different ways to bootstrap the Octorate widget. These are candidates for:
```ts
type OctorateWidgetConfig = {
  globalKey?: string;
  scriptSrc?: string;
  bootstrap?: OctorateCustomPageBootstrap;
  hostLabel: string; // widgetHostLabel moves here
};
// Prop: widget: OctorateWidgetConfig
```

But `hostLabel` (the iFrame title) has weaker cohesion with bootstrap config. This group
could be deferred to a second task if the labels-only change proves sufficient.

---

## Key Files / Modules

1. `apps/brikette/src/components/booking/BookingCalendarPanel.tsx` — primary target
2. `apps/brikette/src/components/booking/OctorateCustomPageShell.tsx` — 19-prop outer shell
3. `apps/brikette/src/components/booking/SecureBookingPageClient.tsx` — 16-prop wrapper
4. `apps/brikette/src/app/[lang]/dorms/RoomsPageContent.tsx` — call site (7 label props)
5. `apps/brikette/src/app/[lang]/private-rooms/double-room/book/DoubleRoomBookContent.tsx` — call site
6. `apps/brikette/src/app/[lang]/private-rooms/book/ApartmentBookContent.tsx` — call site
7. `apps/brikette/src/components/booking/BookPageSections.tsx` — call site
8. `apps/brikette/src/components/landing/BookingWidget.tsx` — call site
9. `apps/brikette/src/app/[lang]/book/secure-booking/page.tsx` — single SecureBookingPageClient caller
10. `apps/brikette/src/components/rooms/detail/RoomDetailBookingSections.tsx` — BCP call site (receives pre-resolved labels from parent)
11. `apps/brikette/src/test/components/octorate-custom-page-shell.test.tsx` — test using COPY spread

---

## Risks

1. **Call-site type breakage** — changing props type breaks all 6 `BookingCalendarPanel` call sites simultaneously. Requires co-change across multiple files. Risk: low if done atomically.
2. **Test fixture drift** — the OctorateCustomPageShell test uses `{...COPY}` spread; post-refactor the COPY type must match the new label bag shape.
3. **Partial migration state** — if only some call sites are updated, TypeScript will surface the rest. This is a feature not a risk — TS enforces completeness.
4. **summaryLabels vs new labels group** — `summaryLabels` already exists as a group; the new bag must not conflict in naming with it.

---

## Open Questions

All resolved from investigation.

**Q: Is a full `bookingConfig` object the right pattern?**
A: No. Labels are the natural grouping unit. Handlers/state props should remain flat because they vary independently.

**Q: Does OctorateCustomPageShell's widget group (widgetGlobalKey, widgetScriptSrc, widgetBootstrap) warrant a separate `widget` prop?**
A: Plausible but low priority. Defer to a second task if needed. Labels cleanup is the primary value.

**Q: Are there any auto-generated prop lists (e.g. Storybook, docs)?**
A: Not found. No Storybook config in brikette. Change is safe.

---

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| BookingCalendarPanel props and call sites | Yes | None | No |
| SecureBookingPageClient props and call site | Yes | None | No |
| OctorateCustomPageShell props and call sites | Yes | None | No |
| Test fixtures using {...COPY} spread | Yes | None — tests use spread pattern, migration is consistent | No |
| i18n label resolution duplication at call sites | Yes | None | No |
| TypeScript type impact across all call sites | Yes | All 6 BCP call sites + 1 SBPC + shell identified | No |

---

## Scope Signal

Signal: `right-sized`
Rationale: 3 components, 6+1+1 call sites, all in `apps/brikette`, pure TypeScript
label-grouping refactor. No cross-package changes. No runtime behaviour change.
Typecheck enforces completeness atomically.

---

## Evidence Gap Review

### Gaps Addressed
- All 6 `BookingCalendarPanel` call sites identified and read.
- All 3 component Props types read in full.
- Existing `summaryLabels` grouped-prop precedent confirmed.
- Widget config group assessed and deferred.

### Confidence Adjustments
- Confidence is 90. The refactor is structurally clear. The only uncertainty is whether
  the PR author wants the `OctorateWidgetConfig` group in the same task or deferred — this
  is a scoping preference, not a technical unknown.

### Remaining Assumptions
- No hidden consumers of these components outside `apps/brikette/src/` (grep confirmed all sites).
- `OctorateCustomPageShell` is not exported from any package index for external use.

---

## Proposed Plan Outline

**Task 1 (IMPLEMENT):** Define `BookingCalendarPanelLabels` type and update `BookingCalendarPanel` to use `labels: BookingCalendarPanelLabels`. Update all 6 call sites.

**Task 2 (IMPLEMENT):** Define `OctorateCustomPageShellLabels` type and update `OctorateCustomPageShell` to use `labels: OctorateCustomPageShellLabels`. Update `SecureBookingPageClient` to also accept `labels: OctorateCustomPageShellLabels` (replacing its 11 individual string props); its single RSC caller (`secure-booking/page.tsx`) is updated to pass the assembled bag. Update test COPY fixture to match new type shape. All label fields are required strings (no optional labels).

**Checkpoint:** `pnpm --filter brikette typecheck` must pass after each task.

---

## Outcome Contract

- **Why:** Flat 14-16 prop components force every call site to enumerate the same 7-11 string labels individually, creating repetition and misconfiguration risk. Grouping labels into typed objects reduces call-site noise and makes the component contract self-documenting.
- **Intended Outcome Statement:** `BookingCalendarPanel` and `OctorateCustomPageShell` each accept a `labels` typed bag; call sites pass a single object rather than 7-11 individual strings. All call sites updated, typecheck passes.
- **Source:** IDEA-DISPATCH-20260311100002-3102 (fact_find_ready, from simplify session)
