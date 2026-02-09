// src/utils/guideStatus.ts
import type { GuideStatus } from "@acme/guide-system";

import * as GuidesIndex from "@/data/guides.index";

/**
 * Get the guide status from the index. Unknown keys default to "draft" (not live).
 * Use this for SSR-safe initial render to avoid hydration mismatches.
 */
export function getManifestGuideStatus(key: string): GuideStatus {
  const statusMap = ((GuidesIndex as unknown as Record<string, unknown>)?.["GUIDE_STATUS_BY_KEY"] || {}) as Record<string, GuideStatus>;
  return (statusMap[key] ?? "draft") as GuideStatus;
}
