# @acme/page-builder-core

Pure Page Builder logic (state, reducers, algorithms, utilities) shared between CMS and runtime. This package contains no React or browser globals.

See:

- `docs/architecture.md` – package layering and public surfaces.
- `docs/platform-vs-apps.md` – platform vs apps responsibilities and public API.
- `docs/historical/cms-research.md` (§“Templates/prefabs and evolution”) – planned data contracts for templates and Page Builder state (historical research log).

Page Builder domain behaviour should live here first and then be consumed from `@acme/page-builder-ui`, `@acme/templates`, CMS, and apps via the public exports, rather than importing internal `src/` files.

## Responsibilities

`@acme/page-builder-core` owns:

- Page Builder state, reducers, and pure transforms (no React, no I/O).
- Shared schemas for Page Builder–specific structures (history, editor metadata, template descriptors) once extracted from `@acme/types` and existing apps.
- Registry and helper APIs used by both CMS and runtime apps (for example template registries and future block registries).

Anything that needs React, browser globals, or app‑specific services belongs in `@acme/page-builder-ui` or the apps, not here.

## Public surface

The public API of this package is intentionally small and documented:

- All public exports are re‑exported from `src/index.ts` and surfaced via the `exports` map in `package.json`.
- New public APIs should be added to `src/index.ts` (and optionally `src/public/**`) with clear doc comments.
- Call sites must import from `@acme/page-builder-core` only, not from deep `src/**` paths.

At the moment the public exports are:

- `version` – dev-only version marker.
- `pageSchema`, `pageComponentSchema`, `historyStateSchema` – re‑exports from `@acme/types` so callers can depend on a single PB entrypoint for Page/History schemas.
- `Page`, `PageComponent`, `HistoryState`, `EditorFlags` – type re‑exports from `@acme/types`.
- `commit`, `undo`, `redo` – pure history reducers for `HistoryState`.
- `diffPage`, `mergeDefined`, `parsePageDiffHistory`, `PageDiffEntry` – pure helpers for Page diff/history logs (no I/O).
- `exportComponents`, `exportComponentsFromHistory`, `ExportedComponent` – helpers to turn `HistoryState` + editor metadata into runtime‑ready `PageComponent[]`.
- `BlockTypeId`, `BlockProps`, `BlockFeatureFlags`, `BlockDescriptor`, `BlockDescriptorMap`, `BlockRegistry`, `buildBlockRegistry`, `coreBlockDescriptors` – shared block‑registry contracts and core descriptors used by both CMS and runtime apps (see PB‑03).

As further PB tasks land (`PB-05`, `PB-06`), additional shared schemas and helpers will be exported from `src/index.ts` and documented here.

## Versioning and changelog

- Starts at `1.0.0` (PB‑N03) and follows semver for all public exports and observable behaviour.
- Record every breaking/additive/fix change in `packages/page-builder-core/CHANGELOG.md` and update this README when the public surface changes.
- Keep new APIs behind `src/index.ts` exports and describe any contract updates in the changelog entry.

## Block registry quickstart

Adding a new block type is a three‑step flow shared between CMS and runtime apps.

1. **Define the block type and descriptor**

   - Add or extend the corresponding `PageComponent["type"]` variant in `@acme/types` if it does not already exist.
   - Add a descriptor entry to `coreBlockDescriptors` in `packages/page-builder-core/src/blocks/core-blocks.ts`:

   ```ts
   import type { BlockDescriptor } from "@acme/page-builder-core";

   const promoBannerDescriptor: BlockDescriptor = {
     type: "PromoBanner",
     label: "Promo banner",
     category: "Marketing",
     features: { supportsMedia: true },
   };

   // Append to the exported array alongside other core descriptors.
   ```

   This keeps the shared vocabulary of block types in one place.

2. **Wire the block into the CMS palette**

   - In the CMS block registry (canonical example: `packages/ui/src/components/cms/blocks/index.ts`), map the new type to a React component and build the registry from the shared descriptors:

   ```ts
   import {
     buildBlockRegistry,
     coreBlockDescriptors,
     type BlockTypeId,
   } from "@acme/page-builder-core";

   type BlockComponent = React.ComponentType<Record<string, unknown>>;

   const { registry: cmsBlockRegistry } =
     buildBlockRegistry<BlockComponent>(coreBlockDescriptors, [
       { type: "PromoBanner" as BlockTypeId, entry: PromoBanner },
       // existing entries...
     ]);
   ```

   The CMS Page Builder uses this registry to render blocks on the canvas and in palettes.

3. **Wire the block into the runtime renderer**

   - In the runtime app (canonical example: `packages/template-app/src/components/DynamicRenderer.tsx`), use the same `coreBlockDescriptors` and `buildBlockRegistry` helper to map `PageComponent.type` values to runtime React components:

   ```ts
   import {
     buildBlockRegistry,
     coreBlockDescriptors,
   } from "@acme/page-builder-core";

   type BlockComponent = React.ComponentType<Record<string, unknown>>;

   const { registry: runtimeRegistry } =
     buildBlockRegistry<BlockComponent>(coreBlockDescriptors, [
       { type: "PromoBanner", entry: PromoBannerRuntime },
       // existing entries...
     ]);
   ```

   With this wiring, any `Page` or `HistoryState` that contains `type: "PromoBanner"` can be rendered consistently in both CMS and runtime using only public `@acme/page-builder-core` APIs.

### Import rules

Do:

```ts
import { /* public API */ } from "@acme/page-builder-core";
```

Do **not**:

```ts
// Deep imports are internal and may change without notice.
import { something } from "@acme/page-builder-core/src/internal/state";
import { somethingElse } from "@acme/page-builder-core/src/history/reducers";
```

## Internal modules

Internal implementation details (reducers, helpers, experimental types) should live under:

- `src/internal/**` – non‑public modules, free to change without semver guarantees.
- Other deep `src/**` paths that are **not** re‑exported from `src/index.ts`.

Apps and other packages must not import from these internal paths. If a new behaviour needs to be reused, promote it to the public surface via `src/index.ts` instead of reaching into internals.
