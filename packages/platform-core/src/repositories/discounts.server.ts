import "server-only";

import { discountSchema, type Discount } from "@acme/types";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { validateShopName } from "../shops";
import { DATA_ROOT } from "../dataRoot";

function filePath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "discounts.json");
}

async function ensureDir(shop: string): Promise<void> {
  shop = validateShopName(shop);
  await fs.mkdir(path.join(DATA_ROOT, shop), { recursive: true });
}

export async function readDiscountRepo(shop: string): Promise<Discount[]> {
  try {
    const buf = await fs.readFile(filePath(shop), "utf8");
    return discountSchema.array().parse(JSON.parse(buf));
  } catch {
    return [];
  }
}

export async function writeDiscountRepo(shop: string, discounts: Discount[]): Promise<void> {
  await ensureDir(shop);
  const tmp = `${filePath(shop)}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(discounts, null, 2), "utf8");
  await fs.rename(tmp, filePath(shop));
}

export async function getDiscountByCode(shop: string, code: string): Promise<Discount | null> {
  const discounts = await readDiscountRepo(shop);
  return discounts.find((d) => d.code.toLowerCase() === code.toLowerCase()) ?? null;
}
