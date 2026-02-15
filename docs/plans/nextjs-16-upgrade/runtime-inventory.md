---
Type: Fact-Find-Artifact
Domain: Platform
Workstream: Engineering
Created: 2026-02-15
Last-updated: 2026-02-15
Feature-Slug: nextjs-16-upgrade
---

# Request Interception Runtime Inventory (Middleware vs Proxy)

## Scope
Inventory all request interception entrypoints in the repo and classify each app’s feasible runtime:
- `middleware.ts` (Edge runtime)
- `proxy.ts` (Node runtime; Edge not supported in Next 16)

This artifact is used by `docs/plans/nextjs-16-upgrade/plan.md` TASK-02.

## Evidence Sources
- Interception entrypoints:
  - `find apps -path "apps/*/middleware.ts" -o -path "apps/*/src/middleware.ts"`
- Cloudflare/OpenNext indicator:
  - presence of `@opennextjs/cloudflare` in `apps/<app>/package.json`
  - presence of `build:worker: opennextjs-cloudflare build`
- Node-only dependency indicators inside middleware:
  - `import ... from "node:*"`, `crypto`, `http`, `helmet`

## Inventory Table

Legend:
- **Deployment target**: `Worker/Edge` means Cloudflare/OpenNext evidence exists. `Unknown` means no deploy evidence in-repo.
- **Policy recommendation**:
  - `Edge-required` => keep `middleware.ts` (accept deprecation); refactor to Web APIs only.
  - `Node-OK` => migrate to `proxy.ts` (remove `middleware.ts`).

| App | Interception file(s) | Primary purpose | Deployment target evidence | Node-only imports in interception | Policy recommendation | Notes |
|---|---|---|---|---|---|---|
| `@apps/brikette` | `apps/brikette/src/middleware.ts` | localized slug rewrites + redirect normalization | `apps/brikette/package.json` includes `@opennextjs/cloudflare` | none found | **Edge-required** | `middleware.ts` deprecation expected; cannot adopt `proxy.ts` on Workers today |
| `@apps/business-os` | `apps/business-os/src/middleware.ts` | auth guard (currently feature-flagged off) | `apps/business-os/package.json` includes `@opennextjs/cloudflare` and `build:worker` | none found | **Edge-required** | keep middleware; current file already avoids Node imports |
| `@apps/cms` | `apps/cms/middleware.ts` and `apps/cms/src/middleware.ts` | security headers + auth/CSRF guard | `apps/cms/package.json` includes `@opennextjs/cloudflare` and `build:worker` | `apps/cms/middleware.ts` imports `crypto`, `helmet`; `apps/cms/src/middleware.ts` imports `helmet` (+ Node `http` types) | **Edge-required** | deterministic issue: duplicate middleware entrypoints; must consolidate to one. `helmet` is Node-centric; replace with header composition in Edge-compatible code |
| `@apps/cover-me-pretty` | `apps/cover-me-pretty/middleware.ts` | i18n locale redirect + CSP injection for analytics | no Cloudflare/OpenNext evidence in `apps/cover-me-pretty/package.json` | imports `node:crypto` | **Unknown (default Edge-required is unsafe)** | decision required: if deployed on Node, migrate to `proxy.ts` and keep `crypto`. If deployed on Edge, rewrite hashing to Web Crypto (no Node imports) |
| `@apps/xa-c` | `apps/xa/middleware.ts` | stealth gating + headers for prelaunch | `apps/xa/package.json` includes `@opennextjs/cloudflare` | none found in file | **Edge-required (tentative)** | deployment likely Workers due to `@opennextjs/cloudflare`, but `apps/xa/package.json` lacks `build:worker`. Treat as Edge unless proven Node. Also note: `apps/xa/scripts/build-xa.mjs` runs `next build` without `--webpack` (separate hard-break; tracked in TASK-08 follow-up) |
| `@apps/xa-b` | `apps/xa-b/middleware.ts` | stealth gating + headers | no `@opennextjs/cloudflare` in `apps/xa-b/package.json` | none found in file | **Unknown (tentative Node-OK)** | likely a local/dev variant of XA; deploy target not evident. Conservative action is “no migration until confirmed.” Build script uses `scripts/build-xa.mjs` and already passes `--webpack` |
| `@apps/xa-j` | `apps/xa-j/middleware.ts` | stealth gating + headers | no `@opennextjs/cloudflare` in `apps/xa-j/package.json` | none found in file | **Unknown (tentative Node-OK)** | same as `xa-b`. Build script already passes `--webpack` |

## Findings

### 1) CMS middleware duplication is real and security-sensitive
`@apps/cms` has both `apps/cms/middleware.ts` and `apps/cms/src/middleware.ts` present.

Impact:
- Ambiguous interception entrypoints are brittle across Next versions and make audits harder.

### 2) Node-only imports are concentrated in CMS and cover-me-pretty interception
- `apps/cms/middleware.ts`: `crypto`, `helmet`
- `apps/cms/src/middleware.ts`: `helmet` (+ Node `http` types)
- `apps/cover-me-pretty/middleware.ts`: `node:crypto` for CSP hash

Impact:
- These are deterministic failures for Worker/Edge deployments.
- For Node deployments, the correct solution is `proxy.ts` (Next 16), not “try to make Node libs work in middleware”.

### 3) OpenNext/Cloudflare apps are effectively “Edge-interception only” today
Evidence:
- `@apps/brikette`, `@apps/business-os`, `@apps/cms` have explicit `@opennextjs/cloudflare` usage (and `build:worker` scripts for BOS and CMS).

Implication:
- For these apps, we should plan for: keep middleware + make it Web-API-only + accept middleware deprecation until upstream/platform support changes.

## What This Unblocks
- `docs/plans/nextjs-16-upgrade/plan.md` TASK-03 and TASK-04 can now be replanned with app-specific constraints.

