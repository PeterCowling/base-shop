// apps/cms/src/actions/saveSanityConfig.ts
"use server";

import { verifyCredentials } from "@acme/plugin-sanity";
import { ensureAuthorized } from "./common/auth";
import {
  getShopById,
  updateShopInRepo,
} from "@platform-core/repositories/shop.server";
import { setSanityConfig } from "@platform-core/shops";

export async function saveSanityConfig(
  shopId: string,
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string; message?: string }> {
  await ensureAuthorized();

  if (!shopId) {
    return { error: "Missing shop ID" };
  }

  const projectId = String(formData.get("projectId") ?? "");
  const dataset = String(formData.get("dataset") ?? "");
  const token = String(formData.get("token") ?? "");

  const config = { projectId, dataset, token };

  const valid = await verifyCredentials(config);
  if (!valid) {
    return { error: "Invalid Sanity credentials" };
  }

  try {
    const shop = await getShopById(shopId);
    const updated = setSanityConfig(shop, config);
    await updateShopInRepo(shopId, updated);
  } catch (err) {
    console.error("Failed to save Sanity config", err);
    return { error: "Failed to save Sanity config" };
  }

  return { message: "Sanity connection saved" };
}
