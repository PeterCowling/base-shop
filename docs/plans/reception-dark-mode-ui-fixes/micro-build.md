---
Type: Micro-Build
Status: Active
Feature-Slug: reception-dark-mode-ui-fixes
Dispatch-IDs: IDEA-DISPATCH-20260313192500-BRIK-REC-001, IDEA-DISPATCH-20260313192500-BRIK-REC-002, IDEA-DISPATCH-20260313192500-BRIK-REC-003, IDEA-DISPATCH-20260313192500-BRIK-REC-004, IDEA-DISPATCH-20260313192500-BRIK-REC-005
Work-Package-Reason: All five dispatches target the same reception app UI layer (dark mode persistence, tab indicators, table shading). Fixing persistence first (REC-002) resolves bar buttons (REC-001) and login page (REC-005) as consequences. Tab and table fixes are independent but co-located. Single commit keeps the changes atomic.
Business: BRIK
Created: 2026-03-14
---

# Micro-Build: Reception Dark Mode + UI Fixes

## Scope

Five reception app UI bugs, bundled as one surface:

| Dispatch | Issue | Surface |
|---|---|---|
| REC-002 | Dark mode resets to light mode when navigating between screens | `packages/platform-core/src/contexts/ThemeModeContext.tsx` |
| REC-001 | Bar screen product buttons invisible in dark mode | Root cause = REC-002. No additional change needed. |
| REC-005 | Login page ignores dark mode | Root cause = REC-002. No additional change needed. |
| REC-003 | Tab selection visible only by colour — no background indicator | `apps/reception/src/components/cash/CashHub.tsx`, `eod/EodHub.tsx`, `stock/StockHub.tsx` |
| REC-004 | Table alternating row shading invisible (2% lightness delta) | `packages/themes/reception/src/tokens.ts` + `packages/themes/reception/tokens.css` |

## Root Cause — REC-002, REC-001, REC-005

`ThemeModeProvider` in `packages/platform-core/src/contexts/ThemeModeContext.tsx` uses:
```tsx
const [mode, setMode] = useState<ThemeMode>("system");
const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(false);
```

The reception app wraps each page individually with `<Providers>`, so `ThemeModeProvider` remounts on every navigation. The `"system"` default + `false` for `systemPrefersDark` means `useLayoutEffect` immediately removes the `theme-dark` / `dark` classes applied by the `initTheme` script, wiping the user's dark mode preference before the `useEffect` reads `localStorage`.

**Fix**: Use lazy state initialisers to read stored values synchronously on first render, so the provider always starts in the correct state regardless of mount timing.

## Changes

### Change 1 — ThemeModeContext.tsx

**File:** `packages/platform-core/src/contexts/ThemeModeContext.tsx`
**Lines:** 64–65

```tsx
// Before:
const [mode, setMode] = useState<ThemeMode>("system");
const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(false);

// After:
const [mode, setMode] = useState<ThemeMode>(() => readStoredMode() ?? "system");
const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(
  () => typeof window !== "undefined" && getSystemMode() === "dark",
);
```

Remove the `useEffect` block at lines 67–73 that currently reads `localStorage` and `getSystemMode()` — their job is now done by the lazy initialisers. Keep the `useEffect` at line 83 that writes `localStorage` when `mode` changes, and the `useEffect` at line 87 that subscribes to the system media query.

### Change 2 — Tab active background (REC-003)

**Files:** `apps/reception/src/components/cash/CashHub.tsx`, `apps/reception/src/components/eod/EodHub.tsx`, `apps/reception/src/components/stock/StockHub.tsx`

Active tab class change:
```
"border-primary text-primary"
→
"border-primary text-primary bg-primary/10"
```

### Change 3 — Table row alternating shading (REC-004)

**File:** `packages/themes/reception/src/tokens.ts`
```ts
// Before:
"--color-table-row-alt": { light: "150 5% 98%", dark: "160 8% 10%" },

// After:
"--color-table-row-alt": { light: "150 6% 91%", dark: "160 10% 14%" },
```

**File:** `packages/themes/reception/tokens.css` (regenerate or update in-place)
```css
/* Before: */
--color-table-row-alt: 150 5% 98%;
--color-table-row-alt-dark: 160 8% 10%;

/* After: */
--color-table-row-alt: 150 6% 91%;
--color-table-row-alt-dark: 160 10% 14%;
```

Then run `pnpm build:tokens` to regenerate the full file, or edit in-place if build is unavailable.

## Validation

| TC | Description | Pass Criteria |
|---|---|---|
| TC-01 | `ThemeModeProvider` lazy init test: with `window.localStorage.setItem('theme-mode', 'dark')`, initial render applies dark classes without waiting for useEffect | `html` has `theme-dark dark` classes immediately after first render |
| TC-02 | No regression: `readStoredMode()` returns null on first load → default `"system"` | Provider renders with system fallback |
| TC-03 | Tab active background: active tab in CashHub/EodHub/StockHub has `bg-primary/10` class | Class present on active tab button |
| TC-04 | Table alt row: `--color-table-row-alt` light value ≠ `150 5% 98%` | grep returns new value |
| TC-05 | ThemeToggle existing tests still pass | No regression in `packages/ui/__tests__/` |

## Queue State

Dispatches to mark complete after commit:
- IDEA-DISPATCH-20260313192500-BRIK-REC-001
- IDEA-DISPATCH-20260313192500-BRIK-REC-002
- IDEA-DISPATCH-20260313192500-BRIK-REC-003
- IDEA-DISPATCH-20260313192500-BRIK-REC-004
- IDEA-DISPATCH-20260313192500-BRIK-REC-005
