/**
 * Zoomable image gallery for guide blocks (TASK-03).
 *
 * Each image can be clicked to open in a fullscreen dialog for closer inspection.
 * Uses Dialog primitives for accessibility (keyboard navigation, screen reader support).
 */

import { memo, useState } from "react";
import { ZoomIn } from "lucide-react";

import { CfResponsiveImage } from "@acme/ui/atoms/CfResponsiveImage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/design-system/primitives";

export type ZoomableImageGalleryItem = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  caption?: string;
};

type Props = {
  items: ZoomableImageGalleryItem[];
  className?: string;
};

function ZoomableImageGallery({ items, className = "" }: Props): JSX.Element | null {
  if (!items?.length) return null;

  return (
    <figure className={`not-prose my-6 grid gap-3 sm:grid-cols-2 ${className}`}>
      {items.map(({ src, alt, width = 1200, height = 800, caption }, index) => {
        const aspect = width > 0 && height > 0 ? `${width}/${height}` : undefined;
        const key = `${src}::${index}`;
        const dialogTitle = caption || alt;

        return (
          <Dialog key={key}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="group relative overflow-hidden rounded-md border border-slate-200 transition-all hover:border-slate-300 hover:shadow-lg dark:border-slate-700 dark:hover:border-slate-600"
              >
                <CfResponsiveImage
                  src={src}
                  alt={alt}
                  width={width}
                  height={height}
                  preset="gallery"
                  className="block h-auto w-full"
                  data-aspect={aspect}
                />
                {/* Zoom indicator overlay */}
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/20"
                  aria-hidden="true"
                >
                  <ZoomIn
                    className="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-90"
                    strokeWidth={2.5}
                  />
                </div>
                {caption ? (
                  <figcaption className="px-3 py-2 text-left text-xs text-slate-600 dark:text-slate-300">
                    {caption}
                  </figcaption>
                ) : null}
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-7xl">
              <DialogHeader>
                <DialogTitle>{dialogTitle}</DialogTitle>
              </DialogHeader>
              <div className="flex max-h-[80vh] items-center justify-center">
                <CfResponsiveImage
                  src={src}
                  alt={alt}
                  width={width}
                  height={height}
                  preset="hero"
                  quality={90}
                  className="max-h-[80vh] w-auto object-contain"
                  data-aspect={aspect}
                />
              </div>
            </DialogContent>
          </Dialog>
        );
      })}
    </figure>
  );
}

export default memo(ZoomableImageGallery);
