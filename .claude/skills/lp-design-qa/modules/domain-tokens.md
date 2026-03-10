# Domain: Token Compliance Checks

**Goal:** Verify semantic token usage and theme package integrity.

**Return schema:** `{ domain: "tokens", status: "pass|fail|warn", checks: [{ id, status, evidence }] }`

## TC-01: Arbitrary Value Audit

- Grep for hardcoded color literals and non-token arbitrary values in component/app className strings
- Filter out legitimate uses:
  - semantic alpha modifiers such as `bg-primary/90`
  - Tailwind state/data syntax such as `data-[state=open]`
  - layout utilities that require bracket syntax for valid platform values
  - `hsl(var(--...))` wrappers around semantic/base tokens
  - theme-source `oklch(...)` values and Tailwind v4 `@theme` registrations
- Flag hardcoded colors, spacing, sizes
- **Pass:** Zero arbitrary values for color/spacing/sizing
- **Fail:** Arbitrary values found

## TC-02: Tailwind Palette Usage

- Grep for Tailwind default palette classes: `bg-red-500`, `text-blue-600`, etc.
- Verify no non-semantic color classes
- **Pass:** Zero Tailwind palette classes
- **Fail:** Palette classes found (should use semantic tokens)

## TC-03: Token Existence

- For each token class used in components:
  - Verify it resolves through one of: theme package `tokens.ts`, base theme tokens, app-level `@theme` registration (for example app `globals.css` aliases), or a documented design-system alias
  - Check for invented tokens only after checking those alias layers (e.g., do not fail `bg-surface-2` or `text-muted-foreground` solely because they are app-level aliases rather than direct theme keys)
- **Pass:** All semantic token classes resolve through an accepted source
- **Fail:** Invented tokens, missing token definitions, or unregistered app aliases

## TC-04: Dark Mode Token Integrity

- For each semantic token used:
  - Verify it has a dark mode variant in theme or resolves to an app-level alias backed by dark-capable theme values
  - Check for `dark:` overrides that bypass semantic tokens without a documented reason
- **Pass:** All tokens have dark-capable sources, no unjustified bypasses
- **Fail:** Dark mode gaps, hardcoded dark overrides, or aliases that collapse to light-only values

**Output per check:** Pass | Fail with list of violations and fix actions.
