"use client";
import Image from "next/image";

export type GalleryImage = { src: string; alt?: string; caption?: string };

export default function Gallery({ images = [] }: { images?: GalleryImage[] }) {
  if (!images.length) return null;
  return (
    <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
      {images.map((img) => (
        <figure
          key={img.src}
          className="relative aspect-square w-full overflow-hidden rounded"
        >
          <Image
            src={img.src}
            alt={img.alt ?? ""}
            fill
            className="object-cover"
          />
          {img.caption ? (
            <figcaption className="absolute inset-x-0 bottom-0 bg-black/60 px-3 py-2 text-xs text-white">
              {img.caption}
            </figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  );
}
