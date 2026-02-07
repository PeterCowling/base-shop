/* i18n-exempt file -- ABC-123 CSS utility class tokens [ttl=2026-01-31] */
"use client";
import * as React from "react";
import Image, { type ImageProps } from "next/image";

import { cn } from "../utils/style";

export interface ZoomImageProps extends ImageProps {
  zoomScale?: number;
  ariaLabel?: string;
}

export const ZoomImage = React.forwardRef<HTMLDivElement, ZoomImageProps>(
  ({ alt, className, zoomScale = 1.25, ariaLabel, ...props }, ref) => {
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
    const accessibleLabel =
      ariaLabel ?? (zoom ? "Zoomed image, press to zoom out" : "Zoom image, press to zoom in");
    return (
      <figure
        ref={ref}
        role="button"
        tabIndex={0}
        aria-pressed={zoom}
        aria-label={accessibleLabel}
        onClick={toggle}
        onKeyDown={onKeyDown}
        className={cn(
          "relative w-full cursor-zoom-in overflow-hidden transition motion-reduce:transition-none focus-visible:focus-ring",
          zoom && "cursor-zoom-out"
        )}
      >
        <Image
          alt={alt ?? ""}
          {...props}
          className={cn(
            "object-cover transition-transform duration-300 motion-reduce:transition-none",
            className
          )}
          style={{ transform: zoom ? `scale(${zoomScale})` : "scale(1)" }}
        />
        <span className="sr-only">{accessibleLabel}</span>
      </figure>
    );
  }
);
ZoomImage.displayName = "ZoomImage";
