"use client";
import { useState } from "react";

export type ImageSlide = {
  src: string;
  alt?: string;
  caption?: string;
};

interface Props {
  slides?: ImageSlide[];
  minItems?: number;
  maxItems?: number;
}

export default function ImageSlider({
  slides = [],
  minItems,
  maxItems,
}: Props) {
  const list = slides.slice(0, maxItems ?? slides.length);
  const [index, setIndex] = useState(0);

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.src} alt={img.alt ?? ""} className="w-full object-cover" />
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
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded bg-fg/50 p-2"
            data-token="--color-fg"
          >
            <span className="text-bg" data-token="--color-bg">‹</span>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-fg/50 p-2"
            data-token="--color-fg"
          >
            <span className="text-bg" data-token="--color-bg">›</span>
          </button>
        </>
      )}
    </div>
  );
}
