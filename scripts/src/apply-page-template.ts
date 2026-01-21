import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { savePage } from "@acme/platform-core/repositories/pages/index.server";
import type { Page } from "@acme/types";

/**
 * Copy page layouts from a template into a shop and persist them.
 * @param shopId - Directory name of the shop (e.g. "shop-demo").
 * @param template - Template name under data/templates.
 */
export async function applyPageTemplate(
  shopId: string,
  template: string,
): Promise<void> {
  const srcDir = join("data", "templates", template, "pages");
  try {
    const files = readdirSync(srcDir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const raw = readFileSync(join(srcDir, file), "utf8");
      const page = JSON.parse(raw) as Page;
      await savePage(shopId, page);
    }
  } catch (err) {
    console.error(
      `Failed to apply page template: ${(err as Error).message}`,
    );
  }
}
