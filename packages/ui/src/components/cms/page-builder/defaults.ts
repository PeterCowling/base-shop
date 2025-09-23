import type { PageComponent } from "@acme/types";
import {
  atomRegistry,
  moleculeRegistry,
  organismRegistry,
  containerRegistry,
  layoutRegistry,
} from "../blocks";

export type ComponentType =
  | keyof typeof atomRegistry
  | keyof typeof moleculeRegistry
  | keyof typeof organismRegistry
  | keyof typeof containerRegistry
  | keyof typeof layoutRegistry;

export const CONTAINER_TYPES = Object.keys(containerRegistry) as ComponentType[];

export const defaults: Partial<Record<ComponentType, Partial<PageComponent>>> = {
  HeroBanner: { minItems: 1, maxItems: 5 },
  ValueProps: { minItems: 1, maxItems: 6 },
  ReviewsCarousel: { minItems: 1, maxItems: 10 },
  SearchBar: { placeholder: "Search products…", limit: 5 },
  ProductFilter: { showSize: true, showColor: true, showPrice: true },
  ProductGrid: {
    minItems: 1,
    maxItems: 3,
    desktopItems: 3,
    tabletItems: 2,
    mobileItems: 1,
    mode: "collection",
  },
  ProductCarousel: {
    minItems: 1,
    maxItems: 10,
    desktopItems: 4,
    tabletItems: 2,
    mobileItems: 1,
    mode: "collection",
  },
  RecommendationCarousel: { minItems: 1, maxItems: 4 },
  Testimonials: { minItems: 1, maxItems: 10 },
  TestimonialSlider: { minItems: 1, maxItems: 10 },
  ImageSlider: { minItems: 1, maxItems: 10 },
  AnnouncementBar: {
    position: "absolute",
    top: "0",
    left: "0",
    width: "100%",
  },
  Lookbook: { minItems: 0, maxItems: 10 },
  MultiColumn: { columns: 2, gap: "1rem" },
  StackFlex: { direction: "column", gap: "1rem" },
  Grid: { columns: 2, gap: "1rem" },
  CarouselContainer: { slidesPerView: 1, gap: "1rem", showArrows: true, showDots: true },
  TabsAccordionContainer: { mode: "tabs", tabs: ["Tab 1", "Tab 2"] as unknown as any },
  Divider: { width: "100%", height: "1px" },
  Spacer: { width: "100%", height: "1rem" },
  Dataset: { source: "products" } as any,
  Repeater: { columns: 3, gap: "1rem" } as any,
  Bind: { prop: "text", path: "title" } as any,
  // Layout: Canvas covers the page area
  Canvas: { width: "100%", height: "100%", color: "#ffffff" } as any,
};

export default defaults;
