import { z } from "zod";

export interface SpacingProps {
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
}

export const spacingSchema = z.object({
  margin: z.string().optional(),
  marginDesktop: z.string().optional(),
  marginTablet: z.string().optional(),
  marginMobile: z.string().optional(),
  padding: z.string().optional(),
  paddingDesktop: z.string().optional(),
  paddingTablet: z.string().optional(),
  paddingMobile: z.string().optional(),
});
