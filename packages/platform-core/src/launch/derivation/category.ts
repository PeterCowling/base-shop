import { shopPageTemplates } from "@acme/templates";
import type { SKU } from "@acme/types";

import type { DeriveContentInput, DerivedPage } from "../types";

import { cloneComponents, pickTemplate, updateComponents } from "./helpers";

export function deriveCategoryPage(input: DeriveContentInput, skus: SKU[]): DerivedPage {
  const template = pickTemplate(shopPageTemplates, "core.page.shop.grid", "category page");
  const components = cloneComponents(template);
  const warnings: string[] = [];

  updateComponents(components, (component) => component.type === "ProductGrid", (component) => {
    const grid = component as { skus?: SKU[]; mode?: string };
    grid.skus = skus;
    grid.mode = "manual";
  });

  if (!skus.length) {
    warnings.push("No products selected for category page.");
  }

  const seoTitle = `Shop All | ${input.shop.name}`;
  const seoDescription = `Browse our collection of ${skus.length} products.`;

  return {
    type: "category",
    slug: "/shop",
    templateId: template.id,
    components,
    seo: { title: seoTitle, description: seoDescription },
    warnings,
  };
}
