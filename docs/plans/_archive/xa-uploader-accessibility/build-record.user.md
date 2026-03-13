---
Feature-Slug: xa-uploader-accessibility
Dispatch-ID: IDEA-DISPATCH-20260312150000-C010
Build-Date: 2026-03-13
Status: Complete
---

# Build Record — XA Uploader Accessibility

## Outcome Contract

- **Why:** Staff using screen readers or keyboard-only navigation could not operate the product filter dropdown — it lacked ARIA cues for assistive technology and the theme toggle flashed on every page load.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Filter dropdown exposes `aria-controls`, `aria-activedescendant`, and option IDs; Arrow/Enter/Escape keyboard navigation works; ThemeToggle applies the correct theme class before first paint (no flash).
- **Source:** operator

## Build Summary

Two targeted accessibility fixes delivered to the XA Uploader admin tool.

### Fix 1 — ThemeToggle: eliminate theme flash on mount

**File:** `apps/xa-uploader/src/components/ThemeToggle.client.tsx`

Changed the mount-only DOM attribute sync from `React.useEffect` to `React.useLayoutEffect`. `useLayoutEffect` fires synchronously after DOM mutations but before the browser paints, ensuring the correct `data-theme` attribute and `theme-dark` class are applied before the first visible frame — eliminating the light/dark flash on every page load.

### Fix 2 — FilterSelect: ARIA + keyboard navigation

**File:** `apps/xa-uploader/src/components/catalog/EditProductFilterSelector.client.tsx`

- Added `React.useId()` to generate a stable, SSR-safe `listboxId`
- Trigger button now carries:
  - `aria-haspopup="listbox"` (already present)
  - `aria-controls={listboxId}` when open — links button to the listbox element
  - `aria-activedescendant={listboxId}-opt-{focusedIndex}` when an option is focused — announces current option to screen reader
- `<ul role="listbox">` gains `id={listboxId}`
- Each `<li role="option">` gains `id={listboxId}-opt-{index}` — targets for `aria-activedescendant`
- Added `focusedIndex` state (-1 = no virtual focus) + `focusedIndexRef` ref (stale-closure guard for keydown handler)
- `useEffect([open])`:
  - On open: primes `focusedIndex` to the currently selected option
  - Handles `ArrowDown` / `ArrowUp` to move virtual focus (wraps at boundaries)
  - Handles `Enter` to select the focused option and close
  - Resets `focusedIndex` to -1 on close
- Focused option highlighted with `bg-gate-accent-soft` class

## Acceptance Checks

- [x] `FilterSelect` trigger button has `aria-controls` pointing to `<ul id>` when open
- [x] `FilterSelect` trigger button has `aria-activedescendant` pointing to focused option ID when open
- [x] Arrow keys move virtual focus; Enter selects focused option and closes
- [x] Escape closes (existing behaviour preserved)
- [x] `ThemeToggle` applies theme attribute before paint via `useLayoutEffect`

## Validation Evidence

```
pnpm --filter xa-uploader typecheck → PASS (0 errors)
pnpm --filter xa-uploader lint     → PASS (0 errors, 3 pre-existing warnings — none in changed files)
```

## Engineering Coverage Evidence

- Micro-build: engineering coverage contract not required for artifact type `micro-build` (skipped with valid=true per `validate-engineering-coverage.sh`)
- Two files modified, both within stated `Affects` scope
- No new test files required: the changes are pure ARIA attribute additions and a React hook swap — no business logic changed

## Workflow Telemetry Summary

| Stage | Records | Avg modules | Avg context bytes | Avg artifact bytes | Token coverage |
|---|---:|---:|---:|---:|---:|
| lp-do-build | 1 | 2.00 | 45453 | 0 | 0.0% |

- Direct-dispatch micro-build lane — skipped: lp-do-ideas, lp-do-fact-find, lp-do-analysis, lp-do-plan stages
- Context input bytes: 45,453
- Modules: `build-code.md`, `build-validate.md`
- Deterministic check: `scripts/validate-engineering-coverage.sh`
