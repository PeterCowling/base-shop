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

    const srcSetEntries: Array<[string, number | undefined]> = [];

    const appendEntry = (
      url: unknown,
      width: unknown,
    ): url is string => {
      if (typeof url !== "string") {
        return false;
      }

      if (srcSetEntries.some(([existing]) => existing === url)) {
        return true;
      }

      const widthDescriptor =
        typeof width === "number" ? width : undefined;
      srcSetEntries.push([url, widthDescriptor]);
      return true;
    };

    appendEntry(src, typeof defaultWidth === "number" ? defaultWidth : undefined);

    if (sources) {
      const viewportOrder: Viewport[] = ["mobile", "tablet", "desktop"];
      for (const viewportKey of viewportOrder) {
        const variant = sources[viewportKey];
        if (!variant) continue;
        appendEntry(variant.src, variant.width);
      }
    }

    const computedSrcSet =
      providedSrcSet ??
      (srcSetEntries.length > 0
        ? srcSetEntries
            .map(([url, widthDescriptor]) =>
              widthDescriptor ? `${url} ${widthDescriptor}w` : url,
            )
            .join(", ")
        : undefined);

    return (
      <Image
        ref={ref}
        src={imageSrc}
        alt={altText}
        width={typeof imageWidth === "number" ? imageWidth : undefined}
        height={typeof imageHeight === "number" ? imageHeight : undefined}
        sizes={sizes}
        srcSet={computedSrcSet}
        className={cn(widthClass, heightClass, className)}
        {...props}
      />
    );
  },
);
Logo.displayName = "Logo";
