import { slugify } from "@acme/lib/string";
import { cloneTemplateComponents, type TemplateDescriptor } from "@acme/page-builder-core";
import type { MediaItem, PageComponent, SKU } from "@acme/types";

import type { DeriveContentInput, LaunchProductInput } from "../types";

export function pickTemplate(
  templates: TemplateDescriptor[],
  preferredId: string,
  label: string,
): TemplateDescriptor {
  const preferred = templates.find((tpl) => tpl.id === preferredId);
  if (preferred) return preferred;
  if (templates.length > 0) return templates[0];
  throw new Error(`No templates available for ${label}.`);
}

export function cloneComponents(template: TemplateDescriptor): PageComponent[] {
  return cloneTemplateComponents(template);
}

export function walkComponents(
  components: PageComponent[],
  visitor: (component: PageComponent) => void,
): void {
  for (const component of components) {
    visitor(component);
    const children = (component as { children?: PageComponent[] }).children;
    if (Array.isArray(children)) {
      walkComponents(children, visitor);
    }
  }
}

export function updateComponents(
  components: PageComponent[],
  predicate: (component: PageComponent) => boolean,
  updater: (component: PageComponent) => void,
): void {
  walkComponents(components, (component) => {
    if (predicate(component)) updater(component);
  });
}

export function replaceComponents(
  components: PageComponent[],
  predicate: (component: PageComponent) => boolean,
  replacements: (component: PageComponent) => PageComponent[],
): PageComponent[] {
  const next: PageComponent[] = [];
  for (const component of components) {
    if (predicate(component)) {
      next.push(...replacements(component));
      continue;
    }
    const children = (component as { children?: PageComponent[] }).children;
    if (Array.isArray(children)) {
      (component as { children?: PageComponent[] }).children = replaceComponents(
        children,
        predicate,
        replacements,
      );
    }
    next.push(component);
  }
  return next;
}

export function toLocaleRecord(locale: string, value: string): Record<string, string> {
  return { [locale]: value };
}

export function fillTemplateText(text: string, shopName: string): string {
  return text.replace(/\{\{shopName\}\}/g, shopName);
}

export function substituteLegalPlaceholders(text: string, input: DeriveContentInput): string {
  return text
    .replace(/\[Company Name\]/g, input.shop.name)
    .replace(/\[email address\]/g, input.shop.supportEmail)
    .replace(/\[BUSINESS_ADDRESS\]/g, input.shop.returnsAddress ?? "")
    .replace(/\[VAT_NUMBER\]/g, "");
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trim();
}

export function buildSkus(products: LaunchProductInput[]): { skus: SKU[]; byId: Map<string, SKU> } {
  const skus = products.map((product) => buildSku(product));
  return {
    skus,
    byId: new Map(skus.map((sku) => [sku.id, sku])),
  };
}

export function buildSku(product: LaunchProductInput): SKU {
  const slug = slugify(product.name) || product.id;
  const media: MediaItem[] = (product.images ?? []).map((url, index) => ({
    url,
    type: "image",
    altText: product.name ? `${product.name} ${index + 1}` : undefined,
  }));
  const totalStock = product.variants?.reduce((sum, variant) => sum + (variant.stock ?? 0), 0) ?? 0;
  const stock = totalStock > 0 ? totalStock : product.variants?.length ? 0 : 1;

  return {
    id: product.id,
    slug,
    title: product.name,
    price: product.price,
    deposit: 0,
    stock,
    forSale: true,
    forRental: false,
    media,
    sizes: product.sizes ?? [],
    description: product.description,
  };
}

export function uniqueList(values: Array<string | undefined | null>): string[] {
  const set = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    set.add(trimmed);
  }
  return Array.from(set);
}

export function joinSentence(values: string[]): string {
  if (values.length === 0) return "";
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
}
