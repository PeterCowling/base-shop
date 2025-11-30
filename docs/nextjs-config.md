# Next.js configuration

Cloudflare Pages requires a few non‑default Next.js options. The project's shared config (`packages/next-config/next.config.mjs`) applies them and is imported from app‑level `next.config.mjs` files.

## Cloudflare‑specific options

- `images.unoptimized: true` — Cloudflare Pages cannot use the Next.js Image Optimization API.
- `output: "standalone"` — required so `@cloudflare/next-on-pages` can package the app.
- Server builds enable source maps only outside development (`config.devtool = "source-map"`) to avoid the "Improper devtool" warning.
- Webpack aliases map `node:` builtin module specifiers (for example `node:stream` or `node:crypto`) to their standard names to prevent `UnhandledSchemeError` during the build.

## Build Hygiene Patterns

These patterns avoid noisy warnings and brittle bundling behaviour in Next.js/Turbopack while keeping server code portable.

- Dynamic file path imports (avoid variable `require` warnings)
  - When importing a file by path at runtime (e.g., plugin entry resolution), prefer dynamic `import(pathToFileURL(file).href)` and annotate with `/* webpackIgnore: true */`.
  - This prevents Webpack's “request of a dependency is an expression” warning and works for both ESM and CJS modules thanks to Node's interop.
  - Example: see `packages/platform-core/src/plugins/resolvers.ts:100`.

- Avoid `module.createRequire` in Next server bundles
  - Using `createRequire(import.meta.url)` inside code consumed by Next can trigger warnings like “module.createRequire failed parsing argument”.
  - Prefer stable imports and feature detection on the imported module rather than constructing a `require` at runtime.
  - Example: repository selection checks for a Prisma model on a shared `prisma` import instead of `createRequire` + `require("../db")`. See `packages/platform-core/src/repositories/inventory.server.ts:1`.

- Theme fixtures alias for local development
  - Some loaders (e.g., theme token loader) attempt optional imports like `@themes-local/<theme>` used in tests and local demos.
  - Add an alias so `@themes-local` resolves to the workspace themes directory. This keeps imports working in apps without publishing.
  - Shared config alias:
    - `packages/next-config/next.config.mjs:30` → `"@themes-local": path.resolve(__dirname, "../themes")`
  - App‑specific alias where custom configs exist:
    - `apps/cms/next.config.mjs:184` → `"@themes-local": path.resolve(__dirname, "../../packages/themes")`

- Dev‑only env defaults for strict validators
  - Our env schemas (e.g., `packages/config/src/env/email.ts`) are strict and will fail builds without required values.
  - App configs set safe defaults in development, such as `EMAIL_PROVIDER=noop`, to keep local builds unblocked while preserving production safety.
  - Examples:
    - `packages/template-app/dev-defaults.mjs:13` sets `EMAIL_PROVIDER` when missing.
    - `apps/cover-me-pretty/next.config.mjs:19` and `apps/cms/next.config.mjs:66` apply the same default.

## Extending Node builtin aliases

When a new `node:` import is introduced, add its module name to the `nodeBuiltins` array in `next.config.mjs`:

```js
const nodeBuiltins = [
  "assert",
  "buffer",
  // ...existing builtins
  "vm", // add new builtins here
];
```

Webpack will automatically alias `node:vm` to `vm`, letting Cloudflare's environment resolve it correctly.
