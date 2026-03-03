---
Type: fact-find
Outcome: planning
Status: Ready-for-planning
Domain: PRODUCTS
Workstream: prime-app
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: []
Dispatch-ID: IDEA-DISPATCH-20260227-0002
Trigger-Source: operator_idea
Trigger-Why: "ProfileCompletionBanner at apps/prime/src/components/profile/ProfileCompletionBanner.tsx:70 links to /account/profile. No /account/ route group exists anywhere in apps/prime — every tap of 'Complete profile' or 'Update preferences' results in a 404. Banner is shown on the home screen for all guests with profileStatus !== 'complete' or a stale profile."
Trigger-Intended-Outcome: "Build the /account/profile page so guests can fill in their stay preferences (intent, interests, goals, pace, opt-ins) and have profileStatus set to 'complete', hiding the banner."
---

# Fact-Find: Prime /account/profile Page

## Scope

### Summary
The Prime guest app shows a `ProfileCompletionBanner` prominently on the home screen for any guest whose profile is incomplete, partial, skipped, or stale. The banner's CTA links to `/account/profile`, which is a 404 — no `/account/` route or `GuestProfileForm` component exists anywhere in the app. This fact-find scopes the implementation of the missing route and the form it must render.

### Goals
- Create `apps/prime/src/app/(guarded)/account/profile/page.tsx` so the banner CTA resolves.
- Build `GuestProfileForm` — a form component that pre-populates from Firebase, captures the five `GuestProfile` preference fields, and on save calls `updateProfile({ ...fields, profileStatus: 'complete', bookingId: currentBookingId })`.
- Allow guests to skip (sets `profileStatus: 'skipped'`, not `'complete'`), keeping the banner visible but not blocking navigation.
- Add tests for the new page and form component following existing prime test conventions.

### Non-goals
- Multi-step wizard (the Onboarding portal covers pre-arrival; this page is a simple single-screen preference form).
- `/account/` hub page or additional `/account/*` sub-routes (no other references to `/account/` exist; defer to a future plan).
- Changing how `profileStatus` is computed — it remains a caller-set field; `'complete'` is written explicitly on save.
- Staff-facing profile summary views in the reception app.
- Italian i18n for keys beyond `guestProfile.chatOptInLabel` — all other profile field keys already exist in en and it. Only one new key is needed (see Constraints).

### Constraints
- Must use the existing `(guarded)` route group — auth protection is provided automatically by `GuardedLayout` (client-side `GuardedGate`).
- Firebase RTDB path `guestProfiles/{uuid}` — no API route, writes go directly via `useGuestProfileMutator`.
- Page style must follow the established guarded-page shell: `'use client'`, `min-h-screen bg-muted p-4 pb-20`, `max-w-md` card layout, `rounded-xl bg-card p-5 shadow-sm`, `Return Home` link at bottom.
- i18n: reuse `guestProfile.*` keys from the `Onboarding` namespace (already defined and translated in en/it). No new namespace needed.
- One new i18n key required: `guestProfile.chatOptInLabel` in `Onboarding.json` (en + it). All other form field keys already exist. This is a one-line addition per locale.
- No other new dependencies — all required hooks, types, and i18n keys are already in the codebase or covered by the one key above.

---

## Outcome Contract

Why: Guests who tap the profile banner currently hit a 404. Completing the profile enables personalized recommendations from the digital assistant and activity suggestions. This is a first-party CTA on the home screen with 100% failure rate.
Source: operator-stated + repro confirmed (no /account/ route in apps/prime)

---

## Evidence Audit (Current State)

### Entry Points

| Entry Point | Path | Notes |
|---|---|---|
| ProfileCompletionBanner CTA | `apps/prime/src/components/profile/ProfileCompletionBanner.tsx:70` | `<Link href="/account/profile">` — the dead link |
| Home page (guarded) | `apps/prime/src/app/(guarded)/page.tsx` | Thin shell → `GuardedHomeExperience` (dynamic, ssr:false) |
| GuardedHomeExperience | `apps/prime/src/components/homepage/GuardedHomeExperience.tsx` | Renders `HomePage` which renders the banner |
| Banner render site | `apps/prime/src/components/homepage/HomePage.tsx:160` | `{showProfileBanner && <ProfileCompletionBanner .../>}` |

### Key Modules / Files

| File | Role |
|---|---|
| `apps/prime/src/types/guestProfile.ts` | `GuestProfile` interface + `ProfileStatus` type + `DEFAULT_GUEST_PROFILE` defaults |
| `apps/prime/src/hooks/pureData/useFetchGuestProfile.ts` | React Query read hook; `effectiveProfile` + `isStale` derivation |
| `apps/prime/src/hooks/mutator/useGuestProfileMutator.ts` | Firebase write: `updateProfile(partial)` merges, `setProfile(full)` replaces |
| `apps/prime/src/hooks/dataOrchestrator/useGuestProgressData.ts` | Derives `showProfileBanner`, `effectiveProfileStatus`, `isProfileStale` |
| `apps/prime/src/app/(guarded)/layout.tsx` | `GuardedLayout` — provides auth guard, `PinAuthProvider`, `ChatProvider` |
| `apps/prime/public/locales/en/Onboarding.json` | `guestProfile.*` keys: title, intentLabel, intent.{social,quiet,mixed}, interestsLabel, interests.{beaches,food,hiking,history,nightlife,photography}, goalsLabel, goals.{adventure,explore,meetPeople,relax}, paceLabel, pace.{relaxed,active} + Desc, saveCta, skipCta |
| `apps/prime/public/locales/it/Onboarding.json` | Italian translations of same keys (confirmed present) |
| `apps/prime/src/app/(guarded)/booking-details/page.tsx` | Reference page pattern (multi-card, useTranslation, Return Home link) |
| `apps/prime/src/app/(guarded)/language-selector/page.tsx` | Reference page pattern (interactive single-card form-like layout) |

### Data & Contracts

**`GuestProfile` type** (`src/types/guestProfile.ts`):
```ts
interface GuestProfile {
  bookingId: string;              // stay scoping key — must be written on save
  profileStatus: 'complete' | 'skipped' | 'partial';  // explicitly set by caller
  intent: 'social' | 'quiet' | 'mixed';
  interests: string[];            // 'beaches'|'food'|'hiking'|'history'|'nightlife'|'photography'
  stayGoals: string[];            // 'adventure'|'explore'|'meetPeople'|'relax'
  pace: 'relaxed' | 'active';
  socialOptIn: boolean;
  chatOptIn: boolean;
  blockedUsers: string[];         // NOT touched by profile form
  createdAt: number;
  updatedAt: number;
}
```

**`profileStatus` semantics (confirmed):** There is no computed completeness function. The profile page must explicitly write `profileStatus: 'complete'` on save and `profileStatus: 'skipped'` on skip. The default from `DEFAULT_GUEST_PROFILE` is `'partial'`.

**Staleness:** `isStale = profile.bookingId !== currentBookingId`. The profile page must write `bookingId: currentBookingId` on every save so subsequent visits don't show a stale banner.

**Firebase path:** `guestProfiles/{uuid}` — write via `useGuestProfileMutator.updateProfile()`.

**Read:** `useFetchGuestProfile({ enabled: true, currentBookingId })` — returns `effectiveProfile` (pre-populated defaults when partial/stale) and `isStale`.

**`currentBookingId`:** available from `useUnifiedBookingData()` hook (same source as `useGuestProgressData`).

### Dependency & Impact Map

```
ProfileCompletionBanner (dead link)
  → (guarded)/account/profile/page.tsx  [NEW — resolves 404]
      → GuestProfileForm  [NEW]
          ← useFetchGuestProfile  [existing — read]
          ← useGuestProfileMutator  [existing — write]
          ← useUnifiedBookingData  [existing — currentBookingId]
          ← useTranslation('Onboarding')  [existing — guestProfile.* keys]
      ← GuardedLayout  [existing — auth guard, no change needed]

Downstream consumers of profileStatus:
  → useGuestProgressData.showProfileBanner  [hides banner when complete]
  → useGuestProgressData.effectiveProfileStatus  [used by digital assistant for personalisation]
  → Digital assistant recommendation logic  [reads intent/interests/stayGoals/pace]
```

**Blast radius:** Low. Writing to `guestProfiles/{uuid}` affects only that guest's profile node. The `showProfileBanner` flag is derived reactively from the React Query cache; once `updateProfile` writes `profileStatus: 'complete'`, React Query's cache invalidation will hide the banner on next render. No other components read `guestProfiles/{uuid}` except `useGuestProfiles` (real-time staff/chat directory subscription) and `useFetchGuestProfile`.

### Test Landscape

**Existing tests touching profile surface:**
- `src/app/(guarded)/__tests__/home.test.tsx` — tests `GuardedHomeExperience` + `HomePage`. Likely has a test for banner visibility. Will need updating to assert banner links to an existing route.
- `src/app/(guarded)/__tests__/home-information-architecture.test.tsx` — IA/structure tests for the home screen.
- `src/hooks/data/__tests__/useGuestProfiles.test.tsx` — tests the real-time profiles subscription, not the mutator.
- `src/hooks/dataOrchestrator/__tests__/firebase-query-budget.test.tsx` — Firebase query budget regression guard.

**No existing tests for:**
- `useGuestProfileMutator` (no `__tests__` file found for it)
- `ProfileCompletionBanner` (no `__tests__` file found)
- Any `/account/profile` page (route does not exist)

**Required new tests:**
1. `src/app/(guarded)/account/profile/__tests__/page.test.tsx` — renders without crash, pre-populates from hook, calls `updateProfile` with correct payload on submit, calls `updateProfile` with `profileStatus: 'skipped'` on skip, redirects to `/` after save.
2. `src/components/profile/__tests__/GuestProfileForm.test.tsx` — form field rendering, multi-select interactions, validation (intent + at least one interest required before `profileStatus: 'complete'`), loading state from mutator.

**Testability constraints:** Tests must use `data-cy` attributes (jest `testIdAttribute` is configured to `data-cy` in the workspace-root `jest.setup.ts` via `@acme/config/jest.preset.cjs`). Firebase reads/writes must be mocked (React Query mock + `useGuestProfileMutator` mock).

### Recent Git History (Targeted)

Not investigated for this area — `ProfileCompletionBanner` was present in the earliest reviewed code and the `/account/profile` route has never existed. No recent changes affect the implementation path.

---

## Questions

### Resolved

**Q: Should the profile page be a multi-step flow or a single-screen form?**
Single-screen form. The multi-step portal (`GuidedOnboardingFlow`) is for pre-arrival. The profile page is a preference update that guests may revisit multiple times during their stay. A single card-based form is simpler and matches the existing language-selector/booking-details interaction patterns. The Onboarding.json keys don't imply step structure — they're all flat fields.

**Q: Which i18n namespace should the profile page use?**
Reuse the `Onboarding` namespace. Almost all `guestProfile.*` keys are already defined and translated (en + it). One new key is needed: `guestProfile.chatOptInLabel` (the `chatOptIn` toggle label). It must be added to both `public/locales/en/Onboarding.json` and `public/locales/it/Onboarding.json` as part of the implementation. Creating a new `Profile` namespace for a single page would be over-engineering.

**Q: Should `intent`, `interests`, or `stayGoals` be required before setting `profileStatus: 'complete'`?**
Minimum required: `intent` must be set (it's a single-select; the default `'mixed'` counts as set) and at least one interest selected. If the guest saves with `intent` set + ≥1 interest → `'complete'`. If the guest taps skip → `'skipped'`. `stayGoals` and `pace` improve recommendation quality but should not block completion — the default values are valid.

**Q: Where should `(guarded)/account/` live — as a nested route group or a flat segment?**
Flat segment inside `(guarded)`. Create `src/app/(guarded)/account/profile/page.tsx`. The URL resolves to `/account/profile` as required by the existing banner link. No route group wrapper needed.

**Q: Does `useGuestProfileMutator.updateProfile` handle `bookingId` automatically?**
No — it does a generic partial merge. The profile page must explicitly include `bookingId: currentBookingId` in the save payload to prevent future staleness.

**Q: Does `chatOptIn` need a control on the profile page?**
Yes, as a toggle. It is part of `GuestProfile` and affects the chat directory opt-in. The `Onboarding` namespace does not currently have a `chatOptIn` key — one new key (`guestProfile.chatOptInLabel`) must be added to both locale files as part of TASK-02. This is a one-line addition, not a blocker. A simple "Join the guest chat" toggle label is sufficient.

**Q: Is the Italian translation of `guestProfile.*` keys already present?**
Yes — confirmed `apps/prime/public/locales/it/Onboarding.json` exists. i18n is not a blocker.

### Open

None — all blocking questions resolved from available evidence.

---

## Confidence Inputs

| Dimension | Score | Rationale |
|---|---|---|
| Implementation | 0.92 | Route path, hooks, types, and i18n keys all confirmed in codebase. No missing dependencies. One new form component needed. |
| Approach | 0.90 | Single-screen form is clearly correct; multi-step rejected on evidence. Completion criteria resolved. |
| Impact | 0.97 | Structural 100% failure rate: the route simply does not exist, so every HTTP request to `/account/profile` returns 404 by definition. Every guest with an incomplete profile who taps the banner hits this. No analytics needed to confirm the failure — it is a missing route. Fix is direct and observable (banner CTA resolves). |
| Delivery-Readiness | 0.92 | All dependencies present. No external blockers. Pattern well-established. |
| Testability | 0.85 | Firebase mock pattern well-established (React Query + mock hooks). No seam concerns. |

**What raises Implementation to ≥0.95:** Verify `queryClient.invalidateQueries` v5 object-filter API against an existing usage in the prime codebase during TASK-02 implementation (minor — the API shape is well-documented and RQ v5 adoption is standard in this repo).

---

## Risks

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | React Query cache not invalidated after `updateProfile` → banner stays visible after save | Medium | Must call `queryClient.invalidateQueries({ queryKey: ['guestProfile', uuid] })` (React Query v5 object-filter syntax) immediately after successful `updateProfile` before navigating. Navigation alone (`router.push('/')`) is insufficient — `useFetchGuestProfile` has `staleTime: 5m`, so the home screen will serve the cached (incomplete) profile for up to 5 minutes without an explicit cache bust. Invalidation is mandatory; navigation is then safe. |
| R2 | `bookingId` omitted from save payload → profile becomes stale on next visit | Medium | Make `bookingId: currentBookingId` a required field in the save function, not optional. Add test asserting its presence. |
| R3 | `home.test.tsx` fails after adding route — test may assert banner link leads somewhere that doesn't exist | Low | Update home test to assert banner link href is `/account/profile` and the route now resolves. |
| R4 | `useUuid()` returns null on initial render → `updateProfile` fires with null UUID | Low | Show loading state while `uuid` is null; disable save button. Same pattern used by bag-storage page. |

---

## Planning Constraints & Notes

- Page must be `'use client'` — it reads/writes Firebase client-side (same as all other guarded pages).
- `ssr: false` dynamic import wrapper is NOT needed at the page level — only `GuardedHomeExperience` uses that pattern. The profile page is simple enough to render directly.
- `blockedUsers` field: do NOT expose in the form. It is managed by the chat block/unblock flow, not the profile page.
- After a successful save, navigate to `/` with `router.push('/')`. Do not implement a success toast yet (no toast system confirmed in guarded pages).
- `socialOptIn` and `chatOptIn` are boolean toggles. Pre-populate from `effectiveProfile`. Defaults are both `false`.

---

## Suggested Task Seeds

| # | Task | Notes |
|---|---|---|
| TASK-01 | Create `src/app/(guarded)/account/profile/page.tsx` | Thin page shell: loads `GuestProfileForm` with pre-populated data from `useFetchGuestProfile` and `useUnifiedBookingData`. Loading skeleton while data fetches. |
| TASK-02 | Create `src/components/profile/GuestProfileForm.tsx` + add `chatOptInLabel` i18n key | Intent (radio 3-option), Interests (multi-select chips), Stay Goals (multi-select chips), Pace (radio 2-option), Social/Chat opt-in toggles. Save writes `{ intent, interests, stayGoals, pace, socialOptIn, chatOptIn, profileStatus: 'complete', bookingId, updatedAt }`. Skip writes `{ profileStatus: 'skipped', bookingId, updatedAt }`. Must call `queryClient.invalidateQueries({ queryKey: ['guestProfile', uuid] })` (React Query v5 object-filter syntax) before `router.push('/')` on save. Add `guestProfile.chatOptInLabel` to `public/locales/en/Onboarding.json` and `public/locales/it/Onboarding.json`. |
| TASK-03 | Write tests for page + form component | `page.test.tsx`: renders, pre-populates, save flow, skip flow. `GuestProfileForm.test.tsx`: field interactions, payload shape, loading state. Update `home.test.tsx` if banner visibility assertions need adjusting. |

---

## Execution Routing Packet

```yaml
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Deliverable-Type: code-change
Dispatch-ID: IDEA-DISPATCH-20260227-0002
Feature-Slug: prime-account-profile-page
```

---

## Evidence Gap Review

### Gaps Addressed
- **Profile data model**: Fully confirmed (`GuestProfile` type + `ProfileStatus` + `DEFAULT_GUEST_PROFILE`).
- **`profileStatus` completion criteria**: Confirmed — no computed function, explicitly set by caller. Completion = caller writes `'complete'`.
- **Route placement**: Confirmed — `(guarded)/account/profile/page.tsx` resolves to `/account/profile` as required.
- **i18n**: Confirmed — `guestProfile.*` keys in `Onboarding.json` cover all form fields in en and it.
- **Data hooks**: Confirmed — `useFetchGuestProfile` (read), `useGuestProfileMutator` (write), `useUnifiedBookingData` (bookingId). All ready-to-use.
- **No reusable form exists**: Confirmed — `PersonalizationFlow` does not exist; `GuidedOnboardingFlow` covers a different concern. New component needed.
- **Guard mechanism**: Confirmed — placing the page inside `(guarded)/` provides auth protection automatically; no middleware or extra guard needed.
- **Test landscape**: Surveyed — no existing profile page tests; pattern established via similar pages.

### Confidence Adjustments
- Implementation raised from 0.88 (initial estimate) to 0.92 after confirming all hooks are complete and ready-to-use without modification.
- Approach raised from 0.85 to 0.90 after confirming `guestProfile.*` i18n keys already exist, eliminating the i18n-gap risk.

### Remaining Assumptions
- `chatOptIn` toggle requires a new `guestProfile.chatOptInLabel` key in `Onboarding.json`. Proposed en value: `"Join the guest chat"`, it value: `"Unisciti alla chat degli ospiti"`. One-line addition per locale file; in scope for TASK-02.
- React Query cache invalidation via `invalidateQueries` is the recommended approach (standard pattern in the codebase); no alternative confirmed but no evidence of a different pattern either.

---

## Planning Readiness

**Status: Ready-for-planning**

All entry points, hooks, types, i18n keys, route placement, and test patterns confirmed with explicit file path evidence. No open questions. No external blockers. Three task seeds defined covering page, form component, and tests. Confidence above build-eligible threshold on all dimensions.
