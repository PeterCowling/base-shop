---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: Platform
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-prime-shared-contract-layer
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/reception-prime-shared-contract-layer/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260314200000-0001
---

# Reception–Prime Shared Contract Layer — Fact-Find Brief

## Scope

### Summary

Reception and the Prime messaging app define channel names, API response types, actor-claims
utilities, and the whole-hostel broadcast channel ID as independent parallel definitions with
no shared source. A change in either app compiles clean but can silently break the other at
runtime. This fact-find maps every cross-app coupling point and identifies the minimum
extraction that gives compile-time safety without restructuring either app's internal types.

### Goals

- Identify every coupling point between reception and prime that currently has no type
  enforcement (divergence compiles clean, fails at runtime).
- Determine the safest extraction strategy for each coupling point.
- Assess whether `@acme/lib` is the right package for extraction (no cyclic deps, both apps
  already depend on it).
- Produce a plan that gives compile-time guarantees for the highest-risk coupling points
  without requiring a full type-extraction of prime's internal message-type graph.

### Non-goals

- Rewriting prime's internal `MessageKind`, `MessageAudience`, `MessageAttachment` types.
- Unifying the inbox API models (reception intentionally widens prime types to avoid importing
  prime app-internal types — this widening is correct by design).
- Changing any runtime behaviour.

### Constraints & Assumptions

- Constraints:
  - Prime functions run in Cloudflare Workers (Web Crypto API, no Node.js `crypto` module).
    Any shared crypto util must use Web Crypto API only.
  - `@acme/lib` must not import from `apps/prime` or `apps/reception` (one-way dep only).
  - Turbopack resolveAlias constraints apply to reception — see CLAUDE.md.
- Assumptions:
  - Both apps import `@acme/lib` already. Reception uses `@acme/lib/hospitality`. Prime
    functions already import `@acme/lib/hospitality` in `guest-booking.ts` (confirmed).
  - The actor claims Web Crypto implementation is compatible across Next.js server and
    Cloudflare Workers (both use the global `crypto.subtle`).

---

## Confidence Inputs

| Dimension | Score | Evidence |
|---|---|---|
| Implementation | 90 | All files located; approach mirrors existing @acme/lib/hospitality pattern; no new tools needed |
| Approach | 88 | Option C (partial extraction + structural test) is well-supported; TypeScript `satisfies` is a proven pattern |
| Impact | 90 | Compile-time safety for actor claims, channels, broadcast ID — the three highest-risk coupling points |
| Delivery-Readiness | 88 | No blockers, no external research needed, all evidence present |
| Testability | 92 | TypeScript compilation is the primary gate; round-trip test adds runtime evidence |

- What raises each score to ≥80: already there — implementation path and test approach are clear.
- What raises each score to ≥90: round-trip test added and all apps compile cleanly in CI.

---

## Outcome Contract

- **Why:** Reception and the guest messaging app currently duplicate shared language in two
  places. If either side adds a field, renames a channel, or changes the security token
  format, the other side silently fails at runtime with no compile-time warning. Extracting
  to a shared package turns silent divergence into a build error.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Channel names, actor claims utilities, and the broadcast
  channel identifier are defined once in a shared package and imported by both apps. A
  mismatch between the two apps becomes a compile error, not a silent runtime failure.
- **Source:** operator

---

## Current Process Map

- **Trigger:** Reception's inbox routes need to call Prime's HTTP API. To do so they send
  an `x-prime-access-token` header and (for mutations) an `x-prime-actor-claims` header
  signed with `PRIME_ACTOR_CLAIMS_SECRET`.
- **Coupling points involved in each request cycle:**
  1. Reception signs actor claims using its local `signActorClaims()` (in `actor-claims.ts`)
  2. Reception maps Prime's API response to inbox models using locally-defined
     `PrimeReviewThreadSummary` / `PrimeReviewThreadDetail` shapes
  3. Reception resolves the incoming `channel` string via its local `InboxChannel` union,
     which includes `prime_direct | prime_broadcast | prime_activity`
  4. For broadcast, Reception hardcodes the string `broadcast_whole_hostel` as the thread ID
- **End condition:** Each coupling works today only because both implementations happen to
  match. There is no build-time enforcement.

### Process Areas

| Area | Current state | Known issue |
|---|---|---|
| Actor claims signing (Reception) | `apps/reception/src/lib/inbox/actor-claims.ts` — standalone implementation, sign only | Independent copy; divergence (field order, algorithm) would break all mutating Prime calls silently |
| Actor claims verification (Prime) | `apps/prime/functions/lib/actor-claims.ts` — independent implementation, sign + verify | Independent copy |
| Channel names (Reception) | `apps/reception/src/lib/inbox/channels.ts` — `inboxChannels` const includes the three prime channel strings | New channel in Prime = reception silently falls back to email adapter |
| Channel names (Prime) | `apps/prime/functions/lib/prime-review-api.ts` — `PrimeReviewChannel` union type | New channel in reception = ignored |
| PrimeReviewThreadSummary (Reception) | `prime-review.server.ts` lines 11–23 — inline type definition | Structural match only; field rename in Prime = reception maps wrong field, silent data loss |
| PrimeReviewThreadSummary (Prime) | `prime-review-api.ts` lines 33–45 — authoritative type | No link to reception copy |
| Broadcast channel ID | `prime-compose/route.ts` line 63 — literal `"broadcast_whole_hostel"` | Comment explains derivation but no constant; if prime renames it, telemetry targets wrong thread |

---

## Evidence Map

### 1. Entry Points

- `apps/reception/src/lib/inbox/prime-review.server.ts` — all outbound Reception→Prime HTTP
  calls; defines local copies of all Prime response types
- `apps/reception/src/lib/inbox/actor-claims.ts` — Reception-side actor claims signing
- `apps/reception/src/lib/inbox/channels.ts` — `inboxChannels` array including prime channels
- `apps/reception/src/app/api/mcp/inbox/prime-compose/route.ts` — hardcodes
  `"broadcast_whole_hostel"`
- `apps/prime/functions/lib/prime-review-api.ts` — authoritative Prime type definitions
- `apps/prime/functions/lib/actor-claims.ts` — Prime-side actor claims sign + verify

### 2. Key Modules and Responsibilities

| Module | Role | Coupling point |
|---|---|---|
| `apps/reception/.../actor-claims.ts` | Signs `x-prime-actor-claims` header | Parallel HMAC-SHA256 impl; must produce byte-identical tokens to what prime verifies |
| `apps/prime/functions/lib/actor-claims.ts` | Verifies + signs actor claims | Source of truth for algorithm; reception copies it |
| `apps/reception/.../channels.ts` | Defines `InboxChannel` union and `inboxChannels` array | `prime_direct`, `prime_broadcast`, `prime_activity` strings duplicated from prime |
| `apps/prime/functions/lib/prime-review-api.ts` | Defines authoritative `PrimeReviewChannel`, `PrimeReviewThreadSummary`, `PrimeReviewThreadDetail`, `PrimeReviewCampaignDetail` | All duplicated in reception's `prime-review.server.ts` |
| `apps/reception/.../prime-review.server.ts` | Defines local copies of all Prime response types; performs HTTP calls | All four coupling points live here |
| `packages/lib/src/hospitality/index.ts` | RTDB path helpers already shared between both apps | Pattern for new prime sub-path |

### 3. Contracts and State

**Actor claims payload contract** (MUST remain byte-identical between reception and prime):
```
JSON.stringify({ uid: string, roles: string[], iat: number })
```
Fixed field order (`uid`, `roles`, `iat`) is load-bearing — HMAC is over the serialized bytes.
Reception inlines this; Prime uses `serializePayload()` helper. Both produce identical output
currently. A refactor of either (field order, algorithm, base64url implementation) would break
all mutating inbox operations silently.

**Channel names contract:**
- Reception: `"prime_direct" | "prime_broadcast" | "prime_activity"` in `inboxChannels` array
- Prime: `PrimeReviewChannel = 'prime_direct' | 'prime_broadcast' | 'prime_activity'`
- Reception's `resolveInboxChannelAdapter()` silently falls back to the email adapter if an
  unknown channel string arrives. No error, no log.

**PrimeReviewThreadSummary** — structurally identical in both apps. Reception uses string
literals for the union types (e.g. `reviewStatus: "pending" | ...`) rather than importing
Prime's `PrimeReviewStatus` type. This widening is intentional — it avoids importing
prime-internal types. A new field added to Prime is simply absent from reception's copy;
TypeScript does not catch this because reception never does a structural `satisfies` check.

**Broadcast channel ID:** `"broadcast_whole_hostel"` is used as a string literal throughout:
- `apps/reception/src/app/api/mcp/inbox/prime-compose/route.ts` (for telemetry thread ID)
- `apps/prime/functions/__tests__/prime-messaging-repositories.test.ts` (multiple fixtures)
- `apps/prime/functions/__tests__/review-threads.test.ts` (multiple fixtures)
There is no exported constant for it in Prime's production code — the comment in reception
explains the derivation but no constant exists.

### 4. Dependency and Blast Radius

- `@acme/lib` is already imported by both apps (`@acme/lib/hospitality` in prime's
  `guest-booking.ts`; multiple `@acme/lib/*` in reception). No new dependency edge.
- Creating `packages/lib/src/prime/` follows the exact pattern of `packages/lib/src/hospitality/`.
- Reception's `apps/reception/tsconfig.json` has a local `paths` block that overrides base
  config paths (CLAUDE.md note). Any new `@acme/lib/*` sub-path needs no entry here because
  `@acme/lib` resolves via workspace `node_modules`, not via tsconfig `paths` aliases.
- Prime functions are compiled separately (tsconfig at `apps/prime/functions/`). Adding an
  import from `@acme/lib/prime` follows the existing `@acme/lib/hospitality` pattern exactly.

### 5. Evidence References

See `## Evidence Audit` section below.

| Claim | Verified? | Evidence |
|---|---|---|
| Prime functions import @acme/lib already | Yes | `apps/prime/functions/api/guest-booking.ts` line: `from '@acme/lib/hospitality'` |
| Both actor-claims implementations use Web Crypto API | Yes | Both use `crypto.subtle.importKey` / `.sign` / `.verify` |
| Payload field order is identical in both implementations | Yes | Reception: `JSON.stringify({ uid: claims.uid, roles: claims.roles, iat })` — Prime: `JSON.stringify({ uid: claims.uid, roles: claims.roles, iat: claims.iat })` — same order |
| `broadcast_whole_hostel` is a raw literal (no exported constant in prime) | Yes | Grep of prime codebase — only test fixtures and one comment reference; no `BROADCAST_CHANNEL_PREFIX` variable |
| Reception `PrimeReviewThreadSummary` is structurally compatible with Prime's | Yes | Side-by-side comparison of both type definitions — reception uses wider string unions intentionally |
| No BROADCAST_CHANNEL_PREFIX constant exists in prime production code | Yes | Grep confirmed — string only appears as literal `'broadcast_whole_hostel'` in tests and route.ts comment |

---

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward |
|---|---|---|---|---|
| UI / visual | N/A | No UI changes | — | — |
| UX / states | N/A | No UX changes | — | — |
| Security / privacy | Required | Actor claims HMAC is the auth mechanism for all mutating Prime ops | Parallel implementations could diverge; shared module eliminates this | Plan must specify clock-skew window and key-length requirements in shared impl |
| Logging / observability / audit | N/A | No logging changes | — | — |
| Testing / validation | Required | No tests currently verify reception→prime sign/verify round-trip | Add round-trip test using shared sign+verify | Plan must include a test importing from both apps to prove round-trip works |
| Data / contracts | Required | Three cross-app contracts currently unchecked: channels, actor claims, broadcast ID | Extraction replaces copy-paste with a single source; PrimeReviewThreadSummary structural test needed | Plan must specify structural test approach for types not extracted |
| Performance / reliability | N/A | No hot paths affected | — | — |
| Rollout / rollback | Required | Both apps must be updated atomically (or reception updated first since it just imports) | Standard monorepo deploy; both apps redeploy from same commit | Ship in one PR; rollback is a revert |

### 6. Security, Observability, and Performance

**Security:** The actor claims HMAC uses Web Crypto API (`crypto.subtle`) with HMAC-SHA256.
Both apps use identical algorithms. Moving to a shared implementation eliminates the risk of
algorithm divergence. Key requirements to preserve in shared implementation:
- Minimum secret length: 32 characters
- Fixed field order serialization: `{ uid, roles, iat }` (load-bearing for HMAC correctness)
- Clock-skew window: ±5 minutes (300 seconds) for verification
- `PRIME_ACTOR_CLAIMS_SECRET` MUST differ from `RECEPTION_PRIME_ACCESS_TOKEN`

**Observability:** No changes to logging. No new observable seams.

### 7. Test Landscape

**Existing tests:**
- `apps/reception/src/lib/inbox/__tests__/channel-adapters.server.test.ts` — covers the three
  prime channel adapters; would need to be updated if channel names move to a shared constant
- `apps/prime/functions/__tests__/prime-messaging-repositories.test.ts` — uses
  `broadcast_whole_hostel` as a fixture string (not as an imported constant)
- No test currently exercises a reception-sign → prime-verify round-trip

**Coverage gaps:**
- No test validates that reception's `signActorClaims` produces a token that prime's
  `verifyActorClaims` accepts. This is the highest-risk gap — runtime breakage is silent.
- No test validates that reception's `PrimeReviewThreadSummary` is structurally compatible
  with Prime's authoritative definition.

**Tests to add during build:**
1. Round-trip test: import `signActorClaims` from shared module, import `verifyActorClaims`
   from shared module (or from prime directly), assert round-trip succeeds.
2. Structural compatibility test for `PrimeReviewThreadSummary`: reception's local type
   `satisfies` the shared canonical shape.

### 8. Targeted Git Context

- The actor claims modules were introduced alongside the Prime inbox integration. The
  comment in reception's `actor-claims.ts` explicitly documents the cross-app contract:
  "Both implementations use identical HMAC-SHA256 logic and payload serialization so that
  sign (Reception) / verify (Prime) round-trips always match."
- The broadcast_whole_hostel comment in prime-compose/route.ts was added as a TODO marker:
  "WHOLE_HOSTEL_BROADCAST_CHANNEL_ID lives in the Prime app and is not importable here."
  This is a known debt, not an oversight.

---

## Recommended Approach

**Option C (recommended): Extract small pieces, structural test for complex types**

Extract to `packages/lib/src/prime/` (new sub-path at `@acme/lib/prime`):
1. `PrimeChannel` — const array and type (replaces parallel `InboxChannel` prime subset and
   `PrimeReviewChannel`)
2. `signActorClaims` + `verifyActorClaims` + `ActorClaims` interface — single Web Crypto
   implementation used by both apps
3. `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID = 'broadcast_whole_hostel'` — constant

Keep in-app (do NOT extract):
- `PrimeReviewThreadSummary`, `PrimeReviewThreadDetail`, `PrimeReviewCampaignDetail` — these
  types are intentionally widened in reception (uses `string` where prime has specific unions).
  Extraction would require importing prime-internal message types (`MessageKind`,
  `MessageAudience`, etc.) into `@acme/lib`, which is undesirable.
- Instead: add a `// satisfies` structural test confirming reception's
  `PrimeReviewThreadSummary` is structurally compatible with prime's authoritative version.

**Why not Option A (full extraction) or Option B (structural tests only):**
- Option A requires extracting prime's entire message-type graph into `@acme/lib` — a large
  surface increase with no benefit beyond compile-time checking of field names.
- Option B (tests only) doesn't give the actor-claims and channel-name guarantees at build time;
  a wrong secret or wrong channel name fails silently at runtime.

---

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Actor claims sign contract (both apps) | Yes | None | No |
| Actor claims verify contract (Prime) | Yes | None | No |
| Channel names — reception side | Yes | None | No |
| Channel names — Prime side | Yes | None | No |
| Broadcast channel ID usage | Yes | None — string literal is stable; confirmed no BROADCAST_CHANNEL_PREFIX constant exists in production code | No |
| PrimeReviewThreadSummary structural parity | Yes | Confirmed: reception uses intentionally-widened types (string unions vs specific enums) | No |
| Package dependency graph | Yes | No new deps needed — prime already imports @acme/lib/hospitality | No |
| Turbopack/tsconfig paths impact | Yes | @acme/lib resolves via node_modules, not tsconfig paths — no paths entry needed | No |

---

## Scope Signal

- **Signal:** right-sized
- **Rationale:** The three extraction targets (channels, actor claims, broadcast ID) are
  all simple, self-contained utilities with no transitive dependencies. The structural test
  for PrimeReviewThreadSummary is a single TypeScript assertion. Total blast radius is
  5–7 files modified, 1 new sub-path added to `@acme/lib`. No architectural risk.

---

## Open Questions

All questions self-resolved:

1. **Do prime functions already depend on `@acme/lib`?** → Yes. `apps/prime/functions/api/guest-booking.ts` imports from `@acme/lib/hospitality`. No new dependency edge needed.

2. **Does the actor claims Web Crypto impl work in both Cloudflare Workers and Next.js server?** → Yes. Both apps use the global `crypto.subtle`. The Web Crypto API is available in both environments.

3. **Is `broadcast_whole_hostel` a constant or a derived value?** → It is a string literal used throughout prime tests and production code with no exported constant. The comment in reception explains the derivation but no `BROADCAST_CHANNEL_PREFIX` constant exists in production code. Safe to extract as a literal constant.

4. **Would extracting actor claims break the HMAC round-trip?** → No, if the shared implementation preserves the `serializePayload` helper with fixed field order `{ uid, roles, iat }`. The verification clock-skew window (±5 min) must also be preserved.

---

## Evidence Gap Review

### Gaps Addressed

- Confirmed prime functions import from `@acme/lib` already (no new dependency edge)
- Confirmed actor claims both use identical Web Crypto API (safe to share)
- Confirmed broadcast_whole_hostel is a raw string literal throughout (no BROADCAST_CHANNEL_PREFIX exists — safe to add one)
- Confirmed reception's type widening is intentional and correct (no need to extract complex types)

### Confidence Adjustments

- Implementation: **90** — all files located, approach clear, pattern (packages/lib/src/hospitality/) already established
- Approach: **88** — Option C is well-supported; structural test for types is proven TypeScript pattern
- Impact: **90** — compile-time guarantee for highest-risk coupling points (actor claims, channels)
- Delivery-Readiness: **88** — no blockers, all evidence present
- Testability: **92** — TypeScript compilation IS the test; plus one explicit round-trip test to add

### Remaining Assumptions

- Prime functions tsconfig allows `@acme/lib/*` imports (confirmed for `/hospitality` sub-path; `/prime` follows same pattern)
- CI builds both apps in same Turborepo pass, so a single-PR change to `@acme/lib` + both apps is always consistent

---

## Evidence Audit

| Claim | Verified? | Evidence |
|---|---|---|
| Prime functions import @acme/lib already | Yes | `apps/prime/functions/api/guest-booking.ts` imports `from '@acme/lib/hospitality'` |
| Both actor-claims implementations use Web Crypto API | Yes | Both use `crypto.subtle.importKey` / `.sign` / `.verify` — no Node.js crypto |
| Payload field order is identical in both implementations | Yes | Reception: `JSON.stringify({ uid, roles, iat })` — Prime: `JSON.stringify({ uid, roles, iat })` via `serializePayload()` |
| `broadcast_whole_hostel` is a raw literal with no exported constant in prime | Yes | Grep confirmed — only test fixtures and comment; no `BROADCAST_CHANNEL_PREFIX` variable in production code |
| Reception `PrimeReviewThreadSummary` is structurally compatible with Prime's | Yes | Side-by-side comparison confirms all fields match; reception uses wider string unions intentionally |
| No cyclic dependency would be introduced | Yes | @acme/lib has no app deps; prime already depends on @acme/lib; reception depends on @acme/lib |

---

## Analysis Readiness

- **Status:** Ready-for-analysis
- **Primary blocker:** None
- **Confidence floor met:** Yes — Implementation ≥80, Delivery-Readiness ≥80
- **Open questions requiring operator input:** None
- **Recommended next step:** Proceed to `/lp-do-analysis reception-prime-shared-contract-layer`

---

## Critique (Self-Review)

**Round 1:**

Issues raised:
- The `PrimeReviewCampaignDetail` type is also duplicated but not mentioned in the plan. Should it be structurally tested too?
- The `inboxChannels` array in reception includes all four channels (`email`, `prime_direct`, `prime_broadcast`, `prime_activity`). If we extract prime channel names to `@acme/lib/prime`, reception's channels.ts would need to compose them (e.g., `["email", ...primeChannels] as const`). This needs explicit handling in the plan tasks.

Resolutions:
- `PrimeReviewCampaignDetail` is also duplicated and large. The structural test approach applies here too — add a `satisfies` test alongside the thread summary test.
- The `inboxChannels` composition pattern is straightforward. Plan task must specify the exact pattern to avoid breaking the `isInboxChannel()` type guard.

**Verdict after Round 1:** credible — minor additions to plan scope required (campaign type test, channels composition pattern). Not blocking.

**Score: 4.2 / 5.0**
