import type { FallbackTranslator } from "../../../utils/fallbacks";

export function resolveTocTitle(
  tFb: FallbackTranslator | undefined,
  guideKey: string,
  legacyKey: string,
): string {
  try {
    const raw = tFb?.(`content.${guideKey}.tocTitle`, { defaultValue: "On this page" }) as string;
    const trimmed = typeof raw === "string" ? raw.trim() : "";
    if (trimmed.length > 0 && trimmed !== `content.${guideKey}.tocTitle`) return trimmed;
  } catch {
    /* ignore – treat as missing and try alternate key */
  }
  try {
    const altRaw = tFb?.(`${guideKey}.tocTitle`, { defaultValue: "On this page" }) as string;
    const altTrimmed = typeof altRaw === "string" ? altRaw.trim() : "";
    if (altTrimmed.length > 0 && altTrimmed !== `${guideKey}.tocTitle`) return altTrimmed;
  } catch {
    /* ignore – fall back to default */
  }
  try {
    const legacyRaw = tFb?.(`content.${legacyKey}.tocTitle`, { defaultValue: "On this page" }) as string;
    const legacyTrimmed = typeof legacyRaw === "string" ? legacyRaw.trim() : "";
    if (legacyTrimmed.length > 0 && legacyTrimmed !== `content.${legacyKey}.tocTitle`) return legacyTrimmed;
  } catch { /* noop */ }
  try {
    const legacyAlt = tFb?.(`${legacyKey}.tocTitle`, { defaultValue: "On this page" }) as string;
    const legacyAltTrimmed = typeof legacyAlt === "string" ? legacyAlt.trim() : "";
    if (legacyAltTrimmed.length > 0 && legacyAltTrimmed !== `${legacyKey}.tocTitle`) return legacyAltTrimmed;
  } catch { /* noop */ }
  return "On this page";
}
