export function buildFallbackIntroParagraphs(
  hasStructured: boolean,
  fallbackIntro: string[],
): string[] {
  if (hasStructured) {
    return [];
  }

  return fallbackIntro
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}
