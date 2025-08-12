import "server-only";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { nowIso } from "@acme/date-utils";
import { DATA_ROOT } from "./dataRoot";
import { validateShopName } from "./shops";
import { getShopSettings, readShop } from "./repositories/shops.server";
import { env } from "@acme/config";

export interface AnalyticsEvent {
  type: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface AnalyticsProvider {
  track(event: AnalyticsEvent): Promise<void> | void;
}

class NoopProvider implements AnalyticsProvider {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async track(_event: AnalyticsEvent): Promise<void> {}
}

class ConsoleProvider implements AnalyticsProvider {
  async track(event: AnalyticsEvent): Promise<void> {
    // eslint-disable-next-line no-console
    console.log("analytics", event);
  }
}

class FileProvider implements AnalyticsProvider {
  constructor(private shop: string) {}

  private filePath(): string {
    const shop = validateShopName(this.shop);
    return path.join(DATA_ROOT, shop, "analytics.jsonl");
  }

  async track(event: AnalyticsEvent): Promise<void> {
    const fp = this.filePath();
    await fs.mkdir(path.dirname(fp), { recursive: true });
    await fs.appendFile(fp, JSON.stringify(event) + "\n", "utf8");
  }
}

class GoogleAnalyticsProvider implements AnalyticsProvider {
  constructor(private measurementId: string, private apiSecret: string) {}

  async track(event: AnalyticsEvent): Promise<void> {
    const { type, timestamp, ...params } = event;
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
  if (!analytics || analytics.enabled === false || analytics.provider === "none") {
    const p = new NoopProvider();
    providerCache.set(shop, p);
    return p;
  }
  if (analytics.provider === "console") {
    const p = new ConsoleProvider();
    providerCache.set(shop, p);
    return p;
  }
  if (analytics.provider === "ga") {
    const measurementId = analytics.id;
    const apiSecret = env.GA_API_SECRET;
    if (measurementId && apiSecret) {
      const p = new GoogleAnalyticsProvider(measurementId, apiSecret);
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
  await provider.track(withTs);
  await updateAggregates(shop, withTs);
}

export async function trackPageView(
  shop: string,
  page: string
): Promise<void> {
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
  discount_redeemed: Record<string, number>;
}

async function updateAggregates(
  shop: string,
  event: AnalyticsEvent
): Promise<void> {
  const fp = path.join(DATA_ROOT, validateShopName(shop), "analytics-aggregates.json");
  const day = (event.timestamp as string).slice(0, 10);
  let agg: Aggregates = { page_view: {}, order: {}, discount_redeemed: {} };
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
    agg.discount_redeemed[day] = (agg.discount_redeemed[day] || 0) + 1;
  }
  await fs.mkdir(path.dirname(fp), { recursive: true });
  await fs.writeFile(fp, JSON.stringify(agg), "utf8");
}

export type AnalyticsAggregates = Aggregates;

