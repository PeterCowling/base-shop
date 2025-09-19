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
  /**
   * Offset from the left when position is absolute. Accepts any CSS length
   * including pixels, percentages or viewport units.
   */
  left?: string;
}

export const positioningSchema = z.object({
  position: z.enum(["relative", "absolute"]).optional(),
  zIndex: z.number().int().optional(),
  top: z.string().optional(),
  left: z.string().optional(),
});
