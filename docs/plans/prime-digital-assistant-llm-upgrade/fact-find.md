---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Prime App
Workstream: Engineering
Created: 2026-02-27
Last-updated: 2026-02-27
Feature-Slug: prime-digital-assistant-llm-upgrade
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/prime-digital-assistant-llm-upgrade/plan.md
Trigger-Why: Prime digital assistant returns a static dead-end fallback for any unrecognised query. A keyword-only chatbot is a poor guest experience on a pre-deploy P1 item — the legacy app called an OpenAI-backed backend (now decommissioned) which is the intended capability model.
Trigger-Intended-Outcome: type: operational | statement: Prime digital assistant answers unrecognised guest queries using an OpenAI-backed Cloudflare Function, with guest booking context grounding, rate limiting, multi-turn history, and link-safe output — eliminating the static dead-end fallback. | source: operator
---

# Prime Digital Assistant LLM Upgrade — Fact-Find Brief

## Scope
### Summary
The Prime digital assistant (`/digital-assistant`) is a pure client-side keyword matcher with 6 categories (~18 trigger terms). Any unmatched query returns a static dead-end fallback message. The legacy standalone Prime app called a now-decommissioned OpenAI-backed API endpoint. This upgrade adds an OpenAI API-backed Cloudflare Pages Function as a fallback for unmatched queries, keeping existing keyword rules as a synchronous fast-path. The CF Function derives guest booking context (first name, check-in/out dates, entitlement status) server-side from the validated session — not from client-supplied data. `useUnifiedBookingData` is used in the client component for UI display only (greeting, personalisation). Multi-turn conversation history (up to 5 exchanges), a loading state, preset query buttons (10 topics), and analytics extensions are part of scope.

### Goals
- Replace the static dead-end fallback with an LLM-backed response for unrecognised queries.
- Retain keyword matching as a synchronous fast-path (no latency regression for matched queries).
- Ground LLM responses in guest booking context (name, dates, entitlement status) — fetched server-side in the CF Function from Firebase using the validated session.
- Apply existing link allowlist (`ALLOWLISTED_HOSTS`) to all LLM-generated links.
- Add multi-turn conversation history (last 5 exchanges passed as context).
- Add preset query buttons (10 legacy topic categories) to guide guests.
- Rate-limit LLM calls via the existing RATE_LIMIT KV namespace.
- Extend analytics with `answerType: 'llm' | 'llm-safety-fallback'` and `llmDurationMs`.

### Non-goals
- Replacing or removing keyword matching rules (keyword fast-path stays unchanged).
- Server-side conversation storage (history held in React state only, not persisted).
- Admin CMS for system prompt management.
- Support for file uploads or image-based queries.
- Voice input.

### Constraints & Assumptions
- Constraints:
  - `OPENAI_API_KEY` must be provisioned as a Cloudflare Pages secret (not currently present in `wrangler.toml`).
  - CF Function must use the `validateGuestSessionToken` + `enforceKvRateLimit` patterns established by `extension-request.ts`.
  - LLM-generated links must pass `validateAssistantLinks` before being displayed.
  - `nodejs_compat` flag is already set in `wrangler.toml` — available for fetch/crypto APIs.
  - Operator-confirmed LLM provider: OpenAI API.
- Assumptions:
  - `gpt-4o-mini` is appropriate (cost-effective, fast response, sufficient quality for short guest queries). Can be overridden via env var if needed.
  - Rate limit of 5 LLM requests/minute per guest session is reasonable for the use case.
  - System prompt is static and version-controlled in the CF Function source — no runtime CMS needed at this stage.
  - Legacy preset button list (10 topics from legacy app) is the correct scope for presets.

## Outcome Contract

- **Why:** Prime digital assistant returns a static dead-end fallback for any unrecognised query. A keyword-only chatbot is a poor guest experience and a P1 pre-deploy requirement. The legacy app called an OpenAI-backed backend — this is the expected capability model.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Prime digital assistant answers unrecognised guest queries using an OpenAI-backed CF Function, with guest booking context grounding, rate limiting, multi-turn history, and link-safe output — eliminating the static dead-end fallback.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points
- `apps/prime/src/app/(guarded)/digital-assistant/page.tsx` — Pure client component (139 lines). `handleAsk` is **synchronous** — calls `composeAssistantAnswer` directly. No async path, no loading state, no API call, no booking context. `exchange` state is a single nullable `AssistantExchange | null` (not an array) — multi-turn requires converting to `AssistantExchange[]`.
- `apps/prime/src/lib/assistant/answerComposer.ts` — Keyword classifier (139 lines). 6 categories (`booking`, `experiences`, `food`, `transport`, `bag_drop`, `general`), ~18 trigger terms. Static fallback at lines 127–133 is the insertion point for LLM routing.

### Key Modules / Files
- `apps/prime/functions/api/extension-request.ts` (171 lines) — Reference CF Function implementation pattern: `onRequestPost: PagesFunction<Env>`, `Env` interface with `CF_FIREBASE_DATABASE_URL`, `RATE_LIMIT?: KVNamespace`, token validation → rate limit → Firebase call → response.
- `apps/prime/functions/lib/guest-session.ts` (45 lines) — `validateGuestSessionToken(token, env): Promise<GuestSessionAuthResult | Response>`. Returns `{bookingId, guestUuid, createdAt, expiresAt}` on success or a 4xx Response on failure.
- `apps/prime/functions/lib/kv-rate-limit.ts` (51 lines) — `enforceKvRateLimit({key, maxRequests, windowSeconds, errorMessage, kv?}): Promise<Response | null>`. Returns `null` if under limit; returns a 429 Response if exceeded. Degrades gracefully if `kv` is undefined.
- `apps/prime/src/hooks/dataOrchestrator/useUnifiedBookingData.ts` (263 lines) — Returns `UnifiedBookingData` with `occupantData.firstName`, `checkInDate`, `checkOutDate`, `nights`, `showOrderBreakfastLink`, `drinksAllowed`. Used in the same guarded route group (confirmed via `apps/prime/src/app/(guarded)/overnight-issues/page.tsx`).
- `apps/prime/wrangler.toml` — `RATE_LIMIT` KV namespace bound (id: `f3d56007e07d494cb3ab0db1995fd958`), `nodejs_compat` flag present, `CF_FIREBASE_DATABASE_URL` as var. **No `OPENAI_API_KEY` secret defined** — must be added.
- `apps/prime/src/app/(guarded)/digital-assistant/__tests__/page.test.tsx` (33 lines) — 2 TCs: TC-01 known answer, TC-02 analytics for known answer. Both synchronous, no fetch mock. TC-02 verifies static fallback text (extinct once LLM path active).
- `apps/prime/src/lib/assistant/__tests__/answerComposer.test.ts` (25 lines) — 3 TCs: TC-01 known transport, TC-02 unknown → fallback, TC-03 link validation rejects non-allowlisted. TC-02 tests the fallback message string (extinct once LLM path is the fallback).

### Patterns & Conventions Observed
- CF Function pattern: `onRequestPost: PagesFunction<Env>` — evidence: `apps/prime/functions/api/extension-request.ts:1-15`
- Token-first auth: `validateGuestSessionToken` called before any data access — evidence: `apps/prime/functions/api/extension-request.ts:40-52`
- Rate-limit-before-expensive-call: KV rate limiting runs after auth, before the expensive external call — `extension-request.ts` implements this inline (lines 77–87) using direct `env.RATE_LIMIT.get/put`. The `enforceKvRateLimit` helper in `functions/lib/kv-rate-limit.ts` provides a reusable abstraction for the same pattern and should be used in `assistant-query.ts` for consistency.
- Analytics: `recordActivationFunnelEvent` with `answerType` + `answerCategory` fields — evidence: `apps/prime/src/app/(guarded)/digital-assistant/page.tsx:~95-110`
- Link safety: `validateAssistantLinks` + `ALLOWLISTED_HOSTS` already in place — evidence: `apps/prime/src/lib/assistant/answerComposer.ts:1-20, ~110-130`
- Guarded route context: `useUnifiedBookingData()` consumed in `(guarded)` layout components — evidence: `apps/prime/src/app/(guarded)/overnight-issues/page.tsx`

### Data & Contracts
- Types/schemas/events:
  - `AssistantAnswer` (answerComposer.ts): `{answer: string, category: string, answerType: 'known' | 'fallback', links?: AssistantLink[]}` — needs `'llm' | 'llm-safety-fallback'` added to `answerType` union.
  - `AssistantExchange` (page.tsx): `{query: string, answer: AssistantAnswer}` — stays unchanged; `exchange` state changes from `AssistantExchange | null` to `AssistantExchange[]`.
  - New CF Function request body: `{token: string, query: string, history?: {role: 'user' | 'assistant', content: string}[]}`. **No `guestContext` in request body** — grounding fields (`firstName`, `checkIn`, `checkOut`, `drinksAllowed`) are read server-side from Firebase using the validated `bookingId` + `guestUuid` from the session token. This matches the `extension-request.ts` pattern (lines 102–115) and prevents client-side data tampering.
  - New CF Function response: `{answer: string, answerType: 'llm' | 'llm-safety-fallback', links?: AssistantLink[], category: 'general', durationMs: number}`. Where `AssistantLink = {label: string, href: string}` — matching the existing type in `answerComposer.ts:1-4`.
- Persistence:
  - No server-side conversation storage — history held in React state only.
  - Rate limit counters in RATE_LIMIT KV (existing binding).
- API/contracts:
  - OpenAI Chat Completions API: `POST https://api.openai.com/v1/chat/completions` — model `gpt-4o-mini`, system + user message format, JSON mode for structured output (link-safe).
  - OpenAI auth header (server-side only): `Authorization: Bearer ${env.OPENAI_API_KEY}`.
  - CF Function endpoint: `POST /api/assistant-query` (new).
  - Session token: passed as `token` field in JSON request body — matching the existing `extension-request.ts` pattern (`body.token`). Not in the `Authorization` header.

### Dependency & Impact Map
- Upstream dependencies:
  - `validateGuestSessionToken` in `functions/lib/guest-session.ts` — already exists, unchanged.
  - `enforceKvRateLimit` in `functions/lib/kv-rate-limit.ts` — already exists, unchanged.
  - `RATE_LIMIT` KV namespace — already bound in wrangler.toml.
  - `OPENAI_API_KEY` — **does not exist yet**; must be provisioned as a Pages secret via `wrangler pages secret put OPENAI_API_KEY`. No `wrangler.toml` declaration needed — Pages secrets are out-of-band.
  - `useUnifiedBookingData` — already exists, no change needed.
  - `composeAssistantAnswer` — stays as fast-path; fallback branch becomes the LLM trigger.
- Downstream dependents:
  - `page.tsx` is the only consumer of `answerComposer.ts` (no other imports found).
  - `recordActivationFunnelEvent` analytics call — needs `llmDurationMs` field extension.
- Likely blast radius:
  - **Contained** — changes touch `page.tsx`, `answerComposer.ts` (type extension only), new `functions/api/assistant-query.ts`, and 2 existing test files (updates/extinctions). No `wrangler.toml` changes needed (Pages secrets are out-of-band). No shared library changes.

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest (React) for `page.tsx` and `answerComposer.ts`; CF Function tests use Jest with fetch mocking pattern.
- Commands: **CI-only** per `docs/testing-policy.md` (effective 2026-02-27). Push changes and monitor with `gh run watch`. Do not run Jest locally.
- CI integration: standard Prime Jest suite via GitHub Actions.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| page.tsx | RTL + Jest | `__tests__/page.test.tsx` | 2 TCs — known answer render, analytics event. No async/fetch coverage. |
| answerComposer.ts | Jest unit | `__tests__/answerComposer.test.ts` | 3 TCs — keyword match, fallback text, link validation. No LLM path (doesn't exist yet). |
| CF Functions (existing) | None confirmed for assistant | N/A | extension-request.ts tests not seen; pattern established but no coverage for new assistant-query.ts yet. |

#### Coverage Gaps
- Untested paths:
  - Async `handleAsk` with network call (loading state, error state, LLM response render).
  - CF Function `assistant-query.ts` (new file, zero coverage exists).
  - Rate-limit exceeded path (429 response handling in page.tsx).
  - LLM safety fallback path (OpenAI error or policy violation).
  - Multi-turn history accumulation.
  - Preset button triggers `handleAsk` with preset query.
- Extinct tests (to update/remove during build):
  - `page.test.tsx` TC-02: asserts static fallback message text — will be extinct once LLM is the fallback.
  - `answerComposer.test.ts` TC-02: asserts specific static fallback `answer` string — will be extinct once fallback delegates to LLM.

#### Testability Assessment
- Easy to test:
  - `answerComposer.ts` type extension (adding union values) — pure unit test.
  - CF Function with `fetch` mock for OpenAI API — standard Jest pattern.
  - Rate limit exceeded path — mock `enforceKvRateLimit` returning 429.
  - Preset button render and click.
- Hard to test:
  - Real OpenAI API response quality — intentionally out of scope (unit tests use mocks).
  - CF Function Wrangler Miniflare integration — test with jest fetch mock instead.
- Test seams needed:
  - `fetch` mock for `POST /api/assistant-query` in `page.test.tsx`.
  - `openai` API call mock in CF Function tests.

#### Recommended Test Approach
- Unit tests for: `answerComposer.ts` type extension, CF Function business logic (with fetch mock for OpenAI).
- Integration tests for: CF Function end-to-end with mocked `validateGuestSessionToken` and `enforceKvRateLimit`.
- E2E tests for: not required (no Playwright scope for this change).
- Contract tests for: CF Function response shape consumed by page.tsx.

### Recent Git History (Targeted)
- `apps/prime/src/app/(guarded)/digital-assistant/` — single commit, no recent changes. Files committed once and untouched since initial port.
- `apps/prime/src/lib/assistant/` — same pattern, no recent changes.
- `apps/prime/functions/api/` — `extension-request.ts` is the reference pattern; no recent changes to assistant area.

## Questions
### Resolved
- Q: What LLM provider should be used?
  - A: OpenAI API — operator-confirmed in dispatch.
  - Evidence: dispatch packet `IDEA-DISPATCH-20260227-0038` `next_scope_now` field.

- Q: Should the legacy preset button list be used as-is or redesigned?
  - A: Use legacy preset categories as scope signal for the 10 preset button topics. The legacy UI had preset query buttons that the current app is missing — restoring them is part of the intended parity upgrade. Exact labels can be determined from the legacy source at build time.
  - Evidence: dispatch packet `next_scope_now` references "preset query buttons (10 topics from legacy preset list)".

- Q: Should keyword matching be replaced or kept?
  - A: Kept as synchronous fast-path. Replacing it would be scope creep with no benefit — keyword matching is fast, deterministic, and covers the most common queries. The LLM is the fallback only.
  - Evidence: dispatch packet `next_scope_now`: "Hybrid model — keep keyword rules as synchronous fast-path".

- Q: Should conversation history be stored server-side?
  - A: No — React state only. Server-side storage adds infrastructure complexity (Firebase writes, schema design, cleanup), and guest sessions are short (1 check-in to check-out). 3–5 exchanges in state is sufficient for grounding quality and avoids persisting conversation data unnecessarily.
  - Evidence: no persistence infrastructure for conversations exists; RTDB patterns only for session/preorder data.

- Q: What model should be used?
  - A: `gpt-4o-mini` — cost-effective, fast (~500–800ms typical for short queries), high-quality for constrained hotel assistant use case. Sufficient for grounding on <5 exchange history + short system prompt.
  - Evidence: Standard practice for latency-sensitive web chatbots; no contrary budget constraint documented.

- Q: What rate limit is appropriate?
  - A: 5 LLM requests per minute per guest session. This prevents abuse while allowing a natural back-and-forth conversation. RATE_LIMIT KV is already bound — key: `llm-assistant:{guestUuid}`.
  - Evidence: `apps/prime/functions/lib/kv-rate-limit.ts` pattern; `wrangler.toml` RATE_LIMIT binding confirmed.

- Q: Should the LLM return structured JSON (links separate) or free text with inline links?
  - A: Structured JSON with `answer` (plain text) + optional `links[]` array. This lets `validateAssistantLinks` run cleanly before display and keeps rendering consistent with the keyword-matched answer path.
  - Evidence: `AssistantAnswer` type shape already separates `answer` string from `links[]` array; `validateAssistantLinks` expects this structure.

- Q: Does `useUnifiedBookingData` need any changes to expose the needed grounding fields?
  - A: No. `firstName`, `checkInDate`, `checkOutDate`, `drinksAllowed` are already returned. The hook is ready to use unchanged.
  - Evidence: `useUnifiedBookingData.ts` return type confirmed (263 lines).

- Q: Where does the OPENAI_API_KEY secret come from?
  - A: Operator must provision it as a Cloudflare Pages secret via `wrangler pages secret put OPENAI_API_KEY`. Pages secrets are managed out-of-band — they do NOT appear in `wrangler.toml`, matching how all existing Prime secrets are handled. The plan task should document the provisioning command but requires no `wrangler.toml` change.
  - Evidence: `wrangler.toml` has no current OPENAI_API_KEY entry. Other Prime secrets follow the same out-of-band Pages secret pattern.

### Open (Operator Input Required)
- Q: What is the desired system prompt scope and persona for the LLM assistant?
  - Why operator input is required: The system prompt establishes what the assistant is allowed to answer (hostel-specific, booking-specific, local area, or broad travel advice). The operator may have a specific tone or scope in mind beyond what the fact-find evidence supports.
  - Decision impacted: System prompt content in `assistant-query.ts`. Build can proceed with a reasonable default ("Brikette hostel guest assistant — answer questions about the booking, hostel services, and the local Positano area"), but operator should confirm or correct before launch.
  - Decision owner: Operator (Peter)
  - Default assumption (if any): Scope is hostel + local area only; off-topic queries get a polite redirect. Risk: if broader scope is desired, system prompt needs updating before launch.

## Confidence Inputs
- **Implementation: 88%**
  - Evidence: Entry points, CF Function patterns, type shapes, and KV binding all fully mapped. No ambiguous file boundaries. The `extension-request.ts` reference pattern is a direct implementation blueprint for `assistant-query.ts`.
  - What raises to >=90: Confirming system prompt scope with operator (removes only remaining unknown in the LLM task).

- **Approach: 85%**
  - Evidence: Hybrid model (keyword fast-path + LLM fallback) is a well-established pattern for chatbots. CF Function + OpenAI API + KV rate limiting is the natural stack given what's already in place. No competing approach has meaningful advantages.
  - What raises to >=90: System prompt confirmed by operator, rate limit value validated in practice.

- **Impact: 80%**
  - Evidence: Current fallback is a dead-end static message — any LLM response is a direct improvement. Pre-deploy P1 requirement. Multi-turn history and booking context grounding meaningfully increase answer quality over a generic LLM call.
  - What raises to >=90: Post-deploy analytics showing reduced `fallback` events and increased session engagement.

- **Delivery-Readiness: 78%**
  - Evidence: Code patterns, hook, and KV binding are all ready. The only infrastructure gap is `OPENAI_API_KEY` not yet provisioned in Cloudflare Pages. This is an operator action, not a code blocker — the plan task should document it.
  - What raises to >=80: OPENAI_API_KEY confirmed provisioned in Pages project. What raises to >=90: staging smoke test confirming CF Function responds correctly.

- **Testability: 82%**
  - Evidence: CF Function is easily unit-testable with Jest fetch mocks (pattern established). `page.tsx` async handleAsk testable with MSW or manual fetch mock. Extinct tests clearly identified. Test seams (fetch mock injection) are straightforward.
  - What raises to >=90: CF Function test file producing ≥6 TCs covering all paths including rate-limit and safety-fallback.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| OPENAI_API_KEY not provisioned at deploy time | Medium | High (CF Function returns 500, all LLM calls fail) | Document provisioning command (`wrangler pages secret put OPENAI_API_KEY`) in the plan task. No wrangler.toml change needed — Pages secrets are out-of-band. |
| LLM injects non-allowlisted links in response | Low | Medium (malicious link displayed to guest) | `validateAssistantLinks` already exists and must be applied to LLM links array before rendering. Apply at both CF Function layer (strip non-allowlisted) and client layer (final validation). |
| OpenAI API latency >2s degrading UX | Low-Medium | Medium (spinner timeout, poor feel) | Add client-side timeout (10s), loading spinner, and safety-fallback on timeout. `gpt-4o-mini` median ~500–800ms. |
| Rate limit too restrictive for natural conversation | Low | Low (guest hits 429 mid-conversation) | 5/min per session is generous for a hotel chatbot. If hit, display friendly "please wait" message rather than generic error. |
| Conversation history grows token count | Low | Low-Medium (higher latency/cost as history grows) | Cap history at 5 exchanges before passing to API. Summarize oldest exchanges if needed (stretch goal — not in initial scope). |
| System prompt scope creep (LLM answers off-topic questions) | Medium | Low-Medium (guest confusion if answers are unhelpful) | Constrain system prompt to hostel + local area. Include explicit "politely redirect off-topic" instruction. Safety fallback for any API error. |

## Planning Constraints & Notes
- Must-follow patterns:
  - CF Function must follow `extension-request.ts` pattern: `PagesFunction<Env>`, `validateGuestSessionToken` first, `enforceKvRateLimit` after auth.
  - `OPENAI_API_KEY` is a Cloudflare Pages secret — provisioned out-of-band via `wrangler pages secret put OPENAI_API_KEY` (not declared in `wrangler.toml`). This matches how all other Prime secrets are managed. The plan task must document the provisioning step but no `wrangler.toml` change is needed.
  - Link validation: `validateAssistantLinks` from `answerComposer.ts` must run on all LLM-generated links before they reach the client component.
  - Analytics: extend `answerType` union — do not remove existing `'known' | 'fallback'` values.
- Rollout/rollback expectations:
  - Feature is additive (LLM only fires when keyword matching returns `fallback`) — keyword users are unaffected. Rollback is trivial: remove CF Function and revert `handleAsk` async change.
- Observability expectations:
  - `answerType: 'llm'` and `'llm-safety-fallback'` events in analytics.
  - `llmDurationMs` field to track latency distribution.
  - `llmFallbackReason` field for debugging safety fallback triggers.

## Suggested Task Seeds (Non-binding)
- TASK-01 (IMPLEMENT): Create `apps/prime/functions/api/assistant-query.ts` CF Function. Document the operator provisioning step: `wrangler pages secret put OPENAI_API_KEY`. No `wrangler.toml` change needed.
- TASK-02 (IMPLEMENT): Extend `AssistantAnswer.answerType` union in `answerComposer.ts` to include `'llm' | 'llm-safety-fallback'`.
- TASK-03 (IMPLEMENT): Update `page.tsx` — async `handleAsk`, loading state, `useUnifiedBookingData` for UI display (greeting/personalisation only, not passed to CF Function), multi-turn history (`AssistantExchange[]`), preset query buttons.
- TASK-04 (IMPLEMENT): Extend analytics — `llmDurationMs`, `llmFallbackReason` fields on `recordActivationFunnelEvent`.
- TASK-05 (IMPLEMENT): Tests — update extinct TCs in both test files; add CF Function tests (rate limit, LLM response, safety fallback); add page.tsx async path tests.

## Execution Routing Packet
- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package: TypeScript clean, ESLint 0 errors, Jest test suite ≥10 TCs (all green), LLM fallback path visible in page render, keyword fast-path unchanged.
- Post-delivery measurement plan: Monitor `answerType: 'llm'` event rate vs `answerType: 'fallback'` in analytics to confirm LLM path is activating. Monitor `llmDurationMs` p50/p95 for latency regression.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Entry point: `page.tsx` handleAsk flow | Yes | None | No |
| Keyword classifier: `answerComposer.ts` fallback branch | Yes | None — LLM trigger is a clearly identified seam at line ~127 | No |
| CF Function pattern: `extension-request.ts` → `assistant-query.ts` | Yes | None | No |
| Auth/session validation: `validateGuestSessionToken` | Yes | None — existing function, unchanged | No |
| Rate limiting: `enforceKvRateLimit` + KV binding | Yes | None — KV namespace already bound in wrangler.toml | No |
| Booking context: `useUnifiedBookingData` | Yes | None — hook available in same guarded route group | No |
| Env secret: `OPENAI_API_KEY` | Yes | [Undefined config key] [Major]: `OPENAI_API_KEY` not provisioned as a Pages secret — operator must run `wrangler pages secret put OPENAI_API_KEY` before deploy. No `wrangler.toml` change needed (Pages secrets are out-of-band). | No (captured as Risk + task constraint) |
| Type contract: `AssistantAnswer.answerType` extension | Yes | None — additive union extension, no breaking change | No |
| Type contract: `exchange` state `null → AssistantExchange[]` | Yes | [Type contract gap] [Moderate]: All consumers of `exchange` in page.tsx must be updated to handle array. Investigation confirms `exchange` is rendered in a single conditional block — all consuming lines are in one component, bounded change. | No |
| Link safety: `validateAssistantLinks` applied to LLM output | Yes | None — function exists, task must explicitly wire it to LLM response links | No |
| Analytics: `recordActivationFunnelEvent` extension | Yes | None — additive field extension | No |
| Existing tests: extinction of TC-02 in both test files | Yes | None — both tests clearly identified as extinct | No |
| System boundary: OpenAI API error/timeout path | Yes | [Integration boundary] [Moderate]: Plan must include explicit safety-fallback task for OpenAI errors. Already captured in task seeds (TASK-05 covers fallback TCs). | No |

## Evidence Gap Review

### Gaps Addressed
1. **CF Function implementation pattern** — fully confirmed via `extension-request.ts` (171 lines). Auth → rate limit → external call → respond pattern is unambiguous.
2. **Booking context availability** — confirmed via `useUnifiedBookingData` hook (263 lines) used in the same guarded route group (`overnight-issues/page.tsx`). All needed grounding fields present.
3. **KV rate limiting** — `RATE_LIMIT` KV binding confirmed in `wrangler.toml`, `enforceKvRateLimit` function confirmed available.
4. **Link safety seam** — `validateAssistantLinks` and `ALLOWLISTED_HOSTS` confirmed in `answerComposer.ts`. Can be imported into CF Function for server-side link scrubbing.
5. **Extinct test identification** — both extinct TCs identified with specific file + TC number.
6. **Env gap** — `OPENAI_API_KEY` absence confirmed in `wrangler.toml`. Documented as Risk + operator provisioning step.

### Confidence Adjustments
- Delivery-Readiness reduced to 78% (from potential 85%) due to OPENAI_API_KEY provisioning dependency — this is an operator action that cannot be completed by the build agent.
- No downward adjustments to Implementation or Approach — all code patterns are confirmed.

### Remaining Assumptions
- System prompt scope: reasonable default ("Brikette hostel guest assistant, answer questions about the booking, hostel services, and Positano area") will be used unless operator provides override. Captured as Open question.
- `gpt-4o-mini` model selection: assumed optimal for cost/latency. Build task should define this as a configurable constant.
- Legacy preset button labels: will be sourced from legacy app files (`/Users/petercowling/Documents/prime_src`) at build time.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items: None (OPENAI_API_KEY provisioning is an operator action documented in the plan, not a blocking investigation gap)
- Recommended next step: `/lp-do-plan prime-digital-assistant-llm-upgrade --auto`
