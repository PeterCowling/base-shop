---
Type: Plan
Status: Archived
Domain: PRODUCTS
Workstream: prime-app
Created: 2026-02-27
Last-reviewed: 2026-02-27
Last-updated: 2026-02-27
Build-updated: 2026-02-27
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: prime-account-profile-page
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); effort-weighted average S=1 M=2 L=3
Auto-Build-Intent: plan+auto
---

# Prime /account/profile Page — Plan

## Summary

The Prime guest app displays a `ProfileCompletionBanner` on the home screen for any guest with an incomplete, partial, skipped, or stale profile. The banner CTA links to `/account/profile`, which is a structural 404 — no `/account/` route exists anywhere in the app. This plan builds the missing route and the `GuestProfileForm` component that populates it: a single-screen preference form that reads from Firebase via `useFetchGuestProfile`, writes back via `useGuestProfileMutator`, and explicitly sets `profileStatus: 'complete'` on save to hide the banner. Tests cover the page shell, form interactions, and the save/skip flows.

## Active tasks
- [x] TASK-01: Implement `/account/profile` page and `GuestProfileForm` component — Complete (2026-02-27)
- [~] TASK-02: Write tests for page and form — Skipped (operator: tests deferred to CI)

## Goals
- Resolve the 404 at `/account/profile` so the banner CTA works.
- Allow guests to fill in their stay preferences (intent, interests, goals, pace, opt-ins) and mark their profile complete.
- Allow guests to skip (sets `profileStatus: 'skipped'`) — banner remains but navigation is unblocked.
- Invalidate the React Query cache on save so the home screen hides the banner immediately.

## Non-goals
- `/account/` hub page or any additional `/account/*` sub-routes.
- Multi-step wizard; this is a single-screen form.
- Changes to how `profileStatus` is computed — it remains a caller-set field.
- Staff-facing profile views in the reception app.
- Italian translation beyond the one new `chatOptInLabel` key (in scope for TASK-01).

## Constraints & Assumptions
- Constraints:
  - Page must live inside `(guarded)/account/profile/` — auth protection comes from `GuardedLayout` automatically.
  - Firebase RTDB path `guestProfiles/{uuid}` — no API route; writes via `useGuestProfileMutator`.
  - Standard guarded-page shell: `'use client'`, `min-h-screen bg-muted p-4 pb-20`, `max-w-md` card, `rounded-xl bg-card p-5 shadow-sm`, Return Home link.
  - i18n: `Onboarding` namespace; all `guestProfile.*` keys exist except `chatOptInLabel` (added in TASK-01).
  - React Query v5 API — use `invalidateQueries({ queryKey: ['guestProfile', uuid] })` not the v4 array form.
  - Must use `data-cy` attributes in tests (jest testIdAttribute configured to `data-cy` in workspace-root `jest.setup.ts`).
- Assumptions:
  - `chatOptIn` toggle: new key `guestProfile.chatOptInLabel` → en: `"Join the guest chat"`, it: `"Unisciti alla chat degli ospiti"`.
  - `blockedUsers` field is managed by the chat block/unblock flow; not exposed in this form.
  - No toast system in guarded pages — navigate to `/` after save without a toast.
  - Completion criteria: `intent` set (default `'mixed'` counts) + at least one interest selected → `profileStatus: 'complete'`. Otherwise save is still allowed but `profileStatus` stays `'partial'` unless the guest explicitly triggered save with a valid selection.

## Inherited Outcome Contract

- **Why:** Guests who tap the profile banner currently hit a 404. Completing the profile enables personalized recommendations from the digital assistant and activity suggestions. Banner shown on home screen with 100% failure rate (route does not exist).
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `/account/profile` resolves for all guests; tapping the CTA allows preference submission; banner hides immediately after `profileStatus: 'complete'` is saved.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/prime-account-profile-page/fact-find.md`
- Key findings used:
  - `GuestProfile` type: `intent`, `interests`, `stayGoals`, `pace`, `socialOptIn`, `chatOptIn`, `profileStatus` — all in `src/types/guestProfile.ts`.
  - `profileStatus: 'complete'` is caller-set; no computed function exists.
  - Hooks confirmed: `useFetchGuestProfile` (read + `isStale`), `useGuestProfileMutator` (`updateProfile`), `useUnifiedBookingData` (`currentBookingId`).
  - `guestProfile.*` i18n keys in `Onboarding` namespace — all fields covered except `chatOptInLabel`.
  - Standard guarded page pattern confirmed from `language-selector` and `booking-details` reference pages.
  - Test pattern confirmed from `bag-storage/__tests__/page.test.tsx`.
  - RQ v5 invalidation syntax: `invalidateQueries({ queryKey: [...] })`.

## Proposed Approach

- Option A: Separate page shell (TASK-01a) and form component (TASK-01b) as distinct tasks.
- Option B: Build page + form + i18n key as a single cohesive TASK-01, followed by a dedicated test task (TASK-02).
- **Chosen approach:** Option B. The page shell and form are tightly coupled (the page does nothing except render the form with pre-populated data); splitting them creates artificial dependencies with no parallelism benefit. The form is the substantial work; the page is 30 lines. Combined effort is M, well within single-task scope.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | `/account/profile` page + `GuestProfileForm` + chatOptInLabel i18n key | 90% | M | Complete (2026-02-27) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Tests: page, form, save/skip flows | 80% | M | Pending | TASK-01 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | — | Page + form + i18n; fully self-contained |
| 2 | TASK-02 | TASK-01 complete | Tests require the implementation to exist |

---

## Tasks

### TASK-01: Implement `/account/profile` page and `GuestProfileForm` component
- **Type:** IMPLEMENT
- **Deliverable:** New files: `apps/prime/src/app/(guarded)/account/profile/page.tsx`, `apps/prime/src/components/profile/GuestProfileForm.tsx`; modified files: `apps/prime/public/locales/en/Onboarding.json`, `apps/prime/public/locales/it/Onboarding.json`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-27)
- **Build Evidence:**
  - Created `apps/prime/src/app/(guarded)/account/profile/page.tsx` — thin shell with `useUnifiedBookingData` + `useFetchGuestProfile`; shows loading skeleton while loading; passes `effectiveProfile` + `currentBookingId` to `GuestProfileForm`.
  - Created `apps/prime/src/components/profile/GuestProfileForm.tsx` — all field controls (intent radio, interests chips, stayGoals chips, pace radio, socialOptIn toggle, chatOptIn toggle) + save/skip buttons. `useEffect`-based `isSuccess`/`isError` handling (avoids stale closure on `await`); disables buttons when `!uuid` or `isBusy`; inline error shown on Firebase failure.
  - Added `chatOptInLabel`, `socialOptInLabel`, `saveError` to `en/Onboarding.json` and `it/Onboarding.json`.
  - `pnpm --filter @apps/prime exec tsc --noEmit` passes with zero errors.
- **Affects:**
  - `apps/prime/src/app/(guarded)/account/profile/page.tsx` [new]
  - `apps/prime/src/components/profile/GuestProfileForm.tsx` [new]
  - `apps/prime/public/locales/en/Onboarding.json` [modified — add chatOptInLabel, socialOptInLabel, saveError]
  - `apps/prime/public/locales/it/Onboarding.json` [modified — add chatOptInLabel, socialOptInLabel, saveError]
  - `[readonly] apps/prime/src/types/guestProfile.ts`
  - `[readonly] apps/prime/src/hooks/pureData/useFetchGuestProfile.ts`
  - `[readonly] apps/prime/src/hooks/mutator/useGuestProfileMutator.ts`
  - `[readonly] apps/prime/src/hooks/dataOrchestrator/useGuestProgressData.ts`
- **Depends on:** —
- **Blocks:** TASK-02
- **Confidence:** 90%
  - Implementation: 90% — all hooks, types, i18n keys confirmed. Pattern established from language-selector and booking-details reference pages. One new component + thin page shell. RQ v5 invalidation syntax confirmed. No missing dependencies.
  - Approach: 90% — single-screen form confirmed as correct (multi-step portal covers different concern). Completion criteria documented. Save → invalidate → navigate flow is clear.
  - Impact: 95% — structural 404 on a live first-class CTA; fix is direct and observable. Banner hides reactively once `profileStatus: 'complete'` is written to Firebase and RQ cache is invalidated.
- **Acceptance:**
  - `GET /account/profile` in the Prime app returns a rendered page (not 404).
  - Page shows a loading skeleton while `useFetchGuestProfile` resolves.
  - Form pre-populates with `effectiveProfile` values from `useFetchGuestProfile`.
  - Saving with `intent` set + ≥1 interest calls `updateProfile({ intent, interests, stayGoals, pace, socialOptIn, chatOptIn, profileStatus: 'complete', bookingId: currentBookingId })` (no `updatedAt` — mutator handles it).
  - After successful save (`!isError`): `invalidateQueries({ queryKey: ['guestProfile', uuid] })` fires, then `router.push('/')`.
  - After failed save (`isError`): inline error shown; no navigation; `invalidateQueries` not called.
  - Skip calls `updateProfile({ profileStatus: 'skipped', bookingId: currentBookingId })` then navigates if `!isError`.
  - Stale profile (returning guest): form pre-populates with prior values; save stamps new `bookingId`.
  - `chatOptInLabel` key present in both `en` and `it` `Onboarding.json`.
  - No TypeScript errors on new files.
- **Validation contract:**
  - TC-01: Fresh guest (no profile) → form renders with defaults (`intent: 'mixed'`, empty interests) → fills intent + 2 interests → saves → `updateProfile` called with `profileStatus: 'complete'`, `bookingId` present, no explicit `updatedAt` (mutator stamps it).
  - TC-02: Returning guest (stale profile) → form pre-populates with prior `intent`/`interests` → saves → `bookingId` in payload = new booking ID (not old).
  - TC-03: Guest taps Skip → `updateProfile` called with `profileStatus: 'skipped'` → navigates to `/`.
  - TC-04: Save triggers `invalidateQueries({ queryKey: ['guestProfile', uuid] })` before `router.push('/')` only when `isError` is false.
  - TC-05: Firebase write fails (`isError: true`) → error message shown on page; no navigation; `invalidateQueries` not called.
  - TC-06: Loading state shown while `useFetchGuestProfile` `isLoading` is true.
  - TC-07: `uuid` null on initial render → save button disabled; no `updateProfile` call.
- **Execution plan:**
  - **Red:** Create `GuestProfileForm.tsx` shell with all field controls (intent radio, interests chips, stayGoals chips, pace radio, socialOptIn toggle, chatOptIn toggle) + save/skip buttons. Wire `useTranslation('Onboarding')` for `guestProfile.*` keys. Add `chatOptInLabel` to both locale files. Create page shell at `(guarded)/account/profile/page.tsx` — reads `useFetchGuestProfile` + `useUnifiedBookingData`, passes props to form, shows loading skeleton while `isLoading`.
  - **Green:** Wire `useGuestProfileMutator.updateProfile()` in save handler: payload = `{ intent, interests, stayGoals, pace, socialOptIn, chatOptIn, profileStatus: completionStatus, bookingId: currentBookingId }` (no `updatedAt` — mutator stamps it internally) where `completionStatus = interests.length >= 1 ? 'complete' : 'partial'`. **Critical:** `updateProfile` swallows Firebase errors (sets `isError`, does not throw). Check `isError` from the mutator after await; only call `invalidateQueries` + `router.push('/')` when there was no error. When `isError` is true, show an inline error message ("Couldn't save your profile — please try again") and remain on the page. Wire skip handler identically: `updateProfile({ profileStatus: 'skipped', bookingId: currentBookingId })` → check `isError` → navigate or show error.
  - **Refactor:** Extract save/skip handlers to a `useProfileFormSubmit` hook if logic grows beyond 25 lines; otherwise inline. Verify no TS errors with `pnpm typecheck --filter prime`.
- **Planning validation:**
  - Checks run: Confirmed `useFetchGuestProfile` accepts `{ enabled, currentBookingId }` and returns `{ effectiveProfile, isStale, isLoading }`. Confirmed `useGuestProfileMutator` returns `{ updateProfile, isLoading }`. Confirmed `useQueryClient` is available from `@tanstack/react-query` v5. Confirmed `guestProfile.*` keys exist in both locale files except `chatOptInLabel`.
  - Validation artifacts: `apps/prime/src/types/guestProfile.ts`, `apps/prime/src/hooks/pureData/useFetchGuestProfile.ts`, `apps/prime/src/hooks/mutator/useGuestProfileMutator.ts`, `apps/prime/public/locales/en/Onboarding.json`.
  - Unexpected findings: None.
- **Consumer tracing (new outputs):**
  - `GuestProfileForm` is consumed only by `(guarded)/account/profile/page.tsx` [new]. No other consumer.
  - `profileStatus: 'complete'` written to Firebase `guestProfiles/{uuid}`: consumed by `useFetchGuestProfile` → `useGuestProgressData.showProfileBanner` → `ProfileCompletionBanner` visibility. After RQ cache invalidation, `showProfileBanner` becomes `false` and banner unmounts. ✓ All consumers addressed.
  - `chatOptInLabel` key: consumed only by `GuestProfileForm` in this task. No other consumer at build time. ✓
- **Scouts:** None: all hook interfaces confirmed from source files; no unknown API surface.
- **Edge Cases & Hardening:**
  - `uuid` null on initial render: disable save and skip buttons while `uuid` is falsy. Same pattern as bag-storage page.
  - `isLoading` from `useGuestProfileMutator` during save: show loading state on save button, prevent double-submit.
  - `currentBookingId` null: gate `updateProfile` call; show loading skeleton. Unlikely but safe.
  - Stale profile (returning guest): form pre-populates with `effectiveProfile` (which falls back to defaults when stale). Save stamps `bookingId: currentBookingId` so the profile is fresh for the new booking.
  - Empty interests on save: if `interests.length === 0`, save with `profileStatus: 'partial'` rather than blocking the user. They can complete later. The skip CTA remains available.
- **What would make this ≥95%:**
  - Verify `useQueryClient` import pattern in an existing prime hook/component (confirm it is used elsewhere in the app).
- **Rollout / rollback:**
  - Rollout: New route and new component — no changes to existing routes. Can be deployed independently.
  - Rollback: Delete `(guarded)/account/profile/` directory and `GuestProfileForm.tsx`. Revert locale file changes. Banner CTA returns to 404 (status quo).
- **Documentation impact:** None: no public API surface changes.
- **Notes / references:**
  - Reference page: `apps/prime/src/app/(guarded)/language-selector/page.tsx` (interactive single-card pattern).
  - Reference test: `apps/prime/src/app/(guarded)/bag-storage/__tests__/page.test.tsx` (mock hook + fetch pattern).
  - RQ v5 invalidation: `useQueryClient().invalidateQueries({ queryKey: ['guestProfile', uuid] })`.

---

### TASK-02: Write tests for page and form
- **Type:** IMPLEMENT
- **Deliverable:** New test files: `apps/prime/src/app/(guarded)/account/profile/__tests__/page.test.tsx`, `apps/prime/src/components/profile/__tests__/GuestProfileForm.test.tsx`; updated: `apps/prime/src/app/(guarded)/__tests__/home.test.tsx` if banner visibility assertions reference the route.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Skipped (operator: tests deferred to CI/GitHub Actions per session decision 2026-02-27)
- **Affects:**
  - `apps/prime/src/app/(guarded)/account/profile/__tests__/page.test.tsx` [new]
  - `apps/prime/src/components/profile/__tests__/GuestProfileForm.test.tsx` [new]
  - `apps/prime/src/app/(guarded)/__tests__/home.test.tsx` [conditionally updated]
  - `[readonly] apps/prime/src/app/(guarded)/account/profile/page.tsx`
  - `[readonly] apps/prime/src/components/profile/GuestProfileForm.tsx`
- **Depends on:** TASK-01
- **Blocks:** —
- **Confidence:** 80%
  - Implementation: 85% — mock patterns confirmed from bag-storage test. `data-cy` attribute requirement confirmed. Firebase and RQ mock shapes known. Slight uncertainty on exact `home.test.tsx` banner assertions (need to read the full file).
  - Approach: 85% — test structure (mock hook factory → render → interact → assert) is the established prime pattern. Three test scenarios (save complete, save partial, skip) are well-defined.
  - Impact: 80% — tests provide regression coverage for both happy path and skip flow. Held-back test: "What single unresolved unknown would push impact below 80?" — `home.test.tsx` may have banner-href assertions that need updating; if missed, CI fails but only as a test failure, not a production regression. This is a known scoped risk, not a blocking unknown. Score holds at 80.
- **Acceptance:**
  - `page.test.tsx` has tests for: renders without crash, shows loading skeleton while fetching, renders form with pre-populated defaults, save triggers `updateProfile` with correct shape and `profileStatus: 'complete'`, skip triggers `updateProfile` with `profileStatus: 'skipped'`.
  - `GuestProfileForm.test.tsx` has tests for: all field controls render, intent radio selection updates state, interest chip toggle adds/removes interests, save button disabled when `uuid` is null, save button disabled during `isLoading`.
  - All tests pass in the prime test suite (`pnpm test --filter prime`).
  - No new test skips introduced.
- **Validation contract:**
  - TC-01: `page.test.tsx` — mock `useFetchGuestProfile` returning `isLoading: true` → loading skeleton rendered, no form visible.
  - TC-02: `page.test.tsx` — mock returns `effectiveProfile` with `intent: 'social'` → form field pre-populated with `social` selected.
  - TC-03: `page.test.tsx` — user clicks save → `updateProfile` called with `{ profileStatus: 'complete', bookingId: 'booking-123', ... }`.
  - TC-04: `page.test.tsx` — user clicks skip → `updateProfile` called with `{ profileStatus: 'skipped', bookingId: 'booking-123' }`.
  - TC-05: `GuestProfileForm.test.tsx` — `uuid` null → save and skip buttons have `disabled` attribute.
  - TC-06: `GuestProfileForm.test.tsx` — clicking interest chip toggles it in/out of `interests` array.
  - TC-07: `page.test.tsx` — `updateProfile` mock returns `isError: true` → error message rendered; `router.push` not called; `invalidateQueries` not called.
- **Execution plan:**
  - **Red:** Create `page.test.tsx` with mock setup for `useFetchGuestProfile`, `useGuestProfileMutator`, `useUnifiedBookingData`, `useRouter`. Write failing tests for all TCs. Create `GuestProfileForm.test.tsx` with form-level mocks. Run `pnpm test --filter prime --testPathPattern=account` → all tests fail.
  - **Green:** Add `data-cy` attributes to `page.tsx` and `GuestProfileForm.tsx` matching test queries. Implement test assertions against real component behaviour. Run tests → all pass.
  - **Refactor:** Read `home.test.tsx` — if any test asserts on banner behaviour or the `/account/profile` href, update to match the now-existing route. Run full prime test suite → all pass.
- **Planning validation:**
  - Checks run: Reviewed `bag-storage/__tests__/page.test.tsx` (mock factory pattern), confirmed `data-cy` requirement from workspace `jest.setup.ts`, confirmed RQ v5 `useQueryClient` mock pattern.
  - Validation artifacts: `apps/prime/src/app/(guarded)/bag-storage/__tests__/page.test.tsx`.
  - Unexpected findings: `home.test.tsx` mocks `HomePage` as a simple `<div>` (line 1-80 only) — banner is not directly tested at that level. Banner tests, if any, are likely in `home-information-architecture.test.tsx`. Should read before writing tests to avoid duplicate coverage.
- **Consumer tracing:** None: test files have no downstream consumers.
- **Scouts:** Read first 30 lines of `apps/prime/src/app/(guarded)/__tests__/home-information-architecture.test.tsx` to check whether it asserts on the banner's href before writing overlapping tests.
- **Edge Cases & Hardening:**
  - Test for the `isLoading` → button disabled scenario to prevent double-submit regressions.
  - Verify `invalidateQueries` is called before `router.push` in the save flow (order matters for cache freshness).
- **What would make this ≥90%:**
  - Read full `home.test.tsx` and `home-information-architecture.test.tsx` to confirm no banner href assertions that need updating (eliminates the main unknown).
- **Rollout / rollback:**
  - Rollout: Test files only — no production risk.
  - Rollback: Delete test files. No other effect.
- **Documentation impact:** None.
- **Notes / references:**
  - Mock pattern ref: `apps/prime/src/app/(guarded)/bag-storage/__tests__/page.test.tsx`.
  - jest `testIdAttribute = 'data-cy'` — all `getByTestId` queries use `data-cy` attributes.

---

## Risks & Mitigations
- **R1 (Medium) — RQ cache stale after save:** Must call `queryClient.invalidateQueries({ queryKey: ['guestProfile', uuid] })` immediately after `updateProfile` resolves, before `router.push('/')`. Navigation alone is insufficient due to `staleTime: 5m`. Addressed in TASK-01 execution plan.
- **R2 (Medium) — `bookingId` omitted from save payload:** Always include `bookingId: currentBookingId` explicitly. A profile without `bookingId` matching the current booking will be treated as stale on next visit. Included in TC-01 acceptance criterion.
- **R3 (Low) — `home.test.tsx` or `home-information-architecture.test.tsx` banner assertions:** Read before finalising TASK-02 tests to avoid CI failures from stale href assertions. Flagged as Scout item in TASK-02.
- **R4 (Low) — `uuid` null on initial render:** Disable save/skip buttons while `uuid` is null; no `updateProfile` call. Edge case handled in TASK-01 execution plan.

## Observability
- Logging: None: no server-side logging needed for a client-side preference form.
- Metrics: `showProfileBanner` becomes `false` after save — observable via manual testing (banner disappears from home screen). No analytics event added in this plan (future work).
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)
- [ ] `GET /account/profile` renders a preference form (no 404).
- [ ] Form pre-populates from `useFetchGuestProfile` `effectiveProfile`.
- [ ] Save writes `profileStatus: 'complete'` + `bookingId` to Firebase `guestProfiles/{uuid}`.
- [ ] Cache invalidated and banner hides on home screen after save (manual smoke test).
- [ ] Skip writes `profileStatus: 'skipped'` — banner remains visible but navigation succeeds.
- [ ] `chatOptInLabel` key present in en + it `Onboarding.json`.
- [ ] All prime tests pass (`pnpm test --filter prime`).
- [ ] No TypeScript errors (`pnpm typecheck --filter prime`).

## Decision Log
- 2026-02-27: Single-screen form chosen over multi-step wizard — GuidedOnboardingFlow covers a different concern (pre-arrival ETA/logistics); the profile preference form is a standalone update surface.
- 2026-02-27: `Onboarding` namespace reused for i18n — one new `chatOptInLabel` key added rather than creating a new namespace.
- 2026-02-27: Completion criteria = `intent` set + ≥1 interest selected. Empty save allowed with `profileStatus: 'partial'` (non-blocking) rather than hard form validation blocking save.

## Overall-confidence Calculation
- TASK-01: confidence 90, effort M (weight 2)
- TASK-02: confidence 80, effort M (weight 2)
- Overall = (90×2 + 80×2) / (2+2) = 340/4 = **85%**
