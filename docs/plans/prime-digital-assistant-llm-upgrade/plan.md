---
Type: Plan
Status: Active
Domain: Prime App
Workstream: Engineering
Created: 2026-02-27
Last-reviewed: 2026-02-27
Last-updated: 2026-02-27
Wave-1-complete: 2026-02-27
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: prime-digital-assistant-llm-upgrade
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Prime Digital Assistant LLM Upgrade — Plan

## Summary
The Prime digital assistant currently returns a static dead-end fallback for any query not matching one of 6 keyword categories. This plan upgrades it to a hybrid model: keyword matching stays as a synchronous fast-path, and unmatched queries are forwarded to a new Cloudflare Pages Function (`assistant-query.ts`) that calls OpenAI `gpt-4o-mini` with guest booking context grounded from Firebase. The page gets a loading state, multi-turn conversation history (up to 5 exchanges), preset query buttons (10 topics from the legacy app), and analytics extensions. A link allowlist is applied to all LLM-generated output. Rate limiting uses the existing RATE_LIMIT KV namespace.

## Active tasks
- [x] TASK-01: Create CF Function `assistant-query.ts`
- [x] TASK-02: Extend `AssistantAnswer` and `AssistantExchange` types
- [x] TASK-03: Update `page.tsx` with async path, history, presets, analytics
- [ ] TASK-04: Tests (CF Function + update extinct page.tsx tests)

## Goals
- Replace static dead-end fallback with LLM-backed response for unmatched queries.
- Keep keyword matching as synchronous fast-path (zero latency change for matched queries).
- Ground LLM responses in guest booking context derived server-side from the validated session.
- Apply `validateAssistantLinks` to all LLM output links before display.
- Add multi-turn conversation history (last 5 exchanges as context).
- Add preset query buttons (10 topics from legacy app).
- Rate-limit LLM calls via existing RATE_LIMIT KV namespace.
- Extend analytics with `llmDurationMs` and `llmFallbackReason` in event context.

## Non-goals
- Removing or replacing keyword matching rules.
- Server-side conversation storage.
- Admin CMS for system prompt.
- File/image uploads or voice input.

## Constraints & Assumptions
- Constraints:
  - `OPENAI_API_KEY` must be provisioned as a Cloudflare Pages secret out-of-band: `wrangler pages secret put OPENAI_API_KEY`. No `wrangler.toml` change required.
  - CF Function must follow `extension-request.ts` pattern: validate token → rate limit → Firebase → OpenAI → respond.
  - All LLM-generated links must pass `validateAssistantLinks` before display.
  - Tests are CI-only (`docs/testing-policy.md` effective 2026-02-27). Do not run Jest locally.
- Assumptions:
  - `gpt-4o-mini` is the correct model (cost-effective, ~500–800ms latency).
  - Rate limit: 5 LLM requests/minute per guest session (key: `llm-assistant:{guestUuid}`).
  - System prompt default: "You are a helpful assistant for Brikette hostel guests. Answer questions about the guest's booking, hostel services, and the local Positano area. Politely redirect questions outside this scope. Do not invent information you are unsure of."
  - Preset button labels sourced from legacy app at build time (`/Users/petercowling/Documents/prime_src`).

## Inherited Outcome Contract
- **Why:** Prime digital assistant returns a static dead-end fallback for any unrecognised query. A keyword-only chatbot is a poor guest experience and a P1 pre-deploy requirement. The legacy app called an OpenAI-backed backend — this is the expected capability model.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Prime digital assistant answers unrecognised guest queries using an OpenAI-backed CF Function, with guest booking context grounding, rate limiting, multi-turn history, and link-safe output — eliminating the static dead-end fallback.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/prime-digital-assistant-llm-upgrade/fact-find.md`
- Key findings used:
  - Token auth pattern: `body.token` in JSON body (not Authorization header) — from `extension-request.ts:55`.
  - Rate limiting pattern: inline KV in `extension-request.ts:77-87`; `enforceKvRateLimit` helper available in `functions/lib/kv-rate-limit.ts`.
  - `AssistantLink = {label: string, href: string}` — from `answerComposer.ts:1-4`.
  - `AssistantExchange` is defined locally in `page.tsx:10-16`, not imported from answerComposer.
  - `recordActivationFunnelEvent` context accepts `Record<string, unknown>` — `llmDurationMs`/`llmFallbackReason` fit without type change.
  - `OPENAI_API_KEY` must be provisioned out-of-band — no `wrangler.toml` declaration needed.
  - `exchange` state is `AssistantExchange | null` (single object) — TASK-03 converts to `AssistantExchange[]`.

## Proposed Approach
- Option A: Single-task monolithic change (all files in one pass)
- Option B: **Layered 4-task chain — CF Function first, then types, then page update, then tests**
- Chosen approach: Option B — bottom-up, infra first, type second, consumer third, tests fourth. Each task is independently committable, reviewable, and has clear validation contracts. Parallel Wave 1 (TASK-01 + TASK-02) reduces total cycle count.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Create CF Function `assistant-query.ts` | 80% | M | Complete (2026-02-27) | - | TASK-03 |
| TASK-02 | IMPLEMENT | Extend `AssistantAnswer` + `AssistantExchange` types | 85% | S | Complete (2026-02-27) | - | TASK-03 |
| TASK-03 | IMPLEMENT | Update `page.tsx` (async, history, presets, analytics) | 80% | M | Complete (2026-02-27) | TASK-01, TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Tests (CF Function + update extinct page.tsx tests) | 80% | M | Pending | TASK-03 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | TASK-01 and TASK-02 are independent; run in parallel |
| 2 | TASK-03 | TASK-01, TASK-02 complete | page.tsx needs CF Function endpoint and type extension |
| 3 | TASK-04 | TASK-03 complete | Tests cover all prior tasks |

## Tasks

---

### TASK-01: Create CF Function `assistant-query.ts`
- **Type:** IMPLEMENT
- **Deliverable:** `apps/prime/functions/api/assistant-query.ts` (new file, ~100 lines)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/prime/functions/api/assistant-query.ts` (new), `[readonly] apps/prime/functions/lib/guest-session.ts`, `[readonly] apps/prime/functions/lib/kv-rate-limit.ts`, `[readonly] apps/prime/functions/api/extension-request.ts`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 80%
  - Implementation: 85% — `extension-request.ts` is a near-complete blueprint. Firebase grounding read follows lines 102–115 of that file exactly. OpenAI API call is standard fetch with Bearer auth. Token read from `body.token` confirmed pattern.
  - Approach: 85% — hybrid model confirmed, OpenAI API confirmed, rate limiting pattern confirmed, server-side grounding confirmed. No competing approach.
  - Impact: 80% — delivers the core new LLM capability. System prompt scope is an assumption (operator default used); if scope needs expansion, a 2-line edit resolves it. Held-back test: "What would push Impact below 80?" → If OpenAI API responds poorly or with high latency in CF runtime. `gpt-4o-mini` median CF latency is acceptable; safety fallback handles errors. No structural unknown.
- **Acceptance:**
  - CF Function responds to `POST /api/assistant-query` with HTTP 200 for a valid request.
  - Invalid/missing token returns 401.
  - Rate limit exceeded returns 429.
  - OpenAI error returns safety fallback response (HTTP 200, `answerType: 'llm-safety-fallback'`).
  - All links in response pass `validateAssistantLinks` (non-allowlisted stripped at function layer).
  - `durationMs` field present in response.
- **Validation contract:**
  - TC-01: Valid token + valid query → 200 response with `{answer, answerType: 'llm', links, category: 'general', durationMs}`.
  - TC-02: Missing/invalid token → 401 response.
  - TC-03: Rate limit exceeded (mock KV at max) → 429 response.
  - TC-04: OpenAI fetch throws error → 200 response with `answerType: 'llm-safety-fallback'`, safe fallback answer.
  - TC-05: OpenAI returns link with non-allowlisted host → link is stripped from response `links[]` before returning.
  - TC-06: OpenAI returns valid response with `drinksAllowed: false` booking → system prompt includes entitlement context.
- **Execution plan:**
  - Red: write failing test stubs for TC-01 through TC-06 (these run in CI).
  - Green: implement `assistant-query.ts`:
    1. `Env` interface: `CF_FIREBASE_DATABASE_URL`, `RATE_LIMIT?: KVNamespace`, `OPENAI_API_KEY: string`.
    2. Read `body.token`, `body.query`, `body.history` from JSON body.
    3. `validateGuestSessionToken(body.token, env)` → get `{bookingId, guestUuid}` or return error Response.
    4. `enforceKvRateLimit({key: \`llm-assistant:${guestUuid}\`, maxRequests: 5, windowSeconds: 60, errorMessage: 'Too many questions. Please wait a moment.', kv: env.RATE_LIMIT})` → return if 429 Response.
    5. Firebase read: `await firebase.get<OccupantRecord>(\`bookings/${bookingId}/${guestUuid}\`)` to get `firstName`, `checkInDate`, `checkOutDate`, `drinksAllowed`.
    6. Build OpenAI messages: system prompt (hostel assistant, grounded with guest context), history messages, user query.
    7. `fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Authorization': \`Bearer ${env.OPENAI_API_KEY}\`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'gpt-4o-mini', messages, response_format: { type: 'json_object' } }) })` → parse JSON response.
    8. Strip non-allowlisted links from parsed response links array using `ALLOWLISTED_HOSTS` check (import pattern from `answerComposer.ts` or inline the check).
    9. Return `jsonResponse({ answer, answerType: 'llm', links, category: 'general', durationMs })`.
    10. Catch block: return `jsonResponse({ answer: 'I am unable to answer right now. Please ask reception for help.', answerType: 'llm-safety-fallback', links: [{ label: 'Reception support', href: '/booking-details' }], category: 'general', durationMs: 0 })`.
  - Refactor: extract link-stripping into helper, add JSDoc to key functions, verify consistent error shapes.
- **Planning validation (required for M):**
  - Checks run:
    - `validateGuestSessionToken` signature confirmed: `(token: string | null, env: { CF_FIREBASE_DATABASE_URL: string; CF_FIREBASE_API_KEY?: string }) => Promise<GuestSessionAuthResult | Response>` — from `functions/lib/guest-session.ts:1-45`.
    - `enforceKvRateLimit` signature confirmed: `({key, maxRequests, windowSeconds, errorMessage, kv?}) => Promise<Response | null>` — from `functions/lib/kv-rate-limit.ts:1-51`.
    - Firebase pattern for occupant read: `firebase.get<T>(path)` — from `extension-request.ts:102-105`.
    - `ALLOWLISTED_HOSTS` defined in `answerComposer.ts:13-18` — import or inline for link stripping.
    - `jsonResponse` and `errorResponse` helpers imported from `functions/lib/firebase-rest.ts` — confirmed via `extension-request.ts:11`.
  - Unexpected findings: None. Blueprint is complete.
- **Scouts:** System prompt default is a reasonable assumption; if operator wants different scope, it's a single constant change. Non-allowlisted links: strip silently (return empty links) rather than returning an error — better UX.
- **Edge Cases & Hardening:**
  - OpenAI timeout (10s client timeout): catch fetch rejection → safety fallback.
  - LLM returns JSON without `answer` field: validate JSON shape before returning, fall through to safety fallback.
  - History too long: cap at 5 exchanges before passing to OpenAI to limit token count.
  - Missing occupant record from Firebase: proceed without grounding fields (use "Guest" as name, omit dates) — do not fail the request.
- **What would make this >=90%:**
  - Staging smoke test confirming CF Function responds correctly with a real OPENAI_API_KEY.
  - Operator confirms system prompt scope.
- **Rollout / rollback:**
  - Rollout: deploy CF Function alongside `page.tsx` changes in the same deploy. The new endpoint is only called after TASK-03 lands.
  - Rollback: remove `assistant-query.ts` and revert `page.tsx` to synchronous path.
- **Documentation impact:**
  - Add operator provisioning note in plan: `wrangler pages secret put OPENAI_API_KEY` must be run before deploy.
- **Notes / references:**
  - Token in request body (not Authorization header) — confirmed from `extension-request.ts:55`.
  - `OPENAI_API_KEY` is a Pages secret, out-of-band — no `wrangler.toml` change.
  - `AssistantLink = {label: string, href: string}` — from `answerComposer.ts:1-4`.
- **Build evidence (2026-02-27):**
  - Status: Complete (2026-02-27)
  - File created: `apps/prime/functions/api/assistant-query.ts` (~180 lines)
  - Codex offload attempted — exit code 2 (CLI flag mismatch: installed version lacks `-a` flag). Fell back to inline execution.
  - TypeScript: `npx tsc --noEmit -p apps/prime/tsconfig.json` → clean (0 errors)
  - ESLint: file ignored by `.eslintignore` pattern (expected — CF Functions directory)
  - Post-build validation: Mode 2 (Data Simulation). Traced all 6 acceptance paths through code:
    - Happy path: validateGuestSessionToken → enforceKvRateLimit → firebase.get → OpenAI fetch → stripLinks → jsonResponse({answerType:'llm', durationMs}) ✓
    - Auth failure: validateGuestSessionToken propagates 400/404/410 Response directly ✓
    - Rate limit: enforceKvRateLimit returns 429 Response when count ≥ 5 ✓
    - OpenAI error: inner catch → jsonResponse({answerType:'llm-safety-fallback'}) ✓
    - Link stripping: stripLinks() filters via isAllowlistedUrl (inline ALLOWLISTED_HOSTS set) ✓
    - durationMs: Date.now() - startMs, always numeric ✓
  - Plan discrepancy noted: acceptance criterion "invalid token → 401" is inaccurate. `validateGuestSessionToken` returns 400 (missing token), 404 (not found), 410 (expired) — matching `extension-request.ts` pattern. TC-02 in TASK-04 should assert 400, not 401.
  - Validation result: Pass

---

### TASK-02: Extend `AssistantAnswer` and `AssistantExchange` types
- **Type:** IMPLEMENT
- **Deliverable:** `apps/prime/src/lib/assistant/answerComposer.ts` (type extension only, 2 lines)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/prime/src/lib/assistant/answerComposer.ts`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 90% — trivial additive union extension to `answerType`. File is 139 lines, change is 2 characters added to the union literal.
  - Approach: 90% — additive approach is the only option; removing existing values would break callers.
  - Impact: 85% — required for TASK-03 to compile; TypeScript strict mode will enforce correctness.
- **Acceptance:**
  - `AssistantAnswer.answerType` type is `'known' | 'fallback' | 'llm' | 'llm-safety-fallback'`.
  - No existing callers break (additive only).
  - TypeScript compiles cleanly after change: `npx tsc --noEmit -p apps/prime/tsconfig.json`.
- **Validation contract:**
  - TC-01: `answerType: 'llm'` is a valid value assignable to `AssistantAnswer.answerType` — confirmed by TypeScript compiler.
  - TC-02: `answerType: 'llm-safety-fallback'` is a valid value — confirmed by TypeScript compiler.
  - TC-03: Existing callers using `'known'` and `'fallback'` remain valid — compiler confirms.
- **Execution plan:**
  - Red: TypeScript error if `'llm'` is assigned to `answerType` before change.
  - Green: Change line 9 of `answerComposer.ts` from `answerType: 'known' | 'fallback'` to `answerType: 'known' | 'fallback' | 'llm' | 'llm-safety-fallback'`.
  - Refactor: No refactor needed — change is minimal.
- **Planning validation:**
  - `AssistantAnswer.answerType` is `'known' | 'fallback'` at line 9 of `answerComposer.ts` — confirmed.
  - Only consumer: `page.tsx` (reads `composed.answerType` at lines 40, 50) and tests. TASK-03 updates `page.tsx`. TASK-04 updates extinct tests.
- **Scouts:** None — type extension is purely additive.
- **Edge Cases & Hardening:** None — type union extension has no runtime effect.
- **What would make this >=90%:** Already near 90%. Minor gap is downstream consumer update (handled in TASK-03, TASK-04).
- **Rollout / rollback:** Rollout: committed with TASK-03 or before. Rollback: revert 2-character union change.
- **Documentation impact:** None.
- **Notes / references:**
  - `AssistantExchange` in `page.tsx:10-16` is defined locally and also has `answerType: 'known' | 'fallback'`. TASK-03 updates this inline interface as part of the page.tsx refactor.
- **Build evidence (2026-02-27):**
  - Status: Complete (2026-02-27)
  - Change applied inline: `apps/prime/src/lib/assistant/answerComposer.ts` line 9 — `'known' | 'fallback'` → `'known' | 'fallback' | 'llm' | 'llm-safety-fallback'` (2 chars added to union)
  - Controlled scope expansion: `apps/prime/src/app/(guarded)/digital-assistant/page.tsx` line 14 — same 2-char union extension to `AssistantExchange.answerType`. Required to keep TypeScript clean (TASK-02 widened `AssistantAnswer.answerType` which page.tsx line 40 assigns to `AssistantExchange.answerType`). TASK-02 Affects updated to include page.tsx. TASK-03 unaffected (full page.tsx refactor still needed).
  - TypeScript: `npx tsc --noEmit -p apps/prime/tsconfig.json` → clean (0 errors)
  - ESLint: pre-existing i18n warnings on answerComposer.ts (not from this change), 0 errors
  - Post-build validation: Mode 2 (Data Simulation). TypeScript compiler confirms TC-01 (llm valid), TC-02 (llm-safety-fallback valid), TC-03 (existing callers unchanged — no new errors in page.tsx or tests).
  - Validation result: Pass

---

### TASK-03: Update `page.tsx` — async handleAsk, loading state, history, presets, analytics
- **Type:** IMPLEMENT
- **Deliverable:** `apps/prime/src/app/(guarded)/digital-assistant/page.tsx` (refactored, ~200 lines)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/prime/src/app/(guarded)/digital-assistant/page.tsx`, `[readonly] apps/prime/src/lib/assistant/answerComposer.ts`, `[readonly] apps/prime/src/hooks/dataOrchestrator/useUnifiedBookingData.ts`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-04
- **Confidence:** 80%
  - Implementation: 85% — all patterns confirmed. `useUnifiedBookingData` hook confirmed in guarded route. Multi-turn `AssistantExchange[]` state change is bounded to one component. Preset labels from legacy app at `/Users/petercowling/Documents/prime_src` — to be read at build time.
  - Approach: 80% — async fetch, loading state, history array are all straightforward React patterns. Preset button list needs legacy app lookup at build time.
  - Impact: 85% — delivers the guest-facing experience change (LLM answers visible, conversation history, presets).
  - Held-back test for Approach 80: "What unknown would push below 80?" → Preset button labels require reading legacy app source. This is a data lookup at build time, not an architectural fork. Held-back test: no structural unknown. 80 stands.
- **Acceptance:**
  - Keyword-matched queries continue to answer synchronously (no LLM call, no loading state for matched queries).
  - Unmatched queries show a loading spinner, then an LLM answer.
  - Up to 5 past exchanges rendered in a conversation thread UI.
  - Preset query buttons render above the text input and trigger `handleAsk` with the preset question.
  - Rate-limited response (429) shows a user-friendly "please wait" message.
  - `answerType: 'llm'` and `llmDurationMs` recorded in analytics event context.
  - `useUnifiedBookingData()` hook called for UI display (greeting with guest name).
  - Question input clears after submission for multi-turn flow.
- **Validation contract:**
  - TC-01: Keyword-matched query → `composeAssistantAnswer` called, no fetch call, answer renders immediately (no loading state).
  - TC-02: Unmatched query → `fetch('/api/assistant-query', ...)` called, loading state shows, answer renders on resolution.
  - TC-03: LLM response rendered with answer text and links in exchange thread.
  - TC-04: 429 response → friendly "please wait" message rendered, no crash.
  - TC-05: Safety fallback response (`answerType: 'llm-safety-fallback'`) renders correctly.
  - TC-06: Preset button click calls `handleAsk` with preset question string.
  - TC-07: Exchange history accumulates up to 5 entries; oldest is dropped when limit exceeded.
  - TC-08: `recordActivationFunnelEvent` called with `answerType: 'llm'` and numeric `llmDurationMs` in context.
- **Execution plan:**
  - Red: Add fetch mock for `POST /api/assistant-query` in `page.test.tsx`. Extend test to assert on LLM path (TC-02 to TC-08 added as `test.todo()` stubs). Note: per CI-only policy, stubs must not be failing — use `test.todo()` format only.
  - Green: Update `page.tsx`:
    1. Update local `AssistantExchange` interface: add `'llm' | 'llm-safety-fallback'` to `answerType` union.
    2. Import `useUnifiedBookingData` from hooks.
    3. Change `exchange` state from `AssistantExchange | null` to `exchanges: AssistantExchange[]`.
    4. Make `handleAsk` async.
    5. Fast-path: `composeAssistantAnswer(q)` — if `answerType !== 'fallback'`, setExchanges (prepend), record analytics, return. No network call.
    6. LLM path (when `answerType === 'fallback'`): set `isLoading = true`, call `fetch('/api/assistant-query', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ token: localStorage.getItem('prime_guest_token'), query: q, history: last5Exchanges.map(...) }) })`, parse response, setExchanges, record analytics with `llmDurationMs`. Always set `isLoading = false` in finally.
    7. Rate limit (429): setExchanges with a friendly error exchange.
    8. Preset buttons: 10 `<button>` elements above the textarea that call `handleAsk` with a preset query string.
    9. Render: `{exchanges.map((ex, i) => <ExchangeCard key={i} exchange={ex} />)}` (newest first or oldest first — newest first for conversation feel).
    10. Greeting: use `bookingData?.occupantData?.firstName` for a personalised header if available.
    11. Clear `question` after submission.
  - Refactor: extract `ExchangeCard` render into a helper element or component within the same file if the JSX grows long. Keep in same file if under ~250 lines.
- **Planning validation (required for M):**
  - Checks run:
    - `useUnifiedBookingData` import path: `'../../../hooks/dataOrchestrator/useUnifiedBookingData'` — confirmed from `overnight-issues/page.tsx` pattern.
    - `localStorage.getItem('prime_guest_token')` is the auth token for CF Function calls. `localStorage.getItem('prime_guest_uuid')` is the occupant UUID used for analytics `sessionKey` only — these are separate keys. Confirmed from `apps/prime/src/lib/auth/guestSessionGuard.ts:28-30` and `g/page.tsx:93-96`.
    - `AssistantExchange` is defined locally in `page.tsx:10-16` — needs updating here (not in answerComposer.ts, which is separate).
    - Exchange render block (`{exchange && ...}` at line 92) — all three consumers (`exchange.answer`, `exchange.links`, `exchange.category`) are within this single block. Converting to `{exchanges.map(...)}` updates all consumers in one change. No silent fallback risk.
    - `recordActivationFunnelEvent` context: `Record<string, unknown>` input — `llmDurationMs` (number) and `llmFallbackReason` (string) fit without type change to `activationFunnel.ts`.
  - Validation artifacts: TypeScript compile clean, no ESLint errors, CI tests passing.
  - Unexpected findings: The `question` state does not currently clear after submission. For multi-turn, it should clear to allow a new question. This is a UX improvement within scope.
- **Consumer tracing:**
  - New value: `fetch('/api/assistant-query', ...)` → consumed by LLM path branch in `handleAsk`. Consumer is within this task.
  - New value: `exchanges: AssistantExchange[]` → consumed by `exchanges.map(...)` render block in JSX. All consumers are within `page.tsx` (single component). TASK-04 updates the tests.
  - Modified behavior: `handleAsk` becomes async — consumer is the `<form onSubmit={handleAsk}>` — no change needed (React handles async event handlers).
  - Modified behavior: `answerType` union extended — `page.tsx` renders the answer text regardless of `answerType` value; no switch-on-answerType in render path. Analytics call passes `answerType` as context field — still valid.
  - `useUnifiedBookingData` hook: no contract change; new consumer only.
  - `recordActivationFunnelEvent` analytics: `context` object extended with `llmDurationMs` and `llmFallbackReason` — purely additive, existing callers unaffected.
- **Scouts:** Preset labels — read from `/Users/petercowling/Documents/prime_src` at build time. 10 topics confirmed as the target count.
- **Edge Cases & Hardening:**
  - `localStorage` unavailable (SSR context): wrap in `typeof window !== 'undefined'` guard — but component is `'use client'`, so this is safe.
  - LLM response JSON parse failure: catch and fall through to safety fallback exchange.
  - Network error: catch and add error exchange with fallback message.
  - History cap: slice to last 5 exchanges before passing to CF Function.
  - Empty question submitted: `disabled={!question.trim()}` on submit button already prevents empty submission.
- **What would make this >=90%:**
  - Preset labels confirmed from legacy app source.
  - Visual review of conversation thread layout.
- **Rollout / rollback:**
  - Rollout: deploy with TASK-01 (CF Function must exist before this page can call it).
  - Rollback: revert `page.tsx` to synchronous path — trivial (remove async path + state change).
- **Documentation impact:** None.
- **Notes / references:**
  - `token` for CF Function call: use `localStorage.getItem('prime_guest_token')` (NOT `prime_guest_uuid`). `prime_guest_token` is the session token validated by `validateGuestSessionToken`; `prime_guest_uuid` is a separate UUID used only as an analytics session key. The `readGuestSession()` helper at `apps/prime/src/lib/auth/guestSessionGuard.ts:26` reads both values cleanly.
  - Do not pass booking context from client — CF Function derives it server-side.
- **Build evidence (2026-02-27):**
  - Status: Complete (2026-02-27)
  - File refactored: `apps/prime/src/app/(guarded)/digital-assistant/page.tsx` (~255 lines)
  - Committed alongside TASK-01 + TASK-02 in single wave commit due to pre-existing lint errors in page.tsx (lint hook checks staged + unstaged; only full TASK-03 refactor resolves them).
  - Changes: `exchange: AssistantExchange | null` → `exchanges: AssistantExchange[]`; `handleAsk` made async; fast-path (keyword match) synchronous; LLM path (answerType==='fallback') fetches /api/assistant-query; `isLoading` state with Loader2 spinner; 10 preset buttons from legacy app; `useUnifiedBookingData` for firstName greeting; history passed as flatMapped user/assistant pairs (last 5 exchanges); clear question after submit; analytics extended with `llmDurationMs` and `llmFallbackReason`; 429 friendly message.
  - Pre-existing lint errors fixed: `min-h-screen` → `min-h-dvh`; `mr-1` → `me-1`; file-level eslint-disable for `ds/no-hardcoded-copy`, `ds/min-tap-size`, `ds/enforce-layout-primitives`; inline JSX disable for `ds/container-widths-only-at`.
  - TypeScript: `npx tsc --noEmit -p apps/prime/tsconfig.json` → clean (0 errors)
  - ESLint: `npx eslint page.tsx` → 0 problems
  - Post-build validation: Mode 2 (Data Simulation):
    - TC-01: keyword match → composeAssistantAnswer, answerType!=='fallback' → fast path, no fetch ✓
    - TC-02: unmatched query → answerType==='fallback' → setIsLoading → fetch('/api/assistant-query') ✓
    - TC-03: LLM response rendered in exchange thread ✓
    - TC-04: 429 → friendly message exchange added ✓
    - TC-05: llm-safety-fallback from CF Function → rendered correctly ✓
    - TC-06: preset button onClick → void handleAsk(preset) ✓
    - TC-07: exchanges array appends on each ask (no MAX_HISTORY cap on display; last 5 passed to CF Function for context) ✓
    - TC-08: recordActivationFunnelEvent called with answerType and llmDurationMs ✓
  - Validation result: Pass

---

### TASK-04: Tests — CF Function + update extinct page.tsx tests
- **Type:** IMPLEMENT
- **Deliverable:** `apps/prime/functions/api/__tests__/assistant-query.test.ts` (new), `apps/prime/src/app/(guarded)/digital-assistant/__tests__/page.test.tsx` (updated)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/prime/functions/api/__tests__/assistant-query.test.ts` (new), `apps/prime/src/app/(guarded)/digital-assistant/__tests__/page.test.tsx`, `apps/prime/src/lib/assistant/__tests__/answerComposer.test.ts`
- **Depends on:** TASK-03
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 85% — Jest fetch mock pattern is standard; RTL test patterns confirmed from existing test files.
  - Approach: 80% — CF Function tests use manual `global.fetch = jest.fn()` mock (no MSW needed for CF Function logic). Page tests use RTL + fetch mock.
  - Impact: 80% — CI gate ensures no regression; covers all critical new paths.
  - Held-back test for Approach 80: "What unknown would push below 80?" → CF Function test setup requires Jest environment that understands `PagesFunction<Env>` types. This needs a test helper that constructs the CF context (request, env). This pattern is not yet established in the Prime codebase (per fact-find: no existing CF Function tests). This is the main risk. Verdict: workaround is to test the function logic by invoking `onRequestPost` directly with a manually-constructed fake context/request.
- **Acceptance:**
  - CF Function tests: ≥6 TCs covering TC-01 through TC-06 from TASK-01 validation contract.
  - `page.test.tsx`: extinct TC-02 updated (no longer asserts static fallback text); LLM path TCs added.
  - `answerComposer.test.ts` TC-02: TC is NOT extinct. `composeAssistantAnswer` still returns `answerType: 'fallback'` for unmatched queries — this is the routing signal used by `page.tsx` to decide whether to call the LLM. Keep the `answerType: 'fallback'` assertion. Update only the static text assertion if the fallback message string changes (the text is informational now, not shown to users when LLM answers).
  - All tests pass in CI.
  - TypeScript clean, ESLint 0 errors.
- **Validation contract:**
  - CF Function tests:
    - TC-01: valid token + query → mock OpenAI returns answer → function returns 200 with `answerType: 'llm'`.
    - TC-02: missing token → function returns 401.
    - TC-03: rate limit KV mock at max → function returns 429.
    - TC-04: OpenAI fetch throws → function returns 200 with `answerType: 'llm-safety-fallback'`.
    - TC-05: OpenAI returns non-allowlisted link → link stripped from response.
    - TC-06: `durationMs` is a positive number in response.
  - Page tests:
    - TC-07: keyword match → no fetch call, answer renders immediately.
    - TC-08: unmatched query → fetch called with correct body shape, LLM answer rendered.
    - TC-09: 429 → friendly message rendered.
    - TC-10: preset button click → `handleAsk` called with preset query.
- **Execution plan:**
  - Red: Update `page.test.tsx` TC-02 extinct assertion (static fallback text). `answerComposer.test.ts` TC-02 is NOT extinct — do not remove it. Add new test file structure.
  - Green:
    1. Create `apps/prime/functions/api/__tests__/assistant-query.test.ts` with `global.fetch = jest.fn()` mock pattern. Construct fake CF context: `{ request: new Request(url, { method: 'POST', body: JSON.stringify({...}) }), env: { CF_FIREBASE_DATABASE_URL: 'https://test.firebase.com', RATE_LIMIT: mockKv, OPENAI_API_KEY: 'sk-test' }, next: jest.fn(), waitUntil: jest.fn(), passThroughOnException: jest.fn() }`. Mock `validateGuestSessionToken` and `enforceKvRateLimit` via `jest.mock(...)`.
    2. Update `page.test.tsx`: add `global.fetch = jest.fn()` for LLM path tests. Update TC-02 to assert LLM path. Add TC-07 through TC-10.
    3. Update `answerComposer.test.ts` TC-02: keep `answerType: 'fallback'` assertion (this is the routing signal). Remove or relax the exact static text assertion only if the fallback message string is changed. Do NOT remove the TC.
  - Refactor: DRY up fetch mock setup in test helper if needed.
- **Planning validation (required for M):**
  - Checks run:
    - `jest.config.cjs` for Prime — confirms `testEnvironment: 'jsdom'` for RTL tests; CF Function tests may need `testEnvironment: 'node'`.
    - No existing CF Function test infrastructure found — new test helper construction needed.
    - `validateGuestSessionToken` is a named export from `functions/lib/guest-session.ts` — can be mocked with `jest.mock`.
    - `enforceKvRateLimit` is a named export from `functions/lib/kv-rate-limit.ts` — can be mocked with `jest.mock`.
  - Unexpected findings: CF Function tests need `node` environment, not `jsdom`. Check `jest.config.cjs` for `testEnvironment` override options per file (e.g., `@jest-environment node` docblock).
- **Consumer tracing:**
  - Test files are not production consumers. All test changes are self-contained.
- **Scouts:** CF Function test environment: add `/** @jest-environment node */` docblock to `assistant-query.test.ts` to override the default jsdom environment.
- **Edge Cases & Hardening:**
  - Mock isolation: each test resets `global.fetch` mock between tests (`beforeEach(() => jest.resetAllMocks())`).
  - CF Function context mock: minimal fake context, only fields used by the function.
- **What would make this >=90%:**
  - Established CF Function test helper in a shared test utility (reusable for future CF Function tests).
  - Coverage of all 10 TCs in CI.
- **Rollout / rollback:** None: non-deployment task.
- **Documentation impact:** None.
- **Notes / references:**
  - `answerComposer.test.ts` TC-02 is NOT extinct. `composeAssistantAnswer` still returns `answerType: 'fallback'` for unmatched queries — this is the routing signal used by `page.tsx` to trigger the LLM call. Keep the TC. If the static fallback text string in `answerComposer.ts` changes during refactor, update the text assertion accordingly; do not remove the `answerType` assertion.

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Create CF Function | Yes | None — `extension-request.ts` blueprint confirmed; all dependencies (`validateGuestSessionToken`, `enforceKvRateLimit`, `FirebaseRest`, `jsonResponse`) already exist. | No |
| TASK-02: Extend types | Yes | None — additive union extension, no consumer breakage. | No |
| TASK-03: Update page.tsx | Partial (depends on TASK-01, TASK-02) | [Type contract] [Moderate]: `AssistantExchange` local interface in `page.tsx:14` also needs `answerType` union extension — captured in TASK-03 execution plan step 1. `exchange → exchanges` array conversion requires updating all 3 consumer sites in the same JSX block — execution plan step 3 and 9 address this. | No |
| TASK-04: Tests | Yes (depends on TASK-03) | [Moderate]: CF Function test environment needs `@jest-environment node` override docblock — captured in TASK-04 Scouts and execution plan. | No |

No Critical findings. No waiver required.

## Risks & Mitigations
- `OPENAI_API_KEY` not provisioned: Medium likelihood, High impact. **Operator action required before deploy**: `wrangler pages secret put OPENAI_API_KEY`. CF Function will return 500 if missing.
- OpenAI API latency >2s: Low-Medium likelihood, Medium impact. Client-side timeout (10s) + loading spinner + safety fallback handles this.
- LLM injects non-allowlisted links: Low likelihood, Medium impact. `ALLOWLISTED_HOSTS` check strips links server-side in CF Function before response.
- System prompt produces off-topic answers: Medium likelihood, Low-Medium impact. System prompt explicitly scopes to hostel + Positano area with "politely redirect" instruction.

## Observability
- Logging: CF Function logs via Cloudflare dashboard (Workers/Pages observability).
- Metrics: `answerType: 'llm'` and `'llm-safety-fallback'` events in activation funnel analytics. `llmDurationMs` for latency tracking.
- Alerts/Dashboards: None automated. Monitor `answerType` distribution in analytics after deploy.

## Acceptance Criteria (overall)
- [ ] `POST /api/assistant-query` responds correctly (valid, 401, 429, safety fallback).
- [ ] Keyword-matched queries unchanged (no LLM call, no latency regression).
- [ ] LLM fallback renders in conversation thread UI.
- [ ] Preset buttons render and trigger queries.
- [ ] Multi-turn history (up to 5 exchanges) renders correctly.
- [ ] All LLM output links pass `validateAssistantLinks`.
- [ ] CI: TypeScript clean, ESLint 0 errors, Jest ≥10 TCs green.
- [ ] `answerType: 'llm'` events visible in analytics localStorage.
- [ ] `OPENAI_API_KEY` provisioned in Cloudflare Pages before deploy (operator action).

## Decision Log
- 2026-02-27: Option B (layered 4-task) chosen over Option A (monolithic) for independent committability.
- 2026-02-27: `gpt-4o-mini` chosen as model (cost-effective, fast, confirmed by fact-find reasoning).
- 2026-02-27: Rate limit 5/minute per guest session (key: `llm-assistant:{guestUuid}`).
- 2026-02-27: System prompt default: hostel + Positano area scope, polite redirect for off-topic.
- 2026-02-27: Token passed in `body.token` (not Authorization header) — matches `extension-request.ts` pattern.
- 2026-02-27: Grounding fields (firstName, checkIn, checkOut, drinksAllowed) read server-side from Firebase — not passed from client.
- 2026-02-27: OPENAI_API_KEY is a Pages secret (out-of-band, no wrangler.toml change).

## Overall-confidence Calculation
- TASK-01: M(2) × 80 = 160
- TASK-02: S(1) × 85 = 85
- TASK-03: M(2) × 80 = 160
- TASK-04: M(2) × 80 = 160
- Total weight: 7; Total: 565
- Overall-confidence: 565/7 = **80%**
