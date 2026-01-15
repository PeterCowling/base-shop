# Prime Guest Portal

A guest-centric mobile web application for Hostel Brikette (Positano, Italy). Prime serves as a comprehensive guest services portal that guides guests through their stay with an engaging quest system, social features, local experiences, and practical tools.

## Quick Start

```bash
# Development
pnpm --filter @apps/prime dev     # Port 3015

# Build
pnpm --filter @apps/prime build   # Static export

# Type checking
pnpm --filter @apps/prime typecheck
```

## Overview

| Property | Value |
|----------|-------|
| Framework | Next.js 15, React 19, TypeScript |
| Data Backend | Firebase Realtime Database |
| Deployment | Cloudflare Pages (static export) |
| Dev Port | 3015 |

## Core Features

### 1. Quest System (Gamification)

Guides guests through their stay with a 3-tier progression:

| Tier | Name | Tasks | Badge | XP |
|------|------|-------|-------|-----|
| 1 | Settle In | Welcome, Features intro, Door access | Early Bird | 50 |
| 2 | Social Night | Evening drink, Activity joined | Social Butterfly | 100 |
| 3 | Positano Explorer | Guidebook, Local spot visited | Explorer | 150 |

**Architecture:** Pure computation in `lib/quests/computeQuestState.ts`

### 2. Guest Personalization

- **Intent-based home screen** ordering (social, quiet, mixed)
- **Profile completion** tracking
- **Social opt-in** controls for activities and chat
- **Per-stay scoping** via `bookingId`

### 3. Guest Services

- Bar Menu & Breakfast Menu
- Main Door Access (check-in code)
- Booking Details
- Bag Storage
- Activities & Chat
- Complimentary Perks (drinks, breakfast)
- Overnight Issues reporting
- Digital Assistant

### 4. Local Experiences

- Positano Guide with curated recommendations
- Route Planning from 9+ origin locations
- Beach Guides (Laurito, Arienzo, Fornillo, etc.)
- Pre-arrival transportation options

### 5. Social Features

- Group chat for hostel guests
- Per-activity chat channels
- Real-time messaging via Firebase
- Privacy-respecting opt-in controls

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (guarded)/         # Protected routes (auth-required)
│   ├── find-my-stay/      # Guest lookup (public)
│   ├── checkin/           # Check-in flow
│   ├── admin/             # Admin pages
│   └── api/               # Server-side API routes
├── components/             # React components
│   ├── onboarding/        # Profile & intent setup
│   ├── quests/            # Badge, tier, progression UI
│   ├── homepage/          # Main dashboard cards
│   ├── chat/              # Messaging UI
│   └── pre-arrival/       # Route planning
├── hooks/                  # Custom React hooks
│   ├── pureData/          # Firebase data fetching
│   ├── mutator/           # Firebase mutations
│   └── dataOrchestrator/  # Data orchestration
├── lib/
│   ├── quests/            # Quest computation
│   └── messaging/         # Chat utilities
├── contexts/
│   ├── messaging/         # PinAuthProvider
│   └── ChatProvider.tsx   # Messaging context
├── types/                  # TypeScript interfaces
├── config/
│   └── quests/            # Quest tier definitions
└── data/
    └── routes.ts          # Transportation routes
```

## Data Model (Firebase)

```
firebase/
├── bookings/{ref}/occupants/{uuid}  → BookingOccupantData
├── guestProfiles/{uuid}             → GuestProfile
├── questProgress/{uuid}             → QuestProgress
├── messages/                        → Chat messages
└── activities/instances/            → Live activities
```

## Key Patterns

### Data Fetching

- **pureData/** hooks: Direct Firebase queries
- **mutator/** hooks: Write operations
- **dataOrchestrator/** hooks: Combined data sources
- **\*.server.ts** hooks: Server-side Firebase operations

### Quest Logic

Single source of truth: `completedTiers` array in Firebase.
Derived values (badges, XP) computed on-the-fly.

### Intent-Based Personalization

`guestProfile.intent` drives home screen ordering:
- `social`: Activities first
- `quiet`: Quest first, social de-emphasized
- `mixed`: Quest → Social → Tools

### i18n Strategy

Core namespaces loaded immediately (Header, Homepage).
Route-based lazy loading for feature-specific translations.

## Performance

Optimizations completed (see `OPTIMIZATION-SUMMARY.md`):

| Metric | Result |
|--------|--------|
| Bundle Size | 700KB (-61%) |
| Initial Load | 1.8s (-57%) |
| Firebase Reads | 15/min (-85%) |

## Environment Variables

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

## Related Documentation

- [FIREBASE.md](./FIREBASE.md) - Firebase setup and security rules
- [FIREBASE-METRICS.md](./FIREBASE-METRICS.md) - Performance tracking
- [I18N-OPTIMIZATION.md](./I18N-OPTIMIZATION.md) - Lazy loading
- [GUEST-EXPERIENCE.md](./GUEST-EXPERIENCE.md) - Quest system
- [OPTIMIZATION-SUMMARY.md](./OPTIMIZATION-SUMMARY.md) - Performance overview

## Integration Points

- **Brikette App**: Links to guides and route content
- **Firebase**: All guest data persistence
- **Cloudflare Pages**: Static deployment

---

Part of the base-shop monorepo. See root [CLAUDE.md](../../CLAUDE.md) for development guidelines.
