// src/components/Avatar.tsx
import Image, { type ImageProps } from "next/image";
import * as React from "react";
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

    const toDimensionClass = (
      value: number | string | undefined,
      axis: "w" | "h",
    ) => {
      if (value === undefined) {
        return undefined;
      }

      if (typeof value === "string") {
        if (value.startsWith(`${axis}-`) || value.includes(`:${axis}-`)) {
          return value;
        }

        const trimmed = value.trim();

        if (trimmed.length === 0) {
          return undefined;
        }

        const sanitized = trimmed.replace(/\s+/g, "_");

        return `${axis}-[${sanitized}]`;
      }

      return `${axis}-[${value}px]`;
    };

    const widthClass = toDimensionClass(width ?? dimension, "w");
    const heightClass = toDimensionClass(height ?? dimension, "h");
    const boxClasses = cn(padding, margin, widthClass, heightClass);

    // ─── No src: render fallback ────────────────────────────────────────────
    if (!src) {
      return (
        <div
          ref={ref as unknown as React.RefObject<HTMLDivElement>}
          className={cn(
            "bg-muted flex items-center justify-center rounded-full text-sm", // i18n-exempt -- DEV-000 CSS utility class names
            boxClasses,
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
        className={cn(
          "rounded-full object-cover", // i18n-exempt -- DEV-000 CSS utility class names
          boxClasses,
          className,
        )}
        {...props}
      />
    );
  }
);

Avatar.displayName = "Avatar"; // i18n-exempt -- DEV-000 component displayName, not user-facing
