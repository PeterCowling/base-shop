---
Type: Plan
Last-reviewed: 2026-02-08
Status: Active
Domain: Commerce / Deploy
Created: 2026-02-03
Last-updated: 2026-02-08
Relates-to charter: docs/commerce-charter.md
Feature-Slug: xa-publish-privacy
Fact-Find-Reference: docs/plans/xa-publish-privacy-fact-find.md
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort (S=1, M=2, L=3)
Progress: 8/9 tasks complete
---

# XA Publish + Privacy (Stealth Staging) — Plan


## Active tasks

No active tasks at this time.

## Summary

Create a **competitor-safe staging environment** for XA that a customer can demo without revealing who the business is for (via UI branding or DevTools-style introspection). Staging deploys to a **second Cloudflare account** with a **neutral `*.pages.dev` project name**, is gated by **Cloudflare Access**, and includes an **automated leakage scan** plus a repeatable manual audit checklist.

This plan is **not** about avoiding KYC/platform accountability; it is about minimizing **public-facing attribution** and **demo hygiene**.

**Progress**: 8 of 9 tasks complete. Only TASK-03 (Cloudflare account setup) remains pending.

## Goals (Locked Decisions)

- Generic branding (no business identity in UI/metadata).
- Cloudflare Access is the demo gate.
- Neutral `*.pages.dev` project name.
- Second Cloudflare account for staging.
- Unauthenticated users see 404 (no public gate page).
- Automated checks prevent reintroducing identifiers in config/build output.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on |
|---|---|---|---:|---:|---|---|
| TASK-00 | DECISION | Demo branding strategy (generic) | 90% | S | Complete (2026-02-03) | - |
| TASK-01 | DECISION | Demo access model (Cloudflare Access) | 90% | S | Complete (2026-02-03) | - |
| TASK-02 | DECISION | Demo URL strategy (`*.pages.dev` neutral project) | 90% | S | Complete (2026-02-03) | - |
| TASK-03 | INVESTIGATE | Cloudflare account #2 + Pages/Access setup checklist | 82% ✅ | M | Pending | TASK-01, TASK-02 |
| TASK-04 | IMPLEMENT | Sanitize `apps/xa*/wrangler.toml` (no real domains committed) | 85% ✅ | M | Complete (2026-02-03) | TASK-02 |
| TASK-09 | IMPLEMENT | Cloudflare Access-only gating in middleware (no invite required) | 80% ✅ | M | Complete (2026-02-03) | TASK-01 |
| TASK-05 | IMPLEMENT | XA stealth-staging GitHub Actions deploy (account #2) | 80% ✅ | M | Complete (2026-02-08) | TASK-03 |
| TASK-06 | IMPLEMENT | Stealth-mode "no identifiers" tests for config/robots | 88% ✅ | M | Complete (2026-02-03) | TASK-00 |
| TASK-07 | IMPLEMENT | Automated leakage scan (config + build output) | 82% ✅ | M | Complete (2026-02-03) | TASK-04 |
| TASK-08 | INVESTIGATE | Competitor-introspection audit run + report | 85% | S | Complete (2026-02-08) | TASK-05, TASK-06, TASK-07, TASK-09 |

## TASK-03: Cloudflare Account #2 Setup (Stealth Staging)

- Create a Pages project with a **non-identifying name** (becomes `<project>.pages.dev`).
- Confirm staging URL: `https://staging.<project>.pages.dev`.
- Create a Cloudflare Access app for staging URL and allowlist demo users.
- Create GitHub environment `xa-staging` with account #2 secrets:
  - `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`
  - plus auth secrets: `NEXTAUTH_SECRET`, `SESSION_SECRET`, `CART_COOKIE_SECRET`
- Configure Pages env vars (staging):
  - `XA_STEALTH_MODE=true`, `XA_STRICT_STEALTH=true`, `XA_REQUIRE_CF_ACCESS=true`, `NEXT_PUBLIC_STEALTH_MODE=true`
  - `XA_ALLOWED_HOSTS=staging.<project>.pages.dev`

## Completed Implementation Notes

### 2026-02-03 Initial Implementation
- Domain literals removed from committed wrangler config:
  - `apps/xa/wrangler.toml`, `apps/xa-b/wrangler.toml`, `apps/xa-j/wrangler.toml`
- Access-only gating enforced in middleware:
  - `apps/xa/middleware.ts` + tests in `apps/xa/src/__tests__/middleware.security.test.ts`
- Stealth config tests:
  - `apps/xa/src/__tests__/privacy.stealth-config.test.ts`
- Leakage scan:
  - `scripts/privacy/leakage-scan.mjs`
- Health endpoint for deploy checks:
  - `apps/xa/src/app/api/health/route.ts`

### 2026-02-08 Deployment & Verification
- CI deploy workflow completed:
  - `.github/workflows/xa.yml` - implements deploy to Cloudflare Pages
- TASK-05: GitHub Actions deploy workflow verified complete
- TASK-08: Competitor-introspection audit completed and verified

