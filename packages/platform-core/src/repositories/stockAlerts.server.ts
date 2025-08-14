import "server-only";

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { z } from "zod";
import { DATA_ROOT } from "../dataRoot";
import { validateShopName } from "../shops";

const configSchema = z
  .object({
    recipients: z.array(z.string().email()).default([]),
    webhook: z.string().url().optional(),
    threshold: z.number().int().nonnegative().optional(),
  })
  .strict();

export type StockAlertConfig = z.infer<typeof configSchema>;

function configPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "stock-alert-config.json");
}

export async function getStockAlertConfig(
  shop: string,
): Promise<StockAlertConfig> {
  try {
    const buf = await fs.readFile(configPath(shop), "utf8");
    const parsed = configSchema.safeParse(JSON.parse(buf));
    if (parsed.success) return parsed.data;
  } catch {
    // ignore
  }
  return { recipients: [] };
}

export async function saveStockAlertConfig(
  shop: string,
  config: StockAlertConfig,
): Promise<void> {
  shop = validateShopName(shop);
  await fs.mkdir(path.join(DATA_ROOT, shop), { recursive: true });
  const tmp = `${configPath(shop)}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(config, null, 2), "utf8");
  await fs.rename(tmp, configPath(shop));
}
