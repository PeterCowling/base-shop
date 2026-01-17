// apps/cms/src/app/cms/wizard/services/patchTheme.ts
"use client";

export async function patchShopTheme(
  shopId: string,
  data: {
    themeOverrides: Record<string, string>;
    themeDefaults: Record<string, string>;
    themeId?: string;
  },
) {
  await fetch(`/cms/api/shops/${shopId}/theme`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
