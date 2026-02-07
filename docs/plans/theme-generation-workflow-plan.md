---
Type: Plan
Status: Historical
Domain: Theming
Last-reviewed: 2026-01-18
Relates-to charter: docs/theming-charter.md
Audit-recommendation: P1.3
Created: 2026-01-18
Created-by: Claude Opus 4.5
Last-updated: 2026-01-18
Last-updated-by: Claude Opus 4.5
---

# Plan: Theme Generation Workflow

Source: `docs/repo-quality-audit-2026-01.md` (Recommendation `P1.3`).


## Active tasks

No active tasks at this time.

## Summary

Create a standardized workflow for generating new theme packages from a brand brief, enabling operators to create production-ready custom themes within the 3-hour shop launch target.

## Problem Statement

Currently, the platform has strong support for existing themes (multi-theme support, token overrides, CMS theme editor), but creating a net-new brand theme relies on manual token work:

- No standardized generator for creating a new theme package from a brief
- No automated theme validation for contrast/accessibility or visual regression per theme
- Theme selection is fast, but creating a net-new brand theme can consume most of the 3-hour launch window

From the repo quality audit: "Existing themes can ship quickly; net-new themes can consume most of the 3-hour window."

## Goals (Outcomes)

1. **One-command theme generation**: A CLI that accepts brand inputs (colors, logo, typography preferences) and generates a complete theme package.
2. **Accessible by default**: Generated themes pass WCAG 2.1 AA contrast requirements automatically.
3. **Composable with launch pipeline**: Generated themes work seamlessly with `pnpm launch-shop` and `pnpm init-shop --theme`.
4. **Validated output**: Generated themes include visual regression baselines and accessibility test fixtures.

## Non-Goals

- Full brand identity creation (logo design, marketing assets)
- AI-powered brand suggestion from product catalog
- Theme marketplace or theme sharing infrastructure
- Real-time collaborative theme editing

## Proposed UX / Contract

Add a new CLI entrypoint:

```bash
pnpm generate-theme \
  --name <theme-name> \
  --primary <hex-color> \
  [--secondary <hex-color>] \
  [--accent <hex-color>] \
  [--surface <hex-color>] \
  [--font-heading <font-family>] \
  [--font-body <font-family>] \
  [--from-logo <logo-path>] \
  [--output <dir>] \
  [--validate-only]
```

Contract:

- **Non-interactive by default**: All required inputs come from flags or config file.
- **Brand color extraction** (optional): `--from-logo` extracts dominant colors from a logo image.
- **Accessible palette generation**: Primary color generates a full accessible palette (50-950 shades) using a contrast-aware algorithm.
- **Validation mode**: `--validate-only` checks an existing theme for contrast/accessibility issues without generating.

### Output Structure

Generated theme package at `packages/themes/<theme-name>/`:

```
packages/themes/<theme-name>/
├── package.json
├── src/
│   ├── index.ts          # Theme export
│   ├── tokens.ts         # Design tokens (colors, typography, spacing)
│   ├── tokens.css        # CSS custom properties
│   └── palette.ts        # Generated color palette with accessibility metadata
├── __tests__/
│   └── contrast.test.ts  # Auto-generated contrast tests
└── README.md             # Theme documentation with color swatches
```

## Technical Approach

### Color Palette Generation

Use HSL color space manipulation with WCAG contrast ratio calculations:

1. **Input**: Primary brand color (hex)
2. **Generate**: 11-shade palette (50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950)
3. **Validate**: Ensure sufficient contrast pairs for text/background combinations
4. **Fallback**: Adjust lightness if contrast requirements not met

Leverage existing work:
- `docs/palette.md` documents a `generate-theme` helper (referenced but not implemented)
- `packages/design-tokens/` contains token foundations
- `packages/themes/base/src/tokens.ts` provides the canonical token contract

### Integration Points

| Component | Integration |
|-----------|-------------|
| `init-shop` | `--theme <generated-theme-name>` |
| `launch-shop` | Config `theme` field accepts generated themes |
| Theme Editor | Generated themes appear in preset dropdown |
| Storybook | Auto-registered for visual testing |

## Active Tasks

- **THEMEGEN-01: Implement color palette generator**
  - Status: ✅ Complete
  - Scope:
    - Create `scripts/src/generate-theme/palette.ts` with HSL manipulation
    - Implement WCAG 2.1 AA contrast ratio calculation
    - Generate 11-shade palette from single primary color
    - Add secondary/accent color derivation if not provided
  - Dependencies: None
  - Definition of done:
    - Given a hex color, generates a full palette with all shades
    - All text/background combinations meet 4.5:1 contrast ratio
    - Unit tests cover edge cases (very light, very dark inputs)
  - Completed: 2026-01-18
    - Implemented `scripts/src/generate-theme/palette.ts`
    - 37 passing tests in `scripts/__tests__/generate-theme/palette.test.ts`

- **THEMEGEN-02: Implement theme package scaffolding**
  - Status: ✅ Complete
  - Scope:
    - Create `scripts/src/generate-theme/scaffold.ts`
    - Generate `package.json` with correct workspace dependencies
    - Generate `tokens.ts` from palette output
    - Generate `tokens.css` with CSS custom properties
    - Generate contrast test file
  - Dependencies: THEMEGEN-01
  - Definition of done:
    - Generated package builds without errors
    - Generated package is importable as `@acme/themes/<name>`
    - Contrast tests pass for generated theme
  - Completed: 2026-01-18
    - Implemented `scripts/src/generate-theme/scaffold.ts`
    - Generates complete theme package structure

- **THEMEGEN-03: Add CLI entrypoint**
  - Status: ✅ Complete
  - Scope:
    - Create `scripts/src/generate-theme/index.ts` CLI
    - Wire up palette generation and scaffolding
    - Add `--validate-only` mode for color validation
    - Add `--validate-theme` mode for existing themes
  - Dependencies: THEMEGEN-01, THEMEGEN-02
  - Completed: 2026-01-18
    - CLI available via `pnpm generate-theme`
    - Supports `--validate-only` and `--validate-theme` modes
  - Definition of done:
    - `pnpm generate-theme --name test --primary '#336699'` produces valid theme
    - Generated theme works with `init-shop --theme test`
    - Help text documents all flags

- **THEMEGEN-04: Add accessibility validation**
  - Status: ✅ Complete
  - Scope:
    - Integrate with existing accessibility audit infrastructure
    - Auto-generate jest-axe test fixtures for theme
    - Add contrast matrix output showing all valid combinations
  - Dependencies: THEMEGEN-02
  - Definition of done:
    - Generated themes include passing accessibility tests
    - `--validate-only` reports contrast issues with fix suggestions
    - Integration with `docs/accessibility-audit-plan.md` requirements
  - Completed: 2026-01-18
    - Implemented `scripts/src/generate-theme/validate.ts`
    - `--validate-theme` mode validates existing themes
    - Contrast validation for 9 key color pairs
    - Token completeness validation

- **THEMEGEN-05: Documentation and examples**
  - Status: ✅ Complete
  - Scope:
    - Update `docs/palette.md` to document actual implementation
    - Add examples to `docs/theming-advanced.md`
    - Create tutorial for common scenarios (brand refresh, new client)
  - Dependencies: THEMEGEN-03
  - Definition of done:
    - Docs accurately reflect implementation
    - Example commands work end-to-end
    - Runbook for "create theme for new shop" exists
  - Completed: 2026-01-18
    - Updated `docs/palette.md` with CLI usage
    - Added "Creating a new theme package" section to `docs/theming-advanced.md`

## Acceptance Criteria

- [x] `pnpm generate-theme` can create a new theme from a single brand color
- [x] Generated themes pass WCAG 2.1 AA contrast requirements
- [x] Generated themes integrate with existing `init-shop` and `launch-shop` workflows
- [x] Theme validation mode can audit existing themes for accessibility issues
- [x] Documentation covers common workflows and edge cases

## Risks / Open Questions

1. **Font licensing**: How do we handle custom fonts that require licensing? MVP assumes Google Fonts or system fonts only.
2. **Logo color extraction accuracy**: Color extraction from logos may need manual override. Consider `--from-logo` as optional enhancement.
3. **Theme Editor sync**: Generated themes should appear in Theme Editor presets. Need to verify registration mechanism.
4. **Visual regression baseline**: Should generated themes auto-create Chromatic baselines? May require manual review step.

## Success Metrics

- Time to create a new brand theme: Target < 30 minutes (currently 2+ hours)
- Accessibility issues in generated themes: Target 0 (AA violations)
- Adoption: 80% of new shop launches use generated or existing themes (vs manual)

## Related Work

- Audit source: `docs/repo-quality-audit-2026-01.md` (P1.3)
- Theming plan: `docs/theming-plan.md` (THEME-01, THEME-03)
- Theming audit: `docs/plans/theming-audit-2026-01-plan.md`
- Accessibility: `docs/accessibility-audit-plan.md`
- Existing docs: `docs/palette.md`, `docs/theming-advanced.md`
