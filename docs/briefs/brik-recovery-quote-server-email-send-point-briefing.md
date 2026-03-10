---
Type: Briefing
Outcome: Understanding
Status: Active
Domain: SELL
Created: 2026-03-02
Last-updated: 2026-03-02
Topic-Slug: brik-recovery-quote-server-email-send-point
Dispatch-ID: IDEA-DISPATCH-20260302094245-0117
---

# BRIK Recovery Quote Server Email Send Point Briefing

## Executive Summary
The current "Email me this quote" flow is not a server-send flow. It validates email + consent client-side, stores recovery metadata in browser localStorage, fires GA4, and opens a `mailto:` draft to hostel inbox (`hostelpositano@gmail.com`). There is no Brikette API endpoint that sends quote emails to guests today. Live price data exists via `/api/availability`, but that endpoint currently returns room-level availability + `priceFrom` and rate-plan labels only; it does not return a quote object for a selected room/rate combination. Before any send endpoint is built, a deterministic quote data contract (required fields + required calculations) must be implemented first. A future server-send implementation must then clear explicit inbox-delivery gates (endpoint existence, pricing contract, sender config, idempotency, and deliverability tracking) to satisfy the expected outcome: guest sees an email in inbox.

## Questions Answered
- Q1: Where is the current email send point for recovery quotes?
- Q2: Does Brikette currently have a server endpoint that can send quote emails?
- Q3: What pricing source exists today for quote content?
- Q4: What sender identity/provider path would a server send use in this repo?
- Q5: What are the key failure modes and coverage gaps for this area?
- Q6: If a server-send quote flow is built, what issues can still prevent inbox delivery?
- Q7: What data and calculations must exist first to make quote output deterministic?

## Hard Constraint
- Any implemented solution for recovery quote emailing must be fully compatible with Cloudflare free tier and must not rely on paid-only Cloudflare features/services.

## High-Level Architecture
- Components:
  - `apps/brikette/src/components/booking/RecoveryQuoteCapture.tsx` - Recovery quote UI submit handler; builds `mailto:` and navigates browser there.
  - `apps/brikette/src/utils/recoveryQuote.ts` - Resume-link construction (7-day TTL), recovery payload schema, localStorage persistence.
  - `apps/brikette/src/components/booking/BookPageSections.tsx` - Book-page recovery wrapper; passes dates+pax+source route only.
  - `apps/brikette/src/components/rooms/detail/RoomDetailBookingSections.tsx` - Room-detail recovery wrapper; passes room SKU and fixed `rate_plan: "nr"`.
  - `apps/brikette/src/app/api/availability/route.ts` - Server proxy to Octobook HTML; parses room availability and `priceFrom`.
  - `packages/email/src/send.ts` and `packages/email/src/sendEmail.ts` - Shared server email send utilities.
- Data stores / external services:
  - Browser localStorage key `brikette.recovery_capture.v1`.
  - Octobook HTML endpoint (Octorate) queried by `/api/availability`.
  - Email providers selected by `EMAIL_PROVIDER` (sendgrid/resend/smtp/noop) in shared config.

## End-to-End Flow
### Primary flow (current)
1. User submits recovery form with email + consent in `RecoveryQuoteCapture`.
2. Handler validates basic email shape and consent checkbox client-side.
3. Handler builds resume URL with `checkin/checkout/pax` and recovery params (`rq_exp_ms`, `rq_src`, optional `rq_room`, `rq_rate`) with 7-day expiry.
4. Handler writes capture payload (including consent metadata and retention expiry) into localStorage.
5. Handler fires GA4 recovery capture event.
6. Handler sets `window.location.href` to `mailto:<CONTACT_EMAIL>` with body lines containing selected context and resume link.

Evidence:
- `apps/brikette/src/components/booking/RecoveryQuoteCapture.tsx:40`
- `apps/brikette/src/components/booking/RecoveryQuoteCapture.tsx:103`
- `apps/brikette/src/components/booking/RecoveryQuoteCapture.tsx:122`
- `apps/brikette/src/components/booking/RecoveryQuoteCapture.tsx:138`
- `apps/brikette/src/components/booking/RecoveryQuoteCapture.tsx:147`
- `apps/brikette/src/utils/recoveryQuote.ts:43`
- `apps/brikette/src/utils/recoveryQuote.ts:110`
- `apps/brikette/src/config/hotel.ts:7`

### Alternate / edge flows
- Recovery section is hidden unless search state is valid (`isValidSearch`).
- Expired resume query auto-clears booking search and rewrites URL with `rebuild_quote=1`.
- Book-page recovery context has no room/rate; room-page recovery adds room SKU and hardcoded `rate_plan: "nr"`.

Evidence:
- `apps/brikette/src/components/booking/RecoveryQuoteCapture.tsx:101`
- `apps/brikette/src/hooks/useRecoveryResumeFallback.ts:18`
- `apps/brikette/src/components/booking/BookPageSections.tsx:126`
- `apps/brikette/src/components/rooms/detail/RoomDetailBookingSections.tsx:127`

## Assumed Built Flow Review (Target: Guest Receives Email in Inbox)
Precondition: complete the deterministic quote contract prerequisite (next section) before implementing send endpoint and email dispatch.

1. Guest submits quote request form (`email`, consent, dates, pax, optional room/rate) to frontend.
   - Issue to guard: Client-side checks are insufficient on their own; server must re-validate all inputs.
2. Frontend sends POST to a server endpoint (for example, `/api/recovery/quote/send`) instead of `mailto`.
   - Issue to guard: This endpoint does not exist today; no endpoint means no inbox delivery path.
3. Server computes quote payload from live pricing source.
   - Issue to guard: Current availability contract returns room-level `priceFrom` and plan labels, not plan-specific final quote totals, so pricing can be wrong without an explicit mapping contract.
4. Server stamps resume/expiry metadata and builds email content payload.
   - Issue to guard: UTC/timezone handling must be consistent, or expiry links may appear expired early/late.
5. Server sends via configured provider (`sendgrid`/`resend`/`smtp`) with branded sender.
   - Issue to guard: Misconfigured env (`EMAIL_PROVIDER`, `EMAIL_FROM`, `CAMPAIGN_FROM`, `GMAIL_USER`) can fail sends or fall into simulated/no-op behavior depending on path.
6. Server stores send result and request key.
   - Issue to guard: Missing idempotency key allows duplicate emails on retries/double-click.
7. Provider accepts message and delivery proceeds to mailbox.
   - Issue to guard: Provider acceptance does not guarantee inbox placement; SPF/DKIM/DMARC and sender reputation can route to spam.
8. UI reports outcome to guest.
   - Issue to guard: Success state must not be shown before send acceptance/delivery evidence; premature success creates false positives.

Minimum acceptance gates for the target outcome ("guest sees email in inbox"):
- Deterministic quote contract prerequisite is implemented first (data fields + calculations + output schema).
- Real quote-send API endpoint implemented and reachable.
- Deterministic quote contract for room + pax + dates + plan.
- Sender/domain auth valid (SPF, DKIM, DMARC) for chosen sender.
- Delivery telemetry tracked beyond API acceptance.
- Idempotent send behavior prevents duplicate messages.
- Runtime and integration design remain Cloudflare free-tier compatible (no paid-only platform dependencies).

## Deterministic Quote Contract Prerequisite (Must Be Completed First)
Goal: establish the exact data and formula contract used to generate quote payloads so the same request always produces the same quote output.

Required input data (request and lookup):
- Request fields: `checkin`, `checkout`, `pax`, `email`, `consent_granted`, `source_route`, optional `room_id`, optional `rate_plan`.
- Consent metadata: `consent_version`, `consent_granted_at` (server timestamp), quote expiry intent.
- Room mapping source: room identity + Octorate mapping from `roomsData` (`widgetRoomCode`, `rateCodes.direct.nr|flex`).
- Availability snapshot: `available`, `priceFrom`, `nights`, `ratePlans`, `fetchedAt`, `error` from `/api/availability`.
- Operational metadata: contract version and a deterministic idempotency key seed (`checkin|checkout|pax|room_id|rate_plan|email`).

Required calculations (deterministic):
1. `nights = checkout - checkin` in calendar days, must be `> 0`.
2. Validate `pax` and date range with the same guards used in booking URL build path.
3. Resolve room candidate:
   - If `room_id` provided: map to room config and corresponding Octorate room code.
   - If `room_id` absent: quote mode must be explicitly `search-scope` (no room-specific contract).
4. Resolve rate-plan candidate:
   - If `rate_plan` provided: normalize to `nr|flex`.
   - If absent: explicit default policy is required (must be documented; no implicit fallback).
5. Availability derivation:
   - Require matching availability row for room-scoped quotes.
   - Reject when upstream `error` exists or matching row is sold out.
6. Price derivation (current feasible deterministic baseline):
   - `nightly_from = priceFrom`
   - `stay_total_from = round(nightly_from * nights, 2)`
   - `currency = EUR` (until source adds explicit currency field)
7. Contract fingerprint:
   - `quote_hash = sha256(contract_version + canonical_payload_json)` for audit and idempotency.

Deterministic output contract (minimum payload shape):
- `contract_version`
- `generated_at`
- `quote_expires_at`
- `checkin`, `checkout`, `nights`, `pax`
- `room_id` (nullable), `rate_plan` (nullable)
- `pricing_mode` (`from_price` or `exact_plan_price`)
- `nightly_from`, `stay_total_from`, `currency`
- `availability_fetched_at`
- `quote_hash`

Current hard gap for "exact plan price" mode:
- Current availability parser exposes `priceFrom` + labels only, not plan-specific final totals, so `exact_plan_price` cannot be deterministic yet.
- Until upstream/source data is expanded, only a clearly labeled `from_price` deterministic contract is feasible.

Evidence:
- `apps/brikette/src/app/api/availability/route.ts:86`
- `apps/brikette/src/app/api/availability/route.ts:95`
- `apps/brikette/src/app/api/availability/route.ts:110`
- `apps/brikette/src/app/api/availability/route.ts:138`
- `apps/brikette/src/types/octorate-availability.ts:1`
- `apps/brikette/src/data/roomsData.ts:27`
- `apps/brikette/src/data/roomsData.ts:62`
- `apps/brikette/src/utils/buildOctorateUrl.ts:11`
- `apps/brikette/src/utils/buildOctorateUrl.ts:70`

## Data & Contracts
- Key types/schemas:
  - Recovery context excludes any explicit price fields; it only carries dates, pax, source route, optional room/rate.
  - Availability payload exposes `priceFrom` (number or null), `nights`, and rate plan labels, but not plan-specific quote totals.

Evidence:
- `apps/brikette/src/utils/recoveryQuote.ts:12`
- `apps/brikette/src/types/octorate-availability.ts:1`
- `apps/brikette/src/app/api/availability/route.ts:86`
- `apps/brikette/src/app/api/availability/route.ts:95`

Source-of-truth notes:
- There is currently no quote-email API contract in Brikette route handlers; API surface under `src/app/api` is only availability route.
- Recovery mail target is static contact email in hotel config, not dynamic sender config.

Evidence:
- `apps/brikette/src/app/api/availability/route.ts:138`
- `apps/brikette/src/components/booking/RecoveryQuoteCapture.tsx:60`

## Configuration, Flags, and Operational Controls
- Availability source is feature-flagged by `OCTORATE_LIVE_AVAILABILITY`; when off, route and hook return empty rooms.
- Shared email provider config supports `sendgrid|resend|smtp|noop`; non-noop requires `EMAIL_FROM` in env schema.
- Runtime sender helper (`getDefaultSender`) resolves sender from `CAMPAIGN_FROM` or `GMAIL_USER`.
- Cloudflare free-tier operationalization note: Brikette is OpenNext/Cloudflare-targeted; for this flow, default implementation should prefer API-based providers (`sendgrid` or `resend`) and avoid depending on SMTP/Nodemailer fallback as primary path.

Evidence:
- `apps/brikette/src/app/api/availability/route.ts:142`
- `apps/brikette/src/hooks/useAvailability.ts:52`
- `packages/config/src/env/email.ts:88`
- `packages/config/src/env/email.ts:99`
- `packages/email/src/config.ts:7`
- `apps/brikette/open-next.config.ts:1`
- `apps/brikette/wrangler.toml:2`
- `packages/email/src/providers/index.ts:5`
- `packages/email/src/providers/index.ts:38`
- `packages/email/src/send.ts:38`
- `packages/email/src/send.ts:76`
- `packages/email/src/send.ts:139`

## Error Handling and Failure Modes
- Recovery submit fails fast only for invalid email or missing consent; no server retry path exists because no server send exists.
- localStorage write failures are swallowed (no user-visible failure branch).
- Availability route returns `upstream_error` with empty rooms on Octobook non-200 or fetch failure.
- `sendEmail` helper simulates send (returns undefined) when Gmail creds are absent; this can mask missing sender plumbing if misused.
- In a built server-send flow, inbox-delivery risks remain even after provider acceptance (deliverability/authentication) and must be explicitly monitored.
- In a built server-send flow, missing idempotency and premature UI success messages are high-likelihood UX/ops regressions.

Evidence:
- `apps/brikette/src/components/booking/RecoveryQuoteCapture.tsx:107`
- `apps/brikette/src/utils/recoveryQuote.ts:122`
- `apps/brikette/src/app/api/availability/route.ts:190`
- `apps/brikette/src/app/api/availability/route.ts:205`
- `packages/email/src/sendEmail.ts:80`
- `packages/email/src/sendEmail.ts:95`

## Tests and Coverage
- Existing tests cover availability parsing and upstream failure handling in route tests.
- No direct tests found for `RecoveryQuoteCapture`, `recoveryQuote.ts`, or `useRecoveryResumeFallback` in `apps/brikette/src/test` / `apps/brikette/e2e`.

Evidence:
- `apps/brikette/src/app/api/availability/route.test.ts:1`
- Repo search: `rg -n "RecoveryQuoteCapture|recoveryQuote|useRecoveryResumeFallback|RECOVERY_RESUME_TTL_DAYS" apps/brikette/src/test apps/brikette/e2e -g *.ts*` (no matches)

## Unknowns / Follow-ups
- Unknown: Which sender identity should be used in production for quote emails (`EMAIL_FROM` branding vs Gmail mailbox)?
  - How to verify: inspect deployed env values for Brikette runtime (`EMAIL_PROVIDER`, `EMAIL_FROM`, `CAMPAIGN_FROM`, `GMAIL_USER`) and DMARC/SPF policy.
- Unknown: Product decision on contract mode launch target (`from_price` first vs block until `exact_plan_price` is available).
  - How to verify: operator decision record tied to the deterministic contract section above.
- Unknown: Whether recovery consent metadata must be persisted server-side for compliance/audit, instead of localStorage-only.
  - How to verify: review policy requirements against current client storage contract in `recoveryQuote.ts`.

## If You Later Want to Change This (Non-plan)
- Likely change points:
  - `apps/brikette/src/components/booking/RecoveryQuoteCapture.tsx` (replace `mailto` redirect with API POST trigger).
  - `apps/brikette/src/app/api` (add dedicated quote-email endpoint + payload validation).
  - `packages/email/src/send.ts` (use provider-backed send path for outbound quote).
  - `apps/brikette/src/app/api/availability/route.ts` or upstream quote builder (derive final quote fields from current data source).
- Key risks:
  - Misquoted price if mapping from room/rate context to plan-specific amount is underspecified.
  - Sender misconfiguration causing simulated/no-op sends instead of real delivery.
  - Compliance gap if consent evidence remains client-only after moving to server dispatch.
