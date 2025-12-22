// src/components/guides/ImageGallery.tsx
import { CfResponsiveImage } from "@/components/images/CfResponsiveImage";
import { memo } from "react";

const TEST_IDS = {
  root: "image-gallery",
} as const;

export type ImageGalleryItem = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  caption?: string;
};

type Props = { items: ImageGalleryItem[]; className?: string };

function ImageGallery({ items, className = "" }: Props): JSX.Element | null {
  if (!items?.length) return null;
  return (
    <figure data-testid={TEST_IDS.root} className={`not-prose my-6 grid gap-3 sm:grid-cols-2 ${className}`}>
      {items.map(({ src, alt, width = 1200, height = 800, caption }) => {
        const aspect = width > 0 && height > 0 ? `${width}/${height}` : undefined;
        const key = caption?.length
          ? `${src}::${caption}`
          : `${src}::${width ?? "auto"}x${height ?? "auto"}`;
        return (
          <div
            key={key}
            className="overflow-hidden rounded-md border border-slate-200 dark:border-slate-700"
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
            {caption ? (
              <figcaption className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
                {caption}
              </figcaption>
            ) : null}
          </div>
        );
      })}
    </figure>
  );
}

export default memo(ImageGallery);
