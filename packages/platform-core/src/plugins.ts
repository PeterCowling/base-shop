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
import { existsSync } from "fs";
import { readdir, readFile } from "fs/promises";
import { createRequire } from "module";
import path from "path";
import { PluginManager } from "./plugins/PluginManager";
import { logger } from "./utils";

/**
 * Use __filename when available to support CommonJS environments like Jest.
 * When running as an ES module where __filename is undefined, fall back to
 * dynamically evaluating import.meta.url to avoid parse errors in CJS.
 */
const req = createRequire(
  typeof __filename !== "undefined" ? __filename : eval("import.meta.url")
);

/**
 * Flag indicating whether the TypeScript loader has been registered.
 * Ensures that ts-node registration occurs only once.
 */
let tsLoaderRegistered = false;

/**
 * Ensure that ts-node is registered to allow importing TypeScript plugin modules.
 * Use `transpileOnly` for speed, `skipProject` to ignore tsconfig.json files
 * (avoiding incorrect extends lookups), and explicit compilerOptions to
 * compile ES modules for Node.js environments.
 */
async function ensureTsLoader(): Promise<void> {
  if (!tsLoaderRegistered) {
    const tsNode = await import("ts-node");
    tsNode.register({
      transpileOnly: true,
      skipProject: true,
      compilerOptions: {
        module: "ESNext",
        moduleResolution: "NodeNext",
        target: "ES2022",
        skipLibCheck: true,
        strict: true,
      },
    });
    tsLoaderRegistered = true;
  }
}

/**
 * Load a plugin module from the given directory. Plugins are expected to
 * contain a package.json that defines a "main" entry (default "index.ts").
 * This function dynamically registers ts-node as needed, then imports the
 * plugin’s default export. Errors are logged and undefined is returned on
 * failure.
 *
 * @param dir Absolute path to the plugin directory.
 * @returns The loaded plugin or undefined if loading fails.
 */
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

/**
 * Backwards-compatible function for loading a single plugin by absolute path.
 * Delegates to loadPluginFromDir().
 *
 * @param id Absolute path to the plugin directory.
 */
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

/**
 * Load plugins from provided directories or explicit paths. Plugins are loaded
 * by scanning each directory for subdirectories and importing the default
 * export of each. If configFile is provided (or PLUGIN_CONFIG env var),
 * directories/plugins can also be specified in JSON.
 *
 * @param options Configuration for discovering and loading plugins.
 * @returns An array of loaded plugins.
 */
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
    new Set([workspaceDir, ...envDirs, ...configDirs, ...directories])
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
      logger.warn("Failed to read plugins directory", {
        directory: dir,
        err,
      });
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

/**
 * Load plugins and invoke their registration hooks. This populates payment,
 * shipping and widget registries on a PluginManager instance with definitions
 * provided by each plugin.
 *
 * @param options Directories and config for loading plugins.
 * @returns A fully-initialized PluginManager.
 */
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

// Re-export type definitions from @acme/types to avoid repeated imports.
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
