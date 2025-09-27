"use client";
import Image from "next/image";
import { useId } from "react";
import { Grid as DSGrid } from "../../atoms/primitives";

export type GalleryImage = { src: string; alt?: string; caption?: string };

export default function Gallery({ images = [], openInLightbox, id }: { images?: GalleryImage[]; openInLightbox?: boolean; id?: string }) {
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
          {openInLightbox ? (
            <a href={img.src} data-lightbox data-lightbox-group={group} aria-label={img.caption || img.alt || undefined}>
              <Image src={img.src} alt={img.alt ?? ""} fill className="object-cover" />
            </a>
          ) : (
            <Image src={img.src} alt={img.alt ?? ""} fill className="object-cover" />
          )}
          {img.caption ? (
            <figcaption className="absolute inset-x-0 bottom-0 bg-black/60 px-3 py-2 text-xs text-white">
              {img.caption}
            </figcaption>
          ) : null}
        </figure>
      ))}
    </DSGrid>
  );
}
