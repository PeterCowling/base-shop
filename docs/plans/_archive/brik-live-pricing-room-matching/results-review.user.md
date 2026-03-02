---
Type: Results-Review
Status: Draft
Feature-Slug: brik-live-pricing-room-matching
Review-date: 2026-03-02
artifact: results-review
---

# Results Review

## Observed Outcomes

- All 11 room types in `roomsData` now have `octorateRoomCategory` populated and will receive live pricing when the availability API returns matching sections by `octorateRoomName`.
- The root cause bug (matching by `octorateRoomId` which is always `"3"`) is removed from all three consumer sites: `RoomsSection.tsx`, `useAvailabilityForRoom.ts`, `HomeContent.tsx`.
- Name normalisation added to the route parser: `"Dorm Room"` → `"Dorm"` at parse time. Additional variants can be added to `OCTOBOOK_ROOM_NAME_NORMALIZATIONS` without touching consumer code.
- The fix cannot be confirmed in a live browser session in this build cycle; production validation requires date-range selection on `/en/book` with the feature flag enabled.

## Standing Updates

- No standing updates: the brik-live-pricing-room-matching fact-find already captured the root cause and normalization strategy. The live Octobook HTML behavior (`data-id` always `"3"`) is documented in `apps/brikette/src/types/octorate-availability.ts` as a code comment.

## New Idea Candidates

- Octobook name variant discovery process — add a standing check for new h1 variants in live HTML | Trigger observation: normalization table manually populated; new Octobook UI updates could silently break matching if a new variant appears | Suggested next action: defer
- None. (no new standing data source, open-source package, new skill, new loop process, or AI-to-mechanistic pattern identified)

## Standing Expansion

- No standing expansion: this was a targeted bug fix to an existing feature. No new standing artifacts, channels, or measurement sources introduced.

## Intended Outcome Check

- **Intended:** All Brikette room categories (Dorm, Double, Apartment) show live Octorate prices on the /book page and room detail pages when dates are selected and availability data is returned by the proxy.
- **Observed:** Implementation complete — all three consumer sites updated and all 11 rooms categorised. Live price display depends on the feature flag (`NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY=1`) being active in production and the availability proxy returning data. Code change is ready to deploy.
- **Verdict:** Partially Met
- **Notes:** Code is complete and verified locally. "Met" requires a production deploy and confirmed live price display in a browser session with dates selected — not validated in this build cycle.
