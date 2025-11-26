import { z } from "zod";

export const LOCALES = ["en", "it", "zh"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

const localeSchema = z.enum(LOCALES);
const localeParamSchema = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return typeof value === "string" ? value : undefined;
}, localeSchema);

export const langRouteParamsSchema = z
  .object({
    lang: localeParamSchema.optional(),
  })
  .passthrough();

export type LangRouteParams = z.input<typeof langRouteParamsSchema>;

export function resolveLocale(value: string | string[] | undefined): Locale {
  const parsed = localeParamSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_LOCALE;
}

export function getLocaleFromParams(params?: LangRouteParams): Locale {
  const parsed = langRouteParamsSchema.safeParse(params ?? {});
  if (parsed.success && parsed.data.lang) {
    return parsed.data.lang;
  }

  return DEFAULT_LOCALE;
}
