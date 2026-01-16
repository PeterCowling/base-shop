# Prime Guest Experience

This document describes the guest journey, quest system, and personalization features implemented in Prime.

## Overview

Prime provides a guided, social guest journey that helps guests meet each other, discover Positano, and feel progress during their stay.

### Experience Pillars

- Make the next step obvious and low effort
- Social by default, privacy-respecting by choice
- Local flavor first: Positano cues in every step
- Progress is earned, not forced

## Data Model

### Firebase Paths

```
guestProfiles/{uuid}/
  bookingId: string            # links profile to specific stay
  profileStatus: 'complete' | 'skipped' | 'partial'
  intent: 'social' | 'quiet' | 'mixed'
  interests: string[]
  stayGoals: string[]
  pace: 'relaxed' | 'active'
  socialOptIn: boolean
  chatOptIn: boolean
  createdAt: number
  updatedAt: number

questProgress/{uuid}/
  bookingId: string
  checkInDate: string          # ISO date, copied from booking
  currentTier: string
  completedTiers: string[]
  tierCompletedAt: Record<string, number>
```

### Key Types

- `apps/prime/src/types/guestProfile.ts` - GuestProfile, ProfileStatus, GuestIntent
- `apps/prime/src/types/questProgress.ts` - QuestProgress, DEFAULT_QUEST_PROGRESS
- `apps/prime/src/config/quests/questTiers.ts` - QUEST_TIERS, QuestTier

## Quest System

### Quest Tiers

| Tier | Required Tasks | Badge | XP |
|------|----------------|-------|-----|
| settle-in | welcome, featuresIntro, mainDoorAccess | early-bird | 50 |
| social-night | complimentaryEveningDrink, activityJoined | social-butterfly | 100 |
| positano-explorer | guidebookVisited, localSpotVisited | explorer | 150 |

### Design Decisions

1. **Single source of truth** - `completedTiers` is canonical; badges and XP are derived via helper functions (`getBadgesFromTiers`, `getXpFromTiers`), never stored separately.

2. **Per-stay scoping** - Both `guestProfiles` and `questProgress` include `bookingId`. Hooks detect stale data and reset for new stays.

3. **Pure computation** - Quest logic lives in `computeQuestState.ts` as a pure function. Hooks handle async data fetching only.

## Personalization

### Guest Intent

Home content order adapts to `guestProfile.intent`:

- **social**: Social highlights first, then quest, then tools
- **quiet**: Quest first, Positano tip, then tools (social de-emphasized)
- **mixed** (default): Quest first, social second, then tools

### Profile Status

Three states distinguish completion for metrics and banner display:
- `complete`: User filled in profile fields
- `skipped`: User explicitly skipped; defaults applied
- `partial`: Profile record exists but onboarding not finished

## Key Files

### Hooks
- `apps/prime/src/hooks/useComputedQuestState.ts`
- `apps/prime/src/hooks/mutator/useGuestProfileMutator.ts`
- `apps/prime/src/hooks/useFetchGuestProfile.ts`
- `apps/prime/src/hooks/useFetchQuestProgress.ts`

### Components
- `apps/prime/src/components/homepage/QuestCard.tsx`
- `apps/prime/src/components/homepage/SocialHighlightsCard.tsx`
- `apps/prime/src/components/homepage/ProfileCompletionBanner.tsx`
- `apps/prime/src/components/quests/BadgeCollection.tsx`
- `apps/prime/src/components/quests/TierCompletionModal.tsx`
- `apps/prime/src/components/onboarding/GuestProfileStep.tsx`
- `apps/prime/src/components/onboarding/SocialOptInStep.tsx`
- `apps/prime/src/components/onboarding/WelcomeHandoffStep.tsx`

### Configuration
- `apps/prime/src/config/quests/questTiers.ts`
- `apps/prime/src/lib/quests/computeQuestState.ts`

### i18n Namespaces
- `Onboarding` - Onboarding step copy
- `Homepage` - Quest/social card copy with intent variants
- `Quests` - Tier names, badge names, XP labels
- `PositanoGuide` - Guidebook content

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Onboarding completion rate | > 80% | `profileStatus === 'complete'` / total |
| Quest tier 1 completion | > 30% | `'settle-in' in completedTiers` / total |
| Guidebook visit rate | > 25% | `guidebookVisited === 'true'` / total |
