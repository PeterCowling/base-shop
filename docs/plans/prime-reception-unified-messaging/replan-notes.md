---
Type: Replan Notes
Status: Active
Feature-Slug: prime-reception-unified-messaging
Replan-round: 10
Last-reviewed: 2026-03-08
---

# Replan Notes

## Why TASK-04 was split
- The original TASK-04 combined three distinct seams: Reception review-surface normalization, Prime D1 persistence, and Prime draft admission/projection orchestration.
- That scope left the task at 72% confidence, below the `IMPLEMENT` floor for `/lp-do-build`.
- The audited code confirmed the Reception adapter contract can be landed independently and raises confidence for the later Prime D1 work by removing email-shaped assumptions from the review surface first.

## Evidence reviewed
- `apps/reception/src/lib/inbox/draft-pipeline.server.ts`
- `apps/reception/src/lib/inbox/api-models.server.ts`
- `apps/reception/src/services/useInbox.ts`
- `apps/reception/src/components/inbox/ThreadDetailPane.tsx`
- `apps/reception/src/components/inbox/DraftReviewPanel.tsx`
- `apps/prime/functions/api/direct-message.ts`
- `apps/prime/functions/api/direct-messages.ts`
- `docs/plans/prime-reception-unified-messaging/architecture.md`

## Resulting task split
- `TASK-04`: Land a Reception channel-adapter contract and run email inbox data through it.
- `TASK-05`: Add Prime D1 schema and repository primitives for threads/messages/drafts/admissions.
- `TASK-06`: Add Prime draft admission, suppression/projection orchestration, and Reception Prime adapter wiring.

## Sequencing rationale
- `TASK-04` must land before later Prime review work so Reception no longer assumes Gmail-only draft semantics.
- `TASK-05` follows `TASK-04` because the D1 schema should target the normalized adapter contract instead of another email-shaped interface.
- `TASK-06` depends on both prior tasks because it needs the new schema and the unified review surface.

## TASK-05 promotion evidence
- Binding decision: use `PRIME_MESSAGING_DB` in `apps/prime/wrangler.toml`, matching repo precedent for app-local D1 bindings.
- Migration layout: add `apps/prime/migrations/0001_prime_messaging_init.sql` as the canonical initial schema file.
- Repository placement: add `apps/prime/functions/lib/prime-messaging-db.ts` and `apps/prime/functions/lib/prime-messaging-repositories.ts`.
- Runtime scope: TASK-05 remains storage-only. Existing queue/orchestration code in `apps/prime/functions/api/process-messaging-queue.ts` and `apps/prime/functions/lib/messaging-dispatcher.ts` becomes a later consumer, not part of this slice.
- Confidence effect: these decisions remove the main placement/shape unknowns, promoting TASK-05 from 78% to 82% and making it build-eligible.

## Why TASK-06 was split
- The original TASK-06 still bundled two different implementation seams: Prime canonical inbound persistence/admission on the write path, and Reception review/list/detail integration on the operator side.
- That kept the task at 74% confidence because current Prime reads still depend on Firebase, while Reception review actions still need a concrete Prime-specific contract.
- A bounded D1 shadow-write slice can land now without destabilizing guest chat behavior, and it creates the canonical data needed for later Reception integration.

## Additional evidence reviewed
- `apps/prime/functions/api/direct-message.ts`
- `apps/prime/functions/api/direct-messages.ts`
- `apps/prime/functions/lib/staff-auth-token-gate.ts`
- `apps/prime/functions/api/staff-auth-session.ts`
- `apps/reception/src/lib/inbox/channel-adapters.server.ts`
- `apps/reception/src/lib/inbox/api-models.server.ts`
- `apps/reception/src/app/api/mcp/inbox/route.ts`
- `apps/reception/src/app/api/mcp/inbox/[threadId]/route.ts`

## Resulting task split (round 2)
- `TASK-06`: Shadow-write Prime inbound direct-message traffic into D1 and persist admission/projection metadata.
- `TASK-07`: Wire Prime D1-backed review candidates into Reception inbox list/detail flows.

## Sequencing rationale (round 2)
- `TASK-06` goes first because Prime review surfaces need canonical inbound thread/message state before Reception can consume anything.
- `TASK-06` stays additive because `apps/prime/functions/api/direct-messages.ts` still reads from Firebase; a full D1 authority cutover would be a larger transport change than this cycle allows.
- `TASK-07` now depends on `TASK-06` rather than directly on `TASK-05`, because storage primitives alone are not enough for operator-visible review data.

## TASK-06 promotion evidence
- Runtime seam: `apps/prime/functions/api/direct-message.ts` is the single inbound direct-message write path, so D1 shadow-write scope is localized.
- Safety constraint: `apps/prime/functions/api/direct-messages.ts` still hydrates guest chat from Firebase, so the next slice must preserve Firebase writes and make D1 additive.
- Canonical contract: `apps/prime/functions/lib/prime-messaging-repositories.ts` already has insert/read primitives; only bounded thread-upsert and admission decision helpers are missing.
- Takeover evidence: the existing D1 thread schema already includes `takeover_state`, `suppression_reason`, and `last_staff_reply_at`, which is enough to record deterministic queued vs suppressed/manual-takeover admissions without adding Reception review flows yet.
- Confidence effect: these decisions promote the new `TASK-06` from 74% to 83% and leave `TASK-07` below the build floor at 76% pending a concrete Reception review contract.

## Why TASK-07 was split
- The original TASK-07 still mixed two concerns: getting Prime threads visible inside Reception, and letting operators mutate those Prime threads from Reception.
- The audit showed those are not equally ready. Read-only access has a bounded path through Prime owner-gated APIs plus a Reception proxy, but write actions still need explicit auth, transition, and replay rules.
- Keeping them together would push the task back under the `IMPLEMENT` floor and risk another cross-app bundle.

## Additional evidence reviewed (round 3)
- `apps/reception/src/components/inbox/DraftReviewPanel.tsx`
- `apps/reception/src/components/inbox/ThreadDetailPane.tsx`
- `apps/reception/src/components/inbox/InboxWorkspace.tsx`
- `apps/reception/src/lib/inbox/channels.ts`
- `apps/reception/src/app/api/mcp/_shared/staff-auth.ts`
- `apps/prime/functions/lib/staff-owner-gate.ts`
- `apps/prime/functions/api/direct-telemetry.ts`
- `apps/reception/worker-entry.ts`

## Resulting task split (round 3)
- `TASK-07`: Add Prime read-only review APIs and surface Prime threads in Reception inbox list/detail flows.
- `TASK-08`: Add Prime review mutations and Reception operator actions for send/dismiss/resolve flows.

## Sequencing rationale (round 3)
- `TASK-07` is buildable now because Prime already has canonical inbound state and a production-safe owner gate based on `x-prime-access-token`.
- `TASK-07` must stay read-only because Reception’s current draft/send/resolve routes are email-specific, and Prime/Reception do not share a write-safe token today.
- `TASK-08` should follow only after the read contract exists and the mutation state machine is explicit.

## TASK-07 promotion evidence
- Cross-app storage constraint: Reception has `RECEPTION_INBOX_DB`; Prime has `PRIME_MESSAGING_DB`; there is no shared D1 binding, so direct DB reads from Reception would be the wrong integration path.
- Auth seam: Prime’s `enforceStaffOwnerApiGate()` already supports server-to-server access through `x-prime-access-token`, which gives Reception a bounded read-only integration path without needing Prime Firebase staff tokens.
- UI seam: Reception’s channel-adapter contract already controls labels and required fields; adding capability-driven read-only gating is localized and avoids hardcoded email/Prime branches.
- Scope cut: Prime write actions remain unresolved because current Reception mutation routes (`draft`, `send`, `resolve`, `dismiss`) all target the email inbox repositories and would be incorrect for Prime threads.
- Confidence effect: these decisions promote the new `TASK-07` from 76% to 83% and create a new `TASK-08` at 73% pending a formal Prime mutation contract.

## Why TASK-08 was split
- The original TASK-08 still bundled two different seams: Prime operator review-state actions (`dismiss`/`resolve`) and Prime outbound send/draft mutations.
- The audit showed those are not equally ready. Resolve/dismiss can ride the existing owner-gated Prime API seam and D1 thread/admission model, but send still lacks an explicit canonical outbound message/projection contract.
- Keeping them together would either force a shortcut by overloading `takeover_state` with inbox status semantics or leave the task below the `IMPLEMENT` floor again.

## Additional evidence reviewed (round 4)
- `apps/prime/migrations/0001_prime_messaging_init.sql`
- `apps/prime/functions/lib/prime-messaging-shadow-write.ts`
- `apps/prime/functions/lib/prime-messaging-repositories.ts`
- `apps/prime/functions/lib/prime-review-api.ts`
- `apps/prime/functions/api/review-thread.ts`
- `apps/prime/functions/api/review-threads.ts`
- `apps/reception/src/app/api/mcp/inbox/[threadId]/resolve/route.ts`
- `apps/reception/src/app/api/mcp/inbox/[threadId]/dismiss/route.ts`
- `apps/reception/src/app/api/mcp/inbox/[threadId]/send/route.ts`
- `apps/reception/src/lib/inbox/prime-review.server.ts`
- `apps/reception/src/lib/inbox/repositories.server.ts`

## Resulting task split (round 4)
- `TASK-08`: Add Prime review-state mutations and Reception operator actions for Prime dismiss/resolve flows.
- `TASK-09`: Add Prime outbound send/draft mutations and Reception operator send actions.

## Sequencing rationale (round 4)
- `TASK-08` goes first because Prime dismiss/resolve only needs canonical review state plus the existing owner-gated API seam.
- `TASK-08` must introduce an explicit Prime review-status field because Reception’s inbox state vocabulary (`pending`, `review_later`, `auto_archived`, `resolved`, `sent`) is distinct from Prime’s automation `takeover_state` (`automated`, `staff_active`, `suppressed`).
- `TASK-09` depends on `TASK-08` because send actions should update that canonical review state and build on the now-explicit separation between review state and automation suppression state.

## TASK-08 promotion evidence
- Schema gap: Prime thread storage currently has `takeover_state` and `suppression_reason`, but no persisted review-state field for `resolved` or `auto_archived`; adding one is the non-shortcut fix.
- Reopen rule: `apps/prime/functions/lib/prime-messaging-shadow-write.ts` is the single inbound reopen seam, so new guest messages can deterministically reset review state to `pending`/`review_later` without touching later send behavior.
- Action seam: Reception already routes resolve/dismiss through dedicated endpoints, so adding Prime-prefixed thread handling there is localized and does not require changing the existing email write paths.
- Auth seam: Prime’s read APIs already rely on `x-prime-access-token`; bounded write APIs for resolve/dismiss can reuse that owner-gated server-to-server pattern.
- Scope cut: `apps/reception/src/app/api/mcp/inbox/[threadId]/send/route.ts` is Gmail-specific today, and Prime still lacks canonical outbound message creation + Firebase projection semantics, so send remains below the build floor.
- Confidence effect: these decisions promote the new `TASK-08` from 73% to 82% and create a new `TASK-09` at 71% pending a formal outbound mutation contract.

## Why TASK-09 was split
- The original TASK-09 still bundled two different concerns: canonical Prime draft-state handling and actual outbound Prime delivery.
- The audit showed Prime draft state is now buildable because the D1 draft table already exists and Reception’s draft panel only needs finer-grained capability flags, but outbound delivery is still blocked on Firebase projection/replay semantics.
- Keeping them together would either keep the task below the `IMPLEMENT` floor or force Reception to expose Save/Regenerate/Send as one inseparable control surface again.

## Additional evidence reviewed (round 5)
- `apps/prime/functions/lib/prime-messaging-repositories.ts`
- `apps/prime/functions/lib/prime-review-api.ts`
- `apps/prime/functions/api/direct-messages.ts`
- `apps/reception/src/app/api/mcp/inbox/[threadId]/draft/route.ts`
- `apps/reception/src/app/api/mcp/inbox/[threadId]/send/route.ts`
- `apps/reception/src/components/inbox/DraftReviewPanel.tsx`
- `apps/reception/src/components/inbox/filters.ts`
- `apps/reception/src/components/inbox/InboxWorkspace.tsx`
- `apps/reception/src/services/useInbox.ts`

## Resulting task split (round 5)
- `TASK-09`: Add Prime draft-state APIs and Reception draft save/edit support for prefixed Prime threads.
- `TASK-10`: Add Prime outbound send actions and delivery projection semantics.

## Sequencing rationale (round 5)
- `TASK-09` goes first because Prime draft read/write is entirely canonical D1 state and does not require guest-visible delivery.
- `TASK-09` must introduce a per-action capability model in Reception because Prime can support Save before it supports Regenerate or Send.
- `TASK-10` depends on `TASK-09` because send needs a canonical current draft/message authority first; otherwise delivery and review state stay entangled.

## TASK-09 promotion evidence
- Storage seam: `message_drafts` already exists in Prime D1, so current-draft serialization and staff draft save/update flows are localized repository work rather than a new schema design.
- UI seam: `DraftReviewPanel.tsx` currently gates Save, Regenerate, and Send behind one `supportsDraftMutations` flag, so adding per-action capability flags is the non-shortcut path to unlock Save without exposing unsupported actions.
- Route seam: Reception already centralizes draft edits in `/api/mcp/inbox/[threadId]/draft/route.ts`, which gives Prime a bounded proxy point without disturbing the existing email draft routes.
- Delivery constraint: `apps/prime/functions/api/direct-messages.ts` still reads guest chat from Firebase, so true send remains blocked until canonical outbound creation and projection semantics are defined.
- Confidence effect: these decisions promote the new `TASK-09` from 71% to 81% and create a new `TASK-10` at 69% pending a formal delivery contract.

## Why TASK-10 was split
- The original TASK-10 still bundled two different delivery systems: bounded direct-thread support send and the broader replay/broadcast/promotional delivery model.
- The audit showed direct-thread send is now buildable because guests already read direct channels from one Firebase path and Reception already has a bounded Prime proxy seam, but replay/repair and broadcast fan-out still have no concrete runtime path.
- Keeping them together would either leave the task below the `IMPLEMENT` floor again or silently force broadcast semantics through a direct-thread-only send path.

## Additional evidence reviewed (round 6)
- `apps/prime/functions/api/direct-message.ts`
- `apps/prime/functions/api/direct-messages.ts`
- `apps/prime/functions/lib/prime-messaging-shadow-write.ts`
- `apps/prime/functions/lib/prime-messaging-repositories.ts`
- `apps/prime/functions/lib/prime-review-api.ts`
- `apps/prime/src/lib/chat/directMessageChannel.ts`
- `apps/reception/src/app/api/mcp/inbox/[threadId]/send/route.ts`
- `apps/reception/src/lib/inbox/prime-review.server.ts`
- `apps/reception/src/lib/inbox/channel-adapters.server.ts`
- `apps/reception/src/services/useInbox.ts`

## Resulting task split (round 6)
- `TASK-10`: Add Prime direct-thread send APIs and Reception send support for prefixed Prime direct threads.
- `TASK-11`: Add Prime projection replay/repair primitives and broadcast/promotional delivery semantics.

## Sequencing rationale (round 6)
- `TASK-10` goes first because direct-thread send can reuse the existing Firebase guest-read path at `messaging/channels/<channelId>/messages/*` while establishing canonical outbound authority in D1.
- `TASK-10` must stay scoped to `prime_direct` because Reception already has a bounded proxy model for draft/resolve/dismiss/send, while `prime_broadcast` still lacks a real delivery path beyond channel IDs and message metadata.
- `TASK-11` follows `TASK-10` because replay/repair and broadcast delivery should build on a proven direct-thread send contract instead of being guessed in the same slice.

## TASK-10 promotion evidence
- Guest read seam: `apps/prime/functions/api/direct-messages.ts` only reads guest-visible chat from Firebase direct-channel paths, so direct send must project there synchronously or guests will not see sent replies.
- Canonical state seam: `apps/prime/functions/lib/prime-messaging-repositories.ts` already has the D1 primitives needed for outbound message creation, draft status updates, admissions, and projection-job inserts; only bounded send orchestration helpers are missing.
- Auth seam: Prime already exposes owner-gated write routes (`review-thread-draft`, `review-thread-resolve`, `review-thread-dismiss`), and Reception already proxies prefixed Prime mutations through `prime-review.server.ts`, so adding `send` is a localized extension rather than a new cross-app auth model.
- Contract seam: `apps/reception/src/app/api/mcp/inbox/[threadId]/send/route.ts` is the single send proxy point, and `useInbox.ts` already handles `sent` optimistic state updates, so Prime direct send can plug into an existing operator flow.
- Scope cut: `apps/prime/src/lib/chat/directMessageChannel.ts` has broadcast IDs, but there is no actual broadcast send or replay worker path in `apps/prime/functions/`; that work stays out of TASK-10.
- Confidence effect: these decisions promote the narrowed `TASK-10` from 69% to 81% and isolate the unresolved replay/broadcast work in new `TASK-11` at 67%.

## Why TASK-11 was split
- The original TASK-11 still bundled two different delivery problems: direct-thread projection replay/repair and Prime broadcast/promotional send semantics.
- The audit showed replay/repair is now buildable because D1 already stores projection jobs with status/attempt/error fields and Prime has bounded direct-thread write seams, but broadcast still has no concrete audience authority, delivery projection path, or operator send contract.
- Keeping them together would either leave the task below the `IMPLEMENT` floor again or force broadcast fan-out through direct-thread assumptions.

## Additional evidence reviewed (round 7)
- `apps/prime/functions/lib/prime-messaging-repositories.ts`
- `apps/prime/functions/lib/prime-messaging-shadow-write.ts`
- `apps/prime/functions/lib/prime-review-send.ts`
- `apps/prime/functions/lib/firebase-rest.ts`
- `apps/prime/functions/api/review-thread-send.ts`
- `apps/prime/functions/api/direct-messages.ts`
- `apps/prime/src/lib/chat/directMessageChannel.ts`
- `apps/reception/src/lib/inbox/channel-adapters.server.ts`
- `apps/reception/src/lib/inbox/prime-review.server.ts`

## Resulting task split (round 7)
- `TASK-11`: Add Prime projection status/replay primitives and direct-thread repair tooling.
- `TASK-12`: Add Prime broadcast/promotional delivery semantics and Reception operator send support for `prime_broadcast`.

## Sequencing rationale (round 7)
- `TASK-11` goes first because Prime already has canonical direct-thread message/draft/admission rows plus `message_projection_jobs`; what is missing is explicit status mutation and a bounded replay path.
- `TASK-11` must stay scoped to direct-thread projection repair because current Prime guest reads already have one Firebase path for those threads, making repair/replay deterministic.
- `TASK-12` depends on `TASK-11` because broadcast/promotional send should inherit a proven projection failure/retry contract instead of inventing one ad hoc.

## TASK-11 promotion evidence
- Storage seam: `message_projection_jobs` already persists `status`, `attempt_count`, `last_attempt_at`, and `last_error`, but `apps/prime/functions/lib/prime-messaging-repositories.ts` currently exposes only enqueue/list helpers; adding update/read helpers is localized repository work rather than a schema rethink.
- Projection seam: `apps/prime/functions/lib/prime-review-send.ts` and `apps/prime/functions/lib/prime-messaging-shadow-write.ts` are the only current writers of projection jobs, so introducing a shared direct-thread projection helper and replay path is bounded.
- Transport seam: `apps/prime/functions/lib/firebase-rest.ts` already provides deterministic `get`, `set`, `update`, and `delete` primitives for the existing direct-thread Firebase path.
- Auth seam: Prime already has owner-gated review mutation routes, so an operator-only replay/repair route can reuse the same `x-prime-access-token` pattern without adding a new auth model.
- Scope cut: `apps/prime/src/lib/chat/directMessageChannel.ts` and Reception’s `prime_broadcast` adapter prove the broadcast lane exists only as IDs/labels today; there is still no campaign storage, audience expansion, or Firebase path to promote.
- Confidence effect: these decisions promote the narrowed `TASK-11` from 67% to 81% and isolate unresolved broadcast/promotional delivery in new `TASK-12` at 66%.

## Why TASK-12 was split
- The original TASK-12 still bundled two different broadcast problems: sending to an already-defined shared broadcast thread/channel, and defining the broader audience-expansion/campaign model for `booking | room | whole_hostel`.
- The audit showed bounded shared-channel send is now buildable because Prime already has deterministic broadcast channel IDs, generic Firebase reads/writes for non-direct channels in the guest app, and a generic Reception Prime send proxy seam.
- Keeping them together would either leave the task below the `IMPLEMENT` floor again or force a shortcut by pretending audience expansion rules already exist.

## Additional evidence reviewed (round 8)
- `apps/prime/src/lib/chat/directMessageChannel.ts`
- `apps/prime/src/contexts/messaging/ChatProvider.tsx`
- `apps/prime/src/app/(guarded)/chat/channel/page.tsx`
- `apps/prime/functions/lib/prime-review-api.ts`
- `apps/prime/functions/lib/prime-review-drafts.ts`
- `apps/reception/src/lib/inbox/prime-review.server.ts`
- `apps/reception/src/lib/inbox/channel-adapters.server.ts`
- `apps/reception/src/app/api/mcp/inbox/[threadId]/send/route.ts`

## Resulting task split (round 8)
- `TASK-12`: Add Prime shared broadcast-thread send APIs and Reception operator send support for existing `prime_broadcast` review threads.
- `TASK-13`: Add Prime audience-expansion/campaign delivery semantics for `booking | room | whole_hostel`.

## Sequencing rationale (round 8)
- `TASK-12` goes first because Prime already has one concrete broadcast identity model: deterministic shared channel IDs like `broadcast_<audienceKey>`, plus guest Firebase reads for non-direct channels.
- `TASK-12` must stay scoped to existing broadcast threads/channels because that avoids inventing booking/room expansion or multi-target campaign tracking in the same slice.
- `TASK-13` depends on `TASK-12` because broader audience-expansion should build on a proven broadcast send/projection contract instead of creating a second delivery path.

## TASK-12 promotion evidence
- Channel identity seam: `apps/prime/src/lib/chat/directMessageChannel.ts` already builds deterministic broadcast channel IDs, which gives Prime one concrete send target shape without new routing design.
- Guest-read seam: `apps/prime/src/contexts/messaging/ChatProvider.tsx` already reads non-direct channels directly from Firebase at `messaging/channels/<channelId>/messages`, so projected broadcast messages can become visible without a new read API.
- UI seam: `apps/prime/src/app/(guarded)/chat/channel/page.tsx` already renders audience badges and rich messages for non-thread audiences, so projected broadcast messages have an existing guest renderer.
- Operator seam: `apps/reception/src/lib/inbox/prime-review.server.ts` and `apps/reception/src/app/api/mcp/inbox/[threadId]/send/route.ts` already proxy Prime send mutations generically by prefixed thread ID; once Prime allows broadcast sends, Reception changes stay localized to capability gating.
- Scope cut: `apps/prime/functions/lib/prime-review-api.ts` and `apps/prime/functions/lib/prime-review-drafts.ts` support `prime_broadcast` review/draft state, but there is still no audience-expansion authority, campaign table, or per-recipient delivery tracking for `booking` or `room`.
- Confidence effect: these decisions promote the narrowed `TASK-12` from 66% to 80% and isolate unresolved audience-expansion/campaign work in new `TASK-13` at 64%.

## Why TASK-13 was split
- The original TASK-13 still bundled two different broadcast problems: adding canonical campaign authority for the already-real `whole_hostel` shared channel, and inventing audience-expansion plus per-target delivery tracking for `booking` and `room`.
- The audit showed those are not equally ready. `whole_hostel` already has a deterministic thread/channel identity plus existing guest-read and operator-send seams, while `booking` and `room` still have no authority model, no target expansion rules, and no per-target delivery ledger.
- Keeping them together would either leave the task below the `IMPLEMENT` floor again or force a shortcut by pretending one shared broadcast thread is sufficient authority for all expanded audiences.

## Additional evidence reviewed (round 9)
- `apps/prime/src/lib/chat/directMessageChannel.ts`
- `apps/prime/src/types/messenger/chat.ts`
- `apps/prime/functions/lib/prime-messaging-repositories.ts`
- `apps/prime/functions/lib/prime-review-send.ts`
- `apps/prime/functions/lib/prime-thread-projection.ts`
- `apps/prime/functions/api/direct-messages.ts`
- `apps/prime/src/contexts/messaging/ChatProvider.tsx`
- `apps/prime/src/app/(guarded)/chat/channel/page.tsx`
- `apps/reception/src/lib/inbox/channel-adapters.server.ts`
- `apps/reception/src/lib/inbox/prime-review.server.ts`

## Resulting task split (round 9)
- `TASK-13`: Add Prime canonical whole-hostel campaign state and review semantics on top of the existing `broadcast_whole_hostel` thread/channel.
- `TASK-14`: Add Prime audience-expansion and delivery-tracking semantics for `booking` and `room` broadcast targets.

## Sequencing rationale (round 9)
- `TASK-13` goes first because Prime already has one concrete non-thread broadcast identity that maps cleanly across D1, Firebase projection, guest reads, and Reception review: `broadcast_whole_hostel`.
- `TASK-13` must stay scoped to canonical campaign state for `whole_hostel` because the current system already carries `campaign_id` on messages while lacking any authoritative campaign record or lifecycle table.
- `TASK-14` depends on `TASK-13` because `booking` and `room` expansion should build on a real campaign authority model instead of inventing target fan-out and campaign lifecycle in one step.

## TASK-13 promotion evidence
- Identity seam: `buildBroadcastChannelId('whole_hostel')` already produces the stable `broadcast_whole_hostel` thread/channel identity, so canonical campaign state can attach to a real existing lane rather than a hypothetical one.
- Storage seam: `message_records.campaign_id` already exists in D1 and `prime-messaging-repositories.ts` already threads `campaignId` through canonical message creation and Firebase projection payloads, so the missing piece is an authoritative campaign record rather than a new message shape.
- Transport seam: `projectPrimeThreadMessageToFirebase()` already validates broadcast metadata and writes to the deterministic shared Firebase channel for broadcast threads, which keeps `whole_hostel` campaign delivery bounded to one proven projection target.
- UI seam: `ChatProvider.tsx` and the Prime channel page already read/render broadcast messages with `audience` and rich promotion payloads, while Reception already exposes bounded `prime_broadcast` send through the Prime proxy. Campaign metadata can therefore be layered in without inventing a second operator surface first.
- Scope cut: there is still no target-expansion authority or per-target delivery model for `booking` or `room`; those audiences cannot be promoted without new canonical target tables/rules.
- Confidence effect: these decisions promote the narrowed `TASK-13` from 64% to 80% and isolate unresolved target expansion/delivery tracking in new `TASK-14` at 66%.

## Long-term decisions for TASK-14
- Campaign authority: add dedicated canonical campaign tables rather than overloading `message_threads`, `message_records`, or `message_projection_jobs` as the sole source of truth. Campaigns own lifecycle, targeting intent, and aggregate status.
- Target snapshotting: resolve the final delivery target set at send time and persist it canonically. In-flight campaigns do not mutate retroactively when room assignment or booking state changes later.
- Delivery ledger: store one canonical delivery row per resolved target with its own status, attempt metadata, error state, and projected message linkage. Replay operates on delivery rows, not on the whole campaign as one opaque unit.
- Booking delivery lane: `booking` campaigns deliver into stable booking-scoped broadcast threads/channels using deterministic IDs like `broadcast_booking_<bookingRef>`.
- Room delivery lane: `room` is a targeting lens, not a guest-visible shared channel. Room campaigns expand into the active booking targets for that room at send time, then deliver into the same booking-scoped broadcast threads/channels. This avoids leaking old room-channel history to future occupants.
- Whole-hostel boundary: `whole_hostel` remains the only shared broadcast lane. It does not become the implicit authority model for booking/room fan-out.
- Operator surface: Reception stays campaign-centric for authoring/review/send. It should show aggregate target counts and failure summaries, with delivery drill-down behind the Prime API, rather than exploding the inbox into one row per target delivery.
- Schema direction: evolve Prime schema to represent campaign identity and target identity explicitly, instead of encoding broadcast scope into `message_threads.booking_id` or synthetic placeholder values.

## Why TASK-14 was split
- The current TASK-14 still bundled three different responsibilities: designing the canonical campaign/delivery schema, defining the cross-app API seams for flexible campaign operations, and implementing booking/room audience expansion itself.
- The audit showed those responsibilities should not land together if we want a durable model that supports future product asks like "recommend to a friend", "you're invited to an event", and "book again and get a discount" without another schema reset.
- Keeping them together would pressure the implementation toward short-term broadcast fan-out shortcuts instead of a reusable campaign authority model.

## Additional evidence reviewed (round 10)
- `apps/prime/functions/lib/prime-messaging-repositories.ts`
- `apps/prime/functions/lib/prime-review-api.ts`
- `apps/prime/functions/lib/prime-review-send.ts`
- `apps/prime/functions/lib/prime-thread-projection.ts`
- `apps/prime/functions/api/review-thread-send.ts`
- `apps/reception/src/lib/inbox/prime-review.server.ts`
- `apps/reception/src/lib/inbox/channel-adapters.server.ts`
- `apps/prime/src/types/messenger/chat.ts`

## Resulting task split (round 10)
- `TASK-14A`: Add canonical campaign, target-snapshot, and per-target delivery schema/repository primitives for flexible Prime broadcast campaigns.
- `TASK-14B`: Add Prime campaign API seams and Reception campaign-centric proxy contracts for review, send, status, and replay flows.
- `TASK-14`: Add booking/room audience-expansion execution and delivery tracking on top of the canonical campaign schema + API seams.

## Sequencing rationale (round 10)
- `TASK-14A` must land first because long-term campaign flexibility depends on canonical campaign and delivery entities existing before any fan-out behavior is implemented.
- `TASK-14B` follows `TASK-14A` because the operator/API contract should target the real canonical schema, not a temporary route shape that would need to be broken later.
- `TASK-14` remains the actual audience-expansion implementation task, but it now depends on both precursors so runtime fan-out can stay narrow and mechanically correct.

## Promotion evidence for the precursor split
- Schema seam: Prime already proved the pattern of authoritative D1 entities plus Firebase projection through `message_threads`, `message_records`, `message_drafts`, and `message_projection_jobs`; campaign and per-target delivery should follow the same pattern rather than inventing Firebase-first state.
- API seam: Reception already integrates with Prime through bounded proxy methods in `prime-review.server.ts`, so adding campaign-centric APIs after canonical schema work is a localized extension, not a new integration model.
- Future-flexibility seam: the requested future campaign types ("recommend to a friend", invitations, return-booking discounts) need campaign-level metadata, eligibility/target snapshots, and per-target state. Those are schema/API concerns first, not fan-out implementation details.
- Confidence effect: these decisions promote `TASK-14A` to 83% and `TASK-14B` to 81%, while raising the later delivery execution task `TASK-14` to 80% once it is scoped strictly to expansion/runtime behavior on top of those precursors.
