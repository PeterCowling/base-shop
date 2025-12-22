// src/utils/seo/jsonld/breadcrumb.ts

export interface BreadcrumbItemInput {
  name: string;
  item: string; // absolute URL preferred
}

export interface BuildBreadcrumbInput {
  lang?: string;
  items: readonly BreadcrumbItemInput[];
}

export function buildBreadcrumbList(input: BuildBreadcrumbInput): Record<string, unknown> | null {
  const elements = input.items
    .map((it, idx) => {
      const name = typeof it?.name === "string" ? it.name.trim() : "";
      const item = typeof it?.item === "string" ? it.item.trim() : "";
      if (!name || !item) return null;
      return { "@type": "ListItem", position: idx + 1, name, item };
    })
    .filter((e): e is { "@type": "ListItem"; position: number; name: string; item: string } => e != null);

  if (elements.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    ...(input.lang ? { inLanguage: input.lang } : {}),
    itemListElement: elements,
  };
}

