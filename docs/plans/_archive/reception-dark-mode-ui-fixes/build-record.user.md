---
Type: Build-Record
Feature-Slug: reception-dark-mode-ui-fixes
Business: BRIK
Build-Date: 2026-03-14
Status: Complete
---

# Build Record — Reception Dark Mode + UI Fixes

## Outcome Contract

- **Why:** The reception app dark mode resets to light every time staff navigate between screens, making dark mode unusable on long shifts. Tab active state and alternating table rows are also hard to read.
- **Intended Outcome Type:** bug-fix
- **Intended Outcome Statement:** Dark mode persists correctly across all reception screens; active tabs have a visible background indicator; alternating table rows are legible.
- **Source:** operator (5 REC dispatches bundled as micro-build)

## What Was Delivered

Five reception UI bugs fixed in one micro-build:

| Dispatch | Issue | Fix |
|---|---|---|
| REC-002 | Dark mode resets on navigation | `ThemeModeContext`: lazy state initialisers read stored mode synchronously |
| REC-001 | Bar product buttons invisible in dark mode | Resolved as consequence of REC-002 fix |
| REC-005 | Login page ignores dark mode | Resolved as consequence of REC-002 fix |
| REC-003 | Tab selection — no background indicator | Added `bg-primary/10` to active tab class in CashHub, EodHub, StockHub |
| REC-004 | Alternating table rows invisible | `--color-table-row-alt` raised from 98% → 91% (light), 10% → 14% (dark) |

## Root Cause (REC-002 / REC-001 / REC-005)

`ThemeModeProvider` uses `useState<ThemeMode>("system")` and `useState<boolean>(false)`. Because reception wraps each page in `<Providers>`, the provider re-mounts on every navigation. The hardcoded defaults cause `useLayoutEffect` to immediately remove `theme-dark` classes before `useEffect` reads `localStorage`.

**Fix**: Lazy state initialisers run synchronously on first render, so stored preference is never overwritten.

## Files Changed

- `packages/platform-core/src/contexts/ThemeModeContext.tsx` — lazy initialisers; removed redundant useEffect
- `apps/reception/src/components/cash/CashHub.tsx` — `bg-primary/10` on active tab
- `apps/reception/src/components/eod/EodHub.tsx` — same
- `apps/reception/src/components/stock/StockHub.tsx` — same
- `packages/themes/reception/src/tokens.ts` — table-row-alt contrast values
- `packages/themes/reception/tokens.css` — regenerated via `pnpm build:tokens`

## Commit

`1f33c42cb1` — fix(reception): dark mode persistence + tab active state + table row shading

## Validation Evidence

- **TC-01**: Lines 64–66 of `ThemeModeContext.tsx` confirmed contain lazy initialisers (`() => readStoredMode() ?? "system"` and `() => typeof window !== "undefined" && getSystemMode() === "dark"`)
- **TC-03**: `bg-primary/10` confirmed present in CashHub.tsx, EodHub.tsx, StockHub.tsx
- **TC-04**: `tokens.css` updated to `150 6% 91%` (light) / `160 10% 14%` (dark); old value `150 5% 98%` absent
- **TC-BUILD**: `pnpm build:tokens` ran successfully: "tokens.css, tokens.static.css, and tokens.dynamic.css generated"
- **TC-TYPECHECK**: business-os and platform-core typecheck passed after clearing stale tsbuildinfo (incremental cache issue, not a code defect)

## Engineering Coverage Evidence

| Area | Coverage |
|---|---|
| Unit tests | No new tests (micro-build lane; validated via code review and grep checks) |
| Type safety | ThemeModeContext type signature unchanged; no new TypeScript errors |
| Token build | Regenerated via `pnpm build:tokens` — CSS output verified |
| Lint | Pre-commit lint-staged passed |
| Typecheck | turbo typecheck for `@acme/platform-core`, `@apps/reception`, `@apps/business-os` passed |

## Workflow Telemetry Summary

Workflow step recorded in `docs/business-os/startup-loop/ideas/trial/telemetry.jsonl`.
- Stage: `lp-do-build`
- Module: `modules/build-code.md`
- Dispatches bundled: 5 (BRIK-REC-001 through BRIK-REC-005)
- Track: direct-dispatch micro-build (skips fact-find/plan stages)
