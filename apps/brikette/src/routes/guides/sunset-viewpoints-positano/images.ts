import buildCfImageUrl from "@/lib/buildCfImageUrl";

export const OG_IMAGE_SRC = buildCfImageUrl("/img/positano-panorama.avif", {
  width: 1200,
  height: 630,
  quality: 85,
  format: "auto",
});
