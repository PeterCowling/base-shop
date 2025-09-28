/* i18n-exempt file -- ABC-123 CSS utility class tokens [ttl=2026-01-31] */
"use client";
import Image, { type ImageProps } from "next/image";
import * as React from "react";
import { cn } from "../../utils/style";

export interface ZoomImageProps extends ImageProps {
  zoomScale?: number;
}

export const ZoomImage = React.forwardRef<HTMLDivElement, ZoomImageProps>(
  ({ alt, className, zoomScale = 1.25, ...props }, ref) => {
    const [zoom, setZoom] = React.useState(false);
    const toggle = React.useCallback(() => setZoom((z) => !z), []);
    const onKeyDown = React.useCallback<React.KeyboardEventHandler<HTMLDivElement>>(
      (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      },
      [toggle],
    );
    return (
      <figure
        ref={ref}
        role="button"
        tabIndex={0}
        aria-pressed={zoom}
        onClick={toggle}
        onKeyDown={onKeyDown}
        className={cn(
          "relative w-full cursor-zoom-in overflow-hidden",
          zoom && "cursor-zoom-out"
        )}
      >
        <Image
          alt={alt ?? ""}
          {...props}
          className={cn(
            "object-cover transition-transform duration-300",
            zoom ? "scale-125" : "scale-100",
            className
          )}
          style={{ transform: zoom ? `scale(${zoomScale})` : undefined }}
        />
      </figure>
    );
  }
);
ZoomImage.displayName = "ZoomImage";
