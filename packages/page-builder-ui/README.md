# @acme/page-builder-ui

React UI for the Page Builder (canvas, panels, drag-and-drop, rulers, versions, comments, collaboration), built on top of `@acme/page-builder-core` and `@acme/ui`.

See:

- `docs/architecture.md` – package layering and public surfaces.
- `docs/platform-vs-apps.md` – platform vs apps responsibilities and public API.
- `docs/historical/cms-research.md` – Page Builder UX, templates, and block registries (historical research log).

This package should keep React concerns here, defer pure logic to `@acme/page-builder-core`, and consume only public surfaces from other packages instead of deep `src/` imports.

## Responsibilities

`@acme/page-builder-ui` owns:

- React components and hooks for the Page Builder canvas, panels, rulers, comments, versions, and collaboration.
- Template/library UI flows (“New page from template”, “Insert section from library”) that talk to core/template APIs.
- Editor‑only concerns such as selection, drag‑and‑drop interactions, keyboard shortcuts, and presence indicators.

It should **not**:

- Implement persistence or data fetching (repositories live in `@acme/platform-core` or CMS packages).
- Reimplement core state or diff logic that belongs in `@acme/page-builder-core`.

## Public surface

The public API of this package is React‑focused and intentionally small:

- All public exports are re‑exported from `src/index.ts` and surfaced via the `exports` map in `package.json`.
- Call sites must import from `@acme/page-builder-ui`, never from `@acme/page-builder-ui/src/**`.

Today the main entrypoints are:

- **Editor shell**
  - `PageBuilder` / `PageBuilderProps` – high‑level editor component used by CMS routes.
  - `PageBuilderLayout` / `PageBuilderLayoutProps` – lower‑level layout shell when callers need custom wiring.
  - `PageToolbar`, `PageCanvas`, `PageSidebar`, `DragHandle`, `SizeControls`, `PreviewRenderer` – focused UI primitives used by CT and advanced flows.

- **State and interaction hooks**
  - `usePageBuilderState`, `usePageBuilderDnD`, `usePageBuilderControls`, `usePageBuilderSave`, `useAutoSave`.
  - Canvas helpers: `useCanvasDrag`, `useCanvasResize`, `useBlockDimensions`, `useBlockDnD`, `useBlockTransform`.
  - Content helpers: `useLocalizedTextEditor`, `useComponentInputs`.

- **Library and globals**
  - Types: `LibraryItem`, `GlobalItem`.
  - Helpers: `listLibrary`, `saveLibrary`, `saveLibraryStrict`, `updateLibrary`, `removeLibrary`, `clearLibrary`, `syncLibraryFromServer`.
  - Globals helpers: `listGlobals`, `saveGlobal`, `updateGlobal`, `removeGlobal`, plus page‑scoped equivalents (`listGlobalsForPage`, `saveGlobalForPage`, `updateGlobalForPage`, `removeGlobalForPage`).

- **Registry builders and text themes**
  - Re‑exports from `@acme/page-builder-core`: `buildBlockRegistry`, `BlockTypeId`, `BlockRegistry`, `BlockDescriptor`, `BlockRegistryEntryConfig`, `coreBlockDescriptors`.
  - Starter registry aligned with the default theme: `starterBlockRegistry` and its types (`StarterBlockRegistry`, `StarterBlockRegistryEntry`), built from `coreBlockDescriptors` and the default UI block implementations in `@acme/ui`.
  - Text theme helpers shared between editor and runtime: `extractTextThemes`, `applyTextThemeToOverrides`.

Example usage (CMS page editor):

```ts
import {
  PageBuilder,
  type PageBuilderProps,
  buildBlockRegistry,
  type BlockTypeId,
} from "@acme/page-builder-ui";

import { coreBlockDescriptors } from "@acme/page-builder-core";
import HeroBanner from "@acme/ui/components/cms/blocks/HeroBanner";

type BlockComponent = React.ComponentType<Record<string, unknown>>;

const { registry } = buildBlockRegistry<BlockComponent>(coreBlockDescriptors, [
  { type: "HeroBanner" as BlockTypeId, entry: HeroBanner as BlockComponent },
]);

export function CmsPageBuilder(props: PageBuilderProps) {
  // `PageBuilder` consumes the shared block registry via props/context in the CMS app.
  return <PageBuilder {...props} />;
}
```

## Versioning and changelog

- Starts at `1.0.0` (PB‑N03) and follows semver for public components, hooks, and registry helpers.
- Log every breaking/additive/fix change in `packages/page-builder-ui/CHANGELOG.md` and update this README when public exports change.
- Keep new public APIs wired through `src/index.ts` and document contract updates alongside the changelog entry.

## Internal modules

Implementation details (low‑level components, experiment flags, internal hooks) should live under:

- `src/internal/**` – internal‑only modules.
- Other deep `src/**` paths that are **not** re‑exported from `src/index.ts`.

Apps and CMS packages must not import from these internal paths. If a primitive needs to be shared, promote it to a public export in `src/index.ts` and document the intended usage here.
