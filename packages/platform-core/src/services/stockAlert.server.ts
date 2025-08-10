import "server-only";

import { sendEmail } from "@lib/email";
import { env } from "@config/src/env";
import type { InventoryItem } from "@types";

export async function checkAndAlert(
  shop: string,
  items: InventoryItem[],
): Promise<void> {
  const recipient = env.STOCK_ALERT_RECIPIENT;
  if (!recipient) return;
  for (const item of items) {
    if (
      typeof item.lowStockThreshold === "number" &&
      item.quantity <= item.lowStockThreshold
    ) {
      await sendEmail(
        recipient,
        `[${shop}] Low stock for ${item.sku}`,
        `Item ${item.sku} has quantity ${item.quantity} (threshold ${item.lowStockThreshold}).`,
      );
    }
  }
}
