import Image, { type ImageProps } from "next/image";
import * as React from "react";
import { cn } from "../../utils/cn";

export interface AvatarProps extends Omit<ImageProps, "width" | "height"> {
  /** Content to display when no image src is provided */
  fallback?: React.ReactNode;
  /** Both width and height of the avatar in pixels */
  size?: number;
}

export const Avatar = React.forwardRef<HTMLImageElement, AvatarProps>(
  ({ className, src, alt, fallback, size = 32, ...props }, ref) => {
    const dimension = size;

    if (!src) {
      return (
        <div
          ref={ref as unknown as React.RefObject<HTMLDivElement>}
          className={cn(
            `h-[${dimension}px] w-[${dimension}px] bg-muted flex items-center justify-center rounded-full text-sm`,
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
        width={dimension}
        height={dimension}
        className={cn(
          `h-[${dimension}px] w-[${dimension}px] rounded-full object-cover`,
          className
        )}
        {...props}
      />
    );
  }
);
Avatar.displayName = "Avatar";
