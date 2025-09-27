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
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- DS-000 path uses validated shop and trusted base
  await fs.mkdir(path.join(DATA_ROOT, shop), { recursive: true });
}

async function read(shop: string): Promise<Coupon[]> {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- DS-000 file path built from validated shop and constant filename
    const buf = await fs.readFile(filePath(shop), "utf8");
    try {
      return couponSchema.array().parse(JSON.parse(buf));
    } catch {
      return [];
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw err;
  }
}

async function write(shop: string, coupons: Coupon[]): Promise<void> {
  await ensureDir(shop);
  const tmp = `${filePath(shop)}.${Date.now()}.tmp`;
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- DS-000 file path built from validated shop and constant filename
  await fs.writeFile(tmp, JSON.stringify(coupons, null, 2), "utf8");
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- DS-000 file path built from validated shop and constant filename
  await fs.rename(tmp, filePath(shop));
}

async function getByCode(shop: string, code: string): Promise<Coupon | null> {
  const coupons = await read(shop);
  return coupons.find((c) => c.code.toLowerCase() === code.toLowerCase()) ?? null;
}

export interface CouponsRepository {
  read(shop: string): Promise<Coupon[]>;
  write(shop: string, coupons: Coupon[]): Promise<void>;
  getByCode(shop: string, code: string): Promise<Coupon | null>;
}

export const jsonCouponsRepository: CouponsRepository = {
  read,
  write,
  getByCode,
};
