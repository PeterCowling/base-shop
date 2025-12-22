// /src/utils/transliterate-guide-label.ts
//
// Deterministic transliteration helper for guide slugs.
//
// The mapping only contains the characters that appear in our locale
// catalogues and was generated from transliteration@2.3.5 (MIT).
// See `src/data/guides/transliteration/` for the raw data.

import { GUIDE_TRANSLITERATION_MAP } from "./guide-transliteration-map";

export function transliterateGuideLabel(input: string): string {
  let buffer = "";

  for (const char of input) {
    if (char.charCodeAt(0) <= 0x7f) {
      buffer += char;
      continue;
    }

    const replacement = GUIDE_TRANSLITERATION_MAP[char as keyof typeof GUIDE_TRANSLITERATION_MAP];
    if (replacement !== undefined) {
      buffer += replacement;
      continue;
    }
  }

  return buffer;
}
