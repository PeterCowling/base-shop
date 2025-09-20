import { z } from "zod";

export interface PositioningProps {
  /**
   * CSS position property used when rendering the component.
   */
  position?: "relative" | "absolute";
  /** Stacking order for absolutely or relatively positioned components */
  zIndex?: number;
  /**
   * Offset from the top when position is absolute. Accepts any CSS length
   * including pixels, percentages or viewport units.
   */
  top?: string;
  /** Top offset on desktop viewports. Overrides `top` on large screens. */
  topDesktop?: string;
  /** Top offset on tablet viewports. Overrides `top` on medium screens. */
  topTablet?: string;
  /** Top offset on mobile viewports. Overrides `top` on small screens. */
  topMobile?: string;
  /**
   * Offset from the left when position is absolute. Accepts any CSS length
   * including pixels, percentages or viewport units.
   */
  left?: string;
  /** Left offset on desktop viewports. Overrides `left` on large screens. */
  leftDesktop?: string;
  /** Left offset on tablet viewports. Overrides `left` on medium screens. */
  leftTablet?: string;
  /** Left offset on mobile viewports. Overrides `left` on small screens. */
  leftMobile?: string;
  /**
   * Optional right/bottom offsets to support docking to container edges.
   */
  right?: string;
  bottom?: string;
  /** Horizontal docking behavior */
  dockX?: "left" | "right" | "center";
  /** Vertical docking behavior */
  dockY?: "top" | "bottom" | "center";
}

export const positioningSchema = z.object({
  position: z.enum(["relative", "absolute"]).optional(),
  zIndex: z.number().int().optional(),
  top: z.string().optional(),
  topDesktop: z.string().optional(),
  topTablet: z.string().optional(),
  topMobile: z.string().optional(),
  left: z.string().optional(),
  leftDesktop: z.string().optional(),
  leftTablet: z.string().optional(),
  leftMobile: z.string().optional(),
  right: z.string().optional(),
  bottom: z.string().optional(),
  dockX: z.enum(["left", "right", "center"]).optional(),
  dockY: z.enum(["top", "bottom", "center"]).optional(),
});
