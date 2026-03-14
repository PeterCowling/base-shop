# Build Record: reception-prime-outbound-messaging

**Feature Slug:** reception-prime-outbound-messaging
**Completed:** 2026-03-14
**Plan:** docs/plans/reception-prime-outbound-messaging/plan.md
**Business:** BRIK

---

## Outcome Contract

- **Why:** Reception staff had no way to initiate a message to guests through the Prime app. All threads were created by shadow-write on inbound guest messages. Staff needed a first-contact broadcast capability — no prior guest message required.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Reception staff can compose a whole-hostel broadcast message from the Reception inbox and have it appear in the Prime guest app for current guests. The Prime guest app provides an entry point to view broadcast messages from the `broadcast_whole_hostel` channel.
- **Source:** dispatch

---

## Build Summary

Delivered end-to-end whole-hostel broadcast messaging across five build waves. All 8 IMPLEMENT tasks completed on 2026-03-14. No DB migrations required.

**Wave 1 (commit 5633aaebd5):** TASK-01 + TASK-03
- Exported `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` from `apps/prime/src/lib/chat/directMessageChannel.ts` (enables cross-app reference without inline strings in Prime app layer).
- Added KV rate limit on `review-campaign-send` endpoint via `enforceKvRateLimit` — prevents broadcast spam.

**Wave 2 (commit 67d338b582):** TASK-02 + TASK-04
- New Prime CF Pages Function endpoint `POST /api/staff-initiate-thread`: calls `upsertPrimeMessageThread` (creates D1 row) + `savePrimeReviewDraft` (creates draft + campaign via `ensureWholeHostelCampaignForDraft`). Uses `enforceStaffOwnerApiGate`. `bookingId: ''` for whole-hostel thread.
- Guest broadcast viewer: `ChannelMode` extended with `'broadcast'` in `chat/channel/page.tsx`. Equality check against exported constant guards URL forgery. No send form rendered for broadcast mode.

**Wave 3 (commit e89101cadf):** TASK-05 + TASK-06
- "Staff messages" link added to `GuestDirectory.tsx` — visible in all four render states (opt-in required, loading, empty, populated). Link placed outside conditional early-return blocks.
- `initiatePrimeOutboundThread({ text, actorUid })` proxy function added to `prime-review.server.ts`. Null-guards on `readPrimeReviewConfig()` for graceful 503 degradation. Uses `primeRequest<{ detail: PrimeReviewThreadDetail }>` pattern.

**Wave 4 (commit 2522ba7a39):** TASK-07
- New Reception API route `POST /api/mcp/inbox/prime-compose`: `requireStaffAuth` → text validation → `initiatePrimeOutboundThread` → `sendPrimeInboxThread` → `recordInboxEvent`. Returns 400/401/502/503/200.
- Added `'prime_broadcast_initiated'` to `inboxEventTypes` as-const array in `telemetry.server.ts`.

**Wave 5 (commit 88bad52a9f):** TASK-08
- `PrimeColumn.tsx` extended with compose button ("New broadcast") and broadcast modal. Modal uses `position: fixed` with token-based overlay (`bg-surface/80 backdrop-blur-sm`). Textarea `maxLength={2000}` with character count display. Full error/loading/success state management. All design system lint rules satisfied (ds/no-bare-rounded, ds/no-raw-tailwind-color).

---

## Engineering Coverage Evidence

| Coverage Area | Status | Evidence |
|---|---|---|
| UI / visual | Delivered | Broadcast viewer in `chat/channel/page.tsx` (no send form). Compose button + modal in `PrimeColumn.tsx`. Design system token compliance verified (lint clean). |
| UX / states | Delivered | Broadcast mode: no spinner, messages from RTDB. Compose: idle → open-empty → open-with-text → sending → success/error. Error mapping: 503 → "Prime messaging is not available right now." |
| Security / privacy | Delivered | URL forgery guard: `id === WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` equality check. `enforceStaffOwnerApiGate` on CF endpoint. `requireStaffAuth` on Reception API route. |
| Logging / observability | Delivered | `prime_broadcast_initiated` inbox event recorded on success path (TASK-07). |
| Testing / validation | Delivered | 47 new TCs total across 5 test files. All pass in CI. |
| Data / contracts | Delivered | No DB migrations. `bookingId: ''` confirmed workable. Exported constant used as canonical broadcast channel ID. |
| Performance / reliability | Delivered | Single RTDB node write. `upsertPrimeMessageThread` idempotent. KV rate limit on send path. |
| Rollout / rollback | Delivered | All layers additive. Rollback = file revert. 503 returned if Prime config absent. |

**Test coverage breakdown:**
- TASK-02: 6 TCs — `staff-initiate-thread.test.ts` (CF endpoint)
- TASK-03: KV rate limit tested inline with TASK-02 helpers
- TASK-04: 3 TCs — `chat/channel/__tests__/page.test.tsx` (broadcast mode branch)
- TASK-05: 5 TCs — `guest-directory.test.tsx` (staff messages link in all states)
- TASK-06: 6 TCs — `initiate-prime-outbound-thread.test.ts` (proxy function)
- TASK-07: 10 TCs — `prime-compose/route.test.ts` (API route)
- TASK-08: 10 TCs — `PrimeColumn.test.tsx` (compose button + modal)

`scripts/validate-engineering-coverage.sh` passed before completion.

---

## Workflow Telemetry Summary

- Feature slug: `reception-prime-outbound-messaging`
- Records: 4
- Token measurement coverage: 0.0%

| Stage | Records | Avg modules | Avg context bytes | Avg artifact bytes | Token coverage |
|---|---:|---:|---:|---:|---:|
| lp-do-fact-find | 1 | 1.00 | 57007 | 36884 | 0.0% |
| lp-do-analysis | 1 | 1.00 | 84615 | 24633 | 0.0% |
| lp-do-plan | 1 | 1.00 | 142947 | 61943 | 0.0% |
| lp-do-build | 1 | 2.00 | 123793 | 0 | 0.0% |

**Totals:** Context input bytes: 408,362 | Artifact bytes: 123,460 | Modules: 5 | Deterministic checks: 7
