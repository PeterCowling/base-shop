"use client";

import { ulid } from "ulid";
import type { PageComponent } from "@acme/types";

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
} as any);

export const presetList: PresetDef[] = [
  // Hero
  {
    id: "hero-simple",
    label: "Hero: Simple",
    description: "Centered headline with subcopy and CTA",
    preview: "/window.svg",
    previewType: "HeroBanner",
    category: "Hero",
    build: () => section([
      { id: ulid(), type: "HeroBanner", title: { en: "Welcome" } as any, subtitle: { en: "Discover our new arrivals" } as any, ctaLabel: { en: "Shop now" } as any, ctaHref: "/shop" } as any,
    ]),
  },
  {
    id: "hero-split",
    label: "Hero: Split Image",
    description: "Two-column hero with image",
    preview: "/window.svg",
    previewType: "MultiColumn",
    category: "Hero",
    build: () => section([
      { id: ulid(), type: "TwoColumn", children: [
        { id: ulid(), type: "Heading", text: { en: "Elevate your style" } as any } as any,
        { id: ulid(), type: "Image", src: "/hero.jpg", alt: { en: "Hero" } as any } as any,
      ] } as any,
    ], "48px"),
  },

  // Features
  {
    id: "features-3-col",
    label: "Features: 3 Columns",
    description: "Three-value proposition grid",
    preview: "/window.svg",
    previewType: "MultiColumn",
    category: "Features",
    build: () => section([
      { id: ulid(), type: "MultiColumn", columns: 3, children: [
        { id: ulid(), type: "ValueProps", title: { en: "Fast" } as any } as any,
        { id: ulid(), type: "ValueProps", title: { en: "Reliable" } as any } as any,
        { id: ulid(), type: "ValueProps", title: { en: "Secure" } as any } as any,
      ] } as any,
    ], "24px"),
  },
  {
    id: "features-4-grid",
    label: "Features: 4-Grid",
    description: "Icon grid with captions",
    preview: "/window.svg",
    previewType: "Grid",
    category: "Features",
    build: () => section([
      { id: ulid(), type: "MultiColumn", columns: 4, children: Array.from({ length: 4 }).map((_, i) => ({ id: ulid(), type: "ValueProps", title: { en: `Feature ${i+1}` } as any })) } as any,
    ]),
  },

  // Testimonials
  {
    id: "testimonials-carousel",
    label: "Testimonials: Carousel",
    description: "Auto-playing testimonial quotes",
    preview: "/window.svg",
    previewType: "Testimonials",
    category: "Testimonials",
    build: () => section([
      { id: ulid(), type: "Testimonials", style: "carousel", items: [
        { id: ulid(), quote: { en: "Love this!" } as any, author: { en: "Alex" } as any },
        { id: ulid(), quote: { en: "Changed my workflow." } as any, author: { en: "Sam" } as any },
      ] } as any,
    ]),
  },
  {
    id: "testimonials-grid",
    label: "Testimonials: Grid",
    description: "Three-column static quotes",
    preview: "/window.svg",
    previewType: "Testimonials",
    category: "Testimonials",
    build: () => section([
      { id: ulid(), type: "MultiColumn", columns: 3, children: [
        { id: ulid(), type: "Testimonial", quote: { en: "Great quality" } as any, author: { en: "Jamie" } as any } as any,
        { id: ulid(), type: "Testimonial", quote: { en: "Fast shipping" } as any, author: { en: "Taylor" } as any } as any,
        { id: ulid(), type: "Testimonial", quote: { en: "Will buy again" } as any, author: { en: "Riley" } as any } as any,
      ] } as any,
    ]),
  },

  // Commerce
  {
    id: "commerce-featured",
    label: "Commerce: Featured Products",
    description: "Carousel of featured products",
    preview: "/window.svg",
    previewType: "ProductCarousel",
    category: "Commerce",
    build: () => section([
      { id: ulid(), type: "ProductCarousel", query: { kind: "featured" } } as any,
    ]),
  },
  {
    id: "commerce-grid",
    label: "Commerce: Product Grid",
    description: "4-up grid from collection",
    preview: "/window.svg",
    previewType: "ProductGrid",
    category: "Commerce",
    build: () => section([
      { id: ulid(), type: "ProductGrid", columns: 4, query: { kind: "collection", handle: "new" } } as any,
    ]),
  },
  {
    id: "commerce-cta",
    label: "Commerce: CTA Banner",
    description: "Promo strip with CTA",
    preview: "/window.svg",
    previewType: "HeroBanner",
    category: "Commerce",
    build: () => section([
      { id: ulid(), type: "Callout", title: { en: "Summer Sale" } as any, ctaLabel: { en: "Shop sale" } as any, ctaHref: "/sale" } as any,
    ], "20px"),
  },
];
