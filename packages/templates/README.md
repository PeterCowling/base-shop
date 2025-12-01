# @acme/templates

Reusable application templates and block implementations for storefronts (for example product detail, checkout, order views, store locator), built from `@acme/ui` and Page Builder primitives.

See:

- `docs/architecture.md` – package layering and public surfaces.
- `docs/platform-vs-apps.md` – platform vs apps responsibilities and public API.
- `docs/cms-research.md` (§“Templates/prefabs and evolution”) – target API for templates and scaffolding.

Templates should compose domain behaviour from `@acme/platform-core` and UI from `@acme/ui` via their documented public exports, without importing from internal `src/` paths.

## Responsibilities

`@acme/templates` owns:

- The curated catalog of built‑in page and section templates (home, PLP, PDP, checkout shells, legal pages, etc.).
- Template descriptors and scaffolding helpers that can be used by CMS configurators and template apps.
- Domain‑level template variants for different shops/locales, composed from Page Builder building blocks and `@acme/ui` primitives.

It should **not**:

- Contain low‑level design system primitives (those live in `@acme/ui`).
- Reimplement domain logic that belongs in `@acme/platform-core` (pricing, availability, cart/checkout, etc.).

## Public surface

The public API of this package is designed to be small and declarative:

- All public exports are re‑exported from `src/index.ts` and surfaced via the `exports` map in `package.json`.
- Templates and scaffolding helpers should be exported from `src/index.ts` (and optionally grouped under `src/public/**`).
- Call sites must import from `@acme/templates`, not from deep `src/**` paths.

Example (future) usage:

```ts
import { coreTemplates /* TemplateDescriptor[] */ } from "@acme/templates";

// Combined with core scaffolding APIs in @acme/page-builder-core:
// const page = scaffoldPageFromTemplate(coreTemplates[0], ctx);
```

## Adding a page template

Templates are plain `TemplateDescriptor` objects that describe a page layout using Page Builder blocks.

1. **Define the descriptor**

   - Add a new entry to `corePageTemplates` in `packages/templates/src/corePageTemplates.ts`.
   - Use an id that scopes the template (for example `core.page.home.hero-and-grid`) and reference existing block types:

   ```ts
   import type { TemplateDescriptor } from "@acme/page-builder-core";

   export const corePageTemplates: TemplateDescriptor[] = [
     {
       id: "core.page.home.hero-and-grid",
       version: "1.0.0",
       kind: "page",
       label: "Home – hero and grid",
       category: "Hero",
       pageType: "marketing",
       components: [
         { id: "hero", type: "HeroBanner" },
         { id: "grid", type: "ProductGrid", mode: "collection" },
       ],
       origin: "core",
     },
     // existing templates...
   ];
   ```

2. **Expose the template through the public surface**

   - Re‑export the new descriptor (or a filtered list) from `src/index.ts`:

   ```ts
   export {
     corePageTemplates,
     homePageTemplates,
     // any new groupings...
   } from "./corePageTemplates";
   ```

3. **Instantiate a page from the template**

   - Use `scaffoldPageFromTemplate` from `@acme/page-builder-core` in CMS/configurator code to create a `Page` for a specific shop/locale:

   ```ts
   import {
     scaffoldPageFromTemplate,
     type ScaffoldContext,
   } from "@acme/page-builder-core";
   import { corePageTemplates } from "@acme/templates";

   const ctx: ScaffoldContext = {
     shopId: "demo-shop",
     locale: "en",
     primaryLocale: "en",
   };

   const page = scaffoldPageFromTemplate(corePageTemplates[0], ctx);
   // Persist `page` via platform-core repositories.
   ```

This flow keeps templates declarative in `@acme/templates` while relying only on public Page Builder core APIs for instantiation.
```

## Internal modules

Internal implementation details (individual template definitions, wiring helpers) should live under:

- `src/internal/**` – non‑public modules.
- Other deep `src/**` paths that are **not** re‑exported from `src/index.ts`.

Apps, CMS packages, and the template app must not import from these internal paths directly. If a template or helper needs to be shared, promote it to a public export in `src/index.ts` and document it here.
