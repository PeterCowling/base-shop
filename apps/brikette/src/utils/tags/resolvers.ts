// src/utils/tags/resolvers.ts
// -----------------------------------------------------------------------------
// Resolvers for tag metadata across locales (resource lookup + dictionary).
// -----------------------------------------------------------------------------

import i18n from "@/i18n";
import { i18nConfig } from "@/i18n.config";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- LINT-1007 [ttl=2026-12-31] JSON import is provided by build tooling
// @ts-ignore - resolveJsonModule handles JSON at build time
import EN_GUIDES_TAGS from "@/data/tags/en.json";
import type { TagDictionary, TagMeta, TagsResource } from "./types";
import { normalise, parseTagsResource } from "./normalizers";

const EN_TAGS_RESOURCE: TagsResource = EN_GUIDES_TAGS ?? {};

const isTagsResource = (value: unknown): value is TagsResource => {
  if (!value || typeof value !== "object") return false;
  const record = value as { tags?: unknown };
  return !!record.tags && typeof record.tags === "object";
};

const getTagsResource = (lang: string): TagsResource | undefined => {
  const data = i18n.getDataByLanguage?.(lang);
  if (!data || typeof data !== "object") return undefined;

  if (isTagsResource(data)) {
    return data;
  }

  const namespace = (data as Record<string, unknown>)["guides.tags"];
  if (isTagsResource(namespace)) {
    return namespace;
  }

  return undefined;
};

const resolveFallbackLanguage = (): string => {
  const option = i18n.options?.fallbackLng;
  if (Array.isArray(option) && option.length > 0) return option[0];
  if (typeof option === "string" && option) return option;
  const configFallback = i18nConfig.fallbackLng;
  if (Array.isArray(configFallback) && configFallback.length > 0) return configFallback[0];
  if (typeof configFallback === "string" && configFallback) return configFallback;
  return "en";
};

export const getTagMeta = (lang: string, tag: string): TagMeta => {
  const primary = getTagsResource(lang);
  const fallbackLang = resolveFallbackLanguage();
  const fallback = getTagsResource(fallbackLang);
  const parsed = parseTagsResource(primary, fallback);
  if (parsed[tag]) return parsed[tag];
  const english = EN_TAGS_RESOURCE.tags?.[tag];
  if (english) {
    const label = normalise(english.label) || tag;
    const title = normalise(english.title) || tag;
    const description = normalise(english.description);
    return description ? { label, title, description } : { label, title };
  }
  return { label: tag, title: tag };
};

export const buildTagDictionary = (languages?: readonly string[]): TagDictionary => {
  const fallbackLang = resolveFallbackLanguage();
  const fallbackResource = getTagsResource(fallbackLang) ?? EN_TAGS_RESOURCE;

  const targetLangs =
    languages && languages.length > 0
      ? Array.from(new Set(languages.map((lang) => String(lang))))
      : (i18nConfig.supportedLngs as readonly string[]);

  return targetLangs.reduce<TagDictionary>((acc, lang) => {
    const resource = getTagsResource(lang);
    if (languages && languages.length > 0) {
      const primaryTags = resource?.tags ?? {};
      const keys = Object.keys(primaryTags);
      if (keys.length === 0) {
        const merged = parseTagsResource(undefined, fallbackResource);
        if (Object.keys(merged).length > 0) {
          acc[lang] = { ...merged };
        }
        return acc;
      }
      const fallbackTags = fallbackResource?.tags ?? {};
      const entries = keys.reduce<Record<string, TagMeta>>((map, key) => {
        const primary = { tags: { [key]: primaryTags[key] } } as TagsResource;
        const fallback = fallbackTags[key]
          ? ({ tags: { [key]: fallbackTags[key] } } as TagsResource)
          : ({} as TagsResource);
        const parsed = parseTagsResource(primary, fallback);
        if (parsed[key]) map[key] = parsed[key];
        return map;
      }, {});
      if (Object.keys(entries).length > 0) {
        acc[lang] = entries;
      }
      return acc;
    }

    const merged = parseTagsResource(resource, fallbackResource);
    if (Object.keys(merged).length > 0) acc[lang] = { ...merged };
    return acc;
  }, {});
};

export { resolveFallbackLanguage };
