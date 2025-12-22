// src/utils/tags/types.ts
// -----------------------------------------------------------------------------
// Types used by tag utilities plus re-exports of public tag types.
// -----------------------------------------------------------------------------

export type { TagMeta, TagDictionary } from "@/utils/tagSchema";

export interface TagsResourceEntry {
  label?: string;
  title?: string;
  description?: string;
}

export interface TagsResource {
  tags?: Record<string, TagsResourceEntry>;
}

