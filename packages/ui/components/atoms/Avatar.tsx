import Image, { type ImageProps } from "next/image";
import * as React from "react";
import { boxProps } from "../../utils/boxProps";
import { cn } from "../../utils/cn";

export interface AvatarProps extends Omit<ImageProps, "width" | "height"> {
  /** Content to display when no image src is provided */
  fallback?: React.ReactNode;
  /** Both width and height of the avatar in pixels */
  size?: number;
  /** Optional explicit width */
  width?: string | number;
  /** Optional explicit height */
  height?: string | number;
  /** Optional padding classes */
  padding?: string;
  /** Optional margin classes */
  margin?: string;
}

export const Avatar = React.forwardRef<HTMLImageElement, AvatarProps>(
  (
    {
      className,
      src,
      alt,
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
    const { classes, style } = boxProps({
      width: width ?? dimension,
      height: height ?? dimension,
      padding,
      margin,
    });
    if (!src) {
      return (
        <div
          ref={ref as unknown as React.RefObject<HTMLDivElement>}
          style={style}
          className={cn(
            "bg-muted flex items-center justify-center rounded-full text-sm",
            classes,
            className
          )}
        >
          {fallback ?? (typeof alt === "string" ? alt.charAt(0) : null)}
        </div>
      );
    }
    return (
      <Image
        ref={ref}
        src={src}
        alt={alt ?? ""}
        width={
          typeof (width ?? dimension) === "number"
            ? (width ?? dimension)
            : dimension
        }
        height={
          typeof (height ?? dimension) === "number"
            ? (height ?? dimension)
            : dimension
        }
        style={style}
        className={cn("rounded-full object-cover", classes, className)}
        {...props}
      />
    );
  }
);
Avatar.displayName = "Avatar";
