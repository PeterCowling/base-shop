import "server-only";

import { promises as fs } from "node:fs";
import * as path from "node:path";

import { couponSchema, type Coupon } from "@types";
import { validateShopName } from "../shops";
import { DATA_ROOT } from "../dataRoot";

function filePath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "coupons.json");
}

async function readRepo<T = Coupon>(shop: string): Promise<T[]> {
  try {
    const buf = await fs.readFile(filePath(shop), "utf8");
    return JSON.parse(buf) as T[];
  } catch {
    return [] as T[];
  }
}

export async function getCouponByCode<T extends Coupon = Coupon>(
  shop: string,
  code: string
): Promise<T | null> {
  const coupons = await readRepo<T>(shop);
  const coupon = coupons.find(
    (c) => c.code.toLowerCase() === code.toLowerCase()
  );
  if (!coupon) return null;
  return couponSchema.parse(coupon) as unknown as T;
}
