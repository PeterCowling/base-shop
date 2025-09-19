import Image, { type ImageProps } from "next/image";
import * as React from "react";
import useViewport from "../../hooks/useViewport";
import { cn } from "../../utils/style";

type Viewport = "desktop" | "tablet" | "mobile";

interface LogoSource {
  src: ImageProps["src"];
  width?: number;
  height?: number;
}

export interface LogoProps
  extends Omit<ImageProps, "alt" | "src" | "width" | "height"> {
  /** Text to display when no image source is available */
  fallbackText: string;
  /** Default image source */
  src?: ImageProps["src"];
  /** Responsive sources keyed by viewport */
  sources?: Partial<Record<Viewport, LogoSource>>;
  width?: number;
  height?: number;
  alt?: string;
}

export const Logo = React.forwardRef<HTMLImageElement, LogoProps>(
  (
    {
      className,
      src,
      sources,
      alt,
      fallbackText,
      width = 32,
      height = 32,
      sizes,
      ...props
    },
    ref,
  ) => {
    const viewport = useViewport();
    const responsive = sources?.[viewport];
    const imageSrc = responsive?.src ?? src;
    const imageWidth = responsive?.width ?? width;
    const imageHeight = responsive?.height ?? height;

    const orderedViewports: Viewport[] = ["mobile", "tablet", "desktop"];
    const srcSet = orderedViewports
      .map((key) => {
        const entry = sources?.[key];
        if (!entry?.src) {
          return null;
        }

        const descriptor = entry.width ? `${entry.width}w` : undefined;
        return descriptor ? `${entry.src} ${descriptor}` : `${entry.src}`;
      })
      .filter(Boolean)
      .join(", ");

    const altText = alt ?? fallbackText;

    if (!imageSrc) {
      return <span className={cn("font-bold", className)}>{fallbackText}</span>;
    }

    const widthClass = `w-[${imageWidth}px]`;
    const heightClass = `h-[${imageHeight}px]`;

    return (
      <Image
        ref={ref}
        src={imageSrc}
        alt={altText}
        width={imageWidth}
        height={imageHeight}
        sizes={sizes}
        srcSet={srcSet || undefined}
        className={cn(widthClass, heightClass, className)}
        {...props}
      />
    );
  },
);
Logo.displayName = "Logo";
