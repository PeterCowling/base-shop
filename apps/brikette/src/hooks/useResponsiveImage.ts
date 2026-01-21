// src/hooks/useResponsiveImage.ts
import { useMemo } from "react";

import { PRESETS } from "@/config/imagePresets";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { getIntrinsicSize } from "@/lib/getIntrinsicSize";
import type { ImageDims, SrcSetEntry } from "@/types/image";

/* ---------- shared option fragments ------------------------------------ */

type ExtraOpts = Partial<{
  quality: number;
  format: "avif" | "webp" | "jpeg";
  fit: "cover" | "contain";
}>;

/* ---------- call-signature variants ------------------------------------ */

interface WithPreset {
  src: string;
  preset: keyof typeof PRESETS;
  extra?: ExtraOpts;
}

interface WithResponsive {
  src: string;
  responsive: SrcSetEntry[];
  extra?: ExtraOpts;
}

/** Accept either a named preset **or** an explicit responsive array. */
export type UseResponsiveOpts = WithPreset | WithResponsive;

/* ---------- public return type ----------------------------------------- */

export interface ResponsiveImageData {
  srcSet: string;
  sizes: string;
  dims: ImageDims;
}

/* ------------------------------------------------------------------------
   Build `srcSet`, `sizes`, and intrinsic `dims` for Cloudflare Images.
   --------------------------------------------------------------------- */
export function useResponsiveImage(opts: UseResponsiveOpts): ResponsiveImageData {
  return useMemo(() => {
    const { src, extra } = opts;

    /* 1️⃣  Build an ordered list of { breakpoint, width } entries ---------- */
    const entries: SrcSetEntry[] =
      "responsive" in opts
        ? opts.responsive
        : PRESETS[opts.preset].map((w) => ({ breakpoint: w, width: w }));

    /* 2️⃣  srcSet ---------------------------------------------------------- */
    const srcSet = entries
      .map(({ width }) => `${buildCfImageUrl(src, { width, ...extra })} ${width}w`)
      .join(", ");

    /* 3️⃣  sizes ----------------------------------------------------------- */
    const sizes =
      "responsive" in opts
        ? entries
            .map(({ breakpoint, width }) => `(max-width: ${breakpoint}px) ${width}px`)
            .join(", ") + ", 100vw"
        : "100vw";

    /* 4️⃣  intrinsic dimensions ------------------------------------------- */
    const candidateWidths = entries.map(({ width }) => width);
    const fallback = candidateWidths.at(-1)!;
    const dims = getIntrinsicSize(src) ?? { width: fallback, height: fallback };

    return { srcSet, sizes, dims };
  }, [opts]);
}
