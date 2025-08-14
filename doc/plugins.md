# Plugin Authoring Guide

This platform supports a pluggable architecture for payments, shipping and UI widgets.  
Plugins are plain npm packages that export a default object implementing the
`Plugin` interface from `@acme/types`.

```ts
import type { Plugin, PaymentRegistry } from "@acme/types";

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
import { loadPlugins } from "@acme/platform-core/plugins";
import path from "node:path";

const pluginsDir = path.resolve(process.cwd(), "packages/plugins");
const plugins = await loadPlugins({ directories: [pluginsDir] });
```

Each plugin directory must include a `package.json` with a `main` or
`exports` field pointing at the compiled module entry point.

## Initialisation and configuration

`initPlugins` wires discovered plugins into the platform and returns a
`PluginManager` instance that exposes registered providers and metadata. Configuration
can be supplied per plugin using the plugin id:

```ts
import { initPlugins } from "@acme/platform-core/plugins";

const manager = await initPlugins({
  directories: [pluginsDir],
  config: {
    "my-plugin": { enabled: false },
  },
});
```

The relevant configuration object (or the plugin's `defaultConfig`) is passed to
all registration hooks.
