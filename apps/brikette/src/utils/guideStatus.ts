// src/utils/guideStatus.ts
import * as GuidesIndex from "@/data/guides.index";

export type GuideStatus = "draft" | "review" | "published";

/**
 * Get the base guide status from manifest, ignoring localStorage overrides.
 * Use this for SSR-safe initial render to avoid hydration mismatches.
 */
export function getManifestGuideStatus(key: string): GuideStatus {
  const statusMap = ((GuidesIndex as unknown as Record<string, unknown>)?.["GUIDE_STATUS_BY_KEY"] || {}) as Record<string, GuideStatus>;
  return (statusMap[key] ?? "published") as GuideStatus;
}
