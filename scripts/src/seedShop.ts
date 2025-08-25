import { copyFileSync, cpSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Copy sample products and inventory data into the given shop directory.
 * Paths are resolved relative to the repository root.
 *
 * @param shopId - Directory name of the shop (e.g. "shop-demo").
 * @param template - Template name under data/templates. Defaults to "default".
 */
export function seedShop(
  shopId: string,
  template = "default",
  full = false,
): void {
  const srcDir = join("data", "templates", template);
  const destDir = join("data", "shops", shopId);
  try {
    const baseFiles = ["products.json", "inventory.json"];
    for (const file of baseFiles) {
      const src = join(srcDir, file);
      if (existsSync(src)) {
        copyFileSync(src, join(destDir, file));
      }
    }
    if (full) {
      const extraFiles = [
        "shop.json",
        "settings.json",
        "navigation.json",
        "pages.json",
      ];
      const extraDirs = ["navigation", "pages"];
      for (const file of extraFiles) {
        const src = join(srcDir, file);
        if (existsSync(src)) {
          copyFileSync(src, join(destDir, file));
        }
      }
      for (const dir of extraDirs) {
        const src = join(srcDir, dir);
        if (existsSync(src)) {
          cpSync(src, join(destDir, dir), { recursive: true });
        }
      }
    }
  } catch (err) {
    console.error(`Failed to seed shop data: ${(err as Error).message}`);
  }
}
