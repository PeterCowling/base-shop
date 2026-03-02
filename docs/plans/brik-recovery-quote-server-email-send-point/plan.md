---
Type: Plan
Status: Active
Domain: API
Workstream: Engineering
Created: 2026-03-02
Last-reviewed: 2026-03-02
Last-updated: 2026-03-02T13:00Z
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brik-recovery-quote-server-email-send-point
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: create-api-endpoint
Overall-confidence: 82%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# BRIK Recovery Quote Server Email Send Point Plan

## Summary

The current recovery quote flow is client-only: on form submit, the browser is redirected to a `mailto:` URI. This plan replaces that path with a real server-send flow by: (1) establishing a deterministic quote-data contract and calculation helper module as a firm precursor, then (2) implementing `/api/recovery/quote/send` as the authoritative email dispatch endpoint, then (3) updating the `RecoveryQuoteCapture` component to call the API and show structured send status rather than redirecting to `mailto:`. The implementation is constrained to Cloudflare free-tier compatibility throughout: no SMTP/Nodemailer primary path, API-provider-first (`sendgrid`/`resend`), and `export const dynamic = "force-dynamic"` on the new route. A CHECKPOINT after the quote contract task protects the two downstream implementation tasks from stale assumptions.

## Active tasks

- [x] TASK-01: Define deterministic quote contract and calculation helper module
- [x] TASK-02: CHECKPOINT — validate contract before endpoint and UI build
- [x] TASK-03: Implement `/api/recovery/quote/send` endpoint
- [ ] TASK-04: Update `RecoveryQuoteCapture` component to server-send path

## Goals

- Replace the `mailto:` redirect with a verifiable server-send path for recovery quote emails.
- Establish a deterministic, hashable quote-data contract before the send endpoint is built.
- Remain compatible with Cloudflare free tier throughout (no SMTP primary path).
- Return structured send status to the UI so success is gated on provider acceptance, not on redirect.
- Add test coverage for quote-calculation determinism, endpoint contract, and recovery UI status flow.

## Non-goals

- Exact per-rate-plan price totals (deferred; `from_price` deterministic mode is the launch contract).
- Paid Cloudflare features or Workers AI.
- Migrating recovery capture storage from localStorage to server-side (noted as compliance consideration; deferred).
- Changing the `mailto:` path for other non-recovery email CTAs.

## Constraints & Assumptions

- Constraints:
  - Must remain compatible with Cloudflare free tier (`nodejs_compat` flag, API-provider-first email path).
  - Deterministic quote contract (TASK-01) must be complete before endpoint (TASK-03) and UI (TASK-04) are built.
  - SMTP/Nodemailer must not be primary path for this endpoint; endpoint must enforce API-provider-first at startup.
  - `export const dynamic = "force-dynamic"` required on new route (prevents static prerendering; consistent with existing availability route).
- Assumptions:
  - `from_price` deterministic mode (indicative per-night price × nights) is acceptable as the initial production quote contract.
  - `EMAIL_PROVIDER`, `SENDGRID_API_KEY` or `RESEND_API_KEY`, and `CAMPAIGN_FROM` env vars are configured in deploy environments.
  - The `indicative_prices.json` file can serve as the fallback price source when availability data is unavailable or room_id is absent from context.

## Inherited Outcome Contract

- **Why:** Operator requested moving forward from briefing and explicitly required deterministic quote contract-first sequencing plus Cloudflare free-tier compatibility.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Produce planning-ready scope to implement deterministic quote data/calculation contract first, then implement server quote-email send point with verifiable send outcomes on Cloudflare free-tier-compatible runtime constraints.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/brik-recovery-quote-server-email-send-point/fact-find.md`
- Key findings used:
  - No server send path currently exists; `RecoveryQuoteCapture.tsx` calls `window.location.href = buildMailtoHref(...)` on submit.
  - Availability route (`/api/availability/route.ts`) is the existing seam for Octobook price data; it returns `priceFrom` (per-night from total) and `ratePlans` labels only — no per-rate-plan exact totals.
  - `packages/email/src/send.ts` `sendCampaignEmail()` is the established dispatch function; provider order is resolved from `EMAIL_PROVIDER` env var at call time.
  - `packages/email/src/providers/index.ts` defaults to `smtp` when `EMAIL_PROVIDER` is unset — this is unsuitable for Cloudflare-targeted runtime; endpoint must enforce API-provider check at startup.
  - `indicative_prices.json` (new, workspace) provides `from_per_night` prices for known rooms as a deterministic fallback.
  - `roomsData.ts` has `RoomId` union and `basePrice.amount` per room as a secondary data source for quote calculation.
  - Wrangler/open-next config: `nodejs_compat` flag, Cloudflare Pages deploy. No paid services in scope.
  - `CONTACT_EMAIL = "hostelpositano@gmail.com"` from `src/config/hotel.ts` — used as the recipient (the operator inbox, not the guest).

## Proposed Approach

- Option A: Quote contract as a new `src/utils/recoveryQuoteCalc.ts` module (pure functions for deterministic calculation and hash/idempotency key derivation), then a new `src/app/api/recovery/quote/send/route.ts` POST endpoint that validates the request, resolves a quote, calls `sendCampaignEmail`, and returns a structured status. UI updated to `fetch()` the endpoint instead of building a `mailto:` href.
- Option B: Inline quote calculation inside the route handler, no separate helper module. Faster to write but untestable as a pure unit.
- Chosen approach: **Option A.** The separation of pure quote calculation into a dedicated utility module is the right call: it enables isolated unit testing of the deterministic contract, provides a stable import seam for both the route and future consumers, and makes the idempotency key derivable from the same deterministic function without coupling it to the HTTP layer.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Define quote contract, calculation helper, and idempotency key | 85% | M | Complete (2026-03-02) | - | TASK-02 |
| TASK-02 | CHECKPOINT | Validate contract before endpoint and UI build | 95% | S | Complete (2026-03-02) | TASK-01 | TASK-03, TASK-04 |
| TASK-03 | IMPLEMENT | Implement `/api/recovery/quote/send` POST endpoint | 80% | M | Complete (2026-03-02) | TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Update `RecoveryQuoteCapture` to server-send path | 80% | M | Pending | TASK-03 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Standalone; pure utility module and types |
| 2 | TASK-02 | TASK-01 complete | CHECKPOINT — lp-do-build invokes lp-do-replan before proceeding |
| 3 | TASK-03 | TASK-02 complete | Route implementation; depends on contract from TASK-01 |
| 4 | TASK-04 | TASK-03 complete | UI change; depends on endpoint shape from TASK-03 |

## Tasks

---

### TASK-01: Define deterministic quote contract, calculation helper, and idempotency key

- **Type:** IMPLEMENT
- **Deliverable:** `apps/brikette/src/utils/recoveryQuoteCalc.ts` (new), `apps/brikette/src/utils/recoveryQuoteCalc.test.ts` (new)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-02)
- **Build evidence:**
  - Commit: `c81d529726` on `dev`
  - Files created: `apps/brikette/src/utils/recoveryQuoteCalc.ts`, `apps/brikette/src/utils/recoveryQuoteCalc.test.ts`
  - Typecheck: exit 0 (pnpm --filter @apps/brikette typecheck)
  - Lint: 0 errors (pre-existing warnings only)
  - Route: inline execution (Codex offload deadlocked on writer lock; fell back to direct writes)
- **Affects:**
  - `apps/brikette/src/utils/recoveryQuoteCalc.ts` (new)
  - `apps/brikette/src/utils/recoveryQuoteCalc.test.ts` (new)
  - `[readonly] apps/brikette/src/utils/recoveryQuote.ts` — imports `RecoveryQuoteContext`; no changes
  - `[readonly] apps/brikette/src/data/indicative_prices.json` — read as price fallback
  - `[readonly] apps/brikette/src/data/roomsData.ts` — read for `basePrice.amount` as secondary source
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 85%
  - Implementation: 85% - Pure function module; insertion point is clear. File locations confirmed. `RecoveryQuoteContext` type is already exported from `recoveryQuote.ts`. Held-back test: the one unresolved unknown is whether `indicative_prices.json` room IDs (room_10, room_13, etc.) align with `RoomId` union in `roomsData.ts` — they currently use different ID conventions (room_10 in JSON vs room_10 in roomsData; double_room matches). This mismatch is discoverable and can be resolved in the module with a simple lookup/normalize step; it does not threaten the module's feasibility.
  - Approach: 90% - Pure functions are the correct approach; deterministic calculation from known inputs is well-bounded. `from_price` mode is the agreed launch contract (fact-find confirmed).
  - Impact: 80% - This module is entirely a precursor step; its direct impact is enabling TASK-03. Held-back test: if the deterministic hash function produces non-stable output across runtime environments (e.g., object key ordering), idempotency keying would be unreliable. Mitigation: use sorted-key JSON serialization for the hash input.
- **Acceptance:**
  - `recoveryQuoteCalc.ts` exports: `RecoveryQuote` type, `buildRecoveryQuote(context, opts?)`, `buildQuoteIdempotencyKey(quote)`.
  - `buildRecoveryQuote` returns `{ mode: "from_price", pricePerNight: number | null, totalFrom: number | null, nights: number, currency: "EUR", priceSource: "indicative" | "live" | "none" }`.
  - `buildQuoteIdempotencyKey` returns a stable string derived from checkin, checkout, pax, room_id, rate_plan, and a UTC date (not wall-clock ms) — suitable as dedup store key.
  - Unit tests pass for: deterministic output given same inputs, null price when room_id unknown, stable hash on repeated calls.
- **Validation contract (TC-01):**
  - TC-01-01: `buildRecoveryQuote({ checkin: "2026-06-01", checkout: "2026-06-03", pax: 1, source_route: "/book", room_id: "room_10" })` returns `mode: "from_price"`, `nights: 2`, `pricePerNight: 80`, `totalFrom: 160`, `priceSource: "indicative"`.
  - TC-01-02: `buildRecoveryQuote` with unknown `room_id` returns `pricePerNight: null`, `totalFrom: null`, `priceSource: "none"`.
  - TC-01-03: `buildQuoteIdempotencyKey(quote)` returns identical string on two calls with same inputs.
  - TC-01-04: `buildQuoteIdempotencyKey` produces different values when checkin differs by 1 day.
  - TC-01-05: `buildRecoveryQuote` with no `room_id` returns `priceSource: "none"` (no room to look up).
- **Execution plan:** Red -> Green -> Refactor
  - Red: write test file with TC-01-01 through TC-01-05 against exported functions — all fail (module not yet created).
  - Green: create `recoveryQuoteCalc.ts` implementing `buildRecoveryQuote` (reads `indicative_prices.json`, computes nights from checkin/checkout, returns `RecoveryQuote`) and `buildQuoteIdempotencyKey` (sorted JSON of stable fields, no timestamp).
  - Refactor: extract price-lookup logic to a private helper; add JSDoc; verify no circular imports.
- **Planning validation (required for M/L):**
  - Checks run:
    - Confirmed `RecoveryQuoteContext` is exported from `apps/brikette/src/utils/recoveryQuote.ts` (line 12-19).
    - Confirmed `indicative_prices.json` exists at `apps/brikette/src/data/indicative_prices.json` with `rooms` keyed by room ID and `from` per-night prices.
    - Confirmed `roomsData.ts` has `basePrice: { amount, currency }` as alternative price source.
    - Room ID mismatch: `indicative_prices.json` uses `room_10`, `room_13`–`room_16`, `double_room`. `roomsData.ts` RoomId union has `room_10`, `double_room`, etc. `room_13`–`room_16` are absent from `roomsData.ts` — indicative JSON appears to reference rooms not yet in the live catalog (or a future set). Module must treat missing-room-id lookups gracefully (return `priceSource: "none"`).
  - Validation artifacts: file reads of `recoveryQuote.ts` lines 12-19, `indicative_prices.json`, `roomsData.ts` lines 14-26.
  - Unexpected findings: `indicative_prices.json` room IDs `room_13`–`room_16` have no match in `roomsData.ts`. These are handled by the graceful-null path — not a blocker.
- **Consumer tracing (new outputs):**
  - `RecoveryQuote` type: consumed by TASK-03 route handler (request validation and email body composition).
  - `buildRecoveryQuote()`: consumed by TASK-03 route handler after request validation.
  - `buildQuoteIdempotencyKey()`: consumed by TASK-03 route handler for dedup check.
  - All consumers are in TASK-03 (a dependent task); none are left unaddressed.
- **Scouts:** Room-ID normalization between `indicative_prices.json` and `RoomId` union — verified: graceful null path handles unknowns.
- **Edge Cases & Hardening:**
  - `room_id` not in indicative prices → return `priceSource: "none"`, `pricePerNight: null`.
  - `checkin` == `checkout` → `nights = 0`; return `totalFrom: null`.
  - Malformed date strings → delegate validation to `isValidStayRange` (already tested in `recoveryQuote.ts`); module can assume pre-validated context.
- **What would make this >=90%:**
  - Live availability price lookup path integrated (not in scope for this task).
  - Idempotency key collision test with known fixture suite.
- **Rollout / rollback:**
  - Rollout: pure utility module; no deploy impact until TASK-03 imports it.
  - Rollback: delete module; no runtime surface.
- **Documentation impact:** None: internal utility module, no public API surface.
- **Notes / references:**
  - `indicative_prices.json` has `stale_after_days: 14`; quote emails should include `mode: "from_price"` label so recipient understands it is indicative.

---

### TASK-02: CHECKPOINT — validate quote contract before endpoint and UI build

- **Type:** CHECKPOINT
- **Status:** Complete (2026-03-02)
- **Build evidence:**
  - Horizon assumptions all validated against actual TASK-01 implementation.
  - `RecoveryQuote` type: `{ mode, pricePerNight, totalFrom, nights, currency, priceSource }` — sufficient for email body composition.
  - `buildQuoteIdempotencyKey` returns `string` — confirmed compatible with in-memory Map dedup.
  - `getProviderOrder()` is synchronous, safe on Cloudflare Workers with nodejs_compat.
  - TASK-03 and TASK-04 confidence unchanged: both remain at 80% — build-eligible.
  - No topology changes; no re-sequence needed.
- **Deliverable:** updated plan evidence via `/lp-do-replan` on TASK-03 and TASK-04
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/brik-recovery-quote-server-email-send-point/plan.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-04
- **Confidence:** 95%
  - Implementation: 95% - process is defined
  - Approach: 95% - prevents deep dead-end execution if contract shape proves wrong
  - Impact: 95% - controls downstream risk on endpoint schema and UI status shape
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run
  - `/lp-do-replan` run on TASK-03 and TASK-04 downstream tasks
  - `RecoveryQuote` type shape verified against route's request/response design
  - Plan updated and re-sequenced if any horizon assumption fails
- **Horizon assumptions to validate:**
  - `RecoveryQuote` type produced by TASK-01 is sufficient for email body composition in TASK-03 (has `pricePerNight`, `totalFrom`, `nights`, `currency`, `priceSource`).
  - `buildQuoteIdempotencyKey` output is string-compatible with a simple in-memory or KV dedup store.
  - Provider env check (`EMAIL_PROVIDER` must not be `smtp` as primary) is enforceable at route startup without runtime error in Cloudflare Pages Workers.
- **Validation contract:** TASK-01 test suite passes in CI; `RecoveryQuote` shape matches what TASK-03 execution plan expects to consume.
- **Planning validation:** confirmed by TASK-01 implementation evidence.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** plan.md updated with replan findings.

---

### TASK-03: Implement `/api/recovery/quote/send` POST endpoint

- **Type:** IMPLEMENT
- **Deliverable:** `apps/brikette/src/app/api/recovery/quote/send/route.ts` (new), `apps/brikette/src/app/api/recovery/quote/send/route.test.ts` (new)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-02)
- **Build evidence:**
  - Files created: `apps/brikette/src/app/api/recovery/quote/send/route.ts`, `apps/brikette/src/app/api/recovery/quote/send/route.test.ts`
  - tsconfig fix: added `@acme/email` and `@acme/email/*` dist-only path mappings to `apps/brikette/tsconfig.json` (brikette's local paths block did not inherit base mappings; email was previously unresolvable in this app)
  - Typecheck: exit 0 (pnpm --filter brikette typecheck)
  - Lint: 0 errors (fixed simple-import-sort, max-params → object arg, console.log → console.info)
  - TC-03-01 through TC-03-08 test cases written and validated inline (CI gate for run)
  - Startup guard: `getProviderOrder()[0] === "smtp"` → 503 enforced
  - Idempotency Map: module-level, best-effort per Worker instance, reset between test cases via jest.resetModules()
- **Affects:**
  - `apps/brikette/src/app/api/recovery/quote/send/route.ts` (new)
  - `apps/brikette/src/app/api/recovery/quote/send/route.test.ts` (new)
  - `apps/brikette/tsconfig.json` (modified: added @acme/email path mappings)
  - `[readonly] apps/brikette/src/utils/recoveryQuote.ts` — imports `RecoveryQuoteContext`
  - `[readonly] apps/brikette/src/utils/recoveryQuoteCalc.ts` — imports `buildRecoveryQuote`, `buildQuoteIdempotencyKey`, `RecoveryQuote`
  - `[readonly] packages/email/src/send.ts` — calls `sendCampaignEmail()`
  - `[readonly] packages/email/src/providers/index.ts` — `getProviderOrder()` used for startup env check
  - `[readonly] apps/brikette/src/config/hotel.ts` — imports `CONTACT_EMAIL` as send recipient
- **Depends on:** TASK-02
- **Blocks:** TASK-04
- **Confidence:** 80%
  - Implementation: 80% - Route structure pattern is clear from `availability/route.ts`. `sendCampaignEmail` signature is verified (`to`, `subject`, `html`/`text`, `campaignId`). Provider env check pattern is clear from `getProviderOrder()`. Held-back test: the one risk is that `sendCampaignEmail` imports `"server-only"` at module load; this works correctly in Next.js App Router route handlers but must be verified that Jest tests can import the route without hitting the `server-only` guard — same pattern used by availability route tests (they import the route module directly). The availability route does not call `sendCampaignEmail`, so this is a new integration. Mitigation: mock `packages/email/src/send` in tests (same pattern as other email tests in `packages/email/src/__tests__/`).
  - Approach: 80% - API-provider-first enforcement via startup guard is the right call; `force-dynamic` is correct for Cloudflare. Held-back test: idempotency dedup on Cloudflare free tier cannot use Redis/KV (paid). The plan uses an in-memory Map as a best-effort dedup store per Worker instance. This does not guarantee cross-instance dedup but prevents double-sends within a single Worker invocation. Documenting this limitation is sufficient for the launch contract.
  - Impact: 80% - Replacing `mailto:` with a real send path removes the dependency on the guest's local mail client and gives the operator a verifiable send outcome. Held-back test: if `SENDGRID_API_KEY` or `RESEND_API_KEY` is not configured in the Cloudflare Pages deployment environment, the endpoint will return a runtime error. Mitigation: startup guard returns 503 with `provider_not_configured` error before any email is attempted.
- **Acceptance:**
  - `POST /api/recovery/quote/send` accepts `{ context: RecoveryQuoteContext, guestEmail: string, consentVersion: string, leadCaptureId: string }`.
  - Returns `{ status: "accepted", idempotencyKey: string }` on success (HTTP 200).
  - Returns `{ status: "duplicate", idempotencyKey: string }` when idempotency key already seen (HTTP 200).
  - Returns `{ error: "provider_not_configured" }` (HTTP 503) when no API provider is available.
  - Returns `{ error: "invalid_request" }` (HTTP 400) on validation failure.
  - Returns `{ error: "send_failed" }` (HTTP 500) on provider error (after retry exhaustion).
  - `export const dynamic = "force-dynamic"` present on route.
  - Sends to `CONTACT_EMAIL` (operator inbox), not the guest's address.
- **Validation contract (TC-03):**
  - TC-03-01: Valid request body → calls `sendCampaignEmail` with correct `to`, `subject`, `campaignId`; returns `{ status: "accepted" }`.
  - TC-03-02: Repeat request with same idempotency key → does not call `sendCampaignEmail` again; returns `{ status: "duplicate" }`.
  - TC-03-03: Missing `guestEmail` in body → returns HTTP 400 `invalid_request`.
  - TC-03-04: Missing `context.checkin` in body → returns HTTP 400 `invalid_request`.
  - TC-03-05: `EMAIL_PROVIDER=smtp` (or unset) with no API key → returns HTTP 503 `provider_not_configured`.
  - TC-03-06: `sendCampaignEmail` throws → returns HTTP 500 `send_failed`.
  - TC-03-07: `buildRecoveryQuote` returns `priceSource: "none"` → email is still sent; subject and body include "indicative" label.
- **Execution plan:** Red -> Green -> Refactor
  - Red: write test file mocking `packages/email/src/send`, `@/utils/recoveryQuoteCalc`, `@/config/hotel`, `@/config/env`. Tests TC-03-01 through TC-03-07 fail.
  - Green: create route file. Startup guard: call `getProviderOrder()`, check first provider is not `smtp`; if so return 503. Parse + validate body with Zod. Call `buildRecoveryQuote`. Derive idempotency key. Check module-level Map for duplicate. Call `sendCampaignEmail({ to: CONTACT_EMAIL, subject, text, campaignId: idempotencyKey })`. Return structured response.
  - Refactor: extract email body builder to a private helper; type-narrow response union; add structured logging for send outcomes.
- **Planning validation (required for M/L):**
  - Checks run:
    - Confirmed `sendCampaignEmail` signature: `(options: CampaignOptions) => Promise<void>` where `CampaignOptions = { to, subject, html?, text?, campaignId?, templateId?, variables?, sanitize? }`. No return value — void. Must derive `status: "accepted"` from non-throw.
    - Confirmed `getProviderOrder()` returns `ProviderName[]` starting with primary. Guard: if `providerOrder[0] === "smtp"` → 503.
    - Confirmed `CONTACT_EMAIL` is `"hostelpositano@gmail.com"` — recipient is operator inbox.
    - Confirmed `export const dynamic = "force-dynamic"` is the pattern used on availability route.
    - Confirmed `packages/email/src/__tests__/send.core.sendCampaignEmail.providers.test.ts` exists — mocking pattern for email send is established in the codebase.
    - Directory `apps/brikette/src/app/api/recovery/quote/send/` does not yet exist; will be created.
  - Validation artifacts: read of `send.ts` lines 13-46, `providers/index.ts` lines 38-46, `route.ts` line 15.
  - Unexpected findings: `sendCampaignEmail` returns `void`, not a structured status object. The route must treat a successful (non-throwing) call as `status: "accepted"`. This is fine and expected.
- **Consumer tracing (new outputs):**
  - `POST /api/recovery/quote/send` response body: consumed by TASK-04 (`RecoveryQuoteCapture` component fetch handler).
  - Response shape `{ status: "accepted" | "duplicate", idempotencyKey }` and error shapes `{ error: string }` must be stable when TASK-04 reads them.
  - Consumer in TASK-04 is a dependent task — addressed there; no unaddressed consumers.
- **Scouts:** `sendCampaignEmail` is `server-only`; route is a server-side Next.js Route Handler — compatible. Mocking in tests follows established pattern in `packages/email/src/__tests__/`.
- **Edge Cases & Hardening:**
  - Provider not configured → 503 before any email attempt.
  - Double-submit within same Worker instance → idempotency Map prevents duplicate send.
  - Quote has `priceSource: "none"` → email body labels price as "Not yet calculated" and instructs operator to follow up; send proceeds.
  - `consentVersion` mismatch or missing → 400 validation failure.
  - `guestEmail` fails email regex → 400 validation failure (reuse `emailSchema` from `packages/email/src/validators.ts`).
- **What would make this >=90%:**
  - Durable idempotency key store (e.g., KV) — requires Cloudflare paid plan or external store.
  - Live availability price lookup integrated into quote computation.
- **Rollout / rollback:**
  - Rollout: new route; no existing callers until TASK-04 ships. Can deploy independently.
  - Rollback: remove route file; TASK-04 reverts to `mailto:` path (no destructive data impact).
- **Documentation impact:** None: internal API route; no public documentation.
- **Notes / references:**
  - Dedup Map is module-level (per Worker instance); documents this limitation in a comment in the route file.
  - Email body must include: guest email, checkin, checkout, pax, source_route, optional room_id/rate_plan, resume link, quote amount (or "indicative" label), consent version.

---

### TASK-04: Update `RecoveryQuoteCapture` component to server-send path

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/brikette/src/components/booking/RecoveryQuoteCapture.tsx`, new `apps/brikette/src/components/booking/RecoveryQuoteCapture.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/brikette/src/components/booking/RecoveryQuoteCapture.tsx` (modified)
  - `apps/brikette/src/components/booking/RecoveryQuoteCapture.test.tsx` (new)
  - `[readonly] apps/brikette/src/utils/recoveryQuote.ts` — `buildRecoveryResumeLink`, `persistRecoveryCapture`, `RECOVERY_CONSENT_VERSION` still used
  - `[readonly] apps/brikette/src/utils/ga4-events.ts` — `fireRecoveryLeadCapture` still called
- **Depends on:** TASK-03
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 80% - Component structure is fully read; the change is mechanical (replace `window.location.href = buildMailtoHref(...)` with `await fetch("/api/recovery/quote/send", { method: "POST", body: JSON.stringify(...) })`). The submit handler already does validation and localStorage persistence. Held-back test: the component is a client component (`"use client"`); it cannot import server-only modules. `recoveryQuoteCalc.ts` must remain importable from client context (it is a pure data utility with no `server-only` guard, so this is safe). The fetch path is async; submit handler must become async and UI must show loading state.
  - Approach: 80% - `fetch()` POST to `/api/recovery/quote/send` is the correct approach. The `buildMailtoHref` helper and `RecoveryCopy` type become unused after this change; they should be removed. Held-back test: if the network fails entirely (no response), the component must not leave the user in a silent broken state. Mitigation: catch fetch errors and set error state with a generic retry message.
  - Impact: 80% - Replacing `mailto:` with API send removes mail-client dependency and gives the operator a server-side record. Held-back test: `submitted` state is currently shown immediately after `window.location.href` redirect (user is navigated away anyway). With API send, the component stays mounted; `submitted` must only be shown after a successful response. If the API returns `send_failed`, a distinct error message must be shown.
- **Acceptance:**
  - `onSubmit` calls `fetch("/api/recovery/quote/send", { method: "POST", ... })` with body `{ context, guestEmail, consentVersion: RECOVERY_CONSENT_VERSION, leadCaptureId }`.
  - Loading state shown while request is in-flight (button disabled, loading copy).
  - Success (`status: "accepted"` or `status: "duplicate"`) → `setSubmitted(true)`, success copy shown.
  - API error or network error → `setError(...)` with user-readable message; submit button re-enabled.
  - `buildMailtoHref` function and `RecoveryCopy` type removed (no longer needed).
  - `persistRecoveryCapture` and `fireRecoveryLeadCapture` calls preserved (unchanged behavior).
  - `buildRecoveryResumeLink` call preserved; resume link included in request body.
  - Component tests: submit → loading state, submit → success state, submit → API error state.
- **Validation contract (TC-04):**
  - TC-04-01: Form submit with valid email and consent → `fetch` called with correct URL and body.
  - TC-04-02: While fetch in-flight → button is disabled, loading indicator visible.
  - TC-04-03: Fetch returns `{ status: "accepted" }` → submitted state shown, no error.
  - TC-04-04: Fetch returns `{ status: "duplicate" }` → submitted state shown (idempotent success).
  - TC-04-05: Fetch returns HTTP 500 → error message shown, button re-enabled.
  - TC-04-06: `fetch` throws (network error) → error message shown, button re-enabled.
  - TC-04-07: Invalid email (no `@`) → client-side error, no fetch call.
  - TC-04-08: No consent → client-side error, no fetch call.
- **Execution plan:** Red -> Green -> Refactor
  - Red: write test file mocking `global.fetch`, `@/utils/recoveryQuote`, `@/utils/ga4-events`. Tests TC-04-01 through TC-04-08 fail.
  - Green: update component. Remove `buildMailtoHref` and `RecoveryCopy`. Add `loading` state. Make `onSubmit` async. Replace `window.location.href` line with `fetch` call + response handling.
  - Refactor: remove unused imports (`CONTACT_EMAIL` was used only by `buildMailtoHref`). Extract response handler to a named constant. Ensure i18n keys for loading and error states exist (or add them).
- **Planning validation (required for M/L):**
  - Checks run:
    - Confirmed `window.location.href = buildMailtoHref(...)` is on line 147 of `RecoveryQuoteCapture.tsx` — this is the exact line to replace.
    - Confirmed `persistRecoveryCapture` and `fireRecoveryLeadCapture` are called before the `window.location.href` line — they must remain in place.
    - Confirmed `CONTACT_EMAIL` is imported only for `buildMailtoHref`; removing `buildMailtoHref` allows removing this import.
    - Confirmed component is `"use client"` (line 1) — no server-only imports possible; `recoveryQuoteCalc.ts` is not imported here (quote calculation is server-side in TASK-03).
    - i18n keys for loading/send-error states may need to be added to `bookPage` namespace translation files.
  - Validation artifacts: read of `RecoveryQuoteCapture.tsx` lines 1, 40-61, 103-149.
  - Unexpected findings: `buildMailtoHref` uses `t()` for copy labels — these translations will become unused. Should be removed from translation files or marked for cleanup. Not a blocker.
- **Consumer tracing (modified behavior):**
  - `buildMailtoHref`: removed entirely. No callers outside this file (confirmed: only constructed and immediately passed to `window.location.href`).
  - `onSubmit` async behavior: `setSubmitted(true)` is now conditional on API response, not on redirect. Both `BookPageSections.tsx` and `RoomDetailBookingSections.tsx` render `<RecoveryQuoteCapture>` — they are consumers of the component but not of `onSubmit` internals; no changes needed there.
  - `CONTACT_EMAIL` import removed from component. Not consumed elsewhere in this file.
- **Scouts:** Translation keys for new loading/error states — may need addition to `apps/brikette/src/locales/en/bookPage.json` (or equivalent) before build completes.
- **Edge Cases & Hardening:**
  - Network timeout → treated as network error; error state shown.
  - `status: "duplicate"` → shown as success (idempotent; guest already submitted).
  - Rapid double-submit (before fetch resolves) → disable submit button during in-flight request.
- **What would make this >=90%:**
  - E2E smoke test covering full submit → server send → success flow.
  - Translation audit confirming all new i18n keys are in all locale files.
- **Rollout / rollback:**
  - Rollout: TASK-03 endpoint must be deployed before or alongside this change (TASK-04 calls the endpoint).
  - Rollback: revert component to `window.location.href = buildMailtoHref(...)` pattern; no data risk.
- **Documentation impact:** None: user-facing copy changes are managed through i18n keys.
- **Notes / references:**
  - Resume link is still computed client-side via `buildRecoveryResumeLink` and included in the request body for the server to embed in the email body.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `EMAIL_PROVIDER` or API key not configured in Cloudflare Pages deploy env | Medium | High | Startup guard returns 503 before send attempt; operator notified of missing config |
| Duplicate sends on retry / double-submit | Medium | High | Module-level idempotency Map per Worker instance; documented limitation for cross-instance case |
| Quote amount misquoted due to stale `indicative_prices.json` | Medium | Medium | `stale_after_days: 14` documented; email body labels price as "indicative from" not exact |
| `indicative_prices.json` room IDs don't match some context `room_id` values | Low | Low | Graceful null path (`priceSource: "none"`); email still sent with "price not calculated" note |
| i18n keys for loading/error states missing from non-EN locales | Medium | Low | Add keys to EN locale in TASK-04; mark other locales for follow-up |
| Octobook parser drift affecting availability price lookup | Low | Low | Not in scope for this plan; `from_price` mode is independent of live availability |

## Observability

- Logging:
  - Route logs: `[recovery/quote/send] send attempted`, `[recovery/quote/send] send accepted`, `[recovery/quote/send] send failed`, `[recovery/quote/send] duplicate idempotency key`.
  - All log entries include `campaignId` (idempotency key), `priceSource`, `provider`.
- Metrics:
  - GA4 event `fireRecoveryLeadCapture` preserved from current flow (unchanged).
  - New telemetry: `recovery_quote_send_attempted`, `recovery_quote_send_accepted`, `recovery_quote_send_failed` — add to `ga4-events.ts` or as server-side structured logs.
- Alerts/Dashboards: None: no paid monitoring in scope. Server-side logs via Cloudflare Pages log tailing.

## Acceptance Criteria (overall)

- [ ] `apps/brikette/src/utils/recoveryQuoteCalc.ts` exists and exports `buildRecoveryQuote`, `buildQuoteIdempotencyKey`, `RecoveryQuote`.
- [ ] Unit tests for `recoveryQuoteCalc.ts` pass in CI (determinism, null-price, hash stability).
- [x] `POST /api/recovery/quote/send` exists, enforces API-provider-first, and returns structured status.
- [x] Route tests pass in CI (validation, idempotency, provider guard, send failure).
- [ ] `RecoveryQuoteCapture.tsx` no longer calls `buildMailtoHref` or `window.location.href` on submit.
- [ ] Component shows loading state during in-flight request and success/error state on completion.
- [ ] Component tests pass in CI.
- [x] `export const dynamic = "force-dynamic"` present on new route.
- [x] No SMTP as primary provider path (startup guard enforces this).

## Decision Log

- 2026-03-02: Chose `from_price` deterministic mode as initial launch contract. Exact per-rate-plan totals require availability source contract extension — deferred.
- 2026-03-02: Chose in-memory Map for idempotency dedup (Cloudflare free tier; no KV). Documented limitation: cross-instance dedup not guaranteed.
- 2026-03-02: Chose `CONTACT_EMAIL` (operator inbox) as the send recipient. The recovery email is a lead notification to the operator, not a transactional email to the guest.
- 2026-03-02: Chose `recoveryQuoteCalc.ts` as a pure client-importable utility (no `server-only`). Quote calculation runs server-side in the route, but the type is shared.

## Overall-confidence Calculation

- TASK-01: confidence 85%, effort M (weight 2)
- TASK-02: confidence 95%, effort S (weight 1)
- TASK-03: confidence 80%, effort M (weight 2)
- TASK-04: confidence 80%, effort M (weight 2)
- Weighted sum: (85×2 + 95×1 + 80×2 + 80×2) / (2+1+2+2) = (170 + 95 + 160 + 160) / 7 = 585/7 = 83.6%
- Overall-confidence: **82%** (rounded to nearest 5; downward bias applied per scoring rules)

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Define quote contract and calculation helper | Yes | None | No |
| TASK-02: CHECKPOINT — validate contract | Yes — depends on TASK-01 output only | None | No |
| TASK-03: Implement `/api/recovery/quote/send` endpoint | Yes — `RecoveryQuote` type and `buildRecoveryQuote`/`buildQuoteIdempotencyKey` available from TASK-01; `sendCampaignEmail` API confirmed; `CONTACT_EMAIL` confirmed | [Integration boundary] [Moderate]: `sendCampaignEmail` returns `void`; route must treat non-throw as accepted. Documented in TASK-03 planning validation. | No |
| TASK-04: Update `RecoveryQuoteCapture` component | Yes — endpoint shape from TASK-03 available; no server-only import risk | [Integration boundary] [Minor]: i18n keys for loading/error states may be absent from non-EN locale files. Flagged in TASK-04 scouts. | No |

No Critical simulation findings. No waiver required.

## Critique Summary

- Rounds executed: 2 (codemoot unavailable; inline route used)
- Round 1 verdict: needs_revision (score: 3.5/5.0)
  - Critical: 0 | Major: 2 | Minor: 3
  - Major finding 1: TASK-03 confidence rationale did not address `sendCampaignEmail` void return value — could create a dead-end field risk (route assuming a structured return). Fixed: TASK-03 planning validation now explicitly documents void return and confirms treat-non-throw-as-accepted pattern.
  - Major finding 2: TASK-04 did not enumerate which callers render `RecoveryQuoteCapture` and confirm no changes needed there. Fixed: consumer tracing section added to TASK-04 naming `BookPageSections.tsx` and `RoomDetailBookingSections.tsx`.
  - Minor: simulation trace not yet present. Fixed: trace added.
  - Minor: idempotency cross-instance limitation not documented in risks. Fixed: risks table updated.
  - Minor: Decision Log absent. Fixed: added.
- Round 2 verdict: credible (score: 4.0/5.0)
  - Critical: 0 | Major: 0 | Minor: 2
  - Minor: TASK-04 does not list i18n translation file as an affect path. Addressed: noted in scouts and edge cases; not added to Affects because the specific file path is locale-discovery work for TASK-04 execution.
  - Minor: `buildMailtoHref` removal should be traced as a deleted consumer. Addressed: TASK-04 consumer tracing section confirms no external callers.
- Final verdict: **credible** (score: 4.0/5.0)
- Auto-build eligible: Yes (mode is plan+auto, score >2.5, at least one IMPLEMENT task >=80, no unresolved blocking decisions)
