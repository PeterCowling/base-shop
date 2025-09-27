"use client";

import { ulid } from "ulid";
import type { PageComponent } from "@acme/types";
// i18n-exempt — Preset seeds for the editor; copy is author-provided defaults and user-editable later
/* i18n-exempt */
const t = (s: string) => s;

export const presetCategories = [
  "Hero",
  "Features",
  "Testimonials",
  "Commerce",
] as const;

export type PresetCategory = typeof presetCategories[number];

export type PresetDef = {
  id: string;
  label: string;
  description?: string;
  preview: string;
  /** Optional hint to generate a schematic thumbnail when preview is missing */
  previewType?: string;
  category: PresetCategory;
  build: () => PageComponent;
};

const section = (children: PageComponent[], padding = "40px"): PageComponent => ({
  id: ulid(),
  type: "Section" as PageComponent["type"],
  padding,
  children,
});

export const presetList: PresetDef[] = [
  // Hero
  {
    id: "hero-simple",
    label: t("Hero: Simple"),
    description: t("Centered headline with subcopy and CTA"),
    preview: "/window.svg",
    previewType: "HeroBanner",
    category: "Hero",
    build: () => section([
      { id: ulid(), type: "HeroBanner", title: { en: t("Welcome") }, subtitle: { en: t("Discover our new arrivals") }, ctaLabel: { en: t("Shop now") }, ctaHref: "/shop" },
    ]),
  },
  {
    id: "hero-split",
    label: t("Hero: Split Image"),
    description: t("Two-column hero with image"),
    preview: "/window.svg",
    previewType: "MultiColumn",
    category: "Hero",
    build: () => section([
      { id: ulid(), type: "TwoColumn", children: [
        { id: ulid(), type: "Heading", text: { en: t("Elevate your style") } },
        { id: ulid(), type: "Image", src: "/hero.jpg", alt: { en: t("Hero") } },
      ] },
    ], "48px"),
  },

  // Features
  {
    id: "features-3-col",
    label: t("Features: 3 Columns"),
    description: t("Three-value proposition grid"),
    preview: "/window.svg",
    previewType: "MultiColumn",
    category: "Features",
    build: () => section([
      { id: ulid(), type: "MultiColumn", columns: 3, children: [
        { id: ulid(), type: "ValueProps", title: { en: t("Fast") } },
        { id: ulid(), type: "ValueProps", title: { en: t("Reliable") } },
        { id: ulid(), type: "ValueProps", title: { en: t("Secure") } },
      ] },
    ], "24px"),
  },
  {
    id: "features-4-grid",
    label: t("Features: 4-Grid"),
    description: t("Icon grid with captions"),
    preview: "/window.svg",
    previewType: "Grid",
    category: "Features",
    build: () => section([
      { id: ulid(), type: "MultiColumn", columns: 4, children: Array.from({ length: 4 }).map((_, i) => ({ id: ulid(), type: "ValueProps", title: { en: t(`Feature ${i+1}`) } })) },
    ]),
  },

  // Testimonials
  {
    id: "testimonials-carousel",
    label: t("Testimonials: Carousel"),
    description: t("Auto-playing testimonial quotes"),
    preview: "/window.svg",
    previewType: "Testimonials",
    category: "Testimonials",
    build: () => section([
      { id: ulid(), type: "Testimonials", style: "carousel", items: [
        { id: ulid(), quote: { en: t("Love this!") }, author: { en: t("Alex") } },
        { id: ulid(), quote: { en: t("Changed my workflow.") }, author: { en: t("Sam") } },
      ] },
    ]),
  },
  {
    id: "testimonials-grid",
    label: t("Testimonials: Grid"),
    description: t("Three-column static quotes"),
    preview: "/window.svg",
    previewType: "Testimonials",
    category: "Testimonials",
    build: () => section([
      { id: ulid(), type: "MultiColumn", columns: 3, children: [
        { id: ulid(), type: "Testimonial", quote: { en: t("Great quality") }, author: { en: t("Jamie") } },
        { id: ulid(), type: "Testimonial", quote: { en: t("Fast shipping") }, author: { en: t("Taylor") } },
        { id: ulid(), type: "Testimonial", quote: { en: t("Will buy again") }, author: { en: t("Riley") } },
      ] },
    ]),
  },

  // Commerce
  {
    id: "commerce-featured",
    label: t("Commerce: Featured Products"),
    description: t("Carousel of featured products"),
    preview: "/window.svg",
    previewType: "ProductCarousel",
    category: "Commerce",
    build: () => section([
      { id: ulid(), type: "ProductCarousel", query: { kind: "featured" } },
    ]),
  },
  {
    id: "commerce-grid",
    label: t("Commerce: Product Grid"),
    description: t("4-up grid from collection"),
    preview: "/window.svg",
    previewType: "ProductGrid",
    category: "Commerce",
    build: () => section([
      { id: ulid(), type: "ProductGrid", columns: 4, query: { kind: "collection", handle: "new" } },
    ]),
  },
  {
    id: "commerce-cta",
    label: t("Commerce: CTA Banner"),
    description: t("Promo strip with CTA"),
    preview: "/window.svg",
    previewType: "HeroBanner",
    category: "Commerce",
    build: () => section([
      { id: ulid(), type: "Callout", title: { en: t("Summer Sale") }, ctaLabel: { en: t("Shop sale") }, ctaHref: "/sale" },
    ], "20px"),
  },
];
