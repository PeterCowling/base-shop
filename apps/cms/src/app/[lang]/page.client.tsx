// apps/cms/src/app/[lang]/page.tsx
"use client";

import ReviewsCarousel from "@ui";
import { ValueProps } from "@ui";
import HeroBanner from "@ui";

export default function Home() {
  return (
    <>
      <HeroBanner />
      <ValueProps />
      <ReviewsCarousel />
    </>
  );
}
