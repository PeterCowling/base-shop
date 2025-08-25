import { promises as fs } from "node:fs";
import { join, basename } from "node:path";
import { ulid } from "ulid";
import { nowIso } from "@acme/date-utils";
import { savePage } from "@acme/platform-core/src/repositories/pages/index.server";
import type { Page } from "@acme/types";

/**
 * Copy page templates from `data/templates/<template>/pages` into
 * `data/shops/<shopId>` and persist them via the pages repository.
 *
 * Any missing metadata (id, timestamps, status, etc.) is filled in
 * automatically before saving.
 */
export async function applyPageTemplate(
  shopId: string,
  template: string
): Promise<void> {
  const root = process.cwd();
  const templateDir = join(root, "data", "templates", template, "pages");
  let files: string[] = [];
  try {
    files = await fs.readdir(templateDir);
  } catch {
    console.warn(`No pages template found for '${template}'.`);
    return;
  }

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const filePath = join(templateDir, file);
    let pageData: Partial<Page>;
    try {
      const raw = await fs.readFile(filePath, "utf8");
      pageData = JSON.parse(raw) as Partial<Page>;
    } catch (err) {
      console.error(`Failed to parse ${filePath}:`, (err as Error).message);
      continue;
    }

    const now = nowIso();
    const slug = pageData.slug || basename(file, ".json");
    const page: Page = {
      id: pageData.id ?? ulid(),
      slug,
      status: pageData.status ?? "draft",
      components: pageData.components ?? [],
      seo: pageData.seo ?? { title: { en: slug } },
      createdAt: pageData.createdAt ?? now,
      updatedAt: pageData.updatedAt ?? now,
      createdBy: pageData.createdBy ?? "template",
      history: pageData.history,
    };

    await savePage(shopId, page, undefined);
  }
}

// Allow running as a standalone script: `ts-node apply-page-template.ts <shop> <template>`
if (process.argv[1] && process.argv[1].includes("apply-page-template")) {
  const [, , shop, tmpl] = process.argv;
  if (!shop || !tmpl) {
    console.error("Usage: apply-page-template <shopId> <template>");
    process.exit(1);
  }
  applyPageTemplate(shop, tmpl).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
