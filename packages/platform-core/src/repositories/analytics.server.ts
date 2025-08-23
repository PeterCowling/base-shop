import { promises as fs } from "fs";
import * as path from "path";
import { DATA_ROOT } from "../dataRoot";
import { validateShopName } from "../shops";
import type { AnalyticsAggregates } from "../analytics";

export async function listEvents(_shop?: string) {
  return [] as any[];
}

export async function readAggregates(
  shop: string
): Promise<AnalyticsAggregates> {
  const file = path.join(
    DATA_ROOT,
    validateShopName(shop),
    "analytics-aggregates.json"
  );
  try {
    const buf = await fs.readFile(file, "utf8");
    return JSON.parse(buf) as AnalyticsAggregates;
  } catch {
    return {
      page_view: {},
      order: {},
      discount_redeemed: {},
      ai_crawl: {},
    };
  }
}
