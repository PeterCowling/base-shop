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

type LogoImageProps = ImageProps & { srcSet?: string };

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
  /** Optional srcset override */
  srcSet?: string;
}

export const Logo = React.forwardRef<HTMLImageElement, LogoProps>(
  (
    {
      className,
      src,
      sources,
      alt,
      fallbackText,
      width: defaultWidth = 32,
      height: defaultHeight = 32,
      sizes,
      srcSet: providedSrcSet,
      ...props
    },
    ref,
  ) => {
    const viewport = useViewport();
    const responsive = sources?.[viewport];
    const imageSrc = responsive?.src ?? src;
    const imageWidth = responsive?.width ?? defaultWidth;
    const imageHeight = responsive?.height ?? defaultHeight;

    const altText = alt ?? fallbackText;

    if (!imageSrc) {
      return <span className={cn("font-bold", className)}>{fallbackText}</span>;
    }

    const widthClass =
      typeof imageWidth === "number" ? `w-[${imageWidth}px]` : undefined;
    const heightClass =
      typeof imageHeight === "number" ? `h-[${imageHeight}px]` : undefined;

    const srcSetEntries = new Map<string, number | undefined>();

    if (typeof src === "string") {
      srcSetEntries.set(
        src,
        typeof defaultWidth === "number" ? defaultWidth : undefined,
      );
    }

    if (sources) {
      for (const variant of Object.values(sources)) {
        if (!variant?.src || typeof variant.src !== "string") continue;
        srcSetEntries.set(variant.src, variant.width);
      }
    }

    const computedSrcSet =
      providedSrcSet ??
      (srcSetEntries.size > 0
        ? Array.from(srcSetEntries.entries())
            .map(([url, widthDescriptor]) =>
              widthDescriptor ? `${url} ${widthDescriptor}w` : url,
            )
            .join(", ")
        : undefined);

    const imageProps: LogoImageProps = {
      ...props,
      src: imageSrc,
      alt: altText,
      width: typeof imageWidth === "number" ? imageWidth : undefined,
      height: typeof imageHeight === "number" ? imageHeight : undefined,
      sizes,
      className: cn(widthClass, heightClass, className),
      ...(computedSrcSet ? { srcSet: computedSrcSet } : {}),
    };

    return <Image ref={ref} {...imageProps} />;
  },
);
Logo.displayName = "Logo";
