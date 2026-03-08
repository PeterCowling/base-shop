---
Type: Plan
Status: Complete
Domain: Prime
Workstream: Engineering
Created: 2026-03-08
Last-reviewed: 2026-03-08
Last-updated: 2026-03-08 (TASK-14 completed; booking/room audience expansion and per-target delivery execution landed)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: prime-reception-unified-messaging
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas
Overall-confidence: 82%
Confidence-Method: direct code-path audit + replan into bounded adapter/schema/shadow-write/read-review/write-review/direct-send/replay/broadcast-thread/whole-hostel-campaign/flexible-campaign-schema/api/runtime slices
Auto-Build-Intent: plan+auto
---

# Prime + Reception Unified Messaging Plan

## Summary
Prime and Reception need one architecture for shared templates and agent drafting without collapsing email and in-app messaging into the same transport model. Email remains Gmail + D1 operational state; Prime moves toward D1-canonical chat/broadcast state with Firebase retained as a projection layer. The completed build slices landed Prime rich-message contracts/rendering, Reception channel adapters, Prime D1 storage primitives, a Prime inbound shadow-write path that records canonical thread/message/admission/projection state in D1 while preserving current Firebase chat behavior, a read-only Prime review feed inside Reception backed by owner-gated Prime APIs, a bounded Prime review-state mutation slice for dismiss/resolve, Prime draft-state save/edit support through the unified Reception inbox, direct-thread Prime send support with synchronous Firebase projection for prefixed `prime_direct` threads, direct-thread projection replay/repair tooling, bounded shared broadcast-thread send support for existing `prime_broadcast` review threads, canonical whole-hostel campaign authority on top of the reusable `broadcast_whole_hostel` lane, flexible campaign schema primitives for target snapshots plus per-target deliveries, campaign-centric Prime/Reception API seams that expose canonical campaign state, delivery summaries, and replayable delivery records without leaking D1 details across apps, and the final booking/room audience-expansion runtime that resolves send-time targets into booking-scoped delivery threads with partial-failure-safe replay metadata.

## Active tasks
- [x] TASK-01: Persist unified messaging architecture and implementation plan
- [x] TASK-02: Extend Prime messaging contracts for rich support/promotional payloads
- [x] TASK-03: Render rich Prime messages in the guest channel UI and refresh regression coverage
- [x] TASK-04: Introduce Reception inbox channel adapters and normalize email through the unified review contract
- [x] TASK-05: Add Prime D1 schema and repository primitives for chat threads, messages, drafts, and admissions
- [x] TASK-06: Shadow-write Prime inbound direct messages into D1 and persist admission/projection metadata
- [x] TASK-07: Add read-only Prime review APIs and surface Prime threads in Reception inbox list/detail flows
- [x] TASK-08: Add Prime review-state mutations and Reception operator actions for Prime dismiss/resolve flows
- [x] TASK-09: Add Prime draft-state APIs and Reception draft save/edit support for prefixed Prime threads
- [x] TASK-10: Add Prime direct-thread send APIs and Reception send support for prefixed Prime direct threads
- [x] TASK-11: Add Prime projection status/replay primitives and direct-thread repair tooling
- [x] TASK-12: Add Prime shared broadcast-thread send APIs and Reception operator send support for existing `prime_broadcast` review threads
- [x] TASK-13: Add Prime canonical whole-hostel campaign state and review semantics on top of the existing `broadcast_whole_hostel` thread/channel
- [x] TASK-14A: Add canonical campaign, target-snapshot, and per-target delivery schema/repository primitives for flexible Prime broadcast campaigns
- [x] TASK-14B: Add Prime campaign API seams and Reception campaign-centric proxy contracts for review, send, status, and replay flows
- [x] TASK-14: Add booking/room audience-expansion and delivery-tracking execution on top of the canonical campaign schema and API seams

## Goals
- Enable one drafting/template layer across Reception email and Prime messaging.
- Support Prime rich content including links, images, cards, and `whole_hostel` audience metadata.
- Prepare Prime for queued agent-draft suggestions without forcing Gmail semantics onto chat.

## Non-goals
- Move email storage or transport into Firebase.
- Complete the D1-canonical Prime cutover in this build cycle.
- Ship Reception Prime review UI in the same slice as the contract changes.

## Constraints & Assumptions
- Constraints:
  - Prime direct-message endpoints currently read and write Firebase directly.
  - Reception inbox types and draft flows are email-shaped today.
  - Tests run in CI only; local validation is limited to typecheck + lint.
- Assumptions:
  - BRIK is the initial business context for this shared messaging system.
  - Phase 1 can safely land Prime rich-message compatibility before D1 canonicalization.

## Inherited Outcome Contract
- **Why:** Shared templates and agent drafting need one drafting layer across email and Prime, while Prime also needs richer support/promotional payloads and broadcast audience support that the current plain direct-message model cannot represent.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Prime and Reception share a documented drafting architecture, and Prime gains rich-message contracts and rendering foundations for future D1-canonical draft/review flows.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/prime-reception-unified-messaging/architecture.md`
- Key findings used:
  - Reception draft generation logic is reusable at the interpretation/template level but email-shaped at the transport layer.
  - Prime direct-message contracts are currently plain-text Firebase records with guest-to-guest assumptions.
  - Prime guest UI cannot yet render rich support/promotional payloads or projected draft metadata.

## Proposed Approach
- Option A: Move both email and Prime into Firebase and reuse the email processing system end-to-end.
- Option B: Keep channel-specific stores/transports, share the drafting engine, and extend Prime contracts/rendering first.
- Chosen approach: Option B. The shared asset is the drafting engine and template catalog. Email and Prime keep channel-specific sending, persistence, and review semantics.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Persist architecture, dispatch, and plan artifacts for the shared messaging system | 95% | S | Complete (2026-03-08) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Extend Prime message contracts, channel helpers, and API normalization for rich support/promotional payloads | 86% | M | Complete (2026-03-08) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Render rich Prime messages in the channel UI and add/update regression coverage | 84% | M | Complete (2026-03-08) | TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Introduce Reception inbox channel adapters and normalize email through the unified review contract | 84% | M | Complete (2026-03-08) | TASK-03 | TASK-05 |
| TASK-05 | IMPLEMENT | Add Prime D1 schema and repository primitives for chat threads, messages, drafts, and admissions | 82% | M | Complete (2026-03-08) | TASK-04 | TASK-06 |
| TASK-06 | IMPLEMENT | Shadow-write Prime inbound direct messages into D1 and persist admission/projection metadata | 83% | M | Complete (2026-03-08) | TASK-05 | TASK-07 |
| TASK-07 | IMPLEMENT | Add read-only Prime review APIs and surface Prime threads in Reception inbox list/detail flows | 83% | M | Complete (2026-03-08) | TASK-04, TASK-06 | TASK-08 |
| TASK-08 | IMPLEMENT | Add Prime review-state mutations and Reception operator actions for Prime dismiss/resolve flows | 82% | M | Complete (2026-03-08) | TASK-07 | TASK-09 |
| TASK-09 | IMPLEMENT | Add Prime draft-state APIs and Reception draft save/edit support for prefixed Prime threads | 81% | M | Complete (2026-03-08) | TASK-08 | TASK-10 |
| TASK-10 | IMPLEMENT | Add Prime direct-thread send APIs and Reception send support for prefixed Prime direct threads | 81% | M | Complete (2026-03-08) | TASK-09 | TASK-11 |
| TASK-11 | IMPLEMENT | Add Prime projection status/replay primitives and direct-thread repair tooling | 81% | M | Complete (2026-03-08) | TASK-10 | TASK-12 |
| TASK-12 | IMPLEMENT | Add Prime shared broadcast-thread send APIs and Reception operator send support for existing `prime_broadcast` review threads | 80% | M | Complete (2026-03-08) | TASK-11 | TASK-13 |
| TASK-13 | IMPLEMENT | Add Prime canonical whole-hostel campaign state and review semantics on top of the existing `broadcast_whole_hostel` thread/channel | 80% | M | Complete (2026-03-08) | TASK-12 | TASK-14A |
| TASK-14A | IMPLEMENT | Add canonical campaign, target-snapshot, and per-target delivery schema/repository primitives for flexible Prime broadcast campaigns | 83% | M | Complete (2026-03-08) | TASK-13 | TASK-14B, TASK-14 |
| TASK-14B | IMPLEMENT | Add Prime campaign API seams and Reception campaign-centric proxy contracts for review, send, status, and replay flows | 81% | M | Complete (2026-03-08) | TASK-14A | TASK-14 |
| TASK-14 | IMPLEMENT | Add booking/room audience-expansion and delivery-tracking execution on top of the canonical campaign schema and API seams | 80% | L | Complete (2026-03-08) | TASK-14A, TASK-14B | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Persist the architecture and build contract first |
| 2 | TASK-02 | TASK-01 | Contract changes before rendering changes |
| 3 | TASK-03 | TASK-02 | UI and tests should follow the contract update |
| 4 | TASK-04 | TASK-03 | Adapter contract lands before Prime review/D1 work |
| 5 | TASK-05 | TASK-04 | D1 schema/repository work follows the unified Reception review contract |
| 6 | TASK-06 | TASK-05 | Shadow-write canonical Prime state before Reception consumes it |
| 7 | TASK-07 | TASK-04, TASK-06 | Prime review reads land before any operator mutations |
| 8 | TASK-08 | TASK-07 | Prime resolve/dismiss depends on the read contract plus an explicit review-state model |
| 9 | TASK-09 | TASK-08 | Prime draft-state support depends on review-state mutations and a per-action capability model in Reception |
| 10 | TASK-10 | TASK-09 | Prime direct-thread send depends on canonical draft-state plus the existing owner-gated Prime proxy seam |
| 11 | TASK-11 | TASK-10 | Direct-thread replay/repair depends on the bounded direct-thread send contract landing first |
| 12 | TASK-12 | TASK-11 | Shared broadcast-thread send should build on the projection repair contract instead of inventing a separate failure model |
| 13 | TASK-13 | TASK-12 | Whole-hostel campaign authority should build on the proven shared broadcast-thread send path before broader target expansion |
| 14 | TASK-14A | TASK-13 | Flexible booking/room campaigns need canonical campaign and per-target delivery entities before any runtime fan-out |
| 15 | TASK-14B | TASK-14A | Campaign APIs and Reception proxy seams should target the real canonical schema, not a temporary route shape |
| 16 | TASK-14 | TASK-14A, TASK-14B | Booking/room audience expansion should execute only after schema and API seams are stable |

## Tasks

### TASK-01: Persist unified messaging architecture and implementation plan
- **Type:** IMPLEMENT
- **Deliverable:** architecture + dispatch + plan artifacts under `docs/plans/prime-reception-unified-messaging/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-08)
- **Affects:** `docs/plans/prime-reception-unified-messaging/architecture.md`, `docs/plans/prime-reception-unified-messaging/dispatch.v2.json`, `docs/plans/prime-reception-unified-messaging/plan.md`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 95%
  - Implementation: 97% - Straightforward persisted artifact work.
  - Approach: 95% - Matches audited architecture direction from the current code.
  - Impact: 93% - Gives the build a stable contract and sequence.
- **Acceptance:**
  - The architecture doc captures canonical stores, shared drafting, Prime rich-message support, and the agent-draft workflow.
  - The plan defines a bounded first build slice and the larger follow-on task.
  - The dispatch packet records the operator idea and intended outcome.
- **Validation contract (TC-01):**
  - TC-01: Plan artifacts exist and remain internally consistent -> paths and outcome contract align.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: None: S-sized documentation task.
  - Validation artifacts: persisted files.
  - Unexpected findings: None expected.
- **Scouts:** None: architecture decisions already audited in-code.
- **Edge Cases & Hardening:** Ensure the first slice does not over-promise full D1 cutover delivery.
- **What would make this >=90%:**
  - Already above threshold.
- **Rollout / rollback:**
  - Rollout: reference the plan for subsequent build tasks.
  - Rollback: remove or supersede the plan folder.
- **Documentation impact:**
  - Creates the canonical architecture doc for this workstream.
- **Notes / references:**
  - `apps/reception/src/lib/inbox/draft-pipeline.server.ts`
  - `apps/prime/functions/api/direct-message.ts`

### TASK-02: Extend Prime messaging contracts for rich support/promotional payloads
- **Type:** IMPLEMENT
- **Deliverable:** Prime message types, channel helpers, and direct-message API normalization that can represent support, promotion, and projected draft payloads
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Affects:** `apps/prime/src/types/messenger/chat.ts`, `apps/prime/src/lib/chat/directMessageChannel.ts`, `apps/prime/functions/api/direct-message.ts`, `apps/prime/functions/api/direct-messages.ts`, `apps/prime/functions/__tests__/direct-message.test.ts`, `apps/prime/functions/__tests__/direct-messages.test.ts`, `eslint.config.mjs`, `[readonly] docs/plans/prime-reception-unified-messaging/architecture.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 86%
  - Implementation: 87% - Prime contract surface is localized and already under test.
  - Approach: 86% - Rich payloads can extend the existing schema without breaking plain-text callers.
  - Impact: 85% - This enables future support/promotional/draft projection paths with minimal immediate churn.
- **Acceptance:**
  - Prime message contracts support links, attachments, cards, audience metadata, message kind, and optional draft metadata.
  - Direct-message reads can normalize richer Firebase records while preserving legacy plain-text compatibility.
  - Direct-message writes stamp sane defaults for guest support messages.
- **Validation contract (TC-02):**
  - TC-01: existing plain direct-message request shape still succeeds -> backward-compatible write path
  - TC-02: richer stored records with links/cards/attachments normalize into typed Prime messages -> future staff/agent payloads renderable
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: `pnpm --filter @apps/prime typecheck` (passed); `pnpm --filter @apps/prime lint` (completed)
  - Validation artifacts: Prime typecheck pass output; Prime lint output with warnings only
  - Unexpected findings: Prime lint path was pathologically slow until `eslint.config.mjs` was narrowed to Prime-specific tsconfig scopes and non-UI Prime functions had DS rules disabled
- **Scouts:** Confirm current UI and poller assumptions only require `content` as fallback text.
- **Edge Cases & Hardening:** Keep guest send path text-only for now; the richer schema is primarily for projected outbound/staff/agent messages in this slice.
- **What would make this >=90%:**
  - Add explicit D1 schema and outbound projection writer in a follow-on task.
- **Rollout / rollback:**
  - Rollout: deploy Prime with backward-compatible message parsing.
  - Rollback: revert the contract additions and renderer usage; plain-text behavior remains.
- **Documentation impact:**
  - Architecture doc remains the reference for why rich metadata exists before D1 cutover.
- **Notes / references:**
  - `apps/prime/functions/api/direct-message.ts`
  - `apps/prime/functions/api/direct-messages.ts`

### TASK-03: Render rich Prime messages in the channel UI and add/update regression coverage
- **Type:** IMPLEMENT
- **Deliverable:** Prime channel page rendering for links, cards, images, attachments, draft badges, and `whole_hostel` audience badges
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Affects:** `apps/prime/src/contexts/messaging/ChatProvider.tsx`, `apps/prime/src/app/(guarded)/chat/channel/page.tsx`, `apps/prime/src/types/messenger/chat.ts`, `apps/prime/functions/__tests__/direct-messages.test.ts`
- **Depends on:** TASK-02
- **Blocks:** TASK-04
- **Confidence:** 84%
  - Implementation: 85% - Existing channel page and poller are localized surfaces.
  - Approach: 84% - UI can render richer payloads with a plain-text fallback path intact.
  - Impact: 83% - Makes the new schema user-visible and validates its utility.
- **Acceptance:**
  - Guest UI displays rich links, cards, and image attachments when present.
  - Promotional or draft-projected messages surface clear labels without breaking standard guest chat.
  - Localized plain-text behavior remains intact for old messages.
- **Validation contract (TC-03):**
  - TC-01: plain-text activity/direct messages still render with no regressions
  - TC-02: rich Prime messages render visible CTAs/images/audience badges without crashing when optional fields are absent
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: `pnpm --filter @apps/prime typecheck` (passed); `pnpm --filter @apps/prime lint` (completed with warnings only)
  - Validation artifacts: Prime typecheck pass output; Prime lint output
  - Unexpected findings: Remaining lint findings are warnings in `apps/prime/src/app/(guarded)/chat/channel/page.tsx` for DS layout/tap-size guidance, not blocking errors
- **Scouts:** Ensure guest composer remains text-only in this slice.
- **Edge Cases & Hardening:** Rich payload arrays may be partially populated; renderer must degrade gracefully.
- **What would make this >=90%:**
  - Add screenshot-based QA coverage after the richer payload path is wired into a real projected message source.
- **Rollout / rollback:**
  - Rollout: Prime UI reads richer payloads if present, no migration required.
  - Rollback: remove renderer branches and keep `content`/`imageUrl` only.
- **Documentation impact:**
  - None beyond architecture alignment.
- **Notes / references:**
  - `apps/prime/src/app/(guarded)/chat/channel/page.tsx`
  - `apps/prime/src/contexts/messaging/ChatProvider.tsx`

### TASK-04: Introduce Reception inbox channel adapters and normalize email through the unified review contract
- **Type:** IMPLEMENT
- **Deliverable:** Reception inbox channel-adapter contract, email adapter implementation, and channel-aware draft review UI that no longer assumes Gmail-only semantics
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Affects:** `apps/reception/src/lib/inbox/api-models.server.ts`, `apps/reception/src/lib/inbox/channels.ts`, `apps/reception/src/lib/inbox/channel-adapters.server.ts`, `apps/reception/src/services/useInbox.ts`, `apps/reception/src/components/inbox/ThreadList.tsx`, `apps/reception/src/components/inbox/ThreadDetailPane.tsx`, `apps/reception/src/components/inbox/DraftReviewPanel.tsx`, `apps/reception/src/components/inbox/__tests__/filters.test.ts`, `apps/reception/src/lib/inbox/__tests__/channel-adapters.server.test.ts`, `[readonly] docs/plans/prime-reception-unified-messaging/architecture.md`
- **Depends on:** TASK-03
- **Blocks:** TASK-05
- **Confidence:** 84%
  - Implementation: 85% - Reception inbox models/routes/components are localized and already expose the seams that need normalization.
  - Approach: 84% - Channel metadata and capability adapters can wrap the existing email workflow without changing transport semantics.
  - Impact: 83% - This removes the biggest blocker to Prime review reuse by stopping further Gmail-specific leakage in Reception.
- **Acceptance:**
  - Reception inbox APIs expose channel, lane, review mode, and draft capabilities through a shared adapter contract.
  - Current email inbox behavior remains intact while flowing through the adapter layer.
  - Draft review UI labels and validation read from channel capabilities rather than hardcoding email-only semantics.
- **Validation contract (TC-04):**
  - TC-01: email inbox list/detail responses still serialize correctly while including channel adapter metadata
  - TC-02: draft review UI still requires email subject/recipients today, but can render future non-email review modes without assuming those fields exist
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: code-path audit across Reception inbox server/client surfaces; `pnpm --filter @apps/reception typecheck`; `pnpm --filter @apps/reception lint`
  - Validation artifacts: `docs/plans/prime-reception-unified-messaging/replan-notes.md`; Reception typecheck pass; Reception lint pass with warnings only
  - Unexpected findings: lint warnings remain in inbox and unrelated bar/user-management components for DS layout-primitives guidance, but there were no task-local lint errors after replacing raw typography utilities
- **Scouts:** Confirmed current Reception inbox shape is concentrated in `api-models.server.ts`, `useInbox.ts`, and inbox UI components.
- **Edge Cases & Hardening:** Unknown/missing channel metadata must default to email so existing rows remain valid.
- **What would make this >=90%:**
  - Add route-level assertions covering the new adapter metadata once the stale inbox route tests are refreshed.
- **Rollout / rollback:**
  - Rollout: deploy Reception with email still backed by the same D1/Gmail flow, now behind adapter metadata.
  - Rollback: remove the adapter metadata/types and keep the existing email review surface.
- **Documentation impact:**
  - Aligns Reception implementation with the architecture doc’s “channel adapters” decision.
- **Notes / references:**
  - `apps/reception/src/lib/inbox/api-models.server.ts`
  - `apps/reception/src/components/inbox/DraftReviewPanel.tsx`
  - 2026-03-08: Completed by adding shared inbox channel descriptors, an email adapter implementation, channel-aware inbox serialization, and capability-driven review UI labels/validation.

### TASK-05: Add Prime D1 schema and repository primitives for chat threads, messages, drafts, and admissions
- **Type:** IMPLEMENT
- **Deliverable:** Prime D1 tables/migrations and repository helpers covering canonical threads, messages, drafts, admissions, and projection replay metadata
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Affects:** `apps/prime/wrangler.toml`, `apps/prime/migrations/*`, `apps/prime/functions/lib/*`, `[readonly] apps/reception/migrations/0001_inbox_init.sql`, `[readonly] docs/plans/prime-reception-unified-messaging/architecture.md`
- **Depends on:** TASK-04
- **Blocks:** TASK-06
- **Confidence:** 82%
  - Implementation: 83% - Reception’s D1 inbox patterns provide a strong local reference and the Prime repository/module placement is now fixed.
  - Approach: 82% - Binding name, migration location, and projection replay table shape are now decided, leaving bounded code work.
  - Impact: 81% - This is the authoritative data seam required before any reliable draft/review orchestration.
- **Acceptance:**
  - Prime has D1 migrations and bindings for canonical messaging state.
  - Repository helpers can create/read threads, messages, drafts, and admission records without Firebase as the source of truth.
  - Projection/replay metadata exists so Firebase failures do not roll back D1 writes.
- **Validation contract (TC-05):**
  - TC-01: repository helpers can persist and read canonical Prime thread/message/draft state against the D1 contract
  - TC-02: projection replay metadata is stored alongside canonical writes without altering chat payload semantics
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: migration pattern review against Reception inbox D1 setup; Prime queue/runtime audit against `process-messaging-queue.ts` and `messaging-dispatcher.ts`; `pnpm --filter @apps/prime typecheck`; `pnpm --filter @apps/prime lint`
  - Validation artifacts: `docs/plans/prime-reception-unified-messaging/replan-notes.md`; Prime typecheck pass; Prime lint pass with warnings only
  - Unexpected findings: Prime still lacks a provisioned D1 database id, so the binding uses repo-standard placeholder wiring; lint warnings remain in the new repository file for SQL string copy-detection and in the existing chat page for DS guidance, but there were no task-local lint errors
- **Scouts:** Binding name fixed to `PRIME_MESSAGING_DB`; migration file fixed to `apps/prime/migrations/0001_prime_messaging_init.sql`; repository placement fixed under `apps/prime/functions/lib/`.
- **Edge Cases & Hardening:** idempotent replay, migration rollback posture, and preserving Firebase projection compatibility during cutover.
- **What would make this >=90%:**
  - Validate the repository helpers against one real local D1 database after the binding is provisioned.
- **Rollout / rollback:**
  - Rollout: add migrations and repository layer behind unused runtime paths first.
  - Rollback: remove the new binding/migrations and keep Firebase-only reads/writes.
- **Documentation impact:**
  - Architecture doc will need a schema appendix once this task starts.
- **Notes / references:**
  - `apps/reception/migrations/0001_inbox_init.sql`
  - `apps/reception/src/lib/inbox/repositories.server.ts`
  - 2026-03-08: Completed by adding `PRIME_MESSAGING_DB` binding wiring, the initial `message_*` D1 schema, and Prime repository helpers for threads, messages, drafts, admissions, and projection jobs.

### TASK-06: Shadow-write Prime inbound direct messages into D1 and persist admission/projection metadata
- **Type:** IMPLEMENT
- **Deliverable:** Prime direct-message write path persists canonical D1 thread/message state plus admission/projection metadata while preserving the existing Firebase transport path
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Affects:** `apps/prime/functions/api/direct-message.ts`, `apps/prime/functions/lib/prime-messaging-db.ts`, `apps/prime/functions/lib/prime-messaging-repositories.ts`, `apps/prime/functions/lib/prime-messaging-shadow-write.ts`, `apps/prime/functions/__tests__/direct-message.test.ts`, `apps/prime/functions/__tests__/prime-messaging-repositories.test.ts`, `[readonly] docs/plans/prime-reception-unified-messaging/architecture.md`
- **Depends on:** TASK-05
- **Blocks:** TASK-07
- **Confidence:** 83%
  - Implementation: 84% - The runtime entry point is localized to `direct-message.ts`, and the missing repository seams are bounded.
  - Approach: 82% - A D1 shadow-write is the correct next step while Prime reads still depend on Firebase.
  - Impact: 83% - This creates canonical inbound state and replay metadata for later review/projection work without risking current guest chat behavior.
- **Acceptance:**
  - Successful Prime guest direct-message writes continue to project to Firebase as they do today.
  - When `PRIME_MESSAGING_DB` is present, the same write also persists/updates canonical D1 thread state, stores the inbound message record, records an admission decision for later automation, and enqueues a replayable projection job.
  - Existing suppressed or staff-active takeover state in D1 results in deterministic suppression/manual-takeover admission records instead of queued automation.
- **Validation contract (TC-06):**
  - TC-01: successful direct-message writes still create Firebase channel/message records -> no guest chat regression on current transport
  - TC-02: when D1 is configured, the same write persists canonical thread/message/admission/projection rows with queued automation metadata
  - TC-03: when an existing D1 thread is already in `staff_active` or `suppressed`, the admission record is written with the matching suppression/takeover outcome
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: architecture + Prime/Reception flow audit against current direct-message write/read paths and staff auth seams; `pnpm --filter @apps/prime typecheck`; `pnpm --filter @apps/prime lint`
  - Validation artifacts: `docs/plans/prime-reception-unified-messaging/replan-notes.md`; Prime typecheck pass; Prime lint pass with warnings only
  - Unexpected findings: current guest read path still depends on Firebase, so full D1 authority must remain a later phase; lint warnings remain limited to existing DS guidance in the Prime chat page plus repository SQL-string copy warnings
- **Scouts:** Confirm the canonical write can remain additive while `direct-messages.ts` still hydrates from Firebase.
- **Edge Cases & Hardening:** D1 binding absent in some environments, existing thread takeover states, idempotent projection replay IDs, and preserving channel member metadata across repeated writes.
- **What would make this >=90%:**
  - Land the follow-on projection consumer and move Prime reads off Firebase.
- **Rollout / rollback:**
  - Rollout: deploy as an additive shadow-write path; environments without `PRIME_MESSAGING_DB` keep current Firebase-only behavior.
  - Rollback: remove the D1 shadow-write helper call and repository upsert additions, leaving Firebase writes untouched.
- **Documentation impact:**
  - Add explicit shadow-write notes to the architecture doc when this task starts.
- **Notes / references:**
  - `apps/prime/functions/api/direct-message.ts`
  - `apps/prime/functions/lib/prime-messaging-repositories.ts`
  - 2026-03-08: Completed by adding Prime thread upsert/lookups, a `prime-messaging-shadow-write` helper, D1 shadow-write wiring in `/api/direct-message`, repository/test helper coverage, and architecture notes for the staged shadow-write phase.

### TASK-07: Add read-only Prime review APIs and surface Prime threads in Reception inbox list/detail flows
- **Type:** IMPLEMENT
- **Deliverable:** Prime exposes read-only review list/detail APIs from canonical D1 state, and Reception surfaces those threads in the adapter-backed inbox with capability-driven read-only UI treatment
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Affects:** `apps/prime/functions/api/*`, `apps/prime/functions/lib/*`, `apps/prime/functions/__tests__/*`, `apps/reception/src/app/api/mcp/inbox/*`, `apps/reception/src/lib/inbox/*`, `apps/reception/src/components/inbox/*`, `apps/reception/src/services/useInbox.ts`, `[readonly] docs/plans/prime-reception-unified-messaging/architecture.md`
- **Depends on:** TASK-04, TASK-06
- **Blocks:** TASK-08
- **Confidence:** 83%
  - Implementation: 84% - The missing seams are now bounded to Prime read APIs, Reception proxying, and capability-driven UI gating.
  - Approach: 82% - Read-only review is the correct next slice because Reception cannot safely call Prime write actions yet.
  - Impact: 83% - This gives operators one inbox surface for email + Prime without faking unfinished Prime mutation support.
- **Acceptance:**
  - Prime provides owner-gated read-only review list/detail APIs backed by canonical D1 threads/messages/admissions.
  - Reception inbox APIs can merge Prime review candidates into the existing list/detail workspace as `prime_direct` or `prime_broadcast` rows.
  - Reception UI treats Prime rows as read-only in this phase, using channel capabilities rather than email-specific assumptions to disable unavailable actions.
  - Email review paths remain unchanged.
- **Validation contract (TC-07):**
  - TC-01: Prime read APIs serialize canonical D1 threads/messages/admissions into a stable review contract when owner-gated access is present
  - TC-02: Reception inbox list/detail responses can include Prime-backed rows without breaking current email rows
  - TC-03: Prime review rows expose read-only message-draft capabilities and omit email-only subject/recipient requirements cleanly
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: Reception inbox route/model/UI audit plus Prime canonical thread state and staff-owner gate audit; `pnpm --filter @apps/prime typecheck`; `pnpm --filter @apps/prime lint`; `pnpm --filter @apps/reception typecheck`; `pnpm --filter @apps/reception lint`
  - Validation artifacts: `docs/plans/prime-reception-unified-messaging/replan-notes.md`; Prime typecheck pass; Prime lint pass with warnings only; Reception typecheck pass; Reception lint pass with warnings only
  - Unexpected findings: Prime and Reception do not share a D1 binding or auth token today, so the safe integration path is a Prime read API plus Reception proxy rather than cross-app DB reads; remaining lint findings are warnings only in existing Prime/Reception UI surfaces plus repository SQL-string copy warnings
- **Scouts:** Confirm the exact Prime review list/detail serialization contract and Reception capability flags for read-only channels.
- **Edge Cases & Hardening:** missing Prime API env config in Reception, mixed email/Prime inbox sorting, prefixed thread IDs, and surfaced takeover/suppression context without enabling broken actions.
- **What would make this >=90%:**
  - Land the follow-on Prime mutation routes and remove the read-only gating for supported actions.
- **Rollout / rollback:**
  - Rollout: ship read-only Prime review first, then add approve/send actions in a later bounded slice.
  - Rollback: remove Prime rows from the adapter-backed inbox and leave email-only review intact.
- **Documentation impact:**
  - Add explicit read-only Prime review surface notes to the architecture doc when this task starts.
- **Notes / references:**
  - `apps/reception/src/app/api/mcp/inbox/route.ts`
  - `apps/reception/src/app/api/mcp/inbox/[threadId]/route.ts`
  - 2026-03-08: Completed by adding owner-gated Prime review list/detail APIs, Prime review serialization/helpers, a Reception Prime review proxy/adapter, read-only capability flags for Prime channels, and inbox route coverage for merged email + Prime views.

### TASK-08: Add Prime review-state mutations and Reception operator actions for Prime dismiss/resolve flows
- **Type:** IMPLEMENT
- **Deliverable:** Prime review-status persistence plus owner-gated Prime dismiss/resolve APIs and Reception operator actions for prefixed Prime threads
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Affects:** `apps/prime/migrations/*`, `apps/prime/functions/api/*`, `apps/prime/functions/lib/*`, `apps/prime/functions/__tests__/*`, `apps/reception/src/app/api/mcp/inbox/*`, `apps/reception/src/lib/inbox/prime-review.server.ts`, `apps/reception/src/lib/inbox/channel-adapters.server.ts`, `apps/reception/src/components/inbox/DraftReviewPanel.tsx`, `apps/reception/src/services/useInbox.ts`, `apps/reception/src/app/api/mcp/__tests__/*`, `[readonly] docs/plans/prime-reception-unified-messaging/architecture.md`
- **Depends on:** TASK-07
- **Blocks:** TASK-09
- **Confidence:** 82%
  - Implementation: 83% - The affected surfaces are localized: Prime thread persistence/review routes plus Reception action proxies.
  - Approach: 81% - Adding an explicit Prime review-status field avoids overloading `takeover_state` with queue semantics it was not designed to carry.
  - Impact: 82% - This closes the bounded operator review loop for Prime without conflating it with outbound send/projection work.
- **Acceptance:**
  - Prime threads persist an explicit review status separate from takeover/suppression state.
  - Reception operators can resolve or dismiss prefixed Prime threads without breaking the existing email mutation flows.
  - Prime dismiss/resolve routes update canonical D1 review state and audit/admission metadata consistently.
- **Validation contract (TC-08):**
  - TC-01: Prime review mutation routes enforce owner/staff access and persist expected review-state transitions in D1
  - TC-02: new inbound Prime shadow writes reopen resolved/archived review state appropriately instead of pinning the thread closed forever
  - TC-03: Reception invokes Prime resolve/dismiss routes only for prefixed Prime threads and leaves email routes unchanged
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: targeted code-path audit across Prime thread schema, shadow-write logic, Reception action routes, and inbox capability gating
  - Validation artifacts: `docs/plans/prime-reception-unified-messaging/replan-notes.md`
  - Unexpected findings: outbound send still needs separate canonical message/projection semantics, so it remains deferred
- **Scouts:** Confirmed Prime already has a bounded owner-gated read API seam and D1 thread/admission tables suitable for review-state mutations.
- **Edge Cases & Hardening:** repeated resolve/dismiss actions, new inbound messages after a resolved/archived review state, and Prime/email route separation.
- **What would make this >=90%:**
  - Add a follow-on replay worker and explicit operator audit event stream for Prime review actions.
- **Rollout / rollback:**
  - Rollout: enable Prime resolve/dismiss first while leaving send/edit actions disabled.
  - Rollback: keep Prime threads read-only in Reception while leaving Prime read APIs intact.
- **Documentation impact:**
  - Add explicit Prime review-state semantics to the architecture doc when this task starts.
- **Notes / references:**
  - `apps/prime/functions/api/direct-message.ts`
  - `apps/reception/src/components/inbox/DraftReviewPanel.tsx`
  - 2026-03-08: Completed by adding `review_status` to Prime thread state via `0002_prime_messaging_review_status.sql`, reopening that review state on new inbound shadow writes, landing owner-gated Prime dismiss/resolve APIs, wiring Reception resolve/dismiss routes through the Prime proxy for prefixed thread IDs, and enabling bounded Prime thread mutations in the channel adapter contract.

### TASK-09: Add Prime draft-state APIs and Reception draft save/edit support for prefixed Prime threads
- **Type:** IMPLEMENT
- **Deliverable:** Prime current-draft read/write APIs, Reception Prime draft proxy routes, and per-action draft capability controls that unlock Save before Regenerate/Send
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Affects:** `apps/prime/functions/api/*`, `apps/prime/functions/lib/*`, `apps/prime/functions/__tests__/*`, `apps/reception/src/app/api/mcp/inbox/*`, `apps/reception/src/lib/inbox/*`, `apps/reception/src/components/inbox/*`, `apps/reception/src/services/useInbox.ts`, `[readonly] docs/plans/prime-reception-unified-messaging/architecture.md`
- **Depends on:** TASK-08
- **Blocks:** TASK-10
- **Confidence:** 81%
  - Implementation: 82% - The missing surfaces are localized: Prime draft serialization/repositories, Prime owner-gated draft APIs, and Reception draft capability gating/proxy routes.
  - Approach: 80% - Draft persistence can land safely before delivery if Reception stops treating Save, Regenerate, and Send as one capability.
  - Impact: 81% - This unlocks canonical Prime draft review/editing without forcing premature delivery semantics.
- **Acceptance:**
  - Prime review detail surfaces expose the current canonical draft, if any, for prefixed Prime threads.
  - Reception operators can save/edit Prime drafts through the unified inbox without enabling unsupported Prime regenerate/send actions.
  - Prime draft writes stay canonical in D1 and do not regress existing email draft flows.
- **Validation contract (TC-09):**
  - TC-01: Prime draft APIs create or update the current canonical draft with race-safe status handling and preserve prior non-staff draft history
  - TC-02: Reception only exposes supported Prime draft actions (Save/Edit) while keeping Regenerate/Send disabled for Prime channels
  - TC-03: Reception invokes Prime draft routes only for prefixed Prime threads and leaves existing email draft routes unchanged
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: targeted audit across Prime draft tables, review detail serialization, Reception draft routes, and inbox UI action gating; `pnpm --filter @apps/prime typecheck`; `pnpm --filter @apps/prime lint`; `pnpm --filter @apps/reception typecheck`; `pnpm --filter @apps/reception lint`
  - Validation artifacts: `docs/plans/prime-reception-unified-messaging/replan-notes.md`; Prime typecheck pass; Prime lint pass with warnings only; Reception typecheck pass; Reception lint pass with warnings only
  - Unexpected findings: outbound delivery/projection remains unresolved, so send is deferred into TASK-10
- **Scouts:** Confirm the Prime draft table and Reception draft panel can support Save without implying Regenerate/Send are available.
- **Edge Cases & Hardening:** staff editing over an existing agent suggestion, closed Prime threads, and mixed email/Prime draft route dispatch.
- **What would make this >=90%:**
  - Add explicit queue-backed draft generation so Regenerate can be enabled through the same draft contract.
- **Rollout / rollback:**
  - Rollout: enable Prime Save/Edit first while keeping Regenerate/Send disabled.
  - Rollback: keep Prime resolve/dismiss enabled while returning Prime draft editing to read-only.
- **Documentation impact:**
  - Add explicit Prime draft-state semantics to the architecture doc when this task starts.
- **Notes / references:**
  - `apps/prime/functions/lib/prime-messaging-repositories.ts`
  - `apps/reception/src/app/api/mcp/inbox/[threadId]/draft/route.ts`
  - Completion notes:
    - Prime review detail now exposes `currentDraft`, and Prime owner-gated review draft writes update/create canonical staff drafts in D1 before returning refreshed detail.
    - Reception draft routes now proxy prefixed Prime threads through Prime review APIs, and the draft review UI uses per-action capabilities so Prime can support Save while Regenerate/Send remain disabled.

### TASK-10: Add Prime direct-thread send APIs and Reception send support for prefixed Prime direct threads
- **Type:** IMPLEMENT
- **Deliverable:** Prime direct-thread send APIs, canonical outbound message/draft state transitions, and Reception send proxy support for prefixed Prime direct threads
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Affects:** `apps/prime/functions/api/*`, `apps/prime/functions/lib/*`, `apps/prime/functions/__tests__/*`, `apps/reception/src/app/api/mcp/inbox/*`, `apps/reception/src/lib/inbox/*`, `apps/reception/src/components/inbox/*`, `apps/reception/src/services/useInbox.ts`, `docs/plans/prime-reception-unified-messaging/architecture.md`
- **Depends on:** TASK-09
- **Blocks:** TASK-11
- **Confidence:** 81%
  - Implementation: 82% - The bounded direct-thread surfaces are localized: Prime review send route, canonical message/draft/thread transitions, synchronous Firebase projection, and the existing Reception send proxy.
  - Approach: 80% - Prime direct-thread send can reuse the current Firebase guest-read path while establishing canonical outbound authority in D1 before success is returned.
  - Impact: 80% - This closes the operator loop for Prime support threads without over-claiming replay or broadcast delivery.
- **Acceptance:**
  - Reception operators can send supported Prime drafts for prefixed `prime_direct` threads through the unified inbox.
  - Prime direct-thread send creates canonical outbound message records, marks the current draft sent, updates review state to `sent`, and records the send admission.
  - Prime direct-thread send projects the sent message into the existing Firebase direct-channel path before the API returns success so guest-visible chat behavior does not regress.
- **Validation contract (TC-10):**
  - TC-01: Prime direct-thread send routes create canonical outbound message/draft/thread/projection records with race-safe state transitions
  - TC-02: Prime direct-thread send synchronously writes the expected Firebase message payload for the existing guest read path
  - TC-03: Reception invokes Prime send actions only for supported prefixed Prime direct threads and preserves existing email send behavior
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: targeted audit across Prime direct-message Firebase writes/reads, draft-state APIs, Reception send route, and channel capability gates; `pnpm --filter @apps/prime typecheck`; `pnpm --filter @apps/prime lint`; `pnpm --filter @apps/reception typecheck`; `pnpm --filter @apps/reception lint`
  - Validation artifacts: `docs/plans/prime-reception-unified-messaging/replan-notes.md`; Prime typecheck pass; Prime lint pass with warnings only; Reception typecheck pass; Reception lint pass with warnings only
  - Unexpected findings: replay/repair and broadcast delivery remain unresolved, so they are split into TASK-11 instead of staying implicit inside this send slice
- **Scouts:** Confirm thread-state update seams for `last_staff_reply_at`/`takeover_state` and the exact Firebase payload shape guests already read.
- **Edge Cases & Hardening:** repeated sends, resolved/archived threads, missing current draft, and Firebase projection failure after canonical draft authority is established.
- **What would make this >=90%:**
  - Add projection-status update primitives plus an explicit replay/repair loop so projection failure handling stops being fail-closed per request.
- **Rollout / rollback:**
  - Rollout: enable Prime send for `prime_direct` only after the canonical outbound write + Firebase projection path is validated end-to-end.
  - Rollback: keep Prime resolve/dismiss plus draft editing enabled while returning Prime send to disabled state.
- **Documentation impact:**
  - Add Prime direct-thread send semantics to the architecture doc when this task starts.
- **Notes / references:**
  - `apps/prime/functions/api/direct-messages.ts`
  - `apps/prime/functions/api/direct-message.ts`
  - `apps/reception/src/app/api/mcp/inbox/[threadId]/send/route.ts`
  - Completion notes:
    - Prime now exposes an owner-gated direct-thread send route that synchronously projects the sent staff reply to Firebase and then persists canonical outbound message, sent draft, admission, thread-state, and projection rows in D1.
    - Reception now routes prefixed `prime_direct` send actions through the Prime review proxy and enables `Send` only for Prime direct channels, leaving replay/repair and broadcast semantics deferred.

### TASK-11: Add Prime projection status/replay primitives and direct-thread repair tooling
- **Type:** IMPLEMENT
- **Deliverable:** Projection-status mutation helpers, direct-thread Firebase replay primitives, and owner-gated repair tooling for failed/pending Prime projection jobs
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Affects:** `apps/prime/functions/api/*`, `apps/prime/functions/lib/*`, `apps/prime/functions/__tests__/*`, `docs/plans/prime-reception-unified-messaging/architecture.md`
- **Depends on:** TASK-10
- **Blocks:** TASK-12
- **Confidence:** 81%
  - Implementation: 82% - The bounded surfaces are localized: projection-job repository helpers, the current direct-thread send/shadow-write seams, Firebase direct-channel writes, and owner-gated Prime review routes.
  - Approach: 80% - Direct-thread replay can reuse the existing Firebase path and canonical D1 records without inventing broadcast audience expansion in the same slice.
  - Impact: 80% - This removes the main fail-closed gap in Prime delivery and gives later broadcast work one repair contract to build on.
- **Acceptance:**
  - Projection jobs support explicit success/failure/retry state updates with attempt/error metadata.
  - Prime direct-thread delivery can replay a canonical message projection into the existing Firebase path for pending/failed message jobs.
  - Prime exposes bounded owner-gated repair tooling without changing Reception’s current operator surface yet.
- **Validation contract (TC-11):**
  - TC-01: projection replay primitives can mark jobs `projected` or `failed` with attempt/error metadata and deterministic retry behavior
  - TC-02: replaying a direct-thread message job writes the expected Firebase payload and updates the projection job status without regressing current direct-thread send behavior
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: targeted audit across Prime projection-job storage, direct-thread send/shadow-write seams, Firebase helper primitives, and current Prime owner-gated route patterns; `pnpm --filter @apps/prime typecheck`; `pnpm --filter @apps/prime lint`
  - Validation artifacts: `docs/plans/prime-reception-unified-messaging/replan-notes.md`; Prime typecheck pass; Prime lint pass with warnings only
  - Unexpected findings: broadcast/promotional delivery still has no concrete audience-expansion or Firebase projection path, so it remains split into TASK-12
- **Scouts:** Confirm whether send-path hardening should write canonical D1 state before replay attempts or stay additive behind the new repair tooling.
- **Edge Cases & Hardening:** duplicate replay, missing Firebase channel metadata, replay after thread resolution, and preserving idempotent message IDs across repeated repair attempts.
- **What would make this >=90%:**
  - Add one shared projection helper used by both direct-thread send and repair paths, plus targeted route/repository coverage for failed-job recovery.
- **Rollout / rollback:**
  - Rollout: enable repair/replay behind owner-gated Prime routes while keeping current direct-thread send behavior stable.
  - Rollback: keep direct-thread send enabled and return to the current no-replay posture if the repair tooling misbehaves.
- **Documentation impact:**
  - Add Prime direct-thread replay/repair semantics to the architecture doc when this task starts.
- **Notes / references:**
  - `apps/prime/functions/lib/prime-messaging-repositories.ts`
  - `apps/prime/functions/lib/prime-review-send.ts`
  - `apps/prime/functions/lib/prime-messaging-shadow-write.ts`
  - Completion notes:
    - Prime now has canonical projection-job read/update helpers plus a shared direct-thread Firebase projection helper for replaying canonical message records.
    - Prime now exposes an owner-gated projection replay route that can repair failed or pending direct-thread message jobs and records projected vs failed attempt metadata in D1.

### TASK-12: Add Prime shared broadcast-thread send APIs and Reception operator send support for existing `prime_broadcast` review threads
- **Type:** IMPLEMENT
- **Deliverable:** Prime owner-gated send flows for existing broadcast review threads/channels plus Reception operator send support for `prime_broadcast`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Affects:** `apps/prime/functions/api/*`, `apps/prime/functions/lib/*`, `apps/prime/functions/__tests__/*`, `apps/reception/src/app/api/mcp/inbox/*`, `apps/reception/src/lib/inbox/*`, `apps/reception/src/components/inbox/*`, `apps/reception/src/services/useInbox.ts`, `[readonly] docs/plans/prime-reception-unified-messaging/architecture.md`
- **Depends on:** TASK-11
- **Blocks:** TASK-13
- **Confidence:** 80%
  - Implementation: 81% - The bounded surfaces are localized: Prime review send/repository seams, deterministic broadcast channel IDs, existing Firebase shared-channel reads, and Reception’s generic Prime send proxy.
  - Approach: 79% - Existing broadcast review threads can send against one shared channel identity without inventing booking/room expansion in the same slice.
  - Impact: 80% - This unlocks operator send for `prime_broadcast` while keeping broader campaign semantics explicitly deferred.
- **Acceptance:**
  - Prime can operator-send existing broadcast review threads through an owner-gated API without pretending they are direct threads.
  - Sent broadcast messages project into the deterministic shared Firebase channel for that broadcast thread and persist canonical outbound state in D1.
  - Reception exposes `Send` for `prime_broadcast` only through the Prime proxy and preserves existing email + `prime_direct` behavior.
- **Validation contract (TC-12):**
  - TC-01: broadcast-thread send routes create the correct canonical outbound message/draft/thread/projection records and project into the expected shared Firebase channel
  - TC-02: Reception routes `prime_broadcast` send through the Prime proxy only when the channel capability advertises send support
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: targeted audit across Prime broadcast channel ID helpers, guest Firebase read/write seams for non-direct channels, Prime review draft/send surfaces, and Reception Prime proxy routes; `pnpm --filter @apps/prime typecheck`; `pnpm --filter @apps/prime lint`; `pnpm --filter @apps/reception typecheck`; `pnpm --filter @apps/reception lint`
  - Validation artifacts: `docs/plans/prime-reception-unified-messaging/replan-notes.md`; Prime typecheck pass; Prime lint pass with warnings only; Reception typecheck pass; Reception lint pass with warnings only
  - Unexpected findings: broader audience expansion and campaign state are still unresolved, so they remain split into TASK-13
- **Scouts:** Confirm the exact Firebase meta/message shape for shared broadcast channels and whether existing broadcast thread IDs should always match `broadcast_<audienceKey>`.
- **Edge Cases & Hardening:** duplicate broadcast sends, missing shared-channel metadata, replay after operator-visible broadcast send, and preserving `promotion` payload metadata through projection.
- **What would make this >=90%:**
  - Add one shared broadcast projection helper plus route/repository coverage for both send success and replay failure paths.
- **Rollout / rollback:**
  - Rollout: enable `prime_broadcast` send only for existing broadcast review threads after the shared-channel projection path is validated.
  - Rollback: keep `prime_direct` send/replay enabled while leaving `prime_broadcast` send disabled.
- **Documentation impact:**
  - Add bounded shared broadcast-thread send semantics to the architecture doc when this task starts.
- **Notes / references:**
  - `apps/prime/src/lib/chat/directMessageChannel.ts`
  - `apps/prime/src/contexts/messaging/ChatProvider.tsx`
  - `apps/reception/src/lib/inbox/prime-review.server.ts`
  - Completion notes:
    - Prime review send now supports `channel_type='broadcast'`, projecting sent promotional payloads into the deterministic shared Firebase channel while persisting canonical outbound message, draft, admission, thread-state, and projection rows in D1.
    - Reception now enables `Send` for `prime_broadcast` review threads through the existing Prime send proxy without changing the email or `prime_direct` transport paths.

### TASK-13: Add Prime canonical whole-hostel campaign state and review semantics on top of the existing `broadcast_whole_hostel` thread/channel
- **Type:** IMPLEMENT
- **Deliverable:** Prime whole-hostel campaign authority, campaign lifecycle state, and review/send semantics that attach canonical campaign records to the existing shared `broadcast_whole_hostel` thread/channel
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Affects:** `apps/prime/migrations/*`, `apps/prime/functions/api/*`, `apps/prime/functions/lib/*`, `apps/prime/functions/__tests__/*`, `apps/reception/src/lib/inbox/*`, `apps/reception/src/app/api/mcp/inbox/*`, `[readonly] docs/plans/prime-reception-unified-messaging/architecture.md`
- **Depends on:** TASK-12
- **Blocks:** TASK-14
- **Confidence:** 80%
  - Implementation: 81% - The `whole_hostel` lane already has a deterministic thread/channel identity, existing review/send APIs, and canonical `campaign_id` plumbing on outbound messages.
  - Approach: 80% - Adding authoritative campaign state for one real lane is bounded and avoids pretending that `booking` and `room` expansion rules already exist.
  - Impact: 79% - This makes campaign metadata authoritative for the existing broadcast lane without reopening the transport model.
- **Acceptance:**
  - Prime persists canonical campaign records for whole-hostel broadcasts instead of treating one shared thread/channel as the only campaign authority.
  - Prime whole-hostel review/send flows can attach a canonical `campaign_id` and campaign lifecycle metadata to drafts, outbound messages, and operator-visible review state.
  - Reception continues to proxy bounded `prime_broadcast` review actions against the existing whole-hostel lane without assuming booking/room expansion exists.
- **Validation contract (TC-13):**
  - TC-01: whole-hostel campaign create/update/send flows persist canonical campaign records and thread/message links without regressing existing `broadcast_whole_hostel` send behavior
  - TC-02: operator-visible campaign state remains consistent across draft save, send, dismiss, and resolve flows for the shared whole-hostel lane
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: targeted audit across broadcast channel identity helpers, D1 message/draft/projection repository seams, Prime broadcast review/send paths, and guest/read operator proxy seams
  - Validation artifacts: `docs/plans/prime-reception-unified-messaging/replan-notes.md`
  - Unexpected findings: `campaign_id` is already threaded through canonical messages/projections, but there is still no authoritative campaign table or lifecycle state for even the existing whole-hostel broadcast lane
- **Scouts:** Confirm the exact whole-hostel campaign lifecycle states and whether campaign metadata belongs on a dedicated table or a dedicated thread-linked document row.
- **Edge Cases & Hardening:** duplicate whole-hostel campaign sends, idempotent resend protection, campaign/thread drift, and keeping legacy `campaignId`-less shared broadcasts readable.
- **What would make this >=90%:**
  - Pin the exact campaign schema and one owner-gated author/update API shape before implementation starts.
- **Rollout / rollback:**
  - Rollout: attach canonical campaign state to the existing `broadcast_whole_hostel` lane after the schema and review API are validated.
  - Rollback: keep shared whole-hostel broadcast send enabled while leaving campaign authority optional/disabled.
- **Documentation impact:**
  - Add whole-hostel campaign authority semantics to the architecture doc when this task starts.
- **Notes / references:**
  - `apps/prime/src/lib/chat/directMessageChannel.ts`
  - `apps/prime/functions/lib/prime-messaging-repositories.ts`
  - `apps/prime/functions/lib/prime-review-send.ts`
  - `apps/prime/functions/lib/prime-thread-projection.ts`
  - Completion notes:
    - Prime now persists canonical `message_campaigns` rows for whole-hostel broadcasts, exposes the current campaign in Prime review detail, and attaches canonical `campaign_id` values to whole-hostel outbound messages.
    - Saving a new draft on `broadcast_whole_hostel` now reopens the shared lane by creating/updating a campaign row and resetting thread review state to `pending`, so the lane is reusable across multiple campaigns instead of becoming terminal after the first send.
    - Resolve, dismiss, and send now keep whole-hostel campaign lifecycle state synchronized with Prime review state for the reusable shared broadcast lane.

### TASK-14A: Add canonical campaign, target-snapshot, and per-target delivery schema/repository primitives for flexible Prime broadcast campaigns
- **Type:** IMPLEMENT
- **Deliverable:** Prime D1 schema and repository primitives for canonical campaign identity, flexible campaign metadata, target snapshots, eligibility context, and per-target delivery state
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Affects:** `apps/prime/migrations/*`, `apps/prime/functions/lib/*`, `apps/prime/functions/__tests__/*`, `[readonly] docs/plans/prime-reception-unified-messaging/architecture.md`
- **Depends on:** TASK-13
- **Blocks:** TASK-14B, TASK-14
- **Confidence:** 83%
  - Implementation: 84% - Prime already has a strong D1 authority pattern for threads, messages, drafts, admissions, and projection jobs; campaign and per-target delivery entities fit that same repo shape.
  - Approach: 83% - Dedicated campaign + target + delivery entities are the non-shortcut foundation for future offers, events, referrals, and return-booking incentives.
  - Impact: 82% - This removes the biggest long-term risk by preventing future campaign types from being encoded into ad hoc message metadata.
- **Acceptance:**
  - Prime persists canonical campaign rows that own lifecycle, targeting intent, audience mode, flexible metadata, and aggregate status.
  - Prime persists target-snapshot and per-target delivery rows so in-flight campaigns do not mutate when booking or room state changes later.
  - Repository primitives support future campaign classes such as referrals, event invitations, and return-booking discount offers without another schema redesign.
- **Validation contract (TC-14A):**
  - TC-01: schema/repository calls can create and load canonical campaigns with flexible metadata, target snapshots, and per-target deliveries without regressing existing message-thread behavior
  - TC-02: per-target delivery rows can represent retry/error/projected states independently of the parent campaign aggregate
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: targeted audit across current Prime D1 repository patterns, broadcast review/send flows, and future campaign flexibility requirements captured in the replan
  - Validation artifacts: `docs/plans/prime-reception-unified-messaging/replan-notes.md`
  - Unexpected findings: existing `campaign_id` plumbing on message records is useful, but there is still no authoritative campaign entity or per-target delivery ledger today
- **Scouts:** Confirm the exact schema boundaries between campaign rows, target-snapshot rows, and delivery rows.
- **Edge Cases & Hardening:** duplicate campaign creation, idempotent target snapshot generation, campaign/delivery aggregate drift, and migration from message-only `campaign_id` references.
- **Long-term design decisions:**
  - Add dedicated canonical campaign tables; do not overload thread/message/projection rows as the only campaign authority.
  - Snapshot resolved targets at send time; later booking or room changes must not silently rewrite an in-flight campaign.
  - Track one canonical delivery row per resolved target with its own status, retry metadata, error state, and projected message linkage.
- **What would make this >=90%:**
  - Pin the exact D1 schema names/columns/indexes and the aggregate-status rollup rules before implementation starts.
- **Rollout / rollback:**
  - Rollout: add schema/repository support darkly behind existing whole-hostel behavior.
  - Rollback: leave campaign schema unused while keeping current whole-hostel support intact.
- **Documentation impact:**
  - Add canonical campaign/delivery schema decisions to the architecture doc when this task starts.
- **Notes / references:**
  - `apps/prime/functions/lib/prime-messaging-repositories.ts`
  - `apps/prime/functions/lib/prime-review-send.ts`
  - `apps/prime/functions/lib/prime-thread-projection.ts`
  - Completion notes:
    - Prime now persists flexible campaign schema primitives beyond the whole-hostel lane: campaign aggregate counters, target snapshots, per-target deliveries, and canonical campaign record hydration.
    - The new schema supports future campaign types such as referrals, event invitations, and return-booking offers without encoding target/delivery state into ad hoc thread metadata.
    - Booking/room runtime work is now blocked only on campaign-centric Prime/Reception API seams rather than on missing D1 authority.

### TASK-14B: Add Prime campaign API seams and Reception campaign-centric proxy contracts for review, send, status, and replay flows
- **Type:** IMPLEMENT
- **Deliverable:** Prime owner-gated campaign APIs and Reception campaign-centric proxy seams that expose canonical campaign state, target counts, delivery summaries, and replay controls without leaking D1 details across apps
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Affects:** `apps/prime/functions/api/*`, `apps/prime/functions/lib/*`, `apps/prime/functions/__tests__/*`, `apps/reception/src/app/api/mcp/inbox/*`, `apps/reception/src/lib/inbox/*`, `apps/reception/src/components/inbox/*`, `apps/reception/src/services/useInbox.ts`, `[readonly] docs/plans/prime-reception-unified-messaging/architecture.md`
- **Depends on:** TASK-14A
- **Blocks:** TASK-14
- **Confidence:** 81%
  - Implementation: 82% - Prime already exposes bounded owner-gated review routes, and Reception already proxies prefixed Prime thread actions through one integration seam.
  - Approach: 81% - Campaign-centric APIs can layer on the existing Prime/Reception boundary without introducing shared-DB shortcuts.
  - Impact: 80% - This creates the durable operator contract needed for future flexible campaigns instead of growing more thread-specific endpoints.
- **Acceptance:**
  - Prime exposes campaign-centric APIs for create/read/update/send/status/replay that operate on canonical campaign and delivery entities.
  - Reception proxies those APIs through bounded server-to-server seams and surfaces campaign summary state without turning each target delivery into a separate inbox thread.
  - The API contract can represent future offers and invitations with campaign metadata, eligibility context, and delivery summaries.
- **Validation contract (TC-14B):**
  - TC-01: Prime campaign APIs serialize canonical campaign state, target counts, and delivery summaries correctly under owner-gated access
  - TC-02: Reception proxy routes preserve the bounded auth model and do not fall back to direct D1 access or email-specific semantics
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: `pnpm --filter @apps/prime typecheck` (passed); `pnpm --filter @apps/prime lint` (passed with warnings only); `pnpm --filter @apps/reception typecheck` (passed); scoped Reception eslint across touched files (passed)
  - Validation artifacts: Prime typecheck pass output; Prime lint output with warnings only; Reception typecheck pass output; scoped Reception eslint pass output
  - Unexpected findings: package-wide `pnpm --filter @apps/reception lint` is currently blocked by unrelated existing DS arbitrary-tailwind errors in non-inbox Reception surfaces, so this task used a touched-file eslint pass rather than claiming a package-clean Reception lint run
- **Scouts:** Confirm the minimal campaign API surface that supports both current broadcast review and future campaign types without route churn.
- **Edge Cases & Hardening:** stale campaign state, replay permissions, partial-delivery summaries, and preserving thread-centric whole-hostel support during the transition.
- **What would make this >=90%:**
  - Freeze the external campaign API contract and its mapping into Reception UI state before implementation starts.
- **Rollout / rollback:**
  - Rollout: add campaign APIs alongside existing thread-centric whole-hostel routes, then let Reception adopt them incrementally.
  - Rollback: keep thread-centric whole-hostel support enabled while leaving campaign routes unused.
- **Documentation impact:**
  - Add campaign-centric API seam decisions to the architecture doc when this task starts.
- **Notes / references:**
  - `apps/prime/functions/api/review-thread-send.ts`
  - `apps/prime/functions/lib/prime-review-api.ts`
  - `apps/reception/src/lib/inbox/prime-review.server.ts`
  - `apps/reception/src/lib/inbox/channel-adapters.server.ts`
  - `apps/prime/functions/api/review-campaign.ts`
  - `apps/prime/functions/api/review-campaign-send.ts`
  - `apps/prime/functions/api/review-campaign-replay.ts`

### TASK-14: Add booking/room audience-expansion and delivery-tracking execution on top of the canonical campaign schema and API seams
- **Type:** IMPLEMENT
- **Deliverable:** Prime audience-expansion runtime, delivery execution, and replay behavior for `booking` and `room` campaigns using the canonical campaign schema and campaign APIs
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete (2026-03-08)
- **Affects:** `apps/prime/functions/api/*`, `apps/prime/functions/lib/*`, `apps/prime/functions/__tests__/*`, `apps/reception/src/app/api/mcp/inbox/*`, `apps/reception/src/lib/inbox/*`, `apps/reception/src/components/inbox/*`, `apps/reception/src/services/useInbox.ts`, `[readonly] docs/plans/prime-reception-unified-messaging/architecture.md`
- **Depends on:** TASK-14A, TASK-14B
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 80% - The runtime fan-out work becomes bounded once canonical campaign entities and operator APIs already exist.
  - Approach: 80% - `booking` and `room` delivery can now focus on expansion rules and execution, not on inventing authority and API shapes at the same time.
  - Impact: 79% - This completes the broader Prime audience-expansion model on top of the durable long-term campaign foundation.
- **Acceptance:**
  - Prime broadcast/promotional sends support explicit audience-expansion semantics for `booking` and `room`.
  - Prime records per-target delivery state and replay metadata through canonical campaign and delivery entities rather than through shared-thread shortcuts.
  - Reception can operate flexible campaign sends with aggregate delivery visibility while leaving per-target drill-down behind the Prime API.
- **Validation contract (TC-14):**
  - TC-01: audience-expansion send routes create the correct canonical target-delivery/projection records for `booking` and `room` sends without regressing whole-hostel campaign support
  - TC-02: operator-visible campaign state and replay semantics remain consistent across partial target-delivery/failure cases
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: `pnpm --filter @apps/prime typecheck`; `pnpm --filter @apps/prime lint`
  - Validation artifacts: Prime package typecheck passed; Prime package lint passed with warnings only
  - Unexpected findings: room fan-out could stay long-term-safe by expanding to active booking targets at send time from Firebase booking/room state instead of introducing guest-visible shared room channels
- **Scouts:** none; the booking and room expansion rules are now implemented on top of the TASK-14A/B contracts.
- **Edge Cases & Hardening:** multi-target fan-out failures, duplicate campaign sends, partial delivery, replay after operator-visible send, and room-assignment changes after send.
- **Long-term design decisions:**
  - Deliver `booking` campaigns into stable booking-scoped broadcast threads/channels using deterministic IDs such as `broadcast_booking_<bookingRef>`.
  - Treat `room` as a targeting lens, not a guest-visible shared channel; expand room campaigns into active booking targets at send time, then deliver through booking-scoped broadcast threads. This avoids leaking stale room history to future occupants.
  - Keep Reception campaign-centric; show aggregate delivery state and drill into failures via Prime APIs rather than turning each delivery target into a separate inbox thread.
- **Rollout / rollback:**
  - Rollout: booking and room campaign sends now run through canonical target snapshots, per-target deliveries, and projection jobs while preserving whole-hostel campaign support.
  - Rollback: disable the booking/room campaign send branch and retain the already-landed whole-hostel/direct-thread paths.
- **Documentation impact:**
  - Added Prime booking/room audience-expansion execution semantics, booking-scoped channel rules, and partial-failure replay behavior to the architecture doc.
- **Notes / references:**
  - `apps/prime/functions/lib/prime-review-campaign-runtime.ts`
  - `apps/prime/functions/lib/prime-review-campaign-actions.ts`
  - `apps/prime/functions/lib/prime-review-send-support.ts`
  - `apps/prime/functions/__tests__/review-threads.test.ts`

## Risks & Mitigations
- Risk: rich-message schema grows without an authoritative sender path.
  - Mitigation: keep guest write path text-only in this slice and treat richer payloads as future projected outbound messages.
- Risk: Prime UI branches regress plain-text chat.
  - Mitigation: retain `content` as required fallback text and keep rendering additive.
- Risk: Reception review UI stays implicitly email-shaped even after the architecture doc says otherwise.
  - Mitigation: land TASK-04 before D1 Prime work so later tasks target a normalized review contract.
- Risk: architecture doc is mistaken for full delivery.
  - Mitigation: keep TASK-12, TASK-13, TASK-14A, TASK-14B, and TASK-14 explicitly phased and document the shared broadcast-thread vs whole-hostel-campaign vs schema/API/runtime-expansion boundaries.

## Observability
- Logging: retain current Prime direct-message error logging; shadow-write failures should be logged without breaking current Firebase chat delivery.
- Metrics: future D1 draft pipeline should emit queued/suppressed/approved/sent counters for Prime drafts.
- Alerts/Dashboards: future phase should alert on projection failures and stuck draft states.

## Acceptance Criteria (overall)
- [x] The architecture is persisted as a canonical plan artifact for this workstream.
- [x] Prime rich-message contracts support support/promotional metadata without breaking existing plain-text flows.
- [x] Prime guest chat can render richer projected outbound messages.
- [x] Reception inbox exposes a channel-adapter review contract without regressing current email flows.
- [x] Prime D1 storage primitives exist for canonical threads, messages, drafts, admissions, and projection replay metadata.
- [x] Prime direct-message writes can shadow-write canonical D1 state plus replay metadata without regressing Firebase chat delivery.
- [x] Reception can surface Prime review threads through the adapter-backed inbox without enabling unfinished Prime write actions.
- [x] Prime direct-thread replay/repair primitives can reproject canonical message jobs into Firebase and update projection status metadata.
- [x] Prime can operator-send existing `prime_broadcast` review threads through the shared Firebase broadcast channel while preserving canonical D1 outbound state.
- [x] Prime whole-hostel campaign authority lands as a separate bounded task from booking/room target expansion.
- [x] Prime flexible campaign schema and per-target delivery authority land before booking/room fan-out execution.
- [x] Prime campaign API seams land before flexible booking/room campaign execution.
- [x] Follow-on Prime broadcast delivery work remains explicitly scoped in separate bounded tasks rather than implied delivered.

## Decision Log
- 2026-03-08: Chose shared drafting engine plus channel-specific transport/persistence rather than moving both email and Prime into Firebase.
- 2026-03-08: Chose Prime rich-message compatibility as the first implementation slice before D1 canonicalization.
- 2026-03-08: Replanned the original broad TASK-04 into adapter, D1 schema, and orchestration slices so `/lp-do-build` can execute above the confidence floor.
- 2026-03-08: Chose `PRIME_MESSAGING_DB` plus a placeholder D1 id in `apps/prime/wrangler.toml`, matching existing repo precedent for unprovisioned app-local D1 bindings.
- 2026-03-08: Replanned the original broad TASK-06 into a D1 shadow-write slice and a later Reception review integration slice because Prime reads still depend on Firebase today.
- 2026-03-08: Replanned the original broad TASK-07 into a read-only review slice and a later mutation slice because Prime and Reception do not yet share a write-safe auth/transport contract.
- 2026-03-08: Replanned the original broad TASK-08 into review-state mutations first and outbound send later because dismiss/resolve need an explicit Prime review state, while send still lacks canonical outbound/projection semantics.
- 2026-03-08: Replanned the broad outbound TASK-10 into direct-thread send first and a later replay/broadcast task because guests still read direct threads from Firebase and there is no existing broadcast delivery path to extend safely.
- 2026-03-08: Replanned the broad TASK-11 into direct-thread replay/repair first and a later broadcast/promotional delivery task because projection-job state and direct-thread Firebase paths exist today, while broadcast still has only channel IDs and adapter metadata.
- 2026-03-08: Replanned the broad TASK-12 into bounded shared broadcast-thread send first and a later audience-expansion/campaign task because Prime already has deterministic broadcast channel IDs and guest Firebase reads for non-direct channels, while booking/room/whole-hostel expansion still lacks authority and delivery tracking.
- 2026-03-08: Replanned the broad TASK-13 into whole-hostel campaign authority first and a later booking/room expansion task because `broadcast_whole_hostel` already exists as a deterministic lane, while `booking` and `room` still lack target authority and per-target delivery tracking.
- 2026-03-08: Replanned the broad TASK-14 into schema, API seam, and runtime-expansion slices so future campaign types like referrals, event invitations, and return-booking discounts can reuse a canonical campaign system instead of thread-specific fan-out shortcuts.
- 2026-03-08: Completed TASK-13 by adding canonical `message_campaigns` authority for `broadcast_whole_hostel`, exposing current campaign state in Prime review detail, attaching `campaign_id` to whole-hostel outbound messages, and letting new staff drafts reopen the reusable whole-hostel lane after prior sends.
- 2026-03-08: Completed TASK-14A by adding campaign aggregate counters, target snapshot rows, per-target delivery rows, and canonical campaign record hydration so future flexible campaigns have real D1 authority before API and runtime fan-out work.
- 2026-03-08: Completed TASK-14B by exposing owner-gated Prime campaign review/send/replay routes, hydrating canonical campaign detail in Prime review payloads, and letting Reception consume campaign objects as first-class review state while keeping the inbox thread-centric.
- 2026-03-08: Completed TASK-14 by expanding `booking` campaigns into deterministic booking-scoped broadcast threads, expanding `room` campaigns into active booking targets at send time, recording canonical target snapshots plus per-target deliveries/projection jobs, and preserving operator-visible `sent` state across partial delivery failures so replay can repair individual targets without reopening the campaign send flow.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = sum(task confidence * effort weight) / sum(effort weight)
- `(95*1 + 86*2 + 84*2 + 84*2 + 82*2 + 83*2 + 83*2 + 82*2 + 81*2 + 81*2 + 81*2 + 80*2 + 80*2 + 83*2 + 81*2 + 80*3) / 32 = 82.25`, rounded to 82%.
