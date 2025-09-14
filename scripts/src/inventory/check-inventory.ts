import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";

import { prisma } from "@acme/platform-core/db";
import { variantKey } from "@acme/platform-core/types/inventory";

async function checkShop(shopId: string): Promise<boolean> {
  const filePath = join("data", "shops", shopId, "inventory.json");
  let json: any[];
  try {
    const raw = await readFile(filePath, "utf8");
    json = JSON.parse(raw) as any[];
  } catch (err) {
    console.error(`[${shopId}] failed to read inventory.json`);
    return false;
  }

  const jsonKeys = new Set<string>();
  for (const item of json) {
    const attrs = (item.variant || item.variantAttributes || {}) as Record<string, string>;
    const key = variantKey(item.sku, attrs);
    jsonKeys.add(`${item.sku}|${key}`);
  }

  const dbItems: Array<{ sku: string; variantKey: string }> =
    await prisma.inventoryItem.findMany({
      where: { shopId },
      select: { sku: true, variantKey: true },
    });

  const dbKeys = new Set<string>(
    dbItems.map((i) => `${i.sku}|${i.variantKey}`),
  );

  const missing = [...jsonKeys].filter((k) => !dbKeys.has(k));
  const extra = [...dbKeys].filter((k) => !jsonKeys.has(k));

  const jsonCount = json.length;
  const dbCount = dbItems.length;

  if (missing.length || extra.length || jsonCount !== dbCount) {
    console.log(
      `[${shopId}] mismatch: file=${jsonCount} db=${dbCount}`,
    );
    if (missing.length) console.log(`  missing in db: ${missing.join(", ")}`);
    if (extra.length) console.log(`  extra in db: ${extra.join(", ")}`);
    return false;
  }

  console.log(`[${shopId}] inventory matches (${jsonCount})`);
  return true;
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      shop: { type: "string" },
      "dry-run": { type: "boolean", default: false },
    },
  });

  const dryRun = values["dry-run"] ?? false;

  let shops: string[];
  if (values.shop) {
    shops = [values.shop as string];
  } else {
    const entries = await readdir(join("data", "shops"), { withFileTypes: true });
    shops = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  }

  let ok = true;
  for (const shop of shops) {
    const result = await checkShop(shop);
    if (!result) ok = false;
  }

  if (!ok && !dryRun) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
