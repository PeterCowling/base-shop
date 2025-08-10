// apps/cms/src/actions/saveSanityConfig.ts
"use server";

import { verifyCredentials } from "@acme/plugin-sanity";
import { getShopById, updateShopInRepo } from "@platform-core/src/repositories/shop.server";
import { setSanityConfig } from "@platform-core/src/shops";
import { ensureAuthorized } from "./common/auth";
import { setupSanityBlog } from "./setupSanityBlog";

export async function saveSanityConfig(
  shopId: string,
  formData: FormData
): Promise<{
  error?: string;
  message?: string;
}> {
  await ensureAuthorized();

  const projectId = String(formData.get("projectId") ?? "");
  const dataset = String(formData.get("dataset") ?? "");
  const token = String(formData.get("token") ?? "");

  const config = { projectId, dataset, token };

  const valid = await verifyCredentials(config);
  if (!valid) {
    return { error: "Invalid Sanity credentials" };
  }

  const setup = await setupSanityBlog(config);
  if (!setup.success) {
    return { error: setup.error ?? "Failed to setup Sanity blog" };
  }

  const shop = await getShopById(shopId);
  const updated = setSanityConfig(shop, config);
  await updateShopInRepo(shopId, updated);

  return { message: "Sanity connected" };
}
