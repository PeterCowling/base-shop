import "server-only";

import { promises as fs } from "fs";
import * as path from "path";
import { ulid } from "ulid";
import type { ProductPublication } from "../products/index.js";
import { validateShopName } from "../shops/index.js";
import { DATA_ROOT } from "../dataRoot.js";
import { nowIso } from "@acme/date-utils";

function filePath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "products.json");
}

async function ensureDir(shop: string): Promise<void> {
  shop = validateShopName(shop);
  await fs.mkdir(path.join(DATA_ROOT, shop), { recursive: true });
}

export async function readRepo<T = ProductPublication>(
  shop: string
): Promise<T[]> {
  try {
    const buf = await fs.readFile(filePath(shop), "utf8");
    return JSON.parse(buf) as T[];
  } catch {
    return [] as T[];
  }
}

export async function writeRepo<T = ProductPublication>(
  shop: string,
  catalogue: T[]
): Promise<void> {
  await ensureDir(shop);
  const tmp = `${filePath(shop)}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(catalogue, null, 2), "utf8");
  await fs.rename(tmp, filePath(shop));
}

export async function getProductById<
  T extends { id: string } = ProductPublication,
>(shop: string, id: string): Promise<T | null> {
  const catalogue = await readRepo<T>(shop);
  return catalogue.find((p) => p.id === id) ?? null;
}

export async function updateProductInRepo<
  T extends { id: string; row_version: number } = ProductPublication,
>(shop: string, patch: Partial<T> & { id: string }): Promise<T> {
  const catalogue = await readRepo<T>(shop);
  const idx = catalogue.findIndex((p) => p.id === patch.id);
  if (idx === -1) throw new Error(`Product ${patch.id} not found in ${shop}`);
  const updated: T = {
    ...catalogue[idx],
    ...patch,
    row_version: catalogue[idx].row_version + 1,
  };
  catalogue[idx] = updated;
  await writeRepo<T>(shop, catalogue);
  return updated;
}

export async function deleteProductFromRepo<
  T extends { id: string } = ProductPublication,
>(shop: string, id: string): Promise<void> {
  const catalogue = await readRepo<T>(shop);
  const next = catalogue.filter((p) => p.id !== id);
  if (next.length === catalogue.length) {
    throw new Error(`Product ${id} not found in ${shop}`);
  }
  await writeRepo<T>(shop, next);
}

export async function duplicateProductInRepo<
  T extends ProductPublication = ProductPublication,
>(shop: string, id: string): Promise<T> {
  const catalogue = await readRepo<T>(shop);
  const original = catalogue.find((p) => p.id === id);
  if (!original) throw new Error(`Product ${id} not found in ${shop}`);
  const now = nowIso();
  const copy: T = {
    ...original,
    id: ulid(),
    sku: `${original.sku}-copy`,
    status: "draft",
    row_version: 1,
    created_at: now,
    updated_at: now,
  };
  await writeRepo<T>(shop, [copy, ...catalogue]);
  return copy;
}
