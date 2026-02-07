/* eslint-disable security/detect-non-literal-fs-filename -- DS-000 paths built from validated shop and trusted base directory */
import "server-only";

import { promises as fs } from "fs";
import * as path from "path";

import { nowIso } from "@acme/date-utils";
import {
  diffPage,
  mergeDefined,
  type PageDiffEntry,
  parsePageDiffHistory,
} from "@acme/page-builder-core";
import type { Page } from "@acme/types";
import { pageSchema } from "@acme/types";

import { DATA_ROOT } from "../../dataRoot";
import { validateShopName } from "../../shops/index";

// Helpers

function pagesPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "pages.json");
}

function historyPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "pages.history.jsonl");
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

async function readPagesFromDisk(shop: string): Promise<Page[]> {
  try {
    const buf = await fs.readFile(pagesPath(shop), "utf8");
    const json = JSON.parse(buf);
    const parsed = pageSchema.array().safeParse(json);
    if (parsed.success) return parsed.data;
    return json as Page[];
  } catch {
    return [];
  }
}

async function appendHistory(
  shop: string,
  diff: Partial<Page>,
): Promise<void> {
  if (Object.keys(diff).length === 0) return;
  await ensureDir(shop);
  const entry = { timestamp: nowIso(), diff };
  await fs.appendFile(historyPath(shop), JSON.stringify(entry) + "\n", "utf8");
}

// Public API

export async function getPages(shop: string): Promise<Page[]> {
  return readPagesFromDisk(shop);
}

export async function savePage(
  shop: string,
  page: Page,
  previous?: Page,
): Promise<Page> {
  const pages = await readPagesFromDisk(shop);
  const idx = pages.findIndex((p) => p.id === page.id);
  if (idx === -1) pages.push(page);
  else pages[idx] = page;
  await writePages(shop, pages);
  const patch = diffPage(previous, page);
  await appendHistory(shop, patch);
  return page;
}

export async function deletePage(shop: string, id: string): Promise<void> {
  const pages = await readPagesFromDisk(shop);
  const next = pages.filter((p) => p.id !== id);
  if (next.length === pages.length) {
    throw new Error(`Page ${id} not found in ${shop}`); // i18n-exempt -- developer error, not user-facing
  }
  await writePages(shop, next);
}

export async function updatePage(
  shop: string,
  patch: Partial<Page> & { id: string; updatedAt: string },
  previous: Page,
): Promise<Page> {
  if (previous.updatedAt !== patch.updatedAt) {
    throw new Error("Conflict: page has been modified"); // i18n-exempt -- developer error, not user-facing
  }
  const pages = await readPagesFromDisk(shop);
  const idx = pages.findIndex((p) => p.id === patch.id);
  if (idx === -1) {
    throw new Error(`Page ${patch.id} not found in ${shop}`);
  }
  const updated: Page = mergeDefined(previous, patch);
  updated.updatedAt = nowIso();
  pages[idx] = updated;
  await writePages(shop, pages);
  const diff = diffPage(previous, updated);
  if (previous) {
    await appendHistory(shop, diff);
  }
  return updated;
}

export async function diffHistory(shop: string): Promise<PageDiffEntry[]> {
  try {
    const buf = await fs.readFile(historyPath(shop), "utf8");
    return parsePageDiffHistory(buf);
  } catch {
    return [];
  }
}

export async function reorderPages(shop: string, ids: string[]): Promise<Page[]> {
  const pages = await readPagesFromDisk(shop);
  const map = new Map(pages.map((p) => [p.id, p] as const));
  const ordered: Page[] = [];
  for (const id of ids) {
    const p = map.get(id);
    if (p) ordered.push(p);
  }
  // append any pages not included in ids to preserve data
  for (const p of pages) {
    if (!ids.includes(p.id)) ordered.push(p);
  }
  await writePages(shop, ordered);
  return ordered;
}
