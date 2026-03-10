---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: prime-chatprovider-zod-migration
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/prime-chatprovider-zod-migration/plan.md
Dispatch-ID: IDEA-DISPATCH-20260309140000-0002
Trigger-Source: direct-inject
---

# Prime ChatProvider Zod Migration Fact-Find Brief

## Scope

### Summary
`ChatProvider.tsx` contains 8 module-level functions that manually validate Firebase RTDB message payloads using ad-hoc `typeof` / `===` checks. These functions are co-located with the React context provider rather than with the `Message` type, creating an update burden whenever `chat.ts` types evolve. The migration replaces them with a single Zod schema file that derives types via `z.infer`, eliminates the guard boilerplate, and aligns with the existing Zod pattern already used in `bookingsSchemas.ts` and `triggers.ts`.

### Goals
- Replace the 8 manual type guard functions with a single Zod `MessageSchema` (plus sub-schemas for each complex field).
- Derive `Message` and sub-types from `z.infer` so the source of truth is the schema, not parallel interface declarations.
- Keep `ChatProvider.tsx` purely behavioural — no inline validation logic.
- Maintain identical runtime behaviour: `toMessage` returns `null` on failure, `normalizeDirectMessages` filters silently, no errors bubble to UI.

### Non-goals
- Changing Firebase read/write logic in `ChatProvider.tsx`.
- Migrating `roles.ts` or any type outside the chat payload boundary.
- Adding server-side validation (separate concern).
- Migrating `chatRetentionPolicy.ts` (it uses its own `MessageWithTimestamp` interface, not `Message`).

### Constraints & Assumptions
- Constraints:
  - `zod` is already a `^3.25.73` direct dependency of `apps/prime` — no new package install needed.
  - `@acme/zod-utils` is NOT in `apps/prime` dependencies; its error-map utility is irrelevant here.
  - `senderRole` is typed as `Role` in `chat.ts`; the schema must enumerate the same literals: `'guest' | 'staff' | 'admin' | 'owner' | 'na' | 'system'`.
  - The `id` field is not in the Firebase payload — it is injected by `toMessage(id, raw)` after retrieval. Schema must accept `Omit<Message, 'id'>` for raw payload, then re-attach `id`.
- Assumptions:
  - Silent parse failure (returning `null`) is the correct behaviour for invalid Firebase payloads — nothing in tests or callers expects a thrown error from `toMessage`.
  - `normalizeDirectMessages` filtering invalid messages is intentional, not accidental.

## Outcome Contract

- **Why:** 8 near-identical manual type guard functions (~110 lines) create an update burden: adding or renaming a `Message` field requires parallel edits in 8+ locations. The project already uses Zod for similar validation (`bookingsSchemas.ts`, `triggers.ts`); this migration brings consistency and eliminates the maintenance surface.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Zod `MessageSchema` replaces the 8 manual type guards; `chat.ts` types derive from `z.infer`; `ChatProvider.tsx` contains no inline validation logic; zero behaviour change at runtime; test coverage parity maintained.
- **Source:** auto

## Evidence Audit (Current State)

### Entry Points
- `apps/prime/src/contexts/messaging/ChatProvider.tsx` — React context provider; owns all 8 validation functions plus `toMessage` and `normalizeDirectMessages`
- `apps/prime/src/types/messenger/chat.ts` — TypeScript type declarations for `Message` and all sub-types

### Key Modules / Files
- `apps/prime/src/contexts/messaging/ChatProvider.tsx` (lines 193–308) — the 8 validation functions under investigation
- `apps/prime/src/types/messenger/chat.ts` — full `Message` interface plus `MessageLink`, `MessageAttachment`, `MessageCard`, `MessageDraftMeta`, `MessageKind`, `MessageAudience`, `MessageLinkVariant`, `MessageAttachmentKind`, `MessageDraftStatus`, `MessageDraftSource` types
- `apps/prime/src/types/messenger/roles.ts` — `Role` type: `'guest' | 'staff' | 'admin' | 'owner' | 'na' | 'system'`
- `apps/prime/src/utils/bookingsSchemas.ts` — reference Zod pattern: `z.object`, `z.infer`, `safeParse`, `zodErrorToString`
- `apps/prime/src/lib/messaging/triggers.ts` — reference Zod pattern: discriminated union, `z.literal`, `z.enum`
- `apps/prime/src/utils/zodErrorToString.ts` — helper already in prime for formatting Zod errors
- `apps/prime/src/contexts/messaging/__tests__/ChatProvider.direct-message.test.tsx` — tests for DM guards + message loading
- `apps/prime/src/contexts/messaging/__tests__/ChatProvider.channel-leak.test.tsx` — channel lifecycle tests

### The 8 Validation Functions (fully catalogued)

| # | Function | What it validates | Lines |
|---|---|---|---|
| 1 | `isMessage` | Top-level `Message` shape: required fields + calls sub-validators | 193–241 |
| 2 | `isMessageKind` | `MessageKind` enum: `'support' | 'promotion' | 'draft' | 'system'` | 243–245 |
| 3 | `isMessageAudience` | `MessageAudience` enum: `'thread' | 'booking' | 'room' | 'whole_hostel'` | 247–249 |
| 4 | `isMessageLinks` | `MessageLink[]` array: required `label`, `url`; optional `id`, `variant` | 251–259 |
| 5 | `isMessageAttachments` | `MessageAttachment[]` array: required `kind`, `url`; optional `id`, `title`, `altText`, `mimeType` | 261–271 |
| 6 | `isMessageCards` | `MessageCard[]` array: required `title`; optional `id`, `body`, `imageUrl`, `ctaLabel`, `ctaUrl` | 273–283 |
| 7 | `isMessageDraft` | `MessageDraftMeta` object: required `draftId`, `createdAt`, `status`, `source` | 285–299 |
| 8 | `toMessage` | Wrapper: injects `id` into raw payload, calls `isMessage` | 301–308 |

Helper (not a type guard but depends on validation):
- `normalizeDirectMessages` — filters API response array through `isMessage` (line 310–323)

### Call Sites (where each function is called)

All 8 functions are called **only within `ChatProvider.tsx`**:
- `isMessage` is called by `toMessage` (line 307) and `normalizeDirectMessages` (line 322)
- `isMessageKind`, `isMessageAudience`, `isMessageLinks`, `isMessageAttachments`, `isMessageCards`, `isMessageDraft` are called only by `isMessage`
- `toMessage` is called in 4 places within `ChatProvider.tsx` (Firebase message load, child-added/changed handlers, loadOlderMessages)
- `normalizeDirectMessages` is called in 2 places within `ChatProvider.tsx` (direct message poll response, loadOlderMessages DM path)

No external call sites were found. The validation functions are not exported and are not used outside `ChatProvider.tsx`.

### Patterns & Conventions Observed
- Zod schemas in prime live in `src/utils/` (`bookingsSchemas.ts`) or alongside the domain module (`lib/messaging/triggers.ts`). The most appropriate new location is `src/lib/chat/messageSchema.ts` (co-located with `chatRetentionPolicy.ts` and `chatRateLimiter.ts`).
- `z.infer` is used to derive TypeScript types from schemas rather than maintaining parallel interface declarations — evidenced by `bookingsSchemas.ts` (lines 51–54) and `triggers.ts` (lines 59, 76, 97, 116, 128, 153).
- `safeParse` (not `.parse`) is the pattern for fallible validation in prime — evidenced by `bookingsSchemas.ts` (lines 67, 90, 111).
- `zodErrorToString` is already available in `src/utils/zodErrorToString.ts` for dev-facing error formatting.

### Data & Contracts
- Types/schemas:
  - `Message` interface (15 fields): `id` (required string), `content` (required string), `senderId` (required string), `senderRole` (required `Role`), `senderName?` (string), `createdAt` (required number), `deleted?` (boolean), `imageUrl?` (string), `kind?` (MessageKind), `audience?` (MessageAudience), `links?` (MessageLink[]), `attachments?` (MessageAttachment[]), `cards?` (MessageCard[]), `campaignId?` (string), `draft?` (MessageDraftMeta)
  - Note: `id` field does NOT come from Firebase — it is injected as the Firebase key in `toMessage(id, raw)`. Schema should validate the raw payload (without `id`), then re-attach.
  - Sub-types: `MessageLink` (5 fields), `MessageAttachment` (6 fields), `MessageCard` (6 fields), `MessageDraftMeta` (4 fields)
  - `Role` = `'guest' | 'staff' | 'admin' | 'owner' | 'na' | 'system'` from `types/messenger/roles.ts`
- Persistence:
  - Firebase RTDB nodes: `${MSG_ROOT}/channels/${channelId}/messages` — keyed by message ID, value is the raw payload (without `id` field)
  - Direct messages API: `GET /api/direct-messages` returns `{ messages: unknown[] }` where each element includes `id` as a field (unlike Firebase)

### Dependency & Impact Map
- Upstream dependencies:
  - Firebase RTDB (raw message payloads)
  - `/api/direct-messages` endpoint (API response payloads — these DO include `id` in the response, unlike Firebase)
- Downstream dependents:
  - `ChatProvider` reducer and context consumers via `Message[]` state
  - `useChat()` hook consumers in chat UI components
- Likely blast radius:
  - **Validation functions**: Fully contained to `ChatProvider.tsx` — non-exported, no external call sites.
  - **Type changes in `chat.ts`**: Wider than just `ChatProvider.tsx`. `chat.ts` is also imported as `import type` in 8 files in `apps/prime/functions/`: `functions/api/direct-messages.ts`, `functions/lib/prime-messaging-repositories.ts`, `functions/lib/prime-review-api.ts`, `functions/lib/prime-review-campaigns.ts`, `functions/lib/prime-whole-hostel-campaigns.ts`, `functions/lib/prime-thread-projection.ts`, `functions/lib/prime-review-send-support.ts`, `functions/lib/prime-messaging-shadow-write.ts`. All are type-only imports (`import type { ... }`), so there is no runtime impact from switching interfaces to `z.infer` aliases — but `pnpm run typecheck:functions` (which runs `tsc -p tsconfig.functions.json`) must pass alongside `typecheck:app`. This is covered by `pnpm --filter @apps/prime run typecheck` which runs both targets.
  - **Summary**: Runtime blast radius is zero (type-only imports). TypeScript blast radius covers both app and functions — both typecheck targets must be validated.

### Handling the `id` field difference

Two code paths feed messages into the provider:
1. **Firebase path**: `toMessage(id: string, raw: unknown)` — `id` comes from the Firebase key, NOT in `raw`. Schema validates `raw` as `Omit<Message, 'id'>`, then caller constructs `{ id, ...parsed }`.
2. **Direct messages API path**: `normalizeDirectMessages(payload)` — the API response elements include `id` as a field. Here `isMessage(entry)` is used directly on the full object. Schema can validate the full `Message` object (with `id`).

This asymmetry is important: the migration must preserve both paths.

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest + `@testing-library/react`
- Commands: Tests are CI-only (per repo policy). The correct filter is `pnpm --filter @apps/prime test`. Do not run tests locally.
- CI integration: `reusable-app.yml` runs tests on push

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| ChatProvider DM guards | Integration | `ChatProvider.direct-message.test.tsx` | Covers DM fetch, channel access denial, pagination, rate-limit backoff, send guards — exercises `normalizeDirectMessages` indirectly via mock fetch payloads |
| ChatProvider channel lifecycle | Integration | `ChatProvider.channel-leak.test.tsx` | Covers listener attach/detach — exercises `toMessage` indirectly via mock Firebase snapshots |
| Message retention | Unit | `chat-retention-policy.test.ts` | Only covers `chatRetentionPolicy.ts`, not `isMessage` |
| Booking schemas | Unit | (inferred from `bookingsSchemas.ts` pattern) | Not relevant — separate domain |

**Key gap**: No direct unit tests exist for `isMessage`, `isMessageKind`, `isMessageAudience`, `isMessageLinks`, `isMessageAttachments`, `isMessageCards`, `isMessageDraft`. The validation logic is exercised only implicitly through integration tests using valid mock payloads.

#### Coverage Gaps
- Untested paths:
  - Invalid message payloads (missing required fields, wrong types, invalid enum values)
  - Partial/malformed sub-objects (bad `links`, `cards`, `attachments`, `draft`)
  - `toMessage` returning `null` for invalid raw data
  - `normalizeDirectMessages` filtering out invalid entries
- Extinct tests: None known.

#### Testability Assessment
- Easy to test: A Zod schema is significantly easier to unit-test than manual type guards. Each schema can be tested with `safeParse` against valid and invalid fixtures.
- Hard to test: Nothing difficult — the schema will be a pure module with no side effects.
- Test seams needed: New `messageSchema.test.ts` covering valid/invalid cases for each sub-schema plus the top-level `MessageSchema`.

### Recent Git History (Targeted)
- `ChatProvider.tsx` and `chat.ts` — last touched in `f146ea5dc1` (feat: complete unified messaging review flow), `0e8cd553d4` (feat: HttpOnly cookie migration), `1496cbf9e3` (feat: channel messaging UI and privacy-safe opt-in controls TASK-45/46). Active file with recent changes — migration should be clean and forward-looking.

## Questions

### Resolved
- Q: Is `zod` already a dependency of `apps/prime`?
  - A: Yes. `"zod": "^3.25.73"` is in `apps/prime/package.json` dependencies.
  - Evidence: `apps/prime/package.json` inspected directly.

- Q: Does `@acme/zod-utils` have anything reusable for this pattern?
  - A: No. `@acme/zod-utils` is NOT in `apps/prime` dependencies and should not be added. It exports only `initZod` (error map initialisation) and `friendlyErrorMap`. The migration should use `zod` directly with the local `zodErrorToString` pattern.
  - Evidence: `packages/zod-utils/src/index.ts`, `apps/prime/package.json`

- Q: What is the right schema structure — single `MessageSchema` or per-type schemas?
  - A: A nested but flat-exported set: one Zod schema per sub-type (`MessageLinkSchema`, `MessageAttachmentSchema`, `MessageCardSchema`, `MessageDraftMetaSchema`) composing into a top-level `RawMessagePayloadSchema` (validates the Firebase raw payload without `id`) and a separate `MessageSchema` (validates the full Message including `id`, used for the API path). TypeScript types are derived via `z.infer` and re-exported to replace the current interface declarations in `chat.ts`. This mirrors the pattern in `triggers.ts` which uses sub-schemas composing into a discriminated union.
  - Evidence: `apps/prime/src/lib/messaging/triggers.ts` (sub-schema composition pattern), `apps/prime/src/types/messenger/chat.ts` (current type structure)

- Q: What happens if `safeParse` fails — risk of silent breakage?
  - A: Under the current manual guards, a failed validation returns `false` from `isMessage`, which causes `toMessage` to return `null`, which is then filtered out by `.filter((m): m is Message => m !== null)`. The same behaviour is preserved with Zod: `schema.safeParse(raw).success === false` → return `null`. The behaviour is intentionally silent — invalid Firebase payloads are dropped, not surfaced as UI errors. The only risk is if the Zod schema is MORE restrictive than the current manual guards (e.g., rejecting a valid field that the guards accepted). Careful schema alignment with the current guards mitigates this.
  - Evidence: `ChatProvider.tsx` lines 301–308 (`toMessage`), 310–323 (`normalizeDirectMessages`), 549–556 (Firebase load filtering)

- Q: What test coverage currently exists for validation logic?
  - A: No direct unit tests for the 8 guard functions. Coverage is implicit through integration tests (`ChatProvider.direct-message.test.tsx`, `ChatProvider.channel-leak.test.tsx`) which use valid mock payloads. Invalid payload rejection is not directly tested.
  - Evidence: Test files inspected above.

- Q: Are there any external call sites for the type guard functions?
  - A: No. All 8 functions are non-exported and used only within `ChatProvider.tsx`. The only external dependency is the `Message` type exported from `chat.ts`, which continues to be available after migration.
  - Evidence: `grep` across `apps/prime/src` for all 8 function names — only `ChatProvider.tsx` matched.

- Q: Should the `chat.ts` interface declarations be replaced by `z.infer` type aliases, or kept as parallel declarations?
  - A: Replace with `z.infer` type aliases. This is the established pattern in the same app (`bookingsSchemas.ts`, `triggers.ts`), removes the drift risk, and is compatible with the 7 functions files that use `import type` from `chat.ts`. `z.infer` produces structural types that are assignment-compatible with any existing interface consumers — no breakage. Default decision; no operator input required.
  - Evidence: `apps/prime/src/utils/bookingsSchemas.ts` (lines 51–54), `apps/prime/src/lib/messaging/triggers.ts`, `apps/prime/functions/` import survey (all `import type`).

### Open (Operator Input Required)
None. The type-replacement strategy is defaulted to `z.infer` aliases (see Resolved below). No operator-only knowledge is required to proceed.

## Confidence Inputs
- Implementation: 92%
  - Evidence: Both anchor files fully read. All 8 functions catalogued. All call sites confirmed. Zod already present. Pattern precedent well-established in same codebase.
  - To reach 95%: Confirm the DM API path includes `id` in payload (current code uses `isMessage` directly on API response items — need to confirm schema handles this correctly at implementation time).
- Approach: 92%
  - Evidence: `bookingsSchemas.ts` and `triggers.ts` are direct precedents for the schema structure. The `toMessage` id-injection asymmetry is understood. safeParse failure mode is confirmed to be silent/null. Type-replacement strategy defaulted to `z.infer` aliases — no operator input required.
  - To reach 95%: Verify DM API path includes `id` in payload at implementation time (confirmed by test fixtures; 99% certain).
- Impact: 95%
  - Evidence: Blast radius is contained. No external call sites. Runtime behaviour is identical. Tests continue to pass (same mock payloads, same Message type shape).
  - To reach 95%: Already at 95%.
- Delivery-Readiness: 90%
  - Evidence: All dependencies present, pattern established, scope fully bounded, no blockers.
  - To reach 95%: Operator answer on type replacement strategy.
- Testability: 95%
  - Evidence: A Zod schema is trivially unit-testable. New `messageSchema.test.ts` can cover all valid/invalid cases cleanly. Existing integration tests will continue to exercise the schema implicitly.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Zod schema MORE restrictive than manual guards — silently drops previously-valid messages | Low | High | Map schema fields to guards 1:1. Write explicit unit tests against the guard behaviour before migration. |
| `id` field asymmetry handled incorrectly — Firebase path vs API path differ | Low-Medium | High | New schema file must have two export shapes: `RawMessagePayloadSchema` (no `id`) and `MessageSchema` (with `id`). Unit tests must cover both. |
| Type replacement in `chat.ts` breaks downstream consumers that rely on `interface` structural typing | Low | Medium | `z.infer` produces structural types that are compatible with `interface` consumers — no runtime change. TypeScript typecheck confirms compatibility. |
| Zod v3 vs v4 API mismatch (zodErrorToString references Zod 4 in its JSDoc) | Low | Low | The file comment says "Zod 4" but the package is `^3.25.73`. The utility itself is compatible with Zod 3. Migration uses standard `z.object`, `z.string`, `z.enum`, `z.array`, `z.optional` — no v4-specific APIs needed. |

## Planning Constraints & Notes
- Must-follow patterns:
  - Schema file lives at `apps/prime/src/lib/chat/messageSchema.ts` (alongside `chatRetentionPolicy.ts`)
  - Export both schemas AND inferred types from schema file
  - Use `safeParse` (not `parse`) to maintain silent-null failure mode
  - Export from `apps/prime/src/lib/chat/index.ts` barrel
- Validation gate:
  - `pnpm --filter @apps/prime run typecheck` (covers both `typecheck:app` and `typecheck:functions`)
  - `pnpm --filter @apps/prime run lint`
  - `bash scripts/validate-changes.sh` (before commit, per repo AGENTS policy)
  - Tests are CI-only — push to branch and monitor `gh run watch`
- Rollout/rollback expectations:
  - Pure refactor with no external API changes — rollback is a simple revert.
  - No feature flags needed.
- Observability expectations:
  - No change to runtime logging. If desired, a `console.debug` on safeParse failure could be added (matching the `bookingsSchemas.ts` error logging pattern) but is not required.

## Suggested Task Seeds (Non-binding)
1. **Create `messageSchema.ts`** — write Zod schemas for all sub-types and `Message`, export inferred types.
2. **Update `chat.ts`** — replace interface declarations with `z.infer` type aliases exported from the new schema file. Verify all 8 `functions/` consumers still typecheck.
3. **Update `ChatProvider.tsx`** — remove the 8 manual guard functions; replace `isMessage`/`toMessage`/`normalizeDirectMessages` with schema-based equivalents using `safeParse`.
4. **Add `messageSchema.test.ts`** — unit tests covering valid and invalid payloads for each sub-schema and the top-level schema.
5. **Update `lib/chat/index.ts`** — export schema and types from barrel.
6. **Typecheck + lint** — `pnpm typecheck && pnpm lint` gate.

## Execution Routing Packet
- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `apps/prime/src/lib/chat/messageSchema.ts` exists with all sub-schemas and top-level `MessageSchema` / `RawMessagePayloadSchema`
  - `apps/prime/src/contexts/messaging/ChatProvider.tsx` contains no manual type guard functions
  - `apps/prime/src/types/messenger/chat.ts` types are `z.infer` aliases derived from the schema (no parallel interface declarations)
  - `apps/prime/src/lib/chat/messageSchema.test.ts` exists with coverage for valid and invalid cases
  - `pnpm --filter @apps/prime run typecheck` passes (runs both `typecheck:app` and `typecheck:functions` — covers both app and functions import surfaces)
  - `pnpm --filter @apps/prime run lint` passes with zero new errors/warnings introduced
- Post-delivery measurement plan:
  - Verify CI passes (tests, typecheck, lint)
  - No runtime behaviour change (confirmed by unchanged test results)

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| All 8 validation functions — catalogued with line ranges | Yes | None | No |
| Call sites — all locations that invoke each function | Yes | None | No |
| `Message` type shape — all fields, optional vs required | Yes | None | No |
| `id` field asymmetry (Firebase key vs API field) | Yes | None — documented as constraint | No |
| `Role` type dependency | Yes | None | No |
| Zod dependency presence and version | Yes | None | No |
| `@acme/zod-utils` relevance | Yes | Not relevant — not in prime deps | No |
| Existing Zod patterns in prime for schema structure precedent | Yes | None | No |
| Test coverage for validation logic | Yes | Gap: no direct unit tests for guard functions | No (advisory) |
| External call sites for validation functions outside `ChatProvider.tsx` | Yes | None found — functions are non-exported | No |
| `chat.ts` type consumers in functions/ | Yes | 7 functions files use `import type` from `chat.ts` — typecheck blast radius confirmed, runtime blast radius zero | No |

## Scope Signal
- Signal: `right-sized`
- Rationale: The validation function migration is contained to `ChatProvider.tsx` plus a new `messageSchema.ts` file (no external call sites). The `chat.ts` type replacement is also required and extends the TypeScript blast radius to 8 `functions/` files — all via `import type`, so runtime blast radius is zero and the additional typecheck scope is manageable. Zod is already present. Pattern precedent is established in the same app. Risk of silent breakage is understood and mitigated by careful schema alignment. Test surface is well-defined.

## Evidence Gap Review

### Gaps Addressed
1. **Zod dependency** — confirmed present at `^3.25.73`, no install needed.
2. **`@acme/zod-utils` relevance** — confirmed irrelevant, not in prime deps.
3. **All 8 function signatures and call sites** — fully read and catalogued from source.
4. **`Role` type** — confirmed as 6-variant string literal union from `roles.ts`.
5. **`id` field asymmetry** — identified and documented: Firebase path injects id externally, API path includes id in payload. Both paths handled in migration plan.
6. **Safe-parse failure mode** — confirmed: silent null return is the correct and intentional behaviour.
7. **Test coverage landscape** — confirmed: no direct unit tests for guard functions; implicit coverage via integration tests.
8. **Schema structure choice** — resolved in favour of nested sub-schemas → top-level schema, consistent with `triggers.ts` precedent.
9. **`chat.ts` consumers in `functions/`** — found 8 functions files using `import type` from `chat.ts` (including `prime-messaging-shadow-write.ts`). All are type-only imports. TypeScript blast radius covers both app and functions typechecks; runtime blast radius is zero.
10. **Field count correction** — `Message` interface has 15 fields (not 14 as initially stated). Count corrected.
11. **Validation commands** — corrected to scoped `pnpm --filter @apps/prime run typecheck` (which runs both `typecheck:app` and `typecheck:functions` targets). Tests are CI-only.
12. **Type-replacement strategy** — defaulted to `z.infer` aliases; moved from Open to Resolved.

### Confidence Adjustments
- Implementation confidence starts high (92%) due to fully read source files, complete function catalogue, and confirmed Zod presence.
- One open question (type replacement vs parallel declarations) could lower approach confidence by ~5% if the operator chooses a non-standard path — mitigated by defaulting to the `z.infer` replacement pattern.

### Remaining Assumptions
- Direct messages API response elements include `id` as a field (current code uses `isMessage` directly on API response items, implying `id` must be present for validation to pass). This is a runtime assumption — confirmed by test fixtures in `ChatProvider.direct-message.test.tsx` (line 140-150: mock payload includes `id: 'msg_2'`).
- No other files in the prime app consume `isMessage`, `toMessage`, or `normalizeDirectMessages` beyond what `grep` found (non-exported functions; confident).

## Planning Readiness
- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan prime-chatprovider-zod-migration --auto`
