Type: Guide
Status: Active
Domain: CMS
Last-reviewed: 2025-12-03

Primary code entrypoints:
- docs/cms/shop-build-ui-plan.md
- docs/cms/shop-build-ui-audit.md
- apps/cms/src/app/cms/configurator/**
- apps/cms/src/app/cms/shop/[shop]/settings/**
- apps/cms/src/app/cms/shop/[shop]/products/page.tsx
- packages/ui/src/components/cms/**

# CMS Shop Build & Launch UI Patterns

This guide supports **CMS-UI-02** in `docs/cms/shop-build-ui-plan.md`. It defines canonical UI patterns for shop build, launch, and update flows and ties them to design‑system components in `packages/ui`.

- **Audience:** CMS engineers, designers, and AI agents implementing or refactoring UI for build/launch/update.
- **Role:** describe *what* patterns exist, their props/state, and *which components* should implement them. The corresponding **Plan** is `docs/cms/shop-build-ui-plan.md` (Type: Plan), and the **Audit** is `docs/cms/shop-build-ui-audit.md` (Type: Research).

If behaviour or visuals in this doc contradict the code, treat the code as canonical and update this doc as a follow‑up.

## 1. CmsBuildHero — build/launch hero surface

**Purpose:** Shared hero layout for the main build/launch surfaces:

- Configurator dashboard hero.
- Settings hero (`SettingsHero`).
- Products hero (`/cms/shop/[shop]/products`).

**Intended use**

- Top‑of‑page “anchor” that explains the current context and primary goal, and presents one or two primary CTAs.
- Optionally shows a small inline checklist or progress summary (for example “4 of 7 launch tasks complete”).

**Props (conceptual)**

- `tag: string` – short label (for example `"Configurator"`, `"Shop settings"`, `"Catalog · {shop}"`).
- `title: string` – main heading.
- `body: string` – supporting copy.
- `primaryCta?: { label: string; href?: string; onClick?: () => void }`.
- `secondaryCtas?: { label: string; href?: string; onClick?: () => void }[]`.
- `inlineMeta?: Array<{ label: string; value: string }>` – simple stats like “Core milestones 3/7”.
- `tone?: "build" | "operate" | "upgrade"` – allows minor visual/surface differences while sharing structure.

**Design‑system implementation**

- Location: `packages/ui/src/components/cms/CmsBuildHero.tsx`.
- Built from:
  - `Card`, `CardContent`, `Tag`, `Button` from `@ui/components/atoms`.
  - Layout primitives `Grid`, `Inline` from `@ui/components/atoms/primitives`.
- Skinned by tokens only (hero background, text color, radius, elevation).
- CMS components (`ConfiguratorHero`, `SettingsHero`, Products hero) should become thin wrappers around `CmsBuildHero`.

## 2. CmsLaunchChecklist — launch/readiness checklist

**Purpose:** Standard checklist UI for launch and readiness states:

- Configurator LaunchPanel checklist (required ConfigChecks).
- Products “catalog launch checklist” card.
- Upgrade/update readiness checklists (upgrade preview and edit preview).

**Intended use**

- Show builders a small, clear list of tasks with:
  - Label per task (builder‑facing, e.g. “Products in stock”).
  - Status (`complete`, `needs attention`, `pending`).
  - A single, obvious “Fix” action per row that deep‑links to the correct surface.
- Make the “launch‑ready” state explicit and celebratory.

**Props (conceptual)**

- `items: Array<{ id: string; label: string; status: "complete" | "warning" | "error" | "pending"; href: string; onFix?: () => void }>` – rows mapping directly to ConfigChecks or domain‑specific readiness checks.
- `readyLabel?: string` – copy for the “all checks green” state.
- `showReadyCelebration?: boolean` – whether to render celebratory copy/decoration when all items are `complete`.

**Design‑system implementation**

- Location: `packages/ui/src/components/cms/CmsLaunchChecklist.tsx`.
- Built from:
  - `Card`, `CardContent`, `Tag`, `Button`, `Alert` atoms.
  - `Inline` layout primitive.
- CMS uses:
  - Configurator LaunchPanel checklist uses `CmsLaunchChecklist` with ConfigCheck‑derived items.
  - Products hero uses `CmsLaunchChecklist` with catalog‑health items.

## 3. CmsSettingsSnapshot — shop configuration snapshot

**Purpose:** Shared “snapshot” view of shop configuration used in build and operations contexts:

- Settings hero snapshot (`SettingsHero`).
- ConfigurationOverview high‑level blocks (languages, currency, tax region, theme).
- Future dashboards summarising readiness or environment state.

**Intended use**

- Quickly convey important configuration at a glance, especially fields that impact ConfigChecks and launch.
- Provide consistent labels and formatting for shared concepts (languages, currency, tax region, theme preset).

**Props (conceptual)**

- `rows: Array<{ id: string; label: string; value: string; tone?: "default" | "warning" | "error" | "success" }>` – labelled snapshot items.
- `title?: string` – snapshot card title (for example “Current snapshot”).
- `body?: string` – descriptive copy or hint (for example “You can update storefront details and commerce settings below.”).

**Design‑system implementation**

- Location: `packages/ui/src/components/cms/CmsSettingsSnapshot.tsx`.
- Built from:
  - `Card`, `CardContent`, `Tag`, `Alert` atoms.
  - `Inline` / simple stack layout.
- CMS uses:
  - `SettingsHero` snapshot and ConfigurationOverview’s top cards should be expressed via `CmsSettingsSnapshot`.

## 4. CmsStepShell — configurator step frame

**Purpose:** Standard frame for “steps” in Configurator‑style flows:

- Configurator step pages (`StepPage`).
- Future multi‑step wizards for upgrades or other flows.

**Intended use**

- Provide consistent:
  - Icon/emoji area, step count, label, and description.
  - Status tag (`Complete`, `In progress`, `Skipped`).
  - Optional track pill (e.g. “Essentials”, “Nice to have”).
  - Embedded per‑step progress widget and recommended‑before‐this‑step hints.

**Props (conceptual)**

- `stepId: string`.
- `icon?: ReactNode`.
- `title: string`.
- `description?: string`.
- `status: "complete" | "skipped" | "in-progress"`.
- `trackLabel?: string; trackTone?: "default" | "info" | "warning"`.
- `recommendedBefore?: string[]` – labels of steps recommended before this one.
- `children: React.ReactNode` – the step body.

**Design‑system implementation**

- Location: `packages/ui/src/components/cms/CmsStepShell.tsx`.
- Built from:
  - `Card`, `CardContent`, `Tag`, `Alert`, `Inline`.
- CMS uses:
  - Configurator `StepPage` should compose `CmsStepShell` around the actual step content instead of duplicating header/progress markup.

## 5. CmsInlineHelpBanner — inline docs/help CTA

**Purpose:** Consistent inline help for build surfaces:

- Status bar Help, SettingsHero doc buttons, ConfigurationOverview language help link.
- Additional Pages and Theme Editor help banners.
- Products first‑product help copy and CTA.

**Intended use**

- Provide a small, visually consistent banner or CTA that:
  - Explains why a surface matters for launch in builder‑friendly language.
  - Offers one or more doc links (guide, journey map, contract).
  - Emits telemetry (`build_flow_help_requested`) when used.

**Props (conceptual)**

- `heading?: string`.
- `body: string`.
- `links: Array<{ label: string; href: string; onClick?: () => void }>` – doc/help links.
- `tone?: "info" | "warning"` – for soft vs more urgent help.

**Design‑system implementation**

- Location: `packages/ui/src/components/cms/CmsInlineHelpBanner.tsx`.
- Built from:
  - `Alert` + optional `Button` and `Inline`.
- CMS uses:
  - StatusBar and SettingsHero should invoke this pattern for help CTAs.
  - Additional Pages and Theme Editor banners should be structurally identical and differ only in copy/links.

## 6. CmsMetricTiles — quick‑stats tiles

**Purpose:** Shared metric tiles used to summarise build/launch or catalog state:

- Configurator dashboard quick‑stats (“Core milestones”, “Optional upgrades”, “Shop health”).
- Products hero quick stats (counts by status).
- Potential upgrade health tiles.

**Intended use**

- Display a small grid of 2–4 tiles with:
  - Label.
  - Value (e.g. “3/7”, “Healthy”, “5 active”).
  - Short caption (e.g. “All essential steps complete”).

**Props (conceptual)**

- `items: Array<{ id: string; label: string; value: string; caption?: string }>` – metric tiles.

**Design‑system implementation**

- Location: `packages/ui/src/components/cms/CmsMetricTiles.tsx`.
- Built from:
  - `Card`, `Tag`, `Inline`, and tokenised border/background classes.
- CMS uses:
  - `ConfiguratorHero` quick stats and Products hero stats should reuse this, with data coming from configurator progress or product counts.

## 7. Mapping patterns to current CMS surfaces

Using the patterns above, the main CMS build/launch surfaces should converge as follows:

- **Configurator dashboard**
  - Hero: `CmsBuildHero` (tag: “Configurator”, tone: `"build"`).
  - Quick stats: `CmsMetricTiles`.
  - Launch checklist: `CmsLaunchChecklist` embedded in LaunchPanel.
- **Settings**
  - Hero: `CmsBuildHero` (tag: “Shop settings”, tone: `"operate"`).
  - Snapshot card: `CmsSettingsSnapshot` with languages/currency/tax/theme.
- **Products**
  - Hero: `CmsBuildHero` (tag: “Catalog · {shop}”, tone: `"build"`).
  - First‑product copy and CTAs: hero body + `CmsInlineHelpBanner` pointing to `#first-product`.
  - Catalog launch checklist: `CmsLaunchChecklist` with catalog‑specific rows.
  - Stats row: `CmsMetricTiles` summarising product counts.
- **Theme Editor and Additional Pages**
  - Inline help: `CmsInlineHelpBanner` with build‑path‑aware copy and telemetry hooks.
- **Configurator steps**
  - Step frame: `CmsStepShell` around each step’s specific content.
 - **Upgrade preview and edit preview**
  - Hero: `CmsBuildHero` (tone: `"upgrade"` / `"operate"`) describing the upgrade/preview context.
  - Help: `CmsInlineHelpBanner` linking to upgrade docs and contracts.
  - Readiness checklist: `CmsLaunchChecklist` for preview/publish readiness (for example, preview loaded, changes detected, ready to publish/edit).

These mappings, combined with the audit in `docs/cms/shop-build-ui-audit.md`, complete the requirements for **CMS-UI-02** and provide a concrete target for `CMS-UI-03` and `CMS-UI-06` when promoting CMS UI into `packages/ui`.
