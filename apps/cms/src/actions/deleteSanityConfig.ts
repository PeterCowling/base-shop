// apps/cms/src/actions/deleteSanityConfig.ts
"use server";

import { getShopById, updateShopInRepo } from "@platform-core/src/repositories/shop.server";
import { setSanityConfig } from "@platform-core/src/shops";
import { ensureAuthorized } from "./common/auth";

export async function deleteSanityConfig(
  shopId: string,
): Promise<{ message?: string; error?: string }> {
  await ensureAuthorized();
  try {
    const shop = await getShopById(shopId);
    const updated = setSanityConfig(shop, undefined);
    await updateShopInRepo(shopId, updated);
    return { message: "Sanity disconnected" };
  } catch (err) {
    console.error("Failed to disconnect Sanity", err);
    return { error: "Failed to disconnect Sanity" };
  }
}
