// src/routes/guides/amalfi-coast-cuisine-guide.constants.ts
import type { BreadcrumbList } from "@/components/seo/BreadcrumbStructuredData";

export const handle = { tags: ["cuisine", "amalfi", "positano", "food"] } as const;

export type ItemListEntry = { name: string; note?: string };
export type GalleryTranslation = { alt?: string; caption?: string };
export type FallbackTocItem = { href: string; label: string };
export type FallbackSection = { id: string; title: string; body: string[] };

export const GUIDE_KEY = "cuisineAmalfiGuide" as const;
export const GUIDE_SLUG = "amalfi-coast-cuisine-guide" as const;
export const SIGNATURE_DISHES_SECTION_ID = "signature-dishes" as const;
export const STRUCTURED_DATA_MIME = "application/ld+json" as const;

export const EMPTY_ITEM_LIST: ItemListEntry[] = [];

export const GALLERY_SOURCES = [
  "/img/amalfi-cuisine-seafood.avif",
  "/img/amalfi-cuisine-dessert.avif",
  "/img/amalfi-cuisine-limoncello.avif",
] as const;

export type CuisineBreadcrumb = BreadcrumbList;
