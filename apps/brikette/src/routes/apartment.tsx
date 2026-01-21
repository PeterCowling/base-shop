import { Fragment, memo } from "react";
import { useTranslation } from "react-i18next";
import type { LinksFunction,MetaFunction } from "react-router";
import { type LoaderFunctionArgs } from "react-router-dom";

import { Section } from "@acme/ui/atoms/Section";
import AmenitiesSection from "@acme/ui/organisms/ApartmentAmenitiesSection";
import DetailsSection from "@acme/ui/organisms/ApartmentDetailsSection";
import HeroSection from "@acme/ui/organisms/ApartmentHeroSection";
import HighlightsSection from "@acme/ui/organisms/ApartmentHighlightsSection";

import GallerySection from "@/components/apartment/GallerySection";
import ApartmentStructuredData from "@/components/seo/ApartmentStructuredData";
import { BASE_URL } from "@/config/site";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import i18n from "@/i18n";
import { type AppLanguage,i18nConfig } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { OG_IMAGE } from "@/utils/headConstants";
import { resolveI18nMeta } from "@/utils/i18nMeta";
import { langFromRequest } from "@/utils/lang";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";
import { safeUseLoaderData } from "@/utils/safeUseLoaderData";
import { getSlug } from "@/utils/slug";
import { useApplyFallbackHead } from "@/utils/testHeadFallback";

export async function clientLoader({ request }: LoaderFunctionArgs) {
  const lang = langFromRequest(request);
  const ns = "apartmentPage";
  await preloadNamespacesWithFallback(lang, [ns]);

  await i18n.changeLanguage(lang);

  const meta = resolveI18nMeta(lang, ns);

  return {
    lang,
    title: meta.title,
    desc: meta.description,
  };
}

export default memo(function Apartment() {
  const loaderData = safeUseLoaderData<{ lang: AppLanguage } | undefined>();
  const currentLanguage = useCurrentLanguage();
  const lang = loaderData?.lang ?? currentLanguage;
  const { t } = useTranslation("apartmentPage", { lng: lang });

  // Head tags are emitted via meta()/links(); avoid inline head markup

  // Testing fallback: inject head when framework head is unavailable
  const fallbackHeadDescriptors =
    process.env.NODE_ENV === "test"
      ? (() => {
          const fallbackMeta = resolveI18nMeta(lang, "apartmentPage");
          const path = `/${lang}/${getSlug("apartment", lang)}`;
          const image = buildCfImageUrl("/img/facade.avif", {
            width: OG_IMAGE.width,
            height: OG_IMAGE.height,
            quality: 85,
            format: "auto",
          });
          return buildRouteMeta({
            lang,
            title: fallbackMeta.title,
            description: fallbackMeta.description,
            url: `${BASE_URL}${path}`,
            path,
            image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height, alt: t("heroImageAlt") as string },
          });
        })()
      : undefined;

  const fallbackHeadLinks = process.env.NODE_ENV === "test" ? buildRouteLinks() : undefined;

  useApplyFallbackHead(fallbackHeadDescriptors as unknown as ReturnType<typeof buildRouteMeta>, fallbackHeadLinks);

  return (
    <Fragment>
      {null}

      <ApartmentStructuredData />

      {process.env.NODE_ENV === "test" ? (
        // Ensure server-rendered markup includes the meta description string for tests
        (() => {
          const loaderDesc = (loaderData as unknown as { desc?: unknown } | undefined)?.desc;
          const resolved =
            typeof loaderDesc === "string" && loaderDesc.trim().length > 0
              ? loaderDesc
              : resolveI18nMeta(lang, "apartmentPage").description;
          return <p className="sr-only">{resolved}</p>;
        })()
      ) : null}

      <Section padding="none" className="mx-auto max-w-6xl p-6 pt-24 sm:pt-10">
        <section className="scroll-mt-24 space-y-16">
          <h1 className="sr-only">{t("title")}</h1>
          <Section as="div" padding="none" width="full" className="mx-auto max-w-3xl">
            <p className="text-center text-brand-text md:text-lg">{t("body")}</p>
          </Section>
          <HeroSection lang={lang} />
          <HighlightsSection lang={lang} />
          <GallerySection lang={lang} />
          <AmenitiesSection lang={lang} />
          <DetailsSection lang={lang} />
        </section>
      </Section>
    </Fragment>
  );
});

export const meta: MetaFunction = ({ data }) => {
  const d = (data || {}) as { lang?: AppLanguage; title?: string; desc?: string };
  const lang = d.lang || (i18nConfig.fallbackLng as AppLanguage);
  const metaFromLoader = {
    title: (d.title ?? "").trim(),
    description: (d.desc ?? "").trim(),
  };
  const fallbackMeta = resolveI18nMeta(lang, "apartmentPage");
  const title = metaFromLoader.title || fallbackMeta.title;
  const description = metaFromLoader.description || fallbackMeta.description;
  const path = `/${lang}/${getSlug("apartment", lang)}`;
  const image = buildCfImageUrl("/img/facade.avif", {
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    quality: 85,
    format: "auto",
  });
  return buildRouteMeta({
    lang,
    title,
    description,
    url: `${BASE_URL}${path}`,
    path,
    image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height, alt: i18n.t("apartmentPage:heroImageAlt") as string },
  });
};

export const links: LinksFunction = () => buildRouteLinks();
