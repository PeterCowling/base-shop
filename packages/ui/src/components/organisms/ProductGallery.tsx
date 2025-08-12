// packages/ui/components/organisms/ProductGallery.tsx
"use client";

import * as React from "react";
import { cn } from "../../utils/style";
import { ARViewer } from "../atoms/ARViewer";
import { VideoPlayer } from "../atoms/VideoPlayer";
import { ZoomImage } from "../atoms/ZoomImage";
import { Image360Viewer } from "../molecules/Image360Viewer";
import { MediaSelector, type MediaItem as SelectorItem } from "../molecules/MediaSelector";
import type { MediaItem } from "@acme/types";

/* ------------------------------------------------------------------ *
 *  Props
 * ------------------------------------------------------------------ */
export interface ProductGalleryProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Ordered media items shown in the gallery */
  media: MediaItem[];
}

/* ------------------------------------------------------------------ *
 *  Component
 * ------------------------------------------------------------------ */
export function ProductGallery({
  media,
  className,
  ...props
}: ProductGalleryProps) {
  const items: SelectorItem[] = media.map((m) => ({
    type: m.type ?? "image",
    src: m.url,
    thumbnail: m.thumbnail,
    alt: m.altText,
    frames: m.frames,
  }));
  const [index, setIndex] = React.useState(0);
  const item = items[index];

  /* ------------------------------------------------------------------ *
   *  Determine which viewer to render
   * ------------------------------------------------------------------ */
  let content: React.ReactNode = null;

  if (!item) {
    content = null;
  } else if (item.type === "image") {
    content = (
      <ZoomImage
        src={item.src}
        alt={item.alt ?? ""}
        fill
        className="rounded-lg object-cover"
      />
    );
  } else if (item.type === "video") {
    content = <VideoPlayer src={item.src} className="h-full w-full" />;
  } else if (item.type === "360") {
    content = (
      <Image360Viewer
        frames={item.frames ?? [item.src]}
        alt={item.alt ?? ""}
        className="h-full w-full"
      />
    );
  } else if (item.type === "model") {
    content = <ARViewer src={item.src} className="h-full w-full" />;
  }

  /* ------------------------------------------------------------------ *
   *  Render
   * ------------------------------------------------------------------ */
  return (
    <div className={cn("space-y-2", className)} {...props}>
      <div className="relative aspect-square w-full">{content}</div>

      {items.length > 1 && (
        <MediaSelector items={items} active={index} onChange={setIndex} />
      )}
    </div>
  );
}
