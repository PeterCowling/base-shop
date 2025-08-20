import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { defaultPaymentProviders } from "./defaultPaymentProviders";
import { defaultShippingProviders } from "./defaultShippingProviders";
/**
 * List available providers for a given category by combining built-in
 * providers with any plugins under packages/plugins that implement the
 * respective registration hook.
 */
export async function listProviders(kind) {
    var _a, _b;
    const builtIns = kind === "payment"
        ? [...defaultPaymentProviders]
        : [...defaultShippingProviders];
    const pluginsDir = path.resolve(__dirname, "../../../plugins");
    try {
        const entries = await readdir(pluginsDir, { withFileTypes: true });
        for (const entry of entries) {
            if (!entry.isDirectory())
                continue;
            try {
                const modPath = pathToFileURL(path.join(pluginsDir, entry.name, "index.ts")).href;
                const mod = await import(modPath);
                const plugin = mod.default;
                if (kind === "payment" &&
                    typeof (plugin === null || plugin === void 0 ? void 0 : plugin.registerPayments) === "function") {
                    builtIns.push((_a = plugin.id) !== null && _a !== void 0 ? _a : entry.name);
                }
                if (kind === "shipping" &&
                    typeof (plugin === null || plugin === void 0 ? void 0 : plugin.registerShipping) === "function") {
                    builtIns.push((_b = plugin.id) !== null && _b !== void 0 ? _b : entry.name);
                }
            }
            catch (_c) {
                // ignore plugins that fail to load
            }
        }
    }
    catch (_d) {
        // ignore if plugins directory is missing
    }
    return Array.from(new Set(builtIns));
}
export default listProviders;
