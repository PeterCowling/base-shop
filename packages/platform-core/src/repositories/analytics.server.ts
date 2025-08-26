import { promises as fs } from "fs";
import * as path from "path";
import { DATA_ROOT } from "../dataRoot";
import { validateShopName } from "../shops";
import type { AnalyticsAggregates } from "../analytics";

/**
 * Read analytics events from newline-delimited JSON files. When a shop is
 * provided only that shop's log is read, otherwise the logs for all shops are
 * concatenated. Missing files or invalid JSON lines are ignored so callers do
 * not need to handle errors.
 */
export async function listEvents(_shop?: string) {
  const shops = _shop
    ? [validateShopName(_shop)]
    : await fs
        .readdir(DATA_ROOT, { withFileTypes: true })
        .then((entries) =>
          entries.filter((e) => e.isDirectory()).map((e) => e.name)
        )
        .catch(() => []);

  const events: any[] = [];
  for (const shop of shops) {
    const file = path.join(DATA_ROOT, shop, "analytics.jsonl");
    let data = "";
    try {
      data = await fs.readFile(file, "utf8");
    } catch {
      continue;
    }
    for (const line of data.split(/\n+/)) {
      const trimmed = line.trim();
      if (!trimmed)
        continue;
      try {
        events.push(JSON.parse(trimmed));
      } catch {
        // ignore malformed lines
      }
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
