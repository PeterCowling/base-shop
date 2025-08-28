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

const req = createRequire(import.meta.url);
let tsLoaderRegistered = false;
async function ensureTsLoader() {
  if (!tsLoaderRegistered) {
    const tsNode = await import("ts-node");
    tsNode.register({ transpileOnly: true });
    tsLoaderRegistered = true;
  }
}

const registry = {
  paypal: async () => {
    await ensureTsLoader();
    return req("../../plugins/paypal/index.ts");
  },
  "premier-shipping": async () => {
    await ensureTsLoader();
    return req("../../plugins/premier-shipping/index.ts");
  },
  sanity: async () => {
    await ensureTsLoader();
    return req("../../plugins/sanity/index.ts");
  },
} satisfies Record<string, () => Promise<{ default: Plugin }>>;

export async function loadPlugin(
  id: keyof typeof registry,
): Promise<Plugin | undefined> {
  const mod = await registry[id]?.();
  return mod?.default as Plugin | undefined;
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
  const ids = new Set<keyof typeof registry>();
  const explicit = [...configPlugins, ...plugins];
  for (const item of explicit) {
    const id = path.basename(item) as keyof typeof registry;
    if (registry[id]) ids.add(id);
  }
  for (const dir of searchDirs) {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const id = entry.name as keyof typeof registry;
          if (registry[id]) ids.add(id);
        }
      }
    } catch (err) {
      logger.warn("Failed to read plugins directory", { directory: dir, err });
    }
  }

  const loaded: Plugin[] = [];
  for (const id of ids) {
    try {
      const plugin = await loadPlugin(id);
      if (plugin) loaded.push(plugin);
    } catch (err) {
      logger.error("Failed to load plugin", { plugin: id, err });
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
