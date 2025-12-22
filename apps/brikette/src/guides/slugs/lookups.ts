import type { AppLanguage } from "../../i18n.config";
import type { GuideKey } from "./keys";
import { SUPPORTED_LANGS } from "./supported-langs";
import { GUIDE_KEYS_WITH_OVERRIDES } from "./keys";
import { guideSlug } from "./urls";

// Reverse lookup map: per-language mapping from slug → guide key
export const GUIDE_SLUG_LOOKUP_BY_LANG: Readonly<Record<AppLanguage, Readonly<Record<string, GuideKey>>>> =
  Object.freeze(
    SUPPORTED_LANGS.reduce<Record<AppLanguage, Record<string, GuideKey>>>(
      (acc, lang) => {
        const map: Record<string, GuideKey> = {};
        for (const key of GUIDE_KEYS_WITH_OVERRIDES) {
          map[guideSlug(lang as AppLanguage, key)] = key as GuideKey;
        }
        acc[lang as AppLanguage] = Object.freeze(map);
        return acc;
      },
      {} as Record<AppLanguage, Record<string, GuideKey>>,
    ),
  );
