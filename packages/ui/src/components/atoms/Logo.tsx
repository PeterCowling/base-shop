import Image, { type ImageProps } from "next/image";
import * as React from "react";
import { cn } from "../../utils/style";

export interface LogoProps extends ImageProps {
  textFallback?: string;
}

export const Logo = React.forwardRef<HTMLImageElement, LogoProps>(
  (
    {
      className,
      src,
      alt,
      textFallback = "Logo",
      width = 32,
      height = 32,
      ...props
    },
    ref
  ) => {
    if (!src) {
      return <span className={cn("font-bold", className)}>{textFallback}</span>;
    }
    const widthClass = `w-[${width}px]`;
    const heightClass = `h-[${height}px]`;
    return (
      <Image
        ref={ref}
        src={src}
        alt={alt ?? ""}
        width={width}
        height={height}
        className={cn(widthClass, heightClass, className)}
        {...props}
      />
    );
  }
);
Logo.displayName = "Logo";
