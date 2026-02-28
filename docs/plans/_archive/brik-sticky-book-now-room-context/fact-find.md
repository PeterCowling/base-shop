---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-27
Last-updated: 2026-02-27
Feature-Slug: brik-sticky-book-now-room-context
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brik-sticky-book-now-room-context/plan.md
Dispatch-ID: IDEA-DISPATCH-20260227-0060
Trigger-Why: ""
Trigger-Intended-Outcome: ""
---

# StickyBookNow Room Context — Fact-Find Brief

## Scope

### Summary

On room detail pages, the `StickyBookNow` floating CTA deep-links to Octorate's generic `calendar.xhtml` endpoint with only date and pax params — no room selection. When a guest clicks it they land on Octorate's calendar step and must manually find and re-select the room. `buildOctorateUrl` in the brikette app already constructs `result.xhtml` links with explicit room rate codes (used by RoomCard), but this utility is never called from the room detail page's StickyBookNow render site. The fix adds a single optional `octorateUrl` prop to `StickyBookNow` and wires it from `RoomDetailContent` via `buildOctorateUrl`.

### Goals

- StickyBookNow on room detail pages links directly to Octorate `result.xhtml` with the correct room rate code pre-filled.
- Guests on a room detail page who click the sticky CTA land on the correct room in Octorate without re-selecting.
- No change to the GA4 `onStickyCheckoutClick` interface or existing test contracts.

### Non-goals

- Adding a `flex`-plan toggle to StickyBookNow (always NR for the sticky CTA).
- Rewriting how StickyBookNow reads date/pax from URL params for other use cases.
- Extending StickyBookNow to non-room pages in this change.

### Constraints & Assumptions

- Constraints:
  - `buildOctorateUrl` lives in `apps/brikette` — it cannot be imported by `packages/ui`. The URL must be built in the app layer and passed as a prop.
  - `StickyBookNow` is a `packages/ui` component; prop additions must not create coupling to app-layer utilities.
  - The apartment's `rateCodes.direct.nr = "804934"` is a real code for 2-pax bookings; after this fix, StickyBookNow on apartment detail page will also link to `result.xhtml`. The apartment has a pax-specific rate code gap (3-pax code not in `rateCodes.direct`) that is pre-existing and out of scope.
- Assumptions:
  - NR (`direct.nr`) is the correct rate plan for the sticky CTA (lowest direct rate, highest conversion intent). RoomCard uses the same plan for its primary CTA.
  - `StickyBookNow` reads `window.location.search` once on mount (one-time `useEffect`). After mount, picker date changes update `pickerCheckIn/Out/Adults` state in `RoomDetailContent` (and the URL via `router.replace`), but StickyBookNow's internal `urlParams` does NOT re-read the URL. The `octorateUrl` prop approach fixes this as a secondary benefit: dates come from React state, so the passed URL always reflects the current picker values.

## Outcome Contract

- **Why:** TBD
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Room detail page sticky CTA sends guests directly to their chosen room in Octorate's booking flow, eliminating the manual re-selection step.
- **Source:** auto

## Access Declarations

None — this is a pure code investigation and implementation within the monorepo. No external APIs, databases, or credentials required.

## Evidence Audit (Current State)

### Entry Points

- `apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx:575` — Renders `<StickyBookNow lang={lang} onStickyCheckoutClick={onStickyCheckoutClick} />`. No room prop passed.
- `packages/ui/src/organisms/StickyBookNow.tsx:22` — Component entry point; receives `lang` and `onStickyCheckoutClick` only.

### Key Modules / Files

1. `packages/ui/src/organisms/StickyBookNow.tsx` — Floating CTA. `deepLink` memo (line 125–135) builds `calendar.xhtml?codice=45111&checkin=...&checkout=...&pax=...`. No `octorateUrl` or `rateCode` prop. `StickyBookNowClickContext.href` equals `deepLink` at click time.
2. `apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx` — Room detail client component. Has `room = roomsData.find(r => r.id === id)` (line 409), `pickerCheckIn/Out/Adults` state (lines 412–414), and `onStickyCheckoutClick` GA4 handler (lines 439–452). `room.rateCodes.direct.nr` is available but not used for StickyBookNow.
3. `apps/brikette/src/utils/buildOctorateUrl.ts` — Pure URL builder. Takes `checkin, checkout, pax, plan, roomSku, octorateRateCode, bookingCode`. Returns `{ ok: true; url: string } | { ok: false; error }`. Builds `result.xhtml?codice=...&room=...&date=...&checkin=...&checkout=...&pax=...&adulti=...`.
4. `apps/brikette/src/context/modal/constants.ts` — `BOOKING_CODE = "45111" as const`. Already imported by `RoomCard.tsx`.
5. `apps/brikette/src/data/roomsData.ts` — `RateCodes` type: `{ direct: { nr: string; flex: string }; ota: { nr: string; flex: string } }`. All room entries have non-empty `direct.nr` codes. Apartment: `direct.nr="804934"` (2-pax NR). `buildOctorateUrl` succeeds for all rooms.
6. `apps/brikette/src/components/rooms/RoomCard.tsx` — Reference implementation of `buildOctorateUrl` usage: line 233 uses `octorateRateCode: room.rateCodes.direct.nr` for NR plan CTA.
7. `apps/brikette/src/components/rooms/RoomsSection.tsx` — Also imports `buildOctorateUrl`; second non-test consumer.

### Patterns & Conventions Observed

- `buildOctorateUrl` is the canonical way to build `result.xhtml` links — currently imported by `RoomCard.tsx` and `RoomsSection.tsx`. `ApartmentBookContent` uses a local inline `buildOctorateLink` function; `availability/route.ts` inlines its own URL. Evidence: grep across `apps/brikette/src` confirms only 2 non-test import sites.
- `BOOKING_CODE` is imported from `@/context/modal/constants` wherever Octorate URLs are built. Evidence: `RoomCard.tsx:23`, `modal/constants.ts:11`.
- StickyBookNow follows a GA4-agnostic pattern: the component exposes a click hook (`onStickyCheckoutClick`) and the app layer decides what to emit. This pattern must be preserved.
- `packages/ui` components accept pre-built values (URLs, labels) from the app layer rather than performing app-layer computations internally. The `octorateUrl` prop follows this pattern.

### Data & Contracts

- **`StickyBookNowClickContext`** (`packages/ui/src/organisms/StickyBookNow.tsx:14`):
  ```ts
  { checkin: string; checkout: string; pax: number; href: string; proceed: () => void }
  ```
  After the fix, `ctx.href` will equal the `result.xhtml` URL (not `calendar.xhtml`) when `octorateUrl` prop is provided. The GA4 handler in `RoomDetailContent` does not inspect `ctx.href` — it only calls `trackThenNavigate` with room item data and calls `ctx.proceed`. No handler-side change needed.

- **`BuildOctorateUrlParams`** (`buildOctorateUrl.ts:11`): `checkin, checkout, pax, plan, roomSku, octorateRateCode, bookingCode`. All available in `RoomDetailContent` at render time.

- **`BuildOctorateUrlResult`** (`buildOctorateUrl.ts:30`): `{ ok: true; url } | { ok: false; error: "missing_rate_code" | "missing_booking_code" | "invalid_dates" }`. Three failure paths: empty rate code, empty booking code, and invalid/impossible date range (guarded by `isValidStayRange` + `isValidPax`). In normal operation (non-empty rate codes, valid `BOOKING_CODE`, valid picker dates), all rooms return `ok: true`. The `invalid_dates` guard matters if `pickerCheckIn/Out` state somehow holds an invalid range — `RoomDetailContent` must pass `undefined` to `StickyBookNow` on `ok: false`, falling back to `calendar.xhtml`. This is the safe path regardless of which error variant fires.

- **Apartment pax caveat:** Apartment rate codes are pax-specific: 2-pax NR is `804934`; 3-pax NR is `805559` (documented in `roomsData.ts` comment but not stored in `rateCodes.direct.nr`). `buildOctorateUrl` will always use `804934` for the apartment regardless of `pickerAdults`. This is a pre-existing data model gap — not introduced by this fix — and is out of scope.

### Dependency & Impact Map

- **Upstream of StickyBookNow change:** Only `RoomDetailContent.tsx` renders `StickyBookNow` in the brikette app (confirmed by grep — no other call site).
- **Blast radius:** 2 files changed (`StickyBookNow.tsx`, `RoomDetailContent.tsx`). No downstream cascade — the prop is optional and backward-compatible.
- **Tests touching StickyBookNow (4 files):**
  - `ga4-35-sticky-begin-checkout.test.tsx` — mocks StickyBookNow entirely; unaffected.
  - `room-detail-date-picker.test.tsx` — mocks StickyBookNow entirely; unaffected.
  - `ga4-view-item-detail.test.tsx` — mocks StickyBookNow entirely; unaffected.
  - `ga4-sticky-book-now-search-availability.test.tsx` — renders real `StickyBookNow` without `octorateUrl` prop; tests `search_availability` GA4 event flow and navigation delay timing. Does not assert on the `<a href>` attribute value directly. No assertions fail after adding the new prop (prop is optional, no-prop path unchanged). **Does need a new test case added** for the `octorateUrl`-override path.

### Security and Performance Boundaries

- No auth or security concerns — URL is a client-side string passed as a prop; no server-side validation needed.
- No performance concern — `buildOctorateUrl` is a pure synchronous function. One extra call per render, negligible cost. Memoizing with `useMemo` in `RoomDetailContent` is optional but clean.

### Test Landscape

#### Test Infrastructure
- Framework: Jest + React Testing Library
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs --testPathPattern=<pattern> --no-coverage`
- CI: brikette test suite runs on CI; brikette jest config at `apps/brikette/jest.config.cjs`

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| StickyBookNow GA4 click (begin_checkout) from RoomDetailContent | Unit | `ga4-35-sticky-begin-checkout.test.tsx` | Mocks StickyBookNow entirely; unaffected by new prop |
| StickyBookNow rendered directly — search_availability GA4 event flow | Unit | `ga4-sticky-book-now-search-availability.test.tsx` | Renders real StickyBookNow without `octorateUrl` prop; asserts `search_availability` event and navigation timing; does NOT assert `href` attribute value; no-prop default path unaffected |
| RoomDetailContent date picker | Unit | `room-detail-date-picker.test.tsx` | Mocks StickyBookNow entirely; unaffected |
| GA4 view_item | Unit | `ga4-view-item-detail.test.tsx` | Mocks StickyBookNow entirely; unaffected |

#### Coverage Gaps

- **New test needed:** When `octorateUrl` is provided to `StickyBookNow`, rendered `<a href>` equals the prop URL (not `calendar.xhtml`). Add to `ga4-sticky-book-now-search-availability.test.tsx` as a new `describe` block, or a new file `sticky-book-now-octorate-url-prop.test.tsx`.
- **No existing test covers:** `RoomDetailContent` passing a valid `octorateUrl` to `StickyBookNow`. A narrow unit test of the RoomDetailContent call-site can be added by modifying the StickyBookNow mock in `ga4-35-sticky-begin-checkout.test.tsx` to capture the `octorateUrl` prop and assert it starts with `result.xhtml`.

#### Testability Assessment

- Easy to test: `StickyBookNow` `octorateUrl` prop — render with prop and assert `<a href>` attribute.
- Easy to test: `buildOctorateUrl` fallback for empty rate code — already has unit tests in `buildOctorateUrl.test.ts`.
- Moderate: RoomDetailContent call-site `octorateUrl` value — requires rendering RoomDetailContent (heavy mock surface) or extracting a helper function.

#### Recommended Test Approach

- Unit test for `StickyBookNow`: `octorateUrl` prop overrides `deepLink` in rendered `<a href>`.
- Unit test for `StickyBookNow`: without `octorateUrl` prop, existing `calendar.xhtml` default applies (existing test already covers this; verify it still passes).
- Unit test for `RoomDetailContent` (narrow): mock `buildOctorateUrl` and assert `StickyBookNow` receives the expected `octorateUrl` prop.

### Recent Git History (Targeted)

- `36843c7072` feat(brik-rooms): add useAvailabilityForRoom hook — `RoomDetailContent.tsx` recently modified; no conflicts with new `buildOctorateUrl` call.
- `8b8fef4d41` feat(brik-rooms): add date picker + pax selector — introduced `pickerCheckIn/Out/Adults` state to `RoomDetailContent`; these are the values that must be passed to `buildOctorateUrl`.
- No recent changes to `StickyBookNow.tsx` or `buildOctorateUrl.ts`.

## Questions

### Resolved

- Q: Which rate plan should the sticky CTA use — NR or flex?
  - A: NR (`direct.nr`). StickyBookNow is the "Best price guaranteed" CTA; NR is the lowest direct rate and matches the primary RoomCard CTA. Flex is the secondary option, surfaced elsewhere.
  - Evidence: `apps/brikette/src/components/rooms/RoomCard.tsx:233` — NR is the primary CTA rate plan.

- Q: What happens for the apartment room?
  - A: Apartment has `rateCodes.direct.nr = "804934"` — a real NR code for 2-pax bookings. `buildOctorateUrl` will succeed and StickyBookNow will link to `result.xhtml` with `room=804934`. This is better than the current `calendar.xhtml` behavior. Caveat: for 3-pax apartment bookings the correct code is `805559` (documented in `roomsData.ts` comment), but it's not in `rateCodes.direct.nr`. The fix will always use `804934` — a pre-existing data model gap, not introduced here.
  - Evidence: `apps/brikette/src/data/roomsData.ts:415-416`.

- Q: Do any other pages outside `rooms/[id]` render `StickyBookNow`?
  - A: No. Grep confirms the only non-test caller is `RoomDetailContent.tsx`. `ContentStickyCta` is a separate component used on content pages and is not affected. Note: `RoomDetailContent` also renders for `rooms/apartment` (apartment is in `generateStaticParams`), so the apartment will also get the `result.xhtml` link after this fix.
  - Evidence: `grep -r "StickyBookNow" apps/brikette/src/` — 3 non-test usages, all in `RoomDetailContent.tsx`; `rooms/[id]/page.tsx:24` includes apartment in `roomIds`.

- Q: Will the `StickyBookNowClickContext.href` change affect the GA4 handler in `RoomDetailContent`?
  - A: No. The handler (`onStickyCheckoutClick` at line 439) does not read `ctx.href`. It calls `trackThenNavigate` with room item data (derived from `room.sku` and `title`) and calls `ctx.proceed`. The new `href` value flows to the component's `navigateToDeepLink` callback but the GA4 payload is not affected.
  - Evidence: `RoomDetailContent.tsx:439-452`.

- Q: Should `buildOctorateUrl` call in `RoomDetailContent` be wrapped in `useMemo`?
  - A: Recommended for clarity, not required. `buildOctorateUrl` is a pure synchronous function — re-calling it on every render is negligible cost. However, wrapping in `useMemo([pickerCheckIn, pickerCheckOut, pickerAdults, room.rateCodes.direct.nr])` makes the dependency intent explicit and prevents StickyBookNow's `memo()` from re-rendering on unchanged values. The plan task should use `useMemo`.
  - Evidence: RoomCard uses the result directly (no memo) — either pattern is acceptable for this cost level.

### Open (Operator Input Required)

None. All questions are resolvable from repository evidence.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| `StickyBookNow` new `octorateUrl?: string` prop | Yes — optional prop, backward-compatible | None | No |
| `deepLink` memo: `if (octorateUrl) return octorateUrl` branch | Yes — straightforward short-circuit | None | No |
| `memo()` deps for `deepLink`: add `octorateUrl` | Yes — must add `octorateUrl` to memo dep array | [Minor] If omitted, stale deepLink could be rendered — but TypeScript/lint will not catch it | No (tracked in task spec) |
| `RoomDetailContent`: import `buildOctorateUrl` from `@/utils/buildOctorateUrl` | Yes — path confirmed, already used by RoomCard | None | No |
| `RoomDetailContent`: import `BOOKING_CODE` from `@/context/modal/constants` | Yes — path confirmed, already in same app package | None | No |
| `buildOctorateUrl` call with `pickerCheckIn/Out/Adults` | Yes — all values available in component body | None | No |
| Apartment rate code path | Yes — apartment has `direct.nr="804934"` (non-empty); `buildOctorateUrl` returns `ok: true`; StickyBookNow gets `result.xhtml` link | [Minor] Apartment uses fixed 2-pax NR code regardless of `pickerAdults` — pre-existing data model gap, out of scope | No |
| `StickyBookNowClickContext.href` equals `result.xhtml` after fix | Yes — `ctx.href = deepLink` which now equals prop URL | None | No |
| GA4 test mocks unaffected | Yes — 3 of 4 test files mock StickyBookNow entirely | None | No |
| `ga4-sticky-book-now-search-availability.test.tsx`: no-prop path unchanged | Yes — existing test renders StickyBookNow without `octorateUrl`; `calendar.xhtml` fallback unchanged | None | No |
| New `octorateUrl`-override test coverage gap | Partial — no existing test covers prop-override case | [Minor] Coverage gap: prop override path untested | No (tracked in task spec) |

No Critical scope gaps found.

## Confidence Inputs

- **Implementation: 95%** — Exact change sites are known. Pattern is simple: one optional prop addition in the UI component, one `useMemo` + prop pass in the app component. No database, no API, no config changes.
  - What raises to ≥80: already there.
  - What raises to ≥90: already there. The 5% residual is standard implementation noise (edge in memo deps, import path typo).

- **Approach: 92%** — Passing an opaque `octorateUrl` string is the correct interface boundary. Alternative (passing `octorateRateCode` + `bookingCode` to `StickyBookNow`) would couple `packages/ui` to app-layer URL logic and is ruled out.
  - What raises to ≥80: already there.
  - What raises to ≥90: already there. Residual: whether the apartment fallback is the right UX (operators may want a different CTA for apartments — not in scope for this fix).

- **Impact: 82%** — Removes the Octorate room re-selection step for guests on room detail pages, reducing funnel friction. Conversion impact is not quantified (no A/B test planned), but the directional benefit is unambiguous. GA4 `begin_checkout` events already track this click.
  - What raises to ≥80: already there.
  - What raises to ≥90: a 2-week GA4 comparison of StickyBookNow click-to-booking conversion before and after.

- **Delivery-Readiness: 93%** — No blockers. Change is self-contained to 2 files + 1–2 test files. Does not touch routing, i18n, data schema, or any external system.
  - What raises to ≥80: already there.

- **Testability: 88%** — New prop is trivially testable at unit level. Existing GA4 tests are isolated (they mock StickyBookNow) and require no changes. One new test case needed for prop-override path.
  - What raises to ≥80: already there.
  - What raises to ≥90: add integration-level test checking RoomDetailContent passes valid `result.xhtml` URL as `octorateUrl` prop.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `deepLink` memo missing `octorateUrl` dep | Low | Low — stale link on rare re-render edge | Include `octorateUrl` in memo dep array; lint will not catch but code review will |
| Apartment StickyBookNow uses 2-pax rate code regardless of picker adults | Certain | Low — links to correct room but wrong pax tier for 3+ guests | Pre-existing data model gap; note in task spec as known limitation; out of scope for this fix |
| `StickyBookNowClickContext.href` changes from `calendar.xhtml` to `result.xhtml` | Certain (by design) | None observable — no consumer checks this value | GA4 begin_checkout payload unchanged (handler ignores `ctx.href`) |
| Future StickyBookNow usage on non-room pages passes no `octorateUrl` | Low | None — fallback is `calendar.xhtml` (correct for generic pages) | Optional prop is the correct default |

## Planning Constraints & Notes

- Must-follow patterns:
  - `packages/ui` components must not import from `apps/brikette`. URL must be built in app layer and passed as prop.
  - Use `BOOKING_CODE` from `@/context/modal/constants` — do not hardcode `"45111"` in `RoomDetailContent`.
  - Use `buildOctorateUrl` result discriminated union (`ok: true/false`) — do not skip error check.
- Rollout/rollback: no feature flag needed; change is guarded by `octorateUrl` being optional. Remove prop at call site to revert.
- Observability: GA4 `begin_checkout` events already firing; no new instrumentation needed. URL verification requires browser navigation inspection (devtools Network tab or GA4 DebugView `page_location`) — `ctx.href` is not included in the `begin_checkout` GA4 payload.

## Suggested Task Seeds (Non-binding)

- **TASK-01**: Add `octorateUrl?: string` prop to `StickyBookNow`; update `deepLink` memo to short-circuit when provided; add `octorateUrl` to memo dep array. Update `StickyBookNowClickContext` JSDoc to note href reflects provided URL when present. Add unit test for prop-override case.
- **TASK-02**: Wire `octorateUrl` in `RoomDetailContent`: import `buildOctorateUrl` + `BOOKING_CODE`; compute `stickyOctorateUrl` via `useMemo`; pass to `<StickyBookNow>`. Add narrow unit test asserting `StickyBookNow` receives expected `octorateUrl` prop for a room with valid rate codes.

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `StickyBookNow` renders `<a href={octorateUrl}>` when prop is provided.
  - `RoomDetailContent` passes a `result.xhtml` URL when `buildOctorateUrl` returns `ok: true` (expected for all rooms with valid picker dates). Falls back to `undefined` → `calendar.xhtml` on `ok: false` (invalid dates or booking code absent — not expected in normal operation).
  - All existing brikette tests pass.
  - New unit test for `octorateUrl` prop override passes.
- Post-delivery measurement plan: use browser devtools link inspection or GA4 DebugView's `page_location` to confirm that clicking StickyBookNow on a room detail page navigates to a `result.xhtml` URL with `room=<rateCode>` parameter. The `begin_checkout` GA4 payload does not include `ctx.href` directly, so URL verification requires navigation inspection, not event payload checking.

## Evidence Gap Review

### Gaps Addressed

1. **Caller inventory confirmed**: Grepped all `StickyBookNow` usages — only `RoomDetailContent.tsx` renders it in the brikette app. No hidden callers missed.
2. **`buildOctorateUrl` call-site inventory corrected**: Confirmed via grep — only `RoomCard.tsx` and `RoomsSection.tsx` import the utility (not `ApartmentBookContent` or `availability/route.ts`, which use inline builders). Apartment has non-empty `direct.nr="804934"` — all rooms return `ok: true` from `buildOctorateUrl`.
3. **GA4 handler inspected**: `onStickyCheckoutClick` in `RoomDetailContent.tsx:439` does not read `ctx.href` — confirmed no side-effect from href change.
4. **Test landscape verified**: All 4 StickyBookNow-touching test files inspected; 3 mock the component entirely; 1 tests no-prop default path (unaffected).
5. **`BOOKING_CODE` constant location confirmed**: `@/context/modal/constants.ts:11`; same import path used by `RoomCard.tsx`.

### Confidence Adjustments

- Implementation confidence raised from initial 90% to 95% after confirming there are no hidden StickyBookNow callers and that GA4 handler is unaffected.
- No downward adjustments.

### Remaining Assumptions

- NR plan is the correct default for StickyBookNow. If the operator later wants to surface flex as default, this is a separate decision with a separate task.
- Apartment 3-pax rate code (`805559`) is not stored in `rateCodes.direct.nr`. StickyBookNow will always use the 2-pax code for apartment. Treating this as a pre-existing gap, not a regression of this fix.

## Planning Readiness

- **Status: Ready-for-planning**
- Blocking items: none
- Recommended next step: `/lp-do-plan brik-sticky-book-now-room-context --auto`
