import buildCfImageUrl from "@/lib/buildCfImageUrl";

import { GALLERY_IMAGE_CONFIG } from "./path-of-the-gods.constants";

export const buildPathOfTheGodsGallerySources = (): readonly string[] =>
  GALLERY_IMAGE_CONFIG.map((config) =>
    buildCfImageUrl(config.path, {
      width: config.width,
      height: config.height,
      quality: 85,
      format: "auto",
    }),
  );
