---
Type: Audit
Status: Active
Domain: Theming
Created: 2026-01-17
Created-by: Codex
Last-updated: 2026-01-22
Last-updated-by: Codex (GPT-5.2)
---

# Theming Audit — 2026-01 (Draft Checklist)

This audit checks theming against documented behaviour and prior plan commitments. This document is the working audit draft; findings will be recorded as each checklist item is verified.

## Checklist — Documented Requirements

Each item includes the source doc and the intended code location for verification.

1) Base theme + overrides model
   - Requirement: Base themes provide defaults; overrides merge on top and persist with the shop.
   - Source: `docs/theming.md`, `docs/theming-advanced.md`, `docs/typography-and-color.md`, `docs/theming-charter.md`
   - Intended code: `apps/cms/src/app/cms/shop/[shop]/themes/ThemeEditor.tsx`, `apps/cms/src/actions/shops.server.ts`, `packages/platform-core/src/repositories/shops/schema.json`
   - Status: ✅ Implemented
   - Evidence: `apps/cms/src/services/shops/theme.ts`, `apps/cms/src/actions/shops.server.ts`, `packages/platform-core/src/repositories/shops/schema.json`, `packages/platform-core/src/themeTokens/index.ts`

2) Theme Editor inspect mode
   - Requirement: Clicking a tokenized element highlights it and focuses the matching input.
   - Source: `docs/theming.md`
   - Intended code: `apps/cms/src/app/cms/shop/[shop]/themes/**`, `packages/ui/**` (data-token wiring)
   - Status: ✅ Implemented
   - Evidence: `apps/cms/src/app/cms/shop/[shop]/themes/ThemePreview.tsx`, `apps/cms/src/app/cms/wizard/TokenInspector.tsx`, `apps/cms/src/app/cms/shop/[shop]/themes/useThemeEditor.ts`

3) Preset management
   - Requirement: Save preset from current overrides; list and delete presets.
   - Source: `docs/theming.md`
   - Intended code: `apps/cms/src/app/cms/shop/[shop]/themes/**`
   - Status: ✅ Implemented
   - Evidence: `apps/cms/src/app/cms/shop/[shop]/themes/useThemePresets.ts`, `apps/cms/src/app/cms/shop/[shop]/themes/PresetControls.tsx`, `apps/cms/src/app/cms/shop/[shop]/themes/page.tsx`

4) Reset flows
   - Requirement: Reset per-token override via UI reset action; server helper `resetThemeOverride(shop, token)` supports manual reset.
   - Source: `docs/theming.md`
   - Intended code: `apps/cms/src/app/cms/shop/[shop]/themes/**`, `apps/cms/src/actions/shops.server.ts`
   - Status: ✅ Implemented
   - Evidence: `apps/cms/src/app/cms/shop/[shop]/themes/ColorInput.tsx`, `apps/cms/src/app/cms/shop/[shop]/themes/useThemeTokenSync.ts`, `apps/cms/src/actions/shops.server.ts`

5) Base theme change behavior
   - Requirement: Selecting a base theme resets overrides, loads defaults, and updates preview.
   - Source: `docs/theming-advanced.md`
   - Intended code: `apps/cms/src/app/cms/shop/[shop]/themes/ThemeEditor.tsx`
   - Status: ✅ Implemented
   - Evidence: `apps/cms/src/app/cms/shop/[shop]/themes/useThemePresetManager.ts`, `apps/cms/src/services/shops/themeService.ts`, `apps/cms/src/app/api/shops/[shop]/theme/route.ts`
   - Notes: Selecting a built-in theme now persists `themeId` and resets overrides/defaults server-side; pending override patches are canceled on theme change to avoid leaking old overrides into the new theme.

6) Override behavior
   - Requirement: Overrides remove themselves when value equals default; preview updates with merged tokens.
   - Source: `docs/theming-advanced.md`
   - Intended code: `apps/cms/src/app/cms/shop/[shop]/themes/ThemeEditor.tsx`
   - Status: ✅ Implemented
   - Evidence: `apps/cms/src/app/cms/shop/[shop]/themes/useThemeTokenSync.ts`, `apps/cms/src/services/shops/theme.ts`

7) Preview persistence + sync
   - Requirement: Preview tokens stored in `localStorage` and sync via `storage` + `PREVIEW_TOKENS_EVENT`.
   - Source: `docs/theming-advanced.md`, `docs/preview-flows.md`
   - Intended code: `apps/cms/src/app/cms/shop/[shop]/themes/ThemeEditor.tsx`, `apps/cms/src/app/cms/configurator/**`
   - Status: ✅ Implemented
   - Evidence: `apps/cms/src/app/cms/wizard/previewTokens.ts`, `apps/cms/src/app/cms/wizard/usePreviewTokens.ts`, `packages/cms-ui/src/page-builder/hooks/usePreviewTokens.ts`

8) Theme token injection
   - Requirement: `ThemeStyle` injects CSS variables for tokens and aliases `--font-sans` to `--font-body`.
   - Source: `docs/typography-and-color.md`
   - Intended code: `packages/ui/src/components/ThemeStyle.tsx`
   - Status: ✅ Implemented
   - Evidence: `packages/ui/src/components/ThemeStyle.tsx`

9) Font loading
   - Requirement: Preconnect + load distinct first families for body/heading tokens via Google Fonts URLs.
   - Source: `docs/typography-and-color.md`
   - Intended code: `packages/ui/src/components/ThemeStyle.tsx`
   - Status: ✅ Implemented
   - Evidence: `packages/ui/src/components/ThemeStyle.tsx`

10) Dark mode model
    - Requirement: Hybrid system preference + `html.theme-dark` override; init via `localStorage('theme')` with `light|dark|system`.
    - Source: `docs/typography-and-color.md`, `README.md`
    - Intended code: `packages/platform-core/src/utils/initTheme.ts`, base theme CSS (`@themes/base/tokens.css`)
    - Status: ✅ Implemented
    - Evidence: `packages/platform-core/src/utils/initTheme.ts`, `packages/ui/src/providers/ThemeProvider.tsx`, `tailwind.config.mjs`
    - Notes: `.theme-dark` is now applied consistently (ThemeProvider + initTheme + Tailwind). ThemeProvider supports `system` and normalizes legacy stored `base` → `light`.

11) Token sources + generated CSS
    - Requirement: Base tokens in `packages/themes/base/src/tokens.ts`; generated CSS in `tokens.css`, `tokens.dynamic.css`, `tokens.static.css`.
    - Source: `docs/typography-and-color.md`, `docs/design-system-handbook.md`
    - Intended code: `packages/themes/base/src/tokens.ts`, `@themes/base/tokens.css`, `scripts/src/build-tokens.mjs`
    - Status: ✅ Implemented
    - Evidence: `packages/themes/base/src/tokens.ts`, `@themes/base/tokens.css`, `scripts/src/build-tokens.mjs`, `package.json` (script: `build:tokens`)

12) Theme overrides packages
    - Requirement: Theme packages provide overrides in `@themes/*/tokens.css`; optional `tailwind-tokens.ts`.
    - Source: `docs/typography-and-color.md`, `docs/design-system-handbook.md`
    - Intended code: `@themes/*/tokens.css`, `packages/themes/*/src/tailwind-tokens.ts`
    - Status: ✅ Implemented
    - Evidence: `packages/themes/{base,bcd,brandx,dark}/tokens.css`, `packages/themes/{bcd,brandx,dark}/src/tailwind-tokens.ts`, `packages/platform-core/src/createShop/fsUtils.ts` (`listThemes()` filters to theme packages with tokens.css)
    - Notes: Non-theme directories under `packages/themes/*` (for example caches or fixtures without `tokens.css`) are excluded from selection/validation.

13) Tailwind integration
    - Requirement: Tailwind preset exposes token-backed utilities; dark mode is `class` with `.theme-dark`.
    - Source: `docs/typography-and-color.md`
    - Intended code: `packages/design-tokens/src/index.ts`, `tailwind.config.mjs`
    - Status: ✅ Implemented (doc drift)
    - Evidence: `tailwind.config.mjs`, `packages/tailwind-config/src/index.ts`
    - Notes: Tailwind preset is provided by `@acme/tailwind-config`, not `packages/design-tokens/src/index.ts`.

14) Token map for Theme Editor hover/selection
    - Requirement: Components expose `data-token` attributes listed in the token map.
    - Source: `docs/theme-editor-tokens.md`
    - Intended code: `packages/ui/**`, app templates/components listed in the map
    - Status: ✅ Implemented
    - Evidence: `docs/theme-editor-tokens.md`, `docs/theming-token-component-matrix.md`, `packages/design-system/src/primitives/button.tsx`, `packages/ui/src/components/organisms/Header.tsx`

15) CMS fonts panel workflow
    - Requirement: CMS UI provides body + heading font selection with preview and suggested pairings.
    - Source: `docs/typography-and-color.md`
    - Intended code: `packages/ui/src/components/cms/page-builder/FontsPanel.tsx`
    - Status: ✅ Implemented
    - Evidence: `packages/ui/src/components/cms/page-builder/FontsPanel.tsx`, `packages/cms-ui/src/page-builder/FontsPanel.tsx`

16) Accessibility guidance and enforcement
    - Requirement: Contrast checks target WCAG AA; token-driven pointer target utilities exist.
    - Source: `docs/typography-and-color.md`, `docs/palette.md`
    - Intended code: `packages/ui/src/components/cms/page-builder/__tests__/FontsPanel.contrast.test.ts`, `apps/cms/src/app/utilities.a11y.css`
    - Status: ✅ Implemented
    - Evidence: `packages/ui/src/components/cms/page-builder/__tests__/FontsPanel.contrast.test.ts`, `apps/cms/src/app/utilities.a11y.css`, `docs/palette.md`

17) Theme lifecycle guidance
    - Requirement: Versioning, immutable tags, rollback notes exist for theme library.
    - Source: `docs/theme-lifecycle-and-library.md`
    - Intended code: Documentation-only; verify any implementation references if present
    - Status: ✅ Implemented
    - Evidence: `docs/theme-lifecycle-and-library.md`

18) CLI theme overrides
    - Requirement: `pnpm quickstart-shop --brand` and `--tokens` supported (generates/merges theme overrides during shop creation).
    - Source: `docs/theming-advanced.md`
    - Intended code: `scripts/src/initShop.ts`, `scripts/src/quickstart-shop.ts`
    - Status: ✅ Implemented
    - Evidence: `scripts/src/quickstart-shop.ts`, `scripts/src/cli/parseQuickstartArgs.ts`, `docs/theming-advanced.md`
    - Notes: `init-shop` remains interactive/config-driven; `quickstart-shop` owns `--brand`/`--tokens`.

## Commitments That Should Already Be Implemented (Plans)

These commitments are drawn from plan docs that are marked Active or Completed and describe expected theming behavior or deliverables.

- THEME-01 (docs/theming-plan.md)
  - Commitment: Token usage in UI and themes is verified against base tokens, and missing tokens/docs are captured in a matrix.
  - Expected evidence: token-to-component matrix, follow-up tasks for missing tokens.
  - Status: ⚠️ Partial
  - Evidence: `docs/theming-token-component-matrix.md`
  - Notes: Matrix exists but no explicit missing-token task list or verification report found.

- THEME-02 (docs/theming-plan.md)
  - Commitment: Theme Editor behavior matches guides; deltas are fixed or explicitly documented.
  - Expected evidence: review notes or doc updates mapping Theme Editor behavior to guides.
  - Status: ✅ Implemented
  - Evidence: `docs/theming-advanced.md`, `apps/cms/src/app/cms/shop/[shop]/themes/useThemePresetManager.ts`, `apps/cms/src/app/cms/shop/[shop]/themes/useThemeTokenSync.ts`
  - Notes: Guide updated to reference the hook-based Theme Editor implementation; base theme selection now persists `themeId` and resets defaults/overrides server-side (see checklist item #5).

- THEME-03 (docs/theming-plan.md)
  - Commitment: Theme performance/a11y guardrails documented; at least one automated check references them.
  - Expected evidence: guidance plus a test/lint that references the guidance (for example contrast checks).
  - Status: ⚠️ Partial
  - Evidence: `docs/typography-and-color.md`, `docs/palette.md`, `packages/ui/src/components/cms/page-builder/__tests__/FontsPanel.contrast.test.ts`
  - Notes: Contrast checks exist; no explicit linkage to performance budgets found.

- CMS-BUILD-02 (docs/cms/shop-build-plan.md) + gap analysis
  - Commitment: Clear, non-expert CMS surfaces exist for required checks, including theme selection and tokens.
  - Expected evidence: Configurator steps and summary entry points for theme readiness.
  - Status: ✅ Implemented
  - Evidence: `docs/cms/shop-build-journey-map.md`, `apps/cms/src/app/cms/configurator/steps/StepTheme.tsx`, `apps/cms/src/app/cms/configurator/steps/StepTokens.tsx`

- CMS-BUILD-06 (docs/cms/shop-build-plan.md)
  - Commitment: Component and block usage matrix exists, including Theme Editor and theme-linked surfaces.
  - Expected evidence: matrix doc or section that includes theming surfaces/routes.
  - Status: ✅ Implemented
  - Evidence: `docs/cms/shop-build-ui-audit.md`
  - Notes: `docs/cms/shop-build-ui-audit.md` now includes an explicit matrix section (“Component/block → surfaces/routes matrix”) suitable for linking from audits and plans.

- CMS-BUILD-09 (docs/cms/shop-build-plan.md)
  - Commitment: Inline help/link patterns exist to bridge CMS surfaces to theming/design system docs.
  - Expected evidence: CMS components/routes with doc links (Theme Editor, Page Builder) and documented patterns.
  - Status: ✅ Implemented
  - Evidence: `apps/cms/src/app/cms/shop/[shop]/themes/ThemeEditor.tsx`, `docs/cms/shop-build-ui-patterns.md`
  - Notes: Theme Editor includes an inline help banner, and CMS help patterns are documented (`CmsInlineHelpBanner`).

- Journey map (docs/cms/shop-build-journey-map.md)
  - Commitment: Theme and token steps are mapped to `StepTheme` and `StepTokens`, with preview via `ThemeEditorForm`.
  - Expected evidence: Step files exist and are wired to theme token persistence.
  - Status: ✅ Implemented
  - Evidence: `docs/cms/shop-build-journey-map.md`, `apps/cms/src/app/cms/configurator/steps/StepTheme.tsx`, `apps/cms/src/app/cms/configurator/steps/StepTokens.tsx`, `apps/cms/src/app/cms/configurator/steps/ThemeEditorForm.tsx`
