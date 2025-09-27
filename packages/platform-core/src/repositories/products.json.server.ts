import "server-only";

import { promises as fs } from "fs";
import * as path from "path";
import { ulid } from "ulid";
import type { ProductPublication } from "../products/index";
import { validateShopName } from "../shops/index";
import { DATA_ROOT } from "../dataRoot";
import { nowIso } from "@acme/date-utils";
import type { ProductsRepository } from "./products.types";

function filePath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "products.json");
}

async function ensureDir(shop: string): Promise<void> {
  shop = validateShopName(shop);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123: Path built from DATA_ROOT + validated shop name
  await fs.mkdir(path.join(DATA_ROOT, shop), { recursive: true });
}

async function read<T = ProductPublication>(shop: string): Promise<T[]> {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123: Path built from DATA_ROOT + validated shop name
    const buf = await fs.readFile(filePath(shop), "utf8");
    return JSON.parse(buf) as T[];
  } catch {
    return [] as T[];
  }
}

async function write<T = ProductPublication>(
  shop: string,
  catalogue: T[],
): Promise<void> {
  await ensureDir(shop);
  const tmp = `${filePath(shop)}.${Date.now()}.tmp`;
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123: Path built from DATA_ROOT + validated shop name
  await fs.writeFile(tmp, JSON.stringify(catalogue, null, 2), "utf8");
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123: Path built from DATA_ROOT + validated shop name
  await fs.rename(tmp, filePath(shop));
}

async function getById<
  T extends { id: string } = ProductPublication,
>(shop: string, id: string): Promise<T | null> {
  const catalogue = await read<T>(shop);
  return catalogue.find((p) => p.id === id) ?? null;
}

async function update<
  T extends { id: string; row_version: number } = ProductPublication,
>(shop: string, patch: Partial<T> & { id: string }): Promise<T> {
  const catalogue = await read<T>(shop);
  const idx = catalogue.findIndex((p) => p.id === patch.id);
  if (idx === -1) throw new Error(`Product ${patch.id} not found in ${shop}`);
  const updated: T = {
    ...catalogue[idx],
    ...patch,
    row_version: catalogue[idx].row_version + 1,
  };
  catalogue[idx] = updated;
  await write<T>(shop, catalogue);
  return updated;
}

async function remove(shop: string, id: string): Promise<void> {
  const catalogue = await read(shop);
  const next = catalogue.filter((p) => p.id !== id);
  if (next.length === catalogue.length) {
    throw new Error(`Product ${id} not found in ${shop}`);
  }
  await write(shop, next);
}

async function duplicate<
  T extends ProductPublication = ProductPublication,
>(shop: string, id: string): Promise<T> {
  const catalogue = await read<T>(shop);
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
  await write<T>(shop, [copy, ...catalogue]);
  return copy;
}

export const jsonProductsRepository: ProductsRepository = {
  read,
  write,
  getById,
  update,
  delete: remove,
  duplicate,
};
