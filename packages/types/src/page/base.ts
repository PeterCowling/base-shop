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
  animation?: "none" | "fade" | "slide";
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
    animation: z.enum(["none", "fade", "slide"]).optional(),
  })
  .merge(layoutSchema)
  .merge(positioningSchema)
  .merge(spacingSchema)
  .passthrough();
