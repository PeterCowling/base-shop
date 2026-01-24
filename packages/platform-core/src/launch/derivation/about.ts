import { aboutPageTemplates } from "@acme/templates";

import type { DeriveContentInput, DerivedPage } from "../types";

import { cloneComponents, fillTemplateText, pickTemplate, updateComponents } from "./helpers";

export function deriveAboutPage(input: DeriveContentInput): DerivedPage {
  const template = pickTemplate(aboutPageTemplates, "core.page.about.default", "about page");
  const components = cloneComponents(template);
  const warnings: string[] = [];

  const missionText = input.shop.description?.trim();

  updateComponents(components, (component) => component.type === "HeroBanner", (component) => {
    const hero = component as { slides?: Array<Record<string, unknown>> };
    const slides = Array.isArray(hero.slides) ? hero.slides : [];
    for (const slide of slides) {
      slide.headlineKey = `About ${input.shop.name}`;
      slide.ctaKey = "Shop now";
      slide.alt ??= `${input.shop.name} about`;
    }
  });

  updateComponents(components, (component) => component.type === "Text", (component) => {
    if (component.id !== "about-mission") return;
    const fallback = fillTemplateText(
      typeof (component as { text?: string | Record<string, string> }).text === "string"
        ? (component as { text?: string }).text ?? ""
        : ((component as { text?: Record<string, string> }).text ?? {})[input.shop.locale] ?? "",
      input.shop.name,
    );
    if (!missionText) {
      warnings.push("Shop description missing; used default about copy.");
    }
    (component as { text?: string }).text = missionText || fallback || `About ${input.shop.name}.`;
  });

  updateComponents(components, (component) => component.type === "Callout", (component) => {
    const callout = component as { title?: string };
    callout.title = `Get in touch with ${input.shop.name}`;
  });

  const seoTitle = `About ${input.shop.name}`;
  const seoDescription = input.shop.description?.trim() || input.seo.description || `Learn about ${input.shop.name}.`;

  return {
    type: "about",
    slug: "/about",
    templateId: template.id,
    components,
    seo: { title: seoTitle, description: seoDescription },
    warnings,
  };
}
