import { loadCoreEnv } from "@acme/config/env/core";
import { nowIso } from "@acme/date-utils";
import type { AnalyticsEvent } from "@acme/types";
import { promises as fs } from "fs";
import * as path from "path";
import "server-only";
import { resolveDataRoot } from "../dataRoot";
import { getShopSettings, readShop } from "../repositories/shops.server";
import { validateShopName } from "../shops";


const coreEnv = loadCoreEnv();
export type { AnalyticsEvent };

export interface AnalyticsProvider {
  track(event: AnalyticsEvent): Promise<void> | void;
}

class NoopProvider implements AnalyticsProvider {
  async track(_event: AnalyticsEvent): Promise<void> {}
}

class ConsoleProvider implements AnalyticsProvider {
  async track(event: AnalyticsEvent): Promise<void> {
    console.log("analytics", event);
  }
}

class FileProvider implements AnalyticsProvider {
  constructor(private shop: string) {}

  private filePath(): string {
    const shop = validateShopName(this.shop);
    return path.join(resolveDataRoot(), shop, "analytics.jsonl");
  }

  async track(event: AnalyticsEvent): Promise<void> {
    const fp = this.filePath();
    await fs.mkdir(path.dirname(fp), { recursive: true });
    await fs.appendFile(fp, JSON.stringify(event) + "\n", "utf8");
  }
}

class GoogleAnalyticsProvider implements AnalyticsProvider {
  constructor(
    private measurementId: string,
    private apiSecret: string
  ) {}

  async track(event: AnalyticsEvent): Promise<void> {
    const { type, ...params } = event;
    delete (params as { timestamp?: string }).timestamp;
    const url =
      "https://www.google-analytics.com/mp/collect?measurement_id=" +
      encodeURIComponent(this.measurementId) +
      "&api_secret=" +
      encodeURIComponent(this.apiSecret);

    const body = {
      client_id: (event as { clientId?: string }).clientId || "555",
      events: [
        {
          name: type,
          params,
        },
      ],
    };

    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      // ignore network errors
    }
  }
}

const providerCache = new Map<string, AnalyticsProvider>();

async function resolveProvider(shop: string): Promise<AnalyticsProvider> {
  if (providerCache.has(shop)) return providerCache.get(shop)!;
  const shopInfo = await readShop(shop);
  if (!shopInfo.analyticsEnabled) {
    const p = new NoopProvider();
    providerCache.set(shop, p);
    return p;
  }
  const settings = await getShopSettings(shop);
  const analytics = settings.analytics;
  if (
    analytics &&
    (analytics.enabled === false || analytics.provider === "none")
  ) {
    const p = new NoopProvider();
    providerCache.set(shop, p);
    return p;
  }
  if (analytics?.provider === "console") {
    const p = new ConsoleProvider();
    providerCache.set(shop, p);
    return p;
  }
  if (analytics?.provider === "ga") {
    const measurementId = analytics.id;
    const apiSecret = (
      process.env.GA_API_SECRET ?? coreEnv.GA_API_SECRET
    ) as string | undefined;
    if (measurementId && apiSecret) {
      const p = new GoogleAnalyticsProvider(
        measurementId,
        apiSecret as string,
      );
      providerCache.set(shop, p);
      return p;
    }
  }
  const p = new FileProvider(shop);
  providerCache.set(shop, p);
  return p;
}

export async function trackEvent(
  shop: string,
  event: AnalyticsEvent
): Promise<void> {
  const provider = await resolveProvider(shop);
  const withTs = { timestamp: nowIso(), ...event };
  if (!(provider instanceof NoopProvider)) {
    await provider.track(withTs);
    await updateAggregates(shop, withTs);
  }
}

export async function trackPageView(shop: string, page: string): Promise<void> {
  await trackEvent(shop, { type: "page_view", page });
}

export async function trackOrder(
  shop: string,
  orderId: string,
  amount?: number
): Promise<void> {
  await trackEvent(shop, { type: "order", orderId, amount });
}

interface Aggregates {
  page_view: Record<string, number>;
  order: Record<string, { count: number; amount: number }>;
  discount_redeemed: Record<string, Record<string, number>>;
  ai_crawl: Record<string, number>;
}

async function updateAggregates(
  shop: string,
  event: AnalyticsEvent
): Promise<void> {
  const fp = path.join(
    resolveDataRoot(),
    validateShopName(shop),
    "analytics-aggregates.json"
  );
  const day = (event.timestamp as string).slice(0, 10);
  let agg: Aggregates = {
    page_view: {},
    order: {},
    discount_redeemed: {},
    ai_crawl: {},
  };
  try {
    const buf = await fs.readFile(fp, "utf8");
    agg = JSON.parse(buf) as Aggregates;
  } catch {
    // ignore
  }
  if (event.type === "page_view") {
    agg.page_view[day] = (agg.page_view[day] || 0) + 1;
  } else if (event.type === "order") {
    const amount = typeof event.amount === "number" ? event.amount : 0;
    const entry = agg.order[day] || { count: 0, amount: 0 };
    entry.count += 1;
    entry.amount += amount;
    agg.order[day] = entry;
  } else if (event.type === "discount_redeemed") {
    const code = event.code;
    if (code) {
      const entry = agg.discount_redeemed[day] || {};
      entry[code] = (entry[code] || 0) + 1;
      agg.discount_redeemed[day] = entry;
    }
  } else if (event.type === "ai_crawl") {
    agg.ai_crawl[day] = (agg.ai_crawl[day] || 0) + 1;
  }
  await fs.mkdir(path.dirname(fp), { recursive: true });
  const payload = JSON.stringify(agg ?? {}) ?? "{}";
  await fs.writeFile(fp, payload, "utf8");
}

export type AnalyticsAggregates = Aggregates;
