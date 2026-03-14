---
Type: Analysis
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-prime-shared-contract-layer
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/reception-prime-shared-contract-layer/fact-find.md
Related-Plan: docs/plans/reception-prime-shared-contract-layer/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Reception–Prime Shared Contract Layer — Analysis

## Decision Frame

### Summary

Reception and the Prime messaging app maintain parallel definitions of three coupling points
that have no compile-time enforcement: Prime channel names, HMAC actor-claims utilities, and
the whole-hostel broadcast channel ID. The decision is which extraction strategy gives the
best compile-time safety with the lowest restructuring cost, given that both apps already
depend on `@acme/lib`.

### Goals

- Compile-time enforcement for the three highest-risk cross-app coupling points
- No change to runtime behaviour
- Minimum restructuring surface

### Non-goals

- Extracting Prime's internal message-type graph (`MessageKind`, `MessageAudience`, etc.)
- Unifying the full inbox API models (reception's intentional type widening stays)
- Changing any API shape or wire format

### Constraints & Assumptions

- Prime functions run in Cloudflare Workers (Web Crypto only — no Node.js `crypto`)
- `@acme/lib` must not import from app code (one-way dep)
- Both apps already depend on `@acme/lib`; no new dependency edge required
- Turbopack resolveAlias: `@acme/lib/*` resolves via `node_modules`, not tsconfig `paths` — no
  per-app config changes needed

---

## Inherited Outcome Contract

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

## Fact-Find Reference

- Related brief: `docs/plans/reception-prime-shared-contract-layer/fact-find.md`
- Key findings used:
  - Prime already imports `@acme/lib/hospitality` in `guest-booking.ts` — no new dep edge
  - Both actor-claims impls use Web Crypto API — safe to share across Next.js server +
    Cloudflare Workers
  - Payload field order `{ uid, roles, iat }` is identical in both implementations (load-bearing
    for HMAC round-trips)
  - `broadcast_whole_hostel` is a raw string literal throughout; no exported constant exists
    in prime production code
  - Reception's `PrimeReviewThreadSummary` is intentionally widened — extraction of complex
    types would require importing prime-internal message types into `@acme/lib`
  - `packages/lib/src/hospitality/` provides the structural pattern for a new sub-path

---

## Evaluation Criteria

| Criterion | Why it matters | Priority |
|---|---|---|
| Compile-time safety | Divergence currently fails silently at runtime | High |
| Restructuring surface | Minimal disruption to both apps' internal type graphs | High |
| Test coverage gain | Round-trip test for actor claims is currently absent | High |
| Migration risk | Actor claims HMAC is load-bearing; regression = broken inbox | Critical |
| Rollback simplicity | Must be revertable in one PR | Medium |

---

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A — Full extraction | Move all Prime response types to `@acme/lib/prime`: channels, actor claims, `PrimeReviewThreadSummary`, `PrimeReviewThreadDetail`, `PrimeReviewCampaignDetail`, broadcast ID | All shared language in one place; maximum compile-time coverage | Requires importing prime-internal message types (`MessageKind`, `MessageAudience`, `MessageAttachment`, `MessageLink`, `MessageCard`) into `@acme/lib`; large surface increase | Complex deps in shared package; reception's intentional type widening would need to be abandoned or replicated via mapped types | No — complexity cost exceeds safety gain |
| B — Structural tests only | Keep all parallel definitions; add TypeScript `satisfies` assertions in a cross-app test file | Zero refactoring risk; zero migration surface | Does not give compile-time enforcement for actor claims (runtime HMAC breakage stays silent at compile time); structural tests only catch type drift, not algorithm drift | Algorithm divergence in actor claims would still compile | No — insufficient for the highest-risk coupling point (actor claims) |
| C — Targeted extraction + structural tests | Extract to `@acme/lib/prime`: channel const, actor claims sign+verify, broadcast ID constant. Add `satisfies` tests for complex types that stay in-app | Compile-time guarantee for the three highest-risk points; follows existing `@acme/lib/hospitality` pattern; minimal restructuring | Complex types (`PrimeReviewThreadSummary`, etc.) still duplicated (mitigated by structural tests) | Actor claims migration must preserve byte-identical serialization; one wrong change breaks all mutating Prime calls | **Yes — chosen** |

---

## Engineering Coverage Comparison

| Coverage Area | Option A | Option B | Option C (chosen) |
|---|---|---|---|
| UI / visual | N/A | N/A | N/A |
| UX / states | N/A | N/A | N/A |
| Security / privacy | Full — all auth types shared; large migration surface increases risk | Partial — no enforcement for actor claims algorithm divergence | **Full** — actor claims algorithm and payload contract shared; clock-skew window preserved |
| Logging / observability / audit | N/A | N/A | N/A |
| Testing / validation | Round-trip test possible; but heavy migration of message types creates many new test gaps | Structural tests only; no round-trip test | **Round-trip sign→verify test added; structural `satisfies` tests for remaining types** |
| Data / contracts | All contracts enforced; but introduces prime message types as public API of @acme/lib | No enforcement change | **Channel + actor claims + broadcast ID enforced; complex types structurally tested** |
| Performance / reliability | N/A | N/A | N/A |
| Rollout / rollback | Single PR; but larger migration surface increases conflict risk | Single PR; trivial | **Single PR; 5–7 files; rollback = revert** |

---

## Chosen Approach

**Recommendation:** Option C — targeted extraction to `@acme/lib/prime` + structural tests for
complex types.

**Why this wins:**
- Actor claims are the highest-risk coupling point: an algorithm divergence (field order change,
  wrong algorithm) breaks all mutating Prime calls silently. Sharing the implementation
  eliminates that class of bug entirely.
- Channel names are a safe, zero-risk extraction that removes a silent-fallback risk.
- Broadcast channel ID is a trivial constant that removes a documented "not importable" TODO.
- Complex types (`PrimeReviewThreadSummary`, `PrimeReviewCampaignDetail`) are intentionally
  widened in reception — extraction would force an architectural decision about whether to
  import prime-internal message types into `@acme/lib`. Structural tests cover this gap at
  much lower cost.
- The extraction follows the exact pattern already used for `@acme/lib/hospitality`.

**What it depends on:**
- `packages/lib` TypeScript build must support Web Crypto API types (no Node.js-specific types)
- Both apps must update their imports in the same PR (Turborepo ensures consistent build)
- The `inboxChannels` array in reception must be composed from the extracted prime channels
  constant rather than re-declaring the strings (ensures `isInboxChannel()` type guard remains
  accurate)

### Rejected Approaches

- **Option A (full extraction)** — extracting `PrimeReviewCampaignDetail` and detail types
  would drag prime-internal message types (`MessageKind`, `MessageAudience`, `MessageLink`,
  `MessageCard`, `MessageAttachment`) into `@acme/lib`. These types are only meaningful in
  the prime messaging context; making them a public API of the shared package adds maintenance
  burden with no incremental safety gain beyond structural tests.
- **Option B (structural tests only)** — structural tests do not catch algorithm divergence in
  actor claims. If the HMAC payload serialization changes in one app but not the other, tests
  pass but all mutating Prime calls break at runtime. This is the exact failure mode we must
  prevent.

---

## Planning Handoff

### Task decomposition guidance

The plan should have 4 discrete implementation tasks (each independently releasable if needed):

**TASK-01: Create `packages/lib/src/prime/` sub-path**
- New files: `prime/channels.ts` (channel const + type), `prime/actor-claims.ts`
  (sign + verify + `ActorClaims` interface), `prime/constants.ts`
  (`WHOLE_HOSTEL_BROADCAST_CHANNEL_ID`)
- Update `packages/lib/package.json` exports: add `./prime` entry
- Update `packages/lib/tsconfig.json` or build config if needed
- The actor claims implementation must use Web Crypto API exclusively
- Preserve: `CLOCK_SKEW_SECONDS = 300`, minimum key length comment/assertion,
  `serializePayload` with fixed field order `{ uid, roles, iat }`

**TASK-02: Migrate reception to imports from `@acme/lib/prime`**
- `apps/reception/src/lib/inbox/actor-claims.ts` → re-export `signActorClaims` from
  `@acme/lib/prime` (reception never needs `verifyActorClaims`)
- `apps/reception/src/lib/inbox/channels.ts` → compose `inboxChannels` as
  `["email", ...PRIME_CHANNELS] as const` where `PRIME_CHANNELS` comes from `@acme/lib/prime`
- `apps/reception/src/app/api/mcp/inbox/prime-compose/route.ts` → import
  `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` from `@acme/lib/prime`

**TASK-03: Migrate prime functions to imports from `@acme/lib/prime`**
- `apps/prime/functions/lib/actor-claims.ts` → import `signActorClaims`, `verifyActorClaims`,
  `ActorClaims` from `@acme/lib/prime` and re-export (or call directly)
- `apps/prime/functions/lib/prime-review-api.ts` → import `PrimeReviewChannel` from
  `@acme/lib/prime` (replacing local type definition)

**TASK-04: Add structural validation tests**
- A round-trip test: `signActorClaims` from `@acme/lib/prime` → `verifyActorClaims` from
  `@acme/lib/prime` → asserts returned `{ uid, roles }` matches input
- A structural `satisfies` test: reception's local `PrimeReviewThreadSummary` type must
  satisfy the canonical shape from the fact-find analysis (or a lightweight canonical type
  defined in `@acme/lib/prime`)
- A structural `satisfies` test: `PrimeReviewCampaignDetail` in reception satisfies prime's
  authoritative shape
- Tests live in `packages/lib/__tests__/prime/` (not in either app, to prove cross-app
  accessibility)

### Sequencing constraints

- TASK-01 must land before TASK-02 and TASK-03 (they import the new sub-path)
- TASK-02 and TASK-03 can run in parallel after TASK-01
- TASK-04 can run in parallel with TASK-02 and TASK-03 once TASK-01 is done

### Sequencing constraints summary

- TASK-01 → TASK-02, TASK-03 (parallel) → TASK-04 (parallel with 02+03)

---

## Risks to Carry Forward

| Risk | Severity | Mitigation |
|---|---|---|
| Actor claims byte-identity broken during migration | Critical | Round-trip test (`sign` then `verify` in same test) is the primary gate; must pass before merging |
| `inboxChannels` type guard broken by composed array | High | TypeScript `satisfies` assertion on the composed array; CI typecheck enforces it |
| Package build order issue (new sub-path not built before app imports) | Medium | Turborepo builds `@acme/lib` before apps; verify `pnpm -w build` succeeds locally before PR |
| Prime tsconfig does not allow new `@acme/lib/prime` sub-path | Low | Already imports `@acme/lib/hospitality` — same pattern; no additional config expected |

---

## End-State Operating Model

### Actor claims (after)

- Single `signActorClaims` + `verifyActorClaims` implementation in `packages/lib/src/prime/actor-claims.ts`
- Reception imports `signActorClaims` from `@acme/lib/prime` (sign only — no change to capability)
- Prime imports both from `@acme/lib/prime`
- Round-trip test in `packages/lib/__tests__/prime/` proves the contract

### Channel names (after)

- `PRIME_CHANNELS` const in `packages/lib/src/prime/channels.ts`
- Reception's `inboxChannels = ["email", ...PRIME_CHANNELS]` — one source of truth for prime channel strings
- Prime's `PrimeReviewChannel` type imported from `@acme/lib/prime`
- If Prime adds a new channel: update `@acme/lib/prime/channels.ts` → TypeScript forces update in reception's channel-adapter switch/lookup

### Broadcast channel ID (after)

- `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID = 'broadcast_whole_hostel'` exported from `@acme/lib/prime/constants.ts`
- Reception's prime-compose route imports the constant instead of hardcoding the string
- The TODO comment removed

### Complex types (after)

- `PrimeReviewThreadSummary`, `PrimeReviewThreadDetail`, `PrimeReviewCampaignDetail` remain as local definitions in both apps (intentional widening preserved)
- `satisfies` structural tests in `packages/lib/__tests__/prime/` verify they remain structurally compatible
- A field added to Prime's authoritative type does NOT automatically appear in the structural test — but the test file is a natural checklist to keep up to date

### What remains unchanged

- All wire formats (HTTP request/response shapes)
- Runtime behaviour of both apps
- Reception's intentional type widening
- All existing tests

---

## Planning Readiness

- **Status:** Ready-for-planning
- **Evidence Gate:** Pass
- **Option Gate:** Pass — 3 options compared, 2 rejected with rationale
- **Planning Handoff Gate:** Pass — chosen approach decisive, sequencing defined, risks transferred
- **Operator questions remaining:** None
- **Mode:** analysis+auto → auto-continue to `/lp-do-plan`

---

## Open Questions

None — all questions resolved in fact-find. No operator input required before planning.
