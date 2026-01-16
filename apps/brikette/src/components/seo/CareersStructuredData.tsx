// src/components/seo/CareersStructuredData.tsx
import { BASE_URL } from "@/config/site";
import { WEBSITE_ID, buildHotelNode } from "@/utils/schema";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { getSlug } from "@/utils/slug";
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { AppLanguage } from "@/i18n.config";

function CareersStructuredData({ lang }: { lang?: AppLanguage }): JSX.Element {
  const fallbackLang = useCurrentLanguage();
  const activeLang = lang ?? fallbackLang;
  const pageUrl = `${BASE_URL}/${activeLang}/${getSlug("careers", activeLang)}`;
  const { t } = useTranslation(undefined, { lng: activeLang });

  const json = useMemo(() => {
    const { sameAs } = buildHotelNode();
    const data = {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      "@id": `${pageUrl}#job`,
      url: pageUrl,
      inLanguage: activeLang,
      isPartOf: { "@id": WEBSITE_ID },
      mainEntityOfPage: pageUrl,
      title: t("careers.jobTitle"),
      description: t("careers.jobDescription"),
      datePosted: "2025-01-01",
      validThrough: "2026-01-01",
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
    };

    return JSON.stringify(data);
  }, [t, activeLang, pageUrl]);

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export default memo(CareersStructuredData);
