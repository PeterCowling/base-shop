import { z } from "zod";
export declare const selectionStateSchema: z.ZodRecord<z.ZodString, z.ZodString>;
export declare const regionIdSchema: z.ZodEnum<["body", "handle", "hardware", "lining", "personalization"]>;
export declare const productConfigSchemaSchema: z.ZodObject<{
    productId: z.ZodString;
    version: z.ZodString;
    regions: z.ZodArray<z.ZodObject<{
        regionId: z.ZodEnum<["body", "handle", "hardware", "lining", "personalization"]>;
        displayName: z.ZodString;
        hotspotId: z.ZodOptional<z.ZodString>;
        focusTargetNode: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        regionId: "body" | "handle" | "hardware" | "lining" | "personalization";
        displayName: string;
        hotspotId?: string | undefined;
        focusTargetNode?: string | undefined;
    }, {
        regionId: "body" | "handle" | "hardware" | "lining" | "personalization";
        displayName: string;
        hotspotId?: string | undefined;
        focusTargetNode?: string | undefined;
    }>, "many">;
    properties: z.ZodArray<z.ZodObject<{
        key: z.ZodString;
        displayName: z.ZodString;
        regionId: z.ZodString;
        type: z.ZodLiteral<"enum">;
        values: z.ZodArray<z.ZodObject<{
            value: z.ZodString;
            label: z.ZodString;
            priceDelta: z.ZodOptional<z.ZodNumber>;
            materialBindings: z.ZodOptional<z.ZodArray<z.ZodObject<{
                meshNamePattern: z.ZodString;
                materialPresetId: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                meshNamePattern: string;
                materialPresetId: string;
            }, {
                meshNamePattern: string;
                materialPresetId: string;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            value: string;
            label: string;
            priceDelta?: number | undefined;
            materialBindings?: {
                meshNamePattern: string;
                materialPresetId: string;
            }[] | undefined;
        }, {
            value: string;
            label: string;
            priceDelta?: number | undefined;
            materialBindings?: {
                meshNamePattern: string;
                materialPresetId: string;
            }[] | undefined;
        }>, "many">;
        defaultValue: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        values: {
            value: string;
            label: string;
            priceDelta?: number | undefined;
            materialBindings?: {
                meshNamePattern: string;
                materialPresetId: string;
            }[] | undefined;
        }[];
        type: "enum";
        regionId: string;
        displayName: string;
        key: string;
        defaultValue: string;
    }, {
        values: {
            value: string;
            label: string;
            priceDelta?: number | undefined;
            materialBindings?: {
                meshNamePattern: string;
                materialPresetId: string;
            }[] | undefined;
        }[];
        type: "enum";
        regionId: string;
        displayName: string;
        key: string;
        defaultValue: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    productId: string;
    version: string;
    regions: {
        regionId: "body" | "handle" | "hardware" | "lining" | "personalization";
        displayName: string;
        hotspotId?: string | undefined;
        focusTargetNode?: string | undefined;
    }[];
    properties: {
        values: {
            value: string;
            label: string;
            priceDelta?: number | undefined;
            materialBindings?: {
                meshNamePattern: string;
                materialPresetId: string;
            }[] | undefined;
        }[];
        type: "enum";
        regionId: string;
        displayName: string;
        key: string;
        defaultValue: string;
    }[];
}, {
    productId: string;
    version: string;
    regions: {
        regionId: "body" | "handle" | "hardware" | "lining" | "personalization";
        displayName: string;
        hotspotId?: string | undefined;
        focusTargetNode?: string | undefined;
    }[];
    properties: {
        values: {
            value: string;
            label: string;
            priceDelta?: number | undefined;
            materialBindings?: {
                meshNamePattern: string;
                materialPresetId: string;
            }[] | undefined;
        }[];
        type: "enum";
        regionId: string;
        displayName: string;
        key: string;
        defaultValue: string;
    }[];
}>;
export declare const validateResponseSchema: z.ZodObject<{
    valid: z.ZodBoolean;
    normalizedSelections: z.ZodRecord<z.ZodString, z.ZodString>;
    blockedReasons: z.ZodArray<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
    }, {
        code: string;
        message: string;
    }>, "many">;
    allowedDomainsDelta: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    valid: boolean;
    normalizedSelections: Record<string, string>;
    blockedReasons: {
        code: string;
        message: string;
    }[];
    allowedDomainsDelta: Record<string, string[]>;
}, {
    valid: boolean;
    normalizedSelections: Record<string, string>;
    blockedReasons: {
        code: string;
        message: string;
    }[];
    allowedDomainsDelta: Record<string, string[]>;
}>;
//# sourceMappingURL=zod.d.ts.map