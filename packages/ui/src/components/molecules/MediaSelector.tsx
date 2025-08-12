import Image from "next/image";
import * as React from "react";

import { cn } from "../../utils/style";

export type MediaType = "image" | "video" | "360" | "model";

export interface MediaItem {
  type: MediaType;
  url: string;
  thumbnail?: string;
  altText?: string;
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
  return (
    <div className={cn("flex gap-2", className)} {...props}>
      {items.map((item, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onChange?.(idx)}
          className={cn(
            "h-16 w-16 overflow-hidden rounded border",
            active === idx && "ring-2 ring-black"
          )}
        >
          {item.type === "image" || item.type === "360" ? (
            <Image
              src={item.thumbnail || item.url}
              alt="thumbnail"
              fill
              className="object-cover"
            />
          ) : item.type === "video" ? (
            <span className="flex h-full w-full items-center justify-center text-xs">
              Video
            </span>
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs">
              AR
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
