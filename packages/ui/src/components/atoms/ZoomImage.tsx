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
    return (
      <figure
        ref={ref}
        onClick={() => setZoom(!zoom)}
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
