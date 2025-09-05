"use client";

/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import { cn } from "../../utils/style";

export interface ImageCarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  images: { src: string; alt?: string }[];
}

export function ImageCarousel({ images, className, ...props }: ImageCarouselProps) {
  if (!images.length) return null;

  return (
    <div className={cn("overflow-hidden", className)} {...props}>
      <div className="flex snap-x overflow-x-auto gap-4 pb-4">
        {images.map((img, i) => (
          <img
            key={i}
            src={img.src}
            alt={img.alt ?? ""}
            className="h-full w-auto flex-shrink-0 snap-start"
          />
        ))}
      </div>
    </div>
  );
}

