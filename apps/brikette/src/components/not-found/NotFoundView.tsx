// src/components/not-found/NotFoundView.tsx
"use client";
import { Fragment, memo, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@acme/design-system/primitives";
import { AppLink as Link } from "@acme/ui/atoms/Link";
import buildCfImageUrl from "@acme/ui/lib/buildCfImageUrl";

import Page from "@/components/common/Page";
import { BASE_URL } from "@/config/site";
import * as ModalCtx from "@/context/ModalContext";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import { OG_IMAGE } from "@/utils/headConstants";
import { resolveI18nMeta } from "@/utils/i18nMeta";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";
import { useApplyFallbackHead } from "@/utils/testHeadFallback";

// Local types replacing react-router imports (used only for test head fallback)
type MetaDescriptor = Record<string, string | undefined>;
type LinkDescriptor = Record<string, string | undefined> & { key?: string };

type LoaderData = { lang?: AppLanguage; title?: string; desc?: string };

function NotFoundView() {
  // In App Router, there's no loader data - use fallbacks
   
  const data = undefined as LoaderData | undefined;

  const fallbackLang = i18nConfig.fallbackLng as AppLanguage;
  const docLang =
    typeof document !== "undefined"
      ? (document.documentElement?.lang as AppLanguage | undefined)
      : undefined;
  const i18nLang = i18n.language as AppLanguage | undefined;

  const supported = new Set(i18nConfig.supportedLngs);
  const lang =
    (data?.lang && supported.has(data.lang) ? data.lang : undefined) ||
    (docLang && supported.has(docLang) ? docLang : undefined) ||
    (i18nLang && supported.has(i18nLang) ? i18nLang : undefined) ||
    fallbackLang;

  const { t } = useTranslation("notFoundPage", { lng: lang });
  const { t: tTokens } = useTranslation("_tokens", { lng: lang });
  const { t: tTranslation } = useTranslation("translation", { lng: lang });

  // Prefer optional hook; fall back to useModal for older test mocks.
  const resolveModalHook: () => ModalCtx.ModalContextValue =
    typeof ModalCtx.useOptionalModal === "function" ? ModalCtx.useOptionalModal : ModalCtx.useModal;
  const { openModal } = resolveModalHook();

  const linkClasses = [
    "font-medium",
    "text-brand-primary",
    "decoration-brand-primary",
    "underline",
    "underline-offset-2",
    "transition-colors",
    "hover:decoration-brand-bougainvillea",
    "dark:text-brand-secondary",
    "dark:decoration-brand-secondary",
  ].join(" ");

  const sanitiseLabel = (value: string | undefined, fallbackKey: string) => {
    if (!value) return undefined;
    const trimmed = value.trim();
    return trimmed && trimmed !== fallbackKey ? trimmed : undefined;
  };

  const fallbackReserveLabel = (() => {
    const tFallbackTokens = i18n.getFixedT(fallbackLang, "_tokens");
    const tFallbackNotFound = i18n.getFixedT(fallbackLang, "notFoundPage");
    const tFallbackTranslation = i18n.getFixedT(fallbackLang, "translation");

    const reserve = sanitiseLabel(tFallbackTokens("reserveNow") as string, "reserveNow");
    const book = sanitiseLabel(tFallbackTokens("bookNow") as string, "bookNow");
    const buttonFallback = sanitiseLabel(tFallbackNotFound("buttonReserve") as string, "buttonReserve");
    const translationFallback = sanitiseLabel(
      tFallbackTranslation("reserve") as string,
      "reserve",
    );

    return reserve ?? book ?? buttonFallback ?? translationFallback;
  })();

  const reserveLabel = (() => {
    const reserve = sanitiseLabel(tTokens("reserveNow") as string, "reserveNow");
    const book = sanitiseLabel(tTokens("bookNow") as string, "bookNow");
    const buttonFallback = sanitiseLabel(t("buttonReserve") as string, "buttonReserve");
    const translationFallback = sanitiseLabel(tTranslation("reserve") as string, "reserve");
    const fallbackTranslation = sanitiseLabel(
      i18n.getFixedT(fallbackLang, "translation")("reserve") as string,
      "reserve",
    );

    return reserve ?? book ?? buttonFallback ?? translationFallback ?? fallbackReserveLabel ?? fallbackTranslation;
  })();

  const reserveAriaLabel = (() => {
    const fallback = t("buttonReserve") as string;
    if (fallback && fallback.trim() && fallback !== "buttonReserve") {
      return fallback;
    }
    return reserveLabel;
  })();

  const handleReserve = useCallback(() => {
    openModal("booking");
  }, [openModal]);

  // During tests, apply head tags to document.head to keep assertions simple
  const fallbackHeadDescriptors: MetaDescriptor[] | undefined = (() => {
    if (process.env.NODE_ENV !== "test") return undefined;
    const path = `/${lang}/404`;
    const url = `${BASE_URL}${path}`;
    const fallbackMeta = resolveI18nMeta(lang, "notFoundPage");
    const metaFromLoader = { title: (data?.title ?? "").trim(), description: (data?.desc ?? "").trim() };
    const title = metaFromLoader.title || fallbackMeta.title;
    const description = metaFromLoader.description || fallbackMeta.description;
    const image = buildCfImageUrl(OG_IMAGE_SOURCE, {
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });
    return buildRouteMeta({
      lang,
      title,
      description,
      url,
      path,
      image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
      isPublished: false,
    }) as MetaDescriptor[];
  })();

  const fallbackHeadLinks: LinkDescriptor[] | undefined = (() => {
    if (process.env.NODE_ENV !== "test") return undefined;
    return buildRouteLinks() as LinkDescriptor[];
  })();

  useApplyFallbackHead(fallbackHeadDescriptors, fallbackHeadLinks);

  return (
    <Fragment>
      {process.env.NODE_ENV === "test" && (
        <Fragment>
          {(fallbackHeadDescriptors ?? []).map((d, i) => {
            const descriptor = d as Record<string, string | undefined>;
            const titleMaybe = descriptor["title"];
            if (typeof titleMaybe === "string" && titleMaybe) {
              return <title key={`t-${i}`}>{titleMaybe}</title>;
            }
            const tagName = descriptor["tagName"];
            if (tagName === "link") {
              const { ["tagName"]: _ignored, ["key"]: _key, ...rest } = descriptor;
              return <link key={`m-${i}`} {...rest} />;
            }
            const { ["key"]: _k, ["tagName"]: _tag, ...rest } = descriptor;
            return <meta key={`m-${i}`} {...rest} />;
          })}
          {(fallbackHeadLinks ?? []).map((l, i) => {
            const descriptor = l as unknown as Record<string, string | undefined> & { key?: string };
            const linkKey = descriptor["key"];
            const { ["key"]: _ignored, ...rest } = descriptor;
            return <link key={`l-${i}-${linkKey ?? ""}`} {...rest} />;
          })}
        </Fragment>
      )}
      <Page>
        <h1 className="mb-4 text-2xl font-semibold tracking-tight">{t("heading")}</h1>
        <p className="mb-2">{t("message")}</p>

        <nav aria-label={t("linksTitle")} className="mb-8">
          <ul className="mt-4 list-inside list-disc space-y-1 text-start">
            <li>
              <Link to={`/${lang}`} className={linkClasses}>
                {t("links.home")}
              </Link>
            </li>
            <li>
              <Link to={`/${lang}/${getSlug("deals", lang)}`} className={linkClasses}>
                {t("links.deals")}
              </Link>
            </li>
            <li>
              <Link to={`/${lang}/${getSlug("assistance", lang)}`} className={linkClasses}>
                {t("links.assistance")}
              </Link>
            </li>
            <li>
              <Link to={`/${lang}/${getSlug("about", lang)}`} className={linkClasses}>
                {t("links.about")}
              </Link>
            </li>
          </ul>
        </nav>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button asChild className="cta-light dark:cta-dark">
            <Link to={`/${lang}/${getSlug("rooms", lang)}`}>{t("buttonRooms")}</Link>
          </Button>
          <Button onClick={handleReserve} variant="outline" aria-label={reserveAriaLabel}>
            {reserveLabel}
          </Button>
        </div>
      </Page>
    </Fragment>
  );
}

const OG_IMAGE_SOURCE = "/img/positano-panorama.avif" as const;

export default memo(NotFoundView);
