import { z } from "zod";

export interface LayoutProps {
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
}

export const layoutSchema = z.object({
  width: z.string().optional(),
  widthDesktop: z.string().optional(),
  widthTablet: z.string().optional(),
  widthMobile: z.string().optional(),
  height: z.string().optional(),
  heightDesktop: z.string().optional(),
  heightTablet: z.string().optional(),
  heightMobile: z.string().optional(),
});
