// src/routes/guides/amalfi-coast-cuisine-guide.item-list.ts
import type { TFunction } from "i18next";

import { ensureArray } from "@/utils/i18nContent";

import {
  EMPTY_ITEM_LIST,
  GUIDE_KEY,
  type ItemListEntry,
} from "./amalfi-coast-cuisine-guide.constants";
import type { EnglishFallbacks } from "./amalfi-coast-cuisine-guide.fallbacks";

interface ItemListContext {
  translator: TFunction<"guides">;
  lang: string;
  englishFallbacks: EnglishFallbacks;
  hasItemList: boolean;
  title: string;
  description: string;
  pathname: string;
}

interface ItemListResult {
  entries: ItemListEntry[];
  title: string;
  json: string;
}

function buildStructuredItemList(translator: TFunction<"guides">, hasItemList: boolean): ItemListEntry[] {
  if (!hasItemList) {
    return EMPTY_ITEM_LIST;
  }

  return ensureArray<{ name?: string; note?: string }>(
    translator(`content.${GUIDE_KEY}.itemList`, { returnObjects: true }),
  )
    .map((entry) => ({
      name: typeof entry?.name === "string" ? entry.name.trim() : "",
      ...(typeof entry?.note === "string" && entry.note.trim().length > 0
        ? { note: entry.note.trim() }
        : {}),
    }))
    .filter((entry) => entry.name.length > 0);
}

function resolveItemListTitle(
  translator: TFunction<"guides">,
  englishFallbackTitle: string,
): string {
  const itemListTitleRaw = translator(`content.${GUIDE_KEY}.itemListTitle`, { defaultValue: "" });
  const fallbackTitleRaw = translator(`fallbacks.${GUIDE_KEY}.itemListTitle`, {
    defaultValue: englishFallbackTitle,
  });

  const itemListTitleCandidate =
    typeof itemListTitleRaw === "string" && itemListTitleRaw.trim().length > 0
      ? itemListTitleRaw.trim()
      : undefined;
  const fallbackTitleCandidate =
    typeof fallbackTitleRaw === "string" && fallbackTitleRaw.trim().length > 0
      ? fallbackTitleRaw.trim()
      : undefined;

  return itemListTitleCandidate ?? fallbackTitleCandidate ?? englishFallbackTitle;
}

function toItemListJson(
  itemList: ItemListEntry[],
  context: Pick<ItemListContext, "lang" | "title" | "description" | "pathname">,
): string {
  if (!itemList.length) return "";

  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    inLanguage: context.lang,
    name: context.title,
    description: context.description,
    url: `https://hostel-positano.com${context.pathname}`,
    itemListElement: itemList.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      description: entry.note,
    })),
  });
}

export function buildCuisineItemList(context: ItemListContext): ItemListResult {
  const structuredItemList = buildStructuredItemList(context.translator, context.hasItemList);
  const title = resolveItemListTitle(context.translator, context.englishFallbacks.itemListTitle);

  const entries = (() => {
    if (structuredItemList.length > 0) {
      return structuredItemList;
    }
    if (context.lang === "en") {
      return context.englishFallbacks.itemList;
    }
    return EMPTY_ITEM_LIST;
  })();

  const json = toItemListJson(entries, context);

  return { entries, title, json };
}
