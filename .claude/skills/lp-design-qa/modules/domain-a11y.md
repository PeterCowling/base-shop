# Domain: Accessibility Checks

**Goal:** Verify WCAG AA compliance and spec's "Accessibility" section requirements.

**Return schema:** `{ domain: "a11y", status: "pass|fail|warn", checks: [{ id, status, evidence }] }`

## A11Y-01: Semantic HTML

- Verify correct use of `<button>`, `<a>`, `<nav>`, `<main>`, `<section>`, `<article>`
- Check for `<div>` with `onClick` instead of `<button>`
- Verify heading hierarchy (`h1` → `h2` → `h3`, no skips)
- **Pass:** Semantic HTML used correctly
- **Fail:** Non-semantic elements for interactive content, heading hierarchy violated

## A11Y-02: ARIA Coverage

- For each ARIA requirement in spec's "Accessibility" section:
  - Verify `role`, `aria-label`, `aria-labelledby`, `aria-describedby` present
  - Check for `aria-live` regions for dynamic content
  - Verify `aria-expanded`, `aria-controls` for disclosure widgets
- Check for redundant ARIA (e.g., `role="button"` on `<button>`)
- **Pass:** Required ARIA present, no redundant ARIA
- **Fail:** Missing ARIA, redundant ARIA, incorrect usage

## A11Y-03: Focus Management

- Verify focus styles visible (`focus-visible:ring` or similar)
- Check for `focus:outline-none` without replacement
- Verify focus order matches visual/logical order (tab sequence from spec)
- Look for focus traps or missing `tabIndex` on custom interactive elements
- **Pass:** Focus visible, correct order, no traps
- **Fail:** Missing focus styles, wrong tab order, focus traps

## A11Y-04: Contrast Compliance

- For each token combination in spec's "Token Binding":
  - Calculate contrast ratio (or flag for manual check if auto-check unavailable)
  - Verify ≥4.5:1 for normal text, ≥3:1 for large text/UI components (WCAG AA)
  - Check both light and dark modes
- **Pass:** All combinations meet WCAG AA
- **Fail:** Contrast ratios below threshold, token combinations not checked

## A11Y-05: Screen Reader Support

- Verify visually-hidden text for icons/graphics (`sr-only` class)
- Check for `alt` text on images (empty `alt=""` for decorative)
- Verify form labels (`<label>` or `aria-label`)
- **Pass:** Screen reader text present where needed
- **Fail:** Missing alt text, unlabeled form inputs, icon-only buttons without labels

**Output per check:** Pass | Fail | Partial with WCAG reference and recommended fixes.
