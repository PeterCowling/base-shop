# plugins — Agent Notes

## Purpose
Holds optional provider plugins (payment, shipping, CMS integrations) loaded
by `@acme/platform-core` via the plugins resolver.

## Operational Constraints
- Plugins are loaded dynamically; keep top-level side effects minimal.
- Do not read secrets at module load time; read within `init` or registrars.
- Default export must satisfy `Plugin` shape from `packages/types/src/plugins.ts`.
- Config validation should use the plugin `configSchema` (zod) where applicable.
- Keep IDs stable; changing `plugin.id` affects stored config and runtime wiring.

## Adding a Plugin
- Create `packages/plugins/<plugin-id>/index.ts` with a default export.
- Keep env requirements documented in the plugin package (README or AGENTS).
- Ensure `@acme/platform-core` can discover the plugin under `packages/plugins`.

## Safety Checks
- Avoid network calls in module scope; run them in `init` or request handlers.
- Verify required env vars exist before registering providers.
