Type: Plan
Status: Active
Domain: CMS
Last-reviewed: 2025-12-03
Relates-to charter: docs/cms/cms-charter.md

# CMS Shop Build & Launch UI Plan

This plan focuses on the **visual and interaction design** of CMS shop build, launch, and update flows, with two main goals:

- Deliver a **world‑class, non‑expert‑friendly UI** for building, launching, and updating shops (build, launch, upgrade, update).
- Ensure CMS uses **shared atomic and composite components** from the design system (`packages/ui`) instead of bespoke, one‑off UI, so improvements benefit the whole platform.

Code and contracts remain the source of truth for behaviour (see `docs/cms/cms-charter.md`, `docs/cms/shop-build-plan.md`, `docs/cms/configurator-contract.md`); this plan defines how the **UI layer** should evolve to match those contracts and the design‑system ethos.

## Active tasks

- **CMS-UI-01 — Audit CMS shop-build & launch UI against design system**
  - Status: ☑
  - Scope:
    - Inventory the key CMS surfaces involved in shop build and launch:
      - Configurator dashboard and steps: `apps/cms/src/app/cms/configurator/**`.
      - Shop dashboard and Settings: `apps/cms/src/app/cms/shop/[shop]/**`.
      - Theme, Pages, Products flows used in the one‑hour path.
    - For each surface:
      - Identify layout primitives, hero patterns, checklist patterns, and CTAs in use.
      - Classify which UI elements are already built from `packages/ui/src/components/{atoms,molecules,organisms,cms}` and which are bespoke to `apps/cms`.
    - Produce a short matrix mapping:
      - `UI pattern → implementation` (design system vs app‑local).
      - `Surface(s)` where the pattern appears (Configurator, Settings, Pages, Products, Telemetry, etc.).
  - Dependencies:
    - `docs/cms/shop-build-plan.md` (for the functional build path).
    - `docs/AGENTS.docs.md` (doc/plan conventions).
  - Code/docs:
    - `apps/cms/src/app/cms/configurator/**`
    - `apps/cms/src/app/cms/shop/[shop]/**`
    - `apps/cms/src/app/cms/pages/**`, `apps/cms/src/app/cms/products/**`
    - `packages/ui/src/components/**`
  - Definition of done:
    - A concise audit document (new Research or a section in `docs/cms/shop-build-journey-map.md`) exists that lists the main CMS build/launch surfaces, the UI patterns they use, and whether each pattern is backed by a shared design‑system component or a CMS‑local implementation.
    - `docs/cms/shop-build-ui-audit.md` fulfils this role and is updated alongside major CMS build/launch UI refactors.

- **CMS-UI-02 — Define canonical CMS build/launch UI patterns**
  - Status: ☑
  - Scope:
    - Based on CMS-UI-01, define a small set of **canonical UI patterns** for build/launch/update flows, for example:
      - Hero / summary cards (Configurator dashboard, Settings hero, Products hero).
      - Launch readyness checklists (Launch panel and Configurator Summary).
      - Step progress indicators and quick‑stats tiles.
      - Inline help banners and doc links (StatusBar, Settings, Additional Pages, Theme Editor, Products).
    - For each pattern, document:
      - Intended use cases (e.g. “Configurator launch cockpit”, “Settings snapshot”, “Products overview for build”).
      - Required props/state (titles, tags, status counts, links, telemetry hooks).
      - The existing or proposed design‑system components that should implement it.
  - Dependencies:
    - CMS-UI-01 (audit).
    - `docs/theming-charter.md`, `docs/commerce-charter.md` (for cross‑domain consistency).
  - Code/docs:
    - `docs/cms/shop-build-journey-map.md`
    - `docs/cms/shop-build-docs-help-plan.md`
    - `docs/cms/shop-build-ui-audit.md`
    - `docs/cms/shop-build-ui-patterns.md`
    - `packages/ui/src/components/{atoms,molecules,organisms,cms}`
  - Definition of done:
    - A short, canonical description of CMS build/launch UI patterns exists (either in this plan or a linked Guide/Research doc) that names each pattern, its purpose, its expected props, and the design‑system components that should realise it.

- **CMS-UI-03 — Converge CMS-only UI onto design-system components**
  - Status: ☑
  - Scope:
    - From CMS-UI-01/02, identify **CMS‑local UI** that should instead live in or be powered by the design system, for example:
      - Configurator hero and quick‑stats tiles.
      - LaunchPanel checklist rows and Call‑to‑Action layouts.
      - SettingsHero layout and snapshot cards.
      - Products hero and catalog overview cards tied to `ProductsTable`.
    - For each candidate:
      - Decide whether it becomes a new composable in `packages/ui/src/components/cms` (e.g. `CmsHero`, `CmsLaunchChecklist`, `CmsSettingsSnapshot`) or can be expressed via existing templates/organisms.
      - Specify any skinning/theming points (tokens, variant props) needed to keep CMS flavour while sharing the structure.
  - Dependencies:
    - CMS-UI-01, CMS-UI-02.
    - `packages/ui/src/components/cms/**`, `packages/ui/src/components/layout/**`.
  - Code/docs:
    - `apps/cms/src/app/cms/configurator/components/**`
    - `apps/cms/src/app/cms/shop/[shop]/settings/components/**`
    - `apps/cms/src/app/cms/shop/[shop]/products/page.tsx`
    - `packages/ui/src/components/cms/**`
  - Definition of done:
    - A concrete list of CMS components that should migrate into, or be rebuilt from, `packages/ui` is documented with target filenames and rough prop signatures, suitable for turning into implementation tickets.
    - `docs/cms/shop-build-ui-patterns.md` and `docs/cms/shop-build-ui-audit.md` describe the canonical `Cms*` patterns (hero, checklist, snapshot, inline help, metrics) and which CMS surfaces now compose them.

- **CMS-UI-04 — Unify shop-build visual hierarchy across surfaces**
  - Status: ☑
  - Scope:
    - Review the visual hierarchy and layout rhythms across:
      - Configurator dashboard (hero + Launch panel + steps list).
      - Shop dashboard and Settings hero/snapshot.
      - Products, Pages, and Theme Editor entry hero sections.
    - Identify inconsistencies in:
      - Heading levels, tag usage, spacing, and elevation.
      - Placement of primary vs secondary CTAs and checklists.
      - How “build vs operate” states are communicated (e.g. pre‑launch vs post‑launch).
    - Propose a set of small, implementable tweaks (using existing design‑system primitives) to:
      - Make the build journey feel visually continuous from Configurator → Settings → Pages/Products.
      - Clarify what is required for launch vs what is optional polish.
  - Dependencies:
    - CMS-UI-01, CMS-UI-02.
    - `docs/cms/build-shop-guide.md` (one‑hour path copy).
  - Code/docs:
    - `apps/cms/src/app/cms/configurator/Dashboard.tsx`
    - `apps/cms/src/app/cms/shop/[shop]/page.tsx`
    - `apps/cms/src/app/cms/shop/[shop]/settings/**`
    - `apps/cms/src/app/cms/shop/[shop]/products/page.tsx`
  - Definition of done:
    - A short list of specific visual/interaction changes is documented (for example “align hero paddings and tag usage between ConfiguratorDashboard and SettingsHero”, “reuse Launch checklist pattern in Products hero”), each with code references and an indication of which ones require new design‑system support vs pure layout tweaks.
    - Current changes:
      - `apps/cms/src/app/cms/configurator/steps/StepSummary.tsx` now renders a `CmsLaunchChecklist` driven by real ConfigChecks via `apps/cms/src/app/cms/configurator/hooks/useConfiguratorDashboardState.ts`.
      - `apps/cms/src/app/cms/shop/[shop]/upgrade-preview/UpgradePreviewClient.tsx` includes an upgrade readiness checklist using `CmsLaunchChecklist`, aligning upgrade preview with launch readiness patterns.
      - `apps/cms/src/app/cms/shop/[shop]/products/page.tsx` uses `CmsBuildHero`, `CmsMetricTiles`, and `CmsLaunchChecklist` so Products build surfaces match the Configurator/Settings hierarchy.

- **CMS-UI-05 — Strengthen upgrade/update UI around launch surfaces**
  - Status: ☑
  - Scope:
    - Extend the build‑focused UI patterns to cover **upgrade and update** flows:
      - Review upgrade/rollback surfaces under `apps/cms/src/app/cms/shop/[shop]/upgrade-*`.
      - Review edit/preview/re‑publish flows in `apps/cms/src/app/cms/shop/[shop]/edit-preview/**` and `docs/upgrade-preview-republish.md`.
    - Identify where current UI is overly technical or lacks the same clarity/detail as the build/launch surfaces.
    - Propose:
      - How existing build/launch UI patterns (hero, checklist, inline help) can be reused to guide upgrades and post‑launch changes.
      - Any new patterns needed (e.g. “Upgrade impact summary”, “Update safety checklist”) and whether they should live in `packages/ui`.
  - Dependencies:
    - `docs/upgrade-flow.md`, `docs/upgrade-preview-republish.md`.
    - CMS-UI-02 (canonical patterns).
  - Code/docs:
    - `apps/cms/src/app/cms/shop/[shop]/upgrade-preview/**`
    - `apps/cms/src/app/cms/shop/[shop]/UpgradeSummary*.tsx`
    - `apps/cms/src/app/cms/shop/[shop]/edit-preview/**`
  - Definition of done:
    - A set of UI/UX improvements is outlined for upgrade/update flows, reusing the same pattern vocabulary as build/launch and mapped to concrete components/entrypoints, ready for implementation tickets.
    - Current changes:
      - `apps/cms/src/app/cms/shop/[shop]/upgrade-preview/UpgradePreviewClient.tsx` now presents an upgrade readiness checklist via `CmsLaunchChecklist` (preview loaded, changes detected, ready to publish), mirroring the launch checklist pattern.
      - `apps/cms/src/app/cms/shop/[shop]/edit-preview/EditPreviewPage.tsx` uses `CmsBuildHero`, `CmsInlineHelpBanner`, and a `CmsLaunchChecklist`‑based preview readiness panel so upgrade preview and edit preview share the same readiness language and hierarchy.

- **CMS-UI-06 — Wire build/launch/upgrade UI patterns into the design system**
  - Status: ☑
  - Scope:
    - For the canonical patterns defined in CMS-UI-02:
      - Design and document (or refine existing) design‑system components in `packages/ui` that embody them.
      - Ensure each component:
        - Lives under an appropriate namespace (e.g. `packages/ui/src/components/cms` or `.../layout`).
        - Has Storybook stories that show both CMS build/launch use and more general platform use, where applicable.
        - Exposes only **skinning/theming props** (tokens, variants) and **structural hooks** (slots), avoiding one‑off CMS logic.
    - Add lightweight inline references in CMS code pointing back to these components (e.g. `// UI: @ui/components/cms/CmsLaunchChecklist`).
  - Dependencies:
    - CMS-UI-02, CMS-UI-03.
    - `docs/design-system-package-import.md`, `docs/storybook.md`.
  - Code/docs:
    - `packages/ui/src/components/cms/**`, `packages/ui/src/components/layout/**`
    - `apps/storybook/**`
    - Relevant CMS hero/launch/checklist components.
  - Definition of done:
    - A set of design‑system components exists (or is clearly planned) for the main build/launch/upgrade UI patterns, with Storybook coverage and clear guidance on where CMS should use them instead of local implementations.
    - Current changes:
      - `packages/ui/src/components/cms/CmsBuildHero.tsx`, `CmsLaunchChecklist.tsx`, `CmsSettingsSnapshot.tsx`, `CmsInlineHelpBanner.tsx`, and `CmsMetricTiles.tsx` provide the canonical hero, readiness checklist, snapshot, help, and metrics patterns with Storybook stories (`*.stories.tsx`) showing build/operate/upgrade use.
      - CMS build/launch/upgrade surfaces (`ConfiguratorHero`, `LaunchPanel`, `SettingsHero`, Products hero, upgrade preview, edit preview) now consume these `Cms*` components as thin wrappers, with inline `// UI: @ui/components/cms/...` references where appropriate.

## Completed / historical

- None yet.
