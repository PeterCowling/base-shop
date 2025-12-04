Type: Guide
Status: Active
Domain: Platform
Last-reviewed: 2025-12-02

# Plugin Authoring Guide

This platform supports a pluggable architecture for payments, shipping and UI widgets.  
Plugins are plain npm packages that export a default object implementing the
`Plugin` interface from `@platform-core/plugins`.

```ts
import type { Plugin, PaymentRegistry } from "@platform-core/plugins";

const myPlugin: Plugin = {
  id: "my-plugin",
  name: "My Plugin",
  defaultConfig: { enabled: true },
  registerPayments(registry: PaymentRegistry, config) {
    // add a payment provider
    registry.add("my-payment", {/* ... */});
  },
};

export default myPlugin;
```

## Discovery

Plugins are discovered by calling `loadPlugins` and providing either an array of
plugin package directories or directories that contain multiple plugins:

```ts
import { loadPlugins } from "@platform-core/plugins";
import path from "node:path";

const pluginsDir = path.resolve(process.cwd(), "packages/plugins");
const plugins = await loadPlugins({ directories: [pluginsDir] });
```

Each plugin directory must include a `package.json` with a `main` or
`exports` field pointing at the compiled module entry point.

### Runtime import strategy (Next.js friendly)

When loading plugin entry files by absolute path, avoid variable `require()` which causes Webpack to warn (“request of a dependency is an expression”).

- Prefer dynamic `import()` with file URLs:

```ts
// packages/platform-core/src/plugins/resolvers.ts
import { pathToFileURL } from "url";

export async function importByType(entryPath: string) {
  // Works with both ESM (.mjs) and CJS (.js) thanks to Node interop
  return import(/* webpackIgnore: true */ pathToFileURL(entryPath).href);
}
```

- Candidate selection should stick to compiled JS (dist) and use `package.json` fields (`exports`, `main`, `module`). See `resolvePluginEntry` for an example.

## Initialisation and configuration

`initPlugins` wires discovered plugins into the platform and returns a
`PluginManager` instance that exposes registered providers and metadata. Configuration
can be supplied per plugin using the plugin id:

```ts
import { initPlugins } from "@platform-core/plugins";

const manager = await initPlugins({
  directories: [pluginsDir],
  config: {
    "my-plugin": { enabled: false },
  },
});
```

The relevant configuration object (or the plugin's `defaultConfig`) is passed to
all registration hooks.

## Environment Variables

The `init-shop` configurator collects credentials for optional plugins when you enable them. Use the references below to prepare the required environment variables before running the wizard or to fill in placeholders after scaffolding a shop.

### PayPal Plugin

- Package: `@acme/plugin-paypal`
- Type: Payment provider
- Required environment variables:
  - `PAYPAL_CLIENT_ID`
  - `PAYPAL_SECRET`
- Source: [packages/plugins/paypal/README.md](../packages/plugins/paypal/README.md)

### Premier Shipping Plugin

- Package: `@acme/plugin-premier-shipping`
- Type: Shipping provider
- Required environment variables: _None_
- Source: [packages/plugins/premier-shipping/README.md](../packages/plugins/premier-shipping/README.md)

### Sanity Plugin

- Package: `@acme/plugin-sanity`
- Type: CMS integration
- Required environment variables:
  - `SANITY_PROJECT_ID`
  - `SANITY_DATASET`
  - `SANITY_TOKEN`
- Source: [packages/plugins/sanity/README.md](../packages/plugins/sanity/README.md)
