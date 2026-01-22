"use client";
import { useId } from "react";
import Image from "next/image";

import { Grid as DSGrid } from "@acme/design-system/primitives";
import { useTranslations } from "@acme/i18n";
import type { Locale } from "@acme/i18n/locales";
import { resolveText } from "@acme/i18n/resolveText";
import type { TranslatableText } from "@acme/types/i18n";

export type GalleryImage = { src: string; alt?: TranslatableText; caption?: TranslatableText };

export default function Gallery({ images = [], openInLightbox, id, locale = "en" }: { images?: GalleryImage[]; openInLightbox?: boolean; id?: string; locale?: Locale }) {
  const t = useTranslations() as unknown as (key: string, params?: Record<string, unknown>) => string;
  const fallbackId = useId();
  const group = id ?? fallbackId;
  if (!images.length) return null;
  return (
    <DSGrid cols={1} gap={2} className="sm:grid-cols-2 md:grid-cols-3" data-lightbox-root={openInLightbox ? group : undefined}>
      {images.map((img) => (
        <figure
          key={img.src}
          className="relative aspect-square w-full overflow-hidden rounded"
        >
          {(() => {
            const alt = typeof img.alt === "string" ? img.alt : img.alt ? resolveText(img.alt, locale, t) : "";
            const cap = typeof img.caption === "string" ? img.caption : img.caption ? resolveText(img.caption, locale, t) : "";
            return openInLightbox ? (
              <a href={img.src} data-lightbox data-lightbox-group={group} aria-label={cap || alt || undefined}>
                <Image src={img.src} alt={alt} fill className="object-cover" role="img" />
              </a>
            ) : (
              <Image src={img.src} alt={alt} fill className="object-cover" role="img" />
            );
          })()}
          {img.caption ? (
            <figcaption className="absolute inset-x-0 bottom-0 bg-foreground/60 px-3 py-2 text-xs text-foreground">
              {typeof img.caption === "string" ? img.caption : resolveText(img.caption, locale, t)}
            </figcaption>
          ) : null}
        </figure>
      ))}
    </DSGrid>
  );
}
