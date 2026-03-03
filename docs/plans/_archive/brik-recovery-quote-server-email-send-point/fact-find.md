---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: API
Workstream: Engineering
Created: 2026-03-02
Last-updated: 2026-03-02
Feature-Slug: brik-recovery-quote-server-email-send-point
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: create-api-endpoint, create-server-action
Related-Plan: docs/plans/brik-recovery-quote-server-email-send-point/plan.md
Trigger-Why: Operator requested progression from briefing with deterministic quote-contract-first sequencing and Cloudflare free-tier compatibility as hard constraints.
Trigger-Intended-Outcome: type: operational | statement: Build a deterministic recovery quote contract first, then add server email send path that is Cloudflare free-tier compatible and returns verifiable send outcomes. | source: operator
---

# BRIK Recovery Quote Server Email Send Point Fact-Find Brief

## Scope
### Summary
The current recovery quote flow is client-side `mailto` only. The requested direction is to implement a real server-send flow, but only after establishing deterministic quote data and calculations, and while preserving Cloudflare free-tier compatibility.

### Goals
- Define evidence-backed implementation scope for deterministic quote contract first.
- Define safe insertion points for new quote-send API endpoint.
- Identify Cloudflare free-tier constraints that affect email provider/runtime choices.
- Identify test gaps and minimal validation contract for reliable rollout.

### Non-goals
- Implementing the endpoint in this fact-find.
- Selecting paid Cloudflare services/features.
- Producing a full execution plan task graph (deferred to `/lp-do-plan`).

### Constraints & Assumptions
- Constraints:
  - Must remain compatible with Cloudflare free tier.
  - Deterministic quote contract must be delivered before send endpoint.
- Assumptions:
  - Initial launch can use deterministic `from_price` mode if exact plan totals are unavailable from current source contract.
  - API-based email provider path (`sendgrid` or `resend`) is preferred over SMTP fallback for Cloudflare-targeted runtime.

## Access Declarations
- `docs/business-os/startup-loop/ideas/trial/queue-state.json` (read): queue gate check for overlapping enqueued dispatches. Verification: `VERIFIED` (repo-local artifact).
- Octorate public booking result endpoint via existing server proxy (`/api/availability`): external data dependency for live price/availability source. Verification: `UNVERIFIED` (`memory/data-access.md` missing).
- External email provider APIs (SendGrid/Resend): required for real email delivery path. Verification: `UNVERIFIED` (`memory/data-access.md` missing).

## Outcome Contract
- **Why:** Operator requested moving forward from briefing and explicitly required deterministic quote contract-first sequencing plus Cloudflare free-tier compatibility.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Produce planning-ready scope to implement deterministic quote data/calculation contract first, then implement server quote-email send point with verifiable send outcomes on Cloudflare free-tier-compatible runtime constraints.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `apps/brikette/src/components/booking/RecoveryQuoteCapture.tsx` - user submit handler for recovery quote capture.
- `apps/brikette/src/components/booking/BookPageSections.tsx` - book-flow recovery injection.
- `apps/brikette/src/components/rooms/detail/RoomDetailBookingSections.tsx` - room-detail recovery injection with room + fixed rate-plan context.
- `apps/brikette/src/app/api/availability/route.ts` - existing server-side availability/price source.

### Key Modules / Files
- `apps/brikette/src/components/booking/RecoveryQuoteCapture.tsx` - submits form, writes localStorage, redirects to `mailto`.
- `apps/brikette/src/utils/recoveryQuote.ts` - resume link TTL, capture schema, storage write.
- `apps/brikette/src/components/booking/BookPageSections.tsx` - recovery context without room/rate.
- `apps/brikette/src/components/rooms/detail/RoomDetailBookingSections.tsx` - recovery context includes `room_id`, hardcoded `rate_plan: "nr"`.
- `apps/brikette/src/hooks/useRecoveryResumeFallback.ts` - expired resume fallback URL rewrite.
- `apps/brikette/src/app/api/availability/route.ts` - parses Octobook HTML into room availability + `priceFrom` + labels.
- `apps/brikette/src/types/octorate-availability.ts` - availability response contract.
- `apps/brikette/src/data/roomsData.ts` - room and rate-code mapping data.
- `apps/brikette/src/utils/buildOctorateUrl.ts` - canonical booking URL validation contract for dates/pax.
- `packages/email/src/send.ts` - provider order and fallback send path.

### Patterns & Conventions Observed
- Recovery path is currently client-only (`mailto`) with no API send mutation path.
  - Evidence: `apps/brikette/src/components/booking/RecoveryQuoteCapture.tsx`
- Availability route is already the server integration seam for Octobook and has error/fallback behavior.
  - Evidence: `apps/brikette/src/app/api/availability/route.ts`
- Email infra already centralizes provider dispatch and sender resolution.
  - Evidence: `packages/email/src/send.ts`, `packages/email/src/config.ts`, `packages/email/src/providers/index.ts`

### Data & Contracts
- Types/schemas/events:
  - Recovery context includes dates, pax, source route, optional room/rate; no explicit price contract.
  - Availability contract currently includes `priceFrom`, `nights`, `ratePlans` labels only.
- Persistence:
  - Recovery capture stored in browser localStorage (`brikette.recovery_capture.v1`), not server-side.
- API/contracts:
  - Brikette `src/app/api` currently exposes availability route only for this area.
  - Email provider selection supports `sendgrid|resend|smtp`; `smtp` fallback path uses Nodemailer.

### Dependency & Impact Map
- Upstream dependencies:
  - Octobook HTML response shape and availability parsing.
  - Email provider credentials and sender env configuration.
  - Existing room/rate mapping in `roomsData`.
- Downstream dependents:
  - Recovery CTA behavior and user confirmation messaging.
  - Delivery telemetry/monitoring for send outcomes.
  - Compliance/audit flows if consent persistence moves server-side.
- Likely blast radius:
  - Booking recovery components (book + room detail flows).
  - API route layer (`apps/brikette/src/app/api/*`).
  - Shared email package runtime config and provider behavior.

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest (component/unit/route), targeted e2e smoke script.
- Commands: `pnpm --filter @apps/brikette test` (CI policy: tests run in CI).
- CI integration: enforced via repo CI workflows.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Availability parser and upstream failures | Route unit tests | `apps/brikette/src/app/api/availability/route.test.ts` | Covers feature-flag off path, param validation, sold-out parsing, price parsing (`€` and `&euro;`), rate-plan extraction, non-200/network failures |
| Expired recovery resume fallback hook | Hook unit tests | `apps/brikette/src/hooks/useRecoveryResumeFallback.test.ts` | Covers expired rewrite path, valid no-op path, and `rebuild_quote` prompt behavior |

#### Coverage Gaps
- Untested paths:
  - `RecoveryQuoteCapture` submission and validation behavior.
  - `recoveryQuote.ts` persistence/resume parameter logic.
  - Deterministic quote-calculation contract (new).
  - Server send endpoint contract and idempotency behavior (new).
- Extinct tests:
  - Not identified in this audit.

#### Testability Assessment
- Easy to test:
  - Deterministic calculation helpers as pure functions.
  - API request validation/error handling and provider call contracts.
- Hard to test:
  - End-to-end inbox placement (beyond provider acceptance).
- Test seams needed:
  - Mockable provider adapter for send outcomes.
  - Stable quote-hash/idempotency helper.

#### Recommended Test Approach
- Unit tests for:
  - quote calculation and contract serialization/hash determinism.
- Integration tests for:
  - `/api/recovery/quote/send` request validation, availability lookup, provider invocation, idempotency.
- E2E tests for:
  - user flow submit -> success state and retry behavior.
- Contract tests for:
  - deterministic payload schema and `from_price` mode labeling.

### Recent Git History (Targeted)
- `apps/brikette/src/app/api/availability/route.ts`
  - `2b4a988b84` introduced Octobook availability proxy.
  - `36843c7072` and `fc503dd580` evolved matching and booking contract stability.
- `apps/brikette/src/components/booking/RecoveryQuoteCapture.tsx`
  - `3e549ddbf3` checkpoint commit (latest local workspace commit touchpoint).
- `packages/email/src/*`
  - Recent sequence hardened provider selection/env handling and fallback behavior (`28e5a6818e`, `14d1fb2981`, `118381386b`, others).

## Simulation Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Recovery submit entry and context capture | Yes | None | No |
| Server availability source + price extraction | Partial | [Type contract gap] [Major]: only `priceFrom` + labels, no exact plan totals | Yes |
| Deterministic quote contract + calculations | Partial | [Missing precondition] [Major]: output schema/hash/idempotency contract not yet implemented | Yes |
| Email provider/runtime compatibility | Partial | [Integration boundary] [Major]: `smtp` Nodemailer fallback exists and should not be primary path for Cloudflare-targeted flow | Yes |
| Test/validation coverage | Partial | [Missing domain coverage] [Major]: no direct tests for `RecoveryQuoteCapture` and `recoveryQuote.ts`; endpoint/idempotency tests also absent | Yes |

## Questions
### Resolved
- Q: Is there an existing server send point for recovery quote emails?
  - A: No. Current flow redirects browser to `mailto`.
  - Evidence: `apps/brikette/src/components/booking/RecoveryQuoteCapture.tsx`
- Q: Can deterministic pricing be exact plan-specific with current source contract?
  - A: Not currently; only deterministic `from_price` mode is feasible without extending source data extraction.
  - Evidence: `apps/brikette/src/app/api/availability/route.ts`, `apps/brikette/src/types/octorate-availability.ts`
- Q: Is Cloudflare free-tier compatibility feasible for this flow?
  - A: Yes, with API-provider-first implementation (`sendgrid`/`resend`) and avoiding SMTP fallback as primary route.
  - Evidence: `apps/brikette/open-next.config.ts`, `apps/brikette/wrangler.toml`, `packages/email/src/providers/index.ts`, `packages/email/src/send.ts`

### Open (Operator Input Required)
None.

## Confidence Inputs
- Implementation: 83%
  - Evidence basis: clear insertion points and existing email infra reduce implementation ambiguity.
  - Raise to >=80: already met.
  - Raise to >=90: define exact request/response schema for new endpoint and finalize idempotency key contract.
- Approach: 86%
  - Evidence basis: deterministic-contract-first sequence is well-bounded and aligns with current source constraints.
  - Raise to >=80: already met.
  - Raise to >=90: agree explicit launch mode (`from_price` first) and acceptance criteria.
- Impact: 78%
  - Evidence basis: replacing `mailto` with system send should improve completion, but exact lift is unmeasured.
  - Raise to >=80: define baseline recovery conversion and monitoring events.
  - Raise to >=90: run staged validation with measured conversion/change in quote follow-through.
- Delivery-Readiness: 81%
  - Evidence basis: known modules, known external dependencies, and explicit hard constraints documented.
  - Raise to >=80: already met.
  - Raise to >=90: finalize sender identity env contract and deploy-time checks.
- Testability: 82%
  - Evidence basis: core logic can be pure-function + integration tested, with limited hard runtime seams.
  - Raise to >=80: already met.
  - Raise to >=90: add provider adapter seam and deterministic contract fixtures for regression tests.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Misquoted totals due to insufficient source detail | High | High | Launch deterministic `from_price` mode first; gate exact plan mode on source contract expansion |
| Duplicate sends on retry/double-submit | Medium | High | Require idempotency key + dedupe store/record policy |
| Send path configured to unsuitable provider/runtime fallback | Medium | High | Enforce API-provider-first policy and explicit env validation at endpoint startup |
| Upstream Octobook parser drift | Medium | Medium | Retain parse/error guards and add contract tests for fixtures |
| Premature success UI without durable send acknowledgment | Medium | Medium | Return structured send status and render success only on accepted outcome |
| Consent compliance gap when moving from local to server persistence | Medium | Medium | Include consent metadata in server payload and retention policy |

## Planning Constraints & Notes
- Must-follow patterns:
  - Contract-first implementation: deterministic quote data/calculation contract before send endpoint.
  - Cloudflare free-tier compatibility must remain explicit in implementation decisions.
- Rollout/rollback expectations:
  - Rollout behind endpoint contract validation and send provider health checks.
  - Rollback path: disable endpoint and keep current UI fallback behavior guarded.
- Observability expectations:
  - Emit quote request, quote computed, send attempted, send accepted/failed telemetry events.

## Suggested Task Seeds (Non-binding)
- Define quote contract schema and deterministic calculation helper module.
- Add quote-resolution adapter from availability + room/rate inputs.
- Implement `/api/recovery/quote/send` with validation, idempotency, and provider dispatch.
- Update recovery UI submit path from `mailto` redirect to API mutation + status handling.
- Add tests for deterministic contract, endpoint behavior, and recovery flow integration.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `create-api-endpoint`, `create-server-action`
- Deliverable acceptance package:
  - API contract tests, calculation determinism tests, provider invocation tests, recovery UI status flow checks.
- Post-delivery measurement plan:
  - Compare recovery submit->send acceptance conversion and downstream booking continuation.

## Evidence Gap Review
### Gaps Addressed
- Verified no existing server send endpoint in Brikette recovery flow.
- Verified current availability contract limitations for exact plan pricing.
- Verified Cloudflare-targeted runtime context and provider/fallback behavior.

### Confidence Adjustments
- Reduced Impact confidence below 80 until measurable baseline and instrumentation are defined.
- Kept Implementation/Delivery/Testability above 80 due concrete code seams and bounded scope.

### Remaining Assumptions
- `from_price` deterministic mode is acceptable as initial production contract.
- API-provider-first path is available and configured in deployment environments.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None for planning kickoff (implementation will still require explicit contract decisions).
- Recommended next step:
  - `/lp-do-plan brik-recovery-quote-server-email-send-point --auto`

## Critique Summary
- Rounds executed: 2 (shared critique protocol using codemoot on Node 22)
- Final verdict: credible (`approved`)
- Score: 4.5/5.0
- Notes:
  - Round 1 (`needs_revision`, 8/10): corrected recovery-hook test coverage claims and simulation trace wording.
  - Round 2 (`approved`, 9/10): only info-level readability suggestions remained; no critical/major findings.
