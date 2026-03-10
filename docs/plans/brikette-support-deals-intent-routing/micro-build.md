---
Type: Micro-Build
Status: Complete
Created: 2026-03-10
Last-updated: 2026-03-10
Feature-Slug: brikette-support-deals-intent-routing
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260310144500-9402
Related-Plan: none
---

# Brikette Support And Deals Intent Routing Micro-Build

## Scope
- Change:
  - Add a shared intent-aware routing helper for neutral support/promotional booking surfaces.
  - Preserve exact private booking branches when support/deals pages are entered from a private-room journey.
  - Replace silent hostel-default handoffs on support/deals surfaces with an explicit dorm/private chooser when no intent is known.
- Non-goals:
  - Rework every content CTA cluster across the site in this wave.
  - Introduce a new standalone chooser page or modal route.
  - Change Octorate handoff behavior or deal eligibility rules.

## Execution Contract
- Affects:
  - `apps/brikette/src/app/[lang]/deals/DealsPageContent.tsx`
  - `apps/brikette/src/app/[lang]/assistance/AssistanceIndexContent.tsx`
  - `apps/brikette/src/components/cta/ContentStickyCta.tsx`
  - `apps/brikette/src/routes/deals/PerksAndCtaSections.tsx`
  - `apps/brikette/src/utils/intentResolver.ts`
  - `apps/brikette/src/utils/entryAttribution.ts`
  - `apps/brikette/src/utils/localizedRoutes.ts`
  - `apps/brikette/src/utils/privateRoomPaths.ts`
- Acceptance checks:
  - Assistance/help and how-to-get-here booking CTAs preserve private intent when present in the attribution carrier.
  - When support/deals surfaces do not know user intent, they render explicit dorm/private booking choices instead of routing straight to `/book`.
  - Deals remains honest about room-type scope while still offering a private-room path.
- Validation commands:
  - `pnpm --filter @apps/brikette typecheck`
  - `pnpm --filter @apps/brikette lint`
- Rollback note:
  - Revert the intent-aware support/deals routing helper and restore the prior single-path hostel CTA behavior if the chooser or attribution routing causes navigation regressions.

## Outcome Contract
- **Why:** Neutral support and promo surfaces are currently resetting user intent and leaking private-room shoppers back into the dorm booking narrative.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Brikette support and deals pages preserve known private intent and expose an explicit dorm/private branch choice when intent is unknown, improving funnel coherence without adding a new booking surface.
- **Source:** operator

## Build Evidence
- Added `resolveIntentAwareBookingSurface()` and `useEntryAttribution()` so neutral commercial-support surfaces can branch from carried intent instead of hard-defaulting to the hostel booking path.
- `ContentStickyCta` now treats `assistance` and `how_to_get_here` as segmented surfaces: known private intent stays on the private branch, and unknown intent renders explicit `Dorms` / `Private Rooms` choices.
- `AssistanceIndexContent` now uses the same intent-aware branching for its primary booking block instead of always linking to `/book`.
- `DealsPageContent` now renders segmented bottom-of-page booking actions and writes attribution before routing the selected branch.
- Added pure routing coverage in `apps/brikette/src/test/utils/intentAwareBookingSurface.test.ts`.

## Validation
- `pnpm --filter @apps/brikette typecheck` — pass
- `pnpm --filter @apps/brikette lint` — pass with 2 pre-existing warnings outside this micro-build:
  - `apps/brikette/src/app/[lang]/experiences/tags/[tag]/GuidesTagContent.tsx`
  - `apps/brikette/src/components/rooms/RoomsSection.tsx`

## Remaining Follow-up
- `AlsoHelpful` and other secondary content CTA clusters still default to the dorm branch and should move onto the same intent-aware helper in a later tranche.
- The live site will not reflect this micro-build until the current branch is deployed.
