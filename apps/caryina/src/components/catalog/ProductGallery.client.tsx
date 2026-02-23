"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";

import type { ProductGalleryItem } from "@/lib/launchMerchandising";

interface ProductGalleryProps {
  productTitle: string;
  items: ProductGalleryItem[];
}

export function ProductGallery({ productTitle, items }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartXRef = useRef<number | null>(null);

  const safeItems = useMemo(() => (items.length === 0 ? [] : items), [items]);
  const activeItem = safeItems[activeIndex] ?? null;
  const canNavigate = safeItems.length > 1;

  function goToIndex(index: number) {
    if (!canNavigate) return;
    const count = safeItems.length;
    if (count === 0) return;
    const wrapped = (index + count) % count;
    setActiveIndex(wrapped);
  }

  function goPrevious() {
    goToIndex(activeIndex - 1);
  }

  function goNext() {
    goToIndex(activeIndex + 1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrevious();
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    }
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    touchStartXRef.current = event.changedTouches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    const startX = touchStartXRef.current;
    const endX = event.changedTouches[0]?.clientX;
    touchStartXRef.current = null;
    if (startX === null || typeof endX !== "number") return;
    const delta = startX - endX;
    if (Math.abs(delta) < 40) return;
    if (delta > 0) goNext();
    if (delta < 0) goPrevious();
  }

  if (!activeItem) {
    return (
      <div
        className="rounded-3xl border border-dashed p-6 text-sm text-muted-foreground"
        style={{ borderColor: "hsl(var(--color-border-default))" }}
      >
        No product media is available yet.
      </div>
    );
  }

  return (
    <section
      className="space-y-4"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label={`${productTitle} media gallery`}
      data-cy="product-gallery"
    >
      <div
        className="media-aspect-portrait relative overflow-hidden rounded-3xl border border-solid bg-muted"
        style={{ borderColor: "hsl(var(--color-border-default))" }}
      >
        {activeItem.type === "video" ? (
          <video
            className="h-full w-full aspect-square object-cover"
            src={activeItem.src}
            controls
            playsInline
            aria-label={activeItem.alt}
          />
        ) : (
          <Image
            src={activeItem.src}
            alt={activeItem.alt}
            fill
            sizes="(max-width: 1024px) 100vw, 56vw"
            className="object-cover"
            priority
          />
        )}
        <div className="gallery-role-label absolute inset-x-0 bottom-0 px-4 py-2 text-xs uppercase tracking-wider">
          {activeItem.roleLabel}
          {activeItem.isFallback ? " (placeholder)" : ""}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={goPrevious}
          disabled={!canNavigate}
          className="min-h-12 min-w-12 rounded-full border border-solid px-4 py-2 text-sm disabled:opacity-50"
          style={{ borderColor: "hsl(var(--color-border-default))" }}
          aria-label="Previous media"
        >
          Previous
        </button>
        <p className="text-sm text-muted-foreground" data-cy="gallery-position">
          {activeIndex + 1} / {safeItems.length}
        </p>
        <button
          type="button"
          onClick={goNext}
          disabled={!canNavigate}
          className="min-h-12 min-w-12 rounded-full border border-solid px-4 py-2 text-sm disabled:opacity-50"
          style={{ borderColor: "hsl(var(--color-border-default))" }}
          aria-label="Next media"
        >
          Next
        </button>
      </div>

      <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {safeItems.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => goToIndex(index)}
                className="min-h-12 min-w-12 w-full text-start"
                aria-label={`Show ${item.roleLabel.toLowerCase()} image`}
                aria-current={isActive ? "true" : undefined}
              >
                <div
                  className={`relative aspect-square overflow-hidden rounded-xl border border-solid ${isActive ? "ring-2 ring-offset-1" : ""}`}
                  style={{ borderColor: "hsl(var(--color-border-default))" }}
                >
                  {item.type === "video" ? (
                    <div className="flex h-full w-full items-center justify-center bg-muted text-xs uppercase tracking-wider text-muted-foreground">
                      Video
                    </div>
                  ) : (
                    <Image
                      src={item.src}
                      alt={item.alt}
                      fill
                      sizes="(max-width: 640px) 22vw, 12vw"
                      className="object-cover"
                    />
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
