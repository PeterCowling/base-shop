---
Type: Reference
Status: Canonical
Domain: CMS
---

# Template Builder Workflow — Author → Package → Ship

Audience: template builders and design system owners creating reusable page/section templates and presets for shop owners. Builders here **do not** launch shops or edit production data; they work in fixture shops and Storybook playgrounds, then publish templates to the library used by CMS.

## 0) Role split and guardrails
- Shop owners assemble shops from the published template library and **never author templates**; see `docs/shop-owner-workflow.md` for their flow.
- Template builders **never** run Launch, smoke, or production publishes on customer shops. Use fixture shops (`/cms/shop/template-*`) or Storybook stories for live previews.
- Keep APIs clean: export through `@acme/templates`, `@acme/page-builder-core`, and `@acme/page-builder-ui` only. No deep imports from `@acme/ui/src/components/cms/page-builder/**`.

## 1) Prepare the workspace
- Install/build: `pnpm install` then `pnpm -r build`. Use `pnpm --filter @acme/templates test` for scoped checks.
- Run Storybook as the interactive playground (`pnpm --filter @acme/storybook dev`). Use the Page Builder flows stories to exercise presets/sections with MSW data.
- Preferred edit surface for templates: CMS Page Builder on a fixture shop (`/cms/shop/template-core/pages/.../builder`) so you stay on the real registry and preview token wiring.

## 2) Design constraints for templates/presets
- Use only block types from the shared registry (`coreBlockDescriptors` / `starterBlockRegistry`). Add new blocks there first before templating.
- Provide real previews: every template/preset should ship a meaningful `previewImage` (no `/window.svg` placeholders) and localized `label`/`description`.
- Seed content should be neutral, brand-safe, and short; avoid product-specific copy unless it is swapped for dynamic data in runtime.

## 3) Author templates
- Compose in Page Builder using the fixture shop + current theme. Keep each template ≤350 lines of exported JSON; extract reusable sections as presets when it grows.
- Persist via `@acme/templates` using `TemplateDescriptor` + `scaffoldPageFromTemplate`. Group under `corePageTemplates` or vertical sets per category.
- For sections, add to built-in Section Library (`built-in sections`) or presets feed with proper tags (Hero/Features/Testimonials/Commerce) for filtering.

## 4) Validate
- Storybook: verify template apply/swap via the Page Builder stories (Template apply, Checkout composition, Locale/Device). Ensure no console errors with MSW fixtures.
- TemplateActions: confirm diff-before-apply is meaningful (block counts, changed fields) and previews load. Avoid templates that collapse diff into “no changes”.
- Runtime: use preview tokens via `buildPagePreview` to confirm the rendered page matches the editor snapshot on the template app.

## 5) Package and handoff
- Update `packages/templates/src/corePageTemplates.ts` (and grouped exports) with new templates; include preview assets in `public`/versioned paths.
- Add/update gallery metadata (`id`, `category`, `pageType`, `previewImage`, `origin`) so Configurator and TemplateActions can filter/group.
- Document the template set in `docs/cms/build-shop-guide.md` and, when relevant, surface a “Starter kit” callout in CMS help banners.
- Tag releases in `@acme/templates`/`@acme/page-builder-ui` with changelog entries for new templates, preview assets, and contract changes.

## Action backlog (template-builder owned)
- **Expand the catalog** with verticalized Home/PLP/PDP/Checkout stacks and seasonal variants; localize labels/descriptions and ship real previews.
- Add **seasonal/vertical packs** (holiday, beauty, furniture, services, B2B) with matched preview assets, neutral copy, and docs callouts so owners pick confidently.
- **Curate preset/section library**: replace placeholder thumbnails and filler copy in presets and built-in sections with themed previews and dynamic-friendly seeds.
- **Improve template browsing**: rich gallery with search/tags, live preview, and apply-with-diff inside TemplateActions and Configurator (no more plain selects).
- **Delightful playgrounds**: keep Storybook Page Builder flows up to date; add guided flows for template authors (quests/checklists) without touching customer shops.
- **Contract clarity**: document and enforce the block/registry contract used in templates; add lint/checks so templates cannot reference non-registry block types.
