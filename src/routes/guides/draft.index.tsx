// src/routes/guides/draft.index.tsx
import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";
import type { GuideKey } from "@/routes.guides-helpers";

export const GUIDE_KEY = "draftIndex" as const satisfies GuideKey;
export const GUIDE_SLUG = "draft-index" as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer error message
  throw new Error("guide manifest entry missing for draftIndex");
}

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry);

export default Component;
export { clientLoader, meta, links };