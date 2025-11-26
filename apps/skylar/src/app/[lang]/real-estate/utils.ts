import type { ImageSource } from "./constants";

export type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

export type TranslatedImageSource = ImageSource & {
  alt: string;
};

export function translateImageSources(
  sources: ImageSource[],
  translator: TranslateFn
): TranslatedImageSource[] {
  return sources.map((image) => ({
    ...image,
    alt: translator(image.altKey),
  }));
}
