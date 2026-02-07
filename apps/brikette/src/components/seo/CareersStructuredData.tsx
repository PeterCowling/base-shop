"use client";
 
// src/components/seo/CareersStructuredData.tsx
import { memo } from "react";
import { useTranslation } from "react-i18next";

import { BASE_URL } from "@/config/site";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import type { AppLanguage } from "@/i18n.config";
import { buildHotelNode,WEBSITE_ID } from "@/utils/schema";
import { getSlug } from "@/utils/slug";
import { serializeJsonLdValue } from "@/utils/seo/jsonld";

type Props = {
  lang?: AppLanguage;
  datePosted?: string;
  validThrough?: string;
};

function CareersStructuredData({ lang, datePosted, validThrough }: Props): JSX.Element {
  const fallbackLang = useCurrentLanguage();
  const activeLang = lang ?? fallbackLang;
  const pageUrl = `${BASE_URL}/${activeLang}/${getSlug("careers", activeLang)}`;
  const { t } = useTranslation(undefined, { lng: activeLang });

  const { sameAs } = buildHotelNode();
  const json = serializeJsonLdValue({
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "@id": `${pageUrl}#job`,
    url: pageUrl,
    inLanguage: activeLang,
    isPartOf: { "@id": WEBSITE_ID },
    mainEntityOfPage: pageUrl,
    title: t("careers.jobTitle"),
    description: t("careers.jobDescription"),
    ...(datePosted ? { datePosted } : {}),
    ...(validThrough ? { validThrough } : {}),
    directApply: true,
    employmentType: ["FULL_TIME", "PART_TIME"],
    hiringOrganization: {
      "@type": "Organization",
      name: "Hostel Brikette",
      url: BASE_URL,
      sameAs,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Positano",
        addressRegion: "SA",
        addressCountry: "IT",
      },
    },
  });

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export default memo(CareersStructuredData);
