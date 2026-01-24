import { homePageTemplates } from "@acme/templates";
import type { SKU } from "@acme/types";

import type { DeriveContentInput, DerivedPage } from "../types";

import { cloneComponents, pickTemplate, updateComponents } from "./helpers";

export function deriveHomePage(input: DeriveContentInput, skus: SKU[]): DerivedPage {
  const template = pickTemplate(homePageTemplates, "core.page.home.default", "home page");
  const components = cloneComponents(template);
  const heroHeadline = `Welcome to ${input.shop.name}`;
  const heroCta = "Shop now";

  updateComponents(components, (component) => component.type === "HeroBanner", (component) => {
    const hero = component as { slides?: Array<Record<string, unknown>> };
    const slides = Array.isArray(hero.slides) ? hero.slides : [];
    if (slides.length === 0) {
      hero.slides = [
        {
          src: "/images/hero-placeholder.jpg",
          alt: `${input.shop.name} hero`,
          headlineKey: heroHeadline,
          ctaKey: heroCta,
        },
      ];
      return;
    }
    for (const slide of slides) {
      slide.headlineKey = heroHeadline;
      slide.ctaKey = heroCta;
      slide.alt ??= `${input.shop.name} hero`;
    }
  });

  updateComponents(components, (component) => component.type === "ProductGrid", (component) => {
    const grid = component as { skus?: SKU[]; mode?: string };
    grid.skus = skus;
    grid.mode = "manual";
  });

  const seoTitle = `${input.shop.name} | Online Shop`;
  const seoDescription = input.shop.description?.trim() || input.seo.description || `Shop ${input.shop.name} online.`;

  return {
    type: "home",
    slug: "/",
    templateId: template.id,
    components,
    seo: { title: seoTitle, description: seoDescription },
    warnings: [],
  };
}
