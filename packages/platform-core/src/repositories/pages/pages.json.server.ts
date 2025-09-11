import "server-only";

import { pageSchema, type Page } from "@acme/types";
import { promises as fs } from "fs";
import * as path from "path";
import { validateShopName } from "../../shops/index";
import { DATA_ROOT } from "../../dataRoot";
import { nowIso } from "@acme/date-utils";
import { z } from "zod";

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

function setPatchValue<T extends object, K extends keyof T>(
  patch: Partial<T>,
  key: K,
  value: T[K],
): void {
  patch[key] = value;
}

function diffPages(oldP: Page | undefined, newP: Page): Partial<Page> {
  const patch: Partial<Page> = {};
  for (const key of Object.keys(newP) as (keyof Page)[]) {
    const a = oldP ? JSON.stringify(oldP[key]) : undefined;
    const b = JSON.stringify(newP[key]);
    if (a !== b) {
      setPatchValue(patch, key, newP[key]);
    }
  }
  return patch;
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

function mergeDefined<T extends object>(base: T, patch: Partial<T>): T {
  const definedEntries = Object.entries(patch).filter(([, v]) => v !== undefined);
  return { ...base, ...(Object.fromEntries(definedEntries) as Partial<T>) };
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
  if (previous) {
    const patch = diffPages(previous, page);
    await appendHistory(shop, patch);
  }
  return page;
}

export async function deletePage(shop: string, id: string): Promise<void> {
  const pages = await readPagesFromDisk(shop);
  const next = pages.filter((p) => p.id !== id);
  if (next.length === pages.length) {
    throw new Error(`Page ${id} not found in ${shop}`);
  }
  await writePages(shop, next);
}

export async function updatePage(
  shop: string,
  patch: Partial<Page> & { id: string; updatedAt: string },
  previous: Page,
): Promise<Page> {
  if (previous.updatedAt !== patch.updatedAt) {
    throw new Error("Conflict: page has been modified");
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
  const diff = diffPages(previous, updated);
  if (previous) {
    await appendHistory(shop, diff);
  }
  return updated;
}

export interface PageDiffEntry {
  timestamp: string;
  diff: Partial<Page>;
}

const entrySchema = z
  .object({
    timestamp: z.string().datetime(),
    diff: (pageSchema as unknown as z.AnyZodObject).partial(),
  })
  .strict();

export async function diffHistory(shop: string): Promise<PageDiffEntry[]> {
  try {
    const buf = await fs.readFile(historyPath(shop), "utf8");
    return buf
      .trim()
      .split(/\n+/)
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return undefined;
        }
      })
      .filter((p): p is unknown => p !== undefined)
      .map((p) => entrySchema.safeParse(p))
      .filter((r) => r.success)
      .map((r) => (r as z.SafeParseSuccess<PageDiffEntry>).data);
  } catch {
    return [];
  }
}

