import "server-only";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { nowIso } from "@shared/date";
import { DATA_ROOT } from "./dataRoot";
import { validateShopName } from "./shops";
import { getShopSettings, readShop } from "./repositories/shops.server";

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
  constructor(
    private measurementId: string,
    private apiSecret: string,
  ) {}

  async track(event: AnalyticsEvent): Promise<void> {
    const url =
      "https://www.google-analytics.com/mp/collect?measurement_id=" +
      this.measurementId +
      "&api_secret=" +
      this.apiSecret;
    const payload = {
      client_id: "base-shop", // simple anonymous id
      events: [{ name: event.type, params: event }],
    };
    await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
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
    const p = new GoogleAnalyticsProvider(
      analytics.measurementId,
      analytics.apiSecret,
    );
    providerCache.set(shop, p);
    return p;
  }
  const p = new FileProvider(shop);
  providerCache.set(shop, p);
  return p;
}

interface AggregateRecord {
  count: number;
  total?: number;
}

async function updateAggregates(
  shop: string,
  event: AnalyticsEvent,
): Promise<void> {
  const shopName = validateShopName(shop);
  const fp = path.join(DATA_ROOT, shopName, "analytics-aggregates.json");
  let data: Record<string, AggregateRecord> = {};
  try {
    const raw = await fs.readFile(fp, "utf8");
    data = JSON.parse(raw) as Record<string, AggregateRecord>;
  } catch {
    // ignore
  }
  const current = data[event.type] || { count: 0 };
  current.count += 1;
  const amt = (event as { amount?: number }).amount;
  if (typeof amt === "number") {
    current.total = (current.total || 0) + amt;
  }
  data[event.type] = current;
  await fs.mkdir(path.dirname(fp), { recursive: true });
  await fs.writeFile(fp, JSON.stringify(data, null, 2), "utf8");
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

