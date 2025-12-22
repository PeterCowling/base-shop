// src/routes/guides/cheapEatsInPositano/getTableOfContentsItems.ts
import type { Recommendation, StructuredFaq, StructuredSection } from "./constants";
import { FAQ_SECTION_ID, RECOMMENDATIONS_SECTION_ID } from "./constants";

export type TableOfContentsItem = {
  href: string;
  label: string;
};

export type TableOfContentsInput = {
  sections: StructuredSection[];
  recommendations: Recommendation[];
  faqs: StructuredFaq[];
  recommendationsLabel: string;
  faqLabel: string;
};

export function getTableOfContentsItems({
  sections,
  recommendations,
  faqs,
  recommendationsLabel,
  faqLabel,
}: TableOfContentsInput): TableOfContentsItem[] {
  const items: TableOfContentsItem[] = sections.map((section) => ({
    href: `#${section.id}`,
    label: section.title,
  }));

  if (recommendations.length > 0) {
    items.push({
      href: `#${RECOMMENDATIONS_SECTION_ID}`,
      label: recommendationsLabel,
    });
  }

  if (faqs.length > 0) {
    items.push({
      href: `#${FAQ_SECTION_ID}`,
      label: faqLabel,
    });
  }

  return items;
}
