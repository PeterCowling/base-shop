// packages/platform-core/src/plugins.ts
import { readdir, readFile } from "fs/promises";
import { existsSync, type Dirent } from "fs";
import path from "path";
import { pathToFileURL } from "url";
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

let tsLoaderRegistered = false;
async function importPluginModule(entry: string) {
  const abs = path.resolve(entry);
  if (/\.[mc]?ts$/.test(abs)) {
    if (!tsLoaderRegistered) {
      const tsNode = await import("ts-node");
      tsNode.register({ transpileOnly: true });
      tsLoaderRegistered = true;
    }
    const req = createRequire(abs);
    return req(abs);
  }
  return import(pathToFileURL(abs).href);
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
    // Walk up the directory tree until we find `packages/plugins`
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
      break; // use first found config
    } catch {
      // ignore missing/invalid config
    }
  }

  const searchDirs = Array.from(
    new Set([workspaceDir, ...envDirs, ...configDirs, ...directories]),
  );
  const roots: string[] = [...configPlugins, ...plugins];
  for (const dir of searchDirs) {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          roots.push(path.join(dir, entry.name));
        }
      }
    } catch (err) {
      logger.warn("Failed to read plugins directory", { directory: dir, err });
    }
  }

  const loaded: Plugin[] = [];
  for (const root of roots) {
    try {
      const pkgPath = path.join(root, "package.json");
      let entry = root;
      try {
        const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
        let rel: string | undefined;
        if (typeof pkg.exports === "string") {
          rel = pkg.exports;
        } else if (pkg.main) {
          rel = pkg.main;
        }
        if (rel) {
          entry = path.join(root, rel);
        } else {
          continue;
        }
      } catch {
        logger.warn("No package.json found for plugin", { root });
        continue;
      }
      const mod = await importPluginModule(entry);
      if (mod.default) {
        loaded.push(mod.default as Plugin);
      }
    } catch (err) {
      logger.error("Failed to load plugin", { root, err });
    }
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
