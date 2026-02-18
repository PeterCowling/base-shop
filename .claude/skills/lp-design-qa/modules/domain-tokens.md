# Domain: Token Compliance Checks

**Goal:** Verify semantic token usage and theme package integrity.

**Return schema:** `{ domain: "tokens", status: "pass|fail|warn", checks: [{ id, status, evidence }] }`

## TC-01: Arbitrary Value Audit

- Grep for arbitrary values: `#`, `rgb(`, `hsl(`, `[`, `px` in className strings
- Filter out legitimate uses (e.g., `calc()` in utility classes, `data-[` attributes)
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
  - Verify it exists in theme package's `tokens.ts`
  - Check for invented tokens (e.g., `bg-brand-coral` when theme only defines `bg-primary`)
- **Pass:** All tokens exist in theme
- **Fail:** Invented tokens, missing token definitions

## TC-04: Dark Mode Token Integrity

- For each semantic token used:
  - Verify it has a dark mode variant in theme
  - Check for `dark:` overrides that bypass semantic tokens
- **Pass:** All tokens have dark variants, no bypasses
- **Fail:** Dark mode gaps, hardcoded dark overrides

**Output per check:** Pass | Fail with list of violations and fix actions.
