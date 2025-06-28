import Image, { type ImageProps } from "next/image";
import * as React from "react";
import { cn } from "../../utils/cn";

export interface ZoomImageProps extends ImageProps {
  zoomScale?: number;
}

export const ZoomImage = React.forwardRef<HTMLDivElement, ZoomImageProps>(
  ({ zoomScale = 1.25, ...props }, ref) => {
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
          {...props}
          className={cn(
            "object-cover transition-transform duration-300",
            zoom ? "scale-125" : "scale-100",
            props.className
          )}
          style={{ transform: zoom ? `scale(${zoomScale})` : undefined }}
        />
      </figure>
    );
  }
);
ZoomImage.displayName = "ZoomImage";
