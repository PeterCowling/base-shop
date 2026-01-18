---
Type: Plan
Status: Active
Domain: Prime
Last-reviewed: 2026-01-13
Relates-to charter: none
---

# Prime - Experience & Onboarding Improvement Plan

Turn Prime from a utility checklist into a guided, social guest journey that
helps people meet each other, discover Positano, and feel progress each day.
This plan targets changes that can be implemented after the Prime port work is
complete.

## North-star outcome

- Guests know the next best action within their first 2 minutes.
- Social paths are obvious but optional; quiet stays still feel complete.
- Each day has a clear "quest" with a reward moment.

## Experience pillars

- Make the next step obvious and low effort.
- Social by default, privacy-respecting by choice.
- Local flavor first: Positano cues in every step.
- Progress is earned, not forced.

## Success metrics (lightweight)

### Metric definitions

| Metric | Target | Measurement method |
|--------|--------|-------------------|
| Onboarding completion rate | > 80% | `profileStatus === 'complete'` / total profiles |
| Onboarding skip rate | tracking only | `profileStatus === 'skipped'` / total profiles |
| Quest tier 1 completion | > 30% | `'settle-in' in completedTiers` / total quests |
| Guidebook visit rate | > 25% | `guidebookVisited === 'true'` / total users |

### Timing-based metrics (simplified)

The original plan called for "within 12 hours" and "first session" metrics,
but `completedTasks` only stores booleans. Rather than add a timestamp log,
we simplify:

- **Quest tier 1 completion** is measured as a simple rate (no time window).
  If faster completion is a goal, we can add `tierCompletedAt` timestamps
  to `questProgress` and compute time-to-completion post-hoc.

- **Guidebook visit "within first day"** becomes a simple visit rate. The
  `questProgress.checkInDate` can be compared to `tierCompletedAt` if needed.

This avoids introducing a new event logging system while still providing
actionable data.

## Constraints and decisions

- Must follow the existing Next.js App Router structure in `apps/prime`.
- Use the current Firebase Realtime Database + `completedTasks` model where
  possible; avoid introducing new backend services.
- Keep the mobile-first layout and existing visual system; no full redesign.
- Avoid push notifications or external analytics; rely on in-app cues.
- Avoid monorepo-wide test runs; add scoped tests where needed.

## Non-goals

- Building a new admin CMS for activities or local content.
- Replacing Firebase or refactoring auth flows.
- Rewriting the entire UI component library.

---

## Data model

This section defines all new Firebase paths and TypeScript types introduced
by this plan. All new data lives alongside existing structures without
breaking current functionality.

### Terminology

- **uuid** - The occupant identifier used throughout the app (passed via
  `?uuid=` query param). This is the canonical key for all per-guest data.
- **bookingId** - The booking identifier; one booking may have multiple
  occupants. Available from occupant data at `bookings/{bookingId}/occupants/{uuid}`.
- **checkInDate** - The booking's check-in date, available from
  `bookings/{bookingId}/checkInDate` (ISO date string, e.g., "2026-01-15").

### New Firebase paths

```
guestProfiles/{uuid}/
  bookingId: string            # links profile to specific stay
  profileStatus: 'complete' | 'skipped' | 'partial'
  intent: 'social' | 'quiet' | 'mixed'
  interests: string[]          # e.g., ['hiking', 'food', 'nightlife']
  stayGoals: string[]          # e.g., ['relax', 'explore', 'meet-people']
  pace: 'relaxed' | 'active'
  socialOptIn: boolean         # opted into activities/chat
  chatOptIn: boolean           # opted into group chat
  createdAt: number            # timestamp
  updatedAt: number            # timestamp

questProgress/{uuid}/
  bookingId: string            # links progress to specific stay
  checkInDate: string          # ISO date, copied from booking for unlock calc
  currentTier: string          # e.g., 'settle-in', 'social-night'
  completedTiers: string[]     # ['settle-in']
  tierCompletedAt: Record<string, number>  # { 'settle-in': 1705123456 }
```

Note: `badges` are derived from `completedTiers` using the tier config, not
stored separately. This ensures a single source of truth for progress.

### New completedTasks keys

The following task keys must be instrumented to support quest progression.
Keys marked (existing) are already in the app; keys marked (new) require
new completion triggers.

| Key | Source | Notes |
|-----|--------|-------|
| `welcome` | (existing) | Set by WelcomeScreen.tsx |
| `featuresIntro` | (existing) | Set by FeaturesIntro.tsx |
| `mainDoorAccess` | (existing) | Set when door code viewed |
| `complimentaryEveningDrink` | (existing) | Set when drink claimed |
| `activityJoined` | (new) | Set when user opens an activity chat |
| `guidebookVisited` | (new) | Set on first `/positano-guide` visit |
| `localSpotVisited` | (new) | Set when user taps a guide recommendation |
| `profileOnboardingComplete` | (new) | Set after profile step (complete or skip) |

### New TypeScript types

Location: `apps/prime/src/types/guestProfile.ts`

```typescript
export type GuestIntent = 'social' | 'quiet' | 'mixed';
export type GuestPace = 'relaxed' | 'active';
export type ProfileStatus = 'complete' | 'skipped' | 'partial';

export interface GuestProfile {
  bookingId: string;
  profileStatus: ProfileStatus;
  intent: GuestIntent;
  interests: string[];
  stayGoals: string[];
  pace: GuestPace;
  socialOptIn: boolean;
  chatOptIn: boolean;
  createdAt: number;
  updatedAt: number;
}

export const DEFAULT_GUEST_PROFILE: Partial<GuestProfile> = {
  profileStatus: 'partial',
  intent: 'mixed',
  interests: [],
  stayGoals: [],
  pace: 'relaxed',
  socialOptIn: false,
  chatOptIn: false,
};
```

Location: `apps/prime/src/types/questProgress.ts`

```typescript
export interface QuestProgress {
  bookingId: string;
  checkInDate: string;         // ISO date string
  currentTier: string;
  completedTiers: string[];
  tierCompletedAt: Record<string, number>;
}

export const DEFAULT_QUEST_PROGRESS: QuestProgress = {
  bookingId: '',
  checkInDate: '',
  currentTier: 'settle-in',
  completedTiers: [],
  tierCompletedAt: {},
};
```

### Quest tier configuration

Location: `apps/prime/src/config/quests/questTiers.ts`

Quest tiers are static config; only progress is persisted. Badges and XP are
derived from `completedTiers` (not stored separately) to maintain a single
source of truth.

```typescript
export interface QuestTier {
  id: string;
  nameKey: string;                 // i18n key: Quests.tiers.{id}.name
  requiredTasks: string[];         // from completedTasks (see table above)
  unlockCondition?: {
    previousTier?: string;
    hoursAfterCheckIn?: number;    // computed from questProgress.checkInDate
  };
  badge: string;
  xpValue: number;
}

export const QUEST_TIERS: QuestTier[] = [
  {
    id: 'settle-in',
    nameKey: 'Quests.tiers.settle-in.name',
    requiredTasks: ['welcome', 'featuresIntro', 'mainDoorAccess'],
    badge: 'early-bird',
    xpValue: 50,
  },
  {
    id: 'social-night',
    nameKey: 'Quests.tiers.social-night.name',
    requiredTasks: ['complimentaryEveningDrink', 'activityJoined'],
    unlockCondition: { previousTier: 'settle-in' },
    badge: 'social-butterfly',
    xpValue: 100,
  },
  {
    id: 'positano-explorer',
    nameKey: 'Quests.tiers.positano-explorer.name',
    requiredTasks: ['guidebookVisited', 'localSpotVisited'],
    unlockCondition: { previousTier: 'settle-in', hoursAfterCheckIn: 24 },
    badge: 'explorer',
    xpValue: 150,
  },
];

// Derive badges from completed tiers
export function getBadgesFromTiers(completedTiers: string[]): string[] {
  return QUEST_TIERS
    .filter(tier => completedTiers.includes(tier.id))
    .map(tier => tier.badge);
}

// Derive XP from completed tiers
export function getXpFromTiers(completedTiers: string[]): number {
  return QUEST_TIERS
    .filter(tier => completedTiers.includes(tier.id))
    .reduce((sum, tier) => sum + tier.xpValue, 0);
}
```

### Design decisions

1. **Separate Firebase paths** - `guestProfiles/` and `questProgress/` are
   separate from `completedTasks/` to avoid overloading the flat boolean model.

2. **Single source of truth for progress** - `completedTiers` is the canonical
   field. Badges and XP are derived via helper functions, never stored. This
   eliminates drift between related fields.

3. **Per-stay scoping via bookingId** - Both `guestProfiles` and `questProgress`
   include a `bookingId` field. On app load, if `bookingId` doesn't match the
   current booking, the data is considered stale and reset.

4. **checkInDate copied to questProgress** - The check-in date is copied from
   the booking record into `questProgress` when initialized. This makes time-
   based unlock calculations self-contained (no additional async fetch needed).

5. **profileStatus distinguishes complete vs skipped** - Three states:
   - `complete`: User filled in profile fields.
   - `skipped`: User explicitly skipped; defaults applied.
   - `partial`: Profile record exists but onboarding not finished.
   This enables accurate metrics and targeted banner display.

6. **Default profile values** - All profile fields have sensible defaults so
   missing data never breaks the UI.

7. **Consistent identifier** - Use `uuid` (not `occupantId`) throughout to
   match existing app conventions. The `uuid` identifies a specific guest
   within a booking.

---

## Active tasks

### Phase 0 - Foundation

- [x] PRIME-FOUNDATION-01: Define data model types and Firebase hooks
  - Scope:
    - Create `apps/prime/src/types/guestProfile.ts` with `GuestProfile` type,
      `ProfileStatus` type, and `DEFAULT_GUEST_PROFILE` as defined in Data model.
    - Create `apps/prime/src/types/questProgress.ts` with `QuestProgress` type
      and `DEFAULT_QUEST_PROGRESS`.
    - Add `useGuestProfileMutator` hook for writing to `guestProfiles/{uuid}`.
    - Add `useGuestProfile` hook for reading profile with:
      - Default fallback when no data exists.
      - Staleness check: if `profile.bookingId !== currentBookingId`, return
        defaults (stale data from previous stay).
    - Add `useQuestProgress` hook for reading quest state with same staleness
      check logic.
  - Dependencies:
    - Prime port work complete.
  - Definition of done:
    - Types are exported and importable.
    - Hooks can read/write to Firebase without errors.
    - Missing or stale data returns defaults (never `undefined`).
    - Staleness check uses `bookingId` from occupant data.

- [x] PRIME-FOUNDATION-02: Existing occupant migration and staleness handling
  - Scope:
    - Occupants without `guestProfiles/` data OR with stale `bookingId` see
      a lightweight "Complete your profile" banner on home.
    - Banner display logic: show if `profileStatus !== 'complete'` OR if
      `profile.bookingId !== currentBookingId`.
    - Banner links to `/account/profile` or inline editor.
    - Quest progress starts at `settle-in` with tasks already in
      `completedTasks` pre-credited.
    - Add helper `initializeQuestProgressFromCompletedTasks()` to bootstrap
      quest state for existing/returning occupants.
    - Helper copies `checkInDate` from booking data into quest progress.
  - Dependencies:
    - PRIME-FOUNDATION-01.
  - Definition of done:
    - Existing occupants can use home without errors.
    - Quest card shows correct progress based on existing completions.
    - Profile banner appears when profile is incomplete OR stale.
    - Returning guests get fresh quest progress for new booking.

- [x] PRIME-FOUNDATION-03: Quest tier config module
  - Scope:
    - Create `apps/prime/src/config/quests/questTiers.ts` with tier
      definitions as specified in the Data model section.
    - Export `QUEST_TIERS` array, `QuestTier` interface.
    - Export `getBadgesFromTiers()` and `getXpFromTiers()` helper functions.
    - Add seasonal tier override support via optional env var or config flag
      (e.g., `PRIME_QUEST_CONFIG_OVERRIDE`).
  - Dependencies:
    - PRIME-FOUNDATION-01.
  - Definition of done:
    - Quest tiers are importable and type-safe.
    - Badge/XP derivation uses helper functions (no separate storage).
    - Tier config can be swapped for seasonal variations.

- [x] PRIME-FOUNDATION-04: New completedTasks triggers
  - Scope:
    - Add `activityJoined` completion trigger in activity chat component.
      Set when user first opens an activity chat channel.
    - Add `guidebookVisited` completion trigger in `/positano-guide` page.
      Set on first page view.
    - Add `localSpotVisited` completion trigger in guidebook recommendation
      component. Set when user taps a recommendation link.
    - Add `profileOnboardingComplete` completion trigger in onboarding flow.
      Set after profile step (whether completed or skipped).
    - Use existing `useCompletedTaskMutator` hook for all triggers.
  - Dependencies:
    - PRIME-FOUNDATION-01.
  - Definition of done:
    - All new task keys fire correctly.
    - Triggers are idempotent (setting twice doesn't cause errors).
    - Quest tiers that depend on these keys become completable.

### Phase 1 - Onboarding and intent

Design note: New onboarding steps are designed with skip logic from the start.
All profile fields are optional; defaults are applied when skipped. The
`profileStatus` field distinguishes complete vs skipped for metrics.

- [x] PRIME-ONBOARD-01: Add guest intent + social profile step
  - Scope:
    - Add a new onboarding step in `apps/prime/src/components/onboarding`
      to capture guest intent (social vibe, interests, stay goals, pace).
    - Persist fields to `guestProfiles/{uuid}` via `useGuestProfileMutator`.
    - Include `bookingId` from current booking in the profile record.
    - On complete: set `profileStatus: 'complete'`.
    - On skip: set `profileStatus: 'skipped'` and apply `DEFAULT_GUEST_PROFILE`.
    - Provide i18n keys under the `Onboarding` namespace.
  - Dependencies:
    - PRIME-FOUNDATION-01.
  - Definition of done:
    - Profile data is stored in Firebase and available to the home feed.
    - `profileStatus` correctly reflects complete vs skipped.
    - Skipping creates a valid profile record with defaults.
    - `bookingId` is saved for staleness detection.

- [x] PRIME-ONBOARD-02: Social opt-in and activity discovery in onboarding
  - Scope:
    - Add a step that invites guests to opt into hostel activities/chat
      with clear privacy copy.
    - Persist `socialOptIn` and `chatOptIn` to guest profile.
    - Surface upcoming activities immediately after opt-in (if any exist).
    - When no activities exist, show Positano guidebook CTA instead.
    - Include "Skip" option that sets `socialOptIn: false` and proceeds.
  - Dependencies:
    - PRIME-ONBOARD-01.
  - Definition of done:
    - Guests encounter activities or guidebook before reaching home.
    - Empty-state shows guidebook CTA, not blank space.
    - Skipping does not block onboarding.

- [x] PRIME-ONBOARD-03: Welcome handoff screen
  - Scope:
    - Show a short "Tonight in Positano" handoff summary after onboarding.
    - Content personalized by `guestProfile.intent` when available.
    - Provide an "Edit profile later" link to `/account/profile`.
    - Mark `profileOnboardingComplete` in `completedTasks`.
    - Initialize `questProgress` with current `bookingId` and `checkInDate`.
  - Dependencies:
    - PRIME-ONBOARD-01, PRIME-ONBOARD-02, PRIME-FOUNDATION-04.
  - Definition of done:
    - Guests see a one-time welcome handoff before home.
    - Handoff adapts content based on intent (social vs quiet).
    - Quest progress is initialized for the current stay.

### Phase 2 - Quest engine

- [x] PRIME-QUEST-01: Quest state computation helper
  - Scope:
    - Create `apps/prime/src/lib/quests/computeQuestState.ts` as a pure
      function (no async, no hooks).
    - Input: `completedTasks`, `guestProfile`, `questProgress`, `checkInTime`.
    - Output: `{ currentTier, progress, nextAction, availableTiers, totalXp }`.
    - Apply unlock conditions (previous tier, hours after check-in).
    - Handle edge cases: missing data returns safe defaults.
  - Dependencies:
    - PRIME-FOUNDATION-01, PRIME-FOUNDATION-03.
  - Definition of done:
    - Pure function computes quest state deterministically.
    - Returns valid state even with empty/partial input data.

- [x] PRIME-QUEST-02: Quest state computation tests
  - Scope:
    - Add unit tests in `apps/prime/src/lib/quests/__tests__/` for:
      - Tier unlock rules (previous tier requirement).
      - Time-based unlock (hours after check-in).
      - Progress percentage calculation.
      - XP computation from badges.
      - Edge cases (no completions, all completions, missing profile).
  - Dependencies:
    - PRIME-QUEST-01.
  - Definition of done:
    - Quest logic has >90% branch coverage.
    - Tests document expected behavior for all tier transitions.

- [x] PRIME-QUEST-03: Quest state hook
  - Scope:
    - Create `useComputedQuestState` hook that:
      - Fetches `completedTasks`, `guestProfile`, `questProgress` via
        existing hooks.
      - Calls `computeQuestState()` with fetched data.
      - Returns computed state with loading/error states.
    - Hook layer handles async; pure function handles computation.
  - Dependencies:
    - PRIME-QUEST-01, PRIME-QUEST-02.
  - Definition of done:
    - Hook is usable in home components.
    - Loading state shown while data fetches.

### Phase 3 - Home experience

Design note: Augment (don't replace) the existing DoList. Preserve working
completion logic and reposition it as "Tools" section.

- [x] PRIME-HOME-01: Augment home with quest and social cards
  - Scope:
    - Add above existing DoList:
      - Current quest card (next objective + progress bar).
      - Social highlights card (tonight's activity or group chat CTA).
      - Positano tip of the day (from guidebook content).
    - Reposition existing DoList with heading "Your Tools".
    - Keep existing `ServicesList` unchanged.
    - When no activities exist, social card shows guidebook CTA instead.
  - Dependencies:
    - PRIME-QUEST-03, PRIME-ONBOARD-02.
  - Definition of done:
    - Home reads as guided experience with quest at top.
    - Existing DoList functionality preserved.
    - Empty activity state handled gracefully.
  - **Status (2026-01-15):** COMPLETE
    - Created integrated `HomePage.tsx` at `apps/prime/src/components/homepage/HomePage.tsx`
    - Integrated `QuestCard`, `SocialHighlightsCard`, `DoList`, and `ServicesList`
    - ServicesList section header changed to "Your Tools" via i18n key `ourServices`
    - Empty activity state shows guidebook CTA in `SocialHighlightsCard`

- [x] PRIME-HOME-02: Personalized home ordering
  - Scope:
    - Adjust card ordering based on `guestProfile.intent`:
      - `social`: Social highlights first, then quest, then tools.
      - `quiet`: Quest first, Positano tip, then tools (social de-emphasized).
      - `mixed` (default): Quest first, social second, then tools.
    - Apply safe defaults when profile missing (use `mixed` ordering).
    - Adjust microcopy variants via i18n keys with intent suffix.
  - Dependencies:
    - PRIME-ONBOARD-01, PRIME-HOME-01.
  - Definition of done:
    - Home content order changes by intent without errors.
    - Missing profile data uses default ordering.
  - **Status (2026-01-15):** COMPLETE
    - Implemented `getSectionOrder()` function that returns ordered sections by intent
    - Social-first for `social`, quest-first-social-last for `quiet`, balanced for `mixed`
    - Defaults to `mixed` when profile is missing
    - Added `Homepage.json` i18n translations

### Phase 4 - Social surface

- [x] PRIME-SOCIAL-01: Activities surfaced in main navigation and home
  - Scope:
    - Update `apps/prime/src/components/header/HamburgerMenu.tsx`
      to place activities near the top of navigation for non-admins.
    - Add a compact activities preview component on the home screen.
    - When no activities exist, show "Explore Positano" link to guidebook.
  - Dependencies:
    - PRIME-ONBOARD-02, PRIME-HOME-01.
  - Definition of done:
    - Activities are discoverable without opening the hamburger menu.
    - Empty state gracefully falls back to guidebook CTA.
  - **Status (2026-01-15):** COMPLETE
    - Note: HamburgerMenu doesn't exist in apps/prime (was in standalone ~/prime repo)
    - `SocialHighlightsCard` already shows activities preview on home (from PRIME-HOME-01)
    - Created activities listing page at `apps/prime/src/app/(guarded)/activities/page.tsx`
    - Activities are discoverable from home via "See All" button in SocialHighlightsCard
    - Empty state shows guidebook CTA in both SocialHighlightsCard and activities page
    - Added `Activities.json` i18n translations

- [x] PRIME-SOCIAL-02: Activity quick actions on home
  - Scope:
    - Add one-tap CTA links (Join chat / See details) to the home preview.
    - Tailor microcopy using guest intent when available.
    - For `quiet` intent, use softer CTA language ("See what's happening").
  - Dependencies:
    - PRIME-SOCIAL-01.
  - Definition of done:
    - Guests reach an activity chat in one tap from home.
    - CTA language adapts to guest intent.
  - **Status (2026-01-15):** COMPLETE
    - Added `intent` prop to `SocialHighlightsCard`
    - `quiet` intent uses softer CTAs: "See what's happening" and "Browse"
    - `quiet` intent uses `Eye` icon instead of `MessageCircle`
    - `social` and `mixed` intents use default enthusiastic CTAs
    - Added new i18n keys: `social.seeWhatsHappening`, `social.browse`

### Phase 5 - Local content

- [x] PRIME-LOCAL-01: Positano guidebook surface
  - Scope:
    - Create a lightweight guide route at `/positano-guide` with
      curated recommendations and social prompts.
    - Use i18n namespace `PositanoGuide` for content (not separate JSON).
    - Structure content by time of day (morning, afternoon, evening).
    - Mark `guidebookVisited` in `completedTasks` on first view.
  - Dependencies:
    - PRIME-HOME-01.
  - Definition of done:
    - Guests can reach Positano guide from home screen.
    - Content is translatable via i18n.
    - Visit is tracked for quest progress.

- [x] PRIME-LOCAL-02: Guidebook content seeding
  - Scope:
    - Add initial content to `apps/prime/public/locales/en/PositanoGuide.json`:
      - 3-5 morning recommendations (breakfast spots, sunrise views).
      - 3-5 afternoon recommendations (beaches, hikes, cafes).
      - 3-5 evening recommendations (aperitivo, dinner, nightlife).
    - Include social prompts where relevant ("Popular with other guests").
  - Dependencies:
    - PRIME-LOCAL-01.
  - Definition of done:
    - English guidebook content is complete and renders correctly.

### Phase 6 - Rewards and celebration

- [x] PRIME-REWARD-01: Badge display on quest completion
  - Scope:
    - Display earned badges on tier completion screens.
    - Show badge collection on home (compact view) and account page.
    - Add a small celebration animation on tier completion (confetti or
      similar, using CSS only - no external libs).
  - Dependencies:
    - PRIME-QUEST-03.
  - Definition of done:
    - Badges appear on completion without affecting task logic.
    - Celebration moment is visible but not disruptive.
  - **Status (2026-01-15):** COMPLETE
    - `TierCompletionModal` exists with badge display and CSS confetti animation
    - `QuestCard` shows badges earned (compact view on home)
    - CSS-only animations: confetti-fall, bounce-in, pulse-slow
    - Added missing `completion.*` i18n keys to Quests.json

- [x] PRIME-REWARD-02: XP display and progress
  - Scope:
    - Compute total XP from badges using `computeQuestState()`.
    - Display XP total on home quest card and account page.
    - Show XP earned on tier completion screen.
  - Dependencies:
    - PRIME-REWARD-01.
  - Definition of done:
    - XP is computed (not stored) and displayed correctly.
    - XP updates immediately when badges are earned.
  - **Status (2026-01-15):** COMPLETE
    - `QuestCard` displays `questState.totalXp` in header
    - `TierCompletionModal` shows `+{tier.xpValue} XP` on completion
    - XP computed via `useComputedQuestState()` hook
    - Added `tasks.*` i18n keys for quest task names

### Phase 7 - Copy and quality

- [x] PRIME-I18N-01: Copy expansion for new surfaces
  - Scope:
    - Add i18n keys to `Onboarding` namespace for new steps.
    - Add i18n keys to `Homepage` namespace for quest/social cards.
    - Add `Quests` namespace for tier names, badge names, XP labels.
    - Add `PositanoGuide` namespace for guidebook content.
    - Provide intent-driven copy variants where applicable
      (e.g., `homepage.social.cta.social`, `homepage.social.cta.quiet`).
  - Dependencies:
    - PRIME-ONBOARD-01, PRIME-QUEST-01, PRIME-LOCAL-01, PRIME-REWARD-01.
  - Definition of done:
    - All new UI surfaces render without missing translation keys.
    - Intent-driven variants are in place for key copy.
  - **Status (2026-01-15):** COMPLETE
    - `Homepage.json`: doList, services, social (with intent variants), profileBanner
    - `Quests.json`: tiers, badges, labels, completion, tasks
    - `PositanoGuide.json`: exists with content
    - `Activities.json`: title, status, sections, actions, empty states
    - Intent-driven variants: `social.seeWhatsHappening`, `social.browse` for quiet intent

- [ ] PRIME-QUALITY-01: Regression coverage for onboarding + quests
  - Scope:
    - Add/extend tests for onboarding flow changes.
    - Quest logic tests covered in PRIME-QUEST-02.
    - Add integration test for home quest card rendering with mocked data.
    - Add integration test for empty activity state fallback.
  - Dependencies:
    - PRIME-QUEST-02, PRIME-HOME-01.
  - Definition of done:
    - Scoped tests pass for onboarding and home surfaces.
    - Empty state handling is verified.

## Notes and implementation hints

### Key file locations

- Home entrypoint: `apps/prime/src/components/homepage/HomePage.tsx`
- Task/service configuration:
  - `apps/prime/src/config/homepage/tasksConfig.ts`
  - `apps/prime/src/config/homepage/servicesConfig.ts`
- Onboarding flow:
  - `apps/prime/src/components/onboarding/UserDataGuard.tsx`
  - `apps/prime/src/components/onboarding/OnboardingLayout.tsx`
- Activities surface:
  - `apps/prime/src/components/upcomingActivities`
  - `apps/prime/src/components/header/HamburgerMenu.tsx`
- Completed task updates:
  - `apps/prime/src/hooks/mutator/useCompletedTaskMutator.ts`
  - `apps/prime/src/types/completedTasks.ts`
- i18n resources:
  - `apps/prime/public/locales`
  - `apps/prime/src/i18n.ts`

### New file locations (to be created)

- Guest profile types: `apps/prime/src/types/guestProfile.ts`
- Quest progress types: `apps/prime/src/types/questProgress.ts`
- Quest tier config: `apps/prime/src/config/quests/questTiers.ts`
- Quest state helper: `apps/prime/src/lib/quests/computeQuestState.ts`
- Quest state hook: `apps/prime/src/hooks/useComputedQuestState.ts`
- Guest profile hooks: `apps/prime/src/hooks/mutator/useGuestProfileMutator.ts`
- Positano guide i18n: `apps/prime/public/locales/en/PositanoGuide.json`

### Architectural patterns to follow

1. **Pure functions for computation** - Keep business logic in pure functions
   (e.g., `computeQuestState`). Hooks handle async data fetching only.

2. **Default values everywhere** - Every new data type must have a default.
   UI should never receive `undefined` for new fields.

3. **i18n for all content** - Use existing i18n namespaces. Add new namespaces
   (`Quests`, `PositanoGuide`) rather than separate JSON files.

4. **Preserve existing code** - Augment `HomePage` rather than rewriting.
   The existing `DoList` and `ServicesList` work correctly.

---

## Risks and open questions

### Addressed risks

- **Onboarding friction** - Mitigated by designing skip logic from the start
  (Phase 1 design note). All new steps are skippable with defaults applied.

- **Empty activity state** - Handled throughout plan: onboarding, home, and
  social surfaces all fall back to guidebook CTA when no activities exist.

- **Existing occupant migration** - PRIME-FOUNDATION-02 handles this explicitly.
  Existing occupants see profile banner, not re-run of onboarding.

- **Quest tier seasonality** - PRIME-FOUNDATION-03 includes config override
  support for seasonal variations.

- **Per-stay scoping** - Both `guestProfiles` and `questProgress` include
  `bookingId`. Hooks check for staleness and return defaults when bookingId
  doesn't match current stay. (PRIME-FOUNDATION-01, PRIME-FOUNDATION-02)

- **checkInDate source** - Copied from `bookings/{bookingId}/checkInDate`
  into `questProgress` during initialization. Time-based unlock logic uses
  this local copy, avoiding additional async fetches. (PRIME-ONBOARD-03)

- **Profile completion vs skip detection** - `profileStatus` field with three
  states (`complete`, `skipped`, `partial`) enables accurate metrics and
  targeted banner display. (Design decision #5)

- **Missing completedTasks keys** - PRIME-FOUNDATION-04 explicitly adds
  triggers for `activityJoined`, `guidebookVisited`, `localSpotVisited`,
  and `profileOnboardingComplete`. Quest tiers depend on these.

- **Single source of truth for progress** - Badges and XP are derived from
  `completedTiers` via helper functions, not stored separately. This prevents
  drift between related fields. (Design decision #2)

### Resolved questions

1. **Quest reset timing** - Resolved via `bookingId` staleness check. On app
   load, if `questProgress.bookingId !== currentBookingId`, the hooks return
   defaults. Fresh progress is initialized in PRIME-ONBOARD-03.

2. **Identifier consistency** - Resolved: use `uuid` throughout (not
   `occupantId`) to match existing app conventions.

3. **i18n pattern** - Resolved: use `Quests.tiers.{id}.name` pattern with
   `Quests` namespace. Guidebook content uses `PositanoGuide` namespace
   (loaded via standard i18next, stored in `public/locales/en/PositanoGuide.json`).

### Remaining open questions

1. **Gamification opt-out** - Can guests disable quests/badges entirely?
   - Current plan: No explicit opt-out; quests are informational, not blocking.
   - If needed: Add `gamificationOptOut` to `guestProfile`.

2. **Badge persistence across stays** - Should returning guests keep badges?
   - Current plan: Quest progress resets; badge history retained (future).
   - Implementation: Store `lifetimeBadges` separately from `questProgress`.

3. **Activity loading limits** - `ChatProvider` caps at 20 activities.
   - Sufficient for most cases; revisit if activity volume increases.
   - Consider: Add "See all activities" link if count exceeds threshold.

---

## Changelog

- **2026-01-15**: Plan audit - marked implemented tasks as complete:
  - PRIME-QUEST-01, PRIME-QUEST-02, PRIME-QUEST-03: Quest engine implemented
    (`computeQuestState.ts` + tests + `useComputedQuestState.ts` hook)
  - PRIME-LOCAL-01, PRIME-LOCAL-02: Positano guidebook implemented
    (`PositanoGuide.tsx` + `PositanoGuide.json` content)
  - Note: Phase 3-4 components (QuestCard, SocialHighlightsCard) exist but
    are not yet integrated into the actual home page.
- **2026-01-13**: Completed Phase 0 (Foundation) and Phase 1 (Onboarding).
  - PRIME-FOUNDATION-01: Created `guestProfile.ts`, `questProgress.ts` types,
    `useGuestProfileMutator`, `useFetchGuestProfile`, `useFetchQuestProgress`,
    `useQuestProgressMutator` hooks.
  - PRIME-FOUNDATION-02: Created `initializeQuestProgress.ts`,
    `ProfileCompletionBanner.tsx`, `useGuestProgressData.ts` orchestrator.
  - PRIME-FOUNDATION-03: Created `questTiers.ts` with tier config and helpers.
  - PRIME-FOUNDATION-04: Added `activityJoined` trigger in `ChatScreen.tsx`.
  - PRIME-ONBOARD-01: Created `GuestProfileStep.tsx` (step 5 of 7).
  - PRIME-ONBOARD-02: Created `SocialOptInStep.tsx` (step 6 of 7).
  - PRIME-ONBOARD-03: Created `WelcomeHandoffStep.tsx` (step 7 of 7).
  - Updated `UserDataGuard.tsx` to integrate new onboarding steps.
  - Added i18n keys to `Onboarding.json` and created `Quests.json`.
- **2026-01-13**: Initial plan created.
- **2026-01-13**: Added Phase 0 (Foundation) for data model and migration.
  Added Data model section with Firebase paths and TypeScript types.
  Revised Phase 2-7 tasks with clearer scope and dependencies.
  Added empty state handling throughout. Clarified "augment vs replace"
  for home experience. Added open questions section.
- **2026-01-13**: Addressed review feedback:
  - Added `bookingId` to both `guestProfiles` and `questProgress` for per-stay
    scoping. Hooks now detect stale data from previous stays.
  - Added `checkInDate` to `questProgress` (copied from booking on init) for
    self-contained time-based unlock calculations.
  - Added `profileStatus` field (`complete`/`skipped`/`partial`) to distinguish
    completion vs skip for metrics and banner display.
  - Added PRIME-FOUNDATION-04 task for new completedTasks triggers
    (`activityJoined`, `guidebookVisited`, `localSpotVisited`,
    `profileOnboardingComplete`).
  - Added "New completedTasks keys" table documenting existing vs new keys.
  - Changed badges from stored field to derived value via `getBadgesFromTiers()`.
  - Simplified success metrics to avoid needing timestamp event log.
  - Added Terminology section clarifying `uuid` vs `bookingId` vs `checkInDate`.
  - Standardized on `uuid` (not `occupantId`) throughout.
  - Clarified i18n namespace pattern (`Quests.tiers.{id}.name`).
  - Moved resolved questions to new "Resolved questions" section.
