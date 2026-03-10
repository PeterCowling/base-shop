---
Status: Complete
Feature-Slug: brik-sticky-book-now-room-context
Completed-date: 2026-02-27
artifact: build-record
---

# Build Record — StickyBookNow Room Context

## What Was Built

**TASK-01** added an optional `octorateUrl?: string` prop to `StickyBookNow` in `packages/ui/src/organisms/StickyBookNow.tsx`. When the prop is provided, the `deepLink` `useMemo` short-circuits to return it directly rather than building the generic `calendar.xhtml` URL. The prop is included in the memo dependency array. A JSDoc comment explains the intended usage. A new unit test file (`apps/brikette/src/test/components/sticky-book-now-octorate-url-prop.test.tsx`) was created with TC-01 (prop override behaviour) and TC-02 (calendar.xhtml fallback when prop absent).

**TASK-02** wired the `octorateUrl` prop from `RoomDetailContent` in `apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx`. The component now imports `buildOctorateUrl` (from `@/utils/buildOctorateUrl`) and `BOOKING_CODE` (from `@/context/modal/constants`). A `useMemo` computes `stickyOctorateUrlResult` from `pickerCheckIn`, `pickerCheckOut`, `pickerAdults`, and `room.rateCodes.direct.nr`. The discriminated union `ok` check produces `stickyOctorateUrl: string | undefined`, which is passed to `<StickyBookNow octorateUrl={stickyOctorateUrl} />`. When `buildOctorateUrl` returns `ok: false` (invalid date range), `stickyOctorateUrl` is `undefined` and StickyBookNow falls back to `calendar.xhtml`. The TC-WireUrl assertion was added to `ga4-35-sticky-begin-checkout.test.tsx` to verify the `result.xhtml` URL with correct room code reaches the component.

## Tests Run

```
pnpm -w run test:governed -- jest -- \
  --config=apps/brikette/jest.config.cjs \
  --testPathPattern="ga4-35-sticky-begin-checkout|ga4-sticky-book-now-search-availability|content-sticky-cta|sticky-book-now-octorate-url-prop" \
  --no-coverage
```

Result: **13 passed, 13 total — 4 suites, 0 failures.**

Typecheck and lint ran via pre-commit hooks:
- `@acme/ui` typecheck: clean (0 errors)
- `@apps/brikette` typecheck: clean (0 errors)
- Lint: 0 errors (pre-existing warnings in `@acme/platform-core` and `@apps/reception` — unrelated)

## Validation Evidence

**TASK-01:**
- TC-01 pass: `<StickyBookNow octorateUrl="https://...result.xhtml?...">` → `screen.getByRole("link")` has `href` equal to the provided URL.
- TC-02 pass: `<StickyBookNow>` without prop → link `href` starts with `https://book.octorate.com/octobook/site/reservation/calendar.xhtml`.
- Post-build validation: Mode 1 Degraded — no standalone dev server for `packages/ui` component; test DOM assertions are equivalent to browser attribute verification.

**TASK-02:**
- TC-WireUrl pass: `capturedOctorateUrl` from the StickyBookNow mock contains `result.xhtml` and `room=433887` (room_10 NR code confirmed from roomsData source) when `RoomDetailContent` renders for `id="room_10"`.
- All 4 suites in regression: pass.
- Post-build validation: Mode 1 Degraded — TC-WireUrl DOM assertion confirms `octorateUrl` prop passed; no standalone dev server for room detail page.

## Scope Deviations

`apps/brikette/src/test/components/ga4-35-sticky-begin-checkout.test.tsx` was added to the TASK-02 Affects list during build. The plan's execution plan said to add TC-WireUrl to this file; the controlled expansion is within the same task objective (validating the `octorateUrl` wiring from `RoomDetailContent`).

Plan had TC-02 rate code as `433883` (actually `double_room`'s code). Actual `room_10` NR code is `433887`. Implementation is correct; the plan note was a factual error carried from the fact-find, corrected by reading `roomsData.ts` during the build.

## Outcome Contract

- **Why:** TBD
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Room detail page sticky CTA sends guests directly to their chosen room in Octorate's booking flow, eliminating the manual re-selection step.
- **Source:** auto
