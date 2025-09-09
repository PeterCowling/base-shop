import Image, { type ImageProps } from "next/image";
import * as React from "react";
import { cn } from "../../utils/style";

export interface LogoProps extends ImageProps {
  /** Name of the shop for alt text or fallback */
  shopName: string;
}

export const Logo = React.forwardRef<HTMLImageElement, LogoProps>(
  (
    {
      className,
      src,
      alt,
      shopName,
      width = 32,
      height = 32,
      ...props
    },
    ref
  ) => {
    const altText = alt ?? shopName;
    if (!src) {
      return <span className={cn("font-bold", className)}>{shopName}</span>;
    }
    const widthClass = `w-[${width}px]`;
    const heightClass = `h-[${height}px]`;
    return (
      <Image
        ref={ref}
        src={src}
        alt={altText}
        width={width}
        height={height}
        className={cn(widthClass, heightClass, className)}
        {...props}
      />
    );
  }
);
Logo.displayName = "Logo";
