// packages/platform-core/repositories/pages/index.server.ts

import "server-only";

import type { Page } from "@types";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { validateShopName } from "../../shops";
import { DATA_ROOT } from "../utils";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */
function pagesPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "pages.json");
}

async function ensureDir(shop: string): Promise<void> {
  shop = validateShopName(shop);
  await fs.mkdir(path.join(DATA_ROOT, shop), { recursive: true });
}

async function writePages(shop: string, pages: Page[]): Promise<void> {
  await ensureDir(shop);
  const tmp = `${pagesPath(shop)}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(pages, null, 2), "utf8");
  await fs.rename(tmp, pagesPath(shop));
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                */
/* -------------------------------------------------------------------------- */
export async function getPages(shop: string): Promise<Page[]> {
  try {
    const buf = await fs.readFile(pagesPath(shop), "utf8");
    const parsed = JSON.parse(buf) as Page[];
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // ignore missing or invalid file
  }
  return [];
}

export async function savePage(shop: string, page: Page): Promise<Page> {
  const pages = await getPages(shop);
  const idx = pages.findIndex((p) => p.id === page.id);
  if (idx === -1) pages.push(page);
  else pages[idx] = page;
  await writePages(shop, pages);
  return page;
}

export async function deletePage(shop: string, id: string): Promise<void> {
  const pages = await getPages(shop);
  const next = pages.filter((p) => p.id !== id);
  if (next.length === pages.length)
    throw new Error(`Page ${id} not found in ${shop}`);
  await writePages(shop, next);
}

export async function updatePage(
  shop: string,
  patch: Partial<Page> & { id: string; updatedAt: string }
): Promise<Page> {
  const pages = await getPages(shop);
  const idx = pages.findIndex((p) => p.id === patch.id);
  if (idx === -1) throw new Error(`Page ${patch.id} not found in ${shop}`);
  const current = pages[idx];
  if (current.updatedAt !== patch.updatedAt) {
    throw new Error("Conflict: page has been modified");
  }
  const updated: Page = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  pages[idx] = updated;
  await writePages(shop, pages);
  return updated;
}
