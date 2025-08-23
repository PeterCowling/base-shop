import { readdir } from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";

import { defaultPaymentProviders } from "./defaultPaymentProviders";
import { defaultShippingProviders } from "./defaultShippingProviders";

/**
 * List available providers for a given category by combining built-in
 * providers with any plugins under packages/plugins that implement the
 * respective registration hook.
 */
export async function listProviders(
  kind: "payment" | "shipping"
): Promise<string[]> {
  const builtIns: string[] =
    kind === "payment"
      ? [...defaultPaymentProviders]
      : [...defaultShippingProviders];

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
        if (
          kind === "payment" &&
          typeof plugin?.registerPayments === "function"
        ) {
          builtIns.push(plugin.id ?? entry.name);
        }
        if (
          kind === "shipping" &&
          typeof plugin?.registerShipping === "function"
        ) {
          builtIns.push(plugin.id ?? entry.name);
        }
      } catch {
        // ignore plugins that fail to load
      }
    }
  } catch {
    // ignore if plugins directory is missing
  }
  return Array.from(new Set(builtIns));
}

export default listProviders;
