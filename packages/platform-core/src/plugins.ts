// packages/platform-core/src/plugins.ts
import { readdir, readFile } from "node:fs/promises";
import type { Dirent } from "node:fs";
import path from "node:path";

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

export interface PluginOptions {
  /** Optional name shown in the CMS */
  name: string;
  /** Optional description for plugin */
  description?: string;
  /** Default configuration values */
  defaultConfig?: Record<string, unknown>;
}

export interface Plugin<
  P extends PaymentProvider = PaymentProvider,
  S extends ShippingProvider = ShippingProvider,
  W extends WidgetComponent = WidgetComponent,
> extends PluginOptions {
  id: string;
  registerPayments?(
    registry: PaymentRegistry<P>,
    config?: Record<string, unknown>,
  ): void;
  registerShipping?(
    registry: ShippingRegistry<S>,
    config?: Record<string, unknown>,
  ): void;
  registerWidgets?(
    registry: WidgetRegistry<W>,
    config?: Record<string, unknown>,
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
  const plugins = await loadPlugins(options);
  for (const plugin of plugins) {
    const cfg = options.config?.[plugin.id] ?? plugin.defaultConfig;
    if (registries.payments && plugin.registerPayments) {
      plugin.registerPayments(registries.payments, cfg);
    }
    if (registries.shipping && plugin.registerShipping) {
      plugin.registerShipping(registries.shipping, cfg);
    }
    if (registries.widgets && plugin.registerWidgets) {
      plugin.registerWidgets(registries.widgets, cfg);
    }
  }
  return plugins as Plugin<P, S, W>[];
}
