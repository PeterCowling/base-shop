---
Type: Plan
Status: Active
Domain: Commerce
Last-reviewed: 2026-01-21
Relates-to charter: none
Created: 2026-01-21
Created-by: Claude
Last-updated: 2026-01-21
Last-updated-by: Claude
---

# XA Client Readiness Plan


## Active tasks

No active tasks at this time.

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

### Verified (2026-01-21)
- ✅ Config files restored (package.json, tsconfig.json, next.config.mjs, etc.)
- ✅ `pnpm --filter @apps/xa-c typecheck` passes
- ✅ `pnpm install` completes without errors

### Not Yet Verified
- ❓ Dev server starts and serves pages
- ❓ Runtime errors / hydration issues
- ❓ Core user flows functional
- ❓ File completeness after catastrophic recovery

### Known Issues

| Issue | Severity | Blocking? |
|-------|----------|-----------|
| Test coverage at 0% enforced | Medium | No - not required for demo |
| Legacy landing content (XA-0001) | Medium | Maybe - needs assessment |
| File completeness unknown | Unknown | Needs investigation |
| `XA_ALLOWED_HOSTS` only allows `thestylemarket.shop` (preview `*.pages.dev` will 404) | High | Yes |
| `XA_REQUIRE_CF_ACCESS=true` with no Access policy means all pages 404 | High | Yes |
| Production builds require `NEXTAUTH_SECRET`, `SESSION_SECRET`, `CART_COOKIE_SECRET` | High | Yes |
| No XA CI workflow / Cloudflare Pages project defined | High | Yes |

## Reality Check / Critique (to avoid a paper exercise)

- The plan assumes a generic preview deploy; this repo uses Cloudflare Pages + `@cloudflare/next-on-pages`, so we need a concrete Cloudflare path (project, env vars, Access policy, CI wiring).
- The current `apps/xa/wrangler.toml` settings will block preview access (`XA_ALLOWED_HOSTS` and `XA_REQUIRE_CF_ACCESS`), so preview readiness is not just "deploy" but "configure access correctly."
- `apps/xa/next.config.mjs` enforces secrets in production builds; Cloudflare builds will fail unless these are set in Pages env vars (not just `.env.local`).
- There is no CI workflow for XA; without one, "deploy to preview" is manual and brittle. If preview access is a requirement, a minimal workflow is a real prerequisite.
- The access/invite flow uses a file-backed store; Cloudflare Workers do not provide durable filesystem storage, so preview access should rely on env-based invite codes, not admin console persistence.

## Plan

### Phase 0: Discovery (must do first)

1. **XA-READY-00** - Audit file completeness post-recovery
   - Status: Pending
   - Scope: Compare current files against git history, identify any gaps beyond config files
   - DoD: List of missing files documented, or confirmation that recovery is complete

2. **XA-READY-01** - Start dev server and document current state
   - Status: Pending
   - Scope: Run `pnpm --filter @apps/xa-c dev`, document what works and what breaks
   - DoD: Written assessment with:
     - Does server start? (Y/N)
     - Does homepage render? (Y/N)
     - Console errors (list)
     - Hydration warnings (list)
     - Broken UI elements (list with screenshots)

3. **XA-READY-02** - Cloudflare Pages parity build (local)
   - Status: Pending
   - Scope: Run the Cloudflare-compatible build locally to catch runtime mismatches:
     - `pnpm --filter @apps/xa-c exec next-on-pages`
     - `pnpm --filter @apps/xa-c exec wrangler pages dev .vercel/output/static --compatibility-flag=nodejs_compat --port 3011`
   - DoD: Build completes and Pages dev server renders core routes; any CF-specific errors logged.
   - Depends on: XA-READY-01

### Phase 1: Functional Demo (blocking for review)

4. **XA-READY-03** - Fix blocking runtime errors
   - Status: Pending
   - Scope: Address issues discovered in XA-READY-01/02 that prevent demo
   - DoD: App starts and homepage renders without console errors
   - Depends on: XA-READY-01, XA-READY-02

5. **XA-READY-04** - Verify core user flows
   - Status: Pending
   - Scope: Test these specific flows:
     - Landing page loads with hero, featured products
     - Browse category (e.g., /bags or /jewelry)
     - View product detail page
     - Add to cart, view cart
     - Add to wishlist, view wishlist
   - DoD: Each flow works OR blocker documented
   - Depends on: XA-READY-03

6. **XA-READY-05** - Fix flow-blocking issues
   - Status: Pending
   - Scope: Address issues from XA-READY-04 that break demo flows
   - DoD: All 5 flows complete without errors
   - Depends on: XA-READY-04

### Phase 2: Cloudflare Preview + CI (blocking for client review)

7. **XA-READY-06** - Cloudflare Pages preflight (project + env + Access)
   - Status: Pending
   - Scope: Lock the Cloudflare deployment path and remove access blockers:
     - Confirm Cloudflare Pages is the target (matches repo CI + `next-on-pages` usage).
     - Create/confirm Pages project (name: `xa-site` or `xa-preview`).
     - Set Preview env vars in Pages:
       - Required secrets: `NEXTAUTH_SECRET`, `SESSION_SECRET`, `CART_COOKIE_SECRET`, `XA_ACCESS_COOKIE_SECRET`
       - Stealth access: `XA_STEALTH_MODE`, `XA_STEALTH_INVITE_CODES` (demo key)
       - Access gating: decide `XA_REQUIRE_CF_ACCESS` (true with Access policy, or false for preview)
       - Host allowlist: set `XA_ALLOWED_HOSTS` to include preview domain(s)
       - Canonical URLs: `NEXT_PUBLIC_SITE_DOMAIN` for preview domain
     - Decide how to set `NEXT_PUBLIC_XA_SW_VERSION` in CI (use build script or env var)
   - DoD:
     - Pages project exists with preview env vars configured
     - Access policy or access bypass decision recorded
     - Preview domain passes host allowlist
   - Depends on: XA-READY-05

8. **XA-READY-07** - CI workflow for XA preview deploys
   - Status: Pending
   - Scope: Add `.github/workflows/xa.yml` (or reuse `reusable-app.yml`) with:
     - `pnpm --filter @apps/xa-c lint`, `typecheck`, `test`
     - Cloudflare build/deploy via `next-on-pages`
     - `scripts/validate-deploy-env.sh` and `scripts/post-deploy-health-check.sh`
     - Path filters for `apps/xa/**` + shared deps
   - DoD: Workflow runs on PRs; deploys on `main` or `workflow_dispatch`.
   - Depends on: XA-READY-06

9. **XA-READY-08** - Deploy to Cloudflare preview
   - Status: Pending
   - Scope: Trigger the workflow (or deploy manually if CI is deferred), capture preview URL, and re-run core flows on preview.
   - DoD:
     - Preview URL accessible (with Access as configured)
     - Same flows work on preview as local
   - Depends on: XA-READY-07

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
- Cloudflare Pages project access + secrets

## Open Questions

- [ ] Confirm Cloudflare Pages project name and preview URL pattern.
- [ ] Should preview require Cloudflare Access? If yes, which emails/groups?
- [ ] What is the demo invite code (XA_STEALTH_INVITE_CODES)?
- [ ] Who is the client contact for scheduling the review?

## Active Tasks

| Task | Status | Blocked by |
|------|--------|------------|
| XA-READY-00 | Pending | - |
| XA-READY-01 | Pending | - |

Next: Complete discovery (Phase 0), including the Cloudflare parity build, before proceeding to fixes.
