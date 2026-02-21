export function itemListJsonLd({
  url,
  items,
}: {
  url?: string;
  items: Array<{ name: string; url: string; position?: number }>;
}): Record<string, unknown> | null {
  if (items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    ...(url ? { url } : {}),
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: item.position ?? idx + 1,
      name: item.name,
      url: item.url,
    })),
  };
}
