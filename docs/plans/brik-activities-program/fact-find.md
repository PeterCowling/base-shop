---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: BRIK / Guest Experience
Workstream: Mixed (Product, Marketing, Ops)
Created: 2026-02-14
Last-updated: 2026-02-14
Feature-Slug: brik-activities-program
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-channels, /lp-seo
Related-Plan: docs/plans/brik-activities-program/plan.md
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID:
---

# BRIK Activities Program (Prime + Brikette + Social + Recruiting) - Fact-Find Brief

## Scope

### Summary
"Activities" are a core hostel requirement: activities are undertaken *with* the hostel (hostel-led events, staff-led outings, and structured social moments).

Related but distinct: "Experiences" are things guests do without the hostel (self-guided/local things-to-do). Brikette already has an Experiences page today, but the current copy mixes both concepts.

This brief scopes how to make activities a first-class product layer across:
- Prime guest portal (in-stay schedule + attendance + activity chat)
- Brikette marketing site (sell the social/experience promise)
- Social media (ongoing promotion)
- Recruiting via Brikette site (seasonal + work-exchange candidates)

### Goals
- Prime: guests can reliably discover what is happening, join, and coordinate with other guests.
- Prime: staff can create and maintain an activities schedule without editing Firebase by hand.
- Brikette site: hostel-led activities are visible and compelling (without overclaiming); experiences remain available as self-guided things-to-do.
- Recruiting: Brikette careers flow attracts strong seasonal/work-exchange candidates for experience-led roles.
- Measurement: define a light but real loop (activity attendance + applicant pipeline + booking signal).

### Non-goals
- Building a full payments/booking system for third-party tours in Release 1.
- Publicly promising daily events if operations cannot sustain them.
- Full multi-locale rewriting in Release 1 (start with EN; align other locales after).

### Constraints & Assumptions
- Constraints:
  - No fabricated proof or overclaims: marketing copy must match operational reality.
  - Brikette is a static-export marketing site (Next.js export).
  - Prime guest portal is mobile-first and already contains activity surfaces.
- Assumptions:
  - We can commit to a small "always-on" baseline schedule: 3 recurring weekly anchor activities, then scale from there.

## Evidence Audit (Current State)

### Entry Points

Prime (guest-facing):
- Home surfacing: `apps/prime/src/components/homepage/SocialHighlightsCard.tsx` (shows next upcoming activity; otherwise guidebook CTA).
- Activities list + attendance: `apps/prime/src/app/(guarded)/activities/ActivitiesClient.tsx`.
- Activity chat channel: `apps/prime/src/app/(guarded)/chat/channel/page.tsx` (presence-gated composer).
- Messaging/activity data subscription: `apps/prime/src/contexts/messaging/ChatProvider.tsx`.
- Activity data types: `apps/prime/src/types/messenger/activity.ts`.

Brikette (marketing):
- Experiences index: `apps/brikette/src/app/[lang]/experiences/page.tsx` and `apps/brikette/src/locales/en/experiencesPage.json`.
  - Note: `experiencesPage.json` currently includes hostel-led items (terrace bar nights, staff-led walks) mixed with self-guided content.
- Home page copy: `apps/brikette/src/locales/en/landingPage.json` (currently sells concierge + terrace; "Activities" appears only in Facilities modal as "Hiking (Off-site)").
- Experiences hosts / team story: `apps/brikette/src/locales/en/pages.json` ("host sunset events, lead hikes").

Recruiting:
- Careers page route: `apps/brikette/src/app/[lang]/careers/page.tsx`.
- Careers page copy: `apps/brikette/src/locales/en/careersPage.json`.
  - Notable tension: currently excludes volunteers under 3 months (`notGoodFitList`) while the request is to recruit work-exchange/workawayer candidates.
  - Discoverability issue: careers is not linked from the public site navigation today.
    - Header nav excludes careers: `packages/ui/src/config/navItems.ts`
    - Footer nav groups exclude careers: `apps/brikette/src/components/footer/Footer.tsx`
- Work exchange informational guide (traveler-facing): `apps/brikette/src/locales/en/guides/content/workExchangeItaly.json`.

### Key Modules / Files

Prime activities system:
- `apps/prime/src/types/messenger/activity.ts`:
  - `ActivityTemplate` and `ActivityInstance`.
- `apps/prime/src/contexts/messaging/ChatProvider.tsx`:
  - Reads activities from `messaging/activities/instances`.
  - Posts initial system messages from `messaging/activities/templates/{templateId}/initialMessages` when an instance transitions to `status=live`.
  - Reads/writes channel messages at `messaging/channels/{channelId}/messages`.
- `apps/prime/src/app/(guarded)/activities/ActivitiesClient.tsx`:
  - Presence writes: `messaging/activities/presence/{activityId}/{uuid}`.
  - Lifecycle derived from `startTime` and a fixed 2-hour duration.
- `apps/prime/database.rules.json`:
  - `messaging` subtree currently has auth-gated reads/writes but no role-based write restrictions under `messaging/activities/*`.

Prime staff auth building blocks (relevant if we add schedule-management UI):
- Staff PIN -> custom token endpoint: `apps/prime/functions/api/staff-auth-session.ts`.
- Client PIN auth provider: `apps/prime/src/contexts/messaging/PinAuthProvider.tsx`.
- Production kill-switch for staff/owner tools: `apps/prime/src/lib/security/staffOwnerGate.ts`.

Brikette marketing primitives:
- Brand language guidance: `docs/business-os/strategy/BRIK/brand-language.user.md` currently says to use "Experiences" not "Activities".
  - This is now inconsistent with the clarified taxonomy (experiences = self-guided; activities = hostel-led) and should be updated as part of the work.

Related plans:
- Prime guest portal social/activity foundations are documented in the archived plan: `docs/plans/archive/prime-guest-portal-gap-plan.md`.

### Patterns & Conventions Observed
- Prime already treats activities as a first-class guest UX module (home card + list + chat).
- Prime is missing a first-class schedule authoring workflow (templates + instances) in repo.
- Brikette marketing copy uses an "Experiences" framing and already has an Experiences page, but it currently mixes hostel-led and self-guided items.
- Brikette home page does not strongly foreground hostel-led activities relative to concierge/terrace.

### Data & Contracts

Current (implied) Firebase RTDB contract used by Prime:
- `messaging/activities/templates/{templateId}`:
  - `title`, `description?`, `meetUpPoint?`, `meetUpTime?`, `price?`, `imageUrl?`, `createdAt`, `updatedAt?`
  - `initialMessages: string[]` (read by `ChatProvider`)
- `messaging/activities/instances/{instanceId}`:
  - `templateId`, `title`, `description?`, `meetUpPoint?`, `meetUpTime?`, `startTime`, `status`, `createdBy`, `updatedAt?`
- `messaging/activities/presence/{instanceId}/{guestUuid}`:
  - `{ at: number }`
- `messaging/channels/{instanceId}/messages/{messageId}`:
  - `{ content, senderId, senderRole, senderName?, createdAt }`

### Dependency & Impact Map
- Upstream dependencies:
  - Firebase RTDB schema + rules (`apps/prime/database.rules.json`).
  - Prime SDK flow flags (prod): `NEXT_PUBLIC_ENABLE_SDK_ACTIVITIES`, `NEXT_PUBLIC_ENABLE_SDK_ACTIVITY_CHANNELS` (`apps/prime/src/lib/security/dataAccessModel.ts`).
  - Staff access enablement (prod): `NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES` (`apps/prime/src/lib/security/staffOwnerGate.ts`).
- Downstream dependents:
  - Prime guest home (`SocialHighlightsCard`) and `/activities` UX.
  - Brikette marketing conversion surfaces (home hero, experiences routing, SEO).
  - Recruiting pipeline (careers page + contact endpoint/process).

### Delivery & Channel Landscape (business-artifact + mixed)
- Audiences:
  - Prospects: Brikette website + social media.
  - Guests: Prime guest portal.
  - Candidates: Brikette careers + work-exchange audience.
- Channel constraints:
  - Website claims must be stable and defensible (avoid "daily" promises unless guaranteed).
  - Work-exchange recruitment is platform-constrained (platform profiles, review systems, hour caps, host eligibility).
- Measurement hooks already available:
  - Prime: attendance records via `messaging/activities/presence/*`.
  - Prime: activity engagement via channel messages.

### Hypothesis & Validation Landscape

#### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|-----------|-----------|-------------------|-------------------|
| H1 | Activities drive higher guest satisfaction and stronger word-of-mouth / review signal | Operational execution (hosts + schedule) | Medium (staff time) | 2-8 weeks |
| H2 | Prime reduces coordination overhead (guests self-serve, chat replaces repetitive questions) | Activities are seeded + visible | Low | 1-2 weeks |
| H3 | Brikette site experiences framing increases high-intent bookings | Copy/IA changes shipped | Medium (traffic) | 2-6 weeks |
| H4 | Recruiting page yields more qualified seasonal/work-exchange applicants | Copy + clear role expectations | Low | 1-4 weeks |

#### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence in signal |
|-----------|-------------------|--------|---------------------|
| H2 | Prime already has activity schedule UI + presence + chat | repo evidence | High |
| H3 | Experiences page exists; homepage under-emphasizes experiences | repo evidence | Medium |
| H4 | Careers page exists but currently filters out short volunteer stays | repo evidence | Medium |

## External Research (selected)
- Internal:
  - Brikette market intelligence highlights Hostelworld's social/community direction.
  - Source: `docs/business-os/market-research/BRIK/2026-02-12-market-intelligence.user.md`.

- External (platform constraints and patterns to borrow):
  - Hostelworld positions "Linkups" as hostel-organized activities visible before check-in: https://www.hostelworld.com/linkups
  - Workaway host info (useful to sanity-check eligibility/expectations): https://www.workaway.info/en/info/how-it-works/host
  - Worldpackers host basics / hours guidance: https://www.worldpackers.com/topics/become-a-host

## Test Landscape (code + mixed)

### Prime
- Unit/integration tests exist for activities lifecycle and chat provider behavior.
  - Example: `apps/prime/src/app/(guarded)/activities/__tests__/attendance-lifecycle.test.tsx`.

### Brikette
- Content and i18n are JSON-backed and validated via app-level checks (existing patterns).
  - Guide authoring/validation docs: `apps/brikette/docs/guide-authoring-best-practices.md`.

## Questions

### Resolved
- Q: Does Prime already have an activities UX surface?
  - A: Yes: home card (`SocialHighlightsCard`), `/activities` list (`ActivitiesClient`), and activity chat (`/(guarded)/chat/channel`).
  - Evidence: `apps/prime/src/components/homepage/SocialHighlightsCard.tsx`, `apps/prime/src/app/(guarded)/activities/ActivitiesClient.tsx`, `apps/prime/src/app/(guarded)/chat/channel/page.tsx`.

- Q: Does Brikette already have an "experiences" marketing surface?
  - A: Yes: `/experiences` and related guide system.
  - Evidence: `apps/brikette/src/app/[lang]/experiences/page.tsx`, `apps/brikette/src/locales/en/experiencesPage.json`.

- Q: What is the minimum activities baseline you want to operationally guarantee?
  - A: 3 recurring weekly anchor activities (baseline to guarantee).
  - Evidence: user input (2026-02-14).

- Q: Should any part of the upcoming activities schedule be public (on Brikette site), or guest-only (Prime)?
  - A: Both: a public-facing activities surface on Brikette and the guest-facing schedule in Prime.
  - Evidence: user input (2026-02-14).

- Q: Recruiting: are we explicitly recruiting work-exchange/workawayer roles, or only paid seasonal staff?
  - A: Both: work-exchange and seasonal.
  - Evidence: user input (2026-02-14).

- Q: Terminology: how do we distinguish "experiences" vs "activities"?
  - A: "Experiences" = all things guests can do (typically without the hostel). "Activities" = hostel-led things (undertaken with the hostel).
  - Evidence: user input (2026-02-14).

### Open (Decision/Detail Needed)
- Q: What are the 3 baseline anchor activities (names, days/times, seasonality/weather caveats, and staffing owner)?
  - Why it matters: Prime seeding + Brikette marketing claims + recruiting requirements all flow from these specifics.
  - Default assumption (if any) + risk: default to 1 social (terrace), 1 active (hike/walk), 1 communal (dinner) anchor; risk is misfit vs actual ops preference.

- Q: Recruiting details: what is the minimum commitment for work-exchange (the careers page currently excludes <3 months)?
  - Why it matters: this drives copy, screening, and candidate quality.
  - Default assumption (if any) + risk: default to allowing work-exchange with a published minimum stay and clear expectations; risk is churn/ops load.

- Q: Which social channels are in-scope for the first promotion pack?
  - Why it matters: templates, cadence, and asset formats differ.
  - Default assumption (if any) + risk: default to Instagram + TikTok; risk is wasted effort if channel focus differs.

## Confidence Inputs (for /lp-plan)
- **Implementation:** 78%
  - Prime guest surfaces exist; missing piece is schedule authoring + seeding and (likely) RTDB write hardening.
- **Approach:** 75%
  - Clear "ops baseline -> product surface -> marketing/recruiting" sequencing; remaining decisions are the 3 anchor definitions, work-exchange minimum commitment, and social channel scope.
- **Impact:** 70%
  - Mixed change set (guest app + marketing site + recruiting) touches multiple surfaces; needs careful copy claims + security review.
- **Delivery-Readiness:** 65%
  - Requires operational owner for activity execution, a defined baseline week, and a clear recruiting intake flow.
- **Testability:** 80%
  - Prime has existing tests and clear seams; Brikette content changes can be validated with existing content/i18n checks.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|------|-----------|--------|---------------------------|
| Activities schedule exists in UI but is empty/stale without a real authoring workflow | High | High | Build staff schedule authoring + a repeatable weekly ops checklist |
| RTDB rules for `messaging/activities/*` are too permissive for schedule authoring | Medium | High | Tighten rules so only staff can create/edit templates/instances; guests limited to presence/messages |
| Marketing overclaims vs real ops delivery ("daily" promises) | Medium | High | Use "seasonal" / "on select nights" language unless guaranteed; define baseline first |
| Work-exchange recruiting has compliance and expectation risk | Medium | High | Separate paid seasonal vs work-exchange tracks; publish explicit hours/roles/perks and screening questions |

## Planning Constraints & Notes
- Maintain the clarified taxonomy: experiences (self-guided) vs activities (hostel-led). Update brand language docs as part of implementation to prevent reintroducing the old rule.
- Treat activities as an operations-backed product: do not ship marketing claims without an ops baseline.
- If adding a public schedule, do not expose writable endpoints publicly; fail closed.

## Suggested Task Seeds (Non-binding)
- Define an "Activities Baseline v1" (3 anchor templates, cadence, host responsibility, seasonality caveats).
- Prime: implement staff-only activities authoring UI (templates + instances) and a safe seeding path.
- Prime: tighten RTDB rules for activities authoring (staff write only), keep guest presence/chat safe.
- Brikette: add an explicit "Activities (with the hostel)" surface (home section and/or page) and clarify the "Experiences" page as self-guided.
- Brikette: add a visible "Careers" entry point (header/footer IA) and update careers page to explicitly recruit seasonal + work-exchange activity hosts (with clear track separation and minimum stay).
- Marketing: produce social promotion pack (content pillars, weekly cadence, 10-20 post templates, story highlights structure).

## Execution Routing Packet
- Primary execution skill:
  - /lp-build
- Supporting skills:
  - /lp-channels, /lp-seo
- Deliverable acceptance package (what must exist before task can be marked complete):
  - Prime: activities are seedable + staff-manageable; guests can see/join; security boundaries are explicit.
  - Brikette: an explicit hostel-led activities surface shipped; Experiences clarified as self-guided; copy is defensible.
  - Recruiting: careers is discoverable from site nav/footer; updated seasonal + work-exchange copy + clear intake endpoint.
  - Marketing: social templates + weekly cadence doc for the chosen channel(s).
- Post-delivery measurement plan:
  - Weekly: attendance counts per activity + number of messages per activity channel + applicant count/quality + booking signal (manual if needed).

## Planning Readiness
- Status: Ready-for-planning
- Blocking items (if any):
  - Social channel scope
  - Specific definition of the 3 baseline anchor activities (so we can seed Prime and market without overclaiming)
  - Work-exchange minimum commitment (so careers copy is coherent)
- Recommended next step:
  - Proceed to `/lp-plan brik-activities-program` (plan can include explicit DECIDE tasks for the remaining open items).
