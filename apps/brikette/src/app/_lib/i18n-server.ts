// src/app/_lib/i18n-server.ts
// Server-side i18n utilities for App Router
import "server-only";

import type { TFunction } from "i18next";
import i18n from "i18next";

import { type AppLanguage,i18nConfig } from "@/i18n.config";
import { preloadI18nNamespaces, preloadNamespacesWithFallback } from "@/utils/loadI18nNs";

/**
 * Validate and normalize language parameter
 */
export function toAppLanguage(lang: string | undefined): AppLanguage {
  if (lang && i18nConfig.supportedLngs.includes(lang as AppLanguage)) {
    return lang as AppLanguage;
  }
  return i18nConfig.fallbackLng as AppLanguage;
}

/**
 * Load translations and return a translation function for server components.
 * This replaces the clientLoader pattern for i18n in App Router.
 */
export async function getTranslations(
  lang: string | AppLanguage,
  namespace: string | string[],
  options?: { optional?: boolean }
): Promise<TFunction> {
  const validLang = toAppLanguage(lang);
  const namespaces = Array.isArray(namespace) ? namespace : [namespace];

  // Preload required namespaces
  if (options?.optional) {
    await preloadI18nNamespaces(validLang, namespaces, { optional: true });
  } else {
    await preloadNamespacesWithFallback(validLang, namespaces as readonly string[]);
  }

  // Ensure language is set
  if (i18n.language !== validLang) {
    await i18n.changeLanguage(validLang);
  }

  const ns = namespaces[0] ?? null;
  return i18n.getFixedT(validLang, ns);
}

/**
 * Get multiple translation functions for different namespaces
 */
export async function getMultipleTranslations(
  lang: string | AppLanguage,
  namespaces: string[]
): Promise<Record<string, TFunction>> {
  const validLang = toAppLanguage(lang);

  await preloadNamespacesWithFallback(validLang, namespaces);

  if (i18n.language !== validLang) {
    await i18n.changeLanguage(validLang);
  }

  const result: Record<string, TFunction> = {};
  for (const ns of namespaces) {
    result[ns] = i18n.getFixedT(validLang, ns);
  }
  return result;
}

/**
 * Resolve i18n meta (title, description) for a page
 */
export async function resolveI18nMetaForApp(
  lang: string | AppLanguage,
  namespace: string
): Promise<{ title: string; description: string }> {
  const t = await getTranslations(lang, namespace);
  return {
    title: t("meta.title", { defaultValue: "" }) as string,
    description: t("meta.description", { defaultValue: "" }) as string,
  };
}
