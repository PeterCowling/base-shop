// src/utils/tags/normalizers.ts
// -----------------------------------------------------------------------------
// Normalization helpers for tag resources and metadata.
// -----------------------------------------------------------------------------

import type { TagMeta } from "@/utils/tagSchema";

import type { TagsResource } from "./types";

export const normalise = (value?: string): string => (typeof value === "string" ? value.trim() : "");

export const parseTagsResource = (
  primary?: TagsResource | null,
  fallback?: TagsResource | null,
): Record<string, TagMeta> => {
  const entries: Record<string, TagMeta> = {};
  const primaryTags = primary?.tags ?? {};
  const fallbackTags = fallback?.tags ?? {};

  const primaryKeys = Object.keys(primaryTags);
  const fallbackKeys = Object.keys(fallbackTags);

  if (primaryKeys.length === 0 && fallbackKeys.length === 0) {
    return {};
  }

  const keys = Array.from(new Set([...primaryKeys, ...fallbackKeys]));

  const hasOwn = (obj: unknown, key: string): boolean =>
    Boolean(obj) && Object.prototype.hasOwnProperty.call(obj, key);

  const buildMeta = (tag: string): TagMeta | undefined => {
    const primaryEntry = primaryTags[tag];
    const fallbackEntry = fallbackTags[tag];

    const label = hasOwn(primaryEntry, "label")
      ? normalise(primaryEntry?.label) || tag
      : normalise(fallbackEntry?.label) || tag;
    if (!label) return undefined;

    const title = hasOwn(primaryEntry, "title")
      ? normalise(primaryEntry?.title) || tag
      : normalise(fallbackEntry?.title) || tag;

    const description = hasOwn(primaryEntry, "description")
      ? normalise(primaryEntry?.description) || undefined
      : normalise(fallbackEntry?.description) || undefined;

    return description ? { label, title, description } : { label, title };
  };

  keys.forEach((tag) => {
    const meta = buildMeta(tag);
    if (!meta) return;
    entries[tag] = meta;
  });
  return entries;
};
