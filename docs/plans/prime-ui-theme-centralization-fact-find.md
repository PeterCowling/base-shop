---
Type: Fact-Find
Status: Complete
Domain: UI
Created: 2026-02-10
Feature-Slug: prime-ui-theme-centralization
---

# Prime UI + Theme Centralization — Fact-Find Brief

## Context
Prime has shared UI/theme capabilities available but partial adoption. DS lint enforcement is fully disabled at three bypass layers.

## Key Findings

### Adoption Gap
- **51 component files** in Prime, only **11 import shared packages** (`@acme/design-system`, `@acme/ui`, `@themes/prime`)
- **146 DS violations** across **33 files** (with DS rules enabled)
- **67 raw `<button>`** elements, **17 raw `<input>`**, **4 raw `<textarea>`**

### DS Lint Bypass Layers
1. `.eslintrc.cjs` — DS rule disables (ineffective under flat config)
2. `lint-wrapper.sh` — DS_OVERRIDES array (redundant)
3. `eslint.config.mjs` — `offAllDsRules` for `apps/prime/**` (primary bypass)

### Dead Code
- `PrimeButton.tsx`, `PrimeInput.tsx`, `PrimeTextarea.tsx` — zero imports, dead wrappers around DS primitives

### Theme Infrastructure
- `@themes/prime` provides 13 token overrides (warm teal primary, amber accent, softer radii)
- Token classes available: `text-primary`, `text-foreground`, `text-muted-foreground`, `text-success`, `bg-card`, etc.

### Test Landscape
- **90 test files** exist in Prime
- **2 pre-existing test timeouts** (MealOrderPage, find-my-stay) — unrelated to this work
- Homepage cards had **0 tests** (coverage gap)

## Confidence Inputs
| Dimension | Score | Notes |
|---|---:|---|
| Implementation | 88% | DS primitives exist with clear APIs |
| Approach | 84% | Progressive per-directory migration is proven pattern |
| Impact | 82% | UI-only changes, theme tokens maintain visual consistency |
| Delivery-Readiness | 86% | All DS dependencies available, no blockers |
| Testability | 83% | Token assertion pattern validated, lint pass as acceptance |

## Recommendation
Proceed to planning. Progressive directory-by-directory migration with lint enablement per slice.
