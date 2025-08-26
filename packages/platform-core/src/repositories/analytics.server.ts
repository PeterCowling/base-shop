import { promises as fs } from "fs";
import * as path from "path";
import { DATA_ROOT } from "../dataRoot";
import { validateShopName } from "../shops";
import type { AnalyticsAggregates } from "../analytics";

/**
 * Read analytics events for a shop.  When no shop is provided events for all
 * shops are returned.
 */
export async function listEvents(shop?: string) {
  const shops: string[] = [];
  if (shop) {
    shops.push(validateShopName(shop));
  } else {
    try {
      const entries = await fs.readdir(DATA_ROOT, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) shops.push(entry.name);
      }
    } catch {
      return [] as any[];
    }
  }

  const events: any[] = [];
  for (const s of shops) {
    const file = path.join(DATA_ROOT, validateShopName(s), "analytics.jsonl");
    try {
      const buf = await fs.readFile(file, "utf8");
      for (const line of buf.split(/\r?\n/)) {
        if (!line.trim()) continue;
        try {
          events.push(JSON.parse(line));
        } catch {
          // ignore malformed lines
        }
      }
    } catch {
      // ignore missing files
    }
  }
  return events;
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
