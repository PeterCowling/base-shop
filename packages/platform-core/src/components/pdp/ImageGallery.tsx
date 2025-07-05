// src/components/pdp/ImageGallery.tsx
"use client";

import Image from "next/image";
import { useState } from "react";

export default function ImageGallery({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  // single image today; gallery-ready later
  const [zoom, setZoom] = useState(false);

  return (
    <figure
      className="relative w-full aspect-square cursor-zoom-in"
      onClick={() => setZoom(!zoom)}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        className={`object-cover rounded-lg transition-transform duration-300 ${
          zoom ? "scale-125 cursor-zoom-out" : ""
        }`}
        priority
      />
    </figure>
  );
}
