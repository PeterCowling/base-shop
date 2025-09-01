import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createShop, type CreateShopOptions } from "@acme/platform-core/createShop";
import { seedShop } from "../seedShop";
import { applyPageTemplate } from "../apply-page-template";

export interface ShopInitOptions {
  id: string;
  options: CreateShopOptions;
  selectedPlugins: readonly string[];
  pluginMap: Map<string, { packageName?: string } & Record<string, unknown>>;
  seed?: boolean;
  seedFull?: boolean;
  pagesTemplate?: string;
}

export async function initShop(opts: ShopInitOptions): Promise<void> {
  await createShop(opts.id, opts.options);

  if (opts.seedFull) {
    seedShop(opts.id, undefined, true);
  } else if (opts.seed) {
    seedShop(opts.id);
  }

  try {
    const pkgPath = join("apps", opts.id, "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    pkg.dependencies = pkg.dependencies ?? {};
    for (const id of opts.selectedPlugins) {
      const pkgName = opts.pluginMap.get(id)?.packageName;
      if (pkgName) {
        pkg.dependencies[pkgName] = "workspace:*";
      }
    }
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  } catch {
    // ignore if package file cannot be updated
  }

  if (opts.pagesTemplate) {
    await applyPageTemplate(opts.id, opts.pagesTemplate);
  }
}
