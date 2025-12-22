// src/routes/how-to-get-here/chiesa-nuova-bar-internazionale-to-hostel-brikette.tsx
import { makeHowToGuidePage } from "./makeHowToGuidePage";
import type { MetaFunction, LinksFunction } from "react-router";
import { BASE_URL } from "@/config/site";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { getSlug } from "@/utils/slug";
import { guideSlug } from "@/routes.guides-helpers";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";

import * as breadcrumb from "./chiesaNuovaArrivals/breadcrumb";
import * as articleLead from "./chiesaNuovaArrivals/articleLead";
import * as guideFaqFallback from "./chiesaNuovaArrivals/guideFaqFallback";
import * as guideExtras from "./chiesaNuovaArrivals/guideExtras";
import * as constants from "./chiesaNuovaArrivals/constants";
import * as selectors from "./chiesaNuovaArrivals/selectors";
import * as loader from "./chiesaNuovaArrivals/loader";

const { component: ChiesaNuovaArrivals, loader: clientLoader } = makeHowToGuidePage({
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

export default ChiesaNuovaArrivals;

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

