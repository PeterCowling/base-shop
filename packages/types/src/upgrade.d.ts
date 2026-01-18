import { z } from "zod";
export declare const upgradeComponentSchema: z.ZodObject<{
    file: z.ZodString;
    componentName: z.ZodString;
    oldChecksum: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    newChecksum: z.ZodString;
}, "strict", z.ZodTypeAny, {
    file: string;
    componentName: string;
    newChecksum: string;
    oldChecksum?: string | null | undefined;
}, {
    file: string;
    componentName: string;
    newChecksum: string;
    oldChecksum?: string | null | undefined;
}>;
export type UpgradeComponent = z.infer<typeof upgradeComponentSchema>;
export declare const shopMetadataSchema: z.ZodObject<{
    lastUpgrade: z.ZodOptional<z.ZodString>;
    componentVersions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodUnknown, z.objectOutputType<{
    lastUpgrade: z.ZodOptional<z.ZodString>;
    componentVersions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, z.ZodUnknown, "strip">, z.objectInputType<{
    lastUpgrade: z.ZodOptional<z.ZodString>;
    componentVersions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, z.ZodUnknown, "strip">>;
export type ShopMetadata = z.infer<typeof shopMetadataSchema>;
//# sourceMappingURL=upgrade.d.ts.map