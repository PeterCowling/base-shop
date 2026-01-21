/* i18n-exempt file -- UI-000: Non-user-facing literals (HTML attributes, class names). All visible copy uses i18n keys. */
"use client";
import * as React from "react";
import Image from "next/image";

import { useTranslations } from "@acme/i18n";

import { cn } from "../../utils/style";
import { Cover,Inline } from "../atoms/primitives";

export type MediaType = "image" | "video" | "360" | "model";

export interface MediaItem {
  type: MediaType;
  src: string;
  thumbnail?: string;
  alt?: string;
  frames?: string[]; // for 360
}

export interface MediaSelectorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  items: MediaItem[];
  active: number;
  onChange?: (idx: number) => void;
}

export function MediaSelector({
  items,
  active,
  onChange,
  className,
  ...props
}: MediaSelectorProps) {
  const t = useTranslations();
  return (
    <Inline gap={2} className={cn(className)} {...props}>
      {items.map((item, idx) => {
        const thumbnailKey = item.thumbnail ?? item.src ?? item.alt ?? item.frames?.[0] ?? item.type;
        return (
          <button
            key={thumbnailKey}
            type="button"
            onClick={() => onChange?.(idx)}
            className={cn(
              "h-16 w-16 overflow-hidden rounded border", // i18n-exempt -- UI-000: class names
              active === idx && "ring-2 ring-[color:hsl(var(--color-border-strong))]" // i18n-exempt -- UI-000: class names
            )}
          >
            {item.type === "image" || item.type === "360" ? (
              <Image
                src={item.thumbnail || item.src}
                // Use provided alt text or a generic, translated fallback
                alt={item.alt || (t("media.thumbnail") as string)}
                fill
                className="object-cover"
              />
            ) : item.type === "video" ? (
              <Cover className="h-full w-full text-xs" center={t("media.video") as string} />
            ) : (
              <Cover className="h-full w-full text-xs" center={t("media.ar") as string} />
            )}
          </button>
        );
      })}
    </Inline>
  );
}
