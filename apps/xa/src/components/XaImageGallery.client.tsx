"use client";

/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy gallery pending design/i18n overhaul */

import * as React from "react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@acme/design-system/atoms";
import { Cluster } from "@acme/design-system/primitives/Cluster";

import { XaFadeImage } from "./XaFadeImage";
import type { XaProduct } from "../lib/demoData";

type MediaItem = XaProduct["media"][number];

function isImage(item: MediaItem): item is MediaItem & { type: "image" } {
  return item.type === "image" && item.url.trim().length > 0;
}

export function XaImageGallery({
  title,
  media,
}: {
  title: string;
  media: MediaItem[];
}) {
  const images = React.useMemo(() => media.filter(isImage), [media]);
  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => setActiveIndex(0), [title]);

  const active = images[activeIndex] ?? images[0];

  const handlePrev = () => setActiveIndex((i) => Math.max(0, i - 1));
  const handleNext = () => setActiveIndex((i) => Math.min(images.length - 1, i + 1));

  return (
    <div className="space-y-4">
      {images.length ? (
        <Dialog>
          <div className="grid gap-6 sm:grid-cols-2">
            {images.map((img, idx) => {
              const shouldSpan = images.length > 2 && idx === 0;
              return (
              <DialogTrigger asChild key={img.url}>
                <button
                  type="button"
                  aria-label={`View image ${idx + 1} of ${images.length}`} // i18n-exempt -- XA-0012: demo a11y label
                  onClick={() => setActiveIndex(idx)}
                  className={[
                    "relative aspect-[4/5] w-full cursor-zoom-in overflow-hidden rounded-none bg-panel",
                    shouldSpan ? "sm:row-span-2" : "",
                  ].join(" ")}
                >
                  <XaFadeImage
                    src={img.url}
                    alt={img.altText ?? title}
                    fill
                    sizes="(min-width: 1024px) 45vw, 100vw"
                    className="object-contain"
                    priority={idx < 2}
                  />
                </button>
              </DialogTrigger>
              );
            })}
          </div>
          <DialogContent
            className="relative max-w-4xl border-none bg-transparent p-0 shadow-none"
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") handlePrev();
              if (e.key === "ArrowRight") handleNext();
            }}
          >
            <DialogTitle className="sr-only">{title}</DialogTitle>
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-overlay-scrim-2">
              {active ? (
                <XaFadeImage
                  src={active.url}
                  alt={active.altText ?? title}
                  fill
                  sizes="(max-width: 768px) 100vw, 55vw"
                  className="object-contain"
                />
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Previous image"
              onClick={handlePrev}
              disabled={activeIndex === 0}
              className="absolute start-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center border border-border-2 bg-surface-1 text-foreground hover:bg-muted disabled:opacity-30"
            >
              <svg aria-hidden viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
                <path d="M10 4L6 8l4 4"/>
              </svg>
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={handleNext}
              disabled={activeIndex === images.length - 1}
              className="absolute end-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center border border-border-2 bg-surface-1 text-foreground hover:bg-muted disabled:opacity-30"
            >
              <svg aria-hidden viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
                <path d="M6 4l4 4-4 4"/>
              </svg>
            </button>
            <div className="mt-2 text-center text-xs text-muted-foreground tabular-nums">
              {activeIndex + 1} / {images.length}
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-none border border-border-1 bg-panel">
          <Cluster
            alignY="center"
            justify="center"
            wrap={false}
            className="h-full w-full text-sm text-muted-foreground"
          >
            {title}
          </Cluster>
        </div>
      )}
    </div>
  );
}
