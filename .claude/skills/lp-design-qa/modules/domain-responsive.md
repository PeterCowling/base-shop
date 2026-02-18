# Domain: Responsive Behavior Checks

**Goal:** Verify responsive breakpoints and mobile-first approach.

**Return schema:** `{ domain: "responsive", status: "pass|fail|warn", checks: [{ id, status, evidence }] }`

## RS-01: Mobile-First Structure

- Verify base styles (no prefix) are mobile-appropriate
- Check that `md:` and `lg:` prefixes override mobile defaults
- Look for desktop-first patterns (`max-width` media queries, reverse overrides)
- **Pass:** Mobile-first, progressive enhancement via `md:` / `lg:`
- **Fail:** Desktop-first, missing mobile styles, incorrect breakpoint logic

## RS-02: Breakpoint Compliance

- Compare actual breakpoints to spec's "Layout" section (mobile / tablet / desktop)
- Verify changes at `md:` (768px+) and `lg:` (1024px+) match spec
- Check for arbitrary breakpoints or custom media queries
- **Pass:** Spec breakpoints implemented correctly
- **Fail:** Breakpoints missing, arbitrary breakpoints used, spec not followed

## RS-03: Touch Target Sizes

- Grep for interactive elements (buttons, links, inputs, clickable cards)
- Verify minimum size: `min-h-11 min-w-11` (or `h-11 w-11` for fixed)
- Check for interactive elements below WCAG minimum (44x44px)
- **Pass:** All interactive elements meet minimum size
- **Fail:** Interactive elements below minimum, no size constraints

## RS-04: Overflow Handling

- Check for horizontal scroll issues (long text, fixed widths without `max-w`)
- Verify text wrapping (`break-words`, `line-clamp` usage)
- Look for unconstrained images or containers
- **Pass:** Content constrained, text wraps, no horizontal scroll
- **Fail:** Fixed widths cause overflow, missing max-width constraints

**Output per check:** Pass | Fail | Partial with evidence and recommended fixes.
