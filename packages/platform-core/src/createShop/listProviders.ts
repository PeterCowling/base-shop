import { readdir } from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";

import { pluginEnvVars } from "../configurator";

import { defaultPaymentProviders } from "./defaultPaymentProviders";
import { defaultShippingProviders } from "./defaultShippingProviders";

/**
 * Information about an available provider.
 */
export interface ProviderInfo {
  id: string;
  name: string;
  envVars: readonly string[];
}

/**
 * List available providers for a given category by combining built-in
 * providers with any plugins under packages/plugins that implement the
 * respective registration hook.
 */
export async function listProviders(
  kind: "payment" | "shipping",
): Promise<ProviderInfo[]> {
  const builtIns: ProviderInfo[] = (
    kind === "payment"
      ? [...defaultPaymentProviders]
      : [...defaultShippingProviders]
  ).map((id) => ({ id, name: id, envVars: pluginEnvVars[id] ?? [] }));

  const pluginsDir = path.resolve(__dirname, "../../../plugins");
  try {
    const entries = await readdir(pluginsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      try {
        const modPath = pathToFileURL(
          path.join(pluginsDir, entry.name, "index.ts")
        ).href;
        const mod = await import(modPath);
        const plugin = mod.default;
        const id = plugin?.id ?? entry.name;
        const info: ProviderInfo = {
          id,
          name: plugin?.name ?? id,
          envVars: pluginEnvVars[id] ?? [],
        };
        if (
          kind === "payment" &&
          typeof plugin?.registerPayments === "function"
        ) {
          builtIns.push(info);
        }
        if (
          kind === "shipping" &&
          typeof plugin?.registerShipping === "function"
        ) {
          builtIns.push(info);
        }
      } catch {
        // ignore plugins that fail to load
      }
    }
  } catch {
    // ignore if plugins directory is missing
  }
  const map = new Map<string, ProviderInfo>();
  for (const p of builtIns) {
    if (!map.has(p.id)) {
      map.set(p.id, p);
    }
  }
  return Array.from(map.values());
}

export default listProviders;

