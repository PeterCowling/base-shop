/* eslint-disable ds/no-hardcoded-copy -- SEO-315 [ttl=2026-12-31] Schema.org structured data literals are non-UI. */
// src/components/seo/AssistanceFaqJsonLd.tsx
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";

import { BASE_URL } from "@/config/site";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { buildFaqJsonLd } from "@/utils/buildFaqJsonLd";

type Props = {
  ns: string; // assistance article namespace, e.g. "arrivingByFerry"
};

function AssistanceFaqJsonLd({ ns }: Props): JSX.Element | null {
  const lang = useCurrentLanguage();
  const pathname = usePathname() ?? "";
  const { t } = useTranslation(ns, { lng: lang });
  const raw = t("faq.items", { returnObjects: true }) as unknown;

  const url = useMemo(() => `${BASE_URL}${pathname}`, [pathname]);
  const payload = useMemo(() => buildFaqJsonLd(lang, url, raw), [lang, raw, url]);

  // Emit an explicit empty FAQPage payload when translations are missing or invalid
  // to keep test expectations stable and downstream parsers resilient.
  const content = payload && payload.length > 0
    ? payload
    : JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        inLanguage: lang,
        url,
        mainEntity: [],
      });

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: content }} />;
}

export default memo(AssistanceFaqJsonLd);
