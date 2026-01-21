import type { GuideKey } from "@/guides/slugs";
import i18n from "@/i18n";
import type { TFunction } from "@/utils/i18nSafe";

interface Props {
  translations: { tGuides: TFunction };
  hookI18n?: { getFixedT?: (lng: string, ns: string) => TFunction | undefined };
  guideKey: GuideKey;
}

/**
 * Render a simple one-paragraph manual fallback when present under
 * content.{guideKey}.fallbackParagraph. Falls back to EN when the localised
 * value is missing or looks like a placeholder key.
 */
export default function RenderManualParagraph({ translations, hookI18n, guideKey }: Props): JSX.Element | null {
  const key = `content.${guideKey}.fallbackParagraph` as const;

  const pickMeaningful = (val: unknown): string => {
    const s = typeof val === "string" ? val.trim() : "";
    if (!s) return "";
    if (s === key) return ""; // raw key placeholder
    if (/returned an object instead of string/i.test(s)) return ""; // i18next warning string
    return s;
  };

  try {
    const local = pickMeaningful(translations.tGuides(key));
    if (local) {
      return (
        <div className="space-y-4">
          <p>{local}</p>
        </div>
      );
    }
  } catch {
    /* ignore and try EN */
  }

  try {
    type GetFixedTranslator = (lng: string, ns: string) => TFunction | undefined;
    const getFixedTranslator: GetFixedTranslator | undefined =
      hookI18n?.getFixedT ??
      ((lng, ns) => (typeof i18n.getFixedT === "function" ? i18n.getFixedT(lng, ns) : undefined));
    const fixed = getFixedTranslator?.("en", "guides");
    const en = pickMeaningful(typeof fixed === "function" ? fixed(key) : undefined);
    if (en) {
      return (
        <div className="space-y-4">
          <p>{en}</p>
        </div>
      );
    }
  } catch {
    /* noop */
  }

  return null;
}
