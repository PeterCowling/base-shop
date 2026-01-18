Type: Plan
Status: Active
Domain: CI-Deploy
Last-reviewed: 2026-01-12
Relates-to charter: docs/architecture.md

# Prime — Port Plan (Vite/React → Next.js App in Monorepo)

This plan ports `/Users/petercowling/prime` into this monorepo as `apps/prime`, converts it from React+Vite (React Router) to Next.js App Router, and deploys it to Cloudflare Pages using the same **static export** model as `apps/skylar`.

## Goals

- Add a new workspace app at `apps/prime` (Next.js 16 + React 19, aligned with repo patterns).
- Preserve Prime’s current presentation while increasing centralisation:
  - Prefer `@acme/ui` components where possible.
  - When Prime needs a unique look, add **variants** to central components (or add new shared components) rather than duplicating in-app.
  - Extend Tailwind and theme tokens centrally (packages) where practical; keep app-local CSS as the exception.
- Deploy Prime via Cloudflare Pages like Skylar:
  - `OUTPUT_EXPORT=1` Next static export (no SSR/runtime).
  - `wrangler pages deploy` of `apps/prime/out`.
  - No `@cloudflare/next-on-pages` unless the app cannot be made export-safe.

## Non-goals (for this port)

- Re-designing Prime’s UI/UX (the objective is parity first, then centralisation with minimal visual drift).
- Introducing SSR, API routes, middleware, or dynamic image optimisation in the initial deployment model.
- Consolidating every Prime dependency immediately (dependency reduction can follow once the app is stable in-repo).

## Core constraints / invariants

- **Cloudflare Pages static hosting** (Skylar model):
  - Output must be fully static (`next.config` `output: "export"` when `OUTPUT_EXPORT=1`).
  - No server-side code required at runtime.
  - Any sensitive secrets must not ship to the client bundle (static export implies build-time only).
- **Repo alignment**:
  - Use `@acme/next-config` and `@acme/tailwind-config` conventions (see `apps/skylar` as the reference).
  - TS config must extend `tsconfig.base.json` so workspace packages resolve to both `src` and `dist` (see `docs/tsconfig-paths.md`).
- **Centralised UI first**:
  - Prefer extending `packages/ui` / `packages/themes` over app-local component forks.

## Deployment model (match `apps/skylar`)

Reference implementation:

- Shared Next config: `packages/next-config/index.mjs`
  - Uses `OUTPUT_EXPORT=1` to enable `output: "export"` and `images.unoptimized`.
- CI workflow: `.github/workflows/skylar.yml`
  - `OUTPUT_EXPORT=1 pnpm --filter @apps/skylar... build`
  - `pnpm exec wrangler pages deploy apps/skylar/out --project-name skylar`

Prime should follow the same pattern with:

- Pages project name: `prime`
- Build artifact folder: `apps/prime/out`
- Workflow: `.github/workflows/prime.yml` (new, deploys to the Cloudflare-generated `prime.pages.dev` URL)

## Target workspace layout

```text
apps/
  prime/
    src/
      app/                  # Next App Router
      components/           # Prime-specific components (only when not shared)
      compat/               # temporary adapters while migrating to @acme/ui
      lib/                  # app-local glue (keep small; extract to packages where reusable)
    public/                 # static assets from Prime
    next.config.mjs
    postcss.config.cjs
    tailwind.config.mjs
    tsconfig.json
    package.json
```

## Active tasks

### **PRIME-01 — Prime audit + migration map**
- Status: ☐
- Scope:
  - Inventory current Prime routes (React Router), layouts, providers, and entrypoints (`src/index.tsx`, `src/App.tsx`, `src/routes/**`).
  - Identify export blockers: runtime-only routes, non-deterministic slugs, reliance on server endpoints, deep links, auth flows, and any Worker/Hono endpoints.
  - Produce a route-by-route mapping table: **current path → new `app/` segment**.
  - Catalog UI components that should become `@acme/ui` variants vs remain app-local.
- Dependencies:
  - This doc (plan), and current Prime source on disk.
- Definition of done:
  - A concrete migration map exists (routes + providers + global CSS + env variables + “shared vs app” component list).
  - Review notes (2026-01-12): route-by-route mapping table and “shared vs app” component inventory not found in docs.

### **PRIME-02 — Scaffold `apps/prime` (Next.js export-compatible)**
- Status: ☐
- Scope:
  - Create `apps/prime` based on repo conventions (use `apps/skylar` / `packages/template-app` as references).
  - `next.config.mjs` imports `@acme/next-config` so `OUTPUT_EXPORT=1` generates `apps/prime/out`.
  - Add `postcss.config.cjs`, `tailwind.config.mjs`, `tsconfig.json`, `next-env.d.ts`, and minimal `src/app` entry (`layout.tsx`, `page.tsx`).
  - Add `@apps/prime` scripts (`dev`, `build`, `start` where applicable, `lint`, `typecheck`, `test`).
- Dependencies:
  - `packages/next-config`, `tsconfig.base.json`, repo Tailwind config.
- Definition of done:
  - `pnpm --filter @apps/prime dev` runs locally and renders a placeholder page.
  - `OUTPUT_EXPORT=1 pnpm --filter @apps/prime build` produces `apps/prime/out`.

### **PRIME-03 — Styling baseline (preserve Prime presentation)**
- Status: ☐
- Scope:
  - Port Prime’s global styling into Next:
    - Global CSS entry (Tailwind layers + any Bootstrap/global styles).
    - Fonts, CSS variables, and reset/utility assumptions.
  - Convert Prime Tailwind config into `apps/prime/tailwind.config.mjs` extending the repo base config (pattern: `apps/brikette/tailwind.config.mjs`).
  - Ensure Tailwind content globs include relevant workspace packages used by Prime (and exclude tests/node_modules).
- Dependencies:
  - PRIME-02 (app scaffold).
- Definition of done:
  - Prime’s baseline typography/colors/spacing match within acceptable drift on key screens (to be defined by PRIME-01 audit list).
  - Review notes (2026-01-12): baseline styling is wired, but no documented visual parity pass against the audit list.

### **PRIME-04 — Route conversion (React Router → Next App Router)**
- Status: ☐
- Scope:
  - Translate each route from `src/routes/**` to Next `src/app/**/page.tsx` segments.
  - Replace navigation (`react-router-dom`) with `next/link` and `next/navigation`.
  - Convert route loaders/effects into export-safe patterns:
    - Prefer client-side data fetching when export requires it.
    - Avoid Next server-only features unless they still export deterministically.
- Dependencies:
  - PRIME-01 (route map), PRIME-02.
- Definition of done:
  - All primary routes render in Next with the same URL structure (or documented redirects if changed).

### **PRIME-05 — App shell + providers (auth, i18n, state)**
- Status: ☐
- Scope:
  - Port Prime’s providers/contexts from Vite entrypoints into Next layouts:
    - `app/layout.tsx` for structure and global providers.
    - Client provider wrapper(s) for any `use client` contexts.
  - Align i18n strategy:
    - Prefer repo-standard tooling (`@acme/i18n`) if compatible with Prime’s needs.
    - If Prime must keep i18next initially, isolate it behind a small adapter to migrate later.
- Dependencies:
  - PRIME-02, PRIME-04.
- Definition of done:
  - Prime renders with correct language selection and app context behaviour without runtime errors.
  - Review notes (2026-01-12): i18next still lives in app code with no adapter documented for a future @acme/i18n swap.

### **PRIME-06 — Services + environment variables (export-safe)**
- Status: ☐
- Scope:
  - Replace `import.meta.env` usage with Next conventions:
    - `NEXT_PUBLIC_*` for client-visible config (Firebase public config, publishable Stripe key).
    - No secrets embedded in static output.
  - Refactor any Vite-only assumptions in services (asset URLs, env injection, build-time constants).
  - Decide where any non-export-safe APIs live:
    - Prefer existing workers/services in this monorepo if suitable.
    - Otherwise, explicitly scope and plan a separate worker (not part of “Skylar-style static export”).
- Dependencies:
  - PRIME-01, PRIME-04.
- Definition of done:
  - Build succeeds with a clearly documented env surface; runtime works with only public client config.
  - Review notes (2026-01-12): Vite-specific log fallback remains (`VITE_LOG_LEVEL`).

### **PRIME-07 — Centralise UI via `@acme/ui` + variants**
- Status: ☐
- Scope:
  - Replace Prime local UI components with `@acme/ui` equivalents where they exist.
  - For mismatches, add variants to central components (or add new shared components) rather than duplicating within `apps/prime`.
  - Keep a temporary `src/compat/` layer to avoid blocking the port; remove it as variants land.
- Dependencies:
  - PRIME-03 (styling baseline), PRIME-04 (routes in place).
- Definition of done:
  - Prime renders using central components for the majority of shared UI primitives (buttons, inputs, dialogs, layout primitives), with any remaining gaps tracked.
  - Review notes (2026-01-12): checkbox/radio/select wrappers still live in-app; no @acme/ui variants yet, and the temporary compat layer is not documented.

### **PRIME-08 — Theme/tokens integration (central first)**
- Status: ☐
- Scope:
  - Encode Prime brand palette/typography as central tokens where possible:
    - Extend `packages/themes` and/or `packages/design-tokens` so Prime styling is reusable.
  - Update Tailwind theme extensions (central or app-level) to preserve Prime’s look without scattering CSS.
- Dependencies:
  - PRIME-03, PRIME-07.
- Definition of done:
  - Prime’s “look” is driven primarily by shared tokens + component variants, not ad-hoc styles.
  - Review notes (2026-01-12): `@themes/prime` exists, but typography tokens and broader palette coverage are not yet centralized.

### **PRIME-09 — Remove Vite/Wrangler residue; align dependencies**
- Status: ☐
- Scope:
  - Remove Vite/React Router dependencies from the new app once routing is complete.
  - Drop any now-unused build scripts/config (Vite config, Vite plugins, Wrangler Pages dev wiring).
  - Ensure the monorepo’s `pnpm-lock.yaml` is the only lockfile.
- Dependencies:
  - PRIME-04 through PRIME-06.
- Definition of done:
  - `apps/prime` builds and runs without Vite/Wrangler/React Router dependencies.
  - Review notes (2026-01-12): Vite entry file (`src/index.tsx`) and Vite log env fallback remain; unused deps (e.g. `bootstrap`) appear to linger.

### **PRIME-10 — Cloudflare Pages deploy (match Skylar workflow)**
- Status: ☐
- Scope:
  - Add `.github/workflows/prime.yml` mirroring `.github/workflows/skylar.yml`:
    - Build with `OUTPUT_EXPORT=1 pnpm --filter @apps/prime... build`
    - Deploy `apps/prime/out` via `wrangler pages deploy` with `--project-name prime`
  - Include Pages Functions for primetime endpoints (`--functions apps/prime/functions`)
    - Path filters include `apps/prime/**` and any dependent packages (`packages/ui`, `packages/themes`, etc.)
  - Document required secrets (reuse repo-level `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`) and Cloudflare setup steps (Pages project, domain/DNS).
- Dependencies:
  - PRIME-02 (export build output).
- Definition of done:
  - Prime can be deployed via GitHub Actions to the `prime` Pages project, producing a working static site.
  - Cloudflare-generated URL (`https://prime.pages.dev`) is documented (no custom domain required).

### **PRIME-11 — Validation checklist + scoped tests**
- Status: ☐
- Scope:
  - Add a small “port validation” checklist to this plan (routes to smoke test + build/export assertions).
  - Ensure scoped repo checks are sufficient:
    - `pnpm -r build` (only when necessary for dependent packages)
    - `pnpm --filter @apps/prime typecheck`
    - `pnpm --filter @apps/prime test` (aligned with repo Jest config)
- Dependencies:
  - PRIME-04 through PRIME-06.
- Definition of done:
  - A repeatable, filter-first validation routine exists and is documented.

## Acceptance criteria (port considered complete)

- `apps/prime` exists as a first-class monorepo workspace and runs locally.
- Static export build works: `OUTPUT_EXPORT=1 pnpm --filter @apps/prime build` ⇒ `apps/prime/out`.
- UI parity is acceptable on the agreed route list from PRIME-01.
- Prime deploys to Cloudflare Pages via workflow, using the same pattern as Skylar (static export + `wrangler pages deploy`).

## Open questions (resolve early in PRIME-01)

- Does Prime require any true server-side features (SSR, API routes, middleware)? If yes:
  - Can those be moved to existing workers/services so the UI remains static?
  - Or do we need to switch to a Cloudflare Next runtime (`@cloudflare/next-on-pages`) despite the "Skylar-style" preference?
- Which Prime components are "core UI primitives" that should live in `packages/ui` vs "product-specific" that should remain in `apps/prime`?

## Active tasks

- **PRIME-01** - Route inventory and parity analysis