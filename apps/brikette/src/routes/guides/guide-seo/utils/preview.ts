import { PREVIEW_TOKEN } from "@/config/env";
import type { GuideKey } from "@/routes.guides-helpers";
import { getEffectiveGuideStatus } from "@/utils/guideStatus";

export function isPreviewAllowed(search?: string | null): boolean {
  try {
    const token = PREVIEW_TOKEN ?? undefined;
    const param = new URLSearchParams(search ?? "").get("preview");
    return Boolean(token && param === token);
  } catch {
    return false;
  }
}

export function isPublishedOrPreview(guideKey: GuideKey, search?: string | null): boolean {
  const status = getEffectiveGuideStatus(guideKey) ?? "published";
  if (status === "published") return true;
  return isPreviewAllowed(search);
}

export function shouldShowPreviewBanner(guideKey: GuideKey, search?: string | null): boolean {
  const status = getEffectiveGuideStatus(guideKey);
  return status !== "published" && isPreviewAllowed(search);
}
