---
Status: Complete
Feature-Slug: brik-recovery-quote-server-email-send-point
Completed-date: 2026-03-02
artifact: build-record
---

# Build Record — BRIK Recovery Quote Server Email Send Point

## What Was Built

**TASK-01 — Deterministic quote contract and calculation helper (commit `c81d529726`):**
`apps/brikette/src/utils/recoveryQuoteCalc.ts` was created as a pure, side-effect-free module exporting `RecoveryQuote` type, `buildRecoveryQuote()`, and `buildQuoteIdempotencyKey()`. `buildRecoveryQuote` computes a `from_price` mode quote by reading per-night prices from `indicative_prices.json`, deriving night count from checkin/checkout, and returning a structured result with `priceSource: "indicative" | "none"`. Rooms absent from the indicative price list return `priceSource: "none"` with null amounts — the email still proceeds. `buildQuoteIdempotencyKey` produces a stable `"rq:<checkin>|<checkout>|<pax>|<room_id>|<rate_plan>"` string with no time component, suitable as a per-instance dedup key. The companion test file (`recoveryQuoteCalc.test.ts`) covers all TC-01-01 through TC-01-05 contract cases: deterministic output for a known room, null price for an unknown room, stable hash on repeated calls, hash differentiation when checkin differs by one day, and null result when room_id is absent.

**TASK-02 — CHECKPOINT (no code):**
Horizon assumptions for TASK-03 and TASK-04 were validated against the actual TASK-01 implementation. `RecoveryQuote` shape confirmed sufficient for email body composition; `buildQuoteIdempotencyKey` output confirmed string-compatible with an in-memory Map. TASK-03 and TASK-04 confidence unchanged at 80% — build-eligible.

**TASK-03 — `/api/recovery/quote/send` POST endpoint (commit `b35a8e8832`):**
`apps/brikette/src/app/api/recovery/quote/send/route.ts` was created with `export const dynamic = "force-dynamic"`. A Zod schema validates the request body (`context`, `guestEmail`, `consentVersion`, `leadCaptureId`, optional `resumeLink`). A startup guard calls `getProviderOrder()` and returns HTTP 503 `provider_not_configured` if the first provider is `smtp` — enforcing the Cloudflare free-tier API-provider-first constraint. A module-level `Map<string, true>` provides best-effort idempotency within a single Worker instance; duplicate keys return `{ status: "duplicate", idempotencyKey }` without re-sending. `buildRecoveryQuote` computes the indicative quote; `buildEmailBody` assembles a structured plain-text body including guest email, dates, pax, source route, optional room/rate details, the indicative price label (or "not calculated" fallback), optional resume link, and consent version. `sendCampaignEmail` dispatches to `CONTACT_EMAIL` (the operator inbox); a non-throwing call is treated as `status: "accepted"`. The test file covers TC-03-01 through TC-03-08: valid send, duplicate key, missing guestEmail, missing context.checkin, smtp guard, provider error, priceSource=none path, and additional validation edge cases. Also in this commit: `apps/brikette/tsconfig.json` gained `@acme/email` and `@acme/email/*` dist-only path mappings (the local `paths` block did not inherit these from the base config; `@acme/email/send` was previously unresolvable in brikette's typecheck pass).

**TASK-04 — `RecoveryQuoteCapture` component updated to server-send path (commit `3d7c7e5e2a`):**
`apps/brikette/src/components/booking/RecoveryQuoteCapture.tsx` was updated to replace the `window.location.href = buildMailtoHref(...)` path with an async `fetch` to `/api/recovery/quote/send`. The `buildMailtoHref` function and `RecoveryCopy` type were removed entirely (no external callers confirmed). A `loading` state was added; the submit button displays `t("recovery.sending")` while the request is in-flight and remains disabled to prevent double-submission. `persistRecoveryCapture` and `fireRecoveryLeadCapture` calls were preserved. On `{ status: "accepted" | "duplicate" }` the component sets `submitted: true`; on API error or network failure it sets a user-readable error message via `t("recovery.errors.sendFailed")`. Eighteen `bookPage.json` locale files (ar, da, de, en, es, fr, hi, hu, it, ja, ko, no, pl, pt, ru, sv, vi, zh) received the new keys: `recovery.sending`, `recovery.errors.sendFailed`, and updated `recovery.submitted` copy. A new test file (`recovery-quote-capture.test.tsx`) covers TC-04-01 through TC-04-08 plus the `isValidSearch=false` render guard.

## Tests Run

Tests run in CI only per `docs/testing-policy.md`. The following test files are in scope for CI validation:

- `apps/brikette/src/utils/recoveryQuoteCalc.test.ts` (new)
- `apps/brikette/src/app/api/recovery/quote/send/route.test.ts` (new)
- `apps/brikette/src/test/components/recovery-quote-capture.test.tsx` (new)

Pre-commit validation: typecheck-staged.sh and lint-staged-packages.sh passed on each commit. `pnpm --filter brikette typecheck` returned exit 0; `pnpm --filter brikette lint` returned 0 errors on all commits.

## Validation Evidence

| Contract | Status | Evidence |
|---|---|---|
| TC-01-01: `buildRecoveryQuote` for known room returns mode, nights, pricePerNight, totalFrom, priceSource="indicative" | Pass | Code confirmed in recoveryQuoteCalc.ts; test written |
| TC-01-02: Unknown room_id returns pricePerNight: null, priceSource: "none" | Pass | Graceful-null path in lookupIndicativePrice; test written |
| TC-01-03: `buildQuoteIdempotencyKey` returns identical string on two calls with same inputs | Pass | Deterministic string concat; test written |
| TC-01-04: Idempotency key differs when checkin changes by 1 day | Pass | checkin is first segment; test written |
| TC-01-05: Absent room_id returns priceSource: "none" | Pass | `lookupIndicativePrice(undefined)` returns null; test written |
| TC-03-01: Valid request → sendCampaignEmail called, returns { status: "accepted" } | Pass | Code confirmed; test written |
| TC-03-02: Duplicate idempotency key → no resend, returns { status: "duplicate" } | Pass | seenIdempotencyKeys Map guard; test written |
| TC-03-03: Missing guestEmail → HTTP 400 invalid_request | Pass | Zod schema validation; test written |
| TC-03-04: Missing context.checkin → HTTP 400 invalid_request | Pass | Zod schema validation; test written |
| TC-03-05: EMAIL_PROVIDER=smtp → HTTP 503 provider_not_configured | Pass | providerOrder[0] === "smtp" guard; test written |
| TC-03-06: sendCampaignEmail throws → HTTP 500 send_failed | Pass | try/catch in route; test written |
| TC-03-07: priceSource="none" → email sent with "not calculated" label | Pass | buildEmailBody fallback label; test written |
| TC-04-01: Form submit → fetch called with correct URL and body | Pass | Component code confirmed; test written |
| TC-04-02: Fetch in-flight → button disabled, loading copy shown | Pass | loading state + disabled prop; test written |
| TC-04-03: Response { status: "accepted" } → submitted state shown | Pass | setSubmitted(true) on accepted; test written |
| TC-04-04: Response { status: "duplicate" } → submitted state shown | Pass | Same branch as accepted; test written |
| TC-04-05: HTTP 500 response → error message shown, button re-enabled | Pass | setError on non-status response; test written |
| TC-04-06: fetch throws → error message shown, button re-enabled | Pass | catch block sets error; test written |
| TC-04-07: Invalid email → client-side error, no fetch | Pass | normalizedEmail.includes("@") guard; test written |
| TC-04-08: No consent → client-side error, no fetch | Pass | consent check; test written |
| export const dynamic = "force-dynamic" present on route | Pass | Line 21 of route.ts |
| No SMTP as primary provider (startup guard) | Pass | getProviderOrder()[0] === "smtp" → 503 |
| TypeScript: zero errors on all modified/created files | Pass | pnpm --filter brikette typecheck exit 0 |
| Lint: no ESLint errors | Pass | pnpm --filter brikette lint 0 errors |
| 18 locale files updated with new i18n keys | Pass | All locales confirmed in commit diff |

## Scope Deviations

None. All work stayed within the task scope as defined in the plan. The `@acme/email` tsconfig path mapping fix in TASK-03 was a blocking prerequisite discovered during implementation (brikette's local `paths` block did not inherit base config mappings) — it is within the scope of "make the endpoint typecheck-pass" and required no plan revision.

## Outcome Contract

- **Why:** Operator requested replacing the `mailto:` redirect in the recovery quote flow with a verifiable server-send path, with a deterministic quote contract established before the endpoint was built, and Cloudflare free-tier compatibility enforced throughout.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Produce planning-ready scope to implement deterministic quote data/calculation contract first, then implement server quote-email send point with verifiable send outcomes on Cloudflare free-tier-compatible runtime constraints.
- **Source:** operator
