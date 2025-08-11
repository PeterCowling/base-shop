// packages/platform-core/src/plugins.ts
import { readdir, readFile } from "node:fs/promises";
import type { Dirent } from "node:fs";
import path from "node:path";
import type { z } from "zod";

/** Interface for payment providers */
export interface PaymentProvider {
  processPayment(...args: any[]): Promise<unknown> | unknown;
}

/** Interface for shipping providers */
export interface ShippingProvider {
  calculateShipping(...args: any[]): Promise<unknown> | unknown;
}

/** Interface for widget components */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface WidgetComponent<P = any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (props: P): any;
}

/** Registry for payment providers */
export interface PaymentRegistry<T extends PaymentProvider = PaymentProvider> {
  add(id: string, provider: T): void;
}

/** Registry for shipping providers */
export interface ShippingRegistry<
  T extends ShippingProvider = ShippingProvider,
> {
  add(id: string, provider: T): void;
}

/** Registry for widget components */
export interface WidgetRegistry<T extends WidgetComponent = WidgetComponent> {
  add(id: string, component: T): void;
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
  P extends PaymentProvider = PaymentProvider,
  S extends ShippingProvider = ShippingProvider,
  W extends WidgetComponent = WidgetComponent,
  Config = Record<string, unknown>,
> extends PluginOptions<Config> {
  id: string;
  registerPayments?(
    registry: PaymentRegistry<P>,
    config: Config,
  ): void;
  registerShipping?(
    registry: ShippingRegistry<S>,
    config: Config,
  ): void;
  registerWidgets?(
    registry: WidgetRegistry<W>,
    config: Config,
  ): void;
}

export interface LoadPluginsOptions {
  /** directories containing plugin packages */
  directories?: string[];
  /** explicit plugin package paths */
  plugins?: string[];
}

/** Load plugins from provided directories or explicit paths */
export async function loadPlugins({
  directories = [],
  plugins = [],
}: LoadPluginsOptions = {}): Promise<Plugin[]> {
  const roots: string[] = [...plugins];
  for (const dir of directories) {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          roots.push(path.join(dir, entry.name));
        }
      }
    } catch (err) {
      console.warn(`Failed to read plugins directory ${dir}`, err);
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
        console.warn(`No package.json found for plugin at ${root}`);
        continue;
      }
      const mod = await import(entry);
      if (mod.default) {
        loaded.push(mod.default as Plugin);
      }
    } catch (err) {
      console.warn(`Failed to load plugin at ${root}`, err);
    }
  }
  return loaded;
}

export interface InitPluginsOptions extends LoadPluginsOptions {
  config?: Record<string, Record<string, unknown>>;
}

/** Load plugins and call their registration hooks */
export async function initPlugins<
  P extends PaymentProvider = PaymentProvider,
  S extends ShippingProvider = ShippingProvider,
  W extends WidgetComponent = WidgetComponent,
>(
  registries: {
    payments?: PaymentRegistry<P>;
    shipping?: ShippingRegistry<S>;
    widgets?: WidgetRegistry<W>;
  },
  options: InitPluginsOptions = {},
): Promise<Plugin<P, S, W>[]> {
  const loaded = await loadPlugins(options);
  const registered: Plugin[] = [];
  for (const plugin of loaded) {
    const raw = {
      ...(plugin.defaultConfig ?? {}),
      ...(options.config?.[plugin.id] ?? {}),
    } as Record<string, unknown>;
    let cfg: Record<string, unknown> = raw;
    if (plugin.configSchema) {
      const result = plugin.configSchema.safeParse(raw);
      if (!result.success) {
        console.warn(`Invalid config for plugin ${plugin.id}`, result.error);
        continue;
      }
      cfg = result.data;
    }
    if (registries.payments && plugin.registerPayments) {
      plugin.registerPayments(registries.payments, cfg as any);
    }
    if (registries.shipping && plugin.registerShipping) {
      plugin.registerShipping(registries.shipping, cfg as any);
    }
    if (registries.widgets && plugin.registerWidgets) {
      plugin.registerWidgets(registries.widgets, cfg as any);
    }
    registered.push(plugin as Plugin);
  }
  return registered as Plugin<P, S, W>[];
}
