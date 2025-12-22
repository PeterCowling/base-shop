import type { TFunction } from "i18next";

import { ensureArray, ensureStringArray } from "@/utils/i18nContent";

import type { GalleryContent, GalleryItem, ItemListEntry } from "./types";

const ITEM_LIST_KEY = "content.sunsetViewpoints.itemList" as const;
const GALLERY_KEY = "content.sunsetViewpoints.gallery" as const;
const FAQ_KEY = "content.sunsetViewpoints.faqs" as const;
const INTRO_KEY = "content.sunsetViewpoints.intro" as const;
const SECTIONS_KEY = "content.sunsetViewpoints.sections" as const;
const TIPS_KEY = "content.sunsetViewpoints.tips" as const;

type GuidesTranslator = TFunction<string>;

type GalleryData = { title?: unknown; items?: unknown } | undefined;

type RawFaqRecord = Record<string, unknown>;

type StructuredSections = Record<string, unknown>;

export function getItemList(translator: GuidesTranslator): ItemListEntry[] {
  const raw = ensureArray<RawFaqRecord>(
    translator(ITEM_LIST_KEY, { returnObjects: true }) as RawFaqRecord[],
  );

  return raw
    .map((entry) => {
      const name = typeof entry?.["name"] === "string" ? entry["name"] : undefined;
      const note = typeof entry?.["note"] === "string" ? entry["note"] : undefined;
      if (!name || !note) return null;
      return { name, note } satisfies ItemListEntry;
    })
    .filter((entry): entry is ItemListEntry => entry !== null);
}

export function getGallery(translator: GuidesTranslator): GalleryContent {
  const data = translator(GALLERY_KEY, { returnObjects: true }) as GalleryData;

  const title = typeof data?.["title"] === "string" ? data["title"] : undefined;
  const items = ensureArray<GalleryItem>(data?.["items"] as GalleryItem[])
    .map((entry) => {
      const caption = typeof entry?.["caption"] === "string" ? entry["caption"] : undefined;
      const alt = typeof entry?.["alt"] === "string" ? entry["alt"] : undefined;
      if (!caption || !alt) return null;
      return { caption, alt } satisfies GalleryItem;
    })
    .filter((entry): entry is GalleryItem => entry !== null);

  return { ...(typeof title === "string" ? { title } : {}), items };
}

export function getFaqRecords(translator: GuidesTranslator): RawFaqRecord[] {
  return ensureArray<RawFaqRecord>(
    translator(FAQ_KEY, { returnObjects: true }) as RawFaqRecord[],
  );
}

export function getStructuredIntro(translator: GuidesTranslator): string[] {
  return ensureStringArray(translator(INTRO_KEY, { returnObjects: true }));
}

export function getStructuredSections(translator: GuidesTranslator): StructuredSections[] {
  return ensureArray<StructuredSections>(
    translator(SECTIONS_KEY, { returnObjects: true }) as StructuredSections[],
  );
}

export function getStructuredTips(translator: GuidesTranslator): string[] {
  return ensureStringArray(translator(TIPS_KEY, { returnObjects: true }));
}
