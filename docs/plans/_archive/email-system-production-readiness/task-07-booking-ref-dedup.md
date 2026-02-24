---
Type: Task-Artifact
Status: Draft
---

# TASK-07: Booking-Reference Deduplication

**Status:** Complete
**Date:** 2026-02-21

## Summary

Added booking-reference deduplication to the `processBookingReservationNotification` handler in the MCP server. This prevents duplicate guest-facing drafts when the same reservation notification arrives more than once (e.g. Octorate retries, duplicate webhook deliveries).

## Changes

### `packages/mcp-server/src/tools/gmail.ts`

1. **Extended `AuditEntry.action` union** with `"booking-dedup-skipped"` to support audit logging of dedup events.

2. **Added `checkBookingRefDuplicate()` exported helper** (lines ~1744-1769):
   - Accepts a Gmail client and reservation code
   - Searches `gmail.users.drafts.list` with query `"Reservation Code: <code>" after:<24h-epoch>` bounded to 1 result
   - Returns `{ isDuplicate: true }` when a matching draft exists
   - Fail-open design: returns `{ isDuplicate: false }` when reservation code is empty or API call throws

3. **Integrated dedup check in `processBookingReservationNotification`** (lines ~1834-1868):
   - Called after successful reservation parse but before draft creation
   - Only runs when `!dryRun && reservation.reservationCode` is truthy
   - On duplicate: logs `booking-dedup-skipped` audit entry, labels message as processed, returns without creating draft
   - On non-duplicate or failure: falls through to existing draft creation logic

### `packages/mcp-server/src/__tests__/gmail-booking-dedup.test.ts` (new)

8 tests covering:

| Test | Description | Result |
|------|-------------|--------|
| Unit: no match | `checkBookingRefDuplicate` returns `isDuplicate=false` when drafts list is empty | Pass |
| Unit: match found | Returns `isDuplicate=true` when draft with matching ref exists | Pass |
| Unit: API error | Returns `isDuplicate=false` on API failure (fail-open) | Pass |
| Unit: empty ref | Returns `isDuplicate=false` and skips API call for empty reservation code | Pass |
| TC-01 | First booking notification creates draft normally | Pass |
| TC-02 | Second notification for same booking ref skips draft, writes audit log | Pass |
| TC-03 | Empty reservation code proceeds normally (fail-open) | Pass |
| TC-04 | Different booking refs each get their own draft | Pass |

## Validation

- Typecheck: `pnpm --filter mcp-server exec tsc --noEmit` -- clean
- Tests: 60 suites, 599 tests, all passing (0 regressions)

## Design decisions

- **Fail-open everywhere**: If the dedup check itself fails (API error, empty ref), we create the draft anyway. A duplicate draft is better than a missed guest communication.
- **24-hour window**: `after:` epoch bound keeps the drafts.list query fast and prevents false positives from old reservations with the same code.
- **Body-based search**: Query uses `"Reservation Code: <code>"` which matches the exact string format in `buildNewReservationDraft`. This is more reliable than subject-based search since the draft subject is generic ("Your Hostel Brikette Reservation").
- **Audit trail**: Dedup events are logged to the append-only audit log for observability. The `result` field captures the duplicate reservation code.
- **Existing dedup untouched**: The `hasBriketteLabel` message-level dedup at line ~2081 remains unchanged. The booking-ref dedup is a complementary layer operating at the reservation-code level within already-classified booking notifications.
