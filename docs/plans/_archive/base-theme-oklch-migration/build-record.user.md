# Build Record — BASE Theme OKLCH Migration

## Outcome Contract

- **Why:** shadcn/ui v4 uses OKLCH as canonical; HSL system produced a production
  cascade bug in reception shade tokens. OKLCH improves perceptual uniformity and
  eliminates the raw-triplet/hsl-wrapper mismatch that caused the original bug.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All reception theme token values converted to OKLCH
  with contrast ratios verified, @theme inline continues working, no visual regressions.
- **Source:** operator

## Build Summary

**Dispatch:** IDEA-DISPATCH-20260306213000-1005

**What was built:**

1. **HSL→OKLCH conversion script** (`scripts/src/themes/hsl-to-oklch.ts`) — programmatic
   conversion using Björn Ottosson's OKLab matrix math. Generates all oklch values from
   original HSL sources. No manual computation.

2. **Reception token migration — commit 1** (`f1dcc15389`):
   - `packages/themes/reception/src/tokens.ts` — all 69 color values converted to oklch()
   - `packages/themes/reception/tokens.css` — 134 oklch() entries, zero hsl() values remaining
   - Shade tokens: `hsl(H S% L%)` → `oklch(L C H)`
   - Semantic tokens: raw HSL triplets → full `oklch(L C H)` values
   - Chart tokens: raw HSL triplets → `oklch(L C H)`

3. **@theme consumer update — commit 2** (`afa380ce3a`):
   - `apps/reception/src/app/globals.css` — all reception-overridden tokens in @theme {}
     changed from `hsl(var(--X))` → `var(--X)` (pre-wrapped oklch needs no hsl wrapper)
   - Base tokens (danger, success, warning, info, hospitality) unchanged — still raw HSL
     triplets, still wrapped in hsl(var(...))
   - Direct CSS `background/color` on body updated from `hsl(var(--color-bg/fg))` → `var()`
   - `@theme inline {}` block for shade families: unchanged — bare var() is format-agnostic

4. **Contrast verification** (`scripts/src/themes/contrast-verify.ts`):
   - 16 text/background pairs checked across light and dark modes
   - All 16 pass WCAG AA (normal: ≥4.5:1, UI components: ≥3:1)
   - Report saved to `docs/plans/base-theme-oklch-migration/contrast-report.md`

**Validation gates passed:**
- TC-01: All shade token values match oklch() format ✓
- TC-02: tokens.css shade entries match tokens.ts ✓
- TC-03: @theme inline in globals.css unchanged ✓
- TC-04: TypeScript clean (reception app typecheck passed) ✓
- TC-05: All semantic token values in oklch() format ✓
- TC-06: globals.css @theme {} uses var(--X) not hsl(var(--X)) for reception tokens ✓
- TC-07: Direct CSS body hsl(var()) updated to var() ✓
- TC-08: No TypeScript errors ✓
- TC-09: All primary text/background pairs meet WCAG AA ✓ (16/16 pass)
- TC-10: Contrast report produced ✓

**Deferred:** `border-1`/`border-2` alpha-modifier tokens in @theme still use
`hsl(var(--border-1, var(--color-fg) / 0.12))` because CSS Color Level 5 `oklch(from ...)`
relative color syntax is not yet widely supported. Tracked in code comment.

## Commits

1. `e2c9077b92` — plan, conversion script, and contrast verifier (plan artifacts + scripts)
2. `f1dcc15389` — reception tokens migrated to OKLCH (tokens.ts + tokens.css)
3. `afa380ce3a` — reception @theme consumers updated for OKLCH (globals.css)
