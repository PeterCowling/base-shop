---
Type: Plan
Status: Complete
Domain: API
Workstream: Engineering
Created: 2026-03-11
Last-reviewed: 2026-03-11
Last-updated: 2026-03-11
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: caryina-dual-payment-provider
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas
Overall-confidence: 82%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Caryina Dual Payment Provider Plan

## Summary

Restore Stripe as a supported Caryina payment provider without removing the current Axerve path. The selector will stay backend-controlled through `PAYMENTS_PROVIDER`, with Caryina defaulting to Axerve when the selector is unset so current live behavior does not change implicitly. The implementation must recover the old Stripe-hosted checkout experience from git history while preserving Caryina's newer idempotency, inventory-hold, and operational recovery protections.

## Active tasks

- [x] TASK-01: Implement Caryina dual-provider checkout, success handling, webhook finalization, and provider-aware refunds

## Goals

- Support both `axerve` and `stripe` for Caryina checkout.
- Keep the payment-provider choice backend-controlled, not customer-selectable.
- Preserve Caryina inventory-hold and idempotency protections for both providers.
- Restore Stripe checkout UX and success handling from git history where valid.
- Keep Caryina refund handling aligned with the active provider.

## Non-goals

- Adding a customer-facing payment-method selector.
- Replatforming Caryina onto the generic template-app Stripe Elements flow.
- Changing non-payment Caryina storefront or admin behavior.

## Constraints & Assumptions

- Constraints:
  - `apps/caryina` currently runs Axerve in production-like behavior; default runtime behavior must remain Axerve-safe when `PAYMENTS_PROVIDER` is unset.
  - Local Jest execution is blocked by repo policy; validation will be typecheck + lint locally, tests in CI only.
  - Caryina payment files are currently untouched in the shared worktree; scope must remain limited to those files and direct support docs/config.
- Assumptions:
  - `PAYMENTS_PROVIDER` is the intended backend selector to reuse rather than introducing a Caryina-only second flag.
  - Caryina can accept Stripe hosted checkout rather than Stripe Elements, matching the historical implementation.

## Inherited Outcome Contract

- **Why:** Caryina needs Stripe available again as a fallback/alternative processor, but the restore must not throw away the newer checkout hardening added after the Axerve migration.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Caryina can run checkout through either Axerve or Stripe via a backend-controlled selector, with provider-appropriate checkout UX, success handling, stock protection, and refunds.
- **Source:** operator

## Analysis Reference

- Related briefing: `docs/briefs/caryina-payment-provider-briefing.md`
- Key reasoning used:
  - Caryina app code is currently Axerve-only even though the shared env schema already supports both providers.
  - The recoverable Stripe implementation exists in git history (`168e8b65d1`, `e9eee16459`) and should be reused selectively rather than reverted wholesale.
  - Caryina's newer idempotency and hold logic now live in `apps/caryina/src/lib/checkoutSession.server.ts`, so Stripe restoration must integrate with that layer instead of replacing it.

## Selected Approach Summary

- What was chosen:
  - Add a Caryina-local provider resolver and provider-specific checkout helpers.
  - Keep Axerve synchronous card-form flow as-is behind the selector.
  - Restore Stripe hosted checkout behind the selector and add Caryina-specific Stripe finalization paths so hosted checkout coexists with current hold/idempotency logic.
- Why planning is not reopening option selection:
  - The user explicitly requested `lp-do-ideas -> lp-do-build` progression after the repo briefing and accepted the dual-plumbing direction.

## Fact-Find Support

- Supporting brief: `docs/briefs/caryina-payment-provider-briefing.md`
- Evidence carried forward:
  - Shared selector exists in `packages/config/src/env/payments.ts`.
  - Old Caryina Stripe route/client/success files are recoverable from git history.
  - Current Axerve flow centralizes idempotency and hold management in `apps/caryina/src/lib/checkoutSession.server.ts`.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add provider resolver, Stripe restore path, Stripe finalization/webhook support, provider-aware success/refund handling, and targeted config/tests | 82% | L | Complete | - | - |

## Engineering Coverage

| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | Render Caryina checkout and success pages conditionally by provider without exposing a customer selector | TASK-01 | Stripe uses redirect CTA; Axerve keeps inline card form |
| UX / states | Preserve empty/error/success states for both providers and restore Stripe payment-not-completed messaging | TASK-01 | Success page becomes provider-aware |
| Security / privacy | Keep PAN/CVV only on Axerve path; Stripe path returns to hosted checkout and verifies webhook signatures | TASK-01 | Avoid broadening PCI-sensitive surfaces beyond current Axerve mode |
| Logging / observability / audit | Reuse current Caryina checkout metrics/alerts and add provider-aware Stripe finalization logging where needed | TASK-01 | Keep failure states explicit for reconciliation |
| Testing / validation | Update Caryina route/UI/refund tests and add Stripe webhook/finalization coverage; run local typecheck/lint only | TASK-01 | CI remains source of truth for tests |
| Data / contracts | Extend Caryina checkout idempotency store for provider-specific external references and refund lookup | TASK-01 | Contract must remain replay-safe |
| Performance / reliability | Preserve hold/release behavior across synchronous Axerve and asynchronous Stripe flows | TASK-01 | Stripe path needs explicit finalization and expiry handling |
| Rollout / rollback | Default unresolved selector to Axerve and keep Stripe additive behind `PAYMENTS_PROVIDER=stripe` | TASK-01 | Rollback is selector reset plus code revert if needed |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Checkout/refund/success/provider seams are tightly coupled and should ship together |

## Tasks

### TASK-01: Implement Caryina dual-provider checkout, success handling, webhook finalization, and provider-aware refunds

- **Type:** IMPLEMENT
- **Deliverable:** code-change across Caryina payment runtime, checkout UI, success path, webhook route, refund route, plan, and targeted config/tests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete
- **Affects:** `apps/caryina/package.json`, `apps/caryina/.env.example`, `apps/caryina/src/lib/checkoutIdempotency.server.ts`, `apps/caryina/src/lib/checkoutReconciliation.server.ts`, `apps/caryina/src/lib/checkoutSession.server.ts`, `apps/caryina/src/lib/verifyStripeSession.ts`, `apps/caryina/src/lib/payments/provider.server.ts`, `apps/caryina/src/lib/payments/notifications.server.ts`, `apps/caryina/src/lib/payments/stripeCheckout.server.ts`, `apps/caryina/src/app/[lang]/checkout/page.tsx`, `apps/caryina/src/app/[lang]/checkout/CheckoutClient.client.tsx`, `apps/caryina/src/app/[lang]/checkout/CheckoutClient.test.tsx`, `apps/caryina/src/app/[lang]/success/page.tsx`, `apps/caryina/src/app/[lang]/success/page.test.tsx`, `apps/caryina/src/app/api/checkout-session/route.test.ts`, `apps/caryina/src/app/api/stripe-webhook/route.ts`, `apps/caryina/src/app/api/stripe-webhook/route.test.ts`, `apps/caryina/src/app/admin/api/refunds/route.ts`, `apps/caryina/src/app/admin/api/refunds/route.test.ts`, `docs/plans/caryina-dual-payment-provider/plan.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 82%
  - Implementation: 82% - the old Stripe flow is recoverable and the Axerve flow already has a strong central seam, but Caryina needs fresh provider-aware glue for webhook/finalization state.
  - Approach: 80% - Stripe hosted checkout can coexist cleanly if Caryina stores provider/session references and handles async completion explicitly.
  - Impact: 85% - the blast radius stays within Caryina payment files plus one app dependency update.
- **Acceptance:**
  - Caryina resolves a backend-only payment provider from runtime config and defaults to Axerve when unset.
  - Axerve checkout behavior remains intact.
  - Stripe checkout path is restored as hosted redirect flow and reachable when `PAYMENTS_PROVIDER=stripe`.
  - Caryina success handling works for both providers.
  - Caryina records enough Stripe checkout state to prevent inventory/reconciliation drift.
  - Caryina has a Stripe webhook route that finalizes completed/expired Stripe sessions into Caryina's checkout state.
  - Caryina refund route uses Axerve when Axerve is active and Stripe refunds when Stripe is active.
- **Validation contract (TC-01):**
  - TC-01-01: Axerve provider still requires card fields and returns synchronous success/failure contract.
  - TC-01-02: Stripe provider path returns checkout `url`/`sessionId` and does not require card fields.
  - TC-01-03: Stripe success page handles `session_id` and renders paid vs not-paid outcomes.
  - TC-01-04: Stripe webhook finalizes `checkout.session.completed` and expires `checkout.session.expired` against Caryina state.
  - TC-01-05: Stripe refund path resolves a stored payment-intent reference from Caryina checkout records.
  - TC-01-06: `pnpm --filter @apps/caryina typecheck` passes.
  - TC-01-07: `pnpm --filter @apps/caryina lint` passes.
- **Execution plan:** Red -> Green -> Refactor
  - Red: update Caryina checkout/success/refund/webhook tests to express dual-provider behavior and recovered Stripe paths.
  - Green: add provider resolver, Stripe helper/finalization state, and conditionally render provider-specific checkout flows.
  - Refactor: keep provider-specific logic extracted from the already-large checkout server file and update app env docs.
- **Planning validation (required for M/L):**
  - Checks run:
    - `sed -n '1,320p' apps/caryina/src/lib/checkoutSession.server.ts`
    - `sed -n '1,320p' apps/caryina/src/lib/checkoutIdempotency.server.ts`
    - `sed -n '1,320p' apps/caryina/src/lib/checkoutReconciliation.server.ts`
    - `sed -n '1,320p' apps/caryina/src/app/[lang]/checkout/CheckoutClient.client.tsx`
    - `sed -n '1,220p' apps/caryina/src/app/[lang]/success/page.tsx`
    - `sed -n '1,220p' apps/caryina/src/app/admin/api/refunds/route.ts`
    - `git show 168e8b65d1:apps/caryina/src/app/api/checkout-session/route.ts`
    - `git show 168e8b65d1:apps/caryina/src/app/[lang]/checkout/CheckoutClient.client.tsx`
    - `git show 168e8b65d1:apps/caryina/src/lib/verifyStripeSession.ts`
  - Unexpected findings:
    - Caryina refunds are currently Axerve-only and need the same provider abstraction as checkout.
    - Old Caryina Stripe flow lacked the newer hold/idempotency protections, so restore must be selective.
- **Consumer tracing (M effort):**
  - New/modified outputs:
    - Provider-aware Caryina checkout request/response behavior.
    - Provider-aware Caryina success handling.
    - Provider-aware Caryina refund behavior.
  - Consumers:
    - Caryina checkout page/UI.
    - Caryina payment route and webhook route.
    - Caryina admin refunds flow.
  - Caller/consumer updates required:
    - Checkout page passes provider mode into the client component.
    - Stripe webhook route added for hosted checkout completion.
    - Refund route resolves provider-specific payment references.
- **Scouts:** None - briefing and git-history recovery already identified the exact restore seams.
- **Edge Cases & Hardening:**
  - Stripe session expires without completion -> hold release must not require manual cleanup.
  - Stripe webhook and success-page verification may race -> finalization must be idempotent.
  - Unset `PAYMENTS_PROVIDER` must preserve current Axerve behavior.
  - Legacy Axerve-only orders must still refund correctly after the selector exists.
- **What would make this >=90%:**
  - CI pass on Caryina route/UI tests after the provider-aware changes land.
- **Rollout / rollback:**
  - Rollout: ship with default Axerve runtime; enable Stripe only by setting `PAYMENTS_PROVIDER=stripe`.
  - Rollback: revert selector to Axerve; revert code only if Stripe path proves unsafe.
- **Documentation impact:**
  - Update Caryina app env example so operator setup reflects the provider selector and both credential sets.
- **Notes / references:**
  - `docs/briefs/caryina-payment-provider-briefing.md`
  - `docs/plans/_archive/caryina-axerve-payment-gateway/plan.md`
  - Delivery notes:
    - Caryina checkout page now resolves `PAYMENTS_PROVIDER` server-side and passes it into a provider-aware checkout client.
    - Stripe hosted checkout was restored behind the backend selector with Caryina-local session creation, webhook finalization, success-page reconciliation, and provider-aware refunds.
    - Refund routing now prefers stored historical provider metadata when a `shopTransactionId` maps to an existing Caryina checkout attempt, so mixed Axerve/Stripe order history can still refund correctly.
  - Validation evidence:
    - `pnpm --filter @apps/caryina typecheck`
    - `pnpm --filter @apps/caryina lint`
    - Local Jest/e2e not run per repo testing policy; CI remains the test authority.

## Risks & Mitigations

- Stripe completion is asynchronous while Axerve is synchronous.
  - Mitigation: store provider/session references and finalize Stripe through explicit webhook + idempotent Caryina state updates.
- Caryina checkout server is already large.
  - Mitigation: extract provider-specific helpers into `src/lib/payments/`.
- Refund identifiers differ by provider.
  - Mitigation: keep `shopTransactionId` as Caryina's internal stable reference and map provider-specific IDs behind the admin route.

## Observability

- Logging: provider-aware checkout failures, Stripe webhook/finalization failures, refund provider mismatches.
- Metrics: keep existing Caryina checkout metrics; preserve Axerve and Stripe failure outcome labelling.
- Alerts/Dashboards: reuse existing Caryina checkout alert email path for needs-review/finalization failures.

## Acceptance Criteria (overall)

- [x] Caryina can run checkout through Axerve or Stripe based on backend configuration.
- [x] Axerve path remains functional.
- [x] Stripe path no longer requires manual code recovery from git and is first-class in the app.
- [x] Hosted Stripe checkout does not regress Caryina hold/idempotency protections.
- [x] Provider-aware refunds exist for Caryina orders.

## Decision Log

- 2026-03-11: Treat this as a direct operator-triggered build plan instead of a micro-build because the feature spans checkout runtime, success handling, webhooks, refunds, and app config.

## Overall-confidence Calculation

- S=1, M=2, L=3
- Overall-confidence = sum(task confidence * effort weight) / sum(effort weight)
