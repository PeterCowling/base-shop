// packages/ui/src/components/home/HeroBanner.client.tsx

"use client"; // i18n-exempt -- PB-123 Next.js directive, not user-facing copy [ttl=2025-12-31]

import { useTranslations } from "@acme/i18n";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

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
    headlineKey: "hero.slide1.headline",
    ctaKey: "hero.cta",
  },
  {
    src: "/hero/slide-2.jpg",
    altKey: "hero.slide2.alt",
    headlineKey: "hero.slide2.headline",
    ctaKey: "hero.cta",
  },
  {
    src: "/hero/slide-3.jpg",
    altKey: "hero.slide3.alt",
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
    <section className="relative w-full overflow-hidden min-h-dvh">
      <Image
        src={slide.src}
        alt={slide.altKey ? (t(slide.altKey) as string) : slide.alt ?? ""}
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
        aria-label={t("hero.nav.prev") as string}
        onClick={prev}
        className="absolute top-1/2 start-4 -translate-y-1/2 rounded-full bg-surface-2/60 hover:bg-surface-2/80 inline-flex items-center justify-center min-h-10 min-w-10 text-2xl" /* i18n-exempt -- PB-123 class names [ttl=2025-12-31] */
        /* i18n-exempt -- PB-123 design token attribute [ttl=2025-12-31] */
        data-token="--color-fg"
      >
        <span aria-hidden="true">{/* i18n-exempt: decorative glyph */}‹</span>
      </button>
      <button
        aria-label={t("hero.nav.next") as string}
        onClick={next}
        className="absolute top-1/2 end-4 -translate-y-1/2 rounded-full bg-surface-2/60 hover:bg-surface-2/80 inline-flex items-center justify-center min-h-10 min-w-10 text-2xl" /* i18n-exempt -- PB-123 class names [ttl=2025-12-31] */
        /* i18n-exempt -- PB-123 design token attribute [ttl=2025-12-31] */
        data-token="--color-fg"
      >
        <span aria-hidden="true">{/* i18n-exempt: decorative glyph */}›</span>
      </button>
    </section>
  );
}
