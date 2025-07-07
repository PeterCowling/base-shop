// packages/platform-core/repositories/pages/index.server.ts

import "server-only";

import { pageSchema, type Page } from "@types";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { validateShopName } from "../../../../lib/src/validateShopName";
import { DATA_ROOT } from "../utils";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/** Absolute path to the pages.json file for a given shop */
function pagesPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "pages.json");
}

/** Ensure the `<DATA_ROOT>/<shop>` directory exists */
async function ensureDir(shop: string): Promise<void> {
  shop = validateShopName(shop);
  await fs.mkdir(path.join(DATA_ROOT, shop), { recursive: true });
}

/** Atomically write the full pages array to disk */
async function writePages(shop: string, pages: Page[]): Promise<void> {
  await ensureDir(shop);
  const tmp = `${pagesPath(shop)}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(pages, null, 2), "utf8");
  await fs.rename(tmp, pagesPath(shop));
}

/**
 * Merge a partial patch into an object **without** letting `undefined`
 * clobber existing values.
 */
function mergeDefined<T extends object>(base: T, patch: Partial<T>): T {
  const definedEntries = Object.entries(patch).filter(
    ([, v]) => v !== undefined
  );
  return { ...base, ...(Object.fromEntries(definedEntries) as Partial<T>) };
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                */
/* -------------------------------------------------------------------------- */

/** Return all pages for a shop, or an empty array if none exist */
export async function getPages(shop: string): Promise<Page[]> {
  try {
    const buf = await fs.readFile(pagesPath(shop), "utf8");
    const parsed = pageSchema.array().safeParse(JSON.parse(buf));
    if (parsed.success) return parsed.data;
  } catch {
    // missing file or invalid JSON – treat as no pages
  }
  return [];
}

/** Create or overwrite an entire Page record */
export async function savePage(shop: string, page: Page): Promise<Page> {
  const pages = await getPages(shop);
  const idx = pages.findIndex((p) => p.id === page.id);
  if (idx === -1) pages.push(page);
  else pages[idx] = page;
  await writePages(shop, pages);
  return page;
}

/** Delete a page by ID */
export async function deletePage(shop: string, id: string): Promise<void> {
  const pages = await getPages(shop);
  const next = pages.filter((p) => p.id !== id);
  if (next.length === pages.length) {
    throw new Error(`Page ${id} not found in ${shop}`);
  }
  await writePages(shop, next);
}

/** Patch a page. Only defined keys in `patch` are applied. */
export async function updatePage(
  shop: string,
  patch: Partial<Page> & { id: string; updatedAt: string }
): Promise<Page> {
  const pages = await getPages(shop);
  const idx = pages.findIndex((p) => p.id === patch.id);
  if (idx === -1) {
    throw new Error(`Page ${patch.id} not found in ${shop}`);
  }

  const current = pages[idx];
  if (current.updatedAt !== patch.updatedAt) {
    throw new Error("Conflict: page has been modified");
  }

  const updated: Page = mergeDefined(current, patch);
  updated.updatedAt = new Date().toISOString();

  pages[idx] = updated;
  await writePages(shop, pages);
  return updated;
}
