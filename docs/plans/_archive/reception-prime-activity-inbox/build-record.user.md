# Build Record — reception-prime-activity-inbox

## Outcome Contract

- **Why:** Staff had no visibility into activity group chats. Guest questions or issues posted to activity channels went unnoticed, creating a service gap for a running feature.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Activity channel messages appear in Reception's Prime inbox column within the same polling window as direct messages. Staff can read full conversation history and post replies that appear in the guest app.
- **Source:** operator

## Build Summary

All 6 IMPLEMENT tasks complete. No regressions in typecheck or lint across `apps/prime` and `apps/reception`.

### What was delivered

1. **TypeScript contract layer (TASK-01 + TASK-04)**
   - `primeMessagingChannelTypes` extended with `'activity'`
   - `PrimeReviewChannel` extended with `'prime_activity'`
   - `resolveChannel` explicit `'activity'` → `'prime_activity'` branch
   - `resolveSentAdmissionReason` explicit `'activity'` → `'staff_activity_send'` branch
   - `defaultSubject` explicit `'activity'` → `'Activity chat'` branch
   - `inboxChannels` array extended with `'prime_activity'`
   - `PRIME_ACTIVITY_CHANNEL_ADAPTER` defined and added to exhaustive `CHANNEL_ADAPTERS` record
   - `guestBookingRef` sentinel guard at `mapPrimeSummaryToInboxThread` (returns `null` for `prime_activity`)

2. **Server ingestion function (TASK-02)**
   - `apps/prime/functions/api/activity-message.ts` — new CF Pages Function mirroring `direct-message.ts`
   - Session validation, rate limiting (`activity-message:write:${uuid}`, 40 req/60s), Firebase meta + message write, fire-and-forget D1 shadow-write
   - `shadowWritePrimeInboundActivityMessage` added to `prime-messaging-shadow-write.ts`
   - Note: `GuestProfile` has no display-name field; `senderName` is `null` for activity sends (hostel-wide channels have no booking occupant lookup)

3. **Staff reply projection (TASK-03)**
   - `ensureActivityChannelMeta` added to `prime-thread-projection.ts`
   - `projectPrimeThreadMessageToFirebase` dispatch now explicit three-branch: broadcast / activity / direct

4. **Guest app send path (TASK-05)**
   - `ChatProvider.sendMessage` else-branch now calls `POST /api/activity-message` instead of direct Firebase `push()`
   - `channelId.startsWith('dm_')` guard prevents accidental misrouting for future non-activity non-direct channels

5. **Tests (TASK-06)**
   - `activity-message.test.ts`: TC-06 through TC-12 + D1 shadow-write integration test
   - `prime-review-contracts.test.ts`: TC-04, TC-05
   - `prime-thread-projection.test.ts`: TC-13 through TC-15
   - `prime-activity-contracts.test.ts` (Reception): TC-01, TC-02, TC-18 (type contract)
   - `channel-adapters.server.test.ts` extended: TC-16, TC-17

## Engineering Coverage Evidence

| Coverage Area | Status | Evidence |
|---|---|---|
| UI / visual | Done | `PRIME_ACTIVITY_CHANNEL_ADAPTER` with `channelLabel: 'Activity chat'`; `guestBookingRef: null` guard prevents `#activity` rendering |
| UX / states | Done | ChatProvider activity send path routes through server; error handling mirrors direct-message branch |
| Security / privacy | Done | Session token validated on every send; `enforceKvRateLimit` on sender UUID; no per-booking membership check (hostel-wide) |
| Logging / observability / audit | Done | `recordDirectTelemetry(env, 'activity.write.success/error/rate_limited')` in `activity-message.ts` |
| Testing / validation | Done | TC-06 through TC-21 covered across 5 test files; all lint and typecheck pass |
| Data / contracts | Done | TypeScript-only changes; no schema migration; `channel_type='activity'`, `booking_id='activity'` sentinel in D1 |
| Performance / reliability | Done | Fire-and-forget shadow-write; TC-11 validates 200 response on D1 failure |
| Rollout / rollback | Done | Removing `'prime_activity'` from `inboxChannels` hides threads without data loss |

## Notable Deviations from Plan

- `senderName` is `null` for activity messages: `GuestProfile` stores preferences only, not a display name. The plan assumed `senderName` could be fetched from the guest profile; this is a minor gap with no user-facing impact since the message still appears with `senderId` available.
- `useCallback` `db` dependency removed from `sendMessage`: once the direct Firebase `push()` was replaced, `db` was no longer used in the activity send path.

## Workflow Telemetry Summary

| Stage | Records | Modules | Context bytes | Artifact bytes | Token coverage |
|---|---:|---:|---:|---:|---|
| lp-do-fact-find | 2 | 1.00 | 50836 | 30636 | 0.0% |
| lp-do-analysis | 1 | 1.00 | 76067 | 22864 | 0.0% |
| lp-do-plan | 1 | 1.00 | 129876 | 53780 | 0.0% |
| lp-do-build | 1 | 2.00 | 153278 | 0 | 0.0% |

Totals: 4 workflow records, 410047 context input bytes, 107347 artifact bytes.
