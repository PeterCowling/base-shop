import "server-only";

// Import from "fs" so test mocks can intercept the calls. Using the
// "node:"-prefixed path bypasses Jest's module mocking which caused the tests
// to hit the real filesystem and fail.
import { promises as fs } from "fs";
import * as path from "path";

import { shopSchema, type Shop } from "@acme/types";
import { prisma } from "../db";
import { validateShopName } from "../shops/index";

import { DATA_ROOT } from "../dataRoot";

function shopPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "shop.json");
}

async function ensureDir(shop: string): Promise<void> {
  shop = validateShopName(shop);
  await fs.mkdir(path.join(DATA_ROOT, shop), { recursive: true });
}

export async function getShopById<T extends Shop>(
  shop: string
): Promise<T> {
  try {
    const rec = await prisma.shop.findUnique({ where: { id: shop } });
    if (rec) {
      // Apply schema defaults when returning data from the database.
      const parsed = shopSchema.parse(rec.data);
      return parsed as T;
    }
  } catch {
    // ignore DB errors and fall back
  }
  try {
    const buf = await fs.readFile(shopPath(shop), "utf8");
    const data = JSON.parse(buf);
    // Apply schema defaults when reading from the filesystem.
    const parsed = shopSchema.parse(data);
    return parsed as T;
  } catch {
    throw new Error(`Shop ${shop} not found`);
  }
}

export async function updateShopInRepo<T extends Shop>(
  shop: string,
  patch: Partial<T> & { id: string }
): Promise<T> {
  const current = await getShopById<T>(shop);
  if (current.id !== patch.id) {
    throw new Error(`Shop ${patch.id} not found in ${shop}`);
  }
  // Merge the existing shop with the patch and apply schema defaults so that
  // callers always receive a fully-populated object.
  const updated = shopSchema.parse({ ...current, ...patch }) as T;
  try {
    await prisma.shop.upsert({
      where: { id: shop },
      create: { id: shop, data: updated },
      update: { data: updated },
    });
    return updated;
  } catch {
    // fall back to filesystem persistence
  }
  await ensureDir(shop);
  const tmp = `${shopPath(shop)}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(updated, null, 2), "utf8");
  await fs.rename(tmp, shopPath(shop));
  return updated;
}
