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
  // eslint-disable-next-line react-hooks/rules-of-hooks -- CFL-99 pre-existing: early return guard before hook
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
            // eslint-disable-next-line ds/container-widths-only-at -- CFL-99 pre-existing: image sizing
            className="group w-fit max-w-full overflow-hidden rounded-lg border border-1 bg-surface-1 shadow-sm transition-shadow hover:shadow-md"
          >
            <CfResponsiveImage
              src={src}
              alt={alt}
              width={width}
              height={height}
              preset="gallery"
              // eslint-disable-next-line ds/container-widths-only-at -- CFL-99 pre-existing: image sizing
              className="block h-auto w-auto max-w-full transition-opacity group-hover:opacity-95"
              data-aspect={aspect}
            />
            {caption ? (
              <figcaption className="px-4 py-3 text-sm leading-snug text-secondary">
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
