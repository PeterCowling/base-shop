// src/components/assistance/quick-links-section/index.tsx
import type { JSX } from "react";
import { memo, useCallback, useMemo } from "react";
import Link from "next/link";

import AssistanceQuickLinksSection from "@acme/ui/organisms/AssistanceQuickLinksSection";
import type {
  AssistanceQuickLinkRenderProps,
  AssistanceQuickLinksCta,
  AssistanceQuickLinksSectionProps,
} from "@acme/ui/organisms/AssistanceQuickLinksSection";

import { buildQuickLinksJsonLd } from "./jsonLd";
import { useAssistanceTranslations } from "./translations";
import type { AssistanceQuickLinksProps } from "./types";
import { useContactCta } from "./useContactCta";
import { useQuickLinksWithHref, useResolvedQuickLinks } from "./useQuickLinks";
import { serializeJsonLdValue } from "@/utils/seo/jsonld";

const jsonLdType = `application/${["ld", "json"].join("+")}`;
const sectionId = "assistance-quick-links";

function AssistanceQuickLinksSectionWrapper({ lang }: AssistanceQuickLinksProps): JSX.Element | null {
  const { resolvedLang, resolveAssistanceString, tAssistance, tAssistanceEn } =
    useAssistanceTranslations(lang);

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
      })),
    [quickLinksWithHref],
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
      jsonLd={jsonLd}
      jsonLdType={jsonLdType}
      renderLink={renderLink}
    />
  );
}

export default memo(AssistanceQuickLinksSectionWrapper);
