// src/utils/lang.ts
import { type AppLanguage,i18nConfig } from "@acme/ui/i18n.config";

/** Runtime check for an AppLanguage value. */
export function isAppLanguage(input: unknown): input is AppLanguage {
  return (
    typeof input === "string" &&
    (i18nConfig.supportedLngs as readonly string[]).includes(input)
  );
}

/** Coerce any string into a valid AppLanguage, falling back to the configured default. */
export function toAppLanguage(input: string | undefined | null): AppLanguage {
  if (isAppLanguage(input)) return input;
  return i18nConfig.fallbackLng as AppLanguage;
}

/** Extracts and validates the language segment from a Request URL like `/en/...`. */
export function langFromRequest(req: Request): AppLanguage {
  const [, seg] = new URL(req.url).pathname.split("/");
  return toAppLanguage(seg);
}
