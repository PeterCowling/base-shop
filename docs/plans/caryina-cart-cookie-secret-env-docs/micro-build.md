---
Type: Micro-Build
Status: Complete
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: caryina-cart-cookie-secret-env-docs
Execution-Track: doc
Deliverable-Type: doc
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260314160000-PLAT-010
Related-Plan: none
---

# Caryina Cart Cookie Secret Env Docs Micro-Build

## Scope
- Change: Added `CART_COOKIE_SECRET` to `apps/caryina/.env.example` with a comment explaining it is required in production (crashes silently if absent) and defaults to `"dev-cart-secret"` in development only.
- Non-goals: Redis/Upstash vars (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) are defined in the shared auth package schema and are not referenced anywhere in the caryina app — excluded from scope.

## Execution Contract
- Affects: `apps/caryina/.env.example`
- Acceptance checks:
  - `CART_COOKIE_SECRET` present in `.env.example` with production-required comment
  - Comment instructs to generate with `openssl rand -base64 32`
  - Placed in a dedicated "Cart cookie" section before the checkout integrity section
- Validation commands: `pnpm --filter caryina typecheck` and `pnpm --filter caryina lint`
- Rollback note: Remove the added "Cart cookie" section from `.env.example`

## Outcome Contract
- **Why:** Fresh deployments of caryina would crash at runtime ("env.CART_COOKIE_SECRET is required") with no obvious cause, since the variable was missing from `.env.example`. Operators following the example file had no way to know the secret was needed.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Any operator deploying caryina to production from a clean checkout will see `CART_COOKIE_SECRET` documented in `.env.example` before launch, preventing a silent production crash.
- **Source:** operator
