// packages/template-app/src/app/[lang]/page.tsx
"use client";

import { useTranslations } from "@acme/i18n/Translations";
import CfImage from "@acme/ui/atoms/CfImage";

import HeroBanner from "@/components/home/HeroBanner";
import ReviewsCarousel from "@/components/home/ReviewsCarousel";
import { ValueProps } from "@/components/home/ValueProps";

import { getStructuredData, serializeJsonLd } from "../../lib/seo";

export default function Home({ params }: { params: { lang: string } }) {
  const t = useTranslations();
  const showCfImageDemo = process.env.NODE_ENV !== "production";
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
      {showCfImageDemo && (
        <div style={{ maxWidth: "42rem" }}>
          <CfImage
            src="/img/cf-image-demo.svg" // i18n-exempt -- DEV-001 [ttl=2027-01-01] file path, not user-facing copy
            preset="hero"
            alt={t("home.title") as string}
          />
        </div>
      )}
    </>
  );
}
