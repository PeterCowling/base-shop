import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  createShop,
  type CreateShopOptions,
} from "@acme/platform-core/createShop";

import { seedShop } from "../seedShop";

interface PluginMeta {
  packageName?: string;
  envVars: readonly string[];
}

export async function createShopAndSeed(
  id: string,
  options: CreateShopOptions,
  selectedPlugins: Set<string>,
  pluginMap: Map<string, PluginMeta>,
  { seed, seedFull }: { seed?: boolean; seedFull?: boolean }
): Promise<void> {
  await createShop(id, options);
  if (seedFull) {
    seedShop(id, undefined, true);
  } else if (seed) {
    seedShop(id);
  }
  try {
    const pkgPath = join("apps", id, "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    pkg.dependencies = pkg.dependencies ?? {};
    for (const pid of selectedPlugins) {
      const pkgName = pluginMap.get(pid)?.packageName;
      if (pkgName) {
        pkg.dependencies[pkgName] = "workspace:*";
      }
    }
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  } catch {}
}

