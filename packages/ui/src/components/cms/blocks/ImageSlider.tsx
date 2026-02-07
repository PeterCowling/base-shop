"use client";
import { useId, useState } from "react";
import NextImage from "next/image";

import { useTranslations } from "@acme/i18n";
import type { Locale } from "@acme/i18n/locales";
import { resolveText } from "@acme/i18n/resolveText";
import type { TranslatableText } from "@acme/types/i18n";

export type ImageSlide = {
  src: string;
  alt?: TranslatableText;
  caption?: TranslatableText;
};

interface Props {
  slides?: ImageSlide[];
  minItems?: number;
  maxItems?: number;
  openInLightbox?: boolean;
  id?: string;
  locale?: Locale;
}

export default function ImageSlider({
  slides = [],
  minItems,
  maxItems,
  openInLightbox,
  id,
  locale = "en",
}: Props) {
  const t = useTranslations() as unknown as (key: string, params?: Record<string, unknown>) => string;
  const list = slides.slice(0, maxItems ?? slides.length);
  const [index, setIndex] = useState(0);
  const fallbackId = useId();
  const group = id ?? fallbackId;

  if (!list.length || list.length < (minItems ?? 0)) return null;

  const next = () => setIndex((i) => (i + 1) % list.length);
  const prev = () => setIndex((i) => (i - 1 + list.length) % list.length);
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") next();
    else if (e.key === "ArrowLeft") prev();
  };

  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- DS-0007: Carousel region handles ArrowLeft/ArrowRight keys for better UX */}
      <div
        className="relative"
        data-lightbox-root={openInLightbox ? group : undefined}
        role="region"
        aria-roledescription="carousel"
        aria-label={t("Image Slider") as string}
        tabIndex={0}
        onKeyDown={handleKey}
      >
      {list.map((img, i) => (
        <figure
          key={img.src}
          className={i === index ? "block" : "hidden"}
          aria-hidden={i !== index}
        >
          {(() => {
            const alt = typeof img.alt === "string" ? img.alt : img.alt ? resolveText(img.alt, locale, t) : "";
            const cap = typeof img.caption === "string" ? img.caption : img.caption ? resolveText(img.caption, locale, t) : "";
            return openInLightbox ? (
              <a href={img.src} data-lightbox data-lightbox-group={group} aria-label={cap || alt || undefined}>
                <NextImage src={img.src} alt={alt} width={1600} height={900} className="w-full object-cover" role="img" />
              </a>
            ) : (
              <NextImage src={img.src} alt={alt} width={1600} height={900} className="w-full object-cover" role="img" />
            );
          })()}
          {(img.caption && (
            <figcaption className="text-center text-sm" aria-live="polite">
              {typeof img.caption === "string" ? img.caption : resolveText(img.caption, locale, t)}
            </figcaption>
          ))}
        </figure>
      ))}
      {list.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label={t("Previous slide") as string}
            className="absolute start-2 top-1/2 -translate-y-1/2 rounded p-2 min-h-10 min-w-10 bg-surface-2/60 hover:bg-surface-2/80"
            data-token="--color-fg"
          >
            <span className="text-bg" data-token="--color-bg">‹</span>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label={t("Next slide") as string}
            className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-2 min-h-10 min-w-10 bg-surface-2/60 hover:bg-surface-2/80"
            data-token="--color-fg"
          >
            <span className="text-bg" data-token="--color-bg">›</span>
          </button>
        </>
      )}
      </div>
    </>
  );
}
