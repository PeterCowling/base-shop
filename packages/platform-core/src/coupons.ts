// packages/platform-core/src/coupons.ts
import { promises as fs } from "fs";
import * as path from "path";
import type { Coupon } from "@acme/types";
import { resolveDataRoot } from "./dataRoot";
import { validateShopName } from "./shops";

/** Internal helper to compute the JSON file path for a shop. */
function fileFor(shop: string): string {
  shop = validateShopName(shop);
  return path.join(resolveDataRoot(), shop, "discounts.json");
}

export type StoredCoupon = Coupon & { active?: boolean };

/**
 * Read all coupons for a shop from disk.
 */
export async function listCoupons(shop: string): Promise<StoredCoupon[]> {
  try {
    const buf = await fs.readFile(fileFor(shop), "utf8");
    const parsed = JSON.parse(buf) as StoredCoupon[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Persist coupon definitions for a shop. */
export async function saveCoupons(
  shop: string,
  coupons: StoredCoupon[],
): Promise<void> {
  const fp = fileFor(shop);
  await fs.mkdir(path.dirname(fp), { recursive: true });
  await fs.writeFile(fp, JSON.stringify(coupons, null, 2), "utf8");
}

/**
 * Lookup a coupon by code (case-insensitive) for the given shop.
 */
export async function findCoupon(
  shop: string,
  code: string | undefined | null,
): Promise<StoredCoupon | undefined> {
  if (!code) return undefined;
  const coupons = await listCoupons(shop);
  return coupons.find(
    (c) => c.active !== false && c.code.toLowerCase() === code.toLowerCase(),
  );
}
