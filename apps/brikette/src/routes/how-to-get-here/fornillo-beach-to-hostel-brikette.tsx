// src/routes/how-to-get-here/fornillo-beach-to-hostel-brikette.tsx
// Route head exports – canonical, hreflang, Twitter card, og:type=article
import type { LinksFunction,MetaFunction } from "react-router";

import { BASE_URL } from "@/config/site";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { guideSlug } from "@/routes.guides-helpers";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import * as articleLead from "./fornilloBeachToBrikette/_articleLead";
import * as breadcrumb from "./fornilloBeachToBrikette/breadcrumb";
import * as constants from "./fornilloBeachToBrikette/constants";
import * as guideExtras from "./fornilloBeachToBrikette/guideExtras";
import * as guideFaqFallback from "./fornilloBeachToBrikette/guideFaqFallback";
import * as loader from "./fornilloBeachToBrikette/loader";
import * as selectors from "./fornilloBeachToBrikette/selectors";
import { makeHowToGuidePage } from "./makeHowToGuidePage";

export const handle = { tags: ["beaches", "stairs", "positano"] };

const { component: FornilloBeachToHostelBrikette, loader: clientLoader } = makeHowToGuidePage({
  modules: {
    breadcrumb,
    articleLead,
    guideFaqFallback,
    guideExtras,
    selectors,
    loader,
  },
  constants,
});

export { clientLoader };

export default FornilloBeachToHostelBrikette;

export const meta: MetaFunction = ({ data }) => {
  const d = (data || {}) as { lang?: AppLanguage };
  const lang = d.lang || (i18nConfig.fallbackLng as AppLanguage);
  const howToBase = getSlug("howToGetHere", lang);
  const pageSlug = guideSlug(lang, constants.GUIDE_KEY);
  const path = `/${lang}/${howToBase}/${pageSlug}`;
  const url = `${BASE_URL}${path}`;
  const image = buildCfImageUrl(constants.OG_IMAGE.path, constants.OG_IMAGE.transform);
  return buildRouteMeta({
    lang,
    title: `guides.meta.${constants.GUIDE_KEY}.title`,
    description: `guides.meta.${constants.GUIDE_KEY}.description`,
    url,
    path,
    image: { src: image, width: constants.OG_IMAGE.width, height: constants.OG_IMAGE.height },
    ogType: "article",
  });
};

export const links: LinksFunction = () => buildRouteLinks();

