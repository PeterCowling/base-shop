// packages/platform-core/src/plugins.ts
import { readdir } from "node:fs/promises";
import type { Dirent } from "node:fs";
import path from "node:path";

/** Registry for payment providers */
export interface PaymentRegistry {
  add(id: string, provider: unknown): void;
}

/** Registry for shipping providers */
export interface ShippingRegistry {
  add(id: string, provider: unknown): void;
}

/** Registry for widget components */
export interface WidgetRegistry {
  add(id: string, component: unknown): void;
}

export interface PluginOptions {
  /** Optional name shown in the CMS */
  name: string;
  /** Optional description for plugin */
  description?: string;
  /** Default configuration values */
  defaultConfig?: Record<string, unknown>;
}

export interface Plugin extends PluginOptions {
  id: string;
  registerPayments?(registry: PaymentRegistry, config?: Record<string, unknown>): void;
  registerShipping?(registry: ShippingRegistry, config?: Record<string, unknown>): void;
  registerWidgets?(registry: WidgetRegistry, config?: Record<string, unknown>): void;
}

/** Load all plugins from packages/plugins */
export async function loadPlugins(): Promise<Plugin[]> {
  const pluginsDir = path.resolve(process.cwd(), "packages", "plugins");
  let dirs: Dirent[];
  try {
    dirs = await readdir(pluginsDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const plugins: Plugin[] = [];
  for (const dir of dirs) {
    if (!dir.isDirectory()) continue;
    const modPath = path.join(pluginsDir, dir.name, "index.ts");
    try {
      const mod = await import(modPath);
      if (mod.default) {
        plugins.push(mod.default as Plugin);
      }
    } catch (err) {
      console.warn(`Failed to load plugin ${dir.name}`, err);
    }
  }
  return plugins;
}

/** Load plugins and call their registration hooks */
export async function initPlugins(registries: {
  payments?: PaymentRegistry;
  shipping?: ShippingRegistry;
  widgets?: WidgetRegistry;
}): Promise<Plugin[]> {
  const plugins = await loadPlugins();
  for (const plugin of plugins) {
    const cfg = plugin.defaultConfig;
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
  return plugins;
}
