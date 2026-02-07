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
export declare const layoutSchema: z.ZodObject<{
    width: z.ZodOptional<z.ZodString>;
    widthDesktop: z.ZodOptional<z.ZodString>;
    widthTablet: z.ZodOptional<z.ZodString>;
    widthMobile: z.ZodOptional<z.ZodString>;
    height: z.ZodOptional<z.ZodString>;
    heightDesktop: z.ZodOptional<z.ZodString>;
    heightTablet: z.ZodOptional<z.ZodString>;
    heightMobile: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    width?: string | undefined;
    widthDesktop?: string | undefined;
    widthTablet?: string | undefined;
    widthMobile?: string | undefined;
    height?: string | undefined;
    heightDesktop?: string | undefined;
    heightTablet?: string | undefined;
    heightMobile?: string | undefined;
}, {
    width?: string | undefined;
    widthDesktop?: string | undefined;
    widthTablet?: string | undefined;
    widthMobile?: string | undefined;
    height?: string | undefined;
    heightDesktop?: string | undefined;
    heightTablet?: string | undefined;
    heightMobile?: string | undefined;
}>;
//# sourceMappingURL=layout.d.ts.map