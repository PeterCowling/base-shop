// src/routes/guides/positano-in-winter-on-a-budget.tsx
import {
  defineGuideRoute,
  createStructuredLeadWithBuilder,
  type GuideLinksArgs,
} from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";

import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";
import { OG_IMAGE as OG_DIMS } from "@/utils/headConstants";
import { toAppLanguage } from "@/utils/lang";
import GenericContent from "@/components/guides/GenericContent";

export const handle = { tags: ["seasonal", "winter", "positano", "budgeting"] } as const;

export const GUIDE_KEY = "positanoWinterBudget" as const satisfies GuideKey;
export const GUIDE_SLUG = "positano-in-winter-on-a-budget" as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for positanoWinterBudget");
}

const winterBudgetStructuredLead = createStructuredLeadWithBuilder({
  guideKey: GUIDE_KEY,
  buildExtras: () => ({ hasStructured: false }),
  render: (context) => (
    <GenericContent guideKey={GUIDE_KEY} t={context.translator} showToc />
  ),
  selectTocItems: () => [],
  isStructured: () => false,
});

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => ({
    renderGenericContent: false,
    relatedGuides: {
      items: [
        { key: "offSeasonLongStay" },
        { key: "workCafes" },
        { key: "positanoTravelGuide" },
      ],
    },
    articleLead: winterBudgetStructuredLead.articleLead,
  }),
  structuredArticle: winterBudgetStructuredLead.structuredArticle,
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
  links: (args?: GuideLinksArgs, entry) => {
    const candidate = ((args ?? {}) as { data?: { lang?: string } }).data;
    const lang = toAppLanguage(candidate?.lang);
    const areaSlug = getSlug(guideAreaToSlugKey(entry.primaryArea), lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, entry.key)}`;
    return buildRouteLinks({ lang, path, origin: BASE_URL });
  },
});

export default Component;
export { clientLoader, meta, links };