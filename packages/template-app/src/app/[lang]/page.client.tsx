// packages/template-app/src/app/[lang]/page.tsx
"use client";

import { HeroBanner, ReviewsCarousel, ValueProps } from "@ui";

export default function Home() {
  return (
    <>
      <HeroBanner />
      <ValueProps />
      <ReviewsCarousel />
    </>
  );
}
