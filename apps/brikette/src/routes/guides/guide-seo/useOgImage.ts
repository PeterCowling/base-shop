import { useMemo } from "react";

import buildCfImageUrl, { type BuildCfImageOptions } from "@acme/ui/lib/buildCfImageUrl";

import { DEFAULT_OG_IMAGE } from "./constants";
import type { OgImageConfig } from "./types";

interface UseOgImageResult {
  ogImageConfig: Required<Pick<OgImageConfig, "path" | "width" | "height">> & {
    transform: BuildCfImageOptions;
  };
  ogImageUrl: string;
}

export function useOgImage(ogImage?: OgImageConfig): UseOgImageResult {
  const ogImageConfig = useMemo(() => {
    const width = typeof ogImage?.width === "number" ? ogImage.width : DEFAULT_OG_IMAGE.width;
    const height = typeof ogImage?.height === "number" ? ogImage.height : DEFAULT_OG_IMAGE.height;
    const path = typeof ogImage?.path === "string" ? ogImage.path : DEFAULT_OG_IMAGE.path;
    const transform =
      ogImage?.transform ?? ({
        width,
        height,
        quality: 85,
        format: "auto",
      } satisfies BuildCfImageOptions);
    return { path, width, height, transform };
  }, [ogImage]);

  const ogImageUrl = useMemo(() => {
    return buildCfImageUrl(ogImageConfig.path, ogImageConfig.transform);
  }, [ogImageConfig]);

  return { ogImageConfig, ogImageUrl };
}
