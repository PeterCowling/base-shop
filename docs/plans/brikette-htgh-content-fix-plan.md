---
Type: Plan
Status: Active
Domain: Apps/Brikette
Last-reviewed: 2026-01-20
Relates-to charter: docs/i18n/i18n-charter.md
---

# Plan: Fix Brikette How-to-Get-Here Content Loading for Next.js SSG

## Problem Summary

The brikette app build fails during static page generation with:
```
Error: Missing how-to-get-here locale content
```

**Failure condition (pre-fix):** `apps/brikette/src/routes/how-to-get-here/content.ts` threw when `splitRouteModules` was empty, which happened when the module discovery mechanism produced no locale JSON modules in the Next.js SSG runtime.

**Important correction:** `import.meta.webpackContext` is a webpack feature (not Vite-specific). This repo already wraps it via `apps/brikette/src/utils/webpackGlob.ts`. `import.meta.glob` is Vite-specific and is expected to be unavailable in Next.js.

**Single way forward (chosen):** stop relying on a build-time “glob map” (which is bundler-dependent) and load the JSON modules via standard dynamic imports that Next/webpack can reliably include in SSG builds.

## Audit Results

### Content Files Status
All 18 supported locales have complete content:
- **Locales:** ar, da, de, en, es, fr, hi, hu, it, ja, ko, no, pl, pt, ru, sv, vi, zh
- **Route files per locale:** 24 JSON files each
- **Location:** `apps/brikette/src/locales/{lang}/how-to-get-here/routes/*.json`

### Content File Naming Convention
Route definitions reference a `contentKey` that maps directly to a JSON filename (without `.json`), for example:
- `contentKey = "howToGetHereAmalfiPositanoBus"` → `howToGetHereAmalfiPositanoBus.json`
- Slugs (e.g. `amalfi-positano-bus`) map to `contentKey` via the route definitions layer, not by filename heuristics.

### Affected Routes
1. `/directions/{slug}` - Non-localized routes (defaults to English)
2. `/{lang}/{how-to-get-here-slug}/{slug}` - Localized routes (e.g., `/zh/ruhe-daoda/amalfi-positano-bus`)

## Current Implementation (post-fix)

`apps/brikette/src/routes/how-to-get-here/content-modules.ts` loads per-route JSON via dynamic import:
- `import(\`../../locales/${lang}/how-to-get-here/routes/${contentKey}.json\`)`
- constrained with a `webpackInclude` regex so the Next build reliably includes only the relevant JSON modules

`apps/brikette/src/routes/how-to-get-here/content.ts` no longer uses a module-init “HAS_LOCALE_CONTENT” gate. Instead, missing content for a known route definition now throws a clear developer error that includes `lang`, `fallback`, and `contentKey`.

## Why This Approach

- Most future-proof for Next.js: relies on standard `import()` that works across bundlers, not on webpack-only `import.meta.webpackContext`.
- Client-safe: avoids module-scope `fs` imports and avoids shipping a Node-only loader into client bundles.
- Maintains existing behavior: still supports locale fallback to English; missing content for known routes becomes a hard error (better than silently producing 404s for every page).

## Implementation Steps

### Step 1: Switch to dynamic imports for route JSON modules

- Update `apps/brikette/src/routes/how-to-get-here/content-modules.ts` to load modules with `import()` and a `webpackInclude` regex.
- Remove the `splitRouteModules` “glob map” entirely.

### Step 2: Replace the “empty module map” sentinel with a real missing-content error

- Update `apps/brikette/src/routes/how-to-get-here/content.ts` to remove the module-init guard and throw a developer error if neither the locale nor fallback JSON exists for a known `contentKey`.

### Step 3: Add a regression test that content files exist for all locales

- Add `apps/brikette/src/routes/how-to-get-here/__tests__/content-files.test.ts` to assert every `contentKey` in `src/data/how-to-get-here/routes.json` exists for every locale under `src/locales/*/how-to-get-here/routes/`.

### Step 4: Verify Build

Run the brikette build to verify the fix:
```bash
cd apps/brikette && rm -rf .next
pnpm build
```

### Step 5: Targeted runtime smoke

In dev, verify at least one localized route and one default route renders without throwing:
- `/directions/amalfi-positano-bus`
- `/zh/ruhe-daoda/amalfi-positano-bus` (or any known slug)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Dynamic import bundling misses JSON modules | Low | High | Keep the import path rooted under `src/locales` and constrain with `webpackInclude` |
| Silent 404s on missing content | Low | High | Throw a developer error when both locale and fallback content are missing |

## Testing Plan

1. **Typecheck**: `pnpm --filter @apps/brikette typecheck`
2. **Targeted test**: `pnpm --filter @apps/brikette test -- src/routes/how-to-get-here/__tests__/content-files.test.ts`
3. **Build (when the app’s other prerender blockers are resolved)**: `pnpm --filter @apps/brikette build`

## Success Criteria

- [ ] `pnpm --filter @apps/brikette build` completes without "Missing how-to-get-here locale content" error
- [ ] All 24 direction routes generate successfully
- [ ] All 18 locales × 24 routes generate (432 localized route pages)
- [ ] No regression in existing functionality
