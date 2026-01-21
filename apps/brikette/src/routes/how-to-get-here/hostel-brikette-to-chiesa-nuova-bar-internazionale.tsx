// src/routes/how-to-get-here/hostel-brikette-to-chiesa-nuova-bar-internazionale.tsx
import type { LinksFunction,MetaFunction } from "react-router";

import { BASE_URL } from "@/config/site";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { guideSlug } from "@/routes.guides-helpers";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import * as articleLead from "./chiesaNuovaDepartures/articleLead";
import * as breadcrumb from "./chiesaNuovaDepartures/breadcrumb";
import * as constants from "./chiesaNuovaDepartures/constants";
import * as guideExtras from "./chiesaNuovaDepartures/guideExtras";
import * as guideFaqFallback from "./chiesaNuovaDepartures/guideFaqFallback";
import * as loader from "./chiesaNuovaDepartures/loader";
import * as selectors from "./chiesaNuovaDepartures/selectors";
import { makeHowToGuidePage } from "./makeHowToGuidePage";

const { component: ChiesaNuovaDepartures, loader: clientLoader } = makeHowToGuidePage({
  modules: {
    breadcrumb,
    articleLead,
    guideFaqFallback,
    guideExtras,
    selectors,
    loader,
  },
  constants,
  options: {
    showTransportNotice: false,
  },
});

export { clientLoader };

export default ChiesaNuovaDepartures;

// Route head exports – enforce canonical, hreflang, Twitter card, and og:type=article
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
    // Keep keys; runtime head resolver handles translation for guides
    title: `guides.meta.${constants.GUIDE_KEY}.title`,
    description: `guides.meta.${constants.GUIDE_KEY}.description`,
    url,
    path,
    image: { src: image, width: constants.OG_IMAGE.width, height: constants.OG_IMAGE.height },
    ogType: "article",
  });
};

export const links: LinksFunction = () => buildRouteLinks();

