"use client";

import * as React from "react";
import Image from "next/image";
const t = (s: string) => s;

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
  const containerClass = ["mx-auto px-4", "grid grid-cols-1 sm:grid-cols-2", gridColsClass, gap].join(" "); // i18n-exempt: class names
  const imgSizes = "(min-width: 1024px) 33vw, 50vw"; // i18n-exempt: attribute value

  return (
    <section className={className} {...rest}>
      <div className={containerClass}> 
        {tiles.map((tile, i) => (
          <a key={i} href={tile.ctaHref ?? "#"} className="group relative block overflow-hidden rounded border min-h-10 min-w-10">{/* i18n-exempt: class names */}
            {/* Image */}
            <div className="aspect-video w-full bg-neutral-100">
              {tile.imageSrc ? (
                <div className="relative h-full w-full">
                  <Image
                    src={tile.imageSrc}
                    alt={tile.imageAlt ?? ""}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes={imgSizes}
                    priority={false}
                  />
                </div>
              ) : null}
            </div>
            {/* Caption/CTA */}
            {(tile.caption || tile.ctaLabel) && (
              <div className="flex items-center justify-between px-3 py-2">
                <div className={["font-medium", captionClass].join(" ")}>{tile.caption}</div>
                {tile.ctaLabel ? (
                  <span className="text-sm underline-offset-2 group-hover:underline">{tile.ctaLabel}</span>
                ) : null}
              </div>
            )}
            {/* Badge */}
            {tile.badge ? (
              <span className="absolute start-2 top-2 rounded bg-black/80 px-2 py-0.5 text-xs text-white">{/* i18n-exempt: class names */}
                {/* i18n-exempt: badge labels derived from preset */}
                {tile.badge === "rental" ? t("Rent") : t("Buy")}
              </span>
            ) : null}
          </a>
        ))}
      </div>
    </section>
  );
}
