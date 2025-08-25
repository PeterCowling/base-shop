import { z } from "zod";
export interface PositioningProps {
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
}
export declare const positioningSchema: z.ZodObject<{
    position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
    top: z.ZodOptional<z.ZodString>;
    left: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    position?: "relative" | "absolute" | undefined;
    top?: string | undefined;
    left?: string | undefined;
}, {
    position?: "relative" | "absolute" | undefined;
    top?: string | undefined;
    left?: string | undefined;
}>;
//# sourceMappingURL=positioning.d.ts.map