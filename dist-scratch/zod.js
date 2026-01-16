import { z } from "zod";
export const selectionStateSchema = z.record(z.string());
export const regionIdSchema = z.enum([
    "body",
    "handle",
    "hardware",
    "lining",
    "personalization",
]);
export const productConfigSchemaSchema = z.object({
    productId: z.string(),
    version: z.string(),
    regions: z.array(z.object({
        regionId: regionIdSchema,
        displayName: z.string(),
        hotspotId: z.string().optional(),
        focusTargetNode: z.string().optional(),
    })),
    properties: z.array(z.object({
        key: z.string(),
        displayName: z.string(),
        regionId: z.string(),
        type: z.literal("enum"),
        values: z.array(z.object({
            value: z.string(),
            label: z.string(),
            priceDelta: z.number().optional(),
            materialBindings: z
                .array(z.object({
                meshNamePattern: z.string(),
                materialPresetId: z.string(),
            }))
                .optional(),
        })),
        defaultValue: z.string(),
    })),
});
export const validateResponseSchema = z.object({
    valid: z.boolean(),
    normalizedSelections: selectionStateSchema,
    blockedReasons: z.array(z.object({
        code: z.string(),
        message: z.string(),
    })),
    allowedDomainsDelta: z.record(z.array(z.string())),
});
