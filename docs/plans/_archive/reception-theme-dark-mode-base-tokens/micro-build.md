---
Type: Micro-Build
Status: Complete
Feature-Slug: reception-theme-dark-mode-base-tokens
---

# Micro-Build: Reception Base Token Dark Mode Override

- **Dispatch-ID:** IDEA-DISPATCH-20260308104500-9401
- **Business:** BRIK
- **Status:** Skipped
- **Execution-Track:** code
- **Deliverable-Type:** code-change

## Problem

Reception forces dark mode via `html.theme-dark` CSS class on the `<html>` element. The original hypothesis was that base semantic tokens (danger, success, warning, info) only switch to dark variants via `@media (prefers-color-scheme: dark)` in `packages/themes/base/tokens.css`.

## Investigation Finding

**The bug does not exist.** `packages/themes/base/tokens.css` already has an `html.theme-dark` block (lines 299-367) covering ALL base semantic tokens including danger, success, warning, info, hospitality-*, muted, link, focus-ring, ring, selection, highlight, borders, elevations, and overlays. This block is imported via `globals.css` (`@import "@themes/base/tokens.css"`) before `reception/tokens.css`. CSS merges declarations from same-specificity selectors — so the base block's overrides remain active even after reception's `html.theme-dark` block adds reception-specific properties. No token gap exists.

## Skip Rationale

No code change needed. The `html.theme-dark` class selector in `base/tokens.css` already ensures all base semantic tokens resolve to their dark variants regardless of OS color scheme preference.

## Affects

- `packages/themes/reception/tokens.css` (primary)
- `packages/themes/base/tokens.css` [readonly — reference for which tokens need overriding]

## Validation

- TC-01: All base semantic tokens (danger, success, warning, info, destructive) reference their `-dark` variants in the `html.theme-dark` block
- TC-02: No regression — existing reception-specific token overrides unchanged
- TC-03: Typecheck passes (`npx tsc --noEmit` in reception app)

## Outcome Contract

- **Why:** Staff using light-mode OS devices see broken status colors on the reception dark UI
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All base semantic tokens correctly resolve to dark values on reception regardless of OS color scheme preference
- **Source:** operator
