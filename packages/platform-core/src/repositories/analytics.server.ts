import "server-only";

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { validateShopName } from "../shops/index.js";
import { DATA_ROOT } from "../dataRoot.js";
import type { AnalyticsEvent, AnalyticsAggregates } from "../analytics/index.js";

function analyticsPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "analytics.jsonl");
}

function aggregatesPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "analytics-aggregates.json");
}

export async function listEvents(shop: string): Promise<AnalyticsEvent[]> {
  try {
    const buf = await fs.readFile(analyticsPath(shop), "utf8");
    return buf
      .trim()
      .split(/\n+/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as AnalyticsEvent);
  } catch {
    return [];
  }
}

export async function readAggregates(
  shop: string
): Promise<AnalyticsAggregates> {
  try {
    const buf = await fs.readFile(aggregatesPath(shop), "utf8");
    return JSON.parse(buf) as AnalyticsAggregates;
  } catch {
    return { page_view: {}, order: {}, discount_redeemed: {}, ai_crawl: {} };
  }
}

