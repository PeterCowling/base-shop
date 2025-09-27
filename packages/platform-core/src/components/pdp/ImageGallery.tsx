// src/components/pdp/ImageGallery.tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import type { MediaItem } from "@acme/types";

export default function ImageGallery({ items }: { items: MediaItem[] }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const item = items[index];
  if (!item) return null;

  // Tailwind utility tokens used in template classes
  const zoomOut = "cursor-zoom-out"; // i18n-exempt -- ABC-123 CSS utility token
  const zoomIn = "cursor-zoom-in"; // i18n-exempt -- ABC-123 CSS utility token
  const selectedRing = " ring-2 ring-black"; // i18n-exempt -- ABC-123 CSS utility token
  const responsiveSizes = "(min-width: 1024px) 50vw, 100vw"; // i18n-exempt -- ABC-123 responsive sizes attribute value

  return (
    <div className="space-y-2">
      <figure
        className={`relative w-full aspect-square overflow-hidden ${
          zoom ? zoomOut : zoomIn
        }`}
        onClick={() => setZoom((z) => !z)}
      >
        {item.type === "image" ? (
          <Image
            src={item.url}
            alt={item.altText ?? ""}
            fill
            sizes={responsiveSizes}
            className={`object-cover rounded-lg transition-transform ${
              zoom ? "scale-125" : ""
            }`}
            priority
          />
        ) : (
          <video
            src={item.url}
            controls
            className="h-full w-full rounded-lg object-cover"
            data-aspect="1/1"
          />
        )}
      </figure>
      {items.length > 1 && (
        <>
          {/* eslint-disable-next-line ds/enforce-layout-primitives -- ABC-123 thumbnail strip scroller */}
          <div className="inline-flex gap-2">
          {items.map((m, i) => (
            <button
              key={m.url}
              type="button"
              onClick={() => {
                setIndex(i);
                setZoom(false);
              }}
              className={`relative h-16 w-16 overflow-hidden rounded border${
                i === index ? selectedRing : ""
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
                <span className="inline-flex h-full w-full items-center justify-center text-xs">
                  {/* i18n-exempt -- ABC-123 simple media label */}
                  Video
                </span>
              )}
            </button>
          ))}
          </div>
        </>
      )}
    </div>
  );
}
