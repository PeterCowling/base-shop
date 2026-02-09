---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Infra
Created: 2026-02-08
Last-updated: 2026-02-08
Feature-Slug: xa-deploy-readiness
Related-Plan: docs/plans/xa-client-readiness-plan.md
Audit-Ref: 42bc667052
---

# XA Cloudflare Deployment Readiness — Fact-Find Brief

## Scope

### Summary

The XA member rewards storefront (`apps/xa`) has a CI workflow (`.github/workflows/xa.yml`) but **cannot deploy** due to multiple infrastructure gaps. This fact-find compares against the working Brikette deployment and identifies exactly what must change.

### Goals

- XA deploys to Cloudflare via CI (staging branch push or workflow_dispatch)
- Post-deploy health check passes
- Access control allows demo reviewers in

### Non-goals

- Production deployment (staging-only for now)
- Static export support (XA requires dynamic rendering)
- Variant apps (xa-b, xa-j) — same fixes apply later

### Constraints & Assumptions

- Constraints:
  - Must use `@opennextjs/cloudflare` (repo standard; `@cloudflare/next-on-pages` is deprecated per `docs/brikette-deploy-decisions.md`)
  - Must not commit real hostnames/domains to wrangler.toml
  - Secrets via SOPS or GitHub environment variables
  - OpenNext does NOT support `export const runtime = "edge"` — must be removed
- Assumptions:
  - Cloudflare account has capacity for another Workers project
  - `xa-staging` GitHub environment will be created with required secrets

## Repo Audit (Current State)

### Brikette (Working Reference)

| Aspect | Staging | Production |
|--------|---------|------------|
| **Adapter** | None (static export) | `@opennextjs/cloudflare` v1.16.3 |
| **Build** | `OUTPUT_EXPORT=1 next build` + route hiding | `opennextjs-cloudflare build` |
| **Output** | `out/` | `.open-next/` |
| **Deploy cmd** | `wrangler pages deploy out --project-name brikette-website --branch staging` | `wrangler deploy` |
| **Wrangler format** | N/A (CLI only) | Worker: `main = ".open-next/worker.js"` + `[assets]` |
| **Artifact** | `apps/brikette/out` | `apps/brikette/.open-next` |

### XA (Current Broken State)

| Aspect | Current | Problem |
|--------|---------|---------|
| **Adapter** | None installed | `pnpm exec next-on-pages deploy` will fail — package not in lockfile |
| **Build** | `node ./scripts/build-xa.mjs` (wraps `next build` + SW versioning) | Build works, but output isn't CF-compatible |
| **Output** | `.next/` (standard Next.js) | Need `.open-next/` for Worker deploy |
| **Deploy cmd** | `pnpm exec next-on-pages deploy --project-name ...` | Package missing; wrong adapter |
| **Wrangler format** | Pages: `pages_build_output_dir = ".vercel/output/static"` | Wrong format; directory doesn't exist |
| **Artifact** | Not specified | Deploy job has no build output |
| **Edge runtime** | 2 files declare `runtime = "edge"` | Breaks OpenNext |

### Key Modules

- `apps/xa/middleware.ts` — Multi-layer stealth access control
- `apps/xa/src/app/api/health/route.ts` — Health check endpoint
- `apps/xa/src/lib/accessStore.ts` — File-backed invite store (incompatible with Workers)
- `scripts/privacy/leakage-scan.mjs` — Pre-deploy hostname leak detection
- `scripts/validate-deploy-env.sh` — Pre-deploy secret validation

## Questions

### Resolved

- `@cloudflare/next-on-pages` is NOT installed anywhere (not in lockfile, not in any package.json)
- XA does NOT support static export (`next.config.mjs` explicitly overrides `OUTPUT_EXPORT`)
- `thestylemarket.shop` only appears in `scripts/privacy/leakage-scan.mjs` denylist
- `artifact-path` is optional in reusable workflow — both upload/download skipped when empty
- SOPS decrypt action handles missing files gracefully
- 2 files have `export const runtime = "edge"`: `robots.ts` and `search/sync/route.ts`

### Open (User Input Needed)

- Which Cloudflare account/project for XA? (default: same as Brikette, project `xa-site`)
- CF Access required for preview? (default: no — disable initially, app is invite-gated)
- `XA_ALLOWED_HOSTS` for staging? (default: set in CF dashboard per environment)

## Confidence Inputs

- **Implementation:** 85% — Brikette template exists; edge runtime removal straightforward
- **Approach:** 90% — `@opennextjs/cloudflare` is the repo standard
- **Impact:** 90% — XA is self-contained, low blast radius
- **Testability:** 60% — no deployment integration tests; health check enables post-deploy verification

## Planning Readiness

- Status: **Ready-for-planning**
- Open questions are non-blocking (have safe defaults)
