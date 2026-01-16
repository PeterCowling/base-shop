"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "@acme/i18n";
import { resolveText } from "@acme/i18n/resolveText";
import type { TranslatableText } from "@acme/types/i18n";
import type { Locale } from "@acme/i18n/locales";

export type PromoTile = {
  imageSrc?: string;
  imageAlt?: TranslatableText;
  caption?: TranslatableText;
  ctaLabel?: TranslatableText;
  ctaHref?: string;
  badge?: "rental" | "buy";
};

export interface PromoTilesSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  tiles?: PromoTile[]; // 2–6 tiles recommended
  density?: "editorial" | "utilitarian";
  /** Optional current locale used for inline values */
  locale?: Locale;
}

export default function PromoTilesSection({ tiles = [], density = "editorial", className, locale, ...rest }: PromoTilesSectionProps) {
  // Hooks must be called unconditionally (before early returns)
  const t = useTranslations() as unknown as (key: string, params?: Record<string, unknown>) => string;

  if (!Array.isArray(tiles) || tiles.length === 0) return null;

  const resolveMaybe = (v?: TranslatableText): string => {
    if (!v) return "";
    if (typeof v === "string") return v;
    if (v.type === "key") return t(v.key, v.params);
    if (v.type === "inline") {
      if (locale) return resolveText(v, locale, t);
      const fallback = v.value?.en ?? v.value?.de ?? v.value?.it ?? "";
      return typeof fallback === "string" ? fallback : "";
    }
    return "";
  };
  const cols = Math.min(3, Math.max(1, tiles.length));
  const gridColsClass = cols === 1 ? "lg:grid-cols-1" : cols === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3";
  const gap = density === "editorial" ? "gap-4" : "gap-2";
  const captionClass = density === "editorial" ? "text-base" : "text-sm";
  const containerClass = ["mx-auto px-4", "grid grid-cols-1 sm:grid-cols-2", gridColsClass, gap].join(" "); // i18n-exempt -- DS-1010 [ttl=2026-12-31]
  const imgSizes = "(min-width: 1024px) 33vw, 50vw"; // i18n-exempt -- DS-1010 [ttl=2026-12-31]

  return (
    <section className={className} {...rest}>
      <div className={containerClass}> 
        {tiles.map((tile) => (
          <a
            key={`${tile.imageSrc ?? "no-img"}-${tile.ctaHref ?? "#"}-${typeof tile.caption === "string" ? tile.caption : ""}`}
            href={tile.ctaHref ?? "#"}
            className="group relative block overflow-hidden rounded border min-h-10 min-w-10"
          >{/* i18n-exempt: class names */}
            {/* Image */}
            <div className="aspect-video w-full bg-muted">
              {tile.imageSrc ? (
                <div className="relative h-full w-full">
                  <Image
                    src={tile.imageSrc}
                    alt={resolveMaybe(tile.imageAlt) || ""}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes={imgSizes}
                  />
                </div>
              ) : null}
            </div>
            {/* Caption/CTA */}
            {(tile.caption || tile.ctaLabel) && (
              <div className="flex items-center justify-between px-3 py-2">
                <div className={["font-medium", captionClass].join(" ")}>{resolveMaybe(tile.caption)}</div>
                {tile.ctaLabel ? (
                  <span className="text-sm underline-offset-2 group-hover:underline">{resolveMaybe(tile.ctaLabel)}</span>
                ) : null}
              </div>
            )}
            {/* Badge */}
            {tile.badge ? (
              <span className="absolute start-2 top-2 rounded bg-foreground/80 px-2 py-0.5 text-xs text-foreground">{/* i18n-exempt: class names */}
                {tile.badge === "rental" ? t("actions.rent") : t("actions.buy")}
              </span>
            ) : null}
          </a>
        ))}
      </div>
    </section>
  );
}
