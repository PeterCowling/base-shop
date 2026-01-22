// Copied from src/components/images/CfImage.tsx
import { createElement, type CSSProperties,memo, useMemo } from "react";

import { type PRESETS } from "../config/imagePresets";
import { useResponsiveImage } from "../hooks/useResponsiveImage";
import buildCfImageUrl from "../lib/buildCfImageUrl";

export interface CfImageProps extends React.ComponentPropsWithoutRef<"img"> {
  src: string;
  preset: keyof typeof PRESETS;
  alt: string;
  priority?: boolean;
  quality?: number;
  format?: "avif" | "webp" | "jpeg";
  fit?: "cover" | "contain";
}

function CfImageBase({
  src,
  preset,
  alt,
  priority = false,
  quality,
  format,
  fit,
  width: htmlWidth,
  height: htmlHeight,
  ...imgRest
}: CfImageProps) {
  const { srcSet, sizes, dims } = useResponsiveImage({ src, preset, extra: { quality, format, fit } });

  const numericWidth = useMemo<number | undefined>(() => {
    if (typeof htmlWidth === "number") return htmlWidth;
    if (typeof htmlWidth === "string") {
      const parsed = parseInt(htmlWidth, 10);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
    return dims.width;
  }, [htmlWidth, dims.width]);

  const numericHeight = useMemo<number | undefined>(() => {
    if (typeof htmlHeight === "number") return htmlHeight;
    if (typeof htmlHeight === "string") {
      const parsed = parseInt(htmlHeight, 10);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
    if (dims.width && dims.height && numericWidth) {
      return Math.round((dims.height / dims.width) * numericWidth);
    }
    return dims.height;
  }, [htmlHeight, dims.height, dims.width, numericWidth]);

  const fetchPriority: "high" | undefined = priority ? "high" : undefined;

  const aspectRatio = useMemo(() => {
    const width = typeof numericWidth === "number" ? numericWidth : undefined;
    const height = typeof numericHeight === "number" ? numericHeight : undefined;
    if (!width || !height || width <= 0 || height <= 0) return undefined;
    const roundWidth = Math.round(width);
    const roundHeight = Math.round(height);
    const gcd = (a: number, b: number): number => {
      let x = Math.abs(a);
      let y = Math.abs(b);
      while (y !== 0) {
        const temp = y;
        y = x % y;
        x = temp;
      }
      return x === 0 ? 1 : x;
    };
    const divisor = gcd(roundWidth, roundHeight);
    return `${roundWidth / divisor}:${roundHeight / divisor}`;
  }, [numericHeight, numericWidth]);

  const sources = useMemo(
    () => [
      { type: "image/avif", fmt: "avif" },
      { type: "image/webp", fmt: "webp" },
      { type: "image/jpeg", fmt: "jpeg" },
    ],
    []
  );

  const { style: inlineStyle, ["data-aspect"]: dataAspectAttr, ...imgRestProps } =
    imgRest as typeof imgRest & {
      style?: CSSProperties;
      "data-aspect"?: string;
    };

  const defaultImageStyle: CSSProperties = {
    display: "block",
    maxWidth: "100%",
  };

  return (
    <picture data-aspect={dataAspectAttr ?? aspectRatio} className="block h-full w-full">
      {sources.map(({ type, fmt }) => (
        <source key={type} type={type} srcSet={srcSet.replace(/format=\w+/g, `format=${fmt}`)} sizes={sizes} />
      ))}
      {createElement("img", {
        src: buildCfImageUrl(src, { width: numericWidth, quality, format, fit }),
        srcSet,
        sizes,
        width: htmlWidth ?? numericWidth,
        height: htmlHeight ?? numericHeight,
        decoding: "async",
        loading: priority ? "eager" : "lazy",
        fetchPriority: fetchPriority as HTMLImageElement["fetchPriority"],
        style: inlineStyle ? { ...defaultImageStyle, ...inlineStyle } : defaultImageStyle,
        alt,
        "data-aspect": dataAspectAttr ?? aspectRatio,
        ...imgRestProps,
      })}
    </picture>
  );
}

export const CfImage = memo(CfImageBase);
CfImage.displayName = "CfImage";
export default CfImage;
