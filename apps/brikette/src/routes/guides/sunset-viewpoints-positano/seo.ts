import type { ItemListEntry } from "./types";

type ItemListJsonOptions = {
  entries: ItemListEntry[];
  lang: string;
  pathname: string;
  title: string;
};

export function buildItemListJson({
  entries,
  lang,
  pathname,
  title,
}: ItemListJsonOptions): string {
  const itemListElement = entries.map((entry, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: entry.name,
    description: entry.note,
  }));

  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    inLanguage: lang,
    url: `https://hostel-positano.com${pathname}`,
    name: title,
    itemListElement,
  });
}
