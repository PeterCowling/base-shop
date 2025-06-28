import Image, { type ImageProps } from "next/image";
import * as React from "react";
import { cn } from "../../utils/cn";

export interface AvatarProps extends ImageProps {
  fallback?: React.ReactNode;
}

export const Avatar = React.forwardRef<HTMLImageElement, AvatarProps>(
  (
    { className, src, alt, fallback, width = 32, height = 32, ...props },
    ref
  ) => {
    if (!src) {
      return (
        <div
          ref={ref as unknown as React.RefObject<HTMLDivElement>}
          className={cn(
            "bg-muted flex h-8 w-8 items-center justify-center rounded-full text-sm",
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
        width={width}
        height={height}
        className={cn("h-8 w-8 rounded-full object-cover", className)}
        {...props}
      />
    );
  }
);
Avatar.displayName = "Avatar";
