import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { OG_IMAGE_DIMENSIONS } from "./constants";

export function buildAssistanceOgImage(): string {
  return buildCfImageUrl("/img/positano-panorama.avif", {
    width: OG_IMAGE_DIMENSIONS.width,
    height: OG_IMAGE_DIMENSIONS.height,
    quality: 85,
    format: "auto",
  });
}
