// packages/platform-core/src/plugins.ts
import { readdir, readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { createRequire } from "module";
import { logger } from "./utils";
import { PluginManager } from "./plugins/PluginManager";
import type {
  PaymentPayload,
  ShippingRequest,
  WidgetProps,
  PaymentProvider,
  ShippingProvider,
  WidgetComponent,
  PaymentRegistry,
  ShippingRegistry,
  WidgetRegistry,
  PluginOptions,
  Plugin,
} from "@acme/types";

// Use __filename when available to support CommonJS environments like Jest.
// When running as an ES module where __filename is undefined, fall back to
// dynamically evaluating `import.meta.url` to avoid parse errors in CJS.
const req = createRequire(
  typeof __filename !== "undefined" ? __filename : eval("import.meta.url"),
);
let tsLoaderRegistered = false;
async function ensureTsLoader() {
  if (!tsLoaderRegistered) {
    const tsNode = await import("ts-node");
    tsNode.register({ transpileOnly: true });
    tsLoaderRegistered = true;
  }
}

/** Load a plugin module from the given directory path */
async function loadPluginFromDir(dir: string): Promise<Plugin | undefined> {
  try {
    await ensureTsLoader();
    const pkgPath = path.join(dir, "package.json");
    const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
    const main = pkg.main || "index.ts";
    const mod = await req(path.join(dir, main));
    return mod.default as Plugin;
  } catch (err) {
    logger.error("Failed to load plugin", { plugin: dir, err });
    return undefined;
  }
}

// Backwards-compatible export for loading a single plugin by path
export async function loadPlugin(id: string): Promise<Plugin | undefined> {
  return loadPluginFromDir(id);
}

export interface LoadPluginsOptions {
  /** directories containing plugin packages */
  directories?: string[];
  /** explicit plugin package paths */
  plugins?: string[];
  /** optional path to JSON config listing directories/plugins */
  configFile?: string;
}

/** Load plugins from provided directories or explicit paths */
export async function loadPlugins({
  directories = [],
  plugins = [],
  configFile,
}: LoadPluginsOptions = {}): Promise<Plugin[]> {
  function findPluginsDir(start: string): string {
    let dir = start;
    while (true) {
      const candidate = path.join(dir, "packages", "plugins");
      if (existsSync(candidate)) return candidate;
      const parent = path.dirname(dir);
      if (parent === dir) return candidate;
      dir = parent;
    }
  }
  const workspaceDir = findPluginsDir(process.cwd());

  const envDirs = process.env.PLUGIN_DIRS
    ? process.env.PLUGIN_DIRS.split(path.delimiter).filter(Boolean)
    : [];

  const configDirs: string[] = [];
  const configPlugins: string[] = [];
  const configPaths = [
    configFile,
    process.env.PLUGIN_CONFIG,
    path.join(process.cwd(), "plugins.config.json"),
  ].filter(Boolean) as string[];
  for (const cfgPath of configPaths) {
    try {
      const cfg = JSON.parse(await readFile(cfgPath, "utf8"));
      if (Array.isArray(cfg.directories)) {
        configDirs.push(...cfg.directories);
      }
      if (Array.isArray(cfg.plugins)) {
        configPlugins.push(...cfg.plugins);
      }
      break;
    } catch {
      // ignore missing/invalid config
    }
  }

  const searchDirs = Array.from(
    new Set([workspaceDir, ...envDirs, ...configDirs, ...directories]),
  );
  const pluginDirs = new Set<string>();
  const explicit = [...configPlugins, ...plugins];
  for (const item of explicit) {
    pluginDirs.add(path.resolve(item));
  }
  for (const dir of searchDirs) {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          pluginDirs.add(path.join(dir, entry.name));
        }
      }
    } catch (err) {
      logger.warn("Failed to read plugins directory", { directory: dir, err });
    }
  }

  const loaded: Plugin[] = [];
  for (const dir of pluginDirs) {
    const plugin = await loadPluginFromDir(dir);
    if (plugin) loaded.push(plugin);
  }
  return loaded;
}

export interface InitPluginsOptions extends LoadPluginsOptions {
  config?: Record<string, Record<string, unknown>>;
}

/** Load plugins and call their registration hooks */
export async function initPlugins<
  PPay extends PaymentPayload = PaymentPayload,
  SReq extends ShippingRequest = ShippingRequest,
  WProp extends WidgetProps = WidgetProps,
  P extends PaymentProvider<PPay> = PaymentProvider<PPay>,
  S extends ShippingProvider<SReq> = ShippingProvider<SReq>,
  W extends WidgetComponent<WProp> = WidgetComponent<WProp>,
>(
  options: InitPluginsOptions = {},
): Promise<PluginManager<PPay, SReq, WProp, P, S, W>> {
  const manager = new PluginManager<PPay, SReq, WProp, P, S, W>();
  const loaded = (await loadPlugins(options)) as unknown as Plugin<
    Record<string, unknown>,
    PPay,
    SReq,
    WProp,
    P,
    S,
    W
  >[];
  for (const plugin of loaded) {
    const raw = {
      ...(plugin.defaultConfig ?? {}),
      ...(options.config?.[plugin.id] ?? {}),
    } as Record<string, unknown>;
    let cfg: Record<string, unknown> = raw;
    if (plugin.configSchema) {
      const result = plugin.configSchema.safeParse(raw);
      if (!result.success) {
        logger.error("Invalid config for plugin", {
          plugin: plugin.id,
          error: result.error,
        });
        continue;
      }
      cfg = result.data;
    }
    await plugin.init?.(cfg);
    plugin.registerPayments?.(manager.payments, cfg);
    plugin.registerShipping?.(manager.shipping, cfg);
    plugin.registerWidgets?.(manager.widgets, cfg);
    manager.addPlugin(plugin);
  }
  return manager;
}

export type {
  PaymentPayload,
  ShippingRequest,
  WidgetProps,
  WidgetComponent,
  PaymentProvider,
  ShippingProvider,
  PaymentRegistry,
  ShippingRegistry,
  WidgetRegistry,
  PluginOptions,
  Plugin,
};
