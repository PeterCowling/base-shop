import { readdir } from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";

import { defaultPaymentProviders } from "./defaultPaymentProviders";
import { defaultShippingProviders } from "./defaultShippingProviders";

export interface ProviderMeta {
  id: string;
  name: string;
  env: string[];
}

/**
 * List available providers for a given category by combining built-in
 * providers with any plugins under packages/plugins that implement the
 * respective registration hook.
 */
export async function listProviders(
  kind: "payment" | "shipping"
): Promise<ProviderMeta[]> {
  const builtIns: ProviderMeta[] =
    kind === "payment"
      ? defaultPaymentProviders.map((id) => {
          switch (id) {
            case "stripe":
              return {
                id,
                name: "Stripe",
                env: [
                  "STRIPE_SECRET_KEY",
                  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
                  "STRIPE_WEBHOOK_SECRET",
                ],
              };
            case "paypal":
              return {
                id,
                name: "PayPal",
                env: ["PAYPAL_CLIENT_ID", "PAYPAL_SECRET"],
              };
            default:
              return { id, name: id, env: [] };
          }
        })
      : defaultShippingProviders.map((id) => {
          switch (id) {
            case "dhl":
              return { id, name: "DHL", env: [] };
            case "ups":
              return { id, name: "UPS", env: [] };
            case "premier-shipping":
              return { id, name: "Premier Shipping", env: [] };
            default:
              return { id, name: id, env: [] };
          }
        });

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
          (kind === "payment" &&
            typeof plugin?.registerPayments === "function") ||
          (kind === "shipping" &&
            typeof plugin?.registerShipping === "function")
        ) {
          const id = plugin.id ?? entry.name;
          const name = plugin.name ?? id;
          const prefix = id.replace(/-/g, "_").toUpperCase();
          const env = plugin.defaultConfig
            ? Object.keys(plugin.defaultConfig).map((k: string) =>
                `${prefix}_${k.replace(/([A-Z])/g, "_$1").toUpperCase()}`
              )
            : [];
          builtIns.push({ id, name, env });
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
    map.set(p.id, p);
  }
  return Array.from(map.values());
}

export default listProviders;
