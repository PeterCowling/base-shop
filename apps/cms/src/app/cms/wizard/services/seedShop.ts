// apps/cms/src/app/cms/wizard/services/seedShop.ts
"use client";

import { validateShopName } from "@platform-core/src/shops";

export interface SeedResult {
  ok: boolean;
  error?: string;
}

export async function seedShop(
  shopId: string,
  csvFile?: File,
  categoriesText?: string
): Promise<SeedResult> {
  try {
    validateShopName(shopId);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  try {
    if (csvFile) {
      const fd = new FormData();
      fd.append("file", csvFile);
      const res = await fetch(`/cms/api/upload-csv/${shopId}`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Failed to save data");
      }
    }

    if (categoriesText && categoriesText.trim()) {
      const cats = categoriesText
        .split(/[\n,]+/)
        .map((c) => c.trim())
        .filter(Boolean);
      const res = await fetch(`/cms/api/categories/${shopId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cats),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Failed to save data");
      }
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to save data",
    };
  }
}

