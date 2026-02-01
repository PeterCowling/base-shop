---
Type: Fact-Find
Outcome: Planning
Status: Needs-input
Domain: Commerce
Created: 2026-02-01
Last-updated: 2026-02-01
Feature-Slug: xa-publish-privacy
Related-Plan: docs/plans/xa-publish-privacy-plan.md
---

# XA Publishing + Privacy Fact-Find Brief

## Scope
### Summary
You asked: “If I want to get the XA apps published but do not want any trace of them being linked to me, what do I need to do?”

Repo evidence indicates “XA apps” refers to the `apps/xa*` set of Next.js + Cloudflare deployments (not native mobile apps). Publishing in this repo’s current shape is primarily **Cloudflare Pages (Next.js on Pages via `@cloudflare/next-on-pages`)** plus a Cloudflare Worker for uploads.

### Goals
- Identify what “XA apps” are in this repo and how they’re intended to be deployed.
- Map the current deploy pipeline patterns used in this repo, and what would be required to publish XA similarly.
- Identify where “traceability” exists (public-facing vs platform/internal) and what can be reduced **without deception or policy violations**.

### Non-goals
- Guidance on evading identity/KYC/verification requirements (Cloudflare/GitHub/App Stores) or obscuring accountability.
- Rewriting git history to remove attribution.
- Implementing workflows/config changes (fact-find only).

### Constraints & Assumptions
- Constraints:
  - XA apps are configured for **stealth** behavior (host allowlist + Cloudflare Access gating + noindex), which affects “published” vs “publicly accessible”.
  - Cloudflare/GitHub will always retain internal records tying deployments to the owning account/org.
- Assumptions (needs confirmation):
  - “Published” means “deployed to a shareable URL (client preview and/or production)” rather than “submitted to Apple/Google stores”.

## Repo Audit (Current State)

### Entry Points
- `apps/xa/package.json` — main XA storefront app (`@apps/xa-c`) with Next.js build script `node ./scripts/build-xa.mjs`.
- `apps/xa-b/package.json` — variant storefront (`@apps/xa-b`).
- `apps/xa-j/package.json` — variant storefront (`@apps/xa-j`).
- `apps/xa-uploader/package.json` — internal uploader console app (`@apps/xa-uploader`).
- `apps/xa-drop-worker/package.json` — Cloudflare Worker for uploads (`@apps/xa-drop-worker`).

### Deploy / Publishing Mechanism (observed patterns)
- `.github/workflows/reusable-app.yml` — shared “lint → typecheck → test → build → (deploy on main)” pipeline; deploy uses Cloudflare secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`).
- Example callers:
  - `.github/workflows/skylar.yml` — deploys via `wrangler pages deploy` (static export).
  - `.github/workflows/brikette.yml` — deploys via `pnpm exec next-on-pages deploy` (Next.js on Pages).
  - `.github/workflows/cms.yml` — deploys via `pnpm exec next-on-pages deploy`.
- No XA workflow present under `.github/workflows/` (so XA deploy is currently manual / not wired in CI).

### Access/Stealth Controls (publishing vs discoverability)
- `apps/xa/wrangler.toml` — Cloudflare Pages config for `xa-site` with vars set to stealth and an allowlisted host (`XA_ALLOWED_HOSTS = "thestylemarket.shop"`). Preview env repeats these values.
- `apps/xa/middleware.ts` — enforces:
  - Host allowlist in production (`XA_ALLOWED_HOSTS`).
  - “Strict stealth” behavior returns 404 for non-invited users (`XA_STRICT_STEALTH`).
  - Optional Cloudflare Access header requirement (`XA_REQUIRE_CF_ACCESS` checks `cf-access-*` headers).
  - Optional guard token header (`XA_GUARD_TOKEN` checked via `x-xa-guard`).
- `apps/xa/src/app/robots.ts` — when stealth is enabled, disallows indexing for all user agents; otherwise defaults to disallow unless `XA_ALLOW_INDEXING === "true"`.

### Required Secrets / Env (for production builds + access)
- `apps/xa/next.config.mjs` — production builds require:
  - `NEXTAUTH_SECRET` (>= 32 chars)
  - `SESSION_SECRET` (>= 32 chars)
  - `CART_COOKIE_SECRET`
- `apps/xa/src/lib/stealth.ts` and `apps/xa/middleware.ts` — access controls and tokens rely on:
  - `XA_ACCESS_COOKIE_SECRET` (falls back to `SESSION_SECRET` / `NEXTAUTH_SECRET`)
  - `XA_STEALTH_INVITE_CODES` (invite keys)
  - `XA_ACCESS_ADMIN_TOKEN` (admin token)
  - `XA_INVITE_HASH_SECRET` (defaults to access cookie secret)
  - `XA_GUARD_TOKEN` (optional header token)

### Traceability Notes (repo-level)
- `apps/xa/scripts/build-xa.mjs` — sets `NEXT_PUBLIC_XA_SW_VERSION` from CI env vars or `git rev-parse` (short SHA). This can leak a build identifier into the client bundle; if the repo is public, it can help correlate to a specific commit.
- `apps/xa/wrangler.toml` — includes a real domain (`thestylemarket.shop`) in committed config; if this repo becomes public, that domain association becomes public too.

### Tests & Quality Gates (relevant to “publish”)
- `apps/xa` has security-related tests (e.g., `apps/xa/src/__tests__/nextConfig.security.test.ts` and `apps/xa/src/lib/__tests__/stealth.test.ts`) that assert aspects of config/stealth behavior.
- The repo’s reusable workflow runs `lint`, `typecheck`, and `test` for an app before deployment (`.github/workflows/reusable-app.yml`).

## Dependency & Impact Map
- Upstream dependencies:
  - Cloudflare Pages / Workers deployment toolchain: `@cloudflare/next-on-pages`, `wrangler` (root `package.json`).
  - GitHub Actions secrets and environments: `.github/workflows/reusable-app.yml`.
- Downstream dependents:
  - Client access experience depends on Cloudflare Access config + allowlisted hosts + invite cookie issuance (`apps/xa/middleware.ts`, `apps/xa/src/app/access/page.tsx`).
- Likely blast radius:
  - Any change to publish XA will touch `.github/workflows/*`, Cloudflare project config/env vars, and possibly `apps/xa/wrangler.toml`.

## Questions
### Resolved
- Q: What are the “XA apps” in this repo?
  - A: `apps/xa` (main), variants `apps/xa-b` and `apps/xa-j`, plus supporting `apps/xa-uploader` (console) and `apps/xa-drop-worker` (worker). Evidence: `apps/xa/package.json`, `apps/xa-b/package.json`, `apps/xa-j/package.json`, `apps/xa-uploader/package.json`, `apps/xa-drop-worker/package.json`.
- Q: What does “publish” likely mean in this repo?
  - A: Deploy to Cloudflare Pages (Next.js on Pages via `next-on-pages`) using the repo’s reusable GitHub Actions deploy pattern. Evidence: `.github/workflows/reusable-app.yml`, `.github/workflows/brikette.yml`, `.github/workflows/cms.yml`, `apps/xa/wrangler.toml`.

### Open (User Input Needed)
- Q: When you say “published”, do you mean:
  - a) Cloudflare Pages preview URL for client review, b) production + custom domain, or c) Apple/Google app stores?
  - Why it matters: the “no trace” constraints are radically different for web preview vs app store distribution.
  - Decision impacted: which pipeline and accounts must exist (Cloudflare/GitHub only vs Apple/Google developer programs).
- Q: When you say “no trace linked to me”, what scope do you mean?
  - a) Not publicly attributable (no personal name/email in public metadata), or
  - b) Not attributable even to platform operators (Cloudflare/GitHub/App Stores), or
  - c) Not attributable to the client?
  - Why it matters: (b) is not realistically achievable without deception/policy violations; (a) is achievable via an organization/legal entity with privacy-forward configuration.
- Q: Is this repo intended to be public?
  - Why it matters: public repo + embedded build SHA (`NEXT_PUBLIC_XA_SW_VERSION`) + committed domains increase correlation and attribution surfaces.

## Confidence Inputs (for /plan-feature)
- **Implementation:** 80%
  - Evidence: established deploy pattern exists (`reusable-app.yml`, `brikette.yml`/`cms.yml`); XA already has Cloudflare Pages config (`apps/xa/wrangler.toml`).
  - Missing: clarity on target environments (preview vs prod) and which XA apps must be deployed.
- **Approach:** 65%
  - Evidence: XA already implements stealth/noindex and multiple gating layers.
  - Missing: your definition of “no trace” (public vs platform vs client) to select a compliant approach.
- **Impact:** 80%
  - Evidence: likely changes are localized to workflows + Cloudflare env vars; core app logic already supports stealth gating.
  - Missing: confirmation whether any other infrastructure (custom domains, Access policies, R2 buckets, Worker routes) must be created for this effort.

## Planning Constraints & Notes
- Must-follow patterns:
  - Prefer the repo’s reusable workflow (`.github/workflows/reusable-app.yml`) over bespoke pipelines.
  - Keep secrets out of git; use GitHub/Cloudflare environment variables (already the repo norm).
- Privacy constraint (compliance):
  - This repo can reduce public attribution (names/emails/domains) but cannot eliminate platform operator records tying deployments to account owners.

## Suggested Task Seeds (Non-binding)
- Create an XA deploy workflow analogous to `.github/workflows/brikette.yml` (likely `next-on-pages deploy`) targeting `apps/xa` and optionally variants.
- Document and provision required Cloudflare config:
  - Pages project(s) (e.g., `xa-site`), preview/prod env vars, and Cloudflare Access policy behavior relative to `XA_REQUIRE_CF_ACCESS` + `XA_ALLOWED_HOSTS`.
- If “public non-attribution” is the goal:
  - Ensure publishing accounts are organization-owned (GitHub org + Cloudflare account), and avoid personal identifiers in public-facing metadata (support email, domain WHOIS, app listing).
- If “not discoverable” is the goal:
  - Keep stealth mode enabled and ensure Cloudflare Access is configured; validate `XA_ALLOWED_HOSTS` includes the actual Pages/custom domain(s).

## Planning Readiness
- Status: Needs-input
- Blocking items:
  - Define what “published” means (web preview/prod vs app store).
  - Define what “no trace” means (public vs platform vs client).
- Recommended next step:
  - Answer the Open Questions above, then proceed to `/plan-feature` using `Feature-Slug: xa-publish-privacy`.

