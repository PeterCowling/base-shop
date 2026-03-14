---
Type: Fact-Find
Outcome: planning
Status: Ready-for-analysis
Domain: API
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: inventory-uploader-user-attribution
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/inventory-uploader-user-attribution/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260313190000-0001
Trigger-Why: "When stock goes missing or an error is spotted, there is no record of who made the change. Attaching the logged-in user to every stock adjustment makes it easy to audit who did what and catch mistakes."
Trigger-Intended-Outcome: "type: operational | statement: Every stock change record shows which staff member made it, enabling accountability and easier error investigation. | source: operator"
---

# Inventory Uploader — User Attribution Fact-Find Brief

## Scope

### Summary

Stock adjustments and inflows are written to the `InventoryAuditEvent` table without recording who performed them. The `operatorId` column already exists in the Prisma schema (added in migration `20260308000000_add_inventory_audit_event`) and the repository functions already accept an optional `actor` parameter — but neither the route handlers nor the session module currently extract or forward a user identity. This change threads the session-derived identity through the HTTP request → route handler → repository → database write path.

### Goals

- Every `POST /api/inventory/[shop]/adjustments` write records the acting session identity in `operatorId`.
- Every `POST /api/inventory/[shop]/inflows` write records the acting session identity in `operatorId`.
- The ledger `GET /api/inventory/[shop]/ledger` response exposes `operatorId` so the UI can display who made each change.
- No unauthenticated request can supply a fabricated actor identity.

### Non-goals

- Adding per-user login; the current single-token model remains unchanged (all authenticated users share one session token).
- UI changes to display attribution (out of scope for this change; exposure in the API response is sufficient).
- Retroactive backfill of historical `operatorId = null` rows.

### Constraints & Assumptions

- Constraints:
  - The session token is opaque (HMAC-signed, no embedded user metadata). The session module has no userId or userEmail. Identity must come from a different source — the request IP or a header like `X-Forwarded-For`, or the operator must supply a caller label at login time.
  - The current auth model is single-token (`INVENTORY_ADMIN_TOKEN`): all staff log in with the same shared secret. There is no per-staff user account, so `operatorId` can only store a session-level identifier (e.g. IP address or a session nonce), not a named user.
  - `StockAdjustmentActor` and `StockInflowActor` types carry `customerId?: string` and `role?: string`. Neither field maps naturally to "which staff member". The types may need augmentation or an IP/label field added.
- Assumptions:
  - The most viable attribution for the current auth model is the requester's IP address (extractable via `requestIp.ts` which already exists and is used by the login rate limiter).
  - Alternatively, the operator could add a `callerLabel` field to the request body (optional, free text), which is stored verbatim — this adds no auth complexity.
  - The `inventoryAuditEvent.operatorId` column is already `String?` (nullable) so no migration is needed.

## Outcome Contract

- **Why:** When stock goes missing or an error is spotted, there is no record of who made the change. Attaching the logged-in user to every stock adjustment makes it easy to audit who did what and catch mistakes.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Every stock change record shows which staff member made it, enabling accountability and easier error investigation.
- **Source:** operator

## Current Process Map

None: local code path only — this is a pure server-side code path change with no multi-step process, lifecycle state, CI/deploy lane, approval path, or operator runbook affected.

## Discovery Contract Output

- **Gap Case ID:** n/a
- **Recommended First Prescription:** n/a
- **Required Inputs:** n/a
- **Expected Artifacts:** n/a
- **Expected Signals:** n/a

### Prescription Candidates

Not applicable — no discovery contract on this dispatch.

## Evidence Audit (Current State)

### Entry Points

- `apps/inventory-uploader/src/app/api/inventory/[shop]/adjustments/route.ts` — POST handler calls `applyStockAdjustment(shop, payload)` with no actor argument.
- `apps/inventory-uploader/src/app/api/inventory/[shop]/inflows/route.ts` — POST handler calls `receiveStockInflow(shop, payload)` with no actor argument.
- `apps/inventory-uploader/src/app/api/inventory/[shop]/ledger/route.ts` — GET handler reads `InventoryAuditEvent` rows and maps them to `LedgerEvent`; `operatorId` is not included in the mapped output.

### Key Modules / Files

- `packages/platform-core/src/repositories/stockAdjustments.server.ts` — `applyStockAdjustment(shop, payload, options: { actor?: StockAdjustmentActor })`. Already accepts actor in the options bag. Writes `operatorId: null` hardcoded to every `inventoryAuditEvent.create` call (line 252). The `options.actor` object is only forwarded to `report.adjustedBy` and `event.adjustedBy`; it is never stored in the DB row.
- `packages/platform-core/src/repositories/stockInflows.server.ts` — `receiveStockInflow(shop, payload, options: { actor?: StockInflowActor })`. Same pattern: actor accepted but `operatorId: null` hardcoded in every `inventoryAuditEvent.create` call (line 239).
- `packages/platform-core/src/types/stockAdjustments.ts` — `StockAdjustmentActor = { customerId?: string; role?: string }`. No IP or label field. `stockAdjustmentEventSchema` has an optional `adjustedBy` object with the same shape.
- `packages/platform-core/src/types/stockInflows.ts` — `StockInflowActor = { customerId?: string; role?: string }`. Same shape as above.
- `apps/inventory-uploader/src/lib/inventory-utils.ts` — `LedgerEvent` type: `{ id, timestamp, type, sku, variantKey, quantityDelta, referenceId, note }`. No `operatorId` field. This type is what the ledger GET route maps DB rows into.
- `apps/inventory-uploader/src/lib/auth/session.ts` — `hasInventorySession(request)` returns `boolean`; no userId/email embedded. `issueSessionToken` uses `v1.<issuedAt>.<nonce>.<sig>` — only a timestamp and nonce, no identity payload.
- `apps/inventory-uploader/src/lib/auth/requestIp.ts` — `getTrustedRequestIpFromHeaders(headers)` already exists and is used by the login rate limiter. This is the viable identity source for the current single-token auth model.
- `packages/platform-core/prisma/schema.prisma` — `InventoryAuditEvent.operatorId String?` — column exists, nullable, no migration required.
- `apps/inventory-uploader/src/middleware.ts` — IP allowlist check runs before any route handler. The middleware does not forward the requester IP as a request header, so routes must re-derive it from the raw request headers.

### Patterns & Conventions Observed

- Both repository functions already have `options: { actor? }` as a third argument — the extension point is already designed for this.
- `operatorId: null` is a deliberate placeholder in both create calls, not an oversight in schema design.
- IP extraction is centralised in `requestIp.ts`, already imported by the rate limiter. No new utility needed.
- The `AuditEventEntry` / `InflowAuditEventEntry` types in the repository files already include `operatorId: string | null` in their return type definitions — the read path is already typed for it.

### Data & Contracts

- Types/schemas/events:
  - `LedgerEvent` (inventory-utils.ts) must gain `operatorId: string | null` field.
  - `StockAdjustmentActor` and `StockInflowActor` need an identity field. Two options: (a) add `ip?: string` to carry the requester IP, or (b) use `customerId` as the IP carrier (semantic mismatch but no schema change). Option (a) is cleaner.
  - `stockAdjustmentEventSchema` and `stockInflowEventSchema` currently use `.strict()` on the `adjustedBy`/`receivedBy` objects — adding a new field requires the schema to be updated or the strict call relaxed for the nested object.
- Persistence:
  - `InventoryAuditEvent.operatorId` column exists, already nullable. No DB migration needed.
  - The hardcoded `operatorId: null` in both repository `create` calls must be replaced with the actor-derived value.
- API/contracts:
  - `GET /api/inventory/[shop]/ledger` response shape: `LedgerEvent[]`. Adding `operatorId` is additive and backward-compatible for consumers.
  - `POST` request bodies for adjustments and inflows: no change required — actor is derived server-side from the request, not from the body.

### Dependency & Impact Map

- Upstream dependencies:
  - `requestIp.ts` — already available in the inventory-uploader lib.
  - Prisma schema — already has the `operatorId` column.
- Downstream dependents:
  - Ledger GET response: any UI or client reading the ledger will see a new `operatorId` field (additive, non-breaking).
  - `AuditEventEntry` / `InflowAuditEventEntry` types in the repository layer — already typed for `operatorId`.
- Likely blast radius:
  - Narrow. Changes touch: 2 route handlers (pass actor), 2 repository functions (store actor in DB write), 1 shared type (`LedgerEvent`), 1 actor type (`StockAdjustmentActor`/`StockInflowActor` — or just add an ip field), ledger route mapper, and optionally the event schemas.
  - No changes to Prisma schema, migrations, session infrastructure, or middleware.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest
- Commands: `pnpm --filter scripts test` (governed runner per testing-policy.md); tests run in CI only.
- CI integration: standard monorepo CI pipeline.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Session auth (signing, revocation) | Unit | `apps/inventory-uploader/src/lib/auth/__tests__/session.test.ts` | Good coverage of token lifecycle; no actor threading tests |
| Access control (IP allowlist) | Unit | `apps/inventory-uploader/src/lib/auth/__tests__/accessControl.test.ts` | Tests IP extraction paths |
| Rate limiter | Unit | `apps/inventory-uploader/src/lib/auth/__tests__/rateLimit.test.ts` | Unrelated |
| Import size limit | Unit | `apps/inventory-uploader/src/lib/auth/__tests__/importSizeLimit.test.ts` | Unrelated |
| Stock inflows repository | Integration | `packages/platform-core/src/repositories/__tests__/stockInflows.server.test.ts` | Covers happy path, idempotency, dry-run — no actor tests |
| Stock adjustments repository | Integration | No dedicated test file — confirmed by glob: `packages/platform-core/src/repositories/__tests__/` contains `stockInflows.server.test.ts` but no `stockAdjustments.server.test.ts` | Gap: `stockAdjustments.server.ts` has no test file |
| Route handlers (adjustments, inflows) | — | None found | Gap: no route-level tests exist |
| Ledger route | — | None found | Gap: no test for ledger GET response shape |

#### Coverage Gaps

- Untested paths:
  - `applyStockAdjustment` with `actor` option — no test verifies that actor is stored in DB.
  - `receiveStockInflow` with `actor` option — no test verifies actor storage.
  - Route handlers for adjustments/inflows — no test verifies that the session request IP is extracted and forwarded.
  - Ledger GET route — no test verifies `operatorId` appears in the response.
- Extinct tests: none identified.

#### Testability Assessment

- Easy to test:
  - Repository layer: existing integration test pattern (`stockInflows.server.test.ts`) can be extended to pass an actor and assert the stored `operatorId` value via JSON file read or Prisma mock.
  - `LedgerEvent` type shape: unit test for the mapper in the ledger route.
- Hard to test:
  - Route-level IP extraction in a Next.js route handler (requires a mock Request with headers).
- Test seams needed:
  - The IP extraction in the route handler should call `getTrustedRequestIpFromHeaders(req.headers)` which is already testable via header injection.

#### Recommended Test Approach

- Unit tests for: `LedgerEvent` mapper (operatorId field present in output).
- Integration tests for: `applyStockAdjustment` with actor — assert operatorId stored; `receiveStockInflow` with actor — same.
- E2E tests for: not required for this change.
- Contract tests for: not required.

### Recent Git History (Targeted)

- `apps/inventory-uploader/src/app/api/inventory/` — last significant changes: `5a35a1` (route validation + env schema hardening), `b4cd077` (data-hardening session). No actor-threading work in recent history.
- `packages/platform-core/src/repositories/` — `stockInflows.server.ts` created with `operatorId: null` placeholder; the column and the options bag were designed for future attribution but never wired.

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | N/A | No UI changes; attribution is server-side only | None | No |
| UX / states | N/A | No UX changes; ledger API response is additive | None | No |
| Security / privacy | Required | Session is authenticated before routes execute; IP is derived server-side, not from request body. No untrusted user input is accepted as actor identity. | Risk: IP may be `null` or empty when `INVENTORY_TRUST_PROXY_IP_HEADERS` is disabled — null is acceptable (stored as `operatorId: null`) but should be documented. | Yes — confirm null handling |
| Logging / observability / audit | Required | `operatorId` column exists but is always `null`. Attribution is the core deliverable of this change. | Gap: `operatorId: null` hardcoded in both write paths. Carry forward: verify operatorId appears in ledger GET response. | Yes |
| Testing / validation | Required | Integration test exists for inflows (no actor); no test for adjustments; no route-level tests. | Gap: actor threading is untested end-to-end. | Yes — new tests required |
| Data / contracts | Required | `LedgerEvent` type lacks `operatorId`; `StockAdjustmentActor`/`StockInflowActor` lack an IP field; event schemas use `.strict()`. | Gap: type changes needed in 2–3 files. Schema migration not needed. | Yes |
| Performance / reliability | N/A | IP extraction is synchronous, negligible overhead. One extra field in DB write, no query change. | None | No |
| Rollout / rollback | Required | No feature flag. Change is additive: `operatorId` was always nullable, now it gets a value. Rollback = revert the code; DB rows with `operatorId` set are harmless after rollback. | Low risk — no migration to reverse. | Yes |

## Open Questions / Resolved Questions

### Resolved

- Q: Does the DB schema need a migration to add `operatorId`?
  - A: No. `operatorId String?` already exists in `InventoryAuditEvent` (Prisma schema, migration `20260308000000_add_inventory_audit_event`).
  - Evidence: `packages/platform-core/prisma/schema.prisma`, `packages/platform-core/prisma/migrations/20260308000000_add_inventory_audit_event/migration.sql`

- Q: Do the repository functions already have an actor parameter?
  - A: Yes. `applyStockAdjustment` and `receiveStockInflow` both accept `options: { actor? }` as a third argument. The actor is forwarded to the report/event objects but `operatorId: null` is hardcoded in the DB write.
  - Evidence: `packages/platform-core/src/repositories/stockAdjustments.server.ts` line 58 and 252; `packages/platform-core/src/repositories/stockInflows.server.ts` line 53 and 239.

- Q: Does the session object carry a userId or email?
  - A: No. The session token is `v1.<issuedAt>.<nonce>.<sig>` — a timestamp + nonce only. No user identity is embedded. The system uses a single shared admin token, so there is no per-user account to reference.
  - Evidence: `apps/inventory-uploader/src/lib/auth/session.ts` — `issueSessionToken` function.

- Q: What identity is available to store as `operatorId`?
  - A: The requester's IP address, derived via `getTrustedRequestIpFromHeaders` from `requestIp.ts`, is the only identity available server-side without changes to the auth model. Alternatively, the operator could add a `callerLabel` to the request body as a free-text identifier (e.g. staff name), but this requires no auth and is trivially spoofable by any authenticated caller.
  - Evidence: `apps/inventory-uploader/src/lib/auth/requestIp.ts` (used by rate limiter), `apps/inventory-uploader/src/lib/auth/session.ts`.

- Q: Are there existing tests to extend?
  - A: Yes for inflows; no dedicated test file found for stock adjustments or route handlers.
  - Evidence: `packages/platform-core/src/repositories/__tests__/stockInflows.server.test.ts`; no matching file for stockAdjustments.

- Q: Do the event schemas (Zod `.strict()`) need updating for the actor type?
  - A: Yes. `stockAdjustmentEventSchema` and `stockInflowEventSchema` define `.strict()` on the nested `adjustedBy`/`receivedBy` object. If an `ip` field is added to `StockAdjustmentActor`/`StockInflowActor`, the corresponding Zod schema must also be updated.
  - Evidence: `packages/platform-core/src/types/stockAdjustments.ts` line 67–72; `packages/platform-core/src/types/stockInflows.ts` line 57–62.

### Open (Operator Input Required)

- Q: Should the `operatorId` store the IP address or a caller-supplied label?
  - Why operator input is required: This is a product design decision, not resolvable from code alone. IP is automatic and tamper-proof but is not human-readable. A `callerLabel` field in the request body is human-readable but requires all callers to include it (no enforcement) and is trivially spoofable by any authenticated session. The operator must decide which trade-off is acceptable given the team's actual usage patterns.
  - Decision impacted: Whether the route handler extracts IP vs. reads `callerLabel` from request body; whether `StockAdjustmentActor` needs a new field or reuses `customerId`.
  - Decision owner: Operator / product owner.
  - Default assumption (if any): IP-based attribution proceeds by default if no input received. Risk: IP may be an internal proxy address rather than the actual workstation in some deployment configurations.

## Confidence Inputs

- Implementation: 90%
  - Evidence: `operatorId` column exists, repository options bag exists, IP extraction utility exists. The change is narrow and all extension points are already in place. What raises to 95%: operator decision on IP vs label resolved.
  - What raises to 90%: already at 90 — confirmed by evidence.
- Approach: 85%
  - Evidence: IP-threading approach is straightforward. The actor type schema change (adding `ip`) is the only mildly uncertain part due to Zod strict().
  - What raises to 90%: operator decision on identity source received.
- Impact: 95%
  - Evidence: `operatorId` in every write is the stated outcome; column exists; path is clear.
- Delivery-Readiness: 85%
  - Evidence: All extension points exist. One open question (IP vs label) could be defaulted. Tests need writing.
  - What raises to 90%: open question resolved; test plan confirmed.
- Testability: 80%
  - Evidence: Existing integration test pattern is directly extensible. Route-level tests require mock Request setup but are standard Jest patterns for Next.js routes.
  - What raises to 90%: confirm governed test runner can mock `Request` headers in route handler tests.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| IP returns null or proxy IP when `INVENTORY_TRUST_PROXY_IP_HEADERS` is unset | Medium | Low — `operatorId` stays null, which is the current state | Store null gracefully; log a debug-level note; document in env-helpers |
| Zod `.strict()` on actor schema rejects new `ip` field at runtime | High (if unaddressed) | Medium — adjustment/inflow writes would fail validation | Update `stockAdjustmentEventSchema` and `stockInflowEventSchema` to include `ip` in the nested object |
| CallerLabel approach (if chosen) — no enforcement means staff may omit it | High | Low — `operatorId` remains null for those calls | Default to IP if label not supplied; or require label in request schema |
| Test gap: no route-level tests for adjustments/inflows | High (existing gap) | Low for this change — but testing the new actor threading requires new test infrastructure | Write route handler tests as part of this plan |
| Historical rows with `operatorId = null` may cause confusion post-deploy | Low | Low — null is a valid documented state | Document that null means "recorded before attribution was enabled" |

## Planning Constraints & Notes

- Must-follow patterns:
  - Use `getTrustedRequestIpFromHeaders(req.headers)` from `apps/inventory-uploader/src/lib/auth/requestIp.ts` — do not re-implement IP extraction.
  - Pass actor via the existing `options: { actor? }` parameter in both repository functions — do not change function signatures.
  - Store null gracefully (no throw) if IP is unavailable.
  - Update Zod schemas alongside type changes to avoid strict() rejection.
- Rollout/rollback expectations:
  - No migration needed. Rollback = code revert. Rows written with `operatorId` set are harmless.
- Observability expectations:
  - `operatorId` visible in ledger GET response after this change; operators can query it directly.

## Suggested Task Seeds (Non-binding)

1. Add `ip?: string` to `StockAdjustmentActor` and `StockInflowActor` types; update corresponding Zod event schemas.
2. Replace `operatorId: null` with `options.actor?.ip ?? null` (or `options.actor?.customerId ?? null` if reusing existing field) in `stockAdjustments.server.ts` and `stockInflows.server.ts`.
3. In `adjustments/route.ts` POST: extract IP via `getTrustedRequestIpFromHeaders`, build actor, pass as third arg to `applyStockAdjustment`.
4. In `inflows/route.ts` POST: same pattern for `receiveStockInflow`.
5. Add `operatorId: string | null` to `LedgerEvent` type; update ledger GET route mapper to include it.
6. Write integration tests extending `stockInflows.server.test.ts` for actor threading; create equivalent for stockAdjustments.
7. Write route-level tests for adjustments and inflows POST handlers verifying actor is derived from request headers.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `operatorId` stored (non-null) in `InventoryAuditEvent` for every authenticated POST.
  - `operatorId` present in ledger GET response.
  - Tests pass in CI.
- Post-delivery measurement plan:
  - Query `InventoryAuditEvent` for rows where `operatorId IS NOT NULL` after first real adjustment post-deploy.

## Evidence Gap Review

### Gaps Addressed

- Confirmed `operatorId` column exists in DB schema — no migration needed.
- Confirmed repository functions already have the `options: { actor? }` extension point.
- Confirmed session module carries no user identity — IP is the only viable server-side source.
- Confirmed `LedgerEvent` type lacks `operatorId` — must be added.
- Confirmed Zod event schemas use `.strict()` on actor objects — must be updated alongside type changes.
- Confirmed `requestIp.ts` is already available in the auth lib.
- Confirmed test gap: no test for actor threading in either repository or route handlers.

### Confidence Adjustments

- Implementation confidence raised to 90% after confirming all extension points exist.
- Delivery-readiness at 85% pending operator decision on IP vs label identity source.

### Remaining Assumptions

- IP-based attribution is the default approach unless operator specifies otherwise.
- `options.actor?.ip ?? null` will be the value stored in `operatorId` (using the new `ip` field on the actor type).
- Existing test infrastructure (Jest, integration test pattern from `stockInflows.server.test.ts`) is sufficient.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Entry points (adjustments/inflows routes) | Yes | None | No |
| Repository actor parameter (extension point) | Yes | None | No |
| DB schema (operatorId column) | Yes | None | No |
| Session module (identity availability) | Yes | None — confirmed: no identity embedded | No |
| IP extraction utility (requestIp.ts) | Yes | None | No |
| Type changes needed (LedgerEvent, Actor types) | Yes | None | No |
| Zod schema strict() impact | Yes | [Type contract gap] [Moderate]: Adding `ip` to actor types without updating the Zod event schemas will cause runtime parse failures on `stockAdjustmentEventSchema.parse()` and `stockInflowEventSchema.parse()`. Already noted in planning constraints. | No — mitigated in task seeds |
| Test landscape | Yes | [Scope gap in investigation] [Minor]: No route-level test infrastructure exists; must be created alongside actor threading. Not a blocker but requires new test setup. | No |
| Ledger GET route (operatorId exposure) | Yes | None | No |

## Scope Signal

Signal: right-sized

Rationale: All extension points are already in place (actor options bag, operatorId column, IP utility). The change is additive with no migration and a narrow blast radius (2 routes, 2 repositories, 3 types, 1 mapper). The one open question (IP vs label) has a safe default. No expansion is needed.

## Analysis Readiness

- Status: Ready-for-analysis
- Blocking items: None
- Recommended next step: `/lp-do-analysis inventory-uploader-user-attribution`
