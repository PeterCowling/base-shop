---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-28
Last-updated: 2026-02-28
Last-reviewed: 2026-02-28
Feature-Slug: brik-date-range-picker
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brik-date-range-picker/plan.md
Business-OS-Integration: off
Business-Unit: BRIK
Trigger-Why: Two-field native date inputs give no visual range feedback, no min/max stay enforcement at the picker level, and require two separate gestures. A range calendar picker removes friction at the most critical booking funnel entry point.
Trigger-Intended-Outcome: type: operational | statement: Replace all four Brikette booking-date surfaces with DayPicker Range Mode; enforce 2-night minimum and 8-night maximum at selection time; show DD MMM → DD MMM (N nights) summary and "2–8 nights" inline helper | source: operator
---

# Brikette Date Range Picker Fact-Find Brief

## Scope

### Summary

All four Brikette booking-date surfaces — `/book` page, `BookingWidget` (landing hero), `RoomDetailContent` (room detail), and `ApartmentBookContent` (apartment booking) — use two separate `<input type="date">` elements for check-in and check-out. There is no visual range display and no single-interaction range selection. Min/max stay enforcement exists in JavaScript (`ensureMinCheckoutForStay`, `normalizeCheckoutForStay`, `isValidStayRange` from `bookingDateRules.ts`) on three surfaces, supplemented by HTML `min`/`max` attributes. `ApartmentBookContent` enforces only a 1-night minimum via `min={checkin}` with no JavaScript-level cap — missing `HOSTEL_MAX_STAY_NIGHTS` enforcement entirely. The HTML attribute approach provides no inline user feedback on desktop when a user types an out-of-bounds date directly.

The change replaces all four surfaces with `react-day-picker` Range Mode: first click sets `from` (check-in), second click sets `to` (check-out). Minimum stay of 2 nights and maximum stay of 8 nights are enforced at the picker level — preferring prevention of out-of-bound selection. State is stored as `{ from: Date | undefined; to: Date | undefined }` and serialized to ISO strings for all downstream consumers.

### Goals

- Install `react-day-picker` in `apps/brikette` and create a shared `DateRangePicker` wrapper component.
- Replace both `<input type="date">` elements in `BookPageContent`, `BookingWidget`, `RoomDetailContent` (`BookingDatePicker`), and `ApartmentBookContent` with the new component.
- Enforce `HOSTEL_MIN_STAY_NIGHTS = 2` / `HOSTEL_MAX_STAY_NIGHTS = 8` at selection time using DayPicker's `disabled` prop to block out-of-bound `to` choices after `from` is selected.
- Display derived summary adjacent to the picker: `DD MMM → DD MMM (N nights)`.
- Display inline helper under the picker: "2–8 nights".
- Provide a "Clear dates" action that resets range to `{ from: undefined, to: undefined }`.
- Add i18n keys for helper text, summary, and clear action in `bookPage`, `modals`, and `roomsPage` namespaces.

### Non-goals

- Replacing the guest/pax count selector (stays as is).
- Changing the Octorate URL construction logic (only input strings change, not the builder).
- Adding date unavailability from Octorate availability API (blocked calendar dates) — this is a separate concern covered in the `brik-octorate-live-availability` plan.
- Replacing `ApartmentBookContent`'s Octorate deep-link builder (`buildOctorateLink`) — only the date inputs are swapped.
- Internationalising the date format beyond the existing `resolveBookingDateFormat` approach.

### Constraints & Assumptions

- Constraints:
  - `bookingDateRules.ts` constants (`HOSTEL_MIN_STAY_NIGHTS`, `HOSTEL_MAX_STAY_NIGHTS`) are the authoritative source for min/max values — do not hardcode in picker.
  - All downstream consumers of dates (GA4 events, Octorate URL builders, availability hooks) expect ISO `YYYY-MM-DD` strings — the picker must convert `Date → ISO` before passing to them.
  - All four target surfaces are already `"use client"` components — DayPicker client-only rendering constraint is already satisfied.
  - CSS for DayPicker must not conflict with Tailwind v4. Use CSS modules or scoped import; do not rely on global Tailwind utility overrides.
  - react-day-picker v9 (latest) is the target — check that its peer dependency (`date-fns` or standalone) is compatible with the monorepo.
- Assumptions:
  - The landing-page `BookingWidget` uses the range picker in the same inline layout it already has (no popover/dropdown mechanism required — the widget is already an always-visible panel).
  - `ApartmentBookContent` currently does NOT enforce max-stay (`HOSTEL_MAX_STAY_NIGHTS`); this change is an opportunity to add it consistently.
  - DD MMM format (e.g., "03 Mar") uses the `dateUtils` locale helpers already in place.

## Outcome Contract

- **Why:** Two-field native date inputs give no visual range feedback, no min/max stay enforcement at the picker level, and require two separate gestures. A range calendar picker removes friction at the most critical booking funnel entry point.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All four Brikette booking-date surfaces replaced with DayPicker Range Mode; 2-night min / 8-night max enforced at selection; DD MMM → DD MMM (N nights) summary and "2–8 nights" helper visible on all surfaces.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/brikette/src/app/[lang]/book/BookPageContent.tsx` — `/[lang]/book` route; always-visible booking panel with two `<input type="date">` elements (lines 188, 205). Entry point for the primary conversion funnel.
- `apps/brikette/src/components/landing/BookingWidget.tsx` — Landing hero booking widget; two `<input type="date">` elements (lines 188, 206). Navigates to `/[lang]/book` on submit.
- `apps/brikette/src/app/[lang]/dorms/[id]/RoomDetailContent.tsx` — Room detail page; local `BookingDatePicker` sub-component (inline function, not exported) with `<input type="date" id="room-checkin">` and `<input type="date" id="room-checkout">`.
- `apps/brikette/src/app/[lang]/private-rooms/book/ApartmentBookContent.tsx` — Apartment booking page; two `<input type="date" id="checkin">` / `<input type="date" id="checkout">` elements. Missing `HOSTEL_MAX_STAY_NIGHTS` enforcement.

### Key Modules / Files

- `apps/brikette/src/utils/bookingDateRules.ts` — Single source of truth for min/max stay rules. All constants (`HOSTEL_MIN_STAY_NIGHTS = 2`, `HOSTEL_MAX_STAY_NIGHTS = 8`) and utility functions (`getMinCheckoutForStay`, `getMaxCheckoutForStay`, `isValidStayRange`, `normalizeCheckoutForStay`, `ensureMinCheckoutForStay`). **This module is the constraint authority and must be used in the new picker.**
- `apps/brikette/src/utils/dateUtils.ts` — ISO date helpers: `getTodayIso`, `getDatePlusTwoDays`, `addDays`, `formatDate`. No `Date → ISO` string formatter for DD MMM display — will need to extend or add `formatDisplayDate(date: Date, locale?: string): string`.
- `apps/brikette/src/utils/buildOctorateUrl.ts` — Builds Octorate URL from ISO string inputs. Downstream consumer of dates; unchanged by this work.
- `apps/brikette/src/utils/ga4-events.ts` — `fireSearchAvailability({ source, checkin, checkout, pax })` and `fireHandoffToEngine({ ..., checkin, checkout, pax, ... })` accept ISO strings. Unchanged; picker must convert before calling.
- `apps/brikette/src/hooks/useAvailability.ts` and `useAvailabilityForRoom.ts` — Accept ISO string `checkin`/`checkout`. Unchanged.
- `apps/brikette/src/i18n.config.ts` + locale files in `apps/brikette/src/locales/` — i18n namespaces: `bookPage`, `modals`, `roomsPage`. New keys needed for helper text ("2–8 nights"), summary pattern, and "Clear dates" action.

### Patterns & Conventions Observed

- All four surfaces are `"use client"` — DayPicker client-only rendering is already compatible — evidence: `apps/brikette/src/app/[lang]/book/BookPageContent.tsx` (line 1 `"use client"`)
- Date state is plain `string` (ISO `YYYY-MM-DD`) uniformly — evidence: `BookPageContent.tsx` `const [checkin, setCheckin] = useState(initialCheckin)` where `initialCheckin` is from `readQueryDate`.
- URL sync is via `window.history.replaceState` with `checkin=` and `checkout=` query params — evidence: `writeCanonicalBookingQuery` in `BookPageContent.tsx`.
- `BookingWidget` hydrates state from URL on mount (SSR-safe empty initial) — evidence: `BookingWidget.tsx` `hasHydrated.current` guard.
- No shared **range** date picker exists in `packages/ui` or `packages/design-system` — confirmed by grep. Note: `packages/design-system/src/molecules/DatePicker.tsx` exists but wraps `react-datepicker` for single-date selection only (no Range Mode). Documented above.
- No `DateRange` type exists in the brikette app or `packages/ui` — confirmed by grep. `react-day-picker` exports `DateRange`; it is already present in the workspace lockfile as a transitive dep but is not a direct dependency of `apps/brikette`.
- `packages/design-system/src/molecules/DatePicker.tsx` EXISTS — a `DatePicker` molecule wrapping `react-datepicker` (NOT `react-day-picker`). It supports single-date selection with `minDate`/`maxDate`/`filterDate` props but has **no Range Mode**. The operator specifically requires `react-day-picker` Range Mode (fundamentally different `DateRange: { from, to }` selection model vs single `Date`). Decision: do NOT extend the design-system `DatePicker`; install `react-day-picker` as a direct dependency of `apps/brikette` and create a purpose-built `DateRangePicker` there.
- `ApartmentBookContent` does NOT import `bookingDateRules` — it only enforces `min={checkin}` (1-night minimum, no maximum cap) — evidence: grep of `ApartmentBookContent.tsx` imports.

### Data & Contracts

- Types/schemas/events:
  - Current state shape: `checkin: string` (ISO) + `checkout: string` (ISO) separately in all four components.
  - Proposed new state shape: `range: { from: Date | undefined; to: Date | undefined }` (DayPicker `DateRange` type, re-exported from `react-day-picker`).
  - Conversion needed: `range.from` / `range.to` → ISO string via `formatDate(date)` from `dateUtils.ts` before passing to GA4, Octorate URL builder, availability hooks.
  - New type: `DateRange` imported from `react-day-picker` (or aliased locally).
- Persistence:
  - URL query params (`checkin=YYYY-MM-DD&checkout=YYYY-MM-DD`) remain the storage format — ISO string serialization unchanged.
  - `sessionStorage` restore in `ApartmentBookContent` stores `{ checkin, checkout }` as ISO strings — unchanged.
- API/contracts:
  - `useAvailability({ checkin: string, checkout: string, pax: string })` — interface unchanged.
  - `buildOctorateUrl({ checkin: string, checkout: string, ... })` — interface unchanged.
  - `fireSearchAvailability({ source, checkin, checkout, pax })` — interface unchanged.

### Dependency & Impact Map

- Upstream dependencies:
  - `bookingDateRules.ts` — constraints used by the new picker component; no changes to this module.
  - `dateUtils.ts` — may need a `formatDisplayDate(date: Date): string` helper for DD MMM display (or inline in the picker component).
  - `react-day-picker` — Add as a direct dependency to `apps/brikette/package.json`. Already present in workspace `pnpm-lock.yaml` as a transitive dep (v9.13.0); `pnpm add` promotes it to a direct dep without lockfile conflict.
- Downstream dependents:
  - `RoomsSection` / `RoomCard` — receives `bookingQuery` prop with ISO strings from `BookPageContent`; unchanged.
  - `StickyBookNow` — receives `octorateUrl` built from picker dates in `RoomDetailContent`; unchanged.
  - `buildOctorateUrl` — called with ISO strings; unchanged.
  - `fireSearchAvailability`, `fireHandoffToEngine`, `begin_checkout` — called with ISO strings; picker must convert before passing.
  - `useAvailability`, `useAvailabilityForRoom` — called with ISO strings; unchanged.
- Likely blast radius:
  - **4 files changed significantly:** `BookPageContent.tsx`, `BookingWidget.tsx`, `RoomDetailContent.tsx`, `ApartmentBookContent.tsx`.
  - **1 new file:** `apps/brikette/src/components/booking/DateRangePicker.tsx` (shared wrapper component).
  - **1 minor extension:** `dateUtils.ts` (add `formatDisplayDate` helper, or inline in picker).
  - **3 i18n locale files updated** per locale (bookPage, modals, roomsPage) for helper text, summary, and clear action.
  - **Tests updated/added:** `room-detail-date-picker.test.tsx` (update mocks), new `date-range-picker.test.tsx`.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + React Testing Library (RTL). `jest.setup.ts` configures `testIdAttribute: "data-cy"`.
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs --testPathPattern=<pattern>` (CI-only per testing policy).
- CI integration: Tests run in CI only. Do not run locally.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `bookingDateRules.ts` utilities | Unit | `apps/brikette/src/test/utils/bookingDateRules.test.ts` | Comprehensive: min/max constants, all utility functions, boundary cases |
| `RoomDetailContent` date picker | RTL component | `apps/brikette/src/test/components/room-detail-date-picker.test.tsx` | 4 cases: empty URL params seed, check-in change, invalid 0-night stay, min-pax button disabled |
| `buildOctorateUrl` | Unit | `apps/brikette/src/utils/buildOctorateUrl.test.ts` | Covers date validation guards |
| `BookingWidget` | None | — | No tests for date behavior in `BookingWidget` |
| `BookPageContent` | None | — | No tests for date behavior in `BookPageContent` |
| `ApartmentBookContent` | None | — | No tests |

#### Coverage Gaps

- Untested paths:
  - `BookingWidget` date interaction and URL-hydration behavior.
  - `BookPageContent` min/max checkout enforcement and `ensureMinCheckoutForStay` side-effect.
  - `ApartmentBookContent` session-restore path and date submission.
  - New `DateRangePicker` component — range selection, min/max enforcement, Clear dates.
- Extinct tests (after migration):
  - `room-detail-date-picker.test.tsx` TC-DP-02 currently fires a change on `<input type="date">` — will need rewrite to simulate DayPicker click interactions.
  - TC-DP-03 (0-night invalid stay) — the mechanism changes from HTML `min` attribute to DayPicker `disabled` prop; test assertion must be rewritten.

#### Testability Assessment

- Easy to test:
  - `DateRangePicker` component: pure render + user events (RTL `userEvent.click`).
  - Range-validation logic (min/max day disabling): unit test the `disabled` predicate function.
  - ISO string conversion (`Date → ISO`): pure utility test.
- Hard to test:
  - DayPicker month navigation in RTL (calendar DOM is complex). Recommend scoped integration tests only.
  - Cross-locale `formatDisplayDate` output — locale-dependent; test with explicit locale argument.
- Test seams needed:
  - `DateRangePicker` must accept a `data-cy` prop or expose day cells with `data-cy` attributes for testing (per Jest `testIdAttribute: "data-cy"` configuration).

#### Recommended Test Approach

- Unit tests for: `formatDisplayDate` helper; `disabled` predicate (min/max enforcement logic).
- Integration tests for: `DateRangePicker` — from→to selection flow, min/max prevention, Clear dates, summary display.
- Update: `room-detail-date-picker.test.tsx` — rewrite TC-DP-02/TC-DP-03 for DayPicker interaction model.
- E2E tests for: Not in scope for this change (existing Playwright suite covers booking flow end-to-end: `apps/brikette/e2e/availability-smoke.spec.ts`). Update smoke spec if date picker selector strategy changes.

### Recent Git History (Targeted)

- `apps/brikette/src/utils/bookingDateRules.ts` / `BookPageContent.tsx` — `53f91fd` "brikette: enforce booking bounds for pax and stay length" + `1d9654728b` "brikette: enforce 2-night minimum booking windows" — these commits established the current min/max enforcement. Confirms the rules are intentional and stable.
- `apps/brikette/src/app/[lang]/dorms/[id]/RoomDetailContent.tsx` — `1dc4e3f8fa` "feat(brikette): rename rooms→dorms and apartment→private-rooms" — recent route rename; confirms no other date picker work was bundled into this change.

## External Research (If Needed)

- **react-day-picker v9 Range Mode:** The `mode="range"` prop enables range selection. The `selected` prop accepts `DateRange` (`{ from: Date | undefined; to: Date | undefined }`). The `disabled` prop accepts a `Matcher` — a function `(date: Date) => boolean` — which can dynamically disable out-of-bound to-dates after from is selected. This is the preferred prevention mechanism. Source: react-day-picker official docs (daypicker.dev).
- **CSS strategy:** react-day-picker v9 exports `react-day-picker/style.css` for default styles. For Tailwind v4 projects, the recommended approach is to import the CSS module (`react-day-picker/dist/style.module.css`) and compose with CSS-in-JS or use the unstyled API (`classNames` prop) to apply Tailwind classes. Given the project uses Tailwind v4 globals, CSS modules are the safest integration path to prevent cascade conflicts.
- **Bundle size:** react-day-picker v9 is ~15kB gzipped with tree-shaking; DayPicker v8 was ~45kB. v9 is the correct target.
- **Peer dependency:** react-day-picker v9 has no mandatory date library peer dependency (date-fns is optional). The app already has `dateUtils.ts` with ISO string utilities; no additional library needed.

## Questions

### Resolved

- **Q: Does `ApartmentBookContent` need the range picker?**
  - A: Yes. It currently uses two `<input type="date">` with only a 1-night minimum and no max — inconsistent with the hostel booking rules. Migrating it to the shared `DateRangePicker` adds the missing `HOSTEL_MAX_STAY_NIGHTS` cap, making all surfaces consistent.
  - Evidence: Confirmed via `ApartmentBookContent.tsx` — no `bookingDateRules` import, only `min={checkin}` on the checkout input.

- **Q: Does the `BookingWidget` need a popover/modal to house the calendar?**
  - A: The `BookingWidget` is an always-rendered inline panel (confirmed by reading `BookingWidget.tsx` — no toggle/drawer, always mounted). This means inline calendar expansion is technically feasible without adding a popover library. However, the calendar occupies significant vertical space (~300px for a single-month view), which may push below-the-fold content down on the landing page. The structural question (inline vs popover) is code-resolvable from layout; but the UX preference (should the calendar be always-visible or triggered by clicking the field?) is an operator aesthetic call. Recommendation: **inline** as default implementation, with the landing-page layout impact flagged. See Open question Q1 for final confirmation.
  - Evidence: `BookingWidget.tsx` structure — always-rendered panel, no toggle/drawer.

- **Q: Is react-day-picker SSR-safe?**
  - A: All four surfaces are already `"use client"` — SSR compatibility is a non-issue. DayPicker renders entirely in the browser.
  - Evidence: `"use client"` directives confirmed in all four target files.

- **Q: Is `formatDate` from `dateUtils.ts` sufficient for the DD MMM summary, or is a new helper needed?**
  - A: `formatDate(date: Date): string` in `dateUtils.ts` returns `YYYY-MM-DD`. DD MMM requires a separate format (e.g., `"03 Mar"`). Either a new `formatDisplayDate(date: Date): string` helper is added to `dateUtils.ts`, or the format is inline in the picker component. Adding to `dateUtils.ts` is preferred for testability.
  - Evidence: `dateUtils.ts` confirmed to return ISO format only.

- **Q: Should the N-nights calculation use `differenceInDays` from a date library or the existing `addDays` approach?**
  - A: DayPicker passes `Date` objects (already local-time, representing the day the user clicked). The simplest approach: `nights = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))`. Since both `from` and `to` come directly from DayPicker (which uses the user's local timezone), this arithmetic is TZ-safe. No external library needed.
  - Evidence: `bookingDateRules.ts` uses ISO string comparison (lexicographic) for validation; `dateUtils.ts` `addDays` uses `new Date(dateStr)` + `setDate`.

- **Q: How should ISO strings be converted to `Date` for DayPicker initial values?**
  - A: **TZ-safe construction required.** `new Date("YYYY-MM-DD")` parses as UTC midnight, which can shift the date by one day in negative-offset timezones. Use local-time construction: `parseIsoToLocalDate(iso: string): Date → const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d)`. This function must be added to `dateUtils.ts` in TASK-02 and used everywhere a DayPicker `Date` is constructed from an ISO string. The inverse (`Date → ISO string`) already exists as `formatDate(date: Date): string` in `dateUtils.ts` (uses local time — already safe). Do NOT use `new Date(isoString)` or `date.toISOString()` anywhere in the picker implementation.
  - Evidence: `dateUtils.ts` confirms `formatDate` uses local time (explicit year/month/day extraction via `getFullYear`/`getMonth`/`getDate`). The `addDays` function uses `new Date(dateStr)` then `setDate` — this is UTC-unsafe for the initial construction; however the `setDate` on a local `Date` object typically corrects, making it incidentally safe. To remove ambiguity, the new `parseIsoToLocalDate` helper is cleaner and unambiguous.

### Open (Operator Input Required)

- **Q: Should the calendar picker in `BookingWidget` render inline (expanding the widget) or as a triggered popover?**
  - Why operator input is required: Both are technically feasible. The agent recommends inline (simpler, no additional library). The UX preference — whether the calendar should be always-visible or appear on field click — is an aesthetic and layout call the operator must confirm before TASK-04 begins.
  - Decision impacted: TASK-04 scope — inline adds no library; popover requires Floating UI or similar (additional dependency + complexity).
  - Decision owner: Operator (Pete)
  - Default assumption + risk: **Inline**. Risk: calendar adds ~300px height to the landing widget, pushing below-fold content further down. If popover is preferred after seeing the inline result, it can be retrofitted post-ship.

## Confidence Inputs

- **Implementation: 92%**
  - Evidence: All four entry points located; current state fully read; rule constants and utility functions confirmed in `bookingDateRules.ts`; no architectural unknowns. Reduction reason: popover vs inline decision for `BookingWidget` is unresolved (open question).
  - To reach ≥80: Already there.
  - To reach ≥90: Already there; popover decision would resolve the remaining delta.

- **Approach: 88%**
  - Evidence: react-day-picker v9 Range Mode + `disabled` Matcher is the correct, documented approach for preventing out-of-bound selections. CSS module import strategy is documented and avoids Tailwind v4 cascade conflict. No alternative approaches were considered that would score higher.
  - To reach ≥80: Already there.
  - To reach ≥90: Prototype CSS module import in a dev branch and confirm no cascade conflict with Tailwind v4 globals.

- **Impact: 72%**
  - Evidence: This is a UX improvement to the primary funnel entry point. Range picker reduces two gestures to two clicks with visual feedback. No A/B baseline exists. The operator-stated intent is operational (correctness and UX), not a measured conversion lift — so the impact score reflects UX confidence, not revenue confidence.
  - To reach ≥80: Operator confirms this is a conversion-priority change (not just UX polish); or post-ship GA4 `search_availability` event rate comparison baseline is established.

- **Delivery-Readiness: 88%**
  - Evidence: `bookingDateRules.ts` already has all rule logic. `dateUtils.ts` needs one small extension. DayPicker v9 has no peer dep. All targets are `"use client"`. CSS strategy is clear. i18n key structure is consistent across namespaces. Only open item: popover vs inline for `BookingWidget`.
  - To reach ≥80: Already there.
  - To reach ≥90: Resolve popover/inline decision before first task begins.

- **Testability: 82%**
  - Evidence: `bookingDateRules.ts` already has comprehensive unit tests. RTL patterns are established in the project. `data-cy` attribute requirement is known. Existing `room-detail-date-picker.test.tsx` must be rewritten (4 tests) — not a blocker, a migration.
  - To reach ≥80: Already there.
  - To reach ≥90: Add `data-cy` attributes to DayPicker day cells and confirm RTL can simulate DayPicker click without jsdom/ARIA issues.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| CSS cascade conflict: DayPicker CSS module vs Tailwind v4 globals | Medium | Medium | Import via CSS modules (`react-day-picker/dist/style.module.css`) and apply as `classNames` prop; verify no global style leak in dev before persisting. |
| `BookingWidget` inline layout breaks above-the-fold design | Medium | Low-Medium | Resolve open question (inline vs popover) before implementation. Default: inline; flag to operator before TASK-01. |
| `ApartmentBookContent` sessionStorage restore path breaks after `Date` ↔ ISO migration | Low | Medium | sessionStorage stores and reads ISO strings — unchanged. The picker converts `Date → ISO` before storing; restores via `parseIsoToLocalDate`. Verify conversion round-trip in test. |
| Design-system `DatePicker` divergence: two date pickers now in the monorepo | Low | Low | The DS `DatePicker` wraps `react-datepicker` (single-date). The new `DateRangePicker` wraps `react-day-picker` (range). These serve different use cases; co-existence is acceptable. Do NOT consolidate in this work item. |
| TZ-unsafe `new Date("YYYY-MM-DD")` used elsewhere | Low | Medium | The new `parseIsoToLocalDate` helper must be used for all ISO → Date conversions in the picker. Do not use `new Date(isoString)` — it parses as UTC midnight and can produce the wrong day in negative-UTC-offset locales. |
| `RoomDetailContent` test rewrite fails CI on first push | Low | Low | Tests are CI-only; rewrite can be done as part of the same PR that migrates the component. |
| react-day-picker v9 not available in workspace due to lockfile conflict | Low | Medium | Check `pnpm-lock.yaml` before install; no known conflicts since it has no mandatory peer deps. |
| Max-stay enforcement change in `ApartmentBookContent` is a behaviour change (previously no cap) | Low | Low | `HOSTEL_MAX_STAY_NIGHTS = 8` is already enforced on all other surfaces. Apartment booking was inconsistent. This is a correction, not a new constraint. |

## Planning Constraints & Notes

- Must-follow patterns:
  - Use `bookingDateRules.ts` constants, not hardcoded `2` / `8` values.
  - ISO string output from picker must go through `formatDate(date: Date)` from `dateUtils.ts` — never `date.toISOString()` (UTC vs local TZ risk).
  - ISO string input to picker (for initial values) must go through a new `parseIsoToLocalDate(iso: string): Date` helper that splits `"YYYY-MM-DD"` and constructs `new Date(year, month-1, day)` — never `new Date(isoString)` directly (UTC parse, off-by-one in negative-UTC-offset timezones). This helper is TASK-02 and must be available before any migration task.
  - New i18n keys must be added to all locale files (7+ locales). EN keys are source of truth; non-EN translations can be placeholder strings on first ship with follow-on translation task.
  - `data-cy` attributes must be present on interactive DayPicker elements (day cells, clear button) per Jest `testIdAttribute` configuration.
  - Tests are CI-only. Do not run locally.
- Rollout/rollback expectations:
  - No feature flag needed — the four files are self-contained. Rollback is a revert of the PR.
  - Staging validation: visually confirm picker on `/book`, landing page widget, and room detail before merging to main.
- Observability expectations:
  - `fireSearchAvailability` firing pattern unchanged — no new GA4 events required. Post-ship: compare `search_availability` event rate before/after to assess UX improvement.

## Suggested Task Seeds (Non-binding)

1. **TASK-01 — Install dependency + create `DateRangePicker` component**: Add `react-day-picker` to `apps/brikette/package.json`. Create `apps/brikette/src/components/booking/DateRangePicker.tsx` wrapping DayPicker Range Mode with: `disabled` Matcher using `bookingDateRules.ts`, DD MMM → DD MMM (N nights) summary, "2–8 nights" inline helper, "Clear dates" button. CSS module import strategy.
2. **TASK-02 — Extend `dateUtils.ts` with two helpers**: (a) `parseIsoToLocalDate(iso: string): Date` — TZ-safe ISO→Date conversion using local date constructor. (b) `formatDisplayDate(date: Date): string` — returns `"DD MMM"` format (e.g., `"03 Mar"`). Unit tests for both. TASK-02 must complete before any migration task (TASK-03+) can use these functions.
3. **TASK-03 — Migrate `BookPageContent`**: Replace two `<input type="date">` with `DateRangePicker`. Update state shape from `(checkin, checkout): string` to `range: DateRange`. Keep `writeCanonicalBookingQuery`, GA4 calls, and `RoomsSection` bookingQuery prop wired to ISO strings via conversion.
4. **TASK-04 — Migrate `BookingWidget`**: Replace two `<input type="date">` with `DateRangePicker`. Resolve inline vs popover layout per open question. Update submit handler to convert `DateRange → ISO strings`.
5. **TASK-05 — Migrate `RoomDetailContent` (`BookingDatePicker`)**: Replace the local `BookingDatePicker` sub-component with `DateRangePicker`. Update `onDateChange` to receive ISO strings (keeping existing prop contract). Update `room-detail-date-picker.test.tsx` tests.
6. **TASK-06 — Migrate `ApartmentBookContent`**: Replace two `<input type="date">` with `DateRangePicker`. This adds the previously missing `HOSTEL_MAX_STAY_NIGHTS` enforcement. Update sessionStorage restore path.
7. **TASK-07 — i18n keys**: Add "2–8 nights" helper text, "N nights" count key, and "Clear dates" action key to `bookPage`, `modals`, and `roomsPage` namespaces for EN. Add placeholder translations in non-EN locales.
8. **TASK-08 — Tests**: New unit tests for `DateRangePicker` component (range selection, min/max, clear, summary). Unit tests for `formatDisplayDate`.

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - All four date surfaces render DayPicker calendar in Range Mode.
  - Selecting a `from` date before clicking disables all `to` dates outside `[from+2, from+8]`.
  - Selecting `to` shows DD MMM → DD MMM (N nights) summary adjacent to picker.
  - "2–8 nights" inline helper visible on all surfaces.
  - "Clear dates" resets range and hides summary.
  - GA4 `search_availability` fires correctly after range selection.
  - Octorate CTA is disabled/absent until a valid range is selected (existing `queryState` logic preserved).
  - All existing tests pass; new component tests pass in CI.
- Post-delivery measurement plan:
  - Compare GA4 `search_availability` event rate 7 days pre/post deploy (proxy for date selection completion rate).
  - Monitor for booking funnel drop-off at date selection step.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Entry points (all 4 booking surfaces) | Yes | None | No |
| `bookingDateRules.ts` constraint authority | Yes | None | No |
| `dateUtils.ts` — ISO conversion and display format | Partial | [Missing domain coverage] [Minor]: `formatDisplayDate` helper does not exist; needs to be added in TASK-02 before TASK-03+ can use it. Already captured as TASK-02 in task seeds and in risks. | No (task seed covers it) |
| DayPicker `disabled` Matcher for min/max enforcement | Yes | None — the `Matcher` API supports `(date: Date) => boolean`; `getMinCheckoutForStay` / `getMaxCheckoutForStay` return ISO strings; conversion to `Date` must use `parseIsoToLocalDate` (TASK-02), NOT `new Date(isoStr)` (TZ-unsafe). | No |
| `Date → ISO` string conversion for all downstream consumers | Yes | [Type contract gap] [Moderate]: 4 surfaces each pass ISO strings to 3–5 downstream consumers. Conversion step (`formatDate(date)` from `dateUtils.ts`) must be added in every migration task. Missed conversion = silent wrong date sent to GA4/Octorate. | No (noted in planning constraints) |
| CSS strategy (Tailwind v4 compat) | Partial | [Integration boundary not handled] [Moderate]: CSS module import strategy is recommended but not tested in this repo. Pre-build verification step needed. Already captured in risks. | No (advisory) |
| i18n keys across all locales | Yes | [Missing domain coverage] [Minor]: 7+ locale files need updates. Non-EN locales can use placeholder strings on first ship. Already captured in TASK-07. | No |
| Test migration (`room-detail-date-picker.test.tsx`) | Yes | [Ordering inversion] [Minor]: If TASK-05 is implemented before test rewrite, existing tests will break. Tests should be rewritten in same task or as a blocking pre-step. Task seeds already co-locate test rewrite in TASK-05. | No |
| `ApartmentBookContent` sessionStorage restore path | Yes | None — stores ISO strings; picker converts Date→ISO before storing; round-trip safe. | No |
| `BookingWidget` inline vs popover layout | Partial | [Scope gap in investigation] [Moderate]: Layout impact of inline calendar expansion not verified against landing page layout. Open question Q1 captures this; default assumption (inline) is noted. | No (advisory, captured as open question) |

## Evidence Gap Review

### Gaps Addressed

- Citation integrity: All 4 entry-point files confirmed read; `bookingDateRules.ts` rules confirmed with exact constant values and function signatures; `dateUtils.ts` confirmed to lack DD MMM formatter and TZ-safe ISO→Date parser; react-day-picker v9.13.0 confirmed in lockfile as transitive dep, not as direct dep of `apps/brikette`.
- Baseline description corrected: JS-level min/max enforcement via `ensureMinCheckoutForStay`/`normalizeCheckoutForStay` on 3 of 4 surfaces confirmed; `ApartmentBookContent` confirmed missing JS cap.
- Design-system `DatePicker` discovered and analyzed: wraps `react-datepicker` (single-date, no Range Mode); decision to NOT extend it documented with rationale.
- TZ-unsafe Date construction identified: critical finding from R1. `parseIsoToLocalDate` helper requirement added to planning constraints, risks, and TASK-02.
- E2E framework corrected: Playwright confirmed (`apps/brikette/e2e/availability-smoke.spec.ts`), not Cypress.
- Boundary coverage: All downstream consumers traced (GA4 events, Octorate URL builder, availability hooks, `RoomsSection`/`RoomCard`). All accept ISO strings; no interface changes needed.
- Test landscape: Existing tests verified (not just listed); Playwright E2E confirmed; extinct tests (TC-DP-02, TC-DP-03) identified with specific rewrite requirements.
- Bundle size: react-day-picker v9.13.0 already in workspace lockfile; `pnpm add` to brikette is non-disruptive.

### Confidence Adjustments

- Implementation: 92% — all 4 surfaces fully read; state shapes confirmed; downstream contracts confirmed.
- Approach: 88% — CSS integration untested; design-system library divergence noted but accepted. -5% for CSS.
- Impact: 72% — no A/B baseline; operational intent confirmed; UX improvement is directionally clear.
- Delivery-Readiness: 88% — open question on `BookingWidget` popover vs inline keeps this below 90%. `parseIsoToLocalDate` requirement is now explicitly tasked (TASK-02).
- Testability: 82% — Playwright E2E exists; RTL patterns established; `data-cy` requirement documented.

### Remaining Assumptions

- CSS module import for DayPicker does not conflict with Tailwind v4 global layer. Verify in TASK-01 before proceeding to migration tasks.
- react-day-picker v9 `pnpm add` to `apps/brikette` does not require lock resolution changes (v9.13.0 already in workspace).
- Non-EN locale placeholder strings are acceptable at initial ship (translation follow-on task).
- `BookingWidget` inline layout (default) is acceptable; operator will confirm or request popover before TASK-04.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan brik-date-range-picker --auto`
