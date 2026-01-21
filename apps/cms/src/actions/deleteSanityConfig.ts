// apps/cms/src/actions/deleteSanityConfig.ts
"use server";

import { getShopById, updateShopInRepo } from "@acme/platform-core/repositories/shop.server";
import { setSanityConfig } from "@acme/platform-core/shops";
import type { Shop } from "@acme/types";

import { ensureAuthorized } from "./common/auth";

export async function deleteSanityConfig(
  shopId: string,
): Promise<{ message?: string; error?: string }> {
  await ensureAuthorized();
  try {
    const shop = await getShopById(shopId);
    const updated = setSanityConfig(shop as Parameters<typeof setSanityConfig>[0], undefined) as unknown as Shop;
    await updateShopInRepo(shopId, { ...updated, id: shopId });
    return { message: "Sanity disconnected" };
  } catch (err) {
    console.error("Failed to disconnect Sanity", err);
    return { error: "Failed to disconnect Sanity" };
  }
}
