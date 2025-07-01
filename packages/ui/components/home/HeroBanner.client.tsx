// src/components/home/HeroBanner.tsx
"use client";

import { useTranslations } from "@/i18n/Translations";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type Slide = {
  src: string;
  alt: string;
  headlineKey: string;
  ctaKey: string;
};

const SLIDES: Slide[] = [
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

export default function HeroBanner() {
  const t = useTranslations();
  const pathname = usePathname(); // e.g. "/en" or "/en/shop"
  const langPrefix = pathname.split("/")[1] || "en";

  const [index, setIndex] = useState(0);

  // memoised handlers
  const next = useCallback(() => setIndex((i) => (i + 1) % SLIDES.length), []);
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length),
    []
  );

  // auto-advance
  useEffect(() => {
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [next]);

  const slide = useMemo(() => SLIDES[index], [index]);

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
      <div className="absolute inset-0 bg-black/40" />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-white">
        {" "}
        <h2 className="mb-6 max-w-3xl text-4xl font-bold drop-shadow-md md:text-5xl">
          {t(slide.headlineKey)}
        </h2>
        {/* locale-aware route link */}
        <Link
          href={`/${langPrefix}/shop`}
          className="inline-block rounded-full bg-white px-[calc(var(--space-4)*2)] py-3 font-semibold text-gray-900 shadow-lg transition-colors hover:bg-gray-100"
        >
          {t(slide.ctaKey)}
        </Link>
      </div>

      {/* navigation arrows */}
      <button
        aria-label="Previous slide"
        onClick={prev}
        className="absolute top-1/2 left-[var(--space-4)] -translate-y-1/2 rounded-full bg-black/50 p-1 hover:bg-black/70"
      >
        ‹
      </button>
      <button
        aria-label="Next slide"
        onClick={next}
        className="absolute top-1/2 right-[var(--space-4)] -translate-y-1/2 rounded-full bg-black/50 p-1 hover:bg-black/70"
      >
        ›
      </button>
    </section>
  );
}
