// src/routes/guides/amalfi-coast-cuisine-guide.content.ts
import appI18n from "@/i18n";

export function determineHasCuisineContent(sources: {
  intro: unknown;
  sections: unknown;
  faqs: unknown;
}): boolean {
  const intro = Array.isArray(sources.intro) ? (sources.intro as unknown[]) : [];
  const sections = Array.isArray(sources.sections) ? (sources.sections as unknown[]) : [];
  const faqs = Array.isArray(sources.faqs) ? (sources.faqs as unknown[]) : [];

  return intro.length > 0 || sections.length > 0 || faqs.length > 0;
}

export function getExtrasAvailability(lang: string): { itemList: boolean; gallery: boolean } {
  const itemListResource = appI18n?.getResource(lang, "guides", "content.cuisineAmalfiGuide.itemList");
  const galleryResource = appI18n?.getResource(lang, "guides", "content.cuisineAmalfiGuide.gallery.items");

  return {
    itemList: itemListResource !== undefined,
    gallery: galleryResource !== undefined,
  } as const;
}
