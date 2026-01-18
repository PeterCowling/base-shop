import { z } from "zod";
export declare const externalDsSchema: z.ZodObject<{
    tokens: z.ZodRecord<z.ZodString, z.ZodString>;
}, "strict", z.ZodTypeAny, {
    tokens: Record<string, string>;
}, {
    tokens: Record<string, string>;
}>;
export type ExternalDs = z.infer<typeof externalDsSchema>;
//# sourceMappingURL=ExternalDs.d.ts.map