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

  keys.forEach((tag) => {
    const primaryEntry = primaryTags[tag];
    const fallbackEntry = fallbackTags[tag];

    const hasPrimaryLabel = !!primaryEntry && Object.prototype.hasOwnProperty.call(primaryEntry, "label");
    const hasPrimaryTitle = !!primaryEntry && Object.prototype.hasOwnProperty.call(primaryEntry, "title");
    const hasPrimaryDescription =
      !!primaryEntry && Object.prototype.hasOwnProperty.call(primaryEntry, "description");

    const primaryLabel = normalise(primaryEntry?.label);
    const fallbackLabel = normalise(fallbackEntry?.label);
    const label = hasPrimaryLabel ? primaryLabel || tag : fallbackLabel || tag;

    if (!label) return;

    const primaryTitle = normalise(primaryEntry?.title);
    const fallbackTitle = normalise(fallbackEntry?.title);
    const title = hasPrimaryTitle ? primaryTitle || tag : fallbackTitle || tag;

    const primaryDescription = normalise(primaryEntry?.description);
    const fallbackDescription = normalise(fallbackEntry?.description);
    const description = hasPrimaryDescription ? primaryDescription || undefined : fallbackDescription || undefined;

    entries[tag] = description ? { label, title, description } : { label, title };
  });
  return entries;
};

