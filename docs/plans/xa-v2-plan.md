---
Type: Plan
Status: Active
Domain: Commerce
Created: 2026-02-11
Last-updated: 2026-02-28
Last-reviewed: 2026-02-28
Relates-to charter: none
Feature-Slug: xa-v2
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: ops-ship
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); weighted by Effort
Supersedes:
  - docs/plans/archive/xa-client-readiness-plan.md
  - docs/plans/archive/xa-publish-privacy-plan.md
Audit-Ref: 2e5319f15e
Audit-Date: 2026-02-28
Replan-round: 1
---

# XA v2 Plan

## Summary

Consolidated plan for getting the XA storefront (`apps/xa-b`) to staging and client-review readiness. **Replan (2026-02-28):** `apps/xa` was deleted (commit 2e5319f15e, 2026-02-23) and `apps/xa-b` is now the primary app. xa-b is a fully static export deployed to Cloudflare Pages. All tasks rescoped accordingly.

## Goals

- Complete Pages deployment of `apps/xa-b` and verify public URL
- Prepare landing page and demo script for client review
- Establish quality baseline (lint, test coverage)

## Non-goals

- Production deployment
- Full i18n coverage
- Payment integration
- Cloudflare Access / stealth middleware (removed from xa-b in static export migration)
- Separate stealth Cloudflare account (xa-b-site project name is non-identifying)

## Context

`apps/xa-b` (package: `@apps/xa-b`) is a member rewards storefront (Next.js 16 + React 19) built as a fully static export deployed to Cloudflare Pages as project `xa-b-site`. The static export migration was completed across 5 waves (commits 94d5712c1 through 85479a0082). Code quality is clean (lint, typecheck pass). The remaining work is creating the CF Pages project, triggering the first CI deploy, and demo preparation.

### Completed in prior plans / waves

- All discovery and local verification
- OpenNext adapter install (later replaced by static export migration)
- Stealth branding, leakage scan, introspection audit
- Static export migration: access/account system removal, `generateStaticParams` for all dynamic routes, Pages CI job, wrangler.toml deleted
- Lint verified clean (`@apps/xa-b`)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| XA-V2-01 | IMPLEMENT | Create CF Pages project xa-b-site + trigger CI deploy | 90% | S | Pending | - | XA-V2-02, XA-V2-03 |
| XA-V2-02 | INVESTIGATE | Verify demo URL is non-identifying; confirm no Access needed | 88% | S | Pending | XA-V2-01 | - |
| XA-V2-03 | DECISION | Assess landing page content for demo readiness | 90% | S | Pending | - | XA-V2-04 |
| XA-V2-04 | IMPLEMENT | Landing page fixes (if needed) | 80% | M | Pending | XA-V2-03 | XA-V2-05 |
| XA-V2-05 | IMPLEMENT | Prepare demo script | 90% | S | Pending | XA-V2-03 | - |
| XA-V2-06 | IMPLEMENT | Run lint checks | 90% | S | Complete | - | - |
| XA-V2-07 | INVESTIGATE | Establish test coverage baseline | 85% | S | Pending | - | XA-V2-08 |
| XA-V2-08 | IMPLEMENT | Progress toward 80% coverage | 75% | L | Pending | XA-V2-07 | - |

## Parallelism Guide

- **Wave 1 (unblocked):** XA-V2-01, XA-V2-03, XA-V2-07 — all independent
- **Wave 2:** XA-V2-02 (needs XA-V2-01), XA-V2-04 (needs XA-V2-03), XA-V2-08 (needs XA-V2-07)
- **Wave 3:** XA-V2-05 (needs XA-V2-03)

## Active tasks

### XA-V2-01: Create CF Pages project xa-b-site + trigger CI deploy
- **Type:** IMPLEMENT
- **Confidence:** 90% — E2: static export migration complete, CI job exists, project name known
- **Effort:** S
- **Depends on:** -
- **Blocks:** XA-V2-02, XA-V2-03
- **Status:** Pending
- **Execution-Skill:** lp-do-build
- **Scope:** Create the `xa-b-site` Cloudflare Pages project (manual dashboard step), then trigger the CI workflow to complete the first deploy.
- **Affects:**
  - `.github/workflows/xa.yml` [readonly]
  - `apps/xa-b/` [readonly]
- **Validation contract (TC):**
  - Cloudflare Pages project `xa-b-site` exists in dashboard
  - CI workflow `deploy-xa-b` job completes with green status
  - `https://dev--xa-b-site.pages.dev/` (or `https://xa-b-site.pages.dev/` on main) returns 200
  - Core routes accessible: `/`, `/women/clothing`, `/products/mini-parka`, `/cart`, `/wishlist`
- **Context (from replan 2026-02-28):**
  - `apps/xa` deleted 2026-02-23; xa-b is now the primary app
  - CI deploy job targets Pages project `xa-b-site` via `wrangler pages deploy out/ --project-name xa-b-site`
  - No `/api/health` endpoint exists (static export — not needed; Pages serves static files)
  - Static export is fully configured; `pnpm --filter @apps/xa-b build` completes cleanly
  - No reusable workflow; health check issue from prior plan is obsolete
- **Next action:**
  1. In Cloudflare dashboard: create Pages project named `xa-b-site` connected to this repo
  2. Trigger CI (`workflow_dispatch` on `xa.yml` or push to `dev`)
  3. Verify the Pages URL returns 200 on `/`

### XA-V2-02: Verify demo URL is non-identifying; confirm no Access needed
- **Type:** INVESTIGATE
- **Confidence:** 88%
- **Effort:** S
- **Depends on:** XA-V2-01
- **Blocks:** -
- **Status:** Pending
- **Execution-Skill:** lp-do-build
- **Scope:** After staging is live, confirm:
  1. `xa-b-site.pages.dev` URL does not expose business identity to competitors
  2. No Cloudflare Access app is needed (stealth middleware was removed; invite-code auth is gone in static export)
  3. Document the decision on Access: not needed / needed with specific emails
- **Context (from replan 2026-02-28):**
  - `apps/xa-b/middleware.ts` does not exist — all stealth/access control was removed in the static export migration
  - `XA_STEALTH_MODE`, `XA_STRICT_STEALTH`, `XA_REQUIRE_CF_ACCESS` env vars are unused/legacy
  - `xa-b-site` project name is generic and non-identifying
  - Prior scope (second CF account, CF Access app, `NEXTAUTH_SECRET`, `SESSION_SECRET`, `CART_COOKIE_SECRET`) is obsolete
- **Validation contract (VC):**
  - Decision documented: Access required Y/N, with rationale
  - URL confirmed non-identifying (no business name in Pages URL)
  - If Access needed: scope and emails specified
- **Acceptance:**
  - Investigation output: one paragraph decision + rationale
  - If Access is not needed: confirm demo is accessible via direct Pages URL

### XA-V2-03: Assess landing page content for demo readiness
- **Type:** DECISION
- **Confidence:** 90% — E2: page.tsx reviewed; content complete; XA-0001 is an i18n-exempt metadata comment (not a lint warning)
- **Effort:** S
- **Depends on:** - (no longer gated on XA-V2-01; can be assessed from code)
- **Blocks:** XA-V2-04
- **Status:** Pending
- **Scope:** Confirm landing page content is demo-ready. Prior XA-0001 "lint warning" is resolved — it's an `i18n-exempt` metadata comment only.
- **Context (from replan 2026-02-28):**
  - `apps/xa-b/src/app/page.tsx` has complete content: hero + "Join Us" CTA, "New in" products grid, info cards (How to shop / FAQs / Need help)
  - Translations use `xaB.src.app.page.*` keys; content is production-grade demo content
  - No placeholder/lorem ipsum visible
- **Acceptance:** Decision documented:
  - Option A: Content acceptable for demo as-is ← likely outcome
  - Option B: Specific changes needed (list them)
  - Option C: Needs design input (blocker)

### XA-V2-04: Landing page fixes (if needed)
- **Type:** IMPLEMENT
- **Confidence:** 80%
- **Effort:** M
- **Depends on:** XA-V2-03 (only if Option B)
- **Blocks:** XA-V2-05
- **Status:** Pending
- **Execution-Skill:** lp-do-build
- **Scope:** Implement changes from XA-V2-03 Option B. Likely skipped (Option A expected).
- **Affects:** `apps/xa-b/src/app/page.tsx`, `apps/xa-b/src/locales/`
- **Validation contract (TC):**
  - Landing page changes match XA-V2-03 Option B spec
  - `pnpm --filter @apps/xa-b lint` passes
  - `pnpm --filter @apps/xa-b build` completes
- **Acceptance:** Landing page presentable for demo

### XA-V2-05: Prepare demo script
- **Type:** IMPLEMENT
- **Confidence:** 90%
- **Effort:** S
- **Depends on:** XA-V2-03
- **Blocks:** -
- **Status:** Pending
- **Execution-Skill:** lp-do-build
- **Scope:** Document demo flow with talking points for `apps/xa-b`.
- **Affects:** `docs/plans/xa-v2/demo-script.md` (new file)
- **Validation contract (TC):**
  - Demo script exists at `docs/plans/xa-v2/demo-script.md`
  - Covers: what to show, what to say for each screen, known limitations, questions for client
- **Acceptance:** One-page demo script covering full client walkthrough

### XA-V2-06: Run lint checks
- **Type:** IMPLEMENT
- **Confidence:** 90%
- **Effort:** S
- **Depends on:** -
- **Blocks:** -
- **Status:** Complete (2026-02-28 re-verified)
- **Scope:** `pnpm --filter @apps/xa-b lint`
- **Acceptance:** No errors (warnings acceptable)
- **Result:** `pnpm --filter @apps/xa-b lint` passes with no errors (re-verified 2026-02-28 via replan investigation; prior entry used `@apps/xa-c` which is now corrected to `@apps/xa-b`)

### XA-V2-07: Establish test coverage baseline
- **Type:** INVESTIGATE
- **Confidence:** 85%
- **Effort:** S
- **Depends on:** -
- **Blocks:** XA-V2-08
- **Status:** Pending
- **Execution-Skill:** lp-do-build
- **Scope:** Run `pnpm --filter @apps/xa-b test -- --coverage` and document current coverage percentage.
- **Validation contract (VC):**
  - Coverage report output captured
  - Baseline percentage documented in plan
- **Acceptance:** Baseline number documented; XA-V2-08 confidence reassessed

### XA-V2-08: Progress toward 80% coverage
- **Type:** IMPLEMENT
- **Confidence:** 75% — below 80% threshold; gated on XA-V2-07 baseline
- **Effort:** L
- **Depends on:** XA-V2-07
- **Blocks:** -
- **Status:** Pending (below-threshold; reassess after XA-V2-07)
- **Execution-Skill:** lp-do-build
- **Scope:** Follow XA 80% Coverage Plan (ref: `docs/plans/archive/xa-coverage-80-plan.md`)
- **Confidence note:** Will be re-scored after XA-V2-07 documents the baseline. If baseline is ≥60%, confidence expected to reach 80%+.
- **Validation contract (TC):**
  - Coverage report shows ≥80% statements/branches
  - All new tests pass
- **Acceptance:** Coverage plan tasks completed

## Open Questions

- [ ] Should demo require Cloudflare Access? Emails/groups? (XA-V2-02)
- [ ] Who is the client contact for scheduling the review?
- [x] `XA_STAGING_PROJECT` / URL pattern → **xa-b-site**, `https://xa-b-site.pages.dev` (replan 2026-02-28)
- [x] Has second CF account been created? → **No longer needed** (stealth middleware removed; xa-b is static export)

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| CF Pages project `xa-b-site` name taken | Deploy blocked | Use `xa-b-staging` as fallback; update workflow var |
| CI runner stalls | Deploy delayed | Retry workflow_dispatch |
| Landing content needs changes | Demo quality | Likely Option A; fallback: add brief context slide in demo script |
| Coverage target too ambitious | Quality track delayed | Focus on critical-path tests; defer 80% target |

## Decision Log

- 2026-02-11: Created as consolidated successor to xa-client-readiness-plan and xa-publish-privacy-plan.
- 2026-02-14: Fact-check: XA-V2-01 blocked (healthcheck-base-url), XA-V2-06 complete, XA-V2-02 pending.
- 2026-02-28: **Replan round 1.** `apps/xa` deleted in commit 2e5319f15e (2026-02-23). Operator selected Option A: `apps/xa-b` is the primary app. All tasks rescoped:
  - XA-V2-01: target changed from Worker deploy of apps/xa to Pages deploy of xa-b-site
  - XA-V2-02: stealth account/Access setup obsolete; rescoped to URL non-identification check only
  - XA-V2-03: XA-0001 lint issue resolved (was i18n-exempt comment); dependency on XA-V2-01 removed
  - XA-V2-06: corrected filter from @apps/xa-c to @apps/xa-b
  - Overall-confidence raised from 82% to 88%
