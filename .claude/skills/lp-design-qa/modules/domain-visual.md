# Domain: Visual Regression Checks

**Goal:** Verify visual implementation matches design spec and brand language.

**Return schema:** `{ domain: "visual", status: "pass|fail|warn", checks: [{ id, status, evidence }] }`

## VR-01: Token Binding Compliance

- For each element in design spec's "Token Binding" table:
  - Read the component file
  - Grep for the specified token class (e.g., `bg-primary`)
  - Verify it's used on the correct element/property
  - Check for arbitrary values (`#hex`, `rgb(`, `hsl(`, inline styles with hardcoded colors)
- **Pass:** All specified tokens present, no arbitrary values
- **Fail:** Missing tokens, arbitrary values found, wrong tokens used

## VR-02: Dark Mode Coverage

- For each token usage:
  - Verify the token has a dark variant in theme package
  - Check for any light-mode-only color values
  - Look for `dark:` overrides that bypass semantic tokens
- **Pass:** All colors have dark variants, no light-mode-only values
- **Fail:** Dark mode gaps, hardcoded dark overrides

## VR-03: Component Reuse

- Check if components listed in spec's "Reused Components" are actually imported
- Verify no duplication of existing design system components
- Check correct package usage (design-system vs ui vs app-level)
- **Pass:** Spec's component map followed, no duplication
- **Fail:** Components not reused when they should be, wrong package layer

## VR-04: Layout Skeleton

- Compare actual layout structure to spec's "Layout" section
- Verify spacing tokens match spec (e.g., `gap-4`, `p-6`)
- Check for arbitrary spacing values
- **Pass:** Layout matches spec, semantic spacing used
- **Fail:** Layout diverges from spec, arbitrary spacing found

## VR-05: Brand Signature Patterns

- Read brand language "Signature Patterns" section
- Verify signature patterns are applied (e.g., "cards always use rounded-lg shadow-sm")
- Check for deviations from brand patterns without justification
- **Pass:** Brand patterns applied consistently
- **Fail:** Brand patterns violated or inconsistently applied

**Output per check:** Pass | Fail | Partial with evidence (file:line) and expected vs actual state.
