// packages/ui/components/organisms/ProductGallery.tsx
"use client";

import * as React from "react";
import { cn } from "../../utils/style";
import { ARViewer } from "../atoms/ARViewer";
import { VideoPlayer } from "../atoms/VideoPlayer";
import { ZoomImage } from "../atoms/ZoomImage";
import { Image360Viewer } from "../molecules/Image360Viewer";
import { MediaSelector, type MediaItem } from "../molecules/MediaSelector";

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
  const [index, setIndex] = React.useState(0);
  if (media.length === 0) {
    return null;
  }
  const item = media[index];

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

      {media.length > 1 && (
        <MediaSelector items={media} active={index} onChange={setIndex} />
      )}
    </div>
  );
}
