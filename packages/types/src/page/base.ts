import { z } from "zod";
import type { Translated } from "../Product";
import type { LayoutProps } from "./layout";
import { layoutSchema } from "./layout";
import type { PositioningProps } from "./positioning";
import { positioningSchema } from "./positioning";
import type { SpacingProps } from "./spacing";
import { spacingSchema } from "./spacing";

export type PageStatus = "draft" | "published";

export interface SeoMeta {
  title: Translated;
  description?: Translated;
  image?: Translated;
}

export interface PageComponentBase extends LayoutProps, PositioningProps, SpacingProps {
  id: string;
  type: string;
  /** Optional custom name used by editors */
  name?: string;
  /** Do not render this component on the canvas or preview */
  hidden?: boolean;
  /** Prevent moving/resizing/spacing adjustments on the canvas */
  locked?: boolean;
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
  animation?:
    | "none"
    | "fade"
    | "slide"
    | "slide-up"
    | "slide-down"
    | "slide-left"
    | "slide-right"
    | "zoom"
    | "rotate";
  /** Animation duration in milliseconds */
  animationDuration?: number;
  /** Animation delay in milliseconds */
  animationDelay?: number;
  /** CSS easing function (e.g. 'ease', 'linear', 'cubic-bezier(...)') */
  animationEasing?: string;
  /** Reveal effect on scroll */
  reveal?:
    | "fade"
    | "slide-up"
    | "slide-down"
    | "slide-left"
    | "slide-right"
    | "zoom"
    | "rotate";
  /** Parallax factor (small decimal like 0.15..0.5) */
  parallax?: number;
  /** Sticky behavior */
  sticky?: "top" | "bottom";
  /** Sticky offset (e.g. 64px) */
  stickyOffset?: string | number;
  [key: string]: unknown;
}

export const baseComponentSchema = z
  .object({
    id: z.string(),
    name: z.string().optional(),
    hidden: z.boolean().optional(),
    locked: z.boolean().optional(),
    minItems: z.number().int().min(0).optional(),
    maxItems: z.number().int().min(0).optional(),
    desktopItems: z.number().int().min(0).optional(),
    tabletItems: z.number().int().min(0).optional(),
    mobileItems: z.number().int().min(0).optional(),
    clickAction: z.enum(["none", "navigate"]).optional(),
    href: z.string().optional(),
    animation: z
      .enum([
        "none",
        "fade",
        "slide",
        "slide-up",
        "slide-down",
        "slide-left",
        "slide-right",
        "zoom",
        "rotate",
      ])
      .optional(),
    animationDuration: z.number().int().nonnegative().optional(),
    animationDelay: z.number().int().nonnegative().optional(),
    animationEasing: z.string().optional(),
    reveal: z
      .enum([
        "fade",
        "slide-up",
        "slide-down",
        "slide-left",
        "slide-right",
        "zoom",
        "rotate",
      ])
      .optional(),
    parallax: z.number().optional(),
    sticky: z.enum(["top", "bottom"]).optional(),
    stickyOffset: z.union([z.string(), z.number()]).optional(),
  })
  .merge(layoutSchema)
  .merge(positioningSchema)
  .merge(spacingSchema)
  .passthrough();
