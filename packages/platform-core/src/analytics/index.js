import "server-only";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { nowIso } from "@acme/date-utils";
import { DATA_ROOT } from "../dataRoot";
import { validateShopName } from "../shops";
import { getShopSettings, readShop } from "../repositories/shops.server";
import { coreEnv } from "@acme/config/env/core";
class NoopProvider {
    async track(_event) { }
}
class ConsoleProvider {
    async track(event) {
         
        console.log("analytics", event);
    }
}
class FileProvider {
    shop;
    constructor(shop) {
        this.shop = shop;
    }
    filePath() {
        const shop = validateShopName(this.shop);
        return path.join(DATA_ROOT, shop, "analytics.jsonl");
    }
    async track(event) {
        const fp = this.filePath();
        await fs.mkdir(path.dirname(fp), { recursive: true });
        await fs.appendFile(fp, JSON.stringify(event) + "\n", "utf8");
    }
}
class GoogleAnalyticsProvider {
    measurementId;
    apiSecret;
    constructor(measurementId, apiSecret) {
        this.measurementId = measurementId;
        this.apiSecret = apiSecret;
    }
    async track(event) {
        const { type, timestamp, ...params } = event;
        const url = "https://www.google-analytics.com/mp/collect?measurement_id=" +
            encodeURIComponent(this.measurementId) +
            "&api_secret=" +
            encodeURIComponent(this.apiSecret);
        const body = {
            client_id: event.clientId || "555",
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
        }
        catch {
            // ignore network errors
        }
    }
}
const providerCache = new Map();
async function resolveProvider(shop) {
    if (providerCache.has(shop))
        return providerCache.get(shop);
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
        const apiSecret = process.env.GA_API_SECRET || coreEnv.GA_API_SECRET;
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
export async function trackEvent(shop, event) {
    const provider = await resolveProvider(shop);
    const withTs = { timestamp: nowIso(), ...event };
    await provider.track(withTs);
    await updateAggregates(shop, withTs);
}
export async function trackPageView(shop, page) {
    await trackEvent(shop, { type: "page_view", page });
}
export async function trackOrder(shop, orderId, amount) {
    await trackEvent(shop, { type: "order", orderId, amount });
}
async function updateAggregates(shop, event) {
    const fp = path.join(DATA_ROOT, validateShopName(shop), "analytics-aggregates.json");
    const day = event.timestamp.slice(0, 10);
    let agg = {
        page_view: {},
        order: {},
        discount_redeemed: {},
        ai_crawl: {},
    };
    try {
        const buf = await fs.readFile(fp, "utf8");
        agg = JSON.parse(buf);
    }
    catch {
        // ignore
    }
    if (event.type === "page_view") {
        agg.page_view[day] = (agg.page_view[day] || 0) + 1;
    }
    else if (event.type === "order") {
        const amount = typeof event.amount === "number" ? event.amount : 0;
        const entry = agg.order[day] || { count: 0, amount: 0 };
        entry.count += 1;
        entry.amount += amount;
        agg.order[day] = entry;
    }
    else if (event.type === "discount_redeemed") {
        const code = event.code;
        if (code) {
            const entry = agg.discount_redeemed[day] || {};
            entry[code] = (entry[code] || 0) + 1;
            agg.discount_redeemed[day] = entry;
        }
    }
    else if (event.type === "ai_crawl") {
        agg.ai_crawl[day] = (agg.ai_crawl[day] || 0) + 1;
    }
    await fs.mkdir(path.dirname(fp), { recursive: true });
    await fs.writeFile(fp, JSON.stringify(agg), "utf8");
}
