"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAnalyticsEvent = void 0;
exports.trackEvent = trackEvent;
exports.trackPageView = trackPageView;
exports.trackOrder = trackOrder;
exports.trackTryOnStarted = trackTryOnStarted;
exports.trackTryOnPreviewShown = trackTryOnPreviewShown;
exports.trackTryOnEnhanced = trackTryOnEnhanced;
exports.trackTryOnAddToCart = trackTryOnAddToCart;
exports.trackTryOnError = trackTryOnError;
const core_1 = require("@acme/config/env/core");
const date_utils_1 = require("@acme/date-utils");
const fs_1 = require("fs");
const path = __importStar(require("path"));
require("server-only");
const dataRoot_1 = require("../dataRoot");
const shops_server_1 = require("../repositories/shops.server");
const shops_1 = require("../shops");
let _coreEnv = null;
function getCoreEnv() {
    if (_coreEnv)
        return _coreEnv;
    try {
        _coreEnv = (0, core_1.loadCoreEnv)();
    }
    catch {
        _coreEnv = {};
    }
    return _coreEnv;
}
var client_1 = require("./client");
Object.defineProperty(exports, "logAnalyticsEvent", { enumerable: true, get: function () { return client_1.logAnalyticsEvent; } });
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
        const shop = (0, shops_1.validateShopName)(this.shop);
        return path.join((0, dataRoot_1.resolveDataRoot)(), shop, "analytics.jsonl");
    }
    async track(event) {
        const fp = this.filePath();
        // `fp` is generated from a validated shop name and data root.
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- CORE-2410: safe path from validated shop and data root
        await fs_1.promises.mkdir(path.dirname(fp), { recursive: true });
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- CORE-2410: safe path from validated shop and data root
        await fs_1.promises.appendFile(fp, JSON.stringify(event) + "\n", "utf8");
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
        const { type, ...params } = event;
        delete params.timestamp;
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
    const shopInfo = await (0, shops_server_1.readShop)(shop);
    if (!shopInfo.analyticsEnabled) {
        const p = new NoopProvider();
        providerCache.set(shop, p);
        return p;
    }
    const settings = await (0, shops_server_1.getShopSettings)(shop);
    const analytics = settings.analytics;
    if (analytics &&
        (analytics.enabled === false || analytics.provider === "none")) {
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
        const apiSecret = (process.env.GA_API_SECRET ?? getCoreEnv().GA_API_SECRET);
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
async function trackEvent(shop, event) {
    const provider = await resolveProvider(shop);
    const withTs = { timestamp: (0, date_utils_1.nowIso)(), ...event };
    if (!(provider instanceof NoopProvider)) {
        await provider.track(withTs);
        await updateAggregates(shop, withTs);
    }
}
async function trackPageView(shop, page) {
    await trackEvent(shop, { type: "page_view", page });
}
async function trackOrder(shop, orderId, amount) {
    await trackEvent(shop, { type: "order", orderId, amount });
}
async function updateAggregates(shop, event) {
    const fp = path.join((0, dataRoot_1.resolveDataRoot)(), (0, shops_1.validateShopName)(shop), "analytics-aggregates.json");
    const day = event.timestamp.slice(0, 10);
    let agg = {
        page_view: {},
        order: {},
        discount_redeemed: {},
        ai_crawl: {},
    };
    try {
        // `fp` points to a file under the resolved data root for the shop.
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- CORE-2410: safe path from validated shop and data root
        const buf = await fs_1.promises.readFile(fp, "utf8");
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
    // Ensure the target directory exists before writing.
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CORE-2410: safe path from validated shop and data root
    await fs_1.promises.mkdir(path.dirname(fp), { recursive: true });
    const payload = JSON.stringify(agg ?? {}) ?? "{}";
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CORE-2410: safe path from validated shop and data root
    await fs_1.promises.writeFile(fp, payload, "utf8");
}
// Try-on helper events
async function trackTryOnStarted(shop, payload) {
    await trackEvent(shop, { type: 'TryOnStarted', ...payload });
}
async function trackTryOnPreviewShown(shop, payload) {
    await trackEvent(shop, { type: 'TryOnPreviewShown', ...payload });
}
async function trackTryOnEnhanced(shop, payload) {
    await trackEvent(shop, { type: 'TryOnEnhanced', ...payload });
}
async function trackTryOnAddToCart(shop, payload) {
    await trackEvent(shop, { type: 'TryOnAddToCart', ...payload });
}
async function trackTryOnError(shop, payload) {
    await trackEvent(shop, { type: 'TryOnError', ...payload });
}
