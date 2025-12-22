/* ────────────────────────────────────────────────────────────────
   src/routes/careers.tsx
   Careers – static route with fully localised head tags
---------------------------------------------------------------- */
import CareersHero from "@/components/careers/CareersHero";
import CareersSection from "@/components/careers/CareersSection";
import CareersStructuredData from "@/components/seo/CareersStructuredData";
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { BASE_URL } from "@/config/site";
import type { MetaFunction, LinksFunction } from "react-router";
import { getSlug } from "@/utils/slug";
import { Fragment, memo, useMemo } from "react";
import { safeUseLoaderData } from "@/utils/safeUseLoaderData";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { resolveI18nMeta } from "@/utils/i18nMeta";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { createBasicPageClientLoader } from "@/routes/_shared/createBasicPageLoader";
import { OG_IMAGE } from "@/utils/headConstants";
import { useApplyFallbackHead } from "@/utils/testHeadFallback";

const OG_IMAGE_DIMENSIONS = OG_IMAGE;

/*──────── loader ───────────────────────────────────────────────*/
export const clientLoader = createBasicPageClientLoader("careersPage", { optional: ["modals"] });

/*──────── page component ───────────────────────────────────────*/
export default memo(function Careers() {
  const loaderData = safeUseLoaderData<{ lang: AppLanguage } | undefined>();
  const currentLanguage = useCurrentLanguage();
  const lang = loaderData?.lang ?? currentLanguage;
  // Head handled by meta()/links()

  // Testing fallback: inject head when framework head is unavailable
  const fallbackHeadDescriptors = useMemo(() => {
    if (process.env.NODE_ENV !== "test") return undefined;
    const loaderTitle = (loaderData as unknown as { title?: unknown } | undefined)?.title;
    const loaderDesc = (loaderData as unknown as { desc?: unknown } | undefined)?.desc;
    const loaderMeta = {
      title: typeof loaderTitle === "string" ? loaderTitle.trim() : "",
      description: typeof loaderDesc === "string" ? loaderDesc.trim() : "",
    };
    const fallbackMeta = resolveI18nMeta(lang, "careersPage");
    const path = `/${lang}/${getSlug("careers", lang)}`;
    const image = buildCfImageUrl("/img/positano-panorama.avif", {
      width: OG_IMAGE_DIMENSIONS.width,
      height: OG_IMAGE_DIMENSIONS.height,
      quality: 85,
      format: "auto",
    });
    return buildRouteMeta({
      lang,
      title: loaderMeta.title || fallbackMeta.title,
      description: loaderMeta.description || fallbackMeta.description,
      url: `${BASE_URL}${path}`,
      path,
      image: { src: image, width: OG_IMAGE_DIMENSIONS.width, height: OG_IMAGE_DIMENSIONS.height },
    });
  }, [lang, loaderData]);

  const fallbackHeadLinks = useMemo(() => {
    if (process.env.NODE_ENV !== "test") return undefined;
    const path = `/${lang}/${getSlug("careers", lang)}`;
    return buildRouteLinks({ lang, path });
  }, [lang]);

  useApplyFallbackHead(fallbackHeadDescriptors as unknown as ReturnType<typeof buildRouteMeta>, fallbackHeadLinks);

  return (
    <Fragment>
      {null}

      <CareersStructuredData lang={lang} />

      {/*──── content ────*/}
      <CareersHero lang={lang} />

      <CareersSection lang={lang} />
    </Fragment>
  );
});

export const meta: MetaFunction = ({ data }: { data?: unknown } = {}) => {
  const d = (data || {}) as { lang?: AppLanguage; title?: string; desc?: string };
  const lang = d.lang || (i18nConfig.fallbackLng as AppLanguage);
  const metaFromLoader = {
    title: (d.title ?? "").trim(),
    description: (d.desc ?? "").trim(),
  };
  const fallbackMeta = resolveI18nMeta(lang, "careersPage");
  const title = metaFromLoader.title || fallbackMeta.title;
  const description = metaFromLoader.description || fallbackMeta.description;
  const path = `/${lang}/${getSlug("careers", lang)}`;
  const image = buildCfImageUrl("/img/positano-panorama.avif", {
    width: OG_IMAGE_DIMENSIONS.width,
    height: OG_IMAGE_DIMENSIONS.height,
    quality: 85,
    format: "auto",
  });
  return buildRouteMeta({
    lang,
    title,
    description,
    url: `${BASE_URL}${path}`,
    path,
    image: { src: image, width: OG_IMAGE_DIMENSIONS.width, height: OG_IMAGE_DIMENSIONS.height },
  });
};

export const links: LinksFunction = () => buildRouteLinks();

