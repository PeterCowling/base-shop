"use client";

import * as React from "react";

export type PromoTile = {
  imageSrc?: string;
  imageAlt?: string;
  caption?: string;
  ctaLabel?: string;
  ctaHref?: string;
  badge?: "rental" | "buy";
};

export interface PromoTilesSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  tiles?: PromoTile[]; // 2–6 tiles recommended
  density?: "editorial" | "utilitarian";
}

export default function PromoTilesSection({ tiles = [], density = "editorial", className, ...rest }: PromoTilesSectionProps) {
  if (!Array.isArray(tiles) || tiles.length === 0) return null;
  const cols = Math.min(3, Math.max(1, tiles.length));
  const gridColsClass = cols === 1 ? "lg:grid-cols-1" : cols === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3";
  const gap = density === "editorial" ? "gap-4" : "gap-2";
  const captionClass = density === "editorial" ? "text-base" : "text-sm";

  return (
    <section className={className} {...rest}>
      <div className={["mx-auto max-w-7xl px-4", "grid grid-cols-1 sm:grid-cols-2", gridColsClass, gap].join(" ")}> 
        {tiles.map((t, i) => (
          <a key={i} href={t.ctaHref ?? "#"} className="group relative block overflow-hidden rounded border">
            {/* Image */}
            <div className="aspect-video w-full bg-neutral-100">
              {t.imageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.imageSrc} alt={t.imageAlt ?? ""} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
              ) : null}
            </div>
            {/* Caption/CTA */}
            {(t.caption || t.ctaLabel) && (
              <div className="flex items-center justify-between px-3 py-2">
                <div className={["font-medium", captionClass].join(" ")}>{t.caption}</div>
                {t.ctaLabel ? (
                  <span className="text-sm underline-offset-2 group-hover:underline">{t.ctaLabel}</span>
                ) : null}
              </div>
            )}
            {/* Badge */}
            {t.badge ? (
              <span className="absolute start-2 top-2 rounded bg-black/80 px-2 py-0.5 text-xs text-white">
                {t.badge === "rental" ? "Rent" : "Buy"}
              </span>
            ) : null}
          </a>
        ))}
      </div>
    </section>
  );
}
