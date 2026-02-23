---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-21
Last-updated: 2026-02-21
Feature-Slug: prime-guest-access-pages
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/prime-guest-access-pages/plan.md
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
---

# Prime Guest Access Pages Fact-Find Brief

## Scope

### Summary

Two Prime app pages need to be built to replace website links currently used in guest emails:

**Page 1 — `/main-door-access`**: `apps/prime/src/app/(guarded)/main-door-access/page.tsx` is currently a non-functional stub. It needs to display the guest's personal `BRK-XXXXX` check-in code and step-by-step door entry instructions. It is the target of `{{SLOT:APP_LINK}}` in email templates T06 ("Essential - Inner Building, Opening Main Door") and T07 ("Essential - Outer buildings, Opening Main Door"), resolving to `https://prime-egt.pages.dev/main-door-access?uuid=<occupantId>`.

**Page 2 — `/late-checkin`**: No page exists yet. It needs to be created to explain the out-of-hours check-in process to guests arriving after 10:30pm. It is the target of `{{SLOT:APP_LINK}}` in email template T10 ("Out of hours check-in"), resolving to `https://prime-egt.pages.dev/late-checkin?uuid=<occupantId>`. The equivalent website page is `https://hostel-positano.com/en/assistance/late-checkin`.

### Goals

- Display the guest's BRK-XXXXX check-in code (from Firebase, via `useCheckInCode`) prominently.
- Show step-by-step door entry instructions appropriate to all guest building types (inner and outer building).
- Handle offline gracefully (show cached code if available; display warning banner if offline and no cache).
- Handle loading and error states consistently with the rest of the app.
- Be accessible from the email link (`?uuid=<occupantId>`) and from in-app navigation.

### Non-goals

- Building a new back-end API — the existing `/api/check-in-code` CF function and Firebase path `checkInCodes/byUuid/{uuid}` already support everything needed.
- Creating a QR display for the door code — the QR is for staff scanning at check-in reception, not for the door lock. The door code (`BRK-XXXXX`) is entered manually at the keypad (based on email template context).
- Generating or invalidating codes — that is already handled by `useCheckInCode` (auto-generate on `arrival-day` state).

### Constraints & Assumptions

- Constraints:
  - Must remain inside the `(guarded)` route group and inherit `GuardedLayout` auth protection (`PinAuthProvider` + `ChatProvider` + `GuardedGate`).
  - `useCheckInCode` requires `checkOutDate` to auto-generate a code. The page must obtain this from `useUnifiedBookingData` (or a lighter hook), not hard-code it.
  - All Tailwind classes must use DS tokens only (no raw hex, no raw colours) — enforced by the `ds/no-raw-color` lint rule introduced in commit `0926519eb5`.
  - `'use client'` directive is mandatory (all guarded pages are client components).
  - Page layout container width convention: `mx-auto max-w-md` — evidenced across all guarded pages.
  - The `uuid` is already available via `useUuid()` hook (reads `?uuid` query param or falls back to `localStorage.prime_guest_uuid`; redirects to `/error` if missing/invalid).

- Assumptions:
  - The door entry instructions are static copy, not fetched from Firebase. The email templates (T06/T07) point to a Google Doc with the canonical instructions, but the app page can embed the text directly (or reference the Brikette guide URL `https://hostel-positano.com/en/assistance`).
  - The `enabled` flag for `useCheckInCode` should always be `true` on this page (not conditional on `arrivalState`), because a guest arriving late at night may have already checked in but still need the door code.
  - `autoGenerate` should be `true` (default) since the check-in code is needed here regardless.
  - No i18n is required for the initial build — all existing comparable standalone pages (e.g., `overnight-issues`, `main-door-access` stub) use inline English strings.

---

## Evidence Audit (Current State)

### Entry Points

- `apps/prime/src/app/(guarded)/main-door-access/page.tsx` — stub page (current), route `/main-door-access`. Renders a `DoorOpen` icon, an "h1: Main Door Access" heading, a placeholder paragraph, and a "Return Home" link. No state, no data fetching.
- Email templates T06/T07 in `packages/mcp-server/data/email-templates.json` — `{{SLOT:APP_LINK}}` resolves to `https://prime-egt.pages.dev/main-door-access?uuid=<occupantId>`.
- Email template T10 in `packages/mcp-server/data/email-templates.json` — `{{SLOT:APP_LINK}}` resolves to `https://prime-egt.pages.dev/late-checkin?uuid=<occupantId>`. No Prime page exists yet at this route.

### Key Modules / Files

1. `apps/prime/src/app/(guarded)/main-door-access/page.tsx` — **target file** (stub to replace).
2. `apps/prime/src/app/(guarded)/layout.tsx` — guarded layout wrapping all routes; provides `PinAuthProvider`, `ChatProvider`, `GuardedGate`. The `GuardedGate` component handles session check via `usePinAuth` / `readGuestSession` / `validateGuestToken`. No uuid is forwarded by the layout — it is a route-level concern only.
3. `apps/prime/src/hooks/useUuid.ts` — reads `?uuid` from `useSearchParams()`, falls back to `localStorage.prime_guest_uuid`, redirects to `/error` on missing/invalid. Pattern used by all code-requiring guarded pages. UUID regex: `/^occ_\d{13}$/i`.
4. `apps/prime/src/hooks/useCheckInCode.ts` — orchestration hook. Accepts `{ checkOutDate, autoGenerate?, enabled? }`. Internally calls `useFetchCheckInCode` (React Query over Firebase) and falls back to `codeCache` (localStorage) when offline. Returns `{ code, isLoading, isError, errorMessage, isStale, isOffline, generateCode, refetch }`.
5. `apps/prime/src/hooks/pureData/useFetchCheckInCode.ts` — pure React Query hook. Fetches `checkInCodes/byUuid/{uuid}` via Firebase SDK. staleTime: 5 min, gcTime: 30 min. Returns `null` if not found or expired.
6. `apps/prime/src/lib/arrival/codeCache.ts` — localStorage cache. Key: `prime_checkin_code_{uuid}`. Stores `{ code, cachedAt }`. No expiry enforcement on read (expiry is only checked server-side on the CF function response).
7. `apps/prime/src/types/checkInCode.ts` — defines `CheckInCodeRecord`, `CHECK_IN_CODE_PREFIX = 'BRK-'`, `CHECK_IN_CODE_LENGTH = 5`. Code format confirmed: `BRK-XXXXX` (chars from alphabet excluding confusing glyphs: `ABCDEFGHJKMNPQRSTUVWXYZ23456789`).
8. `apps/prime/functions/api/check-in-code.ts` — CF Pages Function. GET retrieves by uuid, POST generates (with collision detection). Expiry: checkout date + 48h. No auth gate — relies on UUID being secret (sent only via email link).
9. `apps/prime/src/hooks/dataOrchestrator/useUnifiedBookingData.ts` — used by most guarded pages (e.g., `cash-prep`, `routes`) to get `occupantData` including `checkOutDate`, `firstName`, etc. This is the correct hook to get `checkOutDate` for `useCheckInCode`.
10. `packages/mcp-server/data/email-templates.json` — T06 body includes: `"Read the instructions {{SLOT:APP_LINK}}"`. T07 body: `"Read the instructions {{SLOT:APP_LINK}}"`. Both have `canonical_reference_url` pointing to a Google Doc, confirming the app page is the primary authoritative source.

### Patterns & Conventions Observed

- **`'use client'` + `useUnifiedBookingData` + loading/error guards**: The pattern used by `cash-prep/page.tsx`, `routes/page.tsx`, and `booking-details/page.tsx`. These pages always:
  1. Declare `'use client'`.
  2. Call `useUnifiedBookingData()` at the top.
  3. Return a spinner div while `isLoading`.
  4. Return an error div if `error || !occupantData`.
  5. Return the main `<main>` layout with `min-h-screen bg-muted px-4 py-6 pb-24` and inner `mx-auto max-w-md`.
  - Evidence: `apps/prime/src/app/(guarded)/cash-prep/page.tsx`, `apps/prime/src/app/(guarded)/routes/page.tsx`.

- **`useCheckInCode` with `enabled: arrivalState === 'arrival-day'`**: Current usage in `GuardedHomeExperience.tsx`. For this new page the `enabled` flag should be `true` unconditionally — guests may need the door code at any time during their stay (checked-in state too).

- **Offline/stale warning banner pattern**: Established in `ArrivalHome.tsx` — uses `bg-warning-soft` / `text-warning-foreground` for stale cache warning, `bg-danger-soft` / `text-danger-foreground` for offline-with-no-cache error. These exact token classes should be reused.

- **Code display pattern**: `ArrivalCodePanel` component from `@acme/ui` renders the code panel with loading/unavailable states. The `CheckInQR` component wraps this for QR generation. For `/main-door-access` the QR is not needed (door code is entered manually), but `ArrivalCodePanel` alone (without `renderCode` or with a simple text rendering) can be used, or the code can be displayed with a simpler pattern (large monospaced text + copy button, as in `CheckInQR`'s "human-readable code" block).

- **DS token lint gate**: Active for `apps/prime` since commit `0926519eb5`. All color references must use semantic tokens (`bg-muted`, `text-foreground`, `text-danger-foreground`, etc.), not raw hex or Tailwind colour scale names.

- **Link back to home**: Every standalone info page includes a "Return Home" link (`href="/"`). The stub already has this; retain it.

### Data & Contracts

- Types/schemas/events:
  - `CheckInCodeRecord` in `apps/prime/src/types/checkInCode.ts`: `{ code: string, uuid: string, createdAt: number, expiresAt: number }`.
  - `UseCheckInCodeReturn` in `apps/prime/src/hooks/useCheckInCode.ts`: `{ code: string | null, isLoading: boolean, isError: boolean, errorMessage: string | null, isStale: boolean, isOffline: boolean, generateCode: () => Promise<void>, refetch: () => Promise<void> }`.
  - `occupantData?.checkOutDate: string | undefined` (ISO date YYYY-MM-DD) — comes from `useUnifiedBookingData`.

- Persistence:
  - Firebase Realtime Database path: `checkInCodes/byUuid/{uuid}` (guest read), `checkInCodes/byCode/{code}` (staff read only).
  - localStorage cache key: `prime_checkin_code_{uuid}` → `CachedCode { code, cachedAt }`.
  - localStorage uuid key: `prime_guest_uuid` (fallback if `?uuid` not in URL).

- API/contracts:
  - GET `/api/check-in-code?uuid={uuid}` → `{ code: string | null, expiresAt?: number, expired?: boolean }`.
  - POST `/api/check-in-code` body: `{ uuid, checkOutDate }` → `{ code, expiresAt, created?: boolean, existing?: boolean }`.
  - No auth gate on the CF function — security relies on UUID secrecy (delivered only via personal email link).

### Dependency & Impact Map

- Upstream dependencies:
  - `GuardedLayout` (`layout.tsx`) — session gate already in place; no changes needed.
  - `useUuid` — reads `?uuid` from query params; no changes needed.
  - `useUnifiedBookingData` — provides `checkOutDate` and `firstName`; no changes needed.
  - `useCheckInCode` — provides the door code; no changes needed.
  - Firebase `checkInCodes/byUuid/{uuid}` path — already populated by the CF function on arrival day.
  - CF function `/api/check-in-code` (POST) — already handles auto-generation; called by `useCheckInCode.generateCode`.

- Downstream dependents:
  - Email templates T06 and T07 — these send the `APP_LINK` slot resolving to this page. The slot is currently rendered as placeholder copy; once the page is built, the link becomes live and functional.
  - The `mcp_send_booking_email` tool sends `occupantLinks` (the prime URL) to guests. The `/main-door-access?uuid=<occupantId>` URL format needs to be confirmed as what the email tool constructs. Currently the tool body just lists links; there is no URL template in the tool code itself. The URL is provided by the operator at draft time.

- Likely blast radius:
  - Low. This is a net-new page. No existing pages import or depend on the stub. The guarded layout is unchanged. The only risk is to any existing test that asserts the page tree of `(guarded)`.

### Security and Performance Boundaries

- **Auth**: Guarded by `GuardedGate` in `layout.tsx`. Guests must have a valid session token in localStorage or be PinAuth-authenticated.
- **UUID validation**: `useUuid()` validates against regex `/^occ_\d{13}$/i` and redirects to `/error` on failure. No additional validation needed in the page itself.
- **Code exposure**: The BRK code is a semi-secret (printed on a physical keypad for staff use, but also known to the guest). Showing it on screen to the authenticated guest is intended by design. No sensitive PII is exposed.
- **Offline**: `useCheckInCode` already caches to localStorage; the page must not break when offline.
- **No auth on the CF function**: Intentional design — the uuid is the access token. This is pre-existing and not in scope to change.
- **Performance**: `useFetchCheckInCode` uses React Query with staleTime 5 min. No N+1 risk — single Firebase node read.

### Delivery & Channel Landscape

- Audience/recipient: Authenticated guests on their arrival day or during their stay.
- Channel constraints: Web PWA (Cloudflare Pages). No native app considerations.
- Existing templates/assets: Email templates T06/T07 already reference this page via `APP_LINK`. No design mock exists; page should follow the pattern of other standalone guarded pages.
- Approvals/owners: Engineering only; no content approval gate identified.
- Compliance constraints: None identified — door instructions are operational information already publicly referenced (email and Google Doc).
- Measurement hooks: `recordActivationFunnelEvent` from `apps/prime/src/lib/analytics/activationFunnel.ts` is used in `ArrivalHome.tsx`. If arrival funnel measurement is desired for this page, the same utility is available. Not required for initial build.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + React Testing Library (unit/integration); Playwright (e2e — present but not used for most guarded pages individually).
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/prime/jest.config.cjs --testPathPattern=main-door-access`
- CI integration: Tests run in the `reusable-app.yml` workflow on the `dev`/`main` branches.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Guarded home arrival mode | Unit | `apps/prime/src/app/(guarded)/__tests__/arrival.test.tsx` | Tests `useCheckInCode` mock returning `BRK-ABCDE`; confirms arrival mode renders |
| `useCheckInCode` offline cache | Unit | `apps/prime/src/hooks/__tests__/useCheckInCode.offline-cache.test.ts` | Covers localStorage fallback when offline |
| `main-door-access` page | None | — | **No test file exists** |

#### Coverage Gaps

- Untested paths:
  - The `/main-door-access` page itself — no tests at all.
  - Loading state render.
  - Offline state with no cache (error banner).
  - Stale cache warning banner.
  - Error state from `useUnifiedBookingData`.
  - Code display with a real `BRK-XXXXX` value.

#### Testability Assessment

- Easy to test:
  - Rendering with a mocked `useCheckInCode` returning a code, loading state, or null.
  - Rendering with a mocked `useUnifiedBookingData`.
  - Copy-to-clipboard button (can assert `navigator.clipboard.writeText` mock).
- Hard to test:
  - True offline behaviour (relies on `useOnlineStatus` which mocks `navigator.onLine`).
- Test seams needed:
  - `useCheckInCode` must be mockable via `jest.mock('../../../hooks/useCheckInCode', ...)` — the existing test in `arrival.test.tsx` confirms this works.
  - `useUnifiedBookingData` must be mockable — pattern already established in `arrival.test.tsx`.

#### Recommended Test Approach

- Unit tests for: page renders code panel (code present), loading spinner (isLoading), error state (useUnifiedBookingData returns error), offline-with-cache warning, offline-without-cache error.
- Integration tests for: not required initially.
- E2E tests for: not required initially.
- Contract tests for: not required.

### Recent Git History (Targeted)

- `apps/prime/src/app/(guarded)/main-door-access/page.tsx` — `4c1071845a` (feat: migrate 26 route pages to DS tokens, TASK-12): page was created as a stub at this point, with DS-token-compliant classes already applied. Previous commit `b14a44d5c4` patched CI failures. Oldest relevant history `77bd833c53` ("huge update") which is where most prime guarded pages were first laid down.
- `apps/prime/src/hooks/useCheckInCode.ts` — `42bc667052` (Wave 1: offline code, feat): implemented offline caching behaviour in this file.
- `apps/prime/src/components/arrival/ArrivalHome.tsx` — `0926519eb5` (DS migration, TASK-03): migrated to DS tokens; this is the pattern reference for the new page.

---

## Questions

### Resolved

- Q: Does the page need to display the QR code?
  - A: No. The `CheckInQR` component generates a QR that encodes a `/checkin/BRK-XXXXX` URL for staff to scan. The door code (`BRK-XXXXX`) is entered manually at the door keypad. The page should show the code in large legible text (ideally with a copy button) alongside door instructions — not a QR.
  - Evidence: T06/T07 email body text says "Read the instructions" — the instructions include the code. `CheckInQR` comment: "Staff can scan the QR or type the code to look up the guest." This is a different flow.

- Q: What door instructions should be displayed?
  - A: The instructions are currently in a Google Doc referenced in T06/T07 (`canonical_reference_url`). The page can embed static copy for the door operation steps. The exact steps are not in the codebase; they are in the Google Doc. The plan should include a content task or assumption that static copy is provided.
  - Evidence: T06 body: "Note, your keycard is only for room access." / "The main door is locked overnight for security reasons." These can seed the instruction copy.

- Q: Does the page need to auto-generate the code if none exists?
  - A: Yes, `useCheckInCode` auto-generates when `autoGenerate=true` (default) and `uuid` + `checkOutDate` are available and the guest is online. The page needs `checkOutDate` from `useUnifiedBookingData`.
  - Evidence: `useCheckInCode.ts` lines 133-147.

- Q: How does `uuid` reach the page?
  - A: Via `?uuid=<occupantId>` in the URL (from the email link). `useUuid()` reads `searchParams.get('uuid')` first, then falls back to `localStorage.prime_guest_uuid`. No layout-level forwarding is needed.
  - Evidence: `useUuid.ts` lines 30-53.

### Open (User Input Needed)

- Q: What are the exact door entry steps to display?
  - Why it matters: The instructions are the primary user-facing content of the page. The Google Doc (`https://docs.google.com/document/d/1nbe64lX27WM88W6d8ucsfvuJU-2_PX--zQB4LEv8LjM/edit`) is the source of truth, but it is not in the codebase.
  - Decision impacted: Copy text in the page component. Could be inline strings or fetched, but fetching adds complexity.
  - Decision owner: Hostel operator / product owner.
  - Default assumption + risk: Plan as static inline copy; use placeholder steps based on email template context ("enter code at keypad, push button, pull door"). Risk: copy may be wrong if the physical mechanism changes.

- Q: Should `enabled` for `useCheckInCode` be `true` always, or only when arrivalState is `arrival-day` or `checked-in`?
  - Why it matters: If `enabled=true` always, guests in `pre-arrival` state will trigger code generation prematurely (or fetch a non-existent code). The existing homepage only enables it on `arrival-day`.
  - Decision impacted: The `enabled` flag passed to `useCheckInCode`.
  - Decision owner: Engineering / product owner.
  - Default assumption + risk: Enable unconditionally (`enabled: true`), since the page is specifically accessed via an email that is sent during or before arrival. If the code doesn't exist yet, `useCheckInCode` will attempt to auto-generate it (requires `checkOutDate`). Low risk — the CF function handles early generation gracefully.

---

## Confidence Inputs

- **Implementation: 88%**
  - The hook, caching, API, and Firebase paths all exist. The stub needs to be replaced with a real component using established patterns. The only uncertainty is the static copy for door instructions.
  - Raises to >=80: Already there. Raises to >=90: Confirm door instruction copy from the operator/Google Doc.

- **Approach: 85%**
  - Using `useUnifiedBookingData` + `useCheckInCode` + offline banners mirrors the `GuardedHomeExperience` pattern exactly. Risk: deciding whether to show a QR (resolved: no). Risk: the `enabled` flag question (low, see open question above).
  - Raises to >=90: Confirm `enabled=true` unconditionally is acceptable.

- **Impact: 90%**
  - This page is directly referenced in T06/T07 emails sent to all guests. Making it functional is a clear, measurable improvement. The `APP_LINK` slot currently renders as placeholder copy.
  - Evidence: T06/T07 are in `normalization_batch: "A"` — highest priority templates.

- **Delivery-Readiness: 85%**
  - All dependencies are present and working. The build pattern is established. One content gap (door instructions copy) could block the build task if not pre-resolved.
  - Raises to >=90: Resolve door instruction copy before the build task starts.

- **Testability: 85%**
  - `useCheckInCode` and `useUnifiedBookingData` are both easily mocked (demonstrated in existing tests). No new mocking infrastructure needed.
  - Raises to >=90: Write the test file before or during implementation.

---

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Door instruction copy is incorrect or incomplete | Medium | Medium | Confirm copy from Google Doc or operator before build; use placeholder steps with a TODO comment |
| `useCheckInCode` auto-generates a code for pre-arrival guests who click the email link early | Low | Low | The CF function handles this gracefully; code generates early but is valid at arrival |
| DS token lint gate rejects raw colour in spinner or icon classes | Low | Low | Follow the `ArrivalHome.tsx` / `cash-prep/page.tsx` pattern precisely; run `pnpm lint` early |
| `useUnifiedBookingData` returns `null` for a guest arriving via the email link without prior portal setup | Low | Medium | Guard against `!occupantData` (already standard pattern); show error state with Return Home link |
| Copy-to-clipboard fails on older mobile browsers (no `navigator.clipboard`) | Low | Low | Add a try/catch (already done in `CheckInQR`); silently skip copy on failure |
| No tests added alongside the page, leaving coverage gap | Medium | Low | Include test task in the plan |

---

## Planning Constraints & Notes

- Must-follow patterns:
  - `'use client'` directive at top of file.
  - `mx-auto max-w-md` container; `min-h-screen bg-muted p-4` or `px-4 py-6 pb-24` for the outer `<main>`.
  - Loading spinner: `h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent` inside a `flex min-h-screen items-center justify-center`.
  - Error state: `<div className="p-4 text-center mt-5 text-danger">` with message and Return Home link.
  - All Tailwind classes must use DS semantic tokens; no raw colours.
  - `useUuid()` must be called (it handles redirect to `/error` automatically).
  - `useUnifiedBookingData()` for `checkOutDate` (and `firstName` for a welcome header if desired).
  - `useCheckInCode({ checkOutDate, enabled: true, autoGenerate: true })` for the code.

- Rollout/rollback expectations:
  - Zero risk to rollback — the stub is self-contained. Reverting to the stub has no downstream effect other than the email link returning to a non-functional page.

- Observability expectations:
  - No new analytics events required for the initial build. Could add a `recordActivationFunnelEvent({ type: 'door_code_viewed', ... })` in a follow-up.

---

## Suggested Task Seeds (Non-binding)

1. **TASK-01**: Replace the `/main-door-access` stub with a functional `MainDoorAccessPage` component. Wire `useUnifiedBookingData` + `useCheckInCode`. Add loading, error, offline-stale, and offline-no-cache states. Display the code prominently with a copy button.
2. **TASK-02**: Write unit tests for `main-door-access/page.tsx` covering: code present, loading, error (booking data missing), offline with cache, offline without cache.
3. **TASK-03** (content, may need operator input): Confirm and embed door entry instruction copy. Replace placeholder steps with verified wording from the Google Doc.
4. **TASK-04**: Create a new `/late-checkin` page at `apps/prime/src/app/(guarded)/late-checkin/page.tsx`. It should explain the out-of-hours arrival process in plain steps (access instructions, what to do on arrival, who to contact). No code/code-display needed — content only. Follow the same `'use client'` + `useUnifiedBookingData` + loading/error guard pattern as other guarded pages.
5. **TASK-05**: Write unit tests for `late-checkin/page.tsx` covering: renders content, loading state, error state.

---

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `apps/prime/src/app/(guarded)/main-door-access/page.tsx` renders the BRK-XXXXX code with loading/error/offline states.
  - `apps/prime/src/app/(guarded)/main-door-access/__tests__/page.test.tsx` covers the cases listed above.
  - `pnpm typecheck && pnpm lint` pass with no new errors.
- Post-delivery measurement plan:
  - Manual QA: click an email link with a valid `?uuid=<occupantId>` after login; confirm code displays.
  - Optionally add an activation funnel event `door_code_viewed` for observability.

---

## Evidence Gap Review

### Gaps Addressed

- [x] Citation Integrity: Every claim above is traced to a specific file and line range. Inferred claims (e.g., copy strategy) are marked as assumptions.
- [x] Boundary Coverage: CF function auth boundary reviewed (no auth gate by design). Firebase paths confirmed. Error/fallback paths reviewed (offline cache, null code, null occupantData).
- [x] Testing/Validation Coverage: Confirmed no test file exists; existing mocking patterns confirmed sufficient; coverage gaps enumerated.
- [x] Business Validation Coverage: The `APP_LINK` slot context is explicit (T06/T07). Signal coverage is clear — the page is a direct functional requirement from the email template.
- [x] Confidence Calibration: Scores reflect one genuine gap (door instruction copy). Reductions applied accordingly.

### Confidence Adjustments

- Implementation confidence capped at 88% (not 95%) because the door instruction copy is not yet confirmed from the Google Doc.
- Delivery-Readiness capped at 85% for the same reason.

### Remaining Assumptions

- Static inline copy for door instructions will be used. The plan task should include a sub-step to confirm the wording with the operator, or include a placeholder.
- `enabled: true` (unconditional) is acceptable for `useCheckInCode` on this page.
- No i18n required for the initial build.

---

## Planning Readiness

- Status: **Ready-for-planning**
- Blocking items: None hard-blocking. The door instruction copy gap is a plan-level concern, not a fact-find blocker.
- Recommended next step: `/lp-do-plan` to produce the task list. Ensure TASK-03 (copy confirmation) is included.
