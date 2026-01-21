// src/routes/assistance/utils.ts
import { HELP_ARTICLE_KEYS } from "@/components/assistance/HelpCentreNav";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import { articleSlug } from "@/routes.assistance-helpers";

import type { HubLinkContent } from "./assistance-hub-links";
import type { HelpArticleKey } from "./constants";
import { DEFAULT_ARTICLE_KEY } from "./constants";

export function isSupportedLanguage(value: unknown): value is AppLanguage {
  return (
    typeof value === "string" &&
    (i18nConfig.supportedLngs as ReadonlyArray<string>).includes(value as AppLanguage)
  );
}

export function resolveCurrentKey(
  lang: AppLanguage,
  slug: string | undefined,
): HelpArticleKey {
  if (!slug) return DEFAULT_ARTICLE_KEY;
  return (
    (HELP_ARTICLE_KEYS as readonly HelpArticleKey[]).find((key) => slug === articleSlug(lang, key)) ??
    DEFAULT_ARTICLE_KEY
  );
}

export function buildHubLinkContent(
  options: Omit<HubLinkContent, "href"> & { href: string },
): HubLinkContent {
  const eyebrow = options.eyebrow?.trim() ? options.eyebrow : undefined;
  const summary = options.summary?.trim() ? options.summary : undefined;
  const metaDescription = options.metaDescription?.trim() ? options.metaDescription : undefined;
  return {
    title: options.title,
    href: options.href,
    ...(eyebrow !== undefined ? { eyebrow } : {}),
    ...(summary !== undefined ? { summary } : {}),
    ...(metaDescription !== undefined ? { metaDescription } : {}),
  };
}

export function coerceMetaValue(value: unknown, key: string): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || value === key) return undefined;
  return value;
}
