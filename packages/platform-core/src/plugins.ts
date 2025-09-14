// packages/platform-core/src/plugins.ts
import type {
  PaymentPayload,
  PaymentProvider,
  PaymentRegistry,
  Plugin,
  PluginOptions,
  ShippingProvider,
  ShippingRegistry,
  ShippingRequest,
  WidgetComponent,
  WidgetProps,
  WidgetRegistry,
} from "@acme/types";
import { readdir } from "fs/promises";
import path from "path";
import { PluginManager } from "./plugins/PluginManager";
import { logger } from "./utils";
import { resolvePluginEntry, importByType } from "./plugins/resolvers";
import { resolvePluginEnvironment } from "./plugins/env";

/* Plugin loader: loads only compiled JS from dist ------------------------------ */

async function loadPluginFromDir(dir: string): Promise<Plugin | undefined> {
  const { entryPath, isModule } = await resolvePluginEntry(dir);

  if (!entryPath) {
    logger.error(
      "No compiled plugin entry found. Ensure plugin is built before runtime.",
      { plugin: dir }
    );
    return undefined;
  }

  try {
    const mod = await importByType(entryPath, isModule);
    const plug: Plugin | undefined = (mod && (mod.default || mod.plugin)) as
      | Plugin
      | undefined;
    if (!plug) {
      logger.error("Plugin module did not export a default Plugin", {
        plugin: dir,
        entry: entryPath,
        exportedKeys: Object.keys(mod ?? {}),
      });
      return undefined;
    }
    return plug;
  } catch (err) {
    logger.error("Failed to import plugin entry", {
      plugin: dir,
      entry: entryPath,
      err,
    });
    return undefined;
  }
}

/* Public API ------------------------------------------------------------------- */

export async function loadPlugin(id: string): Promise<Plugin | undefined> {
  return loadPluginFromDir(id);
}

export interface LoadPluginsOptions {
  directories?: string[];
  plugins?: string[];
  configFile?: string;
}

export async function loadPlugins({
  directories,
  plugins,
  configFile,
}: LoadPluginsOptions = {}): Promise<Plugin[]> {
  const { searchDirs, pluginDirs: initialPlugins } =
    await resolvePluginEnvironment({ directories, plugins, configFile });

  const pluginDirs = new Set<string>(initialPlugins);

  for (const dir of searchDirs) {
    try {
      // The directories come from trusted configuration.
      // eslint-disable-next-line security/detect-non-literal-fs-filename
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

export async function initPlugins<
  PPay extends PaymentPayload = PaymentPayload,
  SReq extends ShippingRequest = ShippingRequest,
  WProp extends WidgetProps = WidgetProps,
  P extends PaymentProvider<PPay> = PaymentProvider<PPay>,
  S extends ShippingProvider<SReq> = ShippingProvider<SReq>,
  W extends WidgetComponent<WProp> = WidgetComponent<WProp>,
>({
  directories,
  plugins,
  config,
  configFile,
}: InitPluginsOptions = {}): Promise<
  PluginManager<PPay, SReq, WProp, P, S, W>
> {
  const manager = new PluginManager<PPay, SReq, WProp, P, S, W>();
  const loaded = (await loadPlugins({
    directories,
    plugins,
    configFile,
  })) as unknown as Plugin<
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
      ...(config?.[plugin.id] ?? {}),
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

/* Re-export type definitions so downstream imports need only @acme/platform-core */
export type {
  PaymentPayload,
  PaymentProvider,
  PaymentRegistry,
  Plugin,
  PluginOptions,
  ShippingProvider,
  ShippingRegistry,
  ShippingRequest,
  WidgetComponent,
  WidgetProps,
  WidgetRegistry,
};

