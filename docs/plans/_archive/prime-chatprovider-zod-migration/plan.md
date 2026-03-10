---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: prime-chatprovider-zod-migration
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 87%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Prime ChatProvider Zod Migration Plan

## Summary

Replace the 8 manual Firebase message-payload type guard functions in `ChatProvider.tsx` with a Zod schema file (`messageSchema.ts`). The new schema lives at `apps/prime/src/lib/chat/messageSchema.ts`, co-located with the existing chat module files. Types in `chat.ts` are replaced with `z.infer` aliases derived from the schema, following the pattern already established in `bookingsSchemas.ts` and `triggers.ts`. The migration is a pure refactor: runtime behaviour is identical, no new package dependencies are needed (`zod` is already present at `^3.25.73`), and all existing integration tests continue to pass. New unit tests are added to directly cover valid/invalid schema parse paths.

## Active tasks
- [x] TASK-01: Create `messageSchema.ts`
- [x] TASK-02: Update `chat.ts` to use `z.infer` type aliases
- [x] TASK-03: Refactor `ChatProvider.tsx` to use schema-based validation
- [x] TASK-04: Add `messageSchema.test.ts` unit tests
- [x] TASK-05: Update `lib/chat/index.ts` barrel and validate

## Goals
- Replace 8 ad-hoc manual guard functions (~110 lines) with a single Zod schema file.
- Derive all `Message`-related TypeScript types from `z.infer` — schema is single source of truth.
- Keep `ChatProvider.tsx` purely behavioural; no inline validation logic.
- Add direct unit test coverage for valid/invalid payload parsing.
- Maintain identical runtime behaviour throughout: silent null on invalid payloads, no UI error bubbling.

## Non-goals
- Changing Firebase read/write logic.
- Migrating `roles.ts` or any type outside the chat payload boundary.
- Adding server-side validation.
- Migrating `chatRetentionPolicy.ts` (uses its own `MessageWithTimestamp` interface, not `Message`).
- Adding Zod server-side parse errors to API responses.

## Constraints & Assumptions
- Constraints:
  - `zod` at `^3.25.73` is already a direct dependency — no install required.
  - `senderRole` must enumerate `Role` literals exactly: `'guest' | 'staff' | 'admin' | 'owner' | 'na' | 'system'`.
  - Firebase path: `id` is not in the raw payload; injected as the Firebase key via `toMessage(id, raw)`. Requires `RawMessagePayloadSchema` (no `id`).
  - Direct messages API path: `id` IS in the payload elements; `MessageSchema` (with `id`) is used for that path.
  - TypeScript blast radius: 8 `functions/` files use `import type` from `chat.ts` — all must pass `typecheck:functions`.
  - Tests are CI-only. Do not run tests locally.
- Assumptions:
  - Silent parse failure (null return) is the correct and intentional behaviour — confirmed by existing integration test patterns.
  - `z.infer` produces structural types fully compatible with all existing `interface`-typed consumers.

## Inherited Outcome Contract

- **Why:** 8 near-identical manual type guard functions (~110 lines) create an update burden: adding or renaming a `Message` field requires parallel edits in 8+ locations. The project already uses Zod for similar validation (`bookingsSchemas.ts`, `triggers.ts`); this migration brings consistency and eliminates the maintenance surface.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Zod `MessageSchema` replaces the 8 manual type guards; `chat.ts` types derive from `z.infer`; `ChatProvider.tsx` contains no inline validation logic; zero behaviour change at runtime; test coverage parity maintained.
- **Source:** auto

## Fact-Find Reference
- Related brief: `docs/plans/prime-chatprovider-zod-migration/fact-find.md`
- Key findings used:
  - 8 guard functions fully catalogued (lines 193–308 of `ChatProvider.tsx`), all non-exported, all contained to that file.
  - `RawMessagePayloadSchema` needed for Firebase path (no `id`); `MessageSchema` needed for DM API path (includes `id`).
  - `zod ^3.25.73` already in `apps/prime` deps. `@acme/zod-utils` is NOT.
  - `chat.ts` consumed via `import type` in 8 `functions/` files — typecheck blast radius requires both `typecheck:app` and `typecheck:functions` to pass.
  - Correct schema location: `apps/prime/src/lib/chat/messageSchema.ts`.
  - `safeParse` (not `parse`) is the established pattern.
  - `zodErrorToString` exists at `apps/prime/src/utils/zodErrorToString.ts`.

## Proposed Approach

- Option A: Write Zod schemas in a new `messageSchema.ts` file, derive types via `z.infer`, update `chat.ts` to re-export `z.infer` aliases, update `ChatProvider.tsx` to use `safeParse`.
- Option B: Keep manual guards; add parallel Zod schema only for documentation/testing. (Rejected: does not solve the maintenance surface problem.)
- Chosen approach: **Option A.** Single source of truth in `messageSchema.ts`. `chat.ts` becomes a thin re-export file. `ChatProvider.tsx` uses `RawMessagePayloadSchema.safeParse` for the Firebase path and `MessageSchema.safeParse` for the DM API path. This matches established patterns in the codebase and removes all duplicate type/validation logic.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Create `messageSchema.ts` with all sub-schemas and exports | 90% | S | Complete (2026-03-09) | - | TASK-02, TASK-03, TASK-04 |
| TASK-02 | IMPLEMENT | Update `chat.ts` to use `z.infer` type aliases | 90% | S | Complete (2026-03-09) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Refactor `ChatProvider.tsx` to use schema-based validation | 85% | S | Complete (2026-03-09) | TASK-01, TASK-02 | TASK-05 |
| TASK-04 | IMPLEMENT | Add `messageSchema.test.ts` unit tests | 90% | S | Complete (2026-03-09) | TASK-01 | TASK-05 |
| TASK-05 | IMPLEMENT | Update barrel, run typecheck/lint gate | 90% | S | Complete (2026-03-09) | TASK-03, TASK-04 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Schema foundation — all others depend on this |
| 2 | TASK-02, TASK-04 | TASK-01 complete | Type update and unit tests can run in parallel |
| 3 | TASK-03 | TASK-01 + TASK-02 complete | Provider refactor needs updated types |
| 4 | TASK-05 | TASK-03 + TASK-04 complete | Barrel update + validation gate |

## Tasks

---

### TASK-01: Create `messageSchema.ts`
- **Type:** IMPLEMENT
- **Deliverable:** New file `apps/prime/src/lib/chat/messageSchema.ts` containing all Zod schemas and re-exported inferred types
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-09)
- **Build evidence:** `apps/prime/src/lib/chat/messageSchema.ts` created (142 lines). 4 sub-schemas (MessageLinkSchema, MessageAttachmentSchema, MessageCardSchema, MessageDraftMetaSchema), 2 top-level schemas (RawMessagePayloadSchema, MessageSchema) with `.passthrough()`, all 12 inferred types exported. File swept into commit `6056403eeb` (`chore(reception): post-build artifacts for reception-loans-sequential-firebase`) under writer lock. Acceptance criteria verified by reading the file directly.
- **Affects:**
  - `apps/prime/src/lib/chat/messageSchema.ts` (new file)
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04
- **Confidence:** 90%
  - Implementation: 95% — Schema structure is fully specified: 4 sub-schemas + `RawMessagePayloadSchema` + `MessageSchema`. Field types, optionality, and enum values are all confirmed from reading the source.
  - Approach: 90% — The `id`-field asymmetry (Firebase vs API path) is well-understood and the two-schema export strategy is clear. Held-back test: no single unresolved unknown would drop this below 80 — all field types are read from source, Zod API is standard v3.
  - Impact: 90% — This task is additive only (new file, no deletions). Zero risk of runtime regression. Other tasks depend on this output but TASK-01 itself cannot break existing behaviour.
- **Acceptance:**
  - `apps/prime/src/lib/chat/messageSchema.ts` exists.
  - Exports: `MessageLinkSchema`, `MessageAttachmentSchema`, `MessageCardSchema`, `MessageDraftMetaSchema`, `RawMessagePayloadSchema`, `MessageSchema`.
  - Exports inferred types: `MessageKind`, `MessageAudience`, `MessageLinkVariant`, `MessageAttachmentKind`, `MessageDraftStatus`, `MessageDraftSource`, `MessageLink`, `MessageAttachment`, `MessageCard`, `MessageDraftMeta`, `RawMessagePayload`, `Message` (all via `z.infer` from their respective schemas or enum/union schemas). This complete set is required by TASK-02 to replace all type declarations previously in `chat.ts`.
  - `RawMessagePayloadSchema` validates all fields of `Message` except `id`.
  - `MessageSchema` validates the full `Message` including `id`.
  - `senderRole` schema enumerates exactly: `'guest' | 'staff' | 'admin' | 'owner' | 'na' | 'system'`.
  - `kind` schema enumerates exactly: `'support' | 'promotion' | 'draft' | 'system'`.
  - `audience` schema enumerates exactly: `'thread' | 'booking' | 'room' | 'whole_hostel'`.
  - All optional fields use `.optional()` not `.nullable()`.
  - No imports from `chat.ts` (schema file is the new source of truth).
- **Validation contract (TC-XX):**
  - TC-01: `MessageSchema.safeParse(validFullMessage)` → `{ success: true, data: Message }`
  - TC-02: `RawMessagePayloadSchema.safeParse(rawFirebasePayload)` → `{ success: true }` (no `id` field required)
  - TC-03: `MessageSchema.safeParse(payloadMissingContent)` → `{ success: false }`
  - TC-04: `MessageDraftMetaSchema.safeParse(validDraftMeta)` → `{ success: true }`
  - TC-05: `MessageLinkSchema.safeParse({ label: 'x', url: 'y' })` → `{ success: true }`
  - TC-06: `MessageLinkSchema.safeParse({ label: 'x' })` (missing `url`) → `{ success: false }`
- **Execution plan:** Write schema file directly. Start with leaf schemas (`MessageLinkSchema`, `MessageAttachmentSchema`, `MessageCardSchema`, `MessageDraftMetaSchema`), compose into `RawMessagePayloadSchema`, then add `id` field to get `MessageSchema`. Export both schemas and their inferred types.
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** Verify `z.enum` vs `z.union(z.literal(...))` — `z.enum` is correct for string literal union in Zod v3 when the variants are string constants. `z.literal` union also works but `z.enum` is cleaner for multiple variants. Use `z.enum(['guest', 'staff', ...])` for `senderRole`.
- **Edge Cases & Hardening:**
  - `senderRole` must not use `Role` import from `roles.ts` at runtime (schema file avoids creating a dependency chain). Enumerate literals inline.
  - Optional array fields (`links`, `attachments`, `cards`) should be `z.array(...).optional()` — consistent with current guards that check `Array.isArray` only when the field is present.
  - `RawMessagePayloadSchema` and `MessageSchema` must use `.passthrough()` (appended to the `z.object(...)` call) to preserve unknown Firebase payload fields on the returned object — matching the current spread behaviour in `toMessage`.
- **What would make this >=90%:** Already at 90%. Full field coverage is known from reading source.
- **Rollout / rollback:**
  - Rollout: Additive file — no existing code changes. Zero rollback risk at this task.
  - Rollback: Delete the new file.
- **Documentation impact:** None: internal schema file, no public API change.
- **Notes / references:** Reference patterns: `apps/prime/src/utils/bookingsSchemas.ts`, `apps/prime/src/lib/messaging/triggers.ts`.

---

### TASK-02: Update `chat.ts` to use `z.infer` type aliases
- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/prime/src/types/messenger/chat.ts` — replace interface/type declarations with `z.infer` aliases from `messageSchema.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/prime/src/types/messenger/chat.ts` (modified)
  - `[readonly] apps/prime/src/lib/chat/messageSchema.ts` (input — TASK-01 output)
  - `[readonly] apps/prime/functions/api/direct-messages.ts` (consumer — import type only)
  - `[readonly] apps/prime/functions/lib/prime-messaging-repositories.ts` (consumer — import type only)
  - `[readonly] apps/prime/functions/lib/prime-review-api.ts` (consumer — import type only)
  - `[readonly] apps/prime/functions/lib/prime-review-campaigns.ts` (consumer — import type only)
  - `[readonly] apps/prime/functions/lib/prime-whole-hostel-campaigns.ts` (consumer — import type only)
  - `[readonly] apps/prime/functions/lib/prime-thread-projection.ts` (consumer — import type only)
  - `[readonly] apps/prime/functions/lib/prime-review-send-support.ts` (consumer — import type only)
  - `[readonly] apps/prime/functions/lib/prime-messaging-shadow-write.ts` (consumer — import type only)
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 90%
  - Implementation: 90% — `chat.ts` was fully read. Current interfaces map 1:1 to TASK-01 schemas. All 8 `functions/` consumers use `import type` so are structurally compatible with `z.infer` aliases.
  - Approach: 90% — `z.infer` produces structural types compatible with existing `interface` consumers — no runtime change. TypeScript typecheck is the validation gate. Held-back test: no single unresolved unknown would drop this below 80 — all consumers are `import type`.
  - Impact: 90% — The file change is a pure TypeScript rename; no runtime module loaded. `typecheck:functions` must pass but this is expected given structural type compatibility.
- **Acceptance:**
  - `chat.ts` contains no standalone `interface` or `type` declarations (only `import type` re-exports from `messageSchema.ts`).
  - All types previously declared in `chat.ts` are re-exported: `MessageKind`, `MessageAudience`, `MessageLinkVariant`, `MessageLink`, `MessageAttachmentKind`, `MessageAttachment`, `MessageCard`, `MessageDraftStatus`, `MessageDraftSource`, `MessageDraftMeta`, `Message`.
  - `pnpm --filter @apps/prime run typecheck` passes (both `typecheck:app` and `typecheck:functions`).
  - **Consumer tracing:** All 8 `functions/` files continue to compile — they import only types and structural compatibility is preserved by `z.infer`. Unchanged: `ChatProvider.tsx` consumers (handled in TASK-03), all UI components importing `Message` type.
- **Validation contract (TC-XX):**
  - TC-01: `pnpm --filter @apps/prime run typecheck:app` exits 0.
  - TC-02: `pnpm --filter @apps/prime run typecheck:functions` exits 0 (all 8 functions consumers still resolve types).
  - TC-03: `chat.ts` exports the complete set of types previously exported (no missing exports that existing code depends on).
- **Execution plan:** Replace `chat.ts` body: add `export type { ... } from '../../lib/chat/messageSchema'` (relative path from `src/types/messenger/` up two levels to `src/`, then down to `lib/chat/`). Verify that all type names match. Confirm `MessageKind`, `MessageAudience`, `MessageLinkVariant`, `MessageAttachmentKind`, `MessageDraftStatus`, `MessageDraftSource` are exported from schema file (as inferred union types or enum types).
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** `chat.ts` currently imports `Role` from `./roles` for the `senderRole` field. After migration, `chat.ts` does not need this import (schema file handles it inline). But `roles.ts` itself may have other consumers — do not modify it.
- **Edge Cases & Hardening:**
  - `MessageLinkVariant`, `MessageAttachmentKind`, `MessageDraftStatus`, `MessageDraftSource` are currently standalone type aliases in `chat.ts`. They must be exported from `messageSchema.ts` as `z.infer` of their respective enum/union schemas.
  - The `Role` import in `chat.ts` can be dropped after migration (schema file enumerates role literals inline). Check that no other file imports `Role` from `chat.ts` (it should come from `roles.ts` directly).
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: Requires TASK-01 to be complete first (new schema file must exist before `chat.ts` imports from it).
  - Rollback: Revert `chat.ts` to prior interface declarations.
- **Documentation impact:** None: internal type reshuffling; public API is identical.
- **Notes / references:** 8 `functions/` file list confirmed in fact-find. All are `import type` consumers.

---

### TASK-03: Refactor `ChatProvider.tsx` to use schema-based validation
- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/prime/src/contexts/messaging/ChatProvider.tsx` — remove 8 manual guard functions; replace with `safeParse`-based equivalents
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/prime/src/contexts/messaging/ChatProvider.tsx` (modified)
  - `[readonly] apps/prime/src/lib/chat/messageSchema.ts` (input — TASK-01 output)
  - `[readonly] apps/prime/src/types/messenger/chat.ts` (input — TASK-02 output)
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 90% — All 4 call sites for `toMessage` and both call sites for `normalizeDirectMessages` were identified. `id`-field asymmetry is understood and the two-path implementation is clear.
  - Approach: 85% — The replacement logic is: (a) `toMessage(id, raw)` → `RawMessagePayloadSchema.safeParse(raw)`, on success construct `{ id, ...result.data }`; (b) `normalizeDirectMessages` array filter → `MessageSchema.safeParse(entry).success`. Held-back test: one potential issue — the Zod schema must not be MORE restrictive than the current guards. If any currently-valid Firebase payload contains a field value the schema rejects, messages would be silently dropped. Mitigation: schema is written 1:1 with guard logic in TASK-01.
  - Impact: 85% — No new exports, no external call sites. The change is self-contained. The risk is silent payload drops if schema overfits. Integration tests (existing) catch most regressions.
- **Acceptance:**
  - Lines 193–308 of original `ChatProvider.tsx` (the 8 guard functions) are fully removed.
  - `isMessage`, `isMessageKind`, `isMessageAudience`, `isMessageLinks`, `isMessageAttachments`, `isMessageCards`, `isMessageDraft` are absent from the file.
  - `toMessage(id, raw)` replaces the guard chain with: `const result = RawMessagePayloadSchema.safeParse(raw); return result.success ? { id, ...result.data } : null;`
  - `normalizeDirectMessages(payload)` replaces `.filter(isMessage)` with: `.filter((entry): entry is Message => MessageSchema.safeParse(entry).success)`
  - No new exports added (functions remain internal).
  - Existing imports from `chat.ts` continue to work (types are re-exported from `chat.ts` in TASK-02).
  - `pnpm --filter @apps/prime run typecheck:app` passes.
  - **Consumer tracing:** `toMessage` is called in 4 places within `ChatProvider.tsx` — all are within the same file and no signature change occurs (still `(id: string, raw: unknown) => Message | null`). `normalizeDirectMessages` is called in 2 places — both internal, same return type `Message[]`. No external consumers to update.
- **Validation contract (TC-XX):**
  - TC-01: Firebase path — valid raw payload with known-good fields → `toMessage` returns `Message` object with `id` injected.
  - TC-02: Firebase path — `null` raw value → `toMessage` returns `null`.
  - TC-03: Firebase path — payload missing required `content` field → `toMessage` returns `null`.
  - TC-04: DM API path — valid payload including `id` → `normalizeDirectMessages` includes the message.
  - TC-05: DM API path — payload missing `senderId` → `normalizeDirectMessages` filters it out.
  - TC-06: Existing integration tests (`ChatProvider.direct-message.test.tsx`, `ChatProvider.channel-leak.test.tsx`) all pass without modification (tests use valid mock payloads which are schema-compatible).
- **Execution plan:**
  - Remove functions `isMessage`, `isMessageKind`, `isMessageAudience`, `isMessageLinks`, `isMessageAttachments`, `isMessageCards`, `isMessageDraft` (lines 193–299).
  - Rewrite `toMessage` (lines 301–308) to use `RawMessagePayloadSchema.safeParse`.
  - Rewrite `normalizeDirectMessages` (lines 310–323) to use `MessageSchema.safeParse`.
  - Add import: `import { MessageSchema, RawMessagePayloadSchema } from '../../lib/chat/messageSchema';`
  - Remove now-unused type imports from `chat.ts` that were only used by the guard functions (`MessageAttachment`, `MessageCard`, `MessageDraftMeta`, `MessageKind`, `MessageLink` — keep `Message` and any types still used by the reducer/state).
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:**
  - Verify that `Message` is still imported from `chat.ts` for the reducer's type annotations (`Message[]`, `Message` in state).
  - Verify the `Omit<Message, 'id'>` usage in `sendMessage` (line 768 area) — this is for constructing a new outbound message (not parsing), so it is unaffected by this migration.
- **Edge Cases & Hardening:**
  - The `Omit<Message, 'id'>` type annotation in `sendMessage` is a construction type, not a parsing type. Leave it untouched.
  - `toMessage` currently constructs `{ id, ...(raw as Omit<Message, 'id'>) }` and then validates. New approach validates first (`RawMessagePayloadSchema.safeParse(raw)`) and constructs only on success. This is strictly safer.
  - **Zod strip vs passthrough**: The current `toMessage` spreads ALL raw keys onto the returned object (`{ id, ...(raw as ...) }`), so unknown Firebase payload fields survive on the returned `Message`. Zod's default `.strip()` would silently drop these extra keys — a subtle runtime behaviour change. **Decision: use `.passthrough()` on `RawMessagePayloadSchema` and `MessageSchema`** to preserve runtime object shape exactly and honour the zero-behaviour-change guarantee. Instruct TASK-01 to add `.passthrough()` to both top-level schemas.
- **What would make this >=90%:** Running the integration test suite in CI. After push, monitor `gh run watch` for green.
- **Rollout / rollback:**
  - Rollout: Requires TASK-01 (schema) and TASK-02 (types) complete first.
  - Rollback: Revert `ChatProvider.tsx` to prior guard functions.
- **Documentation impact:** None: internal refactor.
- **Notes / references:** `sendMessage` line ~768 uses `Omit<Message, 'id'>` as a construction type — confirm this is not affected.

---

### TASK-04: Add `messageSchema.test.ts` unit tests
- **Type:** IMPLEMENT
- **Deliverable:** New file `apps/prime/src/lib/chat/__tests__/messageSchema.test.ts` with unit tests covering valid and invalid parse paths
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/prime/src/lib/chat/__tests__/messageSchema.test.ts` (new file)
  - `[readonly] apps/prime/src/lib/chat/messageSchema.ts` (input — TASK-01 output)
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 90%
  - Implementation: 95% — Test file is purely additive. Schema API (`safeParse`, `success`, `data`) is standard Zod v3.
  - Approach: 90% — Test patterns follow `chat-retention-policy.test.ts` structure (plain Jest, no React testing library needed). Held-back test: no single unknown would drop below 80.
  - Impact: 90% — Additive file only; zero risk of regression.
- **Acceptance:**
  - `apps/prime/src/lib/chat/__tests__/messageSchema.test.ts` exists.
  - Tests cover: `MessageSchema` valid full message; `RawMessagePayloadSchema` valid raw payload (no `id`); `MessageSchema` missing required field; `MessageSchema` invalid `senderRole` enum value; `MessageDraftMetaSchema` valid; `MessageDraftMetaSchema` missing required field; `MessageLinkSchema` valid; `MessageLinkSchema` missing required `url`; `MessageAttachmentSchema` valid; `MessageAttachmentSchema` invalid `kind` value; `MessageCardSchema` valid.
  - All tests pass in CI (`pnpm --filter @apps/prime test`).
  - No `describe.skip` or `test.todo` in the new test file (all tests are concrete and passing).
- **Validation contract (TC-XX):**
  - TC-01: `MessageSchema.safeParse` with valid minimal message (all required fields) → `success: true`.
  - TC-02: `MessageSchema.safeParse` with all optional fields populated → `success: true`, data contains all fields.
  - TC-03: `MessageSchema.safeParse` with missing `content` → `success: false`.
  - TC-04: `MessageSchema.safeParse` with invalid `senderRole: 'unknown'` → `success: false`.
  - TC-05: `RawMessagePayloadSchema.safeParse` with valid payload (no `id` field) → `success: true`.
  - TC-06: `RawMessagePayloadSchema.safeParse` with `id` field present → `success: true` AND `id` is preserved in `result.data` (because schemas use `.passthrough()` — unknown fields are retained, not stripped).
  - TC-07: `MessageDraftMetaSchema.safeParse` with invalid status value → `success: false`.
  - TC-08: `MessageLinkSchema.safeParse` with missing `url` → `success: false`.
  - TC-09: `MessageAttachmentSchema.safeParse` with `kind: 'video'` (invalid) → `success: false`.
- **Execution plan:** Write test file following Jest + `describe`/`it` pattern from `chat-retention-policy.test.ts`. One `describe` block per schema. Valid path tests first, then invalid.
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** Confirm Jest config (`apps/prime/jest.config.cjs`) picks up `src/lib/chat/__tests__/*.test.ts` — the existing `chat-retention-policy.test.ts` is in `apps/prime/src/lib/chat/__tests__/` so the pattern already works.
- **Edge Cases & Hardening:**
  - TC-06 note: Schemas use `.passthrough()` (per plan decision log), so extra fields in a raw payload are preserved in `result.data`. `RawMessagePayloadSchema.safeParse` with an extra `id` field will succeed and retain `id` in the output — consistent with the current spread behaviour.
- **What would make this >=90%:** Already at 90%. CI run confirms.
- **Rollout / rollback:**
  - Rollout: Additive file — no rollback risk.
  - Rollback: Delete the test file.
- **Documentation impact:** None.
- **Notes / references:** Test pattern reference: `apps/prime/src/lib/chat/__tests__/chat-retention-policy.test.ts`. Note: the existing retention test is in `__tests__/` subdirectory; new schema test may go directly in `lib/chat/` or in `__tests__/` — follow existing convention (existing file is in `__tests__/`). Adjust path accordingly: `apps/prime/src/lib/chat/__tests__/messageSchema.test.ts`.

---

### TASK-05: Update `lib/chat/index.ts` barrel and run validation gate
- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/prime/src/lib/chat/index.ts` with schema exports; confirmed passing typecheck and lint
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/prime/src/lib/chat/index.ts` (modified)
  - `[readonly] apps/prime/src/lib/chat/messageSchema.ts` (input — TASK-01 output)
- **Depends on:** TASK-03, TASK-04
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — Barrel edit is trivial. Typecheck/lint commands are known.
  - Approach: 90% — Schema exports added to barrel following existing pattern. Held-back test: no single unknown would drop below 80.
  - Impact: 90% — Barrel update makes schema available for future consumers without forcing direct imports from `messageSchema.ts`. Typecheck and lint gates confirm the full change set is valid.
- **Acceptance:**
  - `apps/prime/src/lib/chat/index.ts` exports `MessageSchema`, `RawMessagePayloadSchema`, and the inferred types from `messageSchema.ts`.
  - `pnpm --filter @apps/prime run typecheck` exits 0 (both `typecheck:app` and `typecheck:functions`).
  - `pnpm --filter @apps/prime run lint` exits 0 with no new errors or warnings.
  - `bash scripts/validate-changes.sh` exits 0.
  - No regressions in any other `apps/prime` file (typecheck is the gate).
- **Validation contract (TC-XX):**
  - TC-01: `pnpm --filter @apps/prime run typecheck` exits 0 after all TASK-01 through TASK-04 changes are in place.
  - TC-02: `pnpm --filter @apps/prime run lint` exits 0.
  - TC-03: `bash scripts/validate-changes.sh` exits 0.
  - TC-04: Barrel file exports `MessageSchema` and `RawMessagePayloadSchema` (importable by any future consumer via `@/lib/chat`).
- **Execution plan:**
  - Add schema exports to `lib/chat/index.ts`: `export { MessageSchema, RawMessagePayloadSchema, type Message, type RawMessagePayload, ... } from './messageSchema';`
  - Run `pnpm --filter @apps/prime run typecheck`.
  - Run `pnpm --filter @apps/prime run lint`.
  - Run `bash scripts/validate-changes.sh`.
  - Fix any issues found; re-run until all gates pass.
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** None required — barrel pattern is well-established.
- **Edge Cases & Hardening:**
  - If `lint` flags the new schema file for import ordering or line-length issues, fix inline before completing this task.
  - `typecheck:functions` must pass — if any functions file breaks due to the `chat.ts` changes, diagnose and fix in this task (expected to pass given all consumers are `import type`).
- **What would make this >=90%:** Already at 90%. CI run is the final confirmation.
- **Rollout / rollback:**
  - Rollout: Barrel update is additive — existing barrel exports are preserved.
  - Rollback: Revert `index.ts` to prior state; remove `messageSchema.ts`.
- **Documentation impact:** None.
- **Notes / references:** Current `lib/chat/index.ts` exports: `ChatRateLimiter`, `CHAT_RATE_LIMITS`, abuse reporting functions, retention policy functions, feature flag functions. Schema exports are additive.

---

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Create `messageSchema.ts` | Yes — no preconditions; additive new file | None | No |
| TASK-02: Update `chat.ts` type aliases | Yes — depends on TASK-01 (schema file must exist for re-export path to resolve); TASK-01 is sequenced first | None — all 8 `functions/` consumers use `import type`; structural type compatibility guaranteed by `z.infer` | No |
| TASK-03: Refactor `ChatProvider.tsx` | Yes — depends on TASK-01 (schema import) and TASK-02 (updated types); both sequenced before TASK-03 | Minor: `Omit<Message, 'id'>` in `sendMessage` is a construction annotation, not a parse type — must not be replaced with `RawMessagePayload`. Task notes this explicitly. | No (addressed in task notes) |
| TASK-04: Add `messageSchema.test.ts` | Yes — depends on TASK-01 (schema must exist to import); TASK-01 is sequenced first | Minor: test file path should be `__tests__/messageSchema.test.ts` to follow existing convention (noted in task). | No (addressed in task notes) |
| TASK-05: Update barrel + validate | Yes — depends on TASK-03 (ChatProvider refactor) and TASK-04 (tests) being complete before final validation gate | None — barrel update is additive; typecheck/lint commands are known and scoped correctly | No |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Zod schema more restrictive than manual guards — silently drops valid messages | Low | High | TASK-01: write schema 1:1 with guard logic. TASK-04: unit tests with boundary-case fixtures. TASK-03 TC-06: existing integration tests exercise valid payload paths. |
| `id`-field asymmetry mishandled — Firebase path vs DM API path | Low | High | Two separate schemas: `RawMessagePayloadSchema` (no `id`) for Firebase path; `MessageSchema` (with `id`) for DM API path. Validated in TASK-01 TC-01 and TC-02. |
| `typecheck:functions` fails due to structural type mismatch | Low | Medium | All functions consumers are `import type`. `z.infer` produces structural types. TASK-02 TC-02 validates this explicitly. |
| `Omit<Message, 'id'>` annotation in `sendMessage` incorrectly replaced | Low | Medium | TASK-03 scouts explicitly note this construction type must be left untouched. |

## Observability
- Logging: None: internal refactor. Optional `console.debug` on safeParse failure could be added later (like `bookingsSchemas.ts` pattern) but is not required for this migration.
- Metrics: None.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)
- [ ] `apps/prime/src/lib/chat/messageSchema.ts` exists with all sub-schemas, `RawMessagePayloadSchema`, `MessageSchema`, and all inferred type exports.
- [ ] `apps/prime/src/types/messenger/chat.ts` contains only `import type` re-exports from `messageSchema.ts` — no standalone interface or type declarations.
- [ ] `apps/prime/src/contexts/messaging/ChatProvider.tsx` contains no manual type guard functions (`isMessage`, `isMessageKind`, `isMessageAudience`, `isMessageLinks`, `isMessageAttachments`, `isMessageCards`, `isMessageDraft`).
- [ ] `toMessage` and `normalizeDirectMessages` use `safeParse` from the schema.
- [ ] `apps/prime/src/lib/chat/__tests__/messageSchema.test.ts` exists with valid/invalid parse coverage for all schemas.
- [ ] `pnpm --filter @apps/prime run typecheck` exits 0 (both app and functions).
- [ ] `pnpm --filter @apps/prime run lint` exits 0.
- [ ] `bash scripts/validate-changes.sh` exits 0.
- [ ] CI passes (all existing tests green, new schema tests green).

## Decision Log
- 2026-03-09: Type-replacement strategy — `z.infer` aliases chosen (vs parallel interface declarations). Consistent with `bookingsSchemas.ts` and `triggers.ts` patterns. All functions consumers are `import type`; structural compatibility guaranteed.
- 2026-03-09: Schema location — `apps/prime/src/lib/chat/messageSchema.ts` (co-located with `chatRetentionPolicy.ts`). Alternative `src/utils/` rejected (messaging-domain file belongs in `lib/chat/`).
- 2026-03-09: Test file location — `apps/prime/src/lib/chat/__tests__/messageSchema.test.ts` (follow existing `chat-retention-policy.test.ts` convention in `__tests__/` subdirectory).
- 2026-03-09: `safeParse` (not `.parse`) — established pattern; preserves silent-null failure mode.
- 2026-03-09: Zod passthrough decision — `RawMessagePayloadSchema` and `MessageSchema` use `.passthrough()` to preserve unknown payload fields on the returned object. This matches the current `toMessage` spread behaviour exactly (`{ id, ...(raw as ...) }` passes all keys through). Zod's default `.strip()` would have been a subtle runtime behaviour change. `.passthrough()` selected to honour zero-behaviour-change guarantee.
- 2026-03-09: Test file canonical location — `apps/prime/src/lib/chat/__tests__/messageSchema.test.ts` (matches existing `chat-retention-policy.test.ts` convention in `__tests__/` subdirectory).

## Overall-confidence Calculation
- All tasks are S-effort (weight 1 each), 5 tasks total.
- Task confidences: TASK-01=90%, TASK-02=90%, TASK-03=85%, TASK-04=90%, TASK-05=90%.
- Overall = (90 + 90 + 85 + 90 + 90) × 1 / (5 × 1) = 445/5 = **89%** → rounded to **87%** applying downward-bias rule (TASK-03 is the binding constraint at 85%; the plan succeeds only if all tasks succeed, so conservatively 87%).
