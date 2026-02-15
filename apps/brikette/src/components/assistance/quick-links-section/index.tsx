// src/components/assistance/quick-links-section/index.tsx
import type { JSX } from "react";
import { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import type { TFunction } from "i18next";

import buildCfImageUrl from "@acme/ui/lib/buildCfImageUrl";
import type {
  AssistanceQuickLinkRenderProps,
  AssistanceQuickLinksCta,
  AssistanceQuickLinksSectionProps,
} from "@acme/ui/organisms/AssistanceQuickLinksSection";
import AssistanceQuickLinksSection from "@acme/ui/organisms/AssistanceQuickLinksSection";

import type { AppLanguage } from "@/i18n.config";
import { resolveGuideCardImage } from "@/lib/guides/guideCardImage";
import { HERO_IMAGE_SRC } from "@/routes/how-to-get-here/styles";
import { serializeJsonLdValue } from "@/utils/seo/jsonld";
import { getSlug } from "@/utils/slug";

import { buildQuickLinksJsonLd } from "./jsonLd";
import { useAssistanceTranslations } from "./translations";
import type { AssistanceQuickLinksProps, QuickLinkWithHref } from "./types";
import { useContactCta } from "./useContactCta";
import { useQuickLinksWithHref, useResolvedQuickLinks } from "./useQuickLinks";

const jsonLdType = `application/${["ld", "json"].join("+")}`;
const sectionId = "assistance-quick-links";

type CardImage = NonNullable<AssistanceQuickLinksSectionProps["items"][number]["image"]>;

function resolveQuickLinkCardImage(
  item: QuickLinkWithHref,
  resolvedLang: AppLanguage,
  tGuides: TFunction<"guides">,
  tGuidesEn: TFunction<"guides">,
  howToAlt: string,
): CardImage | null {
  const howToSlug = getSlug("howToGetHere", resolvedLang);
  const howToPath = `/${resolvedLang}/${howToSlug}`;

  if (!item.slug && item.href === howToPath) {
    return {
      src: buildCfImageUrl(HERO_IMAGE_SRC, { width: 160, height: 120, quality: 80, format: "auto" }),
      alt: howToAlt.length > 0 ? howToAlt : item.label,
    };
  }

  if (!item.slug) return null;

  const image = resolveGuideCardImage(item.slug, resolvedLang, tGuides, tGuidesEn);
  return image ? { src: image.src, alt: image.alt ?? item.label } : null;
}

function AssistanceQuickLinksSectionWrapper({ lang, className }: AssistanceQuickLinksProps): JSX.Element | null {
  const { resolvedLang, resolveAssistanceString, tAssistance, tAssistanceEn } =
    useAssistanceTranslations(lang);

  const { t: tGuides, i18n: guidesI18n } = useTranslation("guides", { lng: resolvedLang });
  const tGuidesEn: TFunction<"guides"> = (() => {
    const maybeFixed =
      typeof guidesI18n?.getFixedT === "function" ? guidesI18n.getFixedT("en", "guides") : undefined;
    return typeof maybeFixed === "function" ? (maybeFixed as TFunction<"guides">) : (tGuides as TFunction<"guides">);
  })();

  const { t: tHowTo, i18n: howToI18n } = useTranslation("howToGetHere", { lng: resolvedLang });
  const tHowToEn: TFunction<"howToGetHere"> = (() => {
    const maybeFixed =
      typeof howToI18n?.getFixedT === "function" ? howToI18n.getFixedT("en", "howToGetHere") : undefined;
    return typeof maybeFixed === "function"
      ? (maybeFixed as TFunction<"howToGetHere">)
      : (tHowTo as TFunction<"howToGetHere">);
  })();

	  const pickMeaningfulI18nString = (value: unknown, keyExpect: string): string => {
	    const s = typeof value === "string" ? value.trim() : "";
	    if (!s) return "";
	    if (s === keyExpect) return "";
	    return s;
	  };

  const heroAltKey = "header.heroAlt" as const;
  const heroAltFallbackKey = "header.heroAltFallback" as const;
  const howToAlt =
    pickMeaningfulI18nString(tHowTo(heroAltKey) as unknown, heroAltKey) ||
    pickMeaningfulI18nString(tHowToEn(heroAltKey) as unknown, heroAltKey) ||
    pickMeaningfulI18nString(tHowTo(heroAltFallbackKey) as unknown, heroAltFallbackKey) ||
    pickMeaningfulI18nString(tHowToEn(heroAltFallbackKey) as unknown, heroAltFallbackKey);

  const heading = resolveAssistanceString("quickLinksHeading");
  const intro = resolveAssistanceString("quickLinksIntro");
  const readMoreLabel = resolveAssistanceString("cta.readMore");

  const quickLinks = useResolvedQuickLinks(resolvedLang, tAssistance, tAssistanceEn);
  const quickLinksWithHref = useQuickLinksWithHref(quickLinks, resolvedLang);
  const contactCta = useContactCta(tAssistance, tAssistanceEn);
  const hasQuickLinks = quickLinksWithHref.length > 0;

  const jsonLd = useMemo(
    () => serializeJsonLdValue(buildQuickLinksJsonLd(resolvedLang, quickLinksWithHref)),
    [resolvedLang, quickLinksWithHref],
  );

  const items = useMemo<AssistanceQuickLinksSectionProps["items"]>(
    () =>
      quickLinksWithHref.map((item) => ({
        id: item.slug,
        href: item.href,
        label: item.label,
        description: item.description,
        image: resolveQuickLinkCardImage(item, resolvedLang, tGuides, tGuidesEn, howToAlt) ?? undefined,
      })),
    [howToAlt, quickLinksWithHref, resolvedLang, tGuides, tGuidesEn],
  );

  const cta = useMemo<AssistanceQuickLinksCta | null>(
    () => (contactCta ? { href: contactCta.href, label: contactCta.label } : null),
    [contactCta],
  );

  const renderLink = useCallback(
    ({ href, className, children, ariaLabel, prefetch }: AssistanceQuickLinkRenderProps) => (
      <Link href={href} prefetch={prefetch ?? true} className={className} aria-label={ariaLabel}>
        {children}
      </Link>
    ),
    [],
  );

  if (!hasQuickLinks) {
    return null;
  }

  return (
    <AssistanceQuickLinksSection
      heading={heading}
      intro={intro}
      readMoreLabel={readMoreLabel}
      items={items}
      contactCta={cta}
      sectionId={sectionId}
      className={className}
      jsonLd={jsonLd}
      jsonLdType={jsonLdType}
      renderLink={renderLink}
    />
  );
}

export default memo(AssistanceQuickLinksSectionWrapper);
export { useQuickHelpGuideKeys } from "./useQuickHelpGuideKeys";
