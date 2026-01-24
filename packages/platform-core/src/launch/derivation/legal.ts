import type { TemplateDescriptor } from "@acme/page-builder-core";
import type { LegalBundle, LegalDocument } from "@acme/templates";
import { accessibilityPageTemplates, privacyPageTemplates, termsPageTemplates } from "@acme/templates";
import type { PageComponent } from "@acme/types";

import type { DeriveContentInput, DerivedPage, PageType } from "../types";

import {
  cloneComponents,
  pickTemplate,
  replaceComponents,
  substituteLegalPlaceholders,
  updateComponents,
} from "./helpers";

function buildLegalSections(
  input: DeriveContentInput,
  sections: LegalDocument["sections"],
  prefix: string,
): PageComponent[] {
  return sections.map((section, index) => {
    const heading = substituteLegalPlaceholders(section.heading, input);
    const body = substituteLegalPlaceholders(section.body, input);
    return {
      id: `${prefix}-section-${index + 1}`,
      type: "Section",
      children: [
        {
          id: `${prefix}-section-${index + 1}-heading`,
          type: "Text",
          tag: "h2",
          text: heading,
        },
        {
          id: `${prefix}-section-${index + 1}-body`,
          type: "Text",
          tag: "p",
          text: body,
        },
      ],
    } satisfies PageComponent;
  });
}

function resolveLegalDescription(pageType: PageType, shopName: string): string {
  switch (pageType) {
    case "terms":
      return `Read the terms for shopping with ${shopName}.`;
    case "privacy":
      return `Learn how ${shopName} handles your data.`;
    case "accessibility":
      return `Accessibility statement for ${shopName}.`;
    default:
      return `Legal information for ${shopName}.`;
  }
}

function deriveLegalPage(
  input: DeriveContentInput,
  document: LegalDocument,
  template: TemplateDescriptor,
  pageType: PageType,
  slug: string,
): DerivedPage {
  const components = cloneComponents(template);
  const warnings: string[] = [];
  const sections = document.sections ?? [];

  if (!sections.length) {
    warnings.push(`Legal document "${document.title}" has no sections.`);
  }

  const [intro, ...rest] = sections;
  const bodySections = rest.length ? rest : sections;

  updateComponents(components, (component) => component.type === "HeroBanner", (component) => {
    const hero = component as { slides?: Array<Record<string, unknown>> };
    const slides = Array.isArray(hero.slides) ? hero.slides : [];
    for (const slide of slides) {
      slide.headlineKey = document.title;
      slide.ctaKey = "Shop now";
      slide.alt ??= document.title;
    }
  });

  updateComponents(components, (component) => component.type === "Text", (component) => {
    if (!component.id.includes("intro")) return;
    if (!intro) return;
    const body = substituteLegalPlaceholders(intro.body, input);
    (component as { text?: string }).text = body;
  });

  const sectionComponents = buildLegalSections(input, bodySections, `${pageType}`);
  const nextComponents = replaceComponents(
    components,
    (component) => component.type === "FAQBlock" || component.id.includes("sections"),
    () => sectionComponents,
  );

  const seoTitle = `${document.title} | ${input.shop.name}`;
  const seoDescription = resolveLegalDescription(pageType, input.shop.name) || input.seo.description || "";

  return {
    type: pageType,
    slug,
    templateId: template.id,
    components: nextComponents,
    seo: { title: seoTitle, description: seoDescription },
    warnings,
  };
}

export function deriveLegalPages(input: DeriveContentInput, legalBundle: LegalBundle): DerivedPage[] {
  const termsTemplate = pickTemplate(termsPageTemplates, "core.page.legal.terms.default", "terms page");
  const privacyTemplate = pickTemplate(privacyPageTemplates, "core.page.legal.privacy.default", "privacy page");
  const accessibilityTemplate = pickTemplate(
    accessibilityPageTemplates,
    "core.page.legal.accessibility.default",
    "accessibility page",
  );

  const terms = deriveLegalPage(
    input,
    legalBundle.documents.terms,
    termsTemplate,
    "terms",
    "/terms",
  );
  const privacy = deriveLegalPage(
    input,
    legalBundle.documents.privacy,
    privacyTemplate,
    "privacy",
    "/privacy",
  );
  const accessibility = deriveLegalPage(
    input,
    legalBundle.documents.accessibility,
    accessibilityTemplate,
    "accessibility",
    "/accessibility",
  );

  return [terms, privacy, accessibility];
}
