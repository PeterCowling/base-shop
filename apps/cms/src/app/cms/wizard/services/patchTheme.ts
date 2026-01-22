// apps/cms/src/app/cms/wizard/services/patchTheme.ts
"use client";

export async function patchShopTheme(
  shopId: string,
  data: {
    themeId?: string;
    themeOverrides?: Record<string, string>;
    themeDefaults?: Record<string, string>;
  },
) {
  await fetch(`/cms/api/shops/${shopId}/theme`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
