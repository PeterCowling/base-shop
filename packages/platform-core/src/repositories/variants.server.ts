import "server-only";

import { promises as fs } from "fs";
import * as path from "path";

import { DATA_ROOT } from "../dataRoot";
import { validateShopName } from "../shops";
import { type VariantPricing,variantPricingSchema } from "../types/variants";

const VARIANTS_FILENAME = "variants.json";

function variantsPath(shop: string): string {
  const safeShop = validateShopName(shop);
  return path.join(DATA_ROOT, safeShop, VARIANTS_FILENAME);
}

async function ensureDir(shop: string): Promise<void> {
  const safeShop = validateShopName(shop);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- variants path uses validated shop id and trusted base
  await fs.mkdir(path.join(DATA_ROOT, safeShop), { recursive: true });
}

export async function readVariants(shop: string): Promise<VariantPricing[]> {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- variants path uses validated shop id and trusted base
    const buf = await fs.readFile(variantsPath(shop), "utf8");
    const parsed = JSON.parse(buf) as unknown;
    const arr = Array.isArray(parsed) ? parsed : [];
    return arr.map((item) => variantPricingSchema.parse(item));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

export async function writeVariants(shop: string, variants: VariantPricing[]): Promise<void> {
  const safeShop = validateShopName(shop);
  const validated = variants.map((v) => variantPricingSchema.parse(v));
  await ensureDir(safeShop);
  const json = JSON.stringify(validated, null, 2);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- variants path uses validated shop id and trusted base
  await fs.writeFile(variantsPath(safeShop), json, "utf8");
}
