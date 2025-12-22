// src/routes/assistance/use-meta.ts
import { useMemo } from "react";
import type { TFunction, i18n as I18nInstance } from "i18next";
import { coerceMetaValue } from "./utils";
import enAssistanceSection from "@/locales/en/assistanceSection.json";

const ENGLISH_META_DEFAULTS = {
  title:
    typeof enAssistanceSection?.meta?.title === "string" ? enAssistanceSection.meta.title : "",
  description:
    typeof enAssistanceSection?.meta?.description === "string"
      ? enAssistanceSection.meta.description
      : "",
} as const;

export function useResolvedMeta(
  t: TFunction,
  i18n: I18nInstance | undefined,
  loaderTitle?: unknown,
  loaderDesc?: unknown,
) {
  const englishMeta = useMemo(() => {
    const translate =
      typeof i18n?.getFixedT === "function"
        ? (i18n.getFixedT("en", "assistanceSection") as
            | ((key: string) => string)
            | undefined)
        : undefined;
    const title = translate ? translate("meta.title") : undefined;
    const description = translate ? translate("meta.description") : undefined;

    return {
      title: coerceMetaValue(title, "meta.title") ?? ENGLISH_META_DEFAULTS.title,
      description:
        coerceMetaValue(description, "meta.description") ?? ENGLISH_META_DEFAULTS.description,
    } as const;
  }, [i18n]);

  return useMemo(
    () => ({
      title:
        coerceMetaValue(loaderTitle, "meta.title") ??
        coerceMetaValue(t("meta.title"), "meta.title") ??
        englishMeta.title,
      description:
        coerceMetaValue(loaderDesc, "meta.description") ??
        coerceMetaValue(t("meta.description"), "meta.description") ??
        englishMeta.description,
    }),
    [englishMeta.description, englishMeta.title, loaderDesc, loaderTitle, t],
  );
}
