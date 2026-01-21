// apps/cms/src/actions/saveSanityConfig.ts
"use server";

import { getShopById, updateShopInRepo } from "@acme/platform-core/repositories/shop.server";
import {
  setEditorialBlog,
  setSanityConfig,
} from "@acme/platform-core/shops";
import { verifyCredentials } from "@acme/plugin-sanity";
import type { Shop } from "@acme/types";

import { ensureAuthorized } from "./common/auth";
import { setupSanityBlog } from "./setupSanityBlog";

export async function saveSanityConfig(
  shopId: string,
  formData: FormData
): Promise<{
  error?: string;
  message?: string;
  errorCode?: string;
}> {
  await ensureAuthorized();

  const shop = await getShopById(shopId);
  if (!shop) {
    return { error: `Shop ${shopId} not found` };
  }

  const projectId = String(formData.get("projectId") ?? "");
  const dataset = String(formData.get("dataset") ?? "");
  const token = String(formData.get("token") ?? "");
  const aclMode = String(formData.get("aclMode") ?? "public");
  const createDataset = String(formData.get("createDataset") ?? "false") === "true";
  const enableEditorialRaw = formData.get("enableEditorial");
  const promoteScheduleRaw = formData.get("promoteSchedule");
  const editorialEnabled =
    enableEditorialRaw == null
      ? Boolean(shop.luxuryFeatures?.blog)
      : enableEditorialRaw === "on" || enableEditorialRaw === "true";
  const promoteSchedule =
    promoteScheduleRaw == null || String(promoteScheduleRaw) === ""
      ? undefined
      : String(promoteScheduleRaw);

  const config = { projectId, dataset, token };

  if (createDataset) {
    const setup = await setupSanityBlog(
      config,
      { enabled: editorialEnabled, ...(promoteSchedule ? { promoteSchedule } : {}) },
      aclMode as "public" | "private",
    );
    if (!setup.success) {
      return {
        error: setup.error ?? "Failed to setup Sanity blog",
        errorCode: setup.code,
      };
    }
  } else {
    const valid = await verifyCredentials(config);
    if (!valid) {
      return { error: "Invalid Sanity credentials", errorCode: "INVALID_CREDENTIALS" };
    }
  }
  const updated = setEditorialBlog(setSanityConfig(shop as any, config as any), {
    enabled: editorialEnabled,
    ...(promoteSchedule ? { promoteSchedule } : {}),
  } as any) as unknown as Shop;
  updated.luxuryFeatures = {
    ...(updated.luxuryFeatures ?? {}),
    blog: editorialEnabled,
  } as Shop["luxuryFeatures"];
  // maintain legacy flag
  (updated as Shop & { enableEditorial?: boolean }).enableEditorial = editorialEnabled;
  if (promoteSchedule) {
    try {
      await fetch(`/api/shops/${shopId}/editorial/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule: promoteSchedule }),
      });
    } catch (err) {
      console.error("[saveSanityConfig] failed to schedule promotion", err);
    }
  }
  await updateShopInRepo(shopId, { ...updated, id: shopId });

  return { message: "Sanity connected" };
}
