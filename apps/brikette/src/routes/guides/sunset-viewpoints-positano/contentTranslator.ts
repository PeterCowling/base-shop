import { useMemo } from "react";
import type { TFunction } from "i18next";

type GuidesTranslator = TFunction<string>;

type UseContentTranslatorOptions = {
  baseTranslator: GuidesTranslator | null;
  fallbackT: GuidesTranslator;
  hasStructured: boolean;
};

const INTRO_KEY = `content.sunsetViewpoints.intro` as const;

type Translator = GuidesTranslator & {
  (key: typeof INTRO_KEY, options: { returnObjects: true }): unknown[];
};

export function useContentTranslator({
  baseTranslator,
  fallbackT,
  hasStructured,
}: UseContentTranslatorOptions): GuidesTranslator | null {
  return useMemo(() => {
    if (!baseTranslator) return null;

    if (hasStructured || baseTranslator !== fallbackT) {
      return baseTranslator;
    }

    const wrapped = ((key: string, options?: Record<string, unknown>) => {
      if (options?.["returnObjects"] && key === INTRO_KEY) {
        return [];
      }
      return baseTranslator(key, options);
    }) as Translator;

    return wrapped;
  }, [baseTranslator, fallbackT, hasStructured]);
}
