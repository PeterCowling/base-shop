/* ────────────────────────────────────────────────────────────────
   src/routes/rooms.tsx
---------------------------------------------------------------- */
import { Fragment, memo } from "react";
import { useTranslation } from "react-i18next";
import type { LinksFunction,MetaFunction } from "react-router";
import { type LoaderFunctionArgs,useLoaderData } from "react-router-dom";

import RatingsBar from "@acme/ui/atoms/RatingsBar";
import { Section } from "@acme/ui/atoms/Section";
import { DirectBookingPerks } from "@acme/ui/molecules/DirectBookingPerks";
import RoomsSection from "@acme/ui/organisms/RoomsSection";

import AlsoHelpful from "@/components/common/AlsoHelpful";
import RoomsStructuredData from "@/components/seo/RoomsStructuredData";
import { BASE_URL } from "@/config/site";
import i18n from "@/i18n";
// no need for guideSlug here; cross-links handled by AlsoHelpful
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
// i18n config not required directly; alternates handled globally
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { OG_IMAGE } from "@/utils/headConstants";
import { resolveI18nMeta } from "@/utils/i18nMeta";
import { langFromRequest } from "@/utils/lang";
import { preloadI18nNamespaces, preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";
import { useApplyFallbackHead } from "@/utils/testHeadFallback";

/*── loader ──────────────────────────────────────────────────────*/
export async function clientLoader({ request }: LoaderFunctionArgs) {
  const lang = langFromRequest(request);
  const ns = "roomsPage";

  await preloadNamespacesWithFallback(lang, [ns, "assistanceCommon"]);
  await preloadI18nNamespaces(lang, ["ratingsBar", "modals", "guides"], { optional: true });

  // Align i18n language with URL locale for SSR/prerender and client
  await i18n.changeLanguage(lang);

  const meta = resolveI18nMeta(lang, ns);
  return {
    lang,
    title: meta.title,
    desc: meta.description,
    ogAlt: i18n.getFixedT(lang, ns)("meta.ogImageAlt") as string,
  };
}

/*── page component ──────────────────────────────────────────────*/
export default memo(function Rooms() {
  const { lang, title: loaderTitle, desc: loaderDesc } = useLoaderData() as {
    lang: AppLanguage;
    title: string;
    desc: string;
  };
  const { t } = useTranslation("roomsPage", { lng: lang });

  // Head handled by route meta()/links(); avoid duplicate inline tags

  // Deterministic test fallback for head tags
  const fallbackHeadDescriptors = (() => {
    if (process.env.NODE_ENV !== "test") return undefined;
    const fallbackMeta = resolveI18nMeta(lang, "roomsPage");
    const path = `/${lang}/${getSlug("rooms", lang)}`;
    const image = buildCfImageUrl("/img/og-rooms.jpg", {
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });
    // Prefer loader-provided values when available (mirrors route meta())
    const title = (loaderTitle ?? "").trim() || fallbackMeta.title;
    const description = (loaderDesc ?? "").trim() || fallbackMeta.description;
    return buildRouteMeta({
      lang,
      title,
      description,
      url: `${BASE_URL}${path}`,
      path,
      image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
    });
  })();

  const fallbackHeadLinks = (() => {
    if (process.env.NODE_ENV !== "test") return undefined;
    return buildRouteLinks();
  })();

  useApplyFallbackHead(fallbackHeadDescriptors as unknown as ReturnType<typeof buildRouteMeta>, fallbackHeadLinks);

  return (
    <Fragment>
      {null}

      {/* invisible h1 for SEO / a11y */}
      <h1 className="sr-only">{t("rooms.title")}</h1>

      <RoomsStructuredData />
      <RatingsBar lang={lang} />
      <Section padding="none" className="mx-auto w-full max-w-xl px-4 sm:px-6">
        <DirectBookingPerks lang={lang} />
      </Section>
      <RoomsSection lang={lang} />
      {/* Helpful guides (tag-driven) */}
      <Section padding="none" className="mx-auto mt-10 max-w-3xl px-4">
        <AlsoHelpful lang={lang} tags={["accommodation", "planning", "budgeting", "positano"]} includeRooms={false} titleKey={{ ns: "guides", key: "labels.helpfulGuides" }} />
      </Section>
    </Fragment>
  );
});

// React Router head exports for SSR/dev head injection
export const meta: MetaFunction = (args) => {
  const d = (((args as { data?: unknown }).data) || {}) as {
    lang?: AppLanguage;
    title?: string;
    desc?: string;
    ogAlt?: string;
  };
  const lang = d.lang || (i18nConfig.fallbackLng as AppLanguage);
  const title = d.title || "";
  const description = d.desc || "";
  const path = `/${lang}/${getSlug("rooms", lang)}`;
  const image = buildCfImageUrl("/img/og-rooms.jpg", {
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    quality: 85,
    format: "auto",
  });
  const ogImage = {
    src: image,
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    ...(d.ogAlt ? { alt: d.ogAlt } : {}),
  };
  return buildRouteMeta({
    lang,
    title,
    description,
    url: `${BASE_URL}${path}`,
    path,
    image: ogImage,
  });
};

export const links: LinksFunction = () => buildRouteLinks();
