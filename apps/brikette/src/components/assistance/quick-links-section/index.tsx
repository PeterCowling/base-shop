// src/components/assistance/quick-links-section/index.tsx
import type { JSX } from "react";
import { memo, useCallback, useMemo } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

import AssistanceQuickLinksSection from "@acme/ui/organisms/AssistanceQuickLinksSection";
import type {
  AssistanceQuickLinkRenderProps,
  AssistanceQuickLinksCta,
  AssistanceQuickLinksSectionProps,
} from "@acme/ui/organisms/AssistanceQuickLinksSection";
import buildCfImageUrl from "@acme/ui/lib/buildCfImageUrl";

import { buildQuickLinksJsonLd } from "./jsonLd";
import { useAssistanceTranslations } from "./translations";
import type { AssistanceQuickLinksProps } from "./types";
import { useContactCta } from "./useContactCta";
import { useQuickLinksWithHref, useResolvedQuickLinks } from "./useQuickLinks";
import { serializeJsonLdValue } from "@/utils/seo/jsonld";
import type { QuickLinkWithHref } from "./types";
import { HERO_IMAGE_SRC } from "@/routes/how-to-get-here/styles";
import { getSlug } from "@/utils/slug";
import type { AppLanguage } from "@/i18n.config";
import { resolveGuideCardImage } from "@/lib/guides/guideCardImage";

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
      alt: howToAlt || "Stone steps leading to Hostel Brikette",
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

  const { t: tHowTo } = useTranslation("howToGetHere", { lng: resolvedLang });
  const howToAlt = tHowTo("header.heroAlt", { defaultValue: "Stone steps framed by bougainvillea" }) as string;

  const heading = resolveAssistanceString("quickLinksHeading");
  const intro = resolveAssistanceString("quickLinksIntro");
  const readMoreLabel = resolveAssistanceString("cta.readMore");

  const quickLinks = useResolvedQuickLinks(resolvedLang, tAssistance, tAssistanceEn);
  const quickLinksWithHref = useQuickLinksWithHref(quickLinks, resolvedLang);
  const contactCta = useContactCta(tAssistance, tAssistanceEn);

  if (quickLinksWithHref.length === 0) {
    return null;
  }

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
