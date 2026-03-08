---
Type: Architecture
Status: Active
Domain: Prime
Last-reviewed: 2026-03-08
Relates-to: docs/plans/prime-reception-unified-messaging/plan.md
---

# Prime + Reception Unified Messaging Architecture

## Summary
This architecture unifies agent-assisted guest messaging across Reception email and Prime in-app messaging without forcing both channels through the same transport or persistence layer. Email remains Gmail-backed with D1 operational state. Prime messaging moves toward D1-canonical operational state with Firebase retained only as a low-latency projection layer for live guest and staff views.

The shared layer is the drafting and template system, not the transport. Templates, interpretation, quality policy, and agent-draft orchestration are shared. Storage, sending, and delivery semantics remain channel-specific.

## Goals
- Let staff and agent-capable operators reach for the same reply templates across email and Prime.
- Let the agent draft Prime replies as well as email replies, using queue-driven reviewable drafts.
- Support rich Prime messaging payloads: links, images, cards, and promotional content.
- Support Prime broadcast audiences, including `whole_hostel`, without overloading 1:1 support threads.
- Keep audit, review, and automation state authoritative outside Firebase.

## Non-goals
- Do not move email transport or email thread truth into Firebase.
- Do not make Prime chat use Gmail-style draft/send models.
- Do not collapse email and Prime into one fake-unified database schema.

## Channel model

### Email
- Canonical transport truth: Gmail
- Canonical operational truth: D1 inbox tables
- Shared drafting engine output: email-rendered draft (`subject`, recipients, plain text, HTML)

### Prime direct support messaging
- Canonical operational truth target: D1 chat tables
- Live projection: Firebase
- Shared drafting engine output: Prime-rendered support message payload
- Audience: `thread`

### Prime broadcast/promotional messaging
- Canonical operational truth target: D1 broadcast/campaign tables
- Live projection: Firebase
- Shared drafting engine output: Prime-rendered promotional payload
- Audiences: `thread | booking | room | whole_hostel`

Broadcasts are not direct-message threads. They are a separate messaging lane with their own targeting, campaign metadata, and delivery rules.

## Canonical stores

### D1
D1 owns:
- chat threads
- chat messages
- chat draft records
- chat admissions / review outcomes
- automation state
- takeover / suppression flags
- audit events
- broadcast campaign state

### Firebase
Firebase owns only live projections for Prime:
- projected sent messages
- projected draft suggestions for fast UI refresh
- live feed / subscription experience

Firebase projection failure must never roll back the D1 write. Projection failures must be recorded as replayable events in D1.

### Gmail
Gmail remains the email delivery system. Email draft review continues to use the existing Reception email path.

## Shared drafting engine
Use one shared drafting core with channel adapters.

Shared inputs:
- inbound text
- normalized thread context
- guest / booking context
- channel (`email | prime_direct | prime_broadcast`)
- audience (`thread | booking | room | whole_hostel`)
- campaign mode (`support | promotion`)

Shared outputs before rendering:
- interpreted scenario / intent
- selected semantic template
- quality result
- escalation decision
- knowledge source references

Channel renderers:
- email renderer -> `subject`, recipients, plain text, HTML
- Prime direct renderer -> plain text + optional links / images / cards
- Prime broadcast renderer -> rich promotional payload + campaign metadata + audience

## Prime message model
Prime messages must support richer content than the current plain `content` string.

Required payload support:
- plain text content
- links to further reading or instructions
- images and non-image attachments
- promotional cards with CTA links
- message kind (`support | promotion | draft | system`)
- audience metadata, including `whole_hostel`
- optional draft metadata for projected agent suggestions

Legacy `content` remains as the plain-text fallback for compatibility.

## Agent-draft workflow

### Email
Keep the current queued Gmail draft workflow.

### Prime
Prime draft generation follows the same orchestration style as email:
1. Guest inbound message is written canonically.
2. A queue job is created immediately.
3. If staff reply first, the queued agent-draft path is suppressed.
4. If no staff reply exists and an eligible agent-capable operator session is present, the system creates a draft suggestion.
5. The draft is stored canonically.
6. The draft is projected to Firebase for fast Reception / Prime visibility when needed.
7. Staff can approve, edit, dismiss, or send.

Presence/capability gating is a first-class control. It must not be inferred from generic staff auth alone.

## Reception implications
Reception should present a unified workspace with channel adapters, not a single email-shaped schema. The UI layer needs normalized thread/message/draft primitives that both email and Prime can map into, while backend persistence stays channel-specific.

## Delivery phases

### Phase 1
- Persist architecture + plan artifacts
- Extend Prime message contracts to support rich support/promotional payloads
- Render richer Prime messages in the guest UI
- Add Prime channel helpers for future non-guest-direct lanes

### Phase 2
- Add D1-canonical Prime chat thread/message/draft tables
- Add inbound Prime direct-message shadow writes into D1 with admission/projection metadata while guest reads still use Firebase
- Add queue-backed Prime draft creation and admission records
- Add Reception Prime review surfaces, starting with a read-only feed backed by owner-gated Prime APIs
- Add explicit Prime `review_status` persistence so Reception review state (`pending | review_later | auto_archived | resolved | sent`) is not overloaded onto automation takeover state
- Add Prime current-draft save/edit APIs plus Reception Save-only draft support for prefixed Prime threads
- Add Prime direct-thread send APIs plus Reception send support for prefixed `prime_direct` threads, projecting the sent reply into the existing Firebase guest-read path before returning success

### Phase 3
- Add projection status/replay primitives for Prime direct-thread sent messages and drafts
- Add direct-thread repair tooling that can replay failed Firebase projections from canonical D1 state
- Add takeover, suppression, and replay tooling

### Phase 4
- Extend Prime operator send/edit flows into bounded shared broadcast-thread delivery on top of the canonical outbound contract
- Reuse deterministic broadcast channel IDs and Firebase shared-channel projection for existing broadcast review threads

### Phase 5
- Add whole-hostel campaign authoring + review flows on top of `broadcast_whole_hostel`
- Add canonical campaign state beyond one shared broadcast thread/channel

### Phase 6
- Add canonical campaign, target-snapshot, and per-target delivery schema beyond message/thread-only authority
- Model future-flexible campaign metadata so referrals, event invitations, and return-booking offers fit the same campaign system

### Phase 7
- Add campaign-centric Prime APIs and Reception proxy seams for review, send, status, and replay flows
- Keep the operator surface campaign-centric rather than exploding the inbox into one thread per delivery target

### Phase 8
- Add audience expansion + delivery tracking for `booking | room`
- Deliver `booking` campaigns into stable booking-scoped broadcast threads/channels
- Treat `room` as a targeting lens that expands into booking deliveries at send time rather than as a long-lived shared guest channel
- Record canonical target snapshots, per-target deliveries, and projection jobs for each expanded target rather than inferring delivery from one shared source thread
- Keep campaign/operator state `sent` even when some expanded targets fail projection; repair happens via per-target replay instead of reopening the campaign

Until the projection consumer lands, Prime direct-message writes may shadow-write canonical D1 state after the Firebase success path. That keeps current guest chat behavior stable while establishing the canonical thread/message/admission records needed for later Reception review and replay tooling.

Prime dismiss/resolve review actions can land before Prime send because they only mutate canonical review state. Prime send must wait for canonical outbound message creation plus projection/replay semantics so operator review state is not conflated with delivery state.
Prime draft save/edit can also land before Prime send because current-draft persistence is canonical D1 state; only delivery and replay stay deferred.
Prime direct-thread send can land before replay/broadcast work because it can reuse the existing Firebase direct-channel read path, while broader replay and audience fan-out semantics remain a separate delivery problem.
Prime direct-thread replay/repair can land before broadcast/promotional send because direct threads already have a concrete Firebase projection target, while the broadcast lane still lacks canonical audience expansion and delivery projection authority.
Prime now records direct-thread projection attempt metadata in D1 and exposes an owner-gated repair path that can replay failed or pending canonical message jobs into the existing Firebase guest-read channel.
Prime shared broadcast-thread send can land before broader audience-expansion work because Prime already has deterministic broadcast channel IDs plus guest Firebase reads for non-direct channels, while booking/room/whole-hostel expansion still lacks campaign authority and delivery tracking.
Prime now exposes owner-gated shared broadcast-thread send for existing `prime_broadcast` review threads, projecting sent promotional messages into the deterministic Firebase broadcast channel while keeping broader audience-expansion/campaign semantics deferred.
Prime whole-hostel campaign authority can land before booking/room expansion because `broadcast_whole_hostel` is already a real deterministic lane with canonical `campaign_id` plumbing, while `booking` and `room` still lack target authority and per-target delivery tracking.
Prime now persists canonical `message_campaigns` rows for the reusable `broadcast_whole_hostel` lane, exposes current campaign state in Prime review detail, and lets a new staff draft reopen the lane after a previous campaign was sent/resolved/archived.
Prime now also persists flexible campaign groundwork in D1 beyond the whole-hostel lane: campaign aggregate counters, target snapshots, and per-target delivery rows. This means later booking/room work no longer needs to invent canonical authority at runtime.
Prime now also exposes owner-gated campaign routes for create/read/update/send/replay, and Reception now consumes campaign detail as a first-class review object while still keeping the inbox list thread-centric. The bounded Prime proxy now switches broadcast sends onto campaign IDs when canonical campaign state exists, and the reusable `broadcast_whole_hostel` lane records one canonical whole-hostel target snapshot plus delivery row so campaign summaries and replay controls operate on real delivery entities instead of inferred thread state.
For the later booking/room phase, the long-term authority model is campaign -> target snapshot -> per-target delivery. `booking` maps to stable booking-scoped broadcast threads, while `room` expands to the active booking targets in that room at send time so future occupants do not inherit historical room-channel traffic.
This campaign authority model is intentionally broader than current hospitality broadcast needs so future asks like referrals, event invitations, and return-booking offers can reuse the same canonical campaign and delivery entities.
Prime now implements that authority model for runtime sends: booking campaigns resolve a single stable `broadcast_booking_<bookingRef>` lane, room campaigns resolve active booking targets from Firebase booking/room state at send time, and each expanded target gets its own canonical delivery row plus projection job state. Partial delivery failure no longer rolls back the campaign send; the operator-visible campaign stays sent while failed targets remain replayable through the canonical delivery/projection seam.

## Key decisions
- Shared drafting engine: yes
- Shared transport / storage: no
- Email in Firebase: no
- Prime rich support + promotion payloads: yes
- Prime broadcast lane separate from direct chat: yes
- D1 authoritative for operational state: yes
- Firebase projection only: yes
