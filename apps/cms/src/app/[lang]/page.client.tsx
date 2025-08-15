// apps/cms/src/app/[lang]/page.tsx
"use client";

import ReviewsCarousel from "@ui/components/home/ReviewsCarousel";
import { ValueProps } from "@ui/components/home/ValueProps";
import HeroBanner from "@ui/components/home/HeroBanner.client";

export default function Home() {
  return (
    <>
      <HeroBanner />
      <ValueProps />
      <ReviewsCarousel />
    </>
  );
}
