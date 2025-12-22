import * as AppConfig from "../../config";
import type { AppLanguage } from "../../i18n.config";
import { i18nConfig } from "../../i18n.config";

// Allow dynamic languages (e.g. tests may extend supportedLngs at runtime).
// Keep known languages strongly typed while permitting arbitrary string keys.
export const SUPPORTED_LANGS = Object.freeze((() => {
  const fromConfig = i18nConfig.supportedLngs as readonly AppLanguage[] | undefined;
  let fromRuntime: readonly AppLanguage[] | undefined;
  try {
    const candidate = (AppConfig as { SUPPORTED_LANGUAGES?: unknown }).SUPPORTED_LANGUAGES;
    if (Array.isArray(candidate)) fromRuntime = candidate as readonly AppLanguage[];
  } catch {
    // ignored: config mock may not expose SUPPORTED_LANGUAGES
  }
  const chosen = (fromConfig ?? fromRuntime) ?? ([] as readonly AppLanguage[]);
  return (Array.isArray(chosen) && chosen.length > 0 ? chosen : (["en"] as const)) as readonly AppLanguage[];
})());

