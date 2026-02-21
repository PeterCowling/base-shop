import type { GuideKey } from "@/guides/slugs";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { renderBodyBlocks } from "@/routes/guides/utils/linkTokens";
import type { TFunction } from "@/utils/i18nSafe";

interface Props {
  translations: { tGuides: TFunction };
  hookI18n?: { getFixedT?: (lng: string, ns: string) => TFunction | undefined };
  guideKey: GuideKey;
  lang: AppLanguage;
}

/** Simple string fallback under content.{guideKey}.fallback */
export default function RenderManualString({ translations, hookI18n, guideKey, lang }: Props): JSX.Element | null {
  const keyExpect = `content.${guideKey}.fallback` as const;

	  const pickMeaningful = (value: unknown): string => {
	    const s = typeof value === "string" ? value.trim() : "";
	    if (!s) return "";
	    if (s === keyExpect) return "";
	    return s;
	  };

  const getFixedGuides = (): TFunction<"guides"> | undefined => {
    try {
      const fromHook = hookI18n?.getFixedT?.("en", "guides");
      if (typeof fromHook === "function") return fromHook as TFunction<"guides">;
      const fromGlobal = i18n.getFixedT?.("en", "guides");
      return typeof fromGlobal === "function" ? (fromGlobal as TFunction<"guides">) : undefined;
    } catch {
      return undefined;
    }
  };

  let fb = "";
  try {
    const fbLocal = pickMeaningful(translations.tGuides(keyExpect) as unknown);
    if (fbLocal) {
      fb = fbLocal;
    } else {
      const tEn = getFixedGuides();
      const fbEn = typeof tEn === "function" ? pickMeaningful(tEn(keyExpect) as unknown) : "";
      fb = fbEn;
    }
  } catch {
    fb = "";
  }

  if (!fb) return null;
  return <div className="space-y-4">{renderBodyBlocks([fb], lang, `manual-string-${guideKey}`, guideKey)}</div>;
}
