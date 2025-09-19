"use client";
import Image from "next/image";

export type GalleryImage = { src: string; alt?: string; caption?: string };

export default function Gallery({ images = [] }: { images?: GalleryImage[] }) {
  if (!images.length) return null;
  return (
    <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
      {images.map((img) => (
        <figure key={img.src} className="relative aspect-square w-full">
          <Image
            src={img.src}
            alt={img.alt ?? ""}
            fill
            className="rounded object-cover"
          />
          {img.caption ? (
            <figcaption className="absolute bottom-2 left-2 right-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
              {img.caption}
            </figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  );
}
