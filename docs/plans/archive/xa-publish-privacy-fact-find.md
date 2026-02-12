---
Type: Fact-Find
Outcome: Planning
Status: Historical
Domain: Commerce / Deploy
Created: 2026-02-03
Last-updated: 2026-02-03
Feature-Slug: xa-publish-privacy
Related-Plan: docs/plans/xa-publish-privacy-plan.md
---

# XA Publishing + Privacy (Stealth Staging) — Fact-Find

## Summary

Create a **competitor-safe staging environment** for XA that a customer can demo without it being clear who the business is for. The objective is **attribution minimization** during demos (UI branding + technical introspection), not evasion of KYC/platform accountability.

Locked requirements (2026-02-03):
- Deploy staging on a **second Cloudflare account**.
- Use **generic branding** (no business identity in UI/metadata).
- Gate via **Cloudflare Access**.
- Use a **neutral `*.pages.dev` project name** (project name appears in the URL).

## Threat Model

Assume a competitor can inspect:
- HTML metadata + `view-source`
- response headers
- `/_next/static/*` bundles and sourcemaps (if present)
- network calls to third parties
- committed config and build output for hardcoded domains/identifiers

We do not attempt to remove platform operator attribution (Cloudflare/GitHub internal records).

## Repo Findings (Relevant Surfaces)

- XA storefront apps: `apps/xa` (`@apps/xa-c`), plus variants `apps/xa-b`, `apps/xa-j`.
- Deploy pipeline pattern: `.github/workflows/reusable-app.yml`.
- Stealth controls:
  - `apps/xa/middleware.ts` (host allowlist + stealth + optional Cloudflare Access header requirement)
  - `apps/xa/src/app/robots.ts` (disallow indexing when stealth enabled)
  - `apps/xa/src/lib/siteConfig.ts` + `apps/xa/src/app/layout.tsx` (branding + metadata)

## Test Landscape / Testability

- Existing tests: `apps/xa/src/__tests__/middleware.security.test.ts`, `apps/xa/src/__tests__/nextConfig.security.test.ts`.
- Added by this plan:
  - Stealth config test: `apps/xa/src/__tests__/privacy.stealth-config.test.ts`
  - Leakage scan script: `scripts/privacy/leakage-scan.mjs`

## Outcome

Plan is defined in:
- `docs/plans/xa-publish-privacy-plan.md`

