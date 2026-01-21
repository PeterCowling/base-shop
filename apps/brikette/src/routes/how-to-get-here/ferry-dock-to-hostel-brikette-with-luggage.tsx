// src/routes/how-to-get-here/ferry-dock-to-hostel-brikette-with-luggage.tsx
import type { LinksFunction,MetaFunction } from "react-router";

import { BASE_URL } from "@/config/site";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { guideSlug } from "@/routes.guides-helpers";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import * as articleLead from "./ferryDockToBrikette/_articleLead";
import * as breadcrumb from "./ferryDockToBrikette/breadcrumb";
import * as constants from "./ferryDockToBrikette/constants";
import * as guideExtras from "./ferryDockToBrikette/guideExtras";
import * as guideFaqFallback from "./ferryDockToBrikette/guideFaqFallback";
import * as loader from "./ferryDockToBrikette/loader";
import * as selectors from "./ferryDockToBrikette/selectors";
import { makeHowToGuidePage } from "./makeHowToGuidePage";

const { component: FerryDockToBrikette, loader: clientLoader } = makeHowToGuidePage({
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

export default FerryDockToBrikette;

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
    title: `guides.meta.${constants.GUIDE_KEY}.title`,
    description: `guides.meta.${constants.GUIDE_KEY}.description`,
    url,
    path,
    image: { src: image, width: constants.OG_IMAGE.width, height: constants.OG_IMAGE.height },
    ogType: "article",
  });
};

export const links: LinksFunction = () => buildRouteLinks();

