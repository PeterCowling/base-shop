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
export declare const positioningSchema: z.ZodObject<{
    position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
    zIndex: z.ZodOptional<z.ZodNumber>;
    top: z.ZodOptional<z.ZodString>;
    topDesktop: z.ZodOptional<z.ZodString>;
    topTablet: z.ZodOptional<z.ZodString>;
    topMobile: z.ZodOptional<z.ZodString>;
    left: z.ZodOptional<z.ZodString>;
    leftDesktop: z.ZodOptional<z.ZodString>;
    leftTablet: z.ZodOptional<z.ZodString>;
    leftMobile: z.ZodOptional<z.ZodString>;
    right: z.ZodOptional<z.ZodString>;
    bottom: z.ZodOptional<z.ZodString>;
    dockX: z.ZodOptional<z.ZodEnum<["left", "right", "center"]>>;
    dockY: z.ZodOptional<z.ZodEnum<["top", "bottom", "center"]>>;
}, "strip", z.ZodTypeAny, {
    top?: string | undefined;
    bottom?: string | undefined;
    position?: "relative" | "absolute" | undefined;
    zIndex?: number | undefined;
    topDesktop?: string | undefined;
    topTablet?: string | undefined;
    topMobile?: string | undefined;
    left?: string | undefined;
    leftDesktop?: string | undefined;
    leftTablet?: string | undefined;
    leftMobile?: string | undefined;
    right?: string | undefined;
    dockX?: "left" | "right" | "center" | undefined;
    dockY?: "top" | "bottom" | "center" | undefined;
}, {
    top?: string | undefined;
    bottom?: string | undefined;
    position?: "relative" | "absolute" | undefined;
    zIndex?: number | undefined;
    topDesktop?: string | undefined;
    topTablet?: string | undefined;
    topMobile?: string | undefined;
    left?: string | undefined;
    leftDesktop?: string | undefined;
    leftTablet?: string | undefined;
    leftMobile?: string | undefined;
    right?: string | undefined;
    dockX?: "left" | "right" | "center" | undefined;
    dockY?: "top" | "bottom" | "center" | undefined;
}>;
//# sourceMappingURL=positioning.d.ts.map