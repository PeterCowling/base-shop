import "server-only";

import { env } from "@config/src/env";
import { sendEmail } from "@lib/email";
import type { InventoryItem } from "@types";

export async function checkAndAlert(
  shop: string,
  items: InventoryItem[],
): Promise<void> {
  const recipient = env.STOCK_ALERT_RECIPIENT;
  if (!recipient) return;

  const lowItems = items.filter(
    (i) =>
      typeof i.lowStockThreshold === "number" &&
      i.quantity <= i.lowStockThreshold,
  );
  if (lowItems.length === 0) return;

  const lines = lowItems.map(
    (i) => `${i.sku} – qty ${i.quantity} (threshold ${i.lowStockThreshold})`,
  );
  const body = `The following items in shop ${shop} are low on stock:\n${lines.join(
    "\n",
  )}`;
  const subject = `Low stock alert for ${shop}`;

  try {
    await sendEmail(recipient, subject, body);
  } catch (err) {
    console.error("Failed to send stock alert", err);
  }
}
