import { copyFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Copy sample products and inventory data into the given shop directory.
 * Paths are resolved relative to the repository root.
 *
 * @param shopId - Directory name of the shop (e.g. "shop-demo").
 * @param template - Template name under data/templates. Defaults to "default".
 */
export function seedShop(shopId: string, template = "default"): void {
  const srcDir = join("data", "templates", template);
  const destDir = join("data", "shops", shopId);
  try {
    copyFileSync(join(srcDir, "products.json"), join(destDir, "products.json"));
    copyFileSync(join(srcDir, "inventory.json"), join(destDir, "inventory.json"));
  } catch (err) {
    console.error(`Failed to seed shop data: ${(err as Error).message}`);
  }
}
