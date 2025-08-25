import { copyFileSync, cpSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Copy sample shop data into the given shop directory. Always copies
 * products and inventory. When `full` is true, also copies optional files
 * like shop.json, navigation defaults, page templates, and settings if they
 * exist in the template directory.
 * Paths are resolved relative to the repository root.
 *
 * @param shopId - Directory name of the shop (e.g. "shop-demo").
 * @param template - Template name under data/templates. Defaults to "default".
 * @param full - Whether to copy optional files in addition to products and inventory.
 */
export function seedShop(
  shopId: string,
  template = "default",
  full = false,
): void {
  const srcDir = join("data", "templates", template);
  const destDir = join("data", "shops", shopId);
  try {
    copyFileSync(join(srcDir, "products.json"), join(destDir, "products.json"));
    copyFileSync(join(srcDir, "inventory.json"), join(destDir, "inventory.json"));
    if (full) {
      const optionalFiles = [
        "shop.json",
        "settings.json",
        "navigation.json",
      ];
      for (const file of optionalFiles) {
        const src = join(srcDir, file);
        if (existsSync(src)) {
          copyFileSync(src, join(destDir, file));
        }
      }
      const pagesSrc = join(srcDir, "pages");
      if (existsSync(pagesSrc)) {
        cpSync(pagesSrc, join(destDir, "pages"), { recursive: true });
      }
    }
  } catch (err) {
    console.error(`Failed to seed shop data: ${(err as Error).message}`);
  }
}
