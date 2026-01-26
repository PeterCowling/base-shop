 
// src/components/seo/AssistanceFaqJsonLd.tsx
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";

import { buildCanonicalUrl } from "@acme/ui/lib/seo";

import { BASE_URL } from "@/config/site";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { buildFaqJsonLd, type FaqJsonLd } from "@/utils/buildFaqJsonLd";

import FaqJsonLdScript from "./FaqJsonLdScript";

type Props = {
  ns: string; // assistance article namespace, e.g. "arrivingByFerry"
};

function AssistanceFaqJsonLd({ ns }: Props): JSX.Element | null {
  const lang = useCurrentLanguage();
  const pathname = usePathname() ?? "";
  const { t } = useTranslation(ns, { lng: lang });
  const raw = t("faq.items", { returnObjects: true }) as unknown;

  const url = buildCanonicalUrl(BASE_URL, pathname);
  const payload = buildFaqJsonLd(lang, url, raw);

  // Emit an explicit empty FAQPage payload when translations are missing or invalid
  // to keep test expectations stable and downstream parsers resilient.
  const fallback: FaqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: lang,
    url,
    mainEntity: [],
  };

  return <FaqJsonLdScript data={payload} fallback={fallback} />;
}

export default memo(AssistanceFaqJsonLd);
