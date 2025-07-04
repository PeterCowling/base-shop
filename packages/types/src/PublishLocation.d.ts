import { z } from "zod";
/**
 * Definition of a publish-to location within the shop-front.
 */
export declare const publishLocationSchema: z.ZodObject<{
    /** Unique, stable identifier (e.g. slug or UUID). */
    id: z.ZodString;
    /** Human-readable name shown to content editors. */
    name: z.ZodString;
    /** Optional richer description for tooltips or secondary text. */
    description: z.ZodOptional<z.ZodString>;
    /** Hierarchical path (e.g. "homepage/hero", "product/:id/upsell"). */
    path: z.ZodString;
    /** Required orientation for images displayed at this location. */
    requiredOrientation: z.ZodEnum<["portrait", "landscape"]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    path: string;
    name: string;
    requiredOrientation: "portrait" | "landscape";
    description?: string | undefined;
}, {
    id: string;
    path: string;
    name: string;
    requiredOrientation: "portrait" | "landscape";
    description?: string | undefined;
}>;
export type PublishLocation = z.infer<typeof publishLocationSchema>;
//# sourceMappingURL=PublishLocation.d.ts.map