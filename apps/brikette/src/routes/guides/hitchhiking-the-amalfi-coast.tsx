// src/routes/guides/hitchhiking-the-amalfi-coast.tsx
import type {} from "@/routes/guides/_GuideSeoTemplate";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";
import { ensureCanonicalLinkCluster } from "./ensureCanonicalLinkCluster";

import type { GuideKey } from "@/routes.guides-helpers";
import { buildRouteLinks } from "@/utils/routeHead";
import type { MetaDescriptor, MetaFunction } from "react-router";

export const handle = { tags: ["hitchhiking", "amalfi", "budgeting"] };

export const GUIDE_KEY: GuideKey = "hitchhikingAmalfi";
export const GUIDE_SLUG = "hitchhiking-the-amalfi-coast" as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for hitchhikingAmalfi"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only safeguard surfaced in build logs
}

const ensureTwitterCard = (descriptors: ReturnType<MetaFunction>): MetaDescriptor[] => {
  const list: MetaDescriptor[] = Array.isArray(descriptors) ? [...descriptors] : [];
  let hasTwitterCard = false;
  for (const descriptor of list) {
    if (descriptor && typeof descriptor === "object" && "name" in descriptor) {
      if ((descriptor as Record<string, unknown>)["name"] === "twitter:card") {
        hasTwitterCard = true;
        break;
      }
    }
  }
  if (!hasTwitterCard) {
    list.push({ name: "twitter:card", content: "summary_large_image" });
  }
  return list;
};

const { Component, clientLoader, links, meta } = defineGuideRoute(manifestEntry, {
  meta: (_args, _entry, base) => ensureTwitterCard(base),
  links: (_args, _entry, base) => ensureCanonicalLinkCluster(base, () => buildRouteLinks()),
});

export default Component;
export { clientLoader, links, meta };
