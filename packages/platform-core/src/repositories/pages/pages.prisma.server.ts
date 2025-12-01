/* eslint-disable security/detect-non-literal-fs-filename -- DS-000 paths built from validated shop and trusted base directory */
import "server-only";

import type { Page } from "@acme/types";
import { pageSchema } from "@acme/types";
import { promises as fs } from "fs";
import * as path from "path";
import { prisma } from "../../db";
import { validateShopName } from "../../shops/index";
import { DATA_ROOT } from "../../dataRoot";
import { nowIso } from "@acme/date-utils";
import {
  diffPage,
  mergeDefined,
  parsePageDiffHistory,
  type PageDiffEntry,
} from "@acme/page-builder-core";
import type { Prisma } from "@prisma/client";

let jsonRepoPromise:
  | Promise<typeof import("./pages.json.server")>
  | undefined;

async function loadJsonRepo() {
  jsonRepoPromise ??= import("./pages.json.server");
  return jsonRepoPromise;
}

// Helpers

function historyPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "pages.history.jsonl");
}

async function ensureDir(shop: string): Promise<void> {
  shop = validateShopName(shop);
  await fs.mkdir(path.join(DATA_ROOT, shop), { recursive: true });
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

type JsonObject = Prisma.InputJsonObject;

export async function getPages(shop: string): Promise<Page[]> {
  try {
    const rows = await prisma.page.findMany({ where: { shopId: shop } });
    return rows.map((r: { data: unknown }) => pageSchema.parse(r.data));
  } catch (err) {
    console.error(`Failed to read pages for ${shop}`, err);
    const jsonRepo = await loadJsonRepo();
    return jsonRepo.getPages(shop);
  }
}

export async function savePage(
  shop: string,
  page: Page,
  previous?: Page,
): Promise<Page> {
  try {
    await prisma.page.upsert({
      where: { id: page.id },
      update: { data: page as unknown as JsonObject, slug: page.slug },
      create: {
        id: page.id,
        shopId: shop,
        slug: page.slug,
        data: page as unknown as JsonObject,
      },
    });
    const patch = diffPage(previous, page);
    await appendHistory(shop, patch);
    return page;
  } catch (err) {
    console.error(`Failed to save page ${page.id} for ${shop}`, err);
    const jsonRepo = await loadJsonRepo();
    return jsonRepo.savePage(shop, page, previous);
  }
}

export async function deletePage(shop: string, id: string): Promise<void> {
  try {
    const res = await prisma.page.deleteMany({ where: { id, shopId: shop } });
    if (res.count === 0) {
      throw new Error(`Page ${id} not found in ${shop}`); // i18n-exempt -- developer error, not user-facing
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("not found")) {
      throw err;
    }
    console.error(`Failed to delete page ${id} for ${shop}`, err);
    const jsonRepo = await loadJsonRepo();
    await jsonRepo.deletePage(shop, id);
  }
}

export async function updatePage(
  shop: string,
  patch: Partial<Page> & { id: string; updatedAt: string },
  previous: Page,
): Promise<Page> {
  if (previous.updatedAt !== patch.updatedAt) {
    throw new Error("Conflict: page has been modified"); // i18n-exempt -- developer error, not user-facing
  }
  const updated: Page = mergeDefined(previous, patch);
  updated.updatedAt = nowIso();

  try {
    await prisma.page.update({
      where: { id: patch.id },
      data: {
        data: updated as unknown as JsonObject,
        slug: updated.slug,
      },
    });

    const diff = diffPage(previous, updated);
    if (previous) {
      await appendHistory(shop, diff);
    }
    return updated;
  } catch (err) {
    console.error(`Failed to update page ${patch.id} for ${shop}`, err);
    const jsonRepo = await loadJsonRepo();
    return jsonRepo.updatePage(shop, patch, previous);
  }
}

export async function diffHistory(shop: string): Promise<PageDiffEntry[]> {
  try {
    const buf = await fs.readFile(historyPath(shop), "utf8");
    return parsePageDiffHistory(buf);
  } catch {
    return [];
  }
}

export async function reorderPages(shop: string, _ids: string[]): Promise<Page[]> {
  // Prisma schema currently has no explicit ordering field.
  // Return current pages in existing order.
  return getPages(shop);
}
