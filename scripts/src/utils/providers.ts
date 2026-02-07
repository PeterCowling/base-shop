import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { pluginEnvVars } from "@acme/platform-core/configurator";
import { listProviders } from "@acme/platform-core/createShop/listProviders";

export interface PluginMeta {
  id: string;
  packageName?: string;
  envVars: readonly string[];
}

export function listPlugins(root: string): PluginMeta[] {
  const pluginsDir = join(root, "packages", "plugins");
  try {
    return readdirSync(pluginsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => {
        let packageName: string | undefined;
        try {
          const pkgRaw = readFileSync(
            join(pluginsDir, d.name, "package.json"),
            "utf8",
          );
          packageName = JSON.parse(pkgRaw).name;
        } catch {}
        return {
          id: d.name,
          packageName,
          envVars: pluginEnvVars[d.name] ?? [],
        };
      });
  } catch {
    return [];
  }
}

export { listProviders };
