# @acme/page-builder-ui

React UI for the Page Builder (canvas, panels, drag-and-drop, rulers, versions, comments, collaboration), built on top of `@acme/page-builder-core` and `@acme/ui`.

See:

- `docs/architecture.md` – package layering and public surfaces.
- `docs/platform-vs-apps.md` – platform vs apps responsibilities and public API.
- `docs/cms-research.md` – Page Builder UX, templates, and block registries.

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

The public API of this package is deliberately small and React‑focused:

- All public exports are re‑exported from `src/index.ts` and surfaced via the `exports` map in `package.json`.
- New public components/hooks should be exported from `src/index.ts` (and optionally grouped under `src/public/**`) with doc comments.
- Call sites must import from `@acme/page-builder-ui`, never from `@acme/page-builder-ui/src/**`.

Example (future) usage:

```ts
import {
  PageBuilderProvider,
  PageBuilderCanvas,
  TemplatesPanel,
} from "@acme/page-builder-ui";

import {
  buildBlockRegistry,
  coreBlockDescriptors,
} from "@acme/page-builder-core";
```

In practice, the CMS currently hosts the editor UI in `@acme/ui`:

- The canonical CMS block registry lives in `packages/ui/src/components/cms/blocks/index.ts`.
- Runtime rendering in the template app lives in `packages/template-app/src/components/DynamicRenderer.tsx`.

When migrating those pieces into `@acme/page-builder-ui`, follow the same pattern:

```ts
import {
  buildBlockRegistry,
  coreBlockDescriptors,
} from "@acme/page-builder-core";

type BlockComponent = React.ComponentType<Record<string, unknown>>;

const { registry: blockRegistry } =
  buildBlockRegistry<BlockComponent>(coreBlockDescriptors, [
    { type: "HeroBanner", entry: HeroBanner },
    { type: "ProductGrid", entry: ProductGrid },
  ]);

// Pass `blockRegistry` into your canvas/components via props or context.
```

This keeps the Page Builder UI wired to the shared block vocabulary and public APIs from `@acme/page-builder-core`, matching how CMS and runtime apps are wired today.

## Internal modules

Implementation details (low‑level components, experiment flags, internal hooks) should live under:

- `src/internal/**` – internal‑only modules.
- Other deep `src/**` paths that are **not** re‑exported from `src/index.ts`.

Apps and CMS packages must not import from these internal paths. If a primitive needs to be shared, promote it to a public export in `src/index.ts` and document the intended usage here.
