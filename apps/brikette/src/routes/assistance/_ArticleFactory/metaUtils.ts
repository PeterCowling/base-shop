// src/routes/assistance/_ArticleFactory/metaUtils.ts
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import type { MetaKey } from "./types";

export function normaliseMeta(value: unknown, key: MetaKey): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed === key) return undefined;
  return trimmed;
}

export function resolveMeta(lang: AppLanguage, namespace: string, key: MetaKey): string {
  const translator = i18n.getFixedT(lang, namespace);
  const fallbackTranslator = lang === "en" ? translator : i18n.getFixedT("en", namespace);

  return (
    normaliseMeta(translator(key), key) ??
    normaliseMeta(fallbackTranslator(key), key) ??
    ""
  );
}

