---
Type: Plan
Status: Active
Domain: Commerce
Last-reviewed: 2026-02-09
Relates-to charter: none
Created: 2026-01-21
Created-by: Claude
Last-updated: 2026-02-09
Last-updated-by: Codex (GPT-5)
Audit-Ref: 9c344c9ee9a23c98b3cb645afbd0e97be90d3d46
---

# XA Client Readiness Plan


## Active tasks

Active tasks are listed in the **Active Tasks** section below (`XA-READY-08` is currently active).

## Context

XA is a member rewards storefront application built with Next.js 15 and React 19. Before presenting it to the client for initial review, we need to ensure the app is functional and presentable.

### What is "Client Review Ready"?

The client review is a **live demo and walkthrough** where the client can:
1. See the storefront running (not just screenshots)
2. Click through core shopping flows
3. Provide feedback on UX/design direction
4. Decide whether to proceed with further development

**Success criteria:** Client can complete a guided demo without encountering errors or broken functionality, and has enough context to give actionable feedback.

### Scope Decision

**In scope for initial review:**
- **apps/xa** - Main member rewards storefront (primary demo target)

**Out of scope for initial review:**
- apps/xa-b, apps/xa-j - Variant storefronts (same codebase, different catalog)
- apps/xa-uploader - Internal upload console
- apps/xa-drop-worker - Backend worker

Variants can be mentioned but won't be demoed. They share 95%+ code with the main app.

## Goals

- Main xa app runs without crashes or console errors
- Core user flows work: browse → product → cart → wishlist
- Deployed to a preview URL the client can access
- Landing page is presentable (not necessarily final)

## Non-goals

- 80% test coverage (quality goal, not demo prerequisite)
- Payment integration
- Complete i18n coverage
- Production deployment
- Variant app verification

## Current State

### Verified (2026-02-09)
- ✅ Config files restored (package.json, tsconfig.json, next.config.mjs, etc.)
- ✅ `pnpm --filter @apps/xa-c typecheck` passes
- ✅ `pnpm install` completes without errors
- ✅ File completeness check for tracked XA files (`git ls-files apps/xa` existence check) found no missing tracked files
- ✅ Dev server stability + route checks pass after clean restart (`/`, `/women/clothing`, `/products/mini-parka`, `/cart`, `/wishlist`, `/api/health`)
- ✅ Worker parity build path completes locally (`build-xa.mjs` + `opennextjs-cloudflare build` + `wrangler dev`)
- ✅ Targeted flow tests pass (`pages.smoke`, `productPage`, `XaBuyBox`, `XaCartContext`, `XaWishlistContext`)

### Not Yet Verified
- ❓ Staging deploy completion and public staging URL validation (GitHub Action run currently stuck during checkout)

### Known Issues

| Issue | Severity | Blocking? |
|-------|----------|-----------|
| Test coverage at 0% enforced | Medium | No - not required for demo |
| Legacy landing content (XA-0001) | Medium | Maybe - needs assessment |
| `XA_ALLOWED_HOSTS` is not set in repo defaults; if enabled in Cloudflare env, hosts must include staging domain(s) | Medium | Maybe |
| `XA_REQUIRE_CF_ACCESS` defaults to `false`; enabling it without Access policy will 404 requests | High | Maybe |
| Non-CI production builds require `NEXTAUTH_SECRET`, `SESSION_SECRET`, `CART_COOKIE_SECRET` (Worker runtime also requires secure secrets) | High | Yes |
| GitHub Actions run `21833231931` is stuck in `actions/checkout@v4`, blocking staging verification | High | Yes |

## Reality Check / Critique (to avoid a paper exercise)

- The deploy path is now Cloudflare Workers + OpenNext (`@opennextjs/cloudflare`), so review readiness depends on Worker config parity (project/vars/secrets), not Pages config.
- `apps/xa/wrangler.toml` defaults to `XA_REQUIRE_CF_ACCESS=false` and does not hardcode `XA_ALLOWED_HOSTS`; preview hardening depends on environment configuration.
- `apps/xa/next.config.mjs` requires `NEXTAUTH_SECRET`, `SESSION_SECRET`, and `CART_COOKIE_SECRET` for non-CI production builds; Worker runtime still needs secure secret values.
- XA has a CI workflow at `.github/workflows/xa.yml`; the remaining gap is executing and validating staging deploy (`XA-READY-08`).
- The access/invite flow uses a file-backed store; Cloudflare Workers do not provide durable filesystem storage, so preview access should rely on env-based invite codes, not admin console persistence.

## Plan

### Phase 0: Discovery (must do first)

1. **XA-READY-00** - Audit file completeness post-recovery
   - Status: Complete (2026-02-09)
   - Scope: Compare current files against git history, identify any gaps beyond config files
   - DoD: ✅ Confirmation complete: no missing tracked files under `apps/xa` (`git ls-files apps/xa` existence check)

2. **XA-READY-01** - Start dev server and document current state
   - Status: Complete (2026-02-09)
   - Scope: Run `pnpm --filter @apps/xa-c dev`, document what works and what breaks
   - DoD: ✅ Written assessment:
     - Does server start? **Yes**
     - Does homepage render? **Yes** (`GET / -> 200`)
     - Console/server errors: **None after clean restart** (earlier stale `.next` chunk errors were operational and resolved by restart)
     - Hydration warnings: **None observed in server logs**
     - Broken UI elements: **None identified in route smoke checks**

3. **XA-READY-02** - Cloudflare Worker parity build (local)
   - Status: Complete (2026-02-09)
   - Scope: Run the Cloudflare-compatible build locally to catch runtime mismatches:
     - `pnpm --filter @apps/xa-c build`
     - `cd apps/xa && pnpm exec opennextjs-cloudflare build`
     - `cd apps/xa && pnpm exec wrangler dev .open-next/worker.js --local --port 3011`
   - DoD: ✅ Build + local Worker server validated.
     - Build completed successfully.
     - Worker local routes: `/` 200, `/women/clothing` 200, `/products/mini-parka` 200, `/cart` 200, `/wishlist` 200, `/api/health` 200.
     - Expected catalog gating: `/bags` and `/jewelry` return 404 in current clothing-only configuration.
   - Depends on: XA-READY-01

### Phase 1: Functional Demo (blocking for review)

4. **XA-READY-03** - Fix blocking runtime errors
   - Status: Complete (2026-02-09)
   - Scope: Address issues discovered in XA-READY-01/02 that prevent demo
   - DoD: ✅ No code fixes required; resolved operational blocker by restarting stale dev process and revalidating routes.
   - Depends on: XA-READY-01, XA-READY-02

5. **XA-READY-04** - Verify core user flows
   - Status: Complete (2026-02-09)
   - Scope: Test these specific flows:
     - Landing page loads with hero, featured products
     - Browse category (`/women/clothing` for current clothing-only catalog)
     - View product detail page
     - Add to cart, view cart
     - Add to wishlist, view wishlist
   - DoD: ✅ Flows verified.
     - Landing: `/` 200 with hero + featured products.
     - Browse: `/women/clothing` 200.
     - Product: `/products/mini-parka` 200.
     - Cart/Wishlist pages: `/cart` 200, `/wishlist` 200.
     - Add-to-cart/add-to-wishlist behavior covered by passing targeted tests (`XaBuyBox`, `XaCartContext`, `XaWishlistContext`).
   - Depends on: XA-READY-03

6. **XA-READY-05** - Fix flow-blocking issues
   - Status: Complete (2026-02-09)
   - Scope: Address issues from XA-READY-04 that break demo flows
   - DoD: ✅ No additional code changes required; no blocking flow defects remain for current demo scope.
   - Depends on: XA-READY-04

### Phase 2: Cloudflare Worker Deploy + CI (blocking for client review)

> **Approach decision (2026-02-08):** Use `@opennextjs/cloudflare` Worker deploy, matching Brikette production.
> See `docs/plans/xa-deploy-readiness-fact-find.md` for evidence. Old XA-READY-06/07/08 superseded by 06a–06d/07/08.

7. **XA-READY-06a** ✅ - Install OpenNext adapter and remove edge runtime
   - **Status:** Complete (2026-02-08)
   - **Commits:** `0f785adadc`
   - Added `@opennextjs/cloudflare` ^1.16.3 to `apps/xa/package.json` devDependencies
   - Removed `export const runtime = "edge"` from `robots.ts` and `search/sync/route.ts`
   - Validation: typecheck PASS, lint PASS, no edge runtime declarations remain

8. **XA-READY-06b** ✅ - Rewrite wrangler.toml to Worker format
   - **Status:** Complete (2026-02-08)
   - **Affects:** `apps/xa/wrangler.toml`
   - Rewrote from Pages format (`pages_build_output_dir`) to Worker format (`main` + `[assets]`)
   - Preserved `[vars]` (stealth config); dropped `[env.preview]`/`[env.backup]` (configured in CF dashboard)

9. **XA-READY-06c** ✅ - Update build script for OpenNext
   - **Status:** Complete (2026-02-08)
   - **Affects:** `.github/workflows/xa.yml` (build-cmd)
   - OpenNext build handled in workflow `build-cmd` (like Brikette production); `build-xa.mjs` unchanged for local dev
   - Build chain: `turbo build deps` → `build-xa.mjs` (Next.js + SW version) → `opennextjs-cloudflare build` → `leakage-scan.mjs`

10. **XA-READY-06d** ✅ - Configure GitHub environment and Cloudflare secrets
    - **Status:** Complete (2026-02-08)
    - **Depends on:** XA-READY-06b ✅
    - `xa-staging` environment is referenced by workflow and deploy configuration (secret/variable presence must be verified in GitHub settings)
    - Workflow uses `vars.XA_STAGING_PROJECT` with fallback `xa-site`
    - Worker runtime expects `XA_STEALTH_INVITE_CODES` secret (set outside repo)
    - Updated wrangler.toml: `XA_REQUIRE_CF_ACCESS=false`, `XA_STRICT_STEALTH=false` (invite-gate only, non-strict redirect)
    - Post-deploy TODO: `wrangler secret put SESSION_SECRET` + `wrangler secret put XA_STEALTH_INVITE_CODES` for Worker runtime

11. **XA-READY-07** ✅ - Update CI workflow for Worker deploy
    - **Status:** Complete (2026-02-08)
    - **Affects:** `.github/workflows/xa.yml`
    - Updated `build-cmd` to chain: `turbo build deps` → `build-xa.mjs` → `opennextjs-cloudflare build` → `leakage-scan.mjs`
    - Added `artifact-path: "apps/xa/.open-next"`
    - Changed `deploy-cmd` to `cd apps/xa && pnpm exec wrangler deploy`
    - Updated `project-name` and `environment-url` for Workers (not Pages)

12. **XA-READY-08** - Deploy to Cloudflare staging and verify
    - **Status:** In progress (2026-02-09) — blocked on CI runner progression
    - **Confidence:** 82% | **Effort:** M
    - **Depends on:** XA-READY-07, XA-READY-06d
    - Trigger CI workflow, verify staging URL responds, health check passes, invite flow works
    - Current run: `https://github.com/PeterCowling/base-shop/actions/runs/21833231931` (stuck at `actions/checkout@v4`)

### Phase 3: Presentation Polish (nice to have)

10. **XA-READY-09** - Assess landing page content
   - Status: Pending
   - Scope: Review XA-0001 lint warning, determine if content is demo-ready
   - DoD: Decision documented:
     - Option A: Content acceptable for demo as-is
     - Option B: Specific changes needed (list them)
     - Option C: Needs design input (blocker)

11. **XA-READY-10** - Landing page fixes (if needed)
   - Status: Pending
   - Scope: Implement changes from XA-READY-09 Option B
   - DoD: Landing page presentable for demo
   - Depends on: XA-READY-09 (only if Option B)

12. **XA-READY-11** - Prepare demo script
   - Status: Pending
   - Scope: Document the demo flow with talking points
   - DoD: One-page demo script covering:
     - What to show
     - What to say about each feature
     - Known limitations to mention
     - Questions to ask client

### Phase 4: Quality (post-review, parallel track)

These tasks improve quality but don't block client review:

13. **XA-READY-12** - Run lint checks
    - Status: Pending
    - Scope: `pnpm --filter @apps/xa-c lint`
    - DoD: No errors (warnings acceptable)

14. **XA-READY-13** - Establish test coverage baseline
    - Status: Pending
    - Scope: Run coverage report, document current %
    - DoD: Baseline number documented
    - Related: [XA-COV-01](xa-coverage-80-plan.md)

15. **XA-READY-14** - Progress toward 80% coverage
    - Status: Pending
    - Scope: Follow [XA 80% Coverage Plan](xa-coverage-80-plan.md)
    - DoD: Coverage plan tasks completed
    - Depends on: XA-READY-13

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Discovery reveals major gaps | Demo delayed | Do discovery first; surface issues early |
| Landing content unacceptable | Demo quality | Add "draft" watermark; set expectations with client |
| Preview deploy blocked by secrets | Can't share URL | Preflight env vars in XA-READY-06; fallback to local screen share |
| Client wants to see variants | Scope creep | Explain they're catalog variations; offer post-review |
| Cloudflare Access misconfigured | Preview 404s | Decide Access vs bypass in XA-READY-06; test with target emails |
| Host allowlist blocks preview | Preview 404s | Set `XA_ALLOWED_HOSTS` to include preview domain(s) |

## Dependencies

- [XA 80% Coverage Plan](xa-coverage-80-plan.md) - Quality track (Phase 4)
- Design/content input - Only if XA-READY-09 determines it's needed
- Cloudflare Workers project access + secrets

## Open Questions

- [ ] Confirm `XA_STAGING_PROJECT` value and resulting Workers URL pattern.
- [ ] Should preview require Cloudflare Access? If yes, which emails/groups?
- [ ] What is the demo invite code (XA_STEALTH_INVITE_CODES)?
- [ ] Who is the client contact for scheduling the review?
- [ ] Why is XA staging workflow run `21833231931` stalled in checkout on branch `staging`?

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| XA-READY-00 | INVESTIGATE | Audit file completeness | — | S | Complete (2026-02-09) | - | XA-READY-03 |
| XA-READY-01 | INVESTIGATE | Start dev server, document state | — | S | Complete (2026-02-09) | - | XA-READY-02, 03 |
| XA-READY-02 | INVESTIGATE | OpenNext Worker build (local) | — | M | Complete (2026-02-09) | 01, 06a | 03 |
| XA-READY-03 | IMPLEMENT | Fix blocking runtime errors | — | M | Complete (2026-02-09) | 01, 02 | 04 |
| XA-READY-04 | INVESTIGATE | Verify core user flows | — | S | Complete (2026-02-09) | 03 | 05 |
| XA-READY-05 | IMPLEMENT | Fix flow-blocking issues | — | M | Complete (2026-02-09) | 04 | 08 |
| XA-READY-06a | IMPLEMENT | Install OpenNext + remove edge runtime | 95% | S | Complete (2026-02-08) | - | 06b, 06c, 02 |
| XA-READY-06b | IMPLEMENT | Rewrite wrangler.toml to Worker format | 92% | S | Complete (2026-02-08) | 06a | 06c, 07 |
| XA-READY-06c | IMPLEMENT | Update build script for OpenNext | 88% | S | Complete (2026-02-08) | 06a | 07 |
| XA-READY-06d | IMPLEMENT | Configure GH env + CF secrets | 85% | S | Complete (2026-02-08) | 06b | 08 |
| XA-READY-07 | IMPLEMENT | Update CI workflow for Worker deploy | 88% | M | Complete (2026-02-08) | 06b, 06c | 08 |
| XA-READY-08 | IMPLEMENT | Deploy to staging + verify | 82% | M | In progress (blocked) | 07, 06d | 09 |

> Phase 2 overall confidence: 87% (effort-weighted). All tasks ≥80%.

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 0 | ~~XA-READY-06a~~ ✅, ~~XA-READY-00~~ ✅, ~~XA-READY-01~~ ✅ | - | Discovery + adapter install |
| 1 | ~~XA-READY-06b~~ ✅, ~~XA-READY-06c~~ ✅ | 06a ✅ | Wrangler + build script |
| 2 | ~~XA-READY-02~~ ✅, ~~XA-READY-07~~ ✅, ~~XA-READY-06d~~ ✅ | 01+06a, 06b+06c, 06b | Local build test + secrets |
| 3 | ~~XA-READY-03~~ ✅ | 01, 02 | Fix runtime errors |
| 4 | ~~XA-READY-04~~ ✅ | 03 | Verify flows |
| 5 | ~~XA-READY-05~~ ✅ | 04 | Fix flow issues |
| 6 | XA-READY-08 | 07, 06d, 05 | Deploy and verify |

**Max parallelism:** 3 | **Critical path:** 7 waves | **Phase 2 tasks:** 6 (XA-READY-06a through 08)

## Active Tasks

| Task | Status | Blocked by |
|------|--------|------------|
| XA-READY-08 | In progress (blocked) | GitHub Actions run `21833231931` stalled during checkout |

Next infrastructure task: unblock/complete XA-READY-08 (staging deploy + verify) after workflow execution advances beyond checkout.

## Decision Log

- 2026-01-21: Plan created with generic deployment approach
- 2026-02-03: `.github/workflows/xa.yml` added (uses `next-on-pages`)
- 2026-02-08: Fact-check corrected outdated claims (CI workflow exists, `XA_ALLOWED_HOSTS` not set)
- 2026-02-08: Fact-find completed (`xa-deploy-readiness-fact-find.md`) — compared Brikette production deploy with XA gaps
- 2026-02-08: **Approach decision:** Use `@opennextjs/cloudflare` Worker deploy (matching Brikette production). Phase 2 tasks rewritten with concrete, evidence-based acceptance criteria.
- 2026-02-08: **XA-READY-06a complete.** Installed `@opennextjs/cloudflare`, removed edge runtime from `robots.ts` and `search/sync/route.ts`. Typecheck + lint pass. Commit: `0f785adadc`.
- 2026-02-08: **XA-READY-06b, 06c, 07 complete.** Rewrote `wrangler.toml` to Worker format, updated CI workflow with OpenNext build chain + artifact handoff + `wrangler deploy`.
- 2026-02-08: **XA-READY-06d complete.** Workflow/environment wiring updated for `XA_STAGING_PROJECT` + `XA_STEALTH_INVITE_CODES` expectations. Wrangler.toml updated for staging defaults (`CF_ACCESS=false`, `STRICT=false`).
- 2026-02-09: Fact-check update (Audit-Ref `9c344c9ee9`): corrected stale Pages-era statements, updated local parity commands to OpenNext Worker flow, and aligned known issues/dependencies/open questions with current repo state.
- 2026-02-09: **XA-READY-00 through XA-READY-05 complete.** Local dev + Worker parity validated; core demo flows verified; no code changes required for flow blockers.
- 2026-02-09: Triggered XA staging workflow dispatch on `staging` twice. Earlier run (`21833151966`) was cancelled by workflow concurrency; latest run (`21833231931`) is still stalled at `actions/checkout@v4`. XA-READY-08 remains in progress/blocked pending CI runner progression.
