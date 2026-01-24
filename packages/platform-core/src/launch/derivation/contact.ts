import { contactPageTemplates } from "@acme/templates";

import type { DeriveContentInput, DerivedPage } from "../types";

import { cloneComponents, pickTemplate, updateComponents } from "./helpers";

export function deriveContactPage(input: DeriveContentInput): DerivedPage {
  const template = pickTemplate(contactPageTemplates, "core.page.contact.default", "contact page");
  const components = cloneComponents(template);

  const details = [
    input.shop.supportEmail ? `Support: ${input.shop.supportEmail}` : null,
    input.shop.contactEmail ? `Sales: ${input.shop.contactEmail}` : null,
    input.shop.returnsAddress ? `Returns: ${input.shop.returnsAddress}` : null,
  ].filter(Boolean) as string[];

  const detailsText = details.length
    ? details.join(" · ")
    : `Email us at ${input.shop.supportEmail || input.shop.contactEmail}.`;

  updateComponents(components, (component) => component.type === "HeroBanner", (component) => {
    const hero = component as { slides?: Array<Record<string, unknown>> };
    const slides = Array.isArray(hero.slides) ? hero.slides : [];
    for (const slide of slides) {
      slide.headlineKey = `Contact ${input.shop.name}`;
      slide.ctaKey = "Get support";
      slide.alt ??= `${input.shop.name} contact`;
    }
  });

  updateComponents(components, (component) => component.type === "Text", (component) => {
    if (component.id === "contact-details") {
      (component as { text?: string }).text = detailsText;
    }
  });

  const seoTitle = `Contact ${input.shop.name}`;
  const seoDescription = `Get in touch with ${input.shop.name}.`;

  return {
    type: "contact",
    slug: "/contact",
    templateId: template.id,
    components,
    seo: { title: seoTitle, description: seoDescription },
    warnings: [],
  };
}
