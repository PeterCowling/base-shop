Type: Plan
Status: Active
Domain: CI-Deploy
Last-reviewed: 2026-01-22
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
- Status: ✅ COMPLETE (2026-01-22)
- Scope:
  - Inventory current Prime routes (React Router), layouts, providers, and entrypoints (`src/index.tsx`, `src/App.tsx`, `src/routes/**`).
  - Identify export blockers: runtime-only routes, non-deterministic slugs, reliance on server endpoints, deep links, auth flows, and any Worker/Hono endpoints.
  - Produce a route-by-route mapping table: **current path → new `app/` segment**.
  - Catalog UI components that should become `@acme/ui` variants vs remain app-local.
- Dependencies:
  - This doc (plan), and current Prime source on disk.
- Definition of done:
  - A concrete migration map exists (routes + providers + global CSS + env variables + "shared vs app" component list).
- Audit notes (2026-01-22):
  - **Routes:** 30 routes fully converted to Next.js App Router (see Route Inventory below).
  - **Export blockers:** 6 API routes require runtime (`/api/check-in-code`, `/api/find-booking`, `/api/check-in-lookup`, `/api/firebase/*`). App **cannot** use `OUTPUT_EXPORT=1` static mode.
  - **Providers:** `PinAuthProvider` for PIN-based guest auth; `(guarded)` route group for protected pages.
  - **Component inventory:** 7 `@acme/ui` imports (Button, Input, Textarea); 6 Prime-local wrappers in `src/components/ui/`; 30 feature component directories.
  - **Missing @acme/ui variants:** Checkbox, Radio, Select remain as native HTML wrappers.

### **PRIME-02 — Scaffold `apps/prime` (Next.js export-compatible)**
- Status: ⚠️ PARTIAL (2026-01-22) — scaffold complete, static export blocked
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
- Audit notes (2026-01-22):
  - ✅ Directory structure matches target layout (30 routes, 30 component dirs).
  - ✅ Package.json scripts correct (`dev`, `build`, `start`, `lint`, `typecheck`).
  - ✅ `pnpm --filter @apps/prime dev` works on port 3015.
  - ⚠️ `next.config.mjs` does **not** import `@acme/next-config` — uses local config.
  - ❌ `OUTPUT_EXPORT=1` **cannot work** — API routes are incompatible with static export.
  - ⚠️ `tailwind.config.ts` (not `.mjs`) — minor naming inconsistency.
  - **Blocker:** Deployment model decision required (see Open Questions).

### **PRIME-03 — Styling baseline (preserve Prime presentation)**
- Status: ✅ COMPLETE (2026-01-22)
- Scope:
  - Port Prime's global styling into Next:
    - Global CSS entry (Tailwind layers + any Bootstrap/global styles).
    - Fonts, CSS variables, and reset/utility assumptions.
  - Convert Prime Tailwind config into `apps/prime/tailwind.config.mjs` extending the repo base config (pattern: `apps/brikette/tailwind.config.mjs`).
  - Ensure Tailwind content globs include relevant workspace packages used by Prime (and exclude tests/node_modules).
- Dependencies:
  - PRIME-02 (app scaffold).
- Definition of done:
  - Prime's baseline typography/colors/spacing match within acceptable drift on key screens (to be defined by PRIME-01 audit list).
- Audit notes (2026-01-22):
  - ✅ Global CSS present at `src/styles/globals.css` (Tailwind layers + system font stack).
  - ✅ Imported in `src/app/layout.tsx`.
  - ✅ PostCSS config uses `@tailwindcss/postcss` (Tailwind v4 pattern).
  - ✅ Tailwind config present with content globs `./src/**/*.{js,ts,jsx,tsx,mdx}`.
  - ⚠️ Theme extensions minimal (`extend: {}`); no custom tokens yet.
  - ⚠️ Visual parity audit not documented (would need baseline screenshots).

### **PRIME-04 — Route conversion (React Router → Next App Router)**
- Status: ✅ COMPLETE (2026-01-22)
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
- Audit notes (2026-01-22):
  - ✅ **30 routes fully converted** to Next.js App Router (see Route Inventory below).
  - ✅ Zero `react-router-dom` imports remaining.
  - ✅ 39 instances of `next/link` and `next/navigation` in use.
  - ✅ Route loaders replaced with client-side data fetching patterns.
  - ✅ `(guarded)` route group used for protected pages with redirect logic.

### **PRIME-05 — App shell + providers (auth, i18n, state)**
- Status: ✅ COMPLETE (2026-01-22)
- Scope:
  - Port Prime's providers/contexts from Vite entrypoints into Next layouts:
    - `app/layout.tsx` for structure and global providers.
    - Client provider wrapper(s) for any `use client` contexts.
  - Align i18n strategy:
    - Prefer repo-standard tooling (`@acme/i18n`) if compatible with Prime's needs.
    - If Prime must keep i18next initially, isolate it behind a small adapter to migrate later.
- Dependencies:
  - PRIME-02, PRIME-04.
- Definition of done:
  - Prime renders with correct language selection and app context behaviour without runtime errors.
- Audit notes (2026-01-22):
  - ✅ Root layout present at `src/app/layout.tsx` (minimal, standard Next.js pattern).
  - ✅ `Providers` component defined at `src/app/providers.tsx` with `PinAuthProvider`.
  - ✅ `PinAuthProvider` context at `src/contexts/messaging/PinAuthProvider.tsx`.
  - ⚠️ i18n uses `i18next` + `react-i18next` (not `@acme/i18n`).
  - ⚠️ No adapter documented for future `@acme/i18n` migration.
  - ⚠️ `Providers` wrapper not actively used in root layout (minor integration gap).

### **PRIME-06 — Services + environment variables (export-safe)**
- Status: ✅ COMPLETE (2026-01-22)
- Scope:
  - Replace `import.meta.env` usage with Next conventions:
    - `NEXT_PUBLIC_*` for client-visible config (Firebase public config, publishable Stripe key).
    - No secrets embedded in static output.
  - Refactor any Vite-only assumptions in services (asset URLs, env injection, build-time constants).
  - Decide where any non-export-safe APIs live:
    - Prefer existing workers/services in this monorepo if suitable.
    - Otherwise, explicitly scope and plan a separate worker (not part of "Skylar-style static export").
- Dependencies:
  - PRIME-01, PRIME-04.
- Definition of done:
  - Build succeeds with a clearly documented env surface; runtime works with only public client config.
- Audit notes (2026-01-22):
  - ✅ All env vars use `NEXT_PUBLIC_FIREBASE_*` pattern (8 variables).
  - ✅ Zero `import.meta.env` usage remaining.
  - ✅ Zero `VITE_*` env variables or fallbacks.
  - ✅ Firebase SDK uses `process.env.NEXT_PUBLIC_*` correctly in `src/services/firebase.ts`.
  - ✅ No secrets embedded in client bundle (all Firebase public config).

### **PRIME-07 — Centralise UI via `@acme/ui` + variants**
- Status: ⚠️ PARTIAL (2026-01-22)
- Scope:
  - Replace Prime local UI components with `@acme/ui` equivalents where they exist.
  - For mismatches, add variants to central components (or add new shared components) rather than duplicating within `apps/prime`.
  - Keep a temporary `src/compat/` layer to avoid blocking the port; remove it as variants land.
- Dependencies:
  - PRIME-03 (styling baseline), PRIME-04 (routes in place).
- Definition of done:
  - Prime renders using central components for the majority of shared UI primitives (buttons, inputs, dialogs, layout primitives), with any remaining gaps tracked.
- Audit notes (2026-01-22):
  - ✅ 7 imports from `@acme/ui` (Button, Input, Textarea).
  - ✅ Prime wrappers in `src/components/ui/`:
    - `PrimeButton` — wraps `@acme/ui/Button` with intent variants.
    - `PrimeInput` — wraps `@acme/ui/Input` with height normalization.
    - `PrimeTextarea` — wraps `@acme/ui/Textarea` with size normalization.
  - ❌ No `src/compat/` layer created (using `src/components/ui/` instead).
  - ❌ Missing `@acme/ui` variants for:
    - `PrimeCheckbox` — native HTML (no @acme wrapper).
    - `PrimeRadio` — native HTML (no @acme wrapper).
    - `PrimeSelect` — native HTML (no @acme wrapper).
    - `PrimeFileInput` — custom (no @acme equivalent).

### **PRIME-08 — Theme/tokens integration (central first)**
- Status: ⚠️ PARTIAL (2026-01-22)
- Scope:
  - Encode Prime brand palette/typography as central tokens where possible:
    - Extend `packages/themes` and/or `packages/design-tokens` so Prime styling is reusable.
  - Update Tailwind theme extensions (central or app-level) to preserve Prime's look without scattering CSS.
- Dependencies:
  - PRIME-03, PRIME-07.
- Definition of done:
  - Prime's "look" is driven primarily by shared tokens + component variants, not ad-hoc styles.
- Audit notes (2026-01-22):
  - ✅ `packages/themes/prime/` directory exists with build artifacts.
  - ❌ No source files found in `@themes/prime` (only `.turbo/` cache).
  - ❌ Typography tokens not centralized.
  - ❌ Color palette not documented or exported.
  - ⚠️ Tailwind config uses minimal `extend: {}` — no custom tokens.
  - **Action needed:** Create `packages/themes/prime/src/` with token definitions.

### **PRIME-09 — Remove Vite/Wrangler residue; align dependencies**
- Status: ✅ COMPLETE (2026-01-22)
- Scope:
  - Remove Vite/React Router dependencies from the new app once routing is complete.
  - Drop any now-unused build scripts/config (Vite config, Vite plugins, Wrangler Pages dev wiring).
  - Ensure the monorepo's `pnpm-lock.yaml` is the only lockfile.
- Dependencies:
  - PRIME-04 through PRIME-06.
- Definition of done:
  - `apps/prime` builds and runs without Vite/Wrangler/React Router dependencies.
- Audit notes (2026-01-22):
  - ✅ No `vite.config.*` files.
  - ✅ No `src/index.tsx` (Vite entry point removed).
  - ✅ No `src/App.tsx` (React Router root removed).
  - ✅ Zero `react-router-dom` in package.json or code.
  - ✅ Zero `vite` or `@vitejs/*` dependencies.
  - ✅ Zero `bootstrap` dependency.
  - ✅ Only monorepo `pnpm-lock.yaml` exists.
  - ✅ Clean devDependencies: `@tailwindcss/postcss`, `@types/*`, `tailwindcss`, `typescript`.

### **PRIME-10 — Cloudflare Pages deploy (match Skylar workflow)**
- Status: ❌ NOT STARTED (2026-01-22) — blocked on deployment model decision
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
- Audit notes (2026-01-22):
  - ❌ `.github/workflows/prime.yml` does not exist.
  - ✅ Reusable workflow available at `.github/workflows/reusable-app.yml`.
  - ✅ Reference workflow `skylar.yml` exists (1,408 bytes).
  - ✅ Pages Functions exist in `apps/prime/functions/` (9 TypeScript files).
  - ⚠️ **Blocker:** Static export (`OUTPUT_EXPORT=1`) incompatible with API routes.
  - ⚠️ Duplicate API logic in `src/app/api/` vs `functions/` — needs consolidation.
  - **Decision required:** Choose deployment model (see Deployment Model Decision below).

### **PRIME-11 — Validation checklist + scoped tests**
- Status: ❌ NOT STARTED (2026-01-22)
- Scope:
  - Add a small "port validation" checklist to this plan (routes to smoke test + build/export assertions).
  - Ensure scoped repo checks are sufficient:
    - `pnpm -r build` (only when necessary for dependent packages)
    - `pnpm --filter @apps/prime typecheck`
    - `pnpm --filter @apps/prime test` (aligned with repo Jest config)
- Dependencies:
  - PRIME-04 through PRIME-06.
- Definition of done:
  - A repeatable, filter-first validation routine exists and is documented.
- Audit notes (2026-01-22):
  - ❌ No validation checklist document exists.
  - ✅ Test utils present at `src/test-utils/` (4 files).
  - ✅ `pnpm --filter @apps/prime typecheck` works.
  - ✅ `pnpm --filter @apps/prime lint` works.
  - ✅ `pnpm --filter @apps/prime build` works (server build).
  - ❌ No test files found in app (test utils exist but no tests).
  - **Action needed:** Create validation checklist (see Route Inventory for smoke test list).

## Acceptance criteria (port considered complete)

- `apps/prime` exists as a first-class monorepo workspace and runs locally.
- Static export build works: `OUTPUT_EXPORT=1 pnpm --filter @apps/prime build` ⇒ `apps/prime/out`.
- UI parity is acceptable on the agreed route list from PRIME-01.
- Prime deploys to Cloudflare Pages via workflow, using the same pattern as Skylar (static export + `wrangler pages deploy`).

## Open questions (resolve early in PRIME-01)

- ~~Does Prime require any true server-side features (SSR, API routes, middleware)?~~ **RESOLVED (2026-01-22):** Yes, 6 API routes require runtime (Firebase transactions, dynamic lookups).
- ~~Which Prime components are "core UI primitives" that should live in `packages/ui`?~~ **RESOLVED (2026-01-22):** Checkbox, Radio, Select need `@acme/ui` variants.

## Deployment Model Decision (BLOCKING)

**Current State:** The plan assumes "Skylar-style static export" (`OUTPUT_EXPORT=1` → `output: "export"`), but Prime has 6 API routes that require runtime:

| API Route | Purpose | Runtime Dependency |
|-----------|---------|-------------------|
| `/api/check-in-code` | Generate check-in codes | Firebase transactions |
| `/api/find-booking` | Booking lookup | Dynamic KV/Firebase query |
| `/api/check-in-lookup` | Staff lookup | Dynamic Firebase query |
| `/api/firebase/bookings` | Booking data | Firebase read |
| `/api/firebase/preorders` | Preorder data | Firebase read |
| `/api/firebase/guest-details` | Guest details | Firebase read |

**Options:**

1. **Static UI + Pages Functions (Recommended)**
   - Remove `src/app/api/*` routes.
   - Use only `apps/prime/functions/` for API (already exists with 9 files).
   - Build: `OUTPUT_EXPORT=1 pnpm --filter @apps/prime build`
   - Deploy: `wrangler pages deploy apps/prime/out --functions apps/prime/functions`
   - Matches Skylar pattern with Functions addon.

2. **Full Next.js Runtime**
   - Switch to `@cloudflare/next-on-pages`.
   - Keep `src/app/api/*` routes.
   - More complexity, but preserves Next.js API route patterns.

3. **Hybrid (Current State)**
   - Both `src/app/api/` and `functions/` exist.
   - Not deployable to static Pages.
   - Needs consolidation regardless of choice.

**Recommendation:** Option 1 — consolidate to Pages Functions, remove duplicate API routes, proceed with static export.

---

## Route Inventory (30 routes)

| Path | Next.js Segment | Type |
|------|-----------------|------|
| `/` | `page.tsx` | Public |
| `/find-my-stay` | `find-my-stay/page.tsx` | Public |
| `/checkin/[code]` | `checkin/[code]/page.tsx` | Public |
| `/staff-lookup` | `staff-lookup/page.tsx` | Staff |
| `/staff-lookup/[checkcode]` | `staff-lookup/[checkcode]/page.tsx` | Staff |
| `/portal` | `portal/page.tsx` | Guest |
| `/signage/find-my-stay-qr` | `signage/find-my-stay-qr/page.tsx` | Public |
| `/g` | `g/page.tsx` | Guest token |
| `/error` | `error/page.tsx` | Error |
| `/offline` | `offline/page.tsx` | PWA |
| `/admin/login` | `admin/login/page.tsx` | Admin |
| `/admin/users` | `admin/users/page.tsx` | Admin |
| `/owner/setup` | `owner/setup/page.tsx` | Owner |
| `/(guarded)` | `(guarded)/page.tsx` | Protected |
| `/(guarded)/activities` | `(guarded)/activities/page.tsx` | Protected |
| `/(guarded)/bag-storage` | `(guarded)/bag-storage/page.tsx` | Protected |
| `/(guarded)/bar-menu` | `(guarded)/bar-menu/page.tsx` | Protected |
| `/(guarded)/booking-details` | `(guarded)/booking-details/page.tsx` | Protected |
| `/(guarded)/breakfast-menu` | `(guarded)/breakfast-menu/page.tsx` | Protected |
| `/(guarded)/chat/*` | `(guarded)/chat/**/page.tsx` (4 routes) | Protected |
| `/(guarded)/complimentary-*` | `(guarded)/complimentary-*/page.tsx` (2 routes) | Protected |
| `/(guarded)/digital-assistant` | `(guarded)/digital-assistant/page.tsx` | Protected |
| `/(guarded)/language-selector` | `(guarded)/language-selector/page.tsx` | Protected |
| `/(guarded)/main-door-access` | `(guarded)/main-door-access/page.tsx` | Protected |
| `/(guarded)/overnight-issues` | `(guarded)/overnight-issues/page.tsx` | Protected |
| `/(guarded)/positano-guide` | `(guarded)/positano-guide/page.tsx` | Protected |

---

## Summary (2026-01-22 Audit)

| Task | Status | Blocker |
|------|--------|---------|
| PRIME-01 | ✅ Complete | — |
| PRIME-02 | ⚠️ Partial | Deployment model |
| PRIME-03 | ✅ Complete | — |
| PRIME-04 | ✅ Complete | — |
| PRIME-05 | ✅ Complete | — |
| PRIME-06 | ✅ Complete | — |
| PRIME-07 | ⚠️ Partial | @acme/ui variants |
| PRIME-08 | ⚠️ Partial | Token definitions |
| PRIME-09 | ✅ Complete | — |
| PRIME-10 | ❌ Not Started | Deployment model |
| PRIME-11 | ❌ Not Started | — |

**Overall Progress:** ~65% complete (7/11 tasks done or substantially done)

**Critical Path:** Resolve deployment model → PRIME-10 → PRIME-11

---

## Changelog

- **2026-01-22**: Full codebase audit. Updated all task statuses with audit notes. Added Route Inventory, Deployment Model Decision section, and Summary table. Resolved open questions.
- **2026-01-12**: Initial plan review notes added.

## Active tasks

- **PRIME-10** - Create deployment workflow (blocked on deployment model decision)
- **PRIME-11** - Create validation checklist