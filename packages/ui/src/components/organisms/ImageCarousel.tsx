"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "../../utils/style";
import { Inline } from "../atoms/primitives/Inline";

export interface ImageCarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  images: { src: string; alt?: string }[];
}

export function ImageCarousel({ images, className, ...props }: ImageCarouselProps) {
  if (!images.length) return null;

  return (
    <div className={cn("overflow-hidden", className)} {...props}>
      <Inline wrap={false} className="snap-x overflow-x-auto pb-4">
        {images.map((img, i) => (
          <Image
            key={i}
            src={img.src}
            alt={img.alt ?? ""
            }
            width={640}
            height={480}
            className="h-auto w-auto shrink-0 snap-start"
          />
        ))}
      </Inline>
    </div>
  );
}
