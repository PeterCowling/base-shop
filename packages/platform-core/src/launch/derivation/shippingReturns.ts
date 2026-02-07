import type { LegalBundle } from "@acme/templates";
import { shippingReturnsPageTemplates } from "@acme/templates";

import type { DeriveContentInput, DerivedPage } from "../types";

import { cloneComponents, pickTemplate, truncate, updateComponents } from "./helpers";

function findSectionByHeading(
  sections: Array<{ heading: string; body: string }>,
  keyword: string,
): string | undefined {
  const lower = keyword.toLowerCase();
  const match = sections.find((section) => section.heading.toLowerCase().includes(lower));
  return match?.body;
}

export function deriveShippingReturnsPage(
  input: DeriveContentInput,
  legalBundle: LegalBundle,
): DerivedPage {
  const template = pickTemplate(
    shippingReturnsPageTemplates,
    "core.page.shipping-returns.default",
    "shipping & returns page",
  );
  const components = cloneComponents(template);
  const warnings: string[] = [];
  const sections = legalBundle.documents.returns.sections;

  const shipping = findSectionByHeading(sections, "shipping") ?? sections[0]?.body;
  const returns = findSectionByHeading(sections, "return") ?? sections[1]?.body;
  const warranty = findSectionByHeading(sections, "warranty") ?? sections[2]?.body;

  if (!shipping || !returns) {
    warnings.push("Shipping/returns content incomplete; using template defaults where needed.");
  }

  updateComponents(components, (component) => component.type === "HeroBanner", (component) => {
    const hero = component as { slides?: Array<Record<string, unknown>> };
    const slides = Array.isArray(hero.slides) ? hero.slides : [];
    for (const slide of slides) {
      slide.headlineKey = `Shipping & Returns | ${input.shop.name}`;
      slide.ctaKey = "Shop now";
      slide.alt ??= `${input.shop.name} shipping and returns`;
    }
  });

  updateComponents(components, (component) => component.type === "PoliciesAccordion", (component) => {
    const accordion = component as { shipping?: string; returns?: string; warranty?: string };
    if (shipping) accordion.shipping = shipping;
    if (returns) accordion.returns = returns;
    if (warranty) accordion.warranty = warranty;
  });

  const seoTitle = `Shipping & Returns | ${input.shop.name}`;
  const seoDescription = truncate(returns ?? shipping ?? "", 160) || input.seo.description || "";

  return {
    type: "shipping-returns",
    slug: "/shipping-returns",
    templateId: template.id,
    components,
    seo: { title: seoTitle, description: seoDescription },
    warnings,
  };
}
