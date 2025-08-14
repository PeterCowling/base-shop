import { z } from "zod";
import type { Translated } from "../Product";

export type PageStatus = "draft" | "published";

export interface SeoMeta {
  title: Translated;
  description?: Translated;
  image?: Translated;
}

export interface PageComponentBase {
  id: string;
  type: string;
  /**
   * Width of the rendered component. Supports any CSS length including
   * pixel values (e.g. "300px"), percentages (e.g. "50%"), or viewport
   * units (e.g. "30vw").
   */
  width?: string;
  /**
   * Width of the component on desktop viewports. Overrides `width` when
   * rendering on large screens.
   */
  widthDesktop?: string;
  /**
   * Width of the component on tablet viewports. Overrides `width` on medium
   * screens.
   */
  widthTablet?: string;
  /**
   * Width of the component on mobile viewports. Overrides `width` on small
   * screens.
   */
  widthMobile?: string;
  /**
   * Height of the rendered component. Supports any CSS length such as
   * pixels, percentages or viewport units.
   */
  height?: string;
  /**
   * Height of the component on desktop viewports. Overrides `height` when
   * rendering on large screens.
   */
  heightDesktop?: string;
  /**
   * Height of the component on tablet viewports. Overrides `height` on medium
   * screens.
   */
  heightTablet?: string;
  /**
   * Height of the component on mobile viewports. Overrides `height` on small
   * screens.
   */
  heightMobile?: string;
  /**
   * CSS position property used when rendering the component.
   */
  position?: "relative" | "absolute";
  /**
   * Offset from the top when position is absolute. Accepts any CSS length
   * including pixels, percentages or viewport units.
   */
  top?: string;
  /**
   * Offset from the left when position is absolute. Accepts any CSS length
   * including pixels, percentages or viewport units.
   */
  left?: string;
  /**
   * Margin applied to the outer container when rendered.
   * Accepts any valid CSS margin value or Tailwind class.
   */
  margin?: string;
  /** Margin on desktop viewports. Overrides `margin` on large screens. */
  marginDesktop?: string;
  /** Margin on tablet viewports. Overrides `margin` on medium screens. */
  marginTablet?: string;
  /** Margin on mobile viewports. Overrides `margin` on small screens. */
  marginMobile?: string;
  /**
   * Padding applied to the outer container when rendered.
   * Accepts any valid CSS padding value or Tailwind class.
   */
  padding?: string;
  /** Padding on desktop viewports. Overrides `padding` on large screens. */
  paddingDesktop?: string;
  /** Padding on tablet viewports. Overrides `padding` on medium screens. */
  paddingTablet?: string;
  /** Padding on mobile viewports. Overrides `padding` on small screens. */
  paddingMobile?: string;
  /** Minimum number of items allowed for components with lists */
  minItems?: number;
  /** Maximum number of items allowed for components with lists */
  maxItems?: number;
  /** Explicit item counts for large screens */
  desktopItems?: number;
  /** Explicit item counts for medium screens */
  tabletItems?: number;
  /** Explicit item counts for small screens */
  mobileItems?: number;
  /** Action performed when component is clicked */
  clickAction?: "none" | "navigate";
  /** Destination when using a navigation click action */
  href?: string;
  /** Simple animation applied on render */
  animation?: "none" | "fade" | "slide";
  [key: string]: unknown;
}

export const baseComponentSchema = z
  .object({
    id: z.string(),
    width: z.string().optional(),
    widthDesktop: z.string().optional(),
    widthTablet: z.string().optional(),
    widthMobile: z.string().optional(),
    height: z.string().optional(),
    heightDesktop: z.string().optional(),
    heightTablet: z.string().optional(),
    heightMobile: z.string().optional(),
    position: z.enum(["relative", "absolute"]).optional(),
    top: z.string().optional(),
    left: z.string().optional(),
    margin: z.string().optional(),
    marginDesktop: z.string().optional(),
    marginTablet: z.string().optional(),
    marginMobile: z.string().optional(),
    padding: z.string().optional(),
    paddingDesktop: z.string().optional(),
    paddingTablet: z.string().optional(),
    paddingMobile: z.string().optional(),
    minItems: z.number().int().min(0).optional(),
    maxItems: z.number().int().min(0).optional(),
    desktopItems: z.number().int().min(0).optional(),
    tabletItems: z.number().int().min(0).optional(),
    mobileItems: z.number().int().min(0).optional(),
    clickAction: z.enum(["none", "navigate"]).optional(),
    href: z.string().optional(),
    animation: z.enum(["none", "fade", "slide"]).optional(),
  })
  .passthrough();

