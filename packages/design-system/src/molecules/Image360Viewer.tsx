// packages/ui/components/molecules/Image360Viewer.tsx
"use client";

import * as React from "react";

import { ZoomImage } from "../atoms/ZoomImage";
import {
  type PrimitiveRadius,
  type PrimitiveShape,
  resolveShapeRadiusClass,
} from "../primitives/shape-radius";
import { cn } from "../utils/style";

/* ------------------------------------------------------------------ *
 *  Props
 * ------------------------------------------------------------------ */
export interface Image360ViewerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Ordered frame URLs forming the 360-degree sequence */
  frames: string[];
  /** Alternate text for accessibility */
  alt?: string;
  /** Semantic frame shape. Ignored when `radius` is provided. */
  shape?: PrimitiveShape;
  /** Explicit frame radius token override. */
  radius?: PrimitiveRadius;
}

/* ------------------------------------------------------------------ *
 *  Component
 * ------------------------------------------------------------------ */
export const Image360Viewer = (
  {
    ref,
    frames,
    alt,
    shape,
    radius,
    className,
    ...props
  }: Image360ViewerProps & {
    ref?: React.Ref<HTMLDivElement>;
  }
) => {
  const [index, setIndex] = React.useState(0);
  const startX = React.useRef<number | null>(null);
  const shapeRadiusClass = resolveShapeRadiusClass({
    shape,
    radius,
    defaultRadius: "lg",
  });

  /* ------------------------------------------------------------------ *
   *  Pointer handlers
   * ------------------------------------------------------------------ */
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    startX.current = e.clientX;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 10) {
      setIndex(
        (prev) => (prev + (dx > 0 ? -1 : 1) + frames.length) % frames.length
      );
      startX.current = e.clientX;
    }
  };

  const onPointerUp = () => {
    startX.current = null;
  };

  /* ------------------------------------------------------------------ *
   *  Render
   * ------------------------------------------------------------------ */
  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      className={cn("touch-none", className)}
      {...props}
    >
      <ZoomImage
        src={frames[index]}
        alt={alt ?? ""}
        fill
        className={cn("object-cover", shapeRadiusClass)}
      />
    </div>
  );
};
