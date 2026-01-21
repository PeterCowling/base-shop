// packages/template-app/src/app/[lang]/page.tsx
"use client";

import { useTranslations } from "@acme/i18n/Translations";

import HeroBanner from "@/components/home/HeroBanner";
import ReviewsCarousel from "@/components/home/ReviewsCarousel";
import { ValueProps } from "@/components/home/ValueProps";

import { getStructuredData, serializeJsonLd } from "../../lib/seo";

export default function Home({ params }: { params: { lang: string } }) {
  const t = useTranslations();
  const jsonLd = getStructuredData({
    type: "WebPage",
    name: t("home.title") as string,
    url: `/${params.lang}`,
  });
  return (
    <>
      <script
        type="application/ld+json" /* i18n-exempt -- ABC-123 [ttl=2025-12-31] MIME type constant, not user-facing copy */
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <HeroBanner />
      <ValueProps />
      <ReviewsCarousel />
    </>
  );
}
