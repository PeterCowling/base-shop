"use client";

import { Buffer } from "buffer";
import { validateShopName } from "@acme/platform-core/shops";

export interface InitResult {
  ok: boolean;
  error?: string;
}

export async function initShop(
  shopId: string,
  csvFile?: File,
  categoriesText?: string
): Promise<InitResult> {
  try {
    validateShopName(shopId);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  try {
    let csv: string | undefined;
    if (csvFile) {
      const buf = Buffer.from(await csvFile.arrayBuffer());
      csv = buf.toString("base64");
    }
    const categories = categoriesText
      ?.split(/[\n,]+/)
      .map((c) => c.trim())
      .filter(Boolean);

    const res = await fetch("/cms/api/configurator/init-shop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: shopId, csv, categories }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      // i18n-exempt: generic network/validation fallback; UI displays as-is
      throw new Error(json.error ?? "Failed to save data");
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      // i18n-exempt: fallback error when exception lacks message
      error: err instanceof Error ? err.message : "Failed to save data",
    };
  }
}
