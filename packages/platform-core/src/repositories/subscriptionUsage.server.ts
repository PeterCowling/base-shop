// packages/platform-core/src/repositories/subscriptionUsage.server.ts
import "server-only";

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { validateShopName } from "../shops";
import { DATA_ROOT } from "../dataRoot";

const FILE_NAME = "subscription-usage.json";

function filePath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, FILE_NAME);
}

async function ensureDir(shop: string): Promise<void> {
  shop = validateShopName(shop);
  await fs.mkdir(path.join(DATA_ROOT, shop), { recursive: true });
}

async function readUsageRepo(shop: string): Promise<Record<string, number>> {
  try {
    const buf = await fs.readFile(filePath(shop), "utf8");
    return JSON.parse(buf) as Record<string, number>;
  } catch {
    return {};
  }
}

async function writeUsageRepo(shop: string, data: Record<string, number>): Promise<void> {
  await ensureDir(shop);
  const tmp = `${filePath(shop)}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, filePath(shop));
}

export async function getUsage(shop: string, customerId: string): Promise<number> {
  const repo = await readUsageRepo(shop);
  return repo[customerId] ?? 0;
}

export async function incrementUsage(
  shop: string,
  customerId: string,
  amount = 1,
): Promise<void> {
  const repo = await readUsageRepo(shop);
  repo[customerId] = (repo[customerId] ?? 0) + amount;
  await writeUsageRepo(shop, repo);
}

export async function resetUsage(shop: string, customerId: string): Promise<void> {
  const repo = await readUsageRepo(shop);
  delete repo[customerId];
  await writeUsageRepo(shop, repo);
}
