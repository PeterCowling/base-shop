# UI → CMS Test Migration

Goal: run CMS/page‑builder/template tests at the app level so `@acme/ui` only measures generic UI coverage.

How to move a test
- From `packages/ui/src/components/cms/**/__tests__/*.test.(ts|tsx)` or `packages/ui/__tests__/*` that import CMS/page‑builder/templates, move the file here preserving folder context under `ui/` (e.g., `__tests__/ui/page-builder/...`).
- Update imports to use `@ui/src/...` (example: `@ui/src/components/cms/page-builder/PresetsModal`).
- Prefer grouping integration tests under `__tests__/ui`.

Jest config
- `apps/cms/jest.config.cjs` already uses monorepo base config and will pick up these tests.
