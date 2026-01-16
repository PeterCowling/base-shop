// apps/cms/src/app/[lang]/page.tsx
"use client";

import ReviewsCarousel from "@acme/ui/components/home/ReviewsCarousel";
import { ValueProps } from "@acme/ui/components/home/ValueProps";
import HeroBanner from "@acme/ui/components/home/HeroBanner.client";

export default function Home() {
  return (
    <>
      <HeroBanner />
      <ValueProps />
      <ReviewsCarousel />
    </>
  );
}
