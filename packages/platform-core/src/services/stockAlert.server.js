"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAndAlert = checkAndAlert;
require("server-only");
const core_1 = require("@acme/config/env/core");
const emailService_1 = require("./emailService");
const zod_1 = require("zod");
const inventory_server_1 = require("../repositories/inventory.server");
const settings_server_1 = require("../repositories/settings.server");
const safeFs_1 = require("../utils/safeFs");
const coreEnv = (0, core_1.loadCoreEnv)();
const LOG_FILE = "stock-alert-log.json";
const SUPPRESS_HOURS = 24; // suppress repeat alerts for a day
const logSchema = zod_1.z.record(zod_1.z.string(), zod_1.z.number());
async function readLog(shop) {
    try {
        const buf = (await (0, safeFs_1.readFromShop)(shop, LOG_FILE, "utf8"));
        const parsed = logSchema.safeParse(JSON.parse(buf));
        return parsed.success ? parsed.data : {};
    }
    catch {
        return {};
    }
}
async function writeLog(shop, log) {
    await (0, safeFs_1.ensureShopDir)(shop);
    await (0, safeFs_1.writeToShop)(shop, LOG_FILE, JSON.stringify(log, null, 2), "utf8");
}
async function checkAndAlert(shop, items, email = (0, emailService_1.getEmailService)()) {
    const settings = await (0, settings_server_1.getShopSettings)(shop);
    const envRecipients = (process.env.STOCK_ALERT_RECIPIENTS || coreEnv.STOCK_ALERT_RECIPIENTS) ??
        (process.env.STOCK_ALERT_RECIPIENT || coreEnv.STOCK_ALERT_RECIPIENT) ??
        "";
    const recipients = settings.stockAlert?.recipients?.length
        ? settings.stockAlert.recipients
        : envRecipients.split(",").map((r) => r.trim()).filter(Boolean);
    const webhook = settings.stockAlert?.webhook ??
        (process.env.STOCK_ALERT_WEBHOOK || coreEnv.STOCK_ALERT_WEBHOOK);
    const defaultThreshold = settings.stockAlert?.threshold ??
        (typeof process.env.STOCK_ALERT_DEFAULT_THRESHOLD === "string"
            ? Number(process.env.STOCK_ALERT_DEFAULT_THRESHOLD)
            : coreEnv.STOCK_ALERT_DEFAULT_THRESHOLD);
    if (recipients.length === 0 && !webhook)
        return [];
    const log = await readLog(shop);
    const now = Date.now();
    const suppressBefore = now - SUPPRESS_HOURS * 60 * 60 * 1000;
    const lowItems = items
        .filter((i) => {
        const threshold = typeof i.lowStockThreshold === "number"
            ? i.lowStockThreshold
            : defaultThreshold;
        return typeof threshold === "number" && i.quantity <= threshold;
    })
        .filter((i) => {
        const key = (0, inventory_server_1.variantKey)(i.sku, i.variantAttributes);
        const last = log[key];
        return !last || last < suppressBefore;
    });
    if (lowItems.length === 0)
        return [];
    const lines = lowItems.map((i) => {
        const attrs = Object.entries(i.variantAttributes)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ");
        const variant = attrs ? ` (${attrs})` : "";
        const threshold = i.lowStockThreshold ?? defaultThreshold;
        return `${i.sku}${variant} – qty ${i.quantity} (threshold ${threshold})`;
    });
    const body = `The following items in shop ${shop} are low on stock:\n${lines.join("\n")}`;
    const subject = `Low stock alert for ${shop}`;
    for (const r of recipients) {
        try {
            await email.sendEmail(r, subject, body);
        }
        catch (err) {
            console.error("Failed to send stock alert", err); // i18n-exempt -- CORE-1011 non-UX log message
        }
    }
    if (webhook) {
        try {
            await fetch(webhook, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ shop, items: lowItems, subject, body }),
            });
        }
        catch (err) {
            console.error("Failed to send stock alert webhook", err); // i18n-exempt -- CORE-1011 non-UX log message
        }
    }
    for (const item of lowItems) {
        log[(0, inventory_server_1.variantKey)(item.sku, item.variantAttributes)] = now;
    }
    await writeLog(shop, log);
    return lowItems;
}
