---
Type: Plan
Status: In Progress
Domain: Repo
Last-reviewed: 2026-01-24
Relates-to charter: docs/runtime/runtime-charter.md
Created: 2026-01-24
Created-by: Codex (GPT-5)
Last-updated: 2026-01-24
Last-updated-by: Codex (GPT-5)
---

# Plan: Re-enable linting for apps/cover-me-pretty

## Summary
Cover-me-pretty is the runtime storefront we use for e2e smoke flows, but its package currently skips eslint via a global ignore and a dummy `lint` script (see `eslint.config.mjs` and `apps/cover-me-pretty/package.json`). The next step in hardening the runtime is to run lint for this app so CI and pre-commit hooks start flagging regressions. That requires:

1. removing the special-case ignore,
2. wiring a real `lint` script inside the package,
3. cleaning the code so eslint can parse it with the shared rules (NextRequest imports, forbidden console usage, etc.), and
4. adding a cover-me-pretty–specific override so the existing prototype code keeps a reasonable complexity/length budget without silencing other checks.

## Goals/Oucomes
- `pnpm --filter @apps/cover-me-pretty lint` (and therefore `pnpm lint` + turbo) runs without errors.
- Developers get lint feedback before `git push`, preventing regressions in this runtime app.
- We keep the relaxed DS/TS warnings we already had while still enforcing import sorting, type-only imports, and DS checks for new files.

## Constraints
- The app currently has some legitimate architectural complexity (long API handlers, TryOnPanel client component, streaming SSE handler). Rather than rewrite everything at once, focus on targeted code fixes (type imports, console usages, promise param, React event typing) plus a scoped override for complexity/length to keep lint fast.
- ESLint is configured via the flat config (`eslint.config.mjs`), so overrides must be added in the correct order (our new override should come after the global LINT-01 block and before the test overrides so it can raise the thresholds for both runtime and test files without accidentally overriding the test-specific rules).

## Tasks
1. **Audit the current lint setup**: confirm `apps/cover-me-pretty` is in the ignore list, the package `lint` script is a no-op, and determine which rules fire when running `eslint --no-ignore`. (Status: ✅ done)
2. **Enable lint path/tests**: remove `apps/cover-me-pretty/**` from `eslint.config.mjs`'s ignore list and update the package's `lint` script to run `eslint .` (plus helpful flags if needed). (Status: 🟡 in progress)
3. **Code clean-up**:
   - Convert all `NextRequest` imports to type-only imports alongside a single `NextResponse` import.
   - Replace every `console.log` with an allowed method (`console.info`).
   - Update the single anonymous promise parameter to `resolve` so `promise/param-names` is satisfied.
   - Fix the TryOnPanel client component import/typing patterns so `import/no-duplicates` stops complaining (split the React type imports and reference them explicitly).
4. **Scoped ESLint override**: add a block to `eslint.config.mjs` that relaxes `complexity` and `max-lines-per-function` for `apps/cover-me-pretty/src/**/*` while keeping those rules active elsewhere.
5. **Validation**: run `pnpm exec eslint --no-ignore "apps/cover-me-pretty/src/**/*.{ts,tsx}"` and `pnpm --filter @apps/cover-me-pretty lint` to confirm the app is lint-clean, then rerun `pnpm lint` to confirm turbo sees it.
6. **Document and close the plan**: update this plan with the final status, note any outstanding work (e.g., future refactors to shrink complexity), and ensure `docs/plans/` record shows lint now enabled for cover-me-pretty.

## Acceptance Criteria
- `pnpm --filter @apps/cover-me-pretty lint` exits 0 with no ESLint errors.
- Root `pnpm lint` / `turbo run lint` now executes the cover-me-pretty package (no more ignore). `eslint --no-ignore "apps/cover-me-pretty/src/**/*.{ts,tsx}"` passes with zero errors.
- No `console.log` calls remain inside `apps/cover-me-pretty/src`.
- All API routes import `NextRequest` via `import type` and share a single `NextResponse` import.
- Lint continues to warn on the lightweight DS relaxations that already existed for this app, but there are no new errors introduced by the rules that triggered initially (complexity, promise param, max-lines, import duplicates).

## Follow-up / Future Work
If lint starts complaining about real complexity issues, we should refactor the API handlers (e.g., break `checkout-session` POST into smaller helpers, extract repeated SSE stream setup) or adjust the override accordingly. The override should eventually tighten once the code has been cleaned up.
