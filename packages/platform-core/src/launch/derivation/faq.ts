import { faqPageTemplates } from "@acme/templates";

import type { DeriveContentInput, DerivedPage } from "../types";

import { cloneComponents, joinSentence, pickTemplate, uniqueList, updateComponents } from "./helpers";

export function deriveFaqPage(input: DeriveContentInput): DerivedPage {
  const template = pickTemplate(faqPageTemplates, "core.page.faq.default", "FAQ page");
  const components = cloneComponents(template);
  const warnings: string[] = [];

  const sizes = uniqueList(input.products.flatMap((product) => product.sizes ?? []));
  const materials = uniqueList(input.products.flatMap((product) => product.materials ?? []));

  const optionalItems: Array<{ question: string; answer: string }> = [];
  if (sizes.length) {
    optionalItems.push({
      question: "What sizes do you offer?",
      answer: `Available sizes include ${joinSentence(sizes)}.`,
    });
  } else {
    warnings.push("Sizes missing; size chart omitted from FAQ.");
  }

  if (materials.length) {
    optionalItems.push({
      question: "What materials are used?",
      answer: `Common materials include ${joinSentence(materials)}.`,
    });
  } else {
    warnings.push("Materials missing; materials section omitted from FAQ.");
  }

  updateComponents(components, (component) => component.type === "HeroBanner", (component) => {
    const hero = component as { slides?: Array<Record<string, unknown>> };
    const slides = Array.isArray(hero.slides) ? hero.slides : [];
    for (const slide of slides) {
      slide.headlineKey = `FAQ | ${input.shop.name}`;
      slide.ctaKey = "Shop now";
      slide.alt ??= `${input.shop.name} FAQ`;
    }
  });

  updateComponents(components, (component) => component.type === "FAQBlock", (component) => {
    const block = component as { items?: Array<{ question: string; answer: string }> };
    const baseItems = Array.isArray(block.items) ? block.items : [];
    block.items = [...baseItems, ...optionalItems];
  });

  const seoTitle = `FAQ | ${input.shop.name}`;
  const seoDescription = `Frequently asked questions about ${input.shop.name}.`;

  return {
    type: "faq",
    slug: "/faq",
    templateId: template.id,
    components,
    seo: { title: seoTitle, description: seoDescription },
    warnings,
  };
}
