// src/components/pdp/ImageGallery.tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import type { MediaItem } from "@acme/types";

export default function ImageGallery({ items }: { items: MediaItem[] }) {
  const [index, setIndex] = useState(0);
  const item = items[index];
  if (!item) return null;

  return (
    <div className="space-y-2">
      <figure className="relative w-full aspect-square">
        {item.type === "image" ? (
          <Image
            src={item.url}
            alt={item.altText ?? ""}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover rounded-lg"
            priority
          />
        ) : (
          <video
            src={item.url}
            controls
            className="h-full w-full rounded-lg object-cover"
          />
        )}
      </figure>
      {items.length > 1 && (
        <div className="flex gap-2">
          {items.map((m, i) => (
            <button
              key={m.url}
              type="button"
              onClick={() => setIndex(i)}
              className={`relative h-16 w-16 overflow-hidden rounded border${
                i === index ? " ring-2 ring-black" : ""
              }`}
            >
              {m.type === "image" ? (
                <Image
                  src={m.url}
                  alt={m.altText ?? ""}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xs">
                  Video
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
