"use client";
import Image from "next/image";

export type GalleryImage = { src: string; alt?: string };

export default function Gallery({ images = [] }: { images?: GalleryImage[] }) {
  if (!images.length) return null;
  return (
    <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
      {images.map((img) => (
        <div key={img.src} className="relative aspect-square w-full">
          <Image
            src={img.src}
            alt={img.alt ?? ""}
            fill
            className="rounded object-cover"
          />
        </div>
      ))}
    </div>
  );
}
