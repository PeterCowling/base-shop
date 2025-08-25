import { readdir, readFile } from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";

import { defaultPaymentProviders } from "./defaultPaymentProviders";
import { defaultShippingProviders } from "./defaultShippingProviders";

export interface ProviderMeta {
  id: string;
  name: string;
  env: string[];
  packageName?: string;
}

function toEnvName(prefix: string, key: string): string {
  const snake = key
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .toUpperCase();
  const pre = prefix.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
  return `${pre}_${snake}`;
}

/**
 * List available providers or plugins with metadata. When `kind` is provided
 * only providers matching the respective registration hook are returned.
 */
export async function listProviders(
  kind?: "payment" | "shipping"
): Promise<ProviderMeta[]> {
  const builtIns: ProviderMeta[] = [];
  if (kind === "payment") {
    builtIns.push(
      ...defaultPaymentProviders.map((id) => ({ id, name: id, env: [] }))
    );
  } else if (kind === "shipping") {
    builtIns.push(
      ...defaultShippingProviders.map((id) => ({ id, name: id, env: [] }))
    );
  }

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
        const meta: ProviderMeta = {
          id: plugin?.id ?? entry.name,
          name: plugin?.name ?? plugin?.id ?? entry.name,
          env: [],
        };

        if (plugin?.configSchema?.shape) {
          const keys = Object.keys(plugin.configSchema.shape);
          meta.env = keys.map((k: string) => toEnvName(meta.id, k));
        }

        try {
          const pkgPath = path.join(pluginsDir, entry.name, "package.json");
          const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
          meta.packageName = pkg.name;
        } catch {
          meta.packageName = `@acme/plugin-${meta.id}`;
        }

        if (
          !kind ||
          (kind === "payment" &&
            typeof plugin?.registerPayments === "function") ||
          (kind === "shipping" &&
            typeof plugin?.registerShipping === "function")
        ) {
          builtIns.push(meta);
        }
      } catch {
        // ignore plugins that fail to load
      }
    }
  } catch {
    // ignore if plugins directory is missing
  }

  const map = new Map<string, ProviderMeta>();
  for (const p of builtIns) {
    if (!map.has(p.id)) map.set(p.id, p);
  }
  return Array.from(map.values());
}

export default listProviders;
