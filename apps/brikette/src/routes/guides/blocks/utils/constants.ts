/**
 * Constants for block composition.
 */

type ImageFormat = "auto" | "webp" | "jpg" | "png";

export const DEFAULT_IMAGE_DIMENSIONS: {
  width: number;
  height: number;
  quality: number;
  format: ImageFormat;
} = {
  width: 1600,
  height: 900,
  quality: 85,
  format: "auto",
};

export type CfImagePreset = "hero" | "gallery" | "thumb";

export function normalisePreset(preset?: string): CfImagePreset {
  return preset === "gallery" || preset === "thumb" ? preset : "hero";
}
