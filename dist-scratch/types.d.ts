export type SelectionState = Record<string, string>;
export interface ProductConfigSchema {
    productId: string;
    version: string;
    regions: Array<{
        regionId: "body" | "handle" | "hardware" | "lining" | "personalization";
        displayName: string;
        hotspotId?: string;
        focusTargetNode?: string;
    }>;
    properties: Array<{
        key: string;
        displayName: string;
        regionId: string;
        type: "enum";
        values: Array<{
            value: string;
            label: string;
            priceDelta?: number;
            materialBindings?: Array<{
                meshNamePattern: string;
                materialPresetId: string;
            }>;
        }>;
        defaultValue: string;
    }>;
}
export interface ValidateResponse {
    valid: boolean;
    normalizedSelections: SelectionState;
    blockedReasons: Array<{
        code: string;
        message: string;
    }>;
    allowedDomainsDelta: Record<string, string[]>;
}
//# sourceMappingURL=types.d.ts.map