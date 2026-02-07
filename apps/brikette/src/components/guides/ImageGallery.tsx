// src/components/guides/ImageGallery.tsx
import { memo } from "react";

import { CfResponsiveImage } from "@acme/ui/atoms/CfResponsiveImage";

import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { renderGuideLinkTokens } from "@/routes/guides/utils/linkTokens";

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
  const lang = useCurrentLanguage();
  return (
    <div
      data-cy={TEST_IDS.root}
      data-testid={TEST_IDS.root}
      className={`not-prose my-8 grid items-start gap-4 sm:grid-cols-2 ${className}`}
    >
      {items.map(({ src, alt, width = 1200, height = 800, caption }, index) => {
        const aspect = width > 0 && height > 0 ? `${width}/${height}` : undefined;
        const key = caption?.length
          ? `${src}::${caption}`
          : `${src}::${width ?? "auto"}x${height ?? "auto"}`;
        return (
          <figure
            key={key}
            className="group w-fit max-w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800/50"
          >
            <CfResponsiveImage
              src={src}
              alt={alt}
              width={width}
              height={height}
              preset="gallery"
              className="block h-auto w-auto max-w-full transition-opacity group-hover:opacity-95"
              data-aspect={aspect}
            />
            {caption ? (
              <figcaption className="px-4 py-3 text-sm leading-snug text-slate-700 dark:text-slate-300">
                {renderGuideLinkTokens(caption, lang, `image-gallery-${index}`, undefined)}
              </figcaption>
            ) : null}
          </figure>
        );
      })}
    </div>
  );
}

export default memo(ImageGallery);
