import "server-only";

import { env } from "@config/src/env";
import { DATA_ROOT } from "../dataRoot";
import { sendEmail } from "@lib/email";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import type { InventoryItem } from "@types";

const LOG_FILE = "stock-alert-log.json";
const SUPPRESS_HOURS = 24; // suppress repeat alerts for a day

async function readLog(shop: string): Promise<Record<string, number>> {
  try {
    const p = path.join(DATA_ROOT, shop, LOG_FILE);
    const buf = await fs.readFile(p, "utf8");
    return JSON.parse(buf) as Record<string, number>;
  } catch {
    return {};
  }
}

async function writeLog(shop: string, log: Record<string, number>): Promise<void> {
  const p = path.join(DATA_ROOT, shop, LOG_FILE);
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(log, null, 2), "utf8");
}

export async function checkAndAlert(
  shop: string,
  items: InventoryItem[],
): Promise<void> {
  const recipientRaw = env.STOCK_ALERT_RECIPIENTS ?? env.STOCK_ALERT_RECIPIENT;
  const webhook = env.STOCK_ALERT_WEBHOOK;
  if (!recipientRaw && !webhook) return;

  const recipients = recipientRaw
    ? recipientRaw.split(",").map((r) => r.trim()).filter(Boolean)
    : [];

  const log = await readLog(shop);
  const now = Date.now();
  const suppressBefore = now - SUPPRESS_HOURS * 60 * 60 * 1000;

  const lowItems = items
    .filter((i) => {
      const threshold =
        typeof i.lowStockThreshold === "number"
          ? i.lowStockThreshold
          : env.STOCK_ALERT_DEFAULT_THRESHOLD;
      return typeof threshold === "number" && i.quantity <= threshold;
    })
    .filter((i) => {
      const last = log[i.sku];
      return !last || last < suppressBefore;
    });

  if (lowItems.length === 0) return;

  const lines = lowItems.map((i) => {
    const attrs = Object.entries(i.variantAttributes)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    const variant = attrs ? ` (${attrs})` : "";
    const threshold =
      i.lowStockThreshold ?? env.STOCK_ALERT_DEFAULT_THRESHOLD;
    return `${i.sku}${variant} – qty ${i.quantity} (threshold ${threshold})`;
  });
  const body = `The following items in shop ${shop} are low on stock:\n${lines.join("\n")}`;
  const subject = `Low stock alert for ${shop}`;

  for (const r of recipients) {
    try {
      await sendEmail(r, subject, body);
    } catch (err) {
      console.error("Failed to send stock alert", err);
    }
  }

  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ shop, items: lowItems, subject, body }),
      });
    } catch (err) {
      console.error("Failed to send stock alert webhook", err);
    }
  }

  for (const item of lowItems) {
    log[item.sku] = now;
  }
  await writeLog(shop, log);
}
