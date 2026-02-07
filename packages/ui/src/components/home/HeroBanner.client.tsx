// packages/ui/src/components/home/HeroBanner.client.tsx

"use client"; // i18n-exempt -- PB-123 Next.js directive, not user-facing copy [ttl=2025-12-31]

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useTranslations } from "@acme/i18n";

export type Slide = {
  src: string;
  /** i18n key for alt text. Prefer keys; falls back to alt */
  altKey?: string;
  /** Fallback alt when key not provided */
  alt?: string; // i18n-exempt: fallback only used in dev/mock
  headlineKey: string;
  ctaKey: string;
};

const DEFAULT_SLIDES: Slide[] = [
  {
    src: "/hero/slide-1.jpg",
    altKey: "hero.slide1.alt",
    // Provide human-readable fallback so tests and non-localized
    // environments expose accessible text instead of the i18n key.
    alt: "Man wearing eco sneaker on concrete", // i18n-exempt -- PB-000: fallback alt used only in non-localized/test environments
    headlineKey: "hero.slide1.headline",
    ctaKey: "hero.cta",
  },
  {
    src: "/hero/slide-2.jpg",
    altKey: "hero.slide2.alt",
    alt: "Close-up of recycled rubber sole", // i18n-exempt -- PB-000: fallback alt used only in non-localized/test environments
    headlineKey: "hero.slide2.headline",
    ctaKey: "hero.cta",
  },
  {
    src: "/hero/slide-3.jpg",
    altKey: "hero.slide3.alt",
    alt: "Pair of sneakers on mossy rock", // i18n-exempt -- PB-000: fallback alt used only in non-localized/test environments
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
  const prevLabel = t("hero.nav.prev") as string;
  const nextLabel = t("hero.nav.next") as string;

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
    const timer = setInterval(next, 6000);
    return () => {
      if (typeof globalThis.clearInterval === "function") {
        globalThis.clearInterval(timer);
      }
    };
  }, [next]);

  const slide = useMemo(() => slideData[index], [index, slideData]);

  // Prefer localized alt text when available; fall back to provided
  // human-readable alt if the translation function returns the key.
  const resolvedAlt = useMemo(() => {
    if (slide.altKey) {
      const translated = t(slide.altKey) as string;
      return translated !== slide.altKey ? translated : slide.alt ?? "";
    }
    return slide.alt ?? "";
  }, [slide.alt, slide.altKey, t]);

  return (
    <section className="relative w-full overflow-hidden min-h-dvh">
      <Image
        src={slide.src}
        alt={resolvedAlt}
        fill
        /* i18n-exempt -- PB-123 non-user-facing media sizes [ttl=2025-12-31] */
        sizes="100vw"
        priority
        className="object-cover transition-opacity duration-700" /* i18n-exempt -- PB-123 class names [ttl=2025-12-31] */
      />
      <div
        className="bg-fg/40 absolute inset-0" /* i18n-exempt -- PB-123 class names [ttl=2025-12-31] */
        /* i18n-exempt -- PB-123 design token attribute [ttl=2025-12-31] */
        data-token="--color-fg"
      />

      <div
        className="text-bg absolute inset-0 flex flex-col items-center justify-center px-4 text-center" /* i18n-exempt -- PB-123 class names [ttl=2025-12-31] */
        /* i18n-exempt -- PB-123 design token attribute [ttl=2025-12-31] */
        data-token="--color-bg"
      >
        <h2 className="mb-6 text-4xl font-bold drop-shadow-md md:text-5xl">
          {t(slide.headlineKey)}
        </h2>
        {/* locale-aware route link */}
        <Link
          href={`/${langPrefix}/shop`}
          className="bg-fg hover:bg-muted inline-block rounded-full px-8 py-3 font-semibold shadow-elevation-2 transition-colors" /* i18n-exempt -- PB-123 class names [ttl=2025-12-31] */
          /* i18n-exempt -- PB-123 design token attribute [ttl=2025-12-31] */
          data-token="--color-fg"
        >
          <span className="text-bg" /* i18n-exempt -- PB-123 class names [ttl=2025-12-31] */ data-token="--color-bg">
            {t(slide.ctaKey)}
          </span>
        </Link>
      </div>

      {/* navigation arrows */}
      <button
        aria-label={prevLabel}
        onClick={prev}
        className="absolute top-1/2 start-4 -translate-y-1/2 rounded-full bg-surface-2/60 hover:bg-surface-2/80 inline-flex items-center justify-center min-h-11 min-w-11 text-2xl" /* i18n-exempt -- PB-123 class names [ttl=2025-12-31] */
        /* i18n-exempt -- PB-123 design token attribute [ttl=2025-12-31] */
        data-token="--color-fg"
      >
        <span aria-hidden="true">{/* i18n-exempt: decorative glyph */}‹</span>
      </button>
      <button
        aria-label={nextLabel}
        onClick={next}
        className="absolute top-1/2 end-4 -translate-y-1/2 rounded-full bg-surface-2/60 hover:bg-surface-2/80 inline-flex items-center justify-center min-h-11 min-w-11 text-2xl" /* i18n-exempt -- PB-123 class names [ttl=2025-12-31] */
        /* i18n-exempt -- PB-123 design token attribute [ttl=2025-12-31] */
        data-token="--color-fg"
      >
        <span aria-hidden="true">{/* i18n-exempt: decorative glyph */}›</span>
      </button>
    </section>
  );
}
