# Next.js configuration

Cloudflare Pages requires a few non‑default Next.js options. The project's [`next.config.mjs`](../next.config.mjs) applies them.

## Cloudflare‑specific options

- `images.unoptimized: true` — Cloudflare Pages cannot use the Next.js Image Optimization API.
- `output: "standalone"` — required so `@cloudflare/next-on-pages` can package the app.
- Server builds enable source maps only outside development (`config.devtool = "source-map"`) to avoid the "Improper devtool" warning.
- Webpack aliases map `node:` builtin module specifiers (for example `node:stream` or `node:crypto`) to their standard names to prevent `UnhandledSchemeError` during the build.

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
