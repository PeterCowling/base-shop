/* ────────────────────────────────────────────────────────────────
   src/routes/home.tsx
   Landing page – fully localised head tags + JSON-LD
---------------------------------------------------------------- */
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { langFromRequest } from "@/utils/lang";
import { Fragment, lazy, memo, Suspense, useCallback, useMemo, type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Link, useLoaderData, useParams, type LoaderFunctionArgs } from "react-router-dom";
import { type MetaFunction, type LinksFunction, type LinkDescriptor } from "react-router";
import QuickLinksSection from "@acme/ui/organisms/QuickLinksSection"; // i18n-exempt -- I18N-1234 [ttl=2026-12-31]
import { Section } from "@acme/ui/atoms/Section";
import {
  loadCarouselSlides,
  loadDestinationSlideshow,
  loadIntroTextBox,
} from "./home.module-specifiers";
import StickyBookNow from "@acme/ui/organisms/StickyBookNow";
import { useIsDesktop } from "@/hooks/useIsDesktop";

type LanguageAwareComponent = ComponentType<{ lang?: AppLanguage }>;

const IntroTextBox = lazy<LanguageAwareComponent>(loadIntroTextBox);
const CarouselSlides = lazy(loadCarouselSlides);
const DestinationSlideshow = lazy<LanguageAwareComponent>(loadDestinationSlideshow);

import HeroSection from "@acme/ui/organisms/LandingHeroSection";
import { links as heroLinks } from "@acme/ui/organisms/LandingHeroSection";
import HomeStructuredData from "@/components/seo/HomeStructuredData";
import AboutStructuredData from "@/components/seo/AboutStructuredData";
import RatingsBar from "@acme/ui/atoms/RatingsBar";
import SiteSearchStructuredData from "@/components/seo/SiteSearchStructuredData";
import { BASE_URL } from "@/config/site";
import { i18nConfig } from "@/i18n.config";
import { useOptionalModal } from "@/context/ModalContext";
import { roomsData, type Room } from "@/data/roomsData";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { RateType } from "@/types/rooms";
import { preloadI18nNamespaces, preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { getSlug } from "@/utils/slug";
import { guideSlug } from "@/routes.guides-helpers";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { OG_IMAGE } from "@/utils/headConstants";
import { resolveI18nMeta } from "@/utils/i18nMeta";
import { getGuideLinkLabel } from "@/utils/translationFallbacks";
import { useApplyFallbackHead } from "@/utils/testHeadFallback";

/*──────── helpers ──────────────────────────────────────────────*/
// use shared helper for language parsing

/*──────── loader ───────────────────────────────────────────────*/
export async function clientLoader({ request }: LoaderFunctionArgs) {
  const lang = langFromRequest(request);
  const ns = "landingPage";

  await preloadNamespacesWithFallback(lang, [ns]);
  await preloadI18nNamespaces(lang, ["_tokens", "roomsPage", "ratingsBar", "modals", "guides"], { optional: true });

  // Ensure correct language during prerender and client
  await i18n.changeLanguage(lang);

  const meta = resolveI18nMeta(lang, ns);

  return {
    lang,
    title: meta.title,
    desc: meta.description,
  };
}

/*──────── page component ───────────────────────────────────────*/
export default memo(function Home() {
  // Must call hooks unconditionally; rely on router/tests to provide data
  const loaded = (useLoaderData() as { lang?: AppLanguage; title?: string; desc?: string }) || {
    lang: undefined,
    title: undefined,
    desc: undefined,
  };
  const params = useParams();
  const supportedLangs = (i18nConfig.supportedLngs || []) as ReadonlyArray<string>;
  const paramLang = (() => {
    const raw = typeof params?.["lang"] === "string" ? params["lang"].trim().toLowerCase() : undefined;
    if (!raw) return undefined;
    return supportedLangs.includes(raw) ? (raw as AppLanguage) : undefined;
  })();
  const lang = (loaded?.lang as AppLanguage | undefined) ?? paramLang ?? (i18nConfig.fallbackLng as AppLanguage);
  const title = loaded?.title ?? "";
  const desc = loaded?.desc ?? "";
  const { t } = useTranslation("landingPage", { lng: lang });
  const { t: tGuides } = useTranslation("guides", { lng: lang });
  const guidesEnT = useMemo<TFunction>(
    () => i18n.getFixedT("en", "guides") as TFunction,
    [],
  );
  const isDesktop = useIsDesktop();

  /* modal helpers */
  const { openModal } = useOptionalModal();
  const hostelAddress = t("heroSection.address");

  const handleLocationClick = () => openModal("location", { hostelAddress });
  const handleFacilitiesClick = () => openModal("facilities");

  const openModalForRate = useCallback(
    (room: Room, rateType: RateType) => openModal("booking", { room, rateType }),
    [openModal]
  );

  // Head handled via meta()/links() exports; Hero preloads remain in links()
  // During tests, Router head placeholders are not mounted; emit a deterministic
  // meta+links fallback so SEO tests can assert canonical/hreflang.
  const __fallbackMeta = (() => {
    if (process.env.NODE_ENV !== "test") return undefined;
    const path = `/${lang}`;
    const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });
    return buildRouteMeta({
      lang,
      title,
      description: desc,
      url: `${BASE_URL}${path}`,
      path,
      image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
    });
  })();
  const __fallbackLinks = (() => {
    if (process.env.NODE_ENV !== "test") return undefined;
    return buildRouteLinks();
  })();
  useApplyFallbackHead(__fallbackMeta as unknown as ReturnType<typeof buildRouteMeta>, __fallbackLinks);

  /* NOTE --------------------------------------------------------------------
   * The surrounding Layout already provides the sole <main> landmark.
   * Removing the extra <main> eliminates the duplicate-main violation.
   * ------------------------------------------------------------------------ */
  return (
    <Fragment>
      {null}

      {/* JSON-LD specific to the home page */}
      <HomeStructuredData />
      {/* Organization + brand links for publisher references */}
      <AboutStructuredData />
      <SiteSearchStructuredData lang={lang} />

      {/*──── page content ────*/}
      <HeroSection lang={lang} />

      <section className="intro-quicklinks">
        <Suspense fallback={null}>
          <IntroTextBox lang={lang} />
        </Suspense>
        <QuickLinksSection
          lang={lang}
          onLocationClick={handleLocationClick}
          onFacilitiesClick={handleFacilitiesClick}
        />
      </section>

      {/* External ratings confidence bar */}
      <RatingsBar lang={lang} />

      <Suspense fallback={null}>
        <CarouselSlides roomsData={roomsData} openModalForRate={openModalForRate} lang={lang} />
      </Suspense>

      <Suspense fallback={null}>
        <DestinationSlideshow lang={lang} />
      </Suspense>

      {/* Popular guides for internal linking */}
      <Section padding="none" className="mx-auto max-w-5xl px-4 pb-12">
        <h2 className="mb-3 text-xl font-semibold text-brand-heading dark:text-brand-surface">{tGuides("labels.popularGuides")}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
          <li>
            <Link
              to={`/${lang}/${getSlug("guides", lang)}/${guideSlug(lang, "onlyHostel")}`}
              prefetch="intent"
              className="block rounded-lg border border-brand-outline/40 bg-brand-bg px-4 py-3 text-brand-primary underline-offset-4 hover:underline dark:bg-brand-text dark:text-brand-secondary"
            >
              {getGuideLinkLabel(tGuides, guidesEnT, "onlyHostel")}
            </Link>
          </li>
          <li>
            <Link
              to={`/${lang}/${getSlug("guides", lang)}/${guideSlug(lang, "reachBudget")}`}
              prefetch="intent"
              className="block rounded-lg border border-brand-outline/40 bg-brand-bg px-4 py-3 text-brand-primary underline-offset-4 hover:underline dark:bg-brand-text dark:text-brand-secondary"
            >
              {getGuideLinkLabel(tGuides, guidesEnT, "reachBudget")}
            </Link>
          </li>
          <li>
            <Link
              to={`/${lang}/${getSlug("guides", lang)}/${guideSlug(lang, "pathOfTheGods")}`}
              prefetch="intent"
              className="block rounded-lg border border-brand-outline/40 bg-brand-bg px-4 py-3 text-brand-primary underline-offset-4 hover:underline dark:bg-brand-text dark:text-brand-secondary"
            >
              {getGuideLinkLabel(tGuides, guidesEnT, "pathOfTheGods")}
            </Link>
          </li>
          <li>
            <Link
              to={`/${lang}/${getSlug("guides", lang)}/${guideSlug(lang, "backpackerItineraries")}`}
              prefetch="intent"
              className="block rounded-lg border border-brand-outline/40 bg-brand-bg px-4 py-3 text-brand-primary underline-offset-4 hover:underline dark:bg-brand-text dark:text-brand-secondary"
            >
              {getGuideLinkLabel(tGuides, guidesEnT, "backpackerItineraries")}
            </Link>
          </li>
        </ul>
      </Section>
      {isDesktop ? <StickyBookNow lang={lang} /> : null}
    </Fragment>
  );
});

// Augment the hero section's preload with a smaller eager variant,
// while still emitting any shared route links.
export const links: LinksFunction = (...linkArgs) => {
  const [args] = linkArgs;
  const data = ((args as { data?: { lang?: AppLanguage } })?.data || {}) as { lang?: AppLanguage };
  const lang = data.lang || (i18nConfig.fallbackLng as AppLanguage);
  const path = `/${lang}`;

  const heroDescriptors = heroLinks(...linkArgs);
  const eagerHeroImage = buildCfImageUrl("/img/landing-xl.webp", {
    width: 960,
    quality: 85,
    format: "auto",
  });

  return [
    ...heroDescriptors,
    ...buildRouteLinks({
      lang,
      path,
      url: `${BASE_URL}${path}`,
    }),
    {
      rel: "preload",
      as: "image",
      fetchPriority: "high",
      href: eagerHeroImage,
      imageSizes: "100vw",
    } as LinkDescriptor,
  ];
};


export const meta: MetaFunction = (args) => {
  const d = (args?.data || {}) as { lang?: AppLanguage; title?: string; desc?: string };
  const lang = d.lang || (i18nConfig.fallbackLng as AppLanguage);
  const title = d.title || "";
  const description = d.desc || "";
  const path = `/${lang}`;
  const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
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
    image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
  });
};

export const headLinks = ((args?: { data?: unknown }) => {
  const d = (args?.data || {}) as { lang?: AppLanguage };
  const _lang = d.lang || (i18nConfig.fallbackLng as AppLanguage);
  void _lang;
  return buildRouteLinks();
}) satisfies LinksFunction;
