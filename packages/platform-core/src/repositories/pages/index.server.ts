// packages/platform-core/repositories/pages/index.server.ts

import "server-only";

import { pageSchema, type Page } from "@acme/types";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { prisma } from "../../db";
import type { Prisma } from "@prisma/client";
import { validateShopName } from "@platform-core/shops";
import { DATA_ROOT } from "../../dataRoot";
import { nowIso } from "@acme/date-utils";
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/** Absolute path to the pages.json file for a given shop */
function pagesPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "pages.json");
}

function historyPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "pages.history.jsonl");
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

function setPatchValue<T extends object, K extends keyof T>(
  patch: Partial<T>,
  key: K,
  value: T[K]
): void {
  patch[key] = value;
}

function diffPages(oldP: Page | undefined, newP: Page): Partial<Page> {
  const patch: Partial<Page> = {};
  for (const key of Object.keys(newP) as (keyof Page)[]) {
    const a = oldP ? JSON.stringify(oldP[key]) : undefined;
    const b = JSON.stringify(newP[key]);
    if (a !== b) {
      setPatchValue<Page>(patch, key, newP[key]);
    }
  }
  return patch;
}

async function appendHistory(
  shop: string,
  diff: Partial<Page>
): Promise<void> {
  if (Object.keys(diff).length === 0) return;
  await ensureDir(shop);
  const entry = { timestamp: nowIso(), diff };
  await fs.appendFile(historyPath(shop), JSON.stringify(entry) + "\n", "utf8");
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                */
/* -------------------------------------------------------------------------- */

/** Return all pages for a shop, or an empty array if none exist */
export async function getPages(shop: string): Promise<Page[]> {
  try {
    const rows = await prisma.page.findMany({ where: { shopId: shop } });
    if (rows.length) return rows.map((r) => pageSchema.parse(r.data));
    return [];
  } catch {
    // fall back to filesystem
  }
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
export async function savePage(
  shop: string,
  page: Page,
  previous?: Page
): Promise<Page> {
  const patch = diffPages(previous, page);
  try {
    await prisma.page.upsert({
      where: { id: page.id },
      update: { data: page as Prisma.InputJsonValue, slug: page.slug },
      create: {
        id: page.id,
        shopId: shop,
        slug: page.slug,
        data: page as Prisma.InputJsonValue,
      },
    });
  } catch {
    // fallback to filesystem
    const pages = await getPages(shop);
    const idx = pages.findIndex((p) => p.id === page.id);
    if (idx === -1) pages.push(page);
    else pages[idx] = page;
    await writePages(shop, pages);
  }
  await appendHistory(shop, patch);
  return page;
}

/** Delete a page by ID */
export async function deletePage(shop: string, id: string): Promise<void> {
  try {
    const res = await prisma.page.deleteMany({ where: { id, shopId: shop } });
    if (res.count === 0) throw new Error("not found");
    return;
  } catch {
    // fallback
  }
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
  patch: Partial<Page> & { id: string; updatedAt: string },
  previous: Page
): Promise<Page> {
  if (previous.updatedAt !== patch.updatedAt) {
    throw new Error("Conflict: page has been modified");
  }
  const updated: Page = mergeDefined(previous, patch);
  updated.updatedAt = nowIso();

  try {
    await prisma.page.update({
      where: { id: patch.id },
      data: {
        data: updated as Prisma.InputJsonValue,
        slug: updated.slug,
      },
    });
  } catch {
    // fallback
    const pages = await getPages(shop);
    const idx = pages.findIndex((p) => p.id === patch.id);
    if (idx === -1) {
      throw new Error(`Page ${patch.id} not found in ${shop}`);
    }
    pages[idx] = updated;
    await writePages(shop, pages);
  }
  const diff = diffPages(previous, updated);
  await appendHistory(shop, diff);
  return updated;
}

export interface PageDiffEntry {
  timestamp: string;
  diff: Partial<Page>;
}

const entrySchema = z
  .object({
    timestamp: z.string().datetime(),
    diff: pageSchema.partial(),
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
