// apps/cms/src/app/[lang]/page.tsx
"use client";

import HeroBanner from "@acme/ui/components/home/HeroBanner.client";
import ReviewsCarousel from "@acme/ui/components/home/ReviewsCarousel";
import { ValueProps } from "@acme/ui/components/home/ValueProps";

export default function Home() {
  return (
    <>
      <HeroBanner />
      <ValueProps />
      <ReviewsCarousel />
    </>
  );
}
