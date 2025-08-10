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

