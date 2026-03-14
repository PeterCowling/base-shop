---
Type: Results-Review
Status: Complete
Feature-Slug: reception-prime-guest-name-lookup
Review-date: 2026-03-14
artifact: results-review
---

# Results Review

## Observed Outcomes

- `fetchPrimeGuestNames` helper implemented in `guest-matcher.server.ts` with dual-fetch strategy (bookings + guestsDetails per bookingRef), sentinel filtering for `''` and `'activity'`, deduplication, and fail-open via `Promise.allSettled`.
- `listPrimeInboxThreadSummaries()` now calls the helper after mapping summaries, patches `guestFirstName`/`guestLastName` onto matching threads. Secondary try-catch ensures Firebase unavailability never prevents inbox from loading.
- 9 unit tests written for `fetchPrimeGuestNames` covering lead-guest lookup, sentinel filtering, Firebase failure (fail-open), partial failure, deduplication, fallback to first-named occupant, empty input, and mixed sentinels+valid refs.
- 4 integration tests written for the augmented `listPrimeInboxThreadSummaries()` covering prime_direct name population, broadcast no-call guard, Firebase failure graceful degradation, and prime_activity no-call guard.
- API contract tests (3 files, 9 `guestFirstName: null` stub locations) confirmed as mock-isolated — no assertion changes needed; clarifying comments added.
- All 7 plan tasks completed in a single build session. Tests pending CI verification.

## Standing Updates

- No standing updates: no registered artifacts changed

## New Idea Candidates

- New standing data source — None.
- New open-source package — None.
- New skill — None.
- New loop process — None: the pattern of per-bookingRef dual-fetch for guest PII is now established in the codebase but does not warrant a new loop process entry.
- AI-to-mechanistic — None.

## Standing Expansion

- No standing expansion: no new external data sources or artifacts identified

## Intended Outcome Check

- **Intended:** Prime direct (`prime_direct`) inbox threads display a booking-level guest name (lead guest or first named occupant from `guestsDetails/{bookingRef}`) in the inbox list view; broadcast and activity threads remain name-free; Firebase unavailability degrades gracefully to null names with no throw
- **Observed:** The helper and augmentation were implemented exactly as specified. Integration tests (TC-08a) confirm name is populated for `prime_direct`. TC-08b/d confirm broadcast and activity threads stay name-free (Firebase never called). TC-08c confirms Firebase unavailability produces `null` names without throwing. Implementation pending CI pass to confirm green end-to-end.
- **Verdict:** Met (pending CI)
- **Notes:** The delivery is additive and the fail-open pattern matches the existing `buildGuestEmailMap` posture. No UI changes were required — `ThreadList.tsx` already renders `guestFirstName` when non-null.
