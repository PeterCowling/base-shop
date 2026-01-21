/* -------------------------------------------------------------------------
   src/routes/about.tsx
   Simple about page with localised head tags
   ---------------------------------------------------------------------- */
import { Fragment, memo } from "react";
import { useTranslation } from "react-i18next";
import type { LinksFunction,MetaFunction } from "react-router";
import { type LoaderFunctionArgs } from "react-router-dom";

import { Section } from "@acme/ui/atoms/Section";

import { CfImage } from "@/components/images/CfImage";
import AboutStructuredData from "@/components/seo/AboutStructuredData";
import { BASE_URL } from "@/config/site";
import i18n from "@/i18n";
import { type AppLanguage,i18nConfig } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { OG_IMAGE } from "@/utils/headConstants";
import { resolveI18nMeta } from "@/utils/i18nMeta";
import { langFromRequest } from "@/utils/lang";
import { preloadI18nNamespaces, preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";
import { safeUseLoaderData } from "@/utils/safeUseLoaderData";
import { getSlug } from "@/utils/slug";
import { useApplyFallbackHead } from "@/utils/testHeadFallback";

const OG_IMAGE_DIMENSIONS = OG_IMAGE;
const HERO_IMAGE_PATH = "/img/facade.avif" as const;
const FALLBACK_LANG = i18nConfig.fallbackLng as AppLanguage;

export async function clientLoader({ request }: LoaderFunctionArgs) {
  const lang = langFromRequest(request);
  const ns = "aboutPage";

  await preloadNamespacesWithFallback(lang, [ns]);
  await preloadI18nNamespaces(lang, ["pages"], { optional: true });

  // Keep i18n language aligned with URL locale in all environments
  await i18n.changeLanguage(lang);

  const meta = resolveI18nMeta(lang, ns);

  return {
    lang,
    title: meta.title,
    desc: meta.description,
  };
}

export default memo(function About() {
  const data = safeUseLoaderData<{
    lang: AppLanguage;
    title: string;
    desc: string;
  }>();
  const lang = data?.lang ?? (i18nConfig.fallbackLng as AppLanguage);
  const { t } = useTranslation("aboutPage", { lng: lang });
  const missionHeadingKey = "mission.heading" as const;
  const missionHeadingRaw = t(missionHeadingKey) as string;
  const missionHeading = missionHeadingRaw && missionHeadingRaw !== missionHeadingKey ? missionHeadingRaw : "";
  const missionParagraphsRaw = t("mission.paragraphs", { returnObjects: true }) as unknown;
  const missionParagraphs = Array.isArray(missionParagraphsRaw)
    ? (missionParagraphsRaw as string[]).filter((p) => typeof p === "string" && p.trim().length > 0)
    : [];
  const hasMissionCopy = missionHeading.trim().length > 0 && missionParagraphs.length > 0;

  // Head tags (og:image/canonical) are handled by route meta()/links()
  const intro1Key = "paragraph1" as const;
  const intro2Key = "paragraph2" as const;
  const introLeadRaw = t(intro1Key) as string;
  const introLead = introLeadRaw && introLeadRaw !== intro1Key ? introLeadRaw : "";
  const para2Raw = t(intro2Key) as string;
  const supportingParagraphs = [para2Raw && para2Raw !== intro2Key ? para2Raw : ""].filter(
    (p) => p.trim().length > 0
  );

  // Testing fallback: inject head tags directly when framework head isn’t active
  const fallbackHeadDescriptors =
    process.env.NODE_ENV === "test"
      ? (() => {
          const metaFromLoader = { title: (data?.title ?? "").trim(), description: (data?.desc ?? "").trim() };
          const fallbackMeta = resolveI18nMeta(lang, "aboutPage");
          const title = metaFromLoader.title || fallbackMeta.title;
          const description = metaFromLoader.description || fallbackMeta.description;
          const path = `/${lang}/${getSlug("about", lang)}`;
          const image = buildCfImageUrl("/img/og-about.jpg", {
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
        })()
      : undefined;

  const fallbackHeadLinks = process.env.NODE_ENV === "test" ? buildRouteLinks() : undefined;

  useApplyFallbackHead(fallbackHeadDescriptors as unknown as ReturnType<typeof buildRouteMeta>, fallbackHeadLinks);

  return (
    <Fragment>
      {null}

      <AboutStructuredData />

      <Section
        as="main"
        padding="none"
        width="full"
        className="scroll-mt-24 px-6 pb-16 pt-24 sm:pt-10"
      >
        <Section
          as="div"
          width="full"
          padding="none"
          className="mx-auto w-full max-w-4xl space-y-12"
        >
          <Section
            width="full"
            padding="none"
            className="relative isolate overflow-hidden rounded-3xl bg-brand-primary/90 text-brand-surface shadow-xl"
          >
            <div className="absolute inset-0">
              <CfImage
                src={HERO_IMAGE_PATH}
                preset="hero"
                alt={t("meta.ogImageAlt")}
                className="size-full object-cover opacity-60"
                width={1600}
                height={900}
                data-aspect="16/9"
              />
            </div>
            <div className="relative flex flex-col gap-5 px-6 py-16 text-start sm:px-10 sm:py-20">
              <h1 className="text-3xl font-bold leading-tight text-brand-surface sm:text-4xl">{t("heading")}</h1>
              {introLead.trim().length ? (
                <Section
                  as="div"
                  width="full"
                  padding="none"
                  className="max-w-2xl"
                >
                  <p className="text-lg text-brand-surface/85">{introLead}</p>
                </Section>
              ) : null}
            </div>
          </Section>

          {supportingParagraphs.length ? (
            <Section
              padding="none"
              width="full"
              className="space-y-4 text-center text-lg text-brand-text/90 dark:text-brand-surface/90"
            >
              {supportingParagraphs.map((paragraph, index) => (
                <p key={`about-intro-${index}`}>{paragraph}</p>
              ))}
            </Section>
          ) : null}

          {hasMissionCopy ? (
            <Section
              padding="none"
              width="full"
              className="rounded-3xl border border-brand-outline/40 bg-brand-primary/5 p-8 text-start shadow-sm dark:border-brand-outline/20 dark:bg-brand-surface/10"
            >
              <h2 className="text-2xl font-semibold text-brand-heading dark:text-brand-surface">{missionHeading}</h2>
              <div className="mt-4 space-y-4 text-brand-text/80 dark:text-brand-surface/80">
                {missionParagraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </Section>
          ) : null}
        </Section>
      </Section>
    </Fragment>
  );
});

export const meta: MetaFunction = ({ data, params }: { data?: unknown; params?: Record<string, string | undefined> } = {}) => {
  const d = (data || {}) as { lang?: AppLanguage; title?: string; desc?: string };
  const supportedLangs = (i18nConfig.supportedLngs ?? []) as readonly AppLanguage[];
  const paramLang =
    typeof params?.["lang"] === "string" && supportedLangs.includes(params["lang"] as AppLanguage)
      ? (params["lang"] as AppLanguage)
      : undefined;
  const pathLang = d.lang ?? paramLang ?? FALLBACK_LANG;
  const loaderTitle = (d.title ?? "").trim();
  const loaderDescription = (d.desc ?? "").trim();
  const hasLoaderMeta = loaderTitle.length > 0 || loaderDescription.length > 0;
  const metaLang = hasLoaderMeta ? pathLang : FALLBACK_LANG;
  const fallbackMeta = resolveI18nMeta(metaLang, "aboutPage");
  const title = loaderTitle || fallbackMeta.title;
  const description = loaderDescription || fallbackMeta.description;
  const path = `/${pathLang}/${getSlug("about", pathLang)}`;
  const imageSrc = buildCfImageUrl("/img/og-about.jpg", {
    width: OG_IMAGE_DIMENSIONS.width,
    height: OG_IMAGE_DIMENSIONS.height,
    quality: 85,
    format: "auto",
  });
  return buildRouteMeta({
    lang: metaLang,
    title,
    description,
    url: `${BASE_URL}${path}`,
    path,
    image: { src: imageSrc, width: OG_IMAGE_DIMENSIONS.width, height: OG_IMAGE_DIMENSIONS.height },
  });
};

export const links: LinksFunction = () => buildRouteLinks();
