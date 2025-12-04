Type: Charter
Status: Canonical
Domain: Theming
Last-reviewed: 2025-12-02

Primary code entrypoints:
- packages/themes/** (base tokens and theme packages)
- packages/ui/** (token usage in components)
- apps/cms/src/app/cms/shop/[shop]/themes/**
- docs/theming*.md, docs/palette.md, docs/typography-and-color.md

If behaviour in this doc contradicts the code, treat the code as canonical and update this doc as a follow‑up.

# Theming Charter

## Goals

- Provide a token-based theming system that keeps design consistent across apps and shops while allowing per-shop branding.
- Make theme selection and token overrides fully CMS-driven, with live preview and safe defaults.
- Ensure accessibility and performance constraints (for example contrast ratios, bundle size) are respected.

## Core Flows

- **Token definition and distribution**
  - Base tokens (colors, typography, spacing, radius, shadows) are defined in `packages/themes/base`.
  - Build scripts generate static and dynamic CSS (`tokens.css`, `tokens.dynamic.css`, `tokens.static.css`) consumed by apps via Tailwind and CSS variables.

- **Theme selection and overrides**
  - Each shop selects a base theme (`themeId`) and may override tokens via `themeOverrides` / `themeTokens` persisted in `Shop`.
  - CMS Theme Editor lets users inspect elements, update tokens, save presets, and reset to defaults.

- **Runtime usage**
  - UI components in `packages/ui` consume tokens using CSS variables (for example `hsl(var(--color-primary))`).
  - Tenant apps and the template app share the same token names and Tailwind integration for consistency.

## Key Contracts

- **Docs**
  - `docs/theming.md` – Theming and live preview behaviour.
  - `docs/theme-lifecycle-and-library.md` – Theme library, versioning, and rollback.
  - `docs/theme-editor-tokens.md` – Token map exposed via `data-token` attributes for the Theme Editor.
  - `docs/palette.md` – Base design palette and contrast requirements.
  - `docs/typography-and-color.md` – Typography and colour system, token sources, and Tailwind integration.

- **CMS implementation**
  - Theme Editor components and server actions under:
    - `apps/cms/src/app/cms/shop/[shop]/themes/**`
    - `apps/cms/src/actions/shops.server.ts`

## Out of Scope

- Per-tenant design system forks outside the token/theming model.
- Low-level details of Tailwind configuration beyond what is covered in `docs/tsconfig-paths.md` and Tailwind config docs.
