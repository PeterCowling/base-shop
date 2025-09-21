// packages/ui/src/components/cms/page-builder/panels/content/types.ts
import type { PageComponent } from "@acme/types";

export type HandleInput = <K extends keyof PageComponent>(
  field: K,
  value: PageComponent[K],
) => void;

export type OnChange = (patch: Partial<PageComponent>) => void;

// Extended shape for content-related controls present on various components
export type ContentComponent = PageComponent & {
  minItems?: number;
  maxItems?: number;
  desktopItems?: number;
  tabletItems?: number;
  mobileItems?: number;

  columns?: number;
  columnsDesktop?: number;
  columnsTablet?: number;
  columnsMobile?: number;

  gap?: string;
  gapDesktop?: string;
  gapTablet?: string;
  gapMobile?: string;

  justifyItems?: "start" | "center" | "end" | "stretch";
  justifyItemsDesktop?: "start" | "center" | "end" | "stretch";
  justifyItemsTablet?: "start" | "center" | "end" | "stretch";
  justifyItemsMobile?: "start" | "center" | "end" | "stretch";

  alignItems?: "start" | "center" | "end" | "stretch";
  alignItemsDesktop?: "start" | "center" | "end" | "stretch";
  alignItemsTablet?: "start" | "center" | "end" | "stretch";
  alignItemsMobile?: "start" | "center" | "end" | "stretch";
};

