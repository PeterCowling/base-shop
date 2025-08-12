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
  const aclMode = String(formData.get("aclMode") ?? "public");
  const createDataset = String(formData.get("createDataset") ?? "false") === "true";

  const config = { projectId, dataset, token };

  if (createDataset) {
    const setup = await setupSanityBlog(
      config,
      aclMode as "public" | "private",
    );
    if (!setup.success) {
      return { error: setup.error ?? "Failed to setup Sanity blog" };
    }
  } else {
    const valid = await verifyCredentials(config);
    if (!valid) {
      return { error: "Invalid Sanity credentials" };
    }
  }

  const shop = await getShopById(shopId);
  const updated = setSanityConfig(shop, config);
  await updateShopInRepo(shopId, updated);

  return { message: "Sanity connected" };
}
