// packages/template-app/src/app/[lang]/page.tsx
"use client";

import HeroBanner from "@/components/home/HeroBanner";
import ReviewsCarousel from "@/components/home/ReviewsCarousel";
import { ValueProps } from "@/components/home/ValueProps";
import { getStructuredData, serializeJsonLd } from "../../lib/seo";
import { useTranslations } from "@i18n/Translations";

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
        type="application/ld+json" /* i18n-exempt — MIME type constant, not user-facing copy */
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <HeroBanner />
      <ValueProps />
      <ReviewsCarousel />
    </>
  );
}
