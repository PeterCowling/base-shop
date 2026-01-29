// src/components/guides/ImageGallery.tsx
import { memo } from "react";

import { CfResponsiveImage } from "@acme/ui/atoms/CfResponsiveImage";

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
    <div
      data-cy={TEST_IDS.root}
      data-testid={TEST_IDS.root}
      className={`not-prose my-6 grid items-start gap-3 sm:grid-cols-2 ${className}`}
    >
      {items.map(({ src, alt, width = 1200, height = 800, caption }) => {
        const aspect = width > 0 && height > 0 ? `${width}/${height}` : undefined;
        const key = caption?.length
          ? `${src}::${caption}`
          : `${src}::${width ?? "auto"}x${height ?? "auto"}`;
        return (
          <figure
            key={key}
            className="w-fit max-w-full overflow-hidden rounded-md border border-slate-200 dark:border-slate-700"
          >
            <CfResponsiveImage
              src={src}
              alt={alt}
              width={width}
              height={height}
              preset="gallery"
              className="block h-auto w-auto max-w-full"
              data-aspect={aspect}
            />
            {caption ? (
              <figcaption className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
                {caption}
              </figcaption>
            ) : null}
          </figure>
        );
      })}
    </div>
  );
}

export default memo(ImageGallery);
