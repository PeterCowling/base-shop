import type { GuideKey } from "@/guides/slugs";
import i18n from "@/i18n";
import type { TFunction } from "@/utils/i18nSafe";

interface Props {
  translations: { tGuides: TFunction };
  hookI18n?: { getFixedT?: (lng: string, ns: string) => TFunction | undefined };
  guideKey: GuideKey;
}

/** Simple string fallback under content.{guideKey}.fallback */
export default function RenderManualString({ translations, hookI18n, guideKey }: Props): JSX.Element | null {
  try {
    const keyExpect = `content.${guideKey}.fallback` as const;
    const fbLocalRaw = translations.tGuides(keyExpect) as unknown;
    const fbLocal = typeof fbLocalRaw === "string" ? fbLocalRaw.trim() : "";

    const isObjectWarning = (s: string) => /returned an object instead of string/i.test(s);

    const getFixedGuides = () => {
      try {
        return hookI18n?.getFixedT?.("en", "guides") ?? i18n.getFixedT?.("en", "guides");
      } catch {
        // fallback to undefined if fixed translator cannot be resolved
        return undefined;
      }
    };
    const fbEn = (() => {
      try {
        const tEn = getFixedGuides();
        const v = typeof tEn === "function" ? tEn(keyExpect) : undefined;
        const s = typeof v === "string" ? v.trim() : "";
        // Treat i18n's object-warning string as not meaningful
        if (s && s !== keyExpect && !isObjectWarning(s)) return s;
        return "";
      } catch {
        return "";
      }
    })();

    const pickMeaningful = (s: string) => (s && s !== keyExpect && !isObjectWarning(s) ? s : "");
    const fb = pickMeaningful(fbLocal) || pickMeaningful(fbEn);
    if (fb && fb.length > 0) {
      return (
        <>
          <div className="space-y-4">
            <p>{fb}</p>
          </div>
        </>
      );
    }
  } catch {
    void 0;
  }
  return null;
}
