"use client";
import { useId, useState } from "react";
import NextImage from "next/image";

export type ImageSlide = {
  src: string;
  alt?: string;
  caption?: string;
};

interface Props {
  slides?: ImageSlide[];
  minItems?: number;
  maxItems?: number;
  openInLightbox?: boolean;
  id?: string;
}

export default function ImageSlider({
  slides = [],
  minItems,
  maxItems,
  openInLightbox,
  id,
}: Props) {
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
    <div
      className="relative"
      data-lightbox-root={openInLightbox ? group : undefined}
      role="region"
      aria-roledescription="carousel"
      aria-label="Image Slider"
      tabIndex={0}
      onKeyDown={handleKey}
    >
      {list.map((img, i) => (
        <figure
          key={img.src}
          className={i === index ? "block" : "hidden"}
          aria-hidden={i !== index}
        >
          {openInLightbox ? (
            <a href={img.src} data-lightbox data-lightbox-group={group} aria-label={img.caption || img.alt || undefined}>
              <NextImage src={img.src} alt={img.alt ?? ""} width={1600} height={900} className="w-full object-cover" />
            </a>
          ) : (
            <NextImage src={img.src} alt={img.alt ?? ""} width={1600} height={900} className="w-full object-cover" />
          )}
          {img.caption && (
            <figcaption className="text-center text-sm" aria-live="polite">
              {img.caption}
            </figcaption>
          )}
        </figure>
      ))}
      {list.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="absolute start-2 top-1/2 -translate-y-1/2 rounded p-2 min-h-10 min-w-10 bg-surface-2/60 hover:bg-surface-2/80"
            data-token="--color-fg"
          >
            <span className="text-bg" data-token="--color-bg">‹</span>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-2 min-h-10 min-w-10 bg-surface-2/60 hover:bg-surface-2/80"
            data-token="--color-fg"
          >
            <span className="text-bg" data-token="--color-bg">›</span>
          </button>
        </>
      )}
    </div>
  );
}
