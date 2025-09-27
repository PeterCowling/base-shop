// src/components/Avatar.tsx
import Image, { type ImageProps } from "next/image";
import * as React from "react";
import { boxProps } from "../../utils/style";
import { cn } from "../../utils/style";

// ────────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────────
export interface AvatarProps extends Omit<ImageProps, "width" | "height"> {
  /** Content to display when no image src is provided */
  fallback?: React.ReactNode;
  /** Both width and height of the avatar in pixels */
  size?: number;
  /** Optional explicit width (must be numeric for Next Image) */
  width?: number | `${number}`;
  /** Optional explicit height (must be numeric for Next Image) */
  height?: number | `${number}`;
  /** Optional padding classes */
  padding?: string;
  /** Optional margin classes */
  margin?: string;
}

// ────────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────────
export const Avatar = React.forwardRef<HTMLImageElement, AvatarProps>(
  (
    {
      className,
      src,
      alt = "",
      fallback,
      size = 32,
      width,
      height,
      padding,
      margin,
      ...props
    },
    ref
  ) => {
    const dimension = size;

    // Ensure we hand Next <Image> genuine numbers
    const numericWidth =
      typeof width === "number"
        ? width
        : width !== undefined
          ? parseInt(width as string, 10)
          : dimension;

    const numericHeight =
      typeof height === "number"
        ? height
        : height !== undefined
          ? parseInt(height as string, 10)
          : dimension;

    const { classes, style } = boxProps({
      width: width ?? dimension, // visual size (can be any CSS unit)
      height: height ?? dimension, // visual size (can be any CSS unit)
      padding,
      margin,
    });

    // ─── No src: render fallback ────────────────────────────────────────────
    if (!src) {
      return (
        <div
          ref={ref as unknown as React.RefObject<HTMLDivElement>}
          style={style}
          className={cn(
            "bg-muted flex items-center justify-center rounded-full text-sm", // i18n-exempt — CSS utility class names
            classes,
            className
          )}
        >
          {fallback ?? (typeof alt === "string" ? alt.charAt(0) : null)}
        </div>
      );
    }

    // ─── With src: render Next <Image> ──────────────────────────────────────
    return (
      <Image
        ref={ref}
        src={src}
        alt={alt}
        width={numericWidth}
        height={numericHeight}
        style={style}
        className={cn(
          "rounded-full object-cover", // i18n-exempt — CSS utility class names
          classes,
          className,
        )}
        {...props}
      />
    );
  }
);

Avatar.displayName = "Avatar"; // i18n-exempt — component displayName, not user-facing
