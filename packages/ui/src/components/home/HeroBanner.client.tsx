// packages/ui/src/components/home/HeroBanner.client.tsx

"use client";

import { useTranslations } from "@acme/i18n";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export type Slide = {
  src: string;
  alt: string;
  headlineKey: string;
  ctaKey: string;
};

const DEFAULT_SLIDES: Slide[] = [
  {
    src: "/hero/slide-1.jpg",
    alt: "Man wearing eco sneaker on concrete",
    headlineKey: "hero.slide1.headline",
    ctaKey: "hero.cta",
  },
  {
    src: "/hero/slide-2.jpg",
    alt: "Close-up of recycled rubber sole",
    headlineKey: "hero.slide2.headline",
    ctaKey: "hero.cta",
  },
  {
    src: "/hero/slide-3.jpg",
    alt: "Pair of sneakers on mossy rock",
    headlineKey: "hero.slide3.headline",
    ctaKey: "hero.cta",
  },
];

export default function HeroBanner({
  slides = DEFAULT_SLIDES,
}: {
  slides?: Slide[];
}) {
  const t = useTranslations();
  const rawPathname = usePathname(); // may be null
  const safePath = rawPathname ?? "/";
  const langPrefix = safePath.split("/")[1] || "en";

  const sanitizedSlides = (slides.length ? slides : DEFAULT_SLIDES).filter(
    (s) => s.src
  );
  const slideData = sanitizedSlides.length ? sanitizedSlides : DEFAULT_SLIDES;

  const [index, setIndex] = useState(0);

  const next = useCallback(
    () => setIndex((i) => (i + 1) % slideData.length),
    [slideData.length]
  );
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + slideData.length) % slideData.length),
    [slideData.length]
  );

  useEffect(() => {
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [next]);

  const slide = useMemo(() => slideData[index], [index, slideData]);

  return (
    <section className="relative h-[60vh] w-full overflow-hidden">
      <Image
        src={slide.src}
        alt={slide.alt}
        fill
        sizes="100vw"
        priority
        className="object-cover transition-opacity duration-700"
      />
      <div className="bg-fg/40 absolute inset-0" data-token="--color-fg" />

      <div
        className="text-bg absolute inset-0 flex flex-col items-center justify-center px-4 text-center"
        data-token="--color-bg"
      >
        <h2 className="mb-6 max-w-3xl text-4xl font-bold drop-shadow-md md:text-5xl">
          {t(slide.headlineKey)}
        </h2>
        {/* locale-aware route link */}
        <Link
          href={`/${langPrefix}/shop`}
          className="bg-fg hover:bg-muted inline-block rounded-full px-[calc(var(--space-4)*2)] py-3 font-semibold shadow-elevation-2 transition-colors"
          data-token="--color-fg"
        >
          <span className="text-bg" data-token="--color-bg">
            {t(slide.ctaKey)}
          </span>
        </Link>
      </div>

      {/* navigation arrows */}
      <button
        aria-label="Previous slide"
        onClick={prev}
        className="absolute top-1/2 start-[var(--space-4)] -translate-y-1/2 rounded-full p-1 bg-[hsl(var(--overlay-scrim-1))] hover:bg-[hsl(var(--overlay-scrim-2))]"
        data-token="--color-fg"
      >
        ‹
      </button>
      <button
        aria-label="Next slide"
        onClick={next}
        className="absolute top-1/2 end-[var(--space-4)] -translate-y-1/2 rounded-full p-1 bg-[hsl(var(--overlay-scrim-1))] hover:bg-[hsl(var(--overlay-scrim-2))]"
        data-token="--color-fg"
      >
        ›
      </button>
    </section>
  );
}
