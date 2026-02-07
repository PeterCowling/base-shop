---
Type: Plan
Status: Done
Domain: Repo
Last-reviewed: 2026-02-07
Relates-to charter: docs/runtime/runtime-charter.md
Created: 2026-01-24
Created-by: Codex (GPT-5)
Last-updated: 2026-02-07
Last-updated-by: Claude (fact-check)
---

# Plan: Re-enable linting for apps/cover-me-pretty


## Active tasks

No active tasks at this time.

## Summary
Cover-me-pretty is the runtime storefront we use for e2e smoke flows. Linting is now fully enabled for this app. The package runs `eslint "src/**/*.{ts,tsx}" --cache --cache-location .eslintcache --max-warnings=0` and passes with zero errors. The work that was required:

1. removing the special-case ignore,
2. wiring a real `lint` script inside the package,
3. cleaning the code so eslint can parse it with the shared rules (NextRequest imports, forbidden console usage, etc.), and
4. adding a cover-me-pretty–specific override so the existing prototype code keeps a reasonable complexity/length budget without silencing other checks.

## Goals/Outcomes
- `pnpm --filter @apps/cover-me-pretty lint` (and therefore `pnpm lint` + turbo) runs without errors.
- Developers get lint feedback before `git push`, preventing regressions in this runtime app.
- We keep the relaxed DS/TS warnings we already had while still enforcing import sorting, type-only imports, and DS checks for new files.

## Constraints
- The app has legitimate architectural complexity (long API handlers, TryOnPanel client component, streaming SSE handler in `api/tryon/garment/route.ts`). Rather than rewrite everything at once, targeted code fixes were applied plus a scoped override for complexity/length.
- ESLint is configured via the flat config (`eslint.config.mjs`), and the cover-me-pretty override is placed after the global LINT-01 block and before the test overrides (at lines ~1928-1937 of `eslint.config.mjs`).

## Tasks
1. **Audit the current lint setup**: confirm `apps/cover-me-pretty` is in the ignore list, the package `lint` script is a no-op, and determine which rules fire when running `eslint --no-ignore`. (Status: ✅ done)
2. **Enable lint path/tests**: remove `apps/cover-me-pretty/**` from `eslint.config.mjs`'s ignore list and update the package's `lint` script. (Status: ✅ done — app is not in `tools/eslint-ignore-patterns.cjs`; lint script is `eslint "src/**/*.{ts,tsx}" --cache --cache-location .eslintcache --max-warnings=0`)
3. **Code clean-up**: (Status: ✅ done)
   - All `NextRequest` imports are already type-only (`import type { NextRequest }`).
   - No `console.log` calls remain in `apps/cover-me-pretty/src`.
   - The promise parameter is already named `resolve`.
   - TryOnPanel imports are clean (no `import/no-duplicates` violations).
4. **Scoped ESLint override**: (Status: ✅ done — override exists at `eslint.config.mjs` lines ~1928-1937 with `complexity: 45` and `max-lines-per-function: 400`)
5. **Validation**: (Status: ✅ done — `pnpm --filter "@apps/cover-me-pretty" lint` exits 0 with zero errors)
6. **Document and close the plan**: (Status: ✅ done — updated 2026-02-07 via fact-check)

## Acceptance Criteria
- `pnpm --filter @apps/cover-me-pretty lint` exits 0 with no ESLint errors.
- Root `pnpm lint` / `turbo run lint` now executes the cover-me-pretty package (no more ignore). `eslint --no-ignore "apps/cover-me-pretty/src/**/*.{ts,tsx}"` passes with zero errors.
- No `console.log` calls remain inside `apps/cover-me-pretty/src`.
- All API routes import `NextRequest` via `import type` and share a single `NextResponse` import.
- Lint continues to warn on the lightweight DS relaxations that already existed for this app, but there are no new errors introduced by the rules that triggered initially (complexity, promise param, max-lines, import duplicates).

## Follow-up / Future Work
If lint starts complaining about real complexity issues, we should refactor the API handlers (e.g., break `checkout-session` POST into smaller helpers — currently 237 lines, or extract the SSE stream setup duplicated within `api/tryon/garment/route.ts`) or adjust the override accordingly. The override should eventually tighten once the code has been cleaned up.
