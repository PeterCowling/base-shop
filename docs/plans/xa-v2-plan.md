---
Type: Plan
Status: Active
Domain: Commerce
Created: 2026-02-11
Last-updated: 2026-02-14
Last-reviewed: 2026-02-14
Relates-to charter: none
Feature-Slug: xa-v2
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: lp-build
Supporting-Skills: ops-ship
Overall-confidence: 82%
Confidence-Method: min(Implementation,Approach,Impact); weighted by Effort
Supersedes:
  - docs/plans/archive/xa-client-readiness-plan.md
  - docs/plans/archive/xa-publish-privacy-plan.md
Audit-Ref: working-tree
Audit-Date: 2026-02-14
---

# XA v2 Plan

## Summary

Consolidated plan carrying forward all incomplete tasks from the archived `xa-client-readiness-plan` and `xa-publish-privacy-plan`. Covers staging deploy completion, stealth Cloudflare account setup, presentation polish, and quality baseline.

## Goals

- Complete staging deployment and verify public URL
- Set up stealth Cloudflare account #2 for competitor-safe demos
- Prepare landing page and demo script for client review
- Establish quality baseline (lint, test coverage)

## Non-goals

- Production deployment
- Full i18n coverage
- Payment integration
- Variant app (xa-b, xa-j) verification

## Context

XA is a member rewards storefront (Next.js 15 + React 19). The app is locally verified (dev server, Worker parity build, core user flows). The remaining work is deployment, stealth infrastructure, and demo preparation.

### Completed in prior plans

- All discovery and local verification (XA-READY-00 through 05)
- OpenNext adapter install, wrangler.toml rewrite, build scripts, CI workflow (XA-READY-06a through 07)
- Stealth branding decisions, Access gating middleware, leakage scan, introspection audit (TASK-00 through 08 except TASK-03)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| XA-V2-01 | IMPLEMENT | Deploy to Cloudflare staging + verify | 82% | M | Blocked | - | XA-V2-02, XA-V2-03 |
| XA-V2-02 | INVESTIGATE | Cloudflare account #2 + Pages/Access setup | 82% | M | Pending | XA-V2-01 | - |
| XA-V2-03 | DECISION | Assess landing page content | 85% | S | Pending | XA-V2-01 | XA-V2-04 |
| XA-V2-04 | IMPLEMENT | Landing page fixes (if needed) | 80% | M | Pending | XA-V2-03 | XA-V2-05 |
| XA-V2-05 | IMPLEMENT | Prepare demo script | 90% | S | Pending | XA-V2-03 | - |
| XA-V2-06 | IMPLEMENT | Run lint checks | 90% | S | Complete | - | - |
| XA-V2-07 | INVESTIGATE | Establish test coverage baseline | 85% | S | Pending | - | XA-V2-08 |
| XA-V2-08 | IMPLEMENT | Progress toward 80% coverage | 75% | L | Pending | XA-V2-07 | - |

## Active tasks

### XA-V2-01: Deploy to Cloudflare staging + verify
- **Type:** IMPLEMENT
- **Carried from:** xa-client-readiness-plan XA-READY-08
- **Confidence:** 82%
- **Effort:** M
- **Depends on:** -
- **Blocks:** XA-V2-02, XA-V2-03
- **Status:** Blocked (health check failing)
- **Scope:** Trigger CI workflow, verify staging URL responds, health check passes, invite flow works.
- **Acceptance:**
  - CI workflow completes successfully
  - Staging URL returns 200 on `/api/health`
  - Core flows accessible: `/`, `/women/clothing`, `/products/mini-parka`, `/cart`, `/wishlist`
- **Current state (2026-02-14):**
  - Build succeeds, deploy step completes
  - Health check fails because `healthcheck-base-url` is not passed to reusable workflow
  - Workflow passes `environment-url` (Workers URL) but health check script defaults to `.pages.dev` URL construction
  - GitHub environment `xa-staging` exists with `XA_STAGING_PROJECT=xa-site` and secret `XA_STEALTH_INVITE_CODES`
  - Expected URL: `https://xa-site.peter-cowling1976.workers.dev`
- **Next action:** Add `healthcheck-base-url: ${{ inputs.environment-url }}` to `.github/workflows/xa.yml` reusable workflow call

### XA-V2-02: Cloudflare account #2 + Pages/Access setup
- **Type:** INVESTIGATE
- **Carried from:** xa-publish-privacy-plan TASK-03
- **Confidence:** 82%
- **Effort:** M
- **Depends on:** XA-V2-01 (staging deploy proves the pipeline works)
- **Blocks:** -
- **Scope:** Set up stealth staging on a second Cloudflare account:
  - Create a Pages project with a non-identifying name
  - Create Cloudflare Access app, allowlist demo users
  - Create GitHub environment `xa-staging` with account #2 secrets (`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `NEXTAUTH_SECRET`, `SESSION_SECRET`, `CART_COOKIE_SECRET`)
  - Configure env vars: `XA_STEALTH_MODE=true`, `XA_STRICT_STEALTH=true`, `XA_REQUIRE_CF_ACCESS=true`
- **Acceptance:**
  - Staging URL on account #2 returns 200
  - Cloudflare Access blocks unauthenticated users
  - No business identifiers visible in URL or project name

### XA-V2-03: Assess landing page content
- **Type:** DECISION
- **Carried from:** xa-client-readiness-plan XA-READY-09
- **Confidence:** 85%
- **Effort:** S
- **Depends on:** XA-V2-01
- **Blocks:** XA-V2-04
- **Scope:** Review XA-0001 lint warning, determine if landing content is demo-ready
- **Acceptance:** Decision documented:
  - Option A: Content acceptable for demo as-is
  - Option B: Specific changes needed (list them)
  - Option C: Needs design input (blocker)

### XA-V2-04: Landing page fixes (if needed)
- **Type:** IMPLEMENT
- **Carried from:** xa-client-readiness-plan XA-READY-10
- **Confidence:** 80%
- **Effort:** M
- **Depends on:** XA-V2-03 (only if Option B)
- **Blocks:** XA-V2-05
- **Scope:** Implement changes from XA-V2-03 Option B
- **Acceptance:** Landing page presentable for demo

### XA-V2-05: Prepare demo script
- **Type:** IMPLEMENT
- **Carried from:** xa-client-readiness-plan XA-READY-11
- **Confidence:** 90%
- **Effort:** S
- **Depends on:** XA-V2-03
- **Blocks:** -
- **Scope:** Document demo flow with talking points
- **Acceptance:** One-page demo script covering what to show, what to say, known limitations, questions for client

### XA-V2-06: Run lint checks
- **Type:** IMPLEMENT
- **Carried from:** xa-client-readiness-plan XA-READY-12
- **Confidence:** 90%
- **Effort:** S
- **Depends on:** -
- **Blocks:** -
- **Status:** Complete (2026-02-14)
- **Scope:** `pnpm --filter @apps/xa-c lint`
- **Acceptance:** No errors (warnings acceptable)
- **Result:** `pnpm --filter @apps/xa-c lint` passes with no errors (verified 2026-02-14)

### XA-V2-07: Establish test coverage baseline
- **Type:** INVESTIGATE
- **Carried from:** xa-client-readiness-plan XA-READY-13
- **Confidence:** 85%
- **Effort:** S
- **Depends on:** -
- **Blocks:** XA-V2-08
- **Scope:** Run coverage report, document current percentage
- **Acceptance:** Baseline number documented
- **Related:** [XA 80% Coverage Plan](archive/xa-coverage-80-plan.md) (if it exists)

### XA-V2-08: Progress toward 80% coverage
- **Type:** IMPLEMENT
- **Carried from:** xa-client-readiness-plan XA-READY-14
- **Confidence:** 75%
- **Effort:** L
- **Depends on:** XA-V2-07
- **Blocks:** -
- **Scope:** Follow XA 80% Coverage Plan
- **Acceptance:** Coverage plan tasks completed

## Open Questions (carried forward)

- [x] Confirm `XA_STAGING_PROJECT` value and resulting Workers URL pattern
  - **Resolved (2026-02-14):** `XA_STAGING_PROJECT=xa-site`, URL pattern is `https://xa-site.peter-cowling1976.workers.dev`
- [ ] Should preview require Cloudflare Access? If yes, which emails/groups?
- [x] What is the demo invite code (`XA_STEALTH_INVITE_CODES`)?
  - **Resolved (2026-02-14):** Secret is configured in `xa-staging` environment
- [ ] Who is the client contact for scheduling the review?
- [ ] Has Cloudflare account #2 been created for stealth staging? (TASK-03 from xa-publish-privacy-plan)

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| CI runner stalls again | Deploy delayed | Retry with fresh dispatch; check runner capacity |
| Stealth account setup blocked by admin access | Can't set up account #2 | Fall back to same account with neutral project name |
| Landing content unacceptable | Demo quality | Add "draft" watermark; set expectations with client |
| Coverage target too ambitious for timeline | Quality track delayed | Focus on critical path coverage; defer 80% target |

## Decision Log

- 2026-02-11: Created as consolidated successor to xa-client-readiness-plan and xa-publish-privacy-plan. All completed tasks preserved in archived plans for reference.
- 2026-02-14: Fact-check completed. Key findings:
  - XA-V2-01 status updated to "Blocked" - deploy succeeds but health check fails due to missing `healthcheck-base-url` parameter
  - XA-V2-06 (lint) verified complete - no errors
  - XA-V2-02 remains pending - no evidence of second Cloudflare account creation
  - Environment `xa-staging` exists with `XA_STAGING_PROJECT` and `XA_STEALTH_INVITE_CODES` configured
  - Recent staging branch pushes trigger XA workflow but fail at health check step
  - Expected staging URL: `https://xa-site.peter-cowling1976.workers.dev` (not yet verified accessible)
