// src/components/seo/BookPageStructuredData.tsx
// Composite JSON-LD for /book page: Hostel + FAQPage + BreadcrumbList
"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { BASE_URL } from "@/config/site";
import type { AppLanguage } from "@/i18n.config";
import { buildFaqJsonLd } from "@/utils/buildFaqJsonLd";
import { buildBreadcrumbList } from "@/utils/seo/jsonld";

import BookStructuredData from "./BookStructuredData";
import FaqJsonLdScript from "./FaqJsonLdScript";

interface BookPageStructuredDataProps {
  lang: AppLanguage;
}

export default function BookPageStructuredData({ lang }: BookPageStructuredDataProps): JSX.Element {
  const { t: tFaq } = useTranslation("faq", { lng: lang });

  const pageUrl = `${BASE_URL}/${lang}/book`;

  const faqData = useMemo(() => {
    const raw = tFaq("items", { returnObjects: true });
    return buildFaqJsonLd(lang, pageUrl, raw);
  }, [lang, pageUrl, tFaq]);

  const breadcrumbData = useMemo(
    () =>
      buildBreadcrumbList({
        lang,
        items: [
          { name: "Hostel Brikette", item: `${BASE_URL}/${lang}` },
          { name: "Book Direct", item: pageUrl },
        ],
      }),
    [lang, pageUrl],
  );

  return (
    <>
      <BookStructuredData lang={lang} />
      <FaqJsonLdScript data={faqData} />
      <FaqJsonLdScript data={breadcrumbData} />
    </>
  );
}
