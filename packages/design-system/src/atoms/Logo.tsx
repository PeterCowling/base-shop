"use client";

import * as React from "react";
import Image, { type ImageProps } from "next/image";

import useViewport from "../hooks/useViewport";
import { cn } from "../utils/style";

type Viewport = "desktop" | "tablet" | "mobile";

interface LogoSource {
  src: ImageProps["src"];
  width?: number;
  height?: number;
}

// Exclude `alt` so we can supply it explicitly without duplicate-prop errors
type LogoImageProps = Omit<ImageProps, "alt"> & { srcSet?: string };

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

function buildSrcSet(args: {
  baseSrc?: ImageProps["src"];
  baseWidth?: number;
  sources?: Partial<Record<Viewport, LogoSource>>;
  providedSrcSet?: string;
}): string | undefined {
  if (args.providedSrcSet) return args.providedSrcSet;

  const entries: Array<[string, number | undefined]> = [];

  const addEntry = (src: ImageProps["src"] | undefined, width: unknown) => {
    if (typeof src !== "string") return;
    if (entries.some(([existing]) => existing === src)) return;
    entries.push([src, typeof width === "number" ? width : undefined]);
  };

  addEntry(args.baseSrc, args.baseWidth);

  const sources = args.sources;
  if (sources) {
    const viewportOrder: Viewport[] = ["mobile", "tablet", "desktop"];
    for (const viewportKey of viewportOrder) {
      const variant = sources[viewportKey];
      if (!variant) continue;
      addEntry(variant.src, variant.width);
    }
  }

  if (entries.length === 0) return undefined;

  return entries
    .map(([url, widthDescriptor]) =>
      widthDescriptor ? `${url} ${widthDescriptor}w` : url,
    )
    .join(", ");
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

    const computedSrcSet = buildSrcSet({
      baseSrc: src,
      baseWidth: typeof defaultWidth === "number" ? defaultWidth : undefined,
      sources,
      providedSrcSet,
    });

    const imageProps: LogoImageProps = {
      ...props,
      src: imageSrc,
      className: cn(className),
      role: props.role ?? "img",
      ...(typeof imageWidth === "number" ? { width: imageWidth } : {}),
      ...(typeof imageHeight === "number" ? { height: imageHeight } : {}),
      ...(sizes !== undefined ? { sizes } : {}),
      ...(computedSrcSet ? { srcSet: computedSrcSet } : {}),
    };

    return <Image ref={ref} alt={altText} {...imageProps} />;
  },
);
Logo.displayName = "Logo";
