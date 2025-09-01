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
import { readdir, readFile, stat } from "fs/promises";
import { createRequire } from "module";
import path from "path";
import { pathToFileURL } from "url";
import { PluginManager } from "./plugins/PluginManager";
import { logger } from "./utils";

// Use __filename if available (CommonJS), otherwise derive from import.meta.url
const req = createRequire(
  typeof __filename !== "undefined" ? __filename : eval("import.meta.url")
);

/* Helpers to resolve compiled plugin entry points -------------------------------- */

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

async function fileExists(p: string): Promise<boolean> {
  try {
    const s = await stat(p);
    return s.isFile();
  } catch {
    return false;
  }
}

function exportsToCandidates(dir: string, exportsField: unknown): string[] {
  const candidates: string[] = [];
  if (!exportsField) return candidates;

  try {
    if (typeof exportsField === "string") {
      candidates.push(path.resolve(dir, exportsField));
      return candidates;
    }
    const root = (exportsField as Record<string, unknown>)["."] ?? exportsField;

    if (typeof root === "string") {
      candidates.push(path.resolve(dir, root));
      return candidates;
    }

    if (root && typeof root === "object") {
      const entryObj = root as Record<string, string>;
      if (entryObj.import) candidates.push(path.resolve(dir, entryObj.import));
      if (entryObj.default)
        candidates.push(path.resolve(dir, entryObj.default));
      if (entryObj.require)
        candidates.push(path.resolve(dir, entryObj.require));
    }
  } catch {
    // ignore malformed exports
  }
  return candidates;
}

async function resolvePluginEntry(dir: string): Promise<{
  entryPath: string | null;
  isModule: boolean;
}> {
  try {
    const pkgPath = path.join(dir, "package.json");
    const rawPkg = await readFile(pkgPath, "utf8");
    const pkg = JSON.parse(rawPkg) as {
      type?: string;
      main?: string;
      module?: string;
      exports?: unknown;
    };
    const isModule = pkg.type === "module";

    // Candidates (compiled JS only)
    const candidates = unique(
      [
        ...(pkg.main ? [pkg.main] : []),
        ...(pkg.module ? [pkg.module] : []),
        ...exportsToCandidates(dir, pkg.exports),
        "dist/index.mjs",
        "dist/index.js",
        "dist/index.cjs",
        "index.mjs",
        "index.js",
        "index.cjs",
      ].map((p) => path.resolve(dir, p))
    );

    for (const candidate of candidates) {
      if (await fileExists(candidate)) {
        return {
          entryPath: candidate,
          isModule: isModule || /\.mjs$/.test(candidate),
        };
      }
    }
    return { entryPath: null, isModule };
  } catch (err) {
    logger.error("Failed to read plugin package.json", { plugin: dir, err });
    return { entryPath: null, isModule: false };
  }
}

async function importByType(entryPath: string, isModule: boolean) {
  if (isModule || /\.mjs$/.test(entryPath)) {
    return import(pathToFileURL(entryPath).href);
  }
  return req(entryPath);
}

/* Plugin loader: loads only compiled JS from dist -------------------------------- */

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

export async function loadPlugins({
  directories = [],
  plugins = [],
  configFile,
}: LoadPluginsOptions = {}): Promise<Plugin[]> {
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
      if (Array.isArray(cfg.directories)) configDirs.push(...cfg.directories);
      if (Array.isArray(cfg.plugins)) configPlugins.push(...cfg.plugins);
      break;
    } catch {
      /* ignore invalid config */
    }
  }

  const searchDirs = unique([
    workspaceDir,
    ...envDirs,
    ...configDirs,
    ...directories,
  ]);
  const pluginDirs = new Set<string>();

  for (const item of [...configPlugins, ...plugins]) {
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
