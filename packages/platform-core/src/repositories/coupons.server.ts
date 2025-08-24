import "server-only";

import { couponSchema, type Coupon } from "@acme/types";
import { promises as fs } from "fs";
import * as path from "path";
import { validateShopName } from "../shops/index";
import { DATA_ROOT } from "../dataRoot";

function filePath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "coupons.json");
}

async function ensureDir(shop: string): Promise<void> {
  shop = validateShopName(shop);
  await fs.mkdir(path.join(DATA_ROOT, shop), { recursive: true });
}

export async function readCouponRepo(shop: string): Promise<Coupon[]> {
  try {
    const buf = await fs.readFile(filePath(shop), "utf8");
    return couponSchema.array().parse(JSON.parse(buf));
  } catch {
    return [];
  }
}

export async function writeCouponRepo(shop: string, coupons: Coupon[]): Promise<void> {
  await ensureDir(shop);
  const tmp = `${filePath(shop)}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(coupons, null, 2), "utf8");
  await fs.rename(tmp, filePath(shop));
}

export async function getCouponByCode(shop: string, code: string): Promise<Coupon | null> {
  const coupons = await readCouponRepo(shop);
  return coupons.find((c) => c.code.toLowerCase() === code.toLowerCase()) ?? null;
}
