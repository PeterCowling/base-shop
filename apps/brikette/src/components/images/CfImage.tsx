// src/components/images/CfImage.tsx
/* ---------------------------------------------------------------------------
   Cloudflare Images <CfImage/> – TS-safe width handling
   --------------------------------------------------------------------------*/

import { createElement, type CSSProperties,memo, useMemo } from "react";

import { type PRESETS } from "@/config/imagePresets";
import { useResponsiveImage } from "@/hooks/useResponsiveImage";
import buildCfImageUrl from "@/lib/buildCfImageUrl";

/* ---------------------------------------------------------------------------
   Types
   --------------------------------------------------------------------------*/
type CfImageFormat = "avif" | "webp" | "jpeg";

const DEFAULT_SOURCE_FORMATS: readonly CfImageFormat[] = ["avif", "webp", "jpeg"] as const;

export interface CfImageProps extends React.ComponentPropsWithoutRef<"img"> {
  /** Image path in the Cloudflare Images bucket (e.g. `/card.jpg`)          */
  src: string;
  /** Key pointing to an array of widths defined in `PRESETS`                */
  preset: keyof typeof PRESETS;
  /** Accessible alt text                                                    */
  alt: string;
  /** Above-the-fold hint; upgrades loading to *eager* & sets fetchPriority   */
  priority?: boolean;
  /** Output quality (1–100). Defaults handled in `useResponsiveImage`        */
  quality?: number;
  /** Explicit output format override                                        */
  format?: "avif" | "webp" | "jpeg";
  /** Object-fit behaviour inside its container                              */
  fit?: "cover" | "contain";
  /** Override the generated `<source/>` formats for the `<picture/>` element */
  sourceFormats?: readonly CfImageFormat[];
}

/* ---------------------------------------------------------------------------
   Component
   --------------------------------------------------------------------------*/
function CfImageBase({
  /* Required props ---------------------------------------------------------*/
  src,
  preset,
  alt,
  /* Behavioural tweaks -----------------------------------------------------*/
  priority = false,
  quality,
  format,
  fit,
  /* Optionally allow callers to override size attributes -------------------*/
  width: htmlWidth,
  height: htmlHeight,
  sourceFormats,
  /* Spread remainder (className, style, etc.) ------------------------------*/
  ...imgRest
}: CfImageProps) {
  /* 1️⃣  Build responsive candidates (srcSet, sizes, natural dims) ---------*/
  const extra = {
    ...(quality !== undefined ? { quality } : {}),
    ...(format !== undefined ? { format } : {}),
    ...(fit !== undefined ? { fit } : {}),
  };

  const responsiveOptions = {
    src,
    preset,
    ...(Object.keys(extra).length > 0 ? { extra } : {}),
  };

  const { srcSet, sizes, dims } = useResponsiveImage(responsiveOptions);

  /* 2️⃣  Resolve numeric width & height for URL + attributes ---------------*/
  const { numericWidth, widthAttribute } = useMemo(() => {
    if (typeof htmlWidth === "number") {
      return { numericWidth: htmlWidth, widthAttribute: htmlWidth };
    }
    if (typeof htmlWidth === "string") {
      const parsed = parseInt(htmlWidth, 10);
      if (!Number.isNaN(parsed)) {
        return { numericWidth: parsed, widthAttribute: htmlWidth };
      }
    }
    return { numericWidth: dims.width, widthAttribute: dims.width };
  }, [htmlWidth, dims.width]);

  const { numericHeight, heightAttribute } = useMemo(() => {
    if (typeof htmlHeight === "number") {
      return { numericHeight: htmlHeight, heightAttribute: htmlHeight };
    }
    if (typeof htmlHeight === "string") {
      const parsed = parseInt(htmlHeight, 10);
      if (!Number.isNaN(parsed)) {
        return { numericHeight: parsed, heightAttribute: htmlHeight };
      }
    }
    if (dims.width && dims.height && numericWidth) {
      const derived = Math.round((dims.height / dims.width) * numericWidth);
      return { numericHeight: derived, heightAttribute: derived };
    }
    return { numericHeight: dims.height, heightAttribute: dims.height };
  }, [htmlHeight, dims.height, dims.width, numericWidth]);

  /* 3️⃣  High-priority fetch hint (supported only in modern Chromium) ------*/
  const fetchPriority: "high" | undefined = priority ? "high" : undefined;

  /* 4️⃣  Normalise aspect-ratio for DS lint rules -------------------------*/
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

  /* 5️⃣  Pre-declared format sources for <picture/> ------------------------*/
  const sources = useMemo(
    () => {
      const formats = sourceFormats ?? DEFAULT_SOURCE_FORMATS;
      return formats.map((fmt) => ({
        type: fmt === "jpeg" ? "image/jpeg" : `image/${fmt}`,
        fmt,
      }));
    },
    [sourceFormats]
  );

  /* 6️⃣  Render ------------------------------------------------------------*/
  const { style: inlineStyle, ["data-aspect"]: dataAspectAttr, ...imgRestProps } =
    imgRest as typeof imgRest & {
      style?: CSSProperties;
      "data-aspect"?: string;
    };

  const defaultImageStyle: CSSProperties = {
    display: "block",
    maxWidth: "100%",
    height: "auto",
  };

  const pictureStyle: CSSProperties = { display: "block", lineHeight: 0, width: "100%", height: "100%" };

  return (
    <picture data-aspect={dataAspectAttr ?? aspectRatio} style={pictureStyle}>
      {sources.map(({ type, fmt }) => (
        <source
          key={type}
          type={type}
          srcSet={srcSet.replace(/format=\w+/g, `format=${fmt}`)}
          sizes={sizes}
        />
      ))}

      {createElement("img", {
        /* Build the fallback URL with an ensured-numeric width -------------*/
        src: buildCfImageUrl(src, {
          width: numericWidth,
          ...(quality !== undefined ? { quality } : {}),
          ...(format !== undefined ? { format } : {}),
          ...(fit !== undefined ? { fit } : {}),
        }),
        srcSet,
        sizes,
        decoding: "async",
        loading: priority ? "eager" : "lazy",
        style: inlineStyle ? { ...defaultImageStyle, ...inlineStyle } : defaultImageStyle,
        alt,
        "data-aspect": dataAspectAttr ?? aspectRatio,
        ...(widthAttribute !== undefined ? { width: widthAttribute } : {}),
        ...(heightAttribute !== undefined ? { height: heightAttribute } : {}),
        ...(fetchPriority !== undefined
          ? { fetchPriority: fetchPriority as HTMLImageElement["fetchPriority"] }
          : {}),
        ...imgRestProps,
      })}
    </picture>
  );
}

/* Memoise to prevent unnecessary re-renders --------------------------------*/
export const CfImage = memo(CfImageBase);
CfImage.displayName = "CfImage";
export default CfImage;
