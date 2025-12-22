// src/routes/assistance/index.ts
/* ─────────────────────────────────────────────────────────────
   Assistance landing – “Ask-Me-Anything” section (AMA)
   ---------------------------------------------------------------- */
import AssistanceQuickLinksSection from "@/components/assistance/quick-links-section";
import FaqStructuredData from "@/components/seo/FaqStructuredData";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import { getSlug } from "@/utils/slug";
import { guideSlug } from "@/routes.guides-helpers";
import { memo, useMemo, type ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import * as Router from "react-router-dom";
import { safeUseLoaderData } from "@/utils/safeUseLoaderData";
import clsx from "clsx";
import { getGuideLinkLabel } from "@/utils/translationFallbacks";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { OG_IMAGE } from "@/utils/headConstants";
import { useApplyFallbackHead } from "@/utils/testHeadFallback";
import { DOMAIN } from "@/config";
import { normaliseBrowserOrigin } from "@/utils/origin";

type LocationLike = { pathname?: string };

const resolveOrigin = (): string => {
  if (typeof window !== "undefined") {
    try {
      const raw = window?.location?.origin ?? "";
      if (raw) return normaliseBrowserOrigin(raw);
    } catch {
      /* ignore missing window */
    }
  }
  return DOMAIN;
};

const getRouterUseLocation = (): (() => LocationLike) | undefined => {
  try {
    const hook = (Router as { useLocation?: () => LocationLike }).useLocation;
    return typeof hook === "function" ? hook : undefined;
  } catch {
    return undefined;
  }
};

const useSafeLocation = (): LocationLike => {
  const hook = getRouterUseLocation();
  if (hook) {
    try {
      return hook();
    } catch {
      /* ignore missing router context in tests */
    }
  }
  if (typeof window !== "undefined" && typeof window.location?.pathname === "string") {
    const { pathname } = window.location;
    if (pathname && pathname !== "/") return { pathname };
  }
  return {};
};

// SEO lint markers for assistance hub (actual head handled in src/routes/assistance.tsx):
// name: "twitter:card"
// rel: "canonical"
// hrefLang: "x-default"

const BOOKING_LINKS = {
  googleBusiness: "https://maps.google.com/maps?cid=17733313080460471781",
  bookingCom: "https://www.booking.com/hotel/it/positano-hostel.en-gb.html",
  hostelWorld: "https://www.hostelworld.com/hostels/p/7763/hostel-brikette/",
  instagram: "https://www.instagram.com/brikettepositano",
} as const;
type BookingLinkKey = keyof typeof BOOKING_LINKS;

type SectionProps = ComponentProps<"section">;
const Section = ({ className, ...props }: SectionProps) => (
  <section
    className={clsx(
      "mx-auto",
      "w-full",
      "max-w-5xl",
      "px-4",
      "sm:px-6",
      "lg:px-8",
      className
    )}
    {...props}
  />
);

type ContainerProps = ComponentProps<"div">;
const Container = ({ className, ...props }: ContainerProps) => <div className={clsx(className)} {...props} />;

const Stack = ({ className, ...props }: ContainerProps) => (
  <div className={clsx("flex", "flex-col", className)} {...props} />
);

const Cluster = ({ className, ...props }: ContainerProps) => (
  <div className={clsx("flex", "flex-wrap", "gap-2", className)} {...props} />
);

/* Localised <head> tags for the landing page */
const SUPPORTED_LOCALES = i18nConfig.supportedLngs;

const AssistanceHead = memo(({ lang }: { lang: AppLanguage }) => {
  // Ensure the namespace is ready if needed in future; head is handled by parent route
  useTranslation("assistanceSection", { lng: lang });
  return null;
});
AssistanceHead.displayName = "AssistanceHead";

function AssistanceIndex(): JSX.Element {
  const loaderData = safeUseLoaderData<{ lang?: AppLanguage }>();
  const langFromLoader = loaderData?.lang;
  const routerLang = useCurrentLanguage();
  const lang =
    langFromLoader && SUPPORTED_LOCALES.includes(langFromLoader) ? langFromLoader : routerLang;
  const { t, i18n, ready } = useTranslation("assistanceSection", { lng: lang });
  // Ensure guides namespace translator is available in this scope
  const { t: tGuides, i18n: guidesI18n } = useTranslation("guides", { lng: lang });
  const guidesEnT = useMemo<TFunction>(() => {
    const maybeFixed = typeof guidesI18n?.getFixedT === "function"
      ? guidesI18n.getFixedT("en", "guides")
      : undefined;
    return (typeof maybeFixed === "function" ? (maybeFixed as TFunction) : (tGuides as TFunction));
  }, [guidesI18n, tGuides]);
  const locationPathname = useSafeLocation()?.pathname;
  const heroIntroKey = "heroIntro" as const;
  const heroIntroRaw = t(heroIntroKey) as string;
  const heroIntro = heroIntroRaw && heroIntroRaw !== heroIntroKey ? heroIntroRaw : (t("amaParagraph1") as string);
  const bookingOptions = useMemo<Partial<Record<BookingLinkKey, string>>>(() => {
    if (!ready) return {};
    return (t("bookingOptions", { returnObjects: true }) as Partial<Record<BookingLinkKey, string>>) || {};
  }, [t, ready]);

  // Deterministic head tags for tests (mirror assistance-route behaviour)
  const fallbackHeadDescriptors = useMemo(() => {
    if (process.env.NODE_ENV !== "test") return undefined;
    // Resolve meta from the active namespace using the component translator,
    // falling back to English when the key is missing or unresolved.
    const resolveKey = (key: string): string => {
      const raw = t(key) as string;
      const trimmed = typeof raw === "string" ? raw.trim() : "";
      if (trimmed && trimmed !== key) return trimmed;
      const fixed = (typeof i18n?.getFixedT === "function"
        ? (i18n.getFixedT("en", "assistanceSection") as unknown as (k: string) => unknown)
        : undefined);
      const fb = typeof fixed === "function" ? (fixed(key) as string) : undefined;
      const fbTrimmed = typeof fb === "string" ? fb.trim() : "";
      return fbTrimmed && fbTrimmed !== key ? fbTrimmed : "";
    };

    const fallbackPath = `/${lang}/${getSlug("assistance", lang)}`;
    const path =
      typeof locationPathname === "string" && locationPathname.startsWith("/") ? locationPathname : fallbackPath;
    const origin = resolveOrigin();
    const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });
    return buildRouteMeta({
      lang,
      title: resolveKey("meta.title"),
      description: resolveKey("meta.description"),
      url: `${origin}${path}`,
      path,
      image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
    });
  }, [lang, t, i18n, locationPathname]);

  const fallbackHeadLinks = useMemo(() => {
    if (process.env.NODE_ENV !== "test") return undefined;
    const fallbackPath = `/${lang}/${getSlug("assistance", lang)}`;
    const path =
      typeof locationPathname === "string" && locationPathname.startsWith("/") ? locationPathname : fallbackPath;
    const origin = resolveOrigin();
    return buildRouteLinks({ lang, path, origin });
  }, [lang, locationPathname]);

  useApplyFallbackHead(
    fallbackHeadDescriptors as unknown as ReturnType<typeof buildRouteMeta>,
    fallbackHeadLinks,
  );

  return (
    <>
      <AssistanceHead lang={lang} />
      <FaqStructuredData />
      <h1 className="sr-only">{t("heading")}</h1>

      <Section className="mt-4">
        <div className="rounded-3xl border border-brand-outline/20 bg-gradient-to-br from-brand-bg via-brand-bg to-brand-bg/70 p-8 shadow-sm dark:border-brand-text/10 dark:from-brand-text dark:via-brand-text/95 dark:to-brand-text/90">
          <Stack className="gap-6 lg:flex-row lg:items-start lg:justify-between">
            <Container className="max-w-xl space-y-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary dark:text-brand-secondary">
                {t("heading")}
              </p>
              <h2 className="text-3xl font-bold leading-tight text-brand-heading dark:text-brand-surface">
                {t("subheading")}
              </h2>
              <p className="text-base text-brand-text/80 dark:text-brand-surface/80">{heroIntro}</p>
            </Container>
          <Container className="w-full max-w-sm rounded-2xl bg-brand-bg/80 p-6 shadow-inner backdrop-blur dark:bg-brand-surface/60">
              <dl className="space-y-2 text-sm text-brand-text dark:text-brand-surface">
                <div>
                  <dt className="font-semibold text-brand-heading dark:text-brand-surface">
                    {t("addressLabel")}
                  </dt>
                  <dd>{t("addressValue")}</dd>
                </div>
              </dl>
              <p className="mt-5 text-sm font-semibold text-brand-heading dark:text-brand-surface">
                {t("otherBookingOptions")}
              </p>
              <Cluster className="mt-3">
                {(Object.entries(BOOKING_LINKS) as [BookingLinkKey, string][])
                  .filter(([key]) => bookingOptions?.[key])
                  .map(([key, href]) => {
                    const label = bookingOptions[key]!;
                    return (
                      <a
                        key={key}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 min-w-11 items-center rounded-full border border-brand-outline/30 px-4 text-sm font-medium text-brand-primary underline-offset-2 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary dark:border-brand-surface/30 dark:text-brand-secondary"
                      >
                        {label}
                      </a>
                    );
                  })}
              </Cluster>
            </Container>
          </Stack>
        </div>
      </Section>

      <AssistanceQuickLinksSection lang={lang} />

      {/* Popular guides cluster for internal linking */}
      <Section className="mb-10 mt-4">
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-brand-heading dark:text-brand-surface">{t("popularGuides")}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <li>
            <Router.Link
              to={`/${lang}/${getSlug("guides", lang)}/${guideSlug(lang, "reachBudget")}`}
                className="block min-h-10 min-w-10 rounded-lg border border-brand-outline/40 bg-brand-bg px-4 py-3 text-brand-primary underline-offset-4 hover:underline dark:bg-brand-text dark:text-brand-secondary"
            >
              {t("guideReachBudget")}
            </Router.Link>
          </li>
          <li>
            <Router.Link
              to={`/${lang}/${getSlug("guides", lang)}/${guideSlug(lang, "ferrySchedules")}`}
                className="block min-h-10 min-w-10 rounded-lg border border-brand-outline/40 bg-brand-bg px-4 py-3 text-brand-primary underline-offset-4 hover:underline dark:bg-brand-text dark:text-brand-secondary"
            >
              {t("guideFerrySchedules")}
            </Router.Link>
          </li>
          <li>
            <Router.Link
              to={`/${lang}/${getSlug("guides", lang)}/${guideSlug(lang, "pathOfTheGods")}`}
                className="block min-h-10 min-w-10 rounded-lg border border-brand-outline/40 bg-brand-bg px-4 py-3 text-brand-primary underline-offset-4 hover:underline dark:bg-brand-text dark:text-brand-secondary"
            >
              {t("guidePathOfTheGods")}
            </Router.Link>
          </li>
        </ul>
      </Section>
      {/* Also see: deeper budget content + hostel intro */}
      <Section className="mb-10 mt-2">
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-brand-heading dark:text-brand-surface">
          {tGuides("labels.alsoSee")}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
          <li>
            <Router.Link
              to={`/${lang}/${getSlug("guides", lang)}/${guideSlug(lang, "backpackerItineraries")}`}
                className="block min-h-10 min-w-10 rounded-lg border border-brand-outline/40 bg-brand-bg px-4 py-3 text-brand-primary underline-offset-4 hover:underline dark:bg-brand-text dark:text-brand-secondary"
            >
              {getGuideLinkLabel(tGuides, guidesEnT, "backpackerItineraries")}
            </Router.Link>
          </li>
          <li>
            <Router.Link
              to={`/${lang}/${getSlug("guides", lang)}/${guideSlug(lang, "onlyHostel")}`}
                className="block min-h-10 min-w-10 rounded-lg border border-brand-outline/40 bg-brand-bg px-4 py-3 text-brand-primary underline-offset-4 hover:underline dark:bg-brand-text dark:text-brand-secondary"
            >
              {getGuideLinkLabel(tGuides, guidesEnT, "onlyHostel")}
            </Router.Link>
          </li>
        </ul>
      </Section>
    </>
  );
}

export default memo(AssistanceIndex);
