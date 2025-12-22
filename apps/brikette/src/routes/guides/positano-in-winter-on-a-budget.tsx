// src/routes/guides/positano-in-winter-on-a-budget.tsx
import type {} from "@/routes/guides/_GuideSeoTemplate";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";

import GenericContent from "@/components/guides/GenericContent";
import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import type { LinksFunction } from "react-router";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";
import { OG_IMAGE as OG_DIMS } from "@/utils/headConstants";
import { toAppLanguage } from "@/utils/lang";
import { useTranslation } from "react-i18next";

export const handle = { tags: ["seasonal", "winter", "positano", "budgeting"] } as const;

export const GUIDE_KEY = "positanoWinterBudget" as const satisfies GuideKey;
export const GUIDE_SLUG = "positano-in-winter-on-a-budget" as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for positanoWinterBudget"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Non-UI invariant
}

const { Component, clientLoader, meta, links: baseLinks } = defineGuideRoute(manifestEntry, {
  template: () => ({
    renderGenericContent: false,
    relatedGuides: {
      items: [
        { key: "offSeasonLongStay" },
        { key: "workCafes" },
        { key: "positanoTravelGuide" },
      ],
    },
    articleLead: () => <PositanoWinterBudgetLead />,
  }),
  meta: ({ data }, entry) => {
    const candidate = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(candidate.lang);
    const areaSlug = getSlug(guideAreaToSlugKey(entry.primaryArea), lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, entry.key)}`;
    const url = `${BASE_URL}${path}`;
    const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
      width: OG_DIMS.width,
      height: OG_DIMS.height,
      quality: 85,
      format: "auto",
    });
    return buildRouteMeta({
      lang,
      title: `guides.meta.${entry.metaKey ?? entry.key}.title`,
      description: `guides.meta.${entry.metaKey ?? entry.key}.description`,
      url,
      path,
      image: { src: image, width: OG_DIMS.width, height: OG_DIMS.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: entry.status === "live",
    });
  },
});

const links: LinksFunction = (...args: Parameters<LinksFunction>) => {
  const descriptors = baseLinks(...args);
  return descriptors.length > 0 ? descriptors : buildRouteLinks();
};

export default Component;
export { clientLoader, meta, links };

function PositanoWinterBudgetLead(): JSX.Element | null {
  const { t } = useTranslation("guides");
  const renderGeneric = GenericContent as unknown as (
    props: Parameters<typeof GenericContent>[0],
    translator?: unknown,
  ) => ReturnType<typeof GenericContent>;
  return renderGeneric({ t, guideKey: GUIDE_KEY, showToc: true }, t);
}
