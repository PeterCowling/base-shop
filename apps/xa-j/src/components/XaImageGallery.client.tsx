"use client";

/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy gallery pending design/i18n overhaul */

import * as React from "react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@ui/components/atoms";
import { Cluster } from "@ui/components/atoms/primitives/Cluster";

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
                    "relative aspect-[4/5] w-full cursor-zoom-in overflow-hidden rounded-none bg-white",
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
          <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none">
            <DialogTitle className="sr-only">{title}</DialogTitle>
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black/90">
              {active ? (
                <XaFadeImage
                  src={active.url}
                  alt={active.altText ?? title}
                  fill
                  sizes="80vw"
                  className="object-contain"
                />
              ) : null}
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-none border border-border-1 bg-white">
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
