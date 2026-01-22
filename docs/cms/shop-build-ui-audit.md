Type: Research
Status: Active
Domain: CMS
Last-reviewed: 2025-12-03
Primary code entrypoints:
- apps/cms/src/app/cms/configurator/**
- apps/cms/src/app/cms/shop/[shop]/settings/**
- apps/cms/src/app/cms/shop/[shop]/products/**
- apps/cms/src/app/cms/pages/**
- packages/ui/src/components/{atoms,molecules,organisms,cms}

# CMS Shop Build & Launch UI Audit

This document supports **CMS-UI-01** in `docs/cms/shop-build-ui-plan.md`. It maps the main CMS shop-build and launch surfaces to the underlying design‑system components, highlighting where the UI already uses shared atoms/molecules/organisms and where CMS‑local UI should converge onto `packages/ui`.

- **Audience:** CMS engineers, designers, and AI agents working on build/launch UI and design‑system alignment.
- **Role:** a factual inventory of patterns and components, not a plan. The corresponding **Plan** is `docs/cms/shop-build-ui-plan.md` (Type: Plan).

If behaviour or visuals in this doc contradict the code, treat the code as canonical and update this doc as a follow‑up.

## 1. Configurator dashboard & steps

### 1.1 Dashboard shell (`ConfiguratorDashboard`)

- **Surface**
  - File: `apps/cms/src/app/cms/configurator/Dashboard.tsx`
  - Route: `/cms/configurator`
- **Patterns**
  - Hero panel with tag, heading, description and “Quick launch” CTA.
  - Launch panel card (`LaunchPanel`) for environment and launch status.
  - Steps list (`ConfiguratorStepList`) and progress tiles (`TrackProgressList`).
  - Bottom “Launch shop” button aligned to the launch panel.
- **Design‑system usage**
  - Uses shared atoms:
    - `Toast` from `@ui/components/atoms`.
    - Layout primitives via `DashboardPrimitives` (`CardRoot`, `CardSection`, `ButtonElement`, `TagElement`) which wrap design‑system atoms with dashboard‑specific styling.
  - Configurator hero now composes:
    - `CmsBuildHero` and `CmsMetricTiles` from `packages/ui/src/components/cms`.
  - Launch panel checklist now composes:
    - `CmsLaunchChecklist` from `packages/ui/src/components/cms`, driven by `LaunchChecklistItem` derived from ConfigChecks.
- **CMS‑local UI**
  - `ConfiguratorHero`, `LaunchPanel`, `TrackProgressList`, and `ConfiguratorStepList` still live under `apps/cms/src/app/cms/configurator/components/**` but increasingly act as thin assemblies around `Cms*` patterns.
  - Remaining bespoke logic is mostly wiring (ConfigCheck → checklist items, progress grouping, telemetry), not layout.

### 1.2 Step shell (`StepPage`) and status bar

- **Surface**
  - Step wrapper: `apps/cms/src/app/cms/configurator/[stepId]/step-page.tsx`
  - Status bar: `apps/cms/src/app/cms/configurator/ConfiguratorStatusBar.tsx`
- **Patterns**
  - Step header with icon, step count, label, description, and status `Tag`.
  - Inline pill for track (e.g. “Essentials” vs “Nice to have”).
  - Embedded `ConfiguratorProgress` component and recommended‑steps `Alert`.
  - Sticky bottom status bar with “unsaved/autosaved” indicator, Help link, and Guided Tour replay.
- **Design‑system usage**
  - Uses `Card`/`CardContent`, `Tag`, `Alert`, `Inline` primitives from `@ui/components/atoms`.
  - Step icons are lightweight and use tokenised text colours (`text-success`, etc.).
- **CMS‑local UI**
  - Step header layout, progress block, and recommended‑steps `Alert` are CMS‑specific assemblies and not defined as design‑system components.
  - Status bar uses shared atoms but is a unique CMS composition responsible for build‑flow telemetry and help CTAs.

## 2. Settings and shop‑level build surfaces

### 2.1 Settings hero (`SettingsHero`)

- **Surface**
  - File: `apps/cms/src/app/cms/shop/[shop]/settings/components/SettingsHero.tsx`
  - Route: `/cms/shop/[shop]/settings`
- **Patterns**
  - Hero treatment matching Configurator (hero background, large heading, supporting copy).
  - Primary CTA (“Configure services”), secondary CTA (“Review theme tokens”), and doc links (“Open build guide”, “Open journey map”).
  - Snapshot card with key settings (languages, currency, tax region, theme).
- **Design‑system usage**
  - Layout primitive `Grid` (`DSGrid`) from `@ui/components/atoms/primitives/Grid`.
  - Hero and snapshot now use shared CMS patterns from `packages/ui/src/components/cms`:
    - `CmsBuildHero` for the hero text and CTAs.
    - `CmsSettingsSnapshot` for the “Current snapshot” card.
- **CMS‑local UI**
  - SettingsHero is now a thin CMS wrapper that:
    - Supplies copy, CTAs, and telemetry hooks to `CmsBuildHero`.
    - Maps `SnapshotItem[]` into `CmsSettingsSnapshotRow[]`.
  - Layout (hero + snapshot side‑by‑side) remains CMS‑specific but built entirely from shared patterns.

### 2.2 Configuration overview (`ConfigurationOverview`)

- **Surface**
  - File: `apps/cms/src/app/cms/shop/[shop]/settings/components/ConfigurationOverview.tsx`
- **Patterns**
  - Cards for “Language coverage”, “Commerce defaults”, theme tokens table, and filter mappings JSON.
  - Inline docs link for languages, pointing to the build‑shop guide.
  - Theme tokens table with Reset actions per token.
- **Design‑system usage**
  - `Card`, `CardContent` atoms.
  - `CodeBlock` molecule from `@ui/components/molecules`.
  - `DataTable` CMS table component from `packages/ui/src/components/cms/DataTable`.
- **CMS‑local UI**
  - The card layout and specific combination of snapshot fields are CMS‑specific; there is no generic “ConfigurationOverview” component in `packages/ui`.

## 3. Products and catalog build surfaces

### 3.1 Products hero and catalog overview

- **Surface**
  - File: `apps/cms/src/app/cms/shop/[shop]/products/page.tsx`
  - Route: `/cms/shop/[shop]/products`
- **Patterns**
  - Hero section mirroring SettingsHero and Configurator hero:
    - Tag (“Catalog · {shop}”), heading, and descriptive copy.
    - Inline “first product” prompt when there are no products (headline, explanation, time estimate).
    - Progress bar showing active vs total products.
    - CTAs:
      - “Create first product” (minimal wizard).
      - “Add new product” (full editor).
      - Links into merchandising pages and component editor.
  - Right‑hand “Launch checklist” card specific to catalog health.
  - Catalog overview card wrapping `ProductsTable`.
- **Design‑system usage**
  - Uses shadcn `Button`, `Card`, `CardContent`, and design‑system `Tag`, `Progress`, `Alert` atoms/primitives.
  - Hero + metrics now compose CMS patterns from `packages/ui/src/components/cms`:
    - `CmsBuildHero` for the catalog hero (tag, heading, subtitle).
    - `CmsMetricTiles` for active/draft/scheduled/archived quick‑stats.
  - `ProductsTable` is a reusable CMS component (`packages/ui/src/components/cms/ProductsTable.client.tsx`), already aligned with the design system.
- **CMS‑local UI**
  - The Products “Launch checklist” card now uses the shared `CmsLaunchChecklist` component, driven by ConfigChecks and catalog stats.
  - The catalog overview section (heading + table wrapper) is CMS‑specific layout around `ProductsTable`.

## 4. Theme and page‑builder build surfaces

### 4.1 Theme Editor (`ThemeEditor`)

- **Surface**
  - File: `apps/cms/src/app/cms/shop/[shop]/themes/ThemeEditor.tsx`
  - Route: `/cms/shop/[shop]/themes`
- **Patterns**
  - A vertically‑stacked editor:
    - Theme selection, palette preview, preset controls.
    - Brand intensity slider, contrast warnings `Alert`.
    - Theme preview, PalettePicker, TypographySettings.
    - Inline help banner linking to theming charter and build‑shop guide.
- **Design‑system usage**
  - Uses shadcn `Button`, `Alert`, and `Inline` primitives.
  - Core editor widgets (PalettePicker, TypographySettings, ThemePreview, BrandIntensitySelector) are custom ThemeEditor components, but draw heavily on tokenised design primitives.
- **CMS‑local UI**
  - Theme editor layout and controls are CMS‑specific; while they align with the token model, they are not generic design‑system components and are not yet reused outside CMS.

### 4.2 Page Builder / Additional Pages (`StepAdditionalPages`)

- **Surface**
  - File: `apps/cms/src/app/cms/configurator/steps/StepAdditionalPages/StepAdditionalPages.tsx`
- **Patterns**
  - Heading, list of existing additional pages, “Add page” CTA.
  - Sub‑forms for layout selection, metadata, and Page Builder content.
  - Inline help banner explaining that Additional Pages are optional for launch, linking to the starter kits section and emitting build‑flow telemetry.
- **Design‑system usage**
  - Uses shadcn `Button`, `Toast`, and `PageBuilder` from `packages/ui/src/components/cms/PageBuilder`.
  - Leverages locale helpers and CMS‑specific Page Builder components.
- **CMS‑local UI**
  - Step layout and the way Additional Pages are surfaced in Configurator are CMS‑specific.

## 5. Telemetry and admin utilities

### 5.1 Telemetry dashboard (`apps/cms/src/app/cms/telemetry/**`)

- **Surface**
  - Telemetry page and filters used to inspect `build_flow_*` events and other analytics.
- **Patterns**
  - Filter presets (including `build-flow`), table listing events, and time series chart.
- **Design‑system usage**
  - Uses `DataTable` and chart wiring built on shared primitives.
- **CMS‑local UI**
  - `TelemetryFiltersPanel`, preset definitions, and summary cards are CMS‑specific; they could eventually be formalised as generic analytics view components in `packages/ui`.

## 6. Summary: reuse vs bespoke

### 6.0 Component/block → surfaces/routes matrix (CMS-BUILD-06 view)

This is the “at-a-glance” matrix view of which concrete UI components and Page Builder blocks underpin each major build surface (pre‑launch Configurator + initial post‑launch editing).

| Component / block | Surfaces (routes) | Primary entrypoints |
|---|---|---|
| `CmsBuildHero` | Configurator dashboard (`/cms/configurator`), Settings (`/cms/shop/[shop]/settings`), Products (`/cms/shop/[shop]/products`), Edit preview (`/cms/shop/[shop]/edit-preview`) | `packages/ui/src/components/cms/CmsBuildHero.tsx`, `apps/cms/src/app/cms/configurator/components/ConfiguratorHero.tsx`, `apps/cms/src/app/cms/shop/[shop]/settings/components/SettingsHero.tsx`, `apps/cms/src/app/cms/shop/[shop]/products/page.tsx` |
| `CmsMetricTiles` | Configurator dashboard (`/cms/configurator`), Products (`/cms/shop/[shop]/products`) | `packages/ui/src/components/cms/CmsMetricTiles.tsx`, `apps/cms/src/app/cms/configurator/components/ConfiguratorHero.tsx`, `apps/cms/src/app/cms/shop/[shop]/products/page.tsx` |
| `CmsLaunchChecklist` | Configurator dashboard (`/cms/configurator`), Configurator Summary step, Products (`/cms/shop/[shop]/products`), Edit preview (`/cms/shop/[shop]/edit-preview`) | `packages/ui/src/components/cms/CmsLaunchChecklist.tsx`, `apps/cms/src/app/cms/configurator/components/LaunchPanel.tsx`, `apps/cms/src/app/cms/configurator/steps/StepSummary.tsx`, `apps/cms/src/app/cms/shop/[shop]/products/page.tsx`, `apps/cms/src/app/cms/shop/[shop]/edit-preview/EditPreviewPage.tsx` |
| `CmsSettingsSnapshot` | Settings (`/cms/shop/[shop]/settings`) | `packages/ui/src/components/cms/CmsSettingsSnapshot.tsx`, `apps/cms/src/app/cms/shop/[shop]/settings/components/SettingsHero.tsx` |
| `CmsInlineHelpBanner` | Theme Editor (`/cms/shop/[shop]/themes`), Additional Pages step, Edit preview (`/cms/shop/[shop]/edit-preview`) | `packages/ui/src/components/cms/CmsInlineHelpBanner.tsx`, `apps/cms/src/app/cms/shop/[shop]/themes/ThemeEditor.tsx`, `apps/cms/src/app/cms/configurator/steps/StepAdditionalPages/StepAdditionalPages.tsx`, `apps/cms/src/app/cms/shop/[shop]/edit-preview/EditPreviewPage.tsx` |
| Page Builder `blockRegistry` + `DynamicRenderer` (blocks) | Page Builder in Configurator steps + Pages editor surfaces (e.g. Additional Pages step and `/cms/pages/*`); runtime rendering via DynamicRenderer | `packages/ui/src/components/cms/blocks/index.ts`, `packages/ui/src/components/DynamicRenderer.tsx`, `packages/ui/src/components/cms/page-builder/PageBuilder.tsx` |
| `ProductsTable` | Products (`/cms/shop/[shop]/products`) | `packages/ui/src/components/cms/ProductsTable.client.tsx`, `apps/cms/src/app/cms/shop/[shop]/products/page.tsx` |

From this audit:

- **Strong reuse of atoms/primitives**
  - CMS build/launch surfaces consistently use design‑system atoms (`Button`, `Tag`, `Card`, `Progress`, `Alert`, `Toast`) and layout primitives (`Grid`, `Inline`).
  - Core tables and builders (`ProductsTable`, `PagesTable`, `DataTable`, `PageBuilder`, `NavigationEditor`) already live in `packages/ui/src/components/cms`.

- **Bespoke CMS assemblies that should be patternised**
  - Configurator dashboard shell (hero, LaunchPanel, step list) — now partially expressed via `CmsBuildHero`, `CmsMetricTiles`, and `CmsLaunchChecklist`, with remaining work focused on wiring and telemetry.
  - Settings hero + snapshot card — now expressed via `CmsBuildHero` + `CmsSettingsSnapshot`, with layout and copy owned by CMS.
  - Products hero + “first product” + catalog overview + catalog launch checklist — hero + metrics now use `CmsBuildHero` and `CmsMetricTiles`, and the catalog “launch checklist” composes `CmsLaunchChecklist` for readiness.
  - Upgrade/rollback summaries and edit‑preview entry points (see `apps/cms/src/app/cms/shop/[shop]/upgrade-preview/UpgradePreviewClient.tsx` and `.../edit-preview/EditPreviewPage.tsx`) now reuse `CmsInlineHelpBanner`, `CmsBuildHero`, and `CmsLaunchChecklist` for upgrade readiness, while keeping impact and telemetry wiring local to CMS.

These CMS‑local assemblies are good candidates to become **canonical CMS patterns** in `packages/ui/src/components/cms` (for example `CmsBuildHero`, `CmsLaunchChecklist`, `CmsSettingsSnapshot`), driven by tokens and props instead of being re‑implemented per surface. The next step (CMS-UI-02) is to define those patterns explicitly and map each of the above surfaces to them.
