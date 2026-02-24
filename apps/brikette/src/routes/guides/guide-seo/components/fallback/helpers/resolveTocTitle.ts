import type { FallbackTranslator } from "../../../utils/fallbacks";

function readTocTitle(
  translator: FallbackTranslator | undefined,
  key: string,
): string | undefined {
  try {
    const raw = translator?.(key, { defaultValue: "On this page" }) as string;
    const trimmed = typeof raw === "string" ? raw.trim() : "";
    return trimmed.length > 0 && trimmed !== key ? trimmed : undefined;
  } catch {
    return undefined;
  }
}

export function resolveTocTitle(
  tFb: FallbackTranslator | undefined,
  guideKey: string,
  legacyKey: string,
): string {
  const candidates = [
    `content.${guideKey}.tocTitle`,
    `${guideKey}.tocTitle`,
    `content.${legacyKey}.tocTitle`,
    `${legacyKey}.tocTitle`,
  ];
  for (const key of candidates) {
    const title = readTocTitle(tFb, key);
    if (title) return title;
  }
  return "On this page";
}
