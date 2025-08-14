// packages/platform-core/src/plugins.ts
import { readdir, readFile } from "node:fs/promises";
import type { Dirent } from "node:fs";
import path from "node:path";
import type { z } from "zod";
import { logger } from "./utils/logger";
import { PluginManager } from "./plugins/PluginManager";

export interface PaymentPayload {
  [key: string]: unknown;
}

export interface ShippingRequest {
  [key: string]: unknown;
}

export interface WidgetProps {
  [key: string]: unknown;
}

/** Interface for payment providers */
export interface PaymentProvider<Payload = PaymentPayload> {
  processPayment(payload: Payload): Promise<unknown> | unknown;
}

/** Interface for shipping providers */
export interface ShippingProvider<Request = ShippingRequest> {
  calculateShipping(request: Request): Promise<unknown> | unknown;
}

/** Interface for widget components */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface WidgetComponent<P = WidgetProps> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (props: P): any;
}

/** Registry for payment providers */
export interface PaymentRegistry<
  Payload = PaymentPayload,
  T extends PaymentProvider<Payload> = PaymentProvider<Payload>,
> {
  add(id: string, provider: T): void;
  get(id: string): T | undefined;
  list(): { id: string; value: T }[];
}

/** Registry for shipping providers */
export interface ShippingRegistry<
  Request = ShippingRequest,
  T extends ShippingProvider<Request> = ShippingProvider<Request>,
> {
  add(id: string, provider: T): void;
  get(id: string): T | undefined;
  list(): { id: string; value: T }[];
}

/** Registry for widget components */
export interface WidgetRegistry<
  Props = WidgetProps,
  T extends WidgetComponent<Props> = WidgetComponent<Props>,
> {
  add(id: string, component: T): void;
  get(id: string): T | undefined;
  list(): { id: string; value: T }[];
}

/**
 * Plugins may expose configurable options. They can provide default values via
 * `defaultConfig` and a Zod `configSchema` to validate user supplied
 * configuration. During initialization the provided configuration is merged
 * with defaults and validated before any registration hooks execute.
 */
export interface PluginOptions<Config = Record<string, unknown>> {
  /** Optional name shown in the CMS */
  name: string;
  /** Optional description for plugin */
  description?: string;
  /** Default configuration values */
  defaultConfig?: Config;
  /** zod schema used to validate configuration */
  configSchema?: z.ZodType<Config>;
}

export interface Plugin<
  PPay = PaymentPayload,
  SReq = ShippingRequest,
  WProp = WidgetProps,
  P extends PaymentProvider<PPay> = PaymentProvider<PPay>,
  S extends ShippingProvider<SReq> = ShippingProvider<SReq>,
  W extends WidgetComponent<WProp> = WidgetComponent<WProp>,
  Config = Record<string, unknown>,
> extends PluginOptions<Config> {
  id: string;
  registerPayments?(
    registry: PaymentRegistry<PPay, P>,
    config: Config,
  ): void;
  registerShipping?(
    registry: ShippingRegistry<SReq, S>,
    config: Config,
  ): void;
  registerWidgets?(
    registry: WidgetRegistry<WProp, W>,
    config: Config,
  ): void;
  /** optional async initialization hook */
  init?(config: Config): Promise<void> | void;
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
  const workspaceDir = path.join(process.cwd(), "packages", "plugins");

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
      const mod = await import(entry);
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
  PPay = PaymentPayload,
  SReq = ShippingRequest,
  WProp = WidgetProps,
  P extends PaymentProvider<PPay> = PaymentProvider<PPay>,
  S extends ShippingProvider<SReq> = ShippingProvider<SReq>,
  W extends WidgetComponent<WProp> = WidgetComponent<WProp>,
>(
  options: InitPluginsOptions = {},
): Promise<PluginManager<P, S, W>> {
  const manager = new PluginManager<P, S, W>();
  const loaded = await loadPlugins(options);
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
    if (plugin.init) {
      await plugin.init(cfg as any);
    }
    if (plugin.registerPayments) {
      plugin.registerPayments(manager.payments, cfg as any);
    }
    if (plugin.registerShipping) {
      plugin.registerShipping(manager.shipping, cfg as any);
    }
    if (plugin.registerWidgets) {
      plugin.registerWidgets(manager.widgets, cfg as any);
    }
    manager.addPlugin(plugin);
  }
  return manager;
}
