// packages/template-app/src/app/[lang]/page.tsx
"use client";

import HeroBanner from "@ui";
import ReviewsCarousel from "@ui";
import { ValueProps } from "@ui";

export default function Home() {
  return (
    <>
      <HeroBanner />
      <ValueProps />
      <ReviewsCarousel />
    </>
  );
}
