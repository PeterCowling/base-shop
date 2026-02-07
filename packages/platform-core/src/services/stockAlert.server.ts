import "server-only";

import { z } from "zod";

import { loadCoreEnv } from "@acme/config/env/core";

import { variantKey } from "../repositories/inventory.server";
import { getShopSettings } from "../repositories/settings.server";
import type { InventoryItem } from "../types/inventory";
import { ensureShopDir, readFromShop, writeToShop } from "../utils/safeFs";
import { safeWebhookFetch } from "../utils/safeWebhook";

import { type EmailService, getEmailService } from "./emailService";


const coreEnv = loadCoreEnv();
const LOG_FILE = "stock-alert-log.json";
const SUPPRESS_HOURS = 24; // suppress repeat alerts for a day
const logSchema = z.record(z.string(), z.number());

async function readLog(shop: string): Promise<Record<string, number>> {
  try {
    const buf = (await readFromShop(shop, LOG_FILE, "utf8")) as string;
    const parsed = logSchema.safeParse(JSON.parse(buf));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

async function writeLog(shop: string, log: Record<string, number>): Promise<void> {
  await ensureShopDir(shop);
  await writeToShop(shop, LOG_FILE, JSON.stringify(log, null, 2), "utf8");
}

export async function checkAndAlert(
  shop: string,
  items: InventoryItem[],
  email: EmailService = getEmailService(),
): Promise<InventoryItem[]> {
  const settings = await getShopSettings(shop);
  const envRecipients =
    (process.env.STOCK_ALERT_RECIPIENTS || coreEnv.STOCK_ALERT_RECIPIENTS) ??
    (process.env.STOCK_ALERT_RECIPIENT || coreEnv.STOCK_ALERT_RECIPIENT) ??
    "";
  const recipients = settings.stockAlert?.recipients?.length
    ? settings.stockAlert.recipients
    : envRecipients.split(",").map((r: string) => r.trim()).filter(Boolean);
  const webhook =
    (settings.stockAlert?.webhook as string | undefined) ??
    (process.env.STOCK_ALERT_WEBHOOK || coreEnv.STOCK_ALERT_WEBHOOK);
  const defaultThreshold =
    settings.stockAlert?.threshold ??
    (typeof process.env.STOCK_ALERT_DEFAULT_THRESHOLD === "string"
      ? Number(process.env.STOCK_ALERT_DEFAULT_THRESHOLD)
      : coreEnv.STOCK_ALERT_DEFAULT_THRESHOLD);

  if (recipients.length === 0 && !webhook) return [];

  const log = await readLog(shop);
  const now = Date.now();
  const suppressBefore = now - SUPPRESS_HOURS * 60 * 60 * 1000;

  const lowItems = items
    .filter((i) => {
      const threshold =
        typeof i.lowStockThreshold === "number"
          ? i.lowStockThreshold
          : defaultThreshold;
      return typeof threshold === "number" && i.quantity <= threshold;
    })
    .filter((i) => {
      const key = variantKey(i.sku, i.variantAttributes);
      const last = log[key];
      return !last || last < suppressBefore;
    });

  if (lowItems.length === 0) return [];

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
    } catch (err) {
      console.error("Failed to send stock alert", err); // i18n-exempt -- CORE-1011 non-UX log message
    }
  }

  if (webhook) {
    const result = await safeWebhookFetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ shop, items: lowItems, subject, body }),
      timeout: 5000,
      retries: 2,
    });
    if (!result.ok) {
      console.error("Failed to send stock alert webhook:", result.error); // i18n-exempt -- CORE-1011 non-UX log message
    }
  }

  for (const item of lowItems) {
    log[variantKey(item.sku, item.variantAttributes)] = now;
  }
  await writeLog(shop, log);
  return lowItems;
}
