// src/components/apartment/GallerySection.tsx
import { memo, useId } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

import { CfImage } from "@/components/images/CfImage";

const IMAGES = [
  "/img/interno1.webp",
  "/img/interno2.webp",
  "/img/hostel-communal-terrace-lush-view.webp",
] as const;

type GridProps = JSX.IntrinsicElements["div"];
function Grid({ className, ...rest }: GridProps): JSX.Element {
  return <div className={clsx("grid", "gap-4", "sm:grid-cols-3", className)} {...rest} />;
}

function GallerySection({ lang }: { lang?: string }): JSX.Element {
  const translationOptions = lang ? { lng: lang } : undefined;
  const { t } = useTranslation("apartmentPage", translationOptions);
  const raw = t("galleryAlts", { returnObjects: true });
  const altTexts = Array.isArray(raw) ? (raw as string[]) : [];
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="space-y-4">
      <h2 id={headingId} className="text-xl font-semibold text-brand-primary">
        {t("galleryHeading")}
      </h2>
      <Grid>
        {IMAGES.map((src, idx) => (
          <CfImage
            key={src}
            src={src}
            alt={altTexts[idx] ?? t("galleryAlt")}
            width={640}
            height={480}
            preset="gallery"
            className="h-auto w-full rounded-md object-cover"
          />
        ))}
      </Grid>
    </section>
  );
}

export default memo(GallerySection);
