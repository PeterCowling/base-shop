// packages/template-app/src/app/[lang]/page.tsx
"use client";

import HeroBanner from "@/components/home/HeroBanner";
import ReviewsCarousel from "@/components/home/ReviewsCarousel";
import { ValueProps } from "@/components/home/ValueProps";
import { getStructuredData, serializeJsonLd } from "../../lib/seo";

export default function Home({ params }: { params: { lang: string } }) {
  const jsonLd = getStructuredData({
    type: "WebPage",
    name: "Home",
    url: `/${params.lang}`,
  });
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <HeroBanner />
      <ValueProps />
      <ReviewsCarousel />
    </>
  );
}
