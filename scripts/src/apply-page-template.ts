import { promises as fs } from "node:fs";
import { join } from "node:path";

/**
 * Copy page layouts from a template into a shop's data directory and
 * persist them via the CMS HTTP API. Missing templates are ignored with a
 * warning.
 *
 * @param shopId   Directory name of the shop (e.g. "shop-demo").
 * @param template Template name under data/templates.
 */
export async function applyPageTemplate(
  shopId: string,
  template: string
): Promise<void> {
  const srcDir = join("data", "templates", template, "pages");
  const destDir = join("data", "shops", shopId, "pages");
  let files: string[];
  try {
    files = await fs.readdir(srcDir);
  } catch (err) {
    console.error(
      `Page template \"${template}\" not found:`,
      (err as Error).message
    );
    return;
  }

  await fs.mkdir(destDir, { recursive: true });

  const cmsUrl = process.env.CMS_SPACE_URL;
  const token = process.env.CMS_ACCESS_TOKEN;
  const headers = token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : undefined;

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const srcPath = join(srcDir, file);
    const destPath = join(destDir, file);
    try {
      const content = await fs.readFile(srcPath, "utf8");
      await fs.writeFile(destPath, content, "utf8");
      if (cmsUrl && headers) {
        try {
          const res = await fetch(`${cmsUrl}/shops/${shopId}/pages`, {
            method: "POST",
            headers,
            body: content,
          });
          if (!res.ok) {
            const text = await res.text().catch(() => "");
            console.error(`Failed to persist ${file}: ${res.status} ${text}`);
          }
        } catch (err) {
          console.error(`Failed to persist ${file}:`, err);
        }
      }
    } catch (err) {
      console.error(`Failed to apply page ${file}:`, err);
    }
  }
}
