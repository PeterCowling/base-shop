import { slugify } from "@acme/lib/string";
import { productPageTemplates } from "@acme/templates";
import type { SKU } from "@acme/types";

import type { DeriveContentInput, DerivedPage } from "../types";

import { cloneComponents, pickTemplate, truncate, updateComponents } from "./helpers";

export function deriveProductPages(
  input: DeriveContentInput,
  skus: SKU[],
  skuById: Map<string, SKU>,
): DerivedPage[] {
  const template = pickTemplate(productPageTemplates, "core.page.product.default", "product page");

  return input.products.map((product) => {
    const components = cloneComponents(template);
    const warnings: string[] = [];
    const slug = slugify(product.name) || product.id;
    const related = skus.filter((sku) => sku.id !== product.id).slice(0, 4);

    if (!product.images?.length) {
      warnings.push(`Product "${product.name}" has no images.`);
    }

    if (!product.description?.trim()) {
      warnings.push(`Product "${product.name}" is missing a description.`);
    }

    if (!product.variants?.length) {
      warnings.push(`Product "${product.name}" has no variants.`);
    }

    updateComponents(components, (component) => component.type === "ImageSlider", (component) => {
      const slider = component as { slides?: Array<Record<string, unknown>> };
      slider.slides = (product.images ?? []).map((src, index) => ({
        id: `slide-${index + 1}`,
        src,
        alt: product.name,
      }));
    });

    updateComponents(components, (component) => component.type === "Text", (component) => {
      if (component.id !== "pdp-story") return;
      (component as { text?: string | Record<string, string> }).text = product.description;
    });

    updateComponents(components, (component) => component.type === "ProductGrid", (component) => {
      const grid = component as { skus?: SKU[]; mode?: string };
      grid.skus = related;
      grid.mode = "manual";
    });

    const seoTitle = `${product.name} | ${input.shop.name}`;
    const seoDescription = truncate(product.description ?? "", 160) || input.seo.description || "";

    if (!skuById.has(product.id)) {
      warnings.push(`Product "${product.name}" was not mapped to a SKU.`);
    }

    return {
      type: "product",
      slug: `/shop/${slug}`,
      templateId: template.id,
      components,
      seo: { title: seoTitle, description: seoDescription },
      warnings,
    };
  });
}
