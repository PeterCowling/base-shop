// src/components/apartment/GallerySection.tsx
import React, { memo, useId } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

import { CfImage } from "@acme/ui/atoms/CfImage";

const IMAGES = [
  "/img/apt3.jpg",
  "/img/677389089.jpg",
  "/img/apt2.jpg",
] as const;

type GridProps = React.ComponentProps<"div">;
function Grid({ className, ...rest }: GridProps): JSX.Element {
  return <div className={clsx("grid", "gap-4", "sm:grid-cols-3", className)} {...rest} />;
}

function GallerySection({ lang }: { lang?: string }): JSX.Element {
  const translationOptions = lang ? { lng: lang } : undefined;
  const { t } = useTranslation("apartmentPage", translationOptions);
  const rawAlts = t("galleryAlts", { returnObjects: true });
  const altTexts = Array.isArray(rawAlts) ? (rawAlts as string[]) : [];
  const rawCaptions = t("galleryCaptions", { returnObjects: true });
  const captions = Array.isArray(rawCaptions) ? (rawCaptions as string[]) : [];
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="space-y-4">
      <h2 id={headingId} className="text-xl font-semibold text-brand-heading">
        {t("galleryHeading")}
      </h2>
      <Grid>
        {IMAGES.map((src, idx) => (
          <figure key={src} className="flex flex-col gap-2">
            <div className="aspect-4/3 overflow-hidden rounded-md">
              <CfImage
                src={src}
                alt={altTexts[idx] ?? t("galleryAlt")}
                width={640}
                height={480}
                preset="gallery"
                className="h-full w-full object-cover"
              />
            </div>
            {captions[idx] && (
              <figcaption className="line-clamp-2 text-sm text-brand-text/70">{captions[idx]}</figcaption>
            )}
          </figure>
        ))}
      </Grid>
    </section>
  );
}

export default memo(GallerySection);
