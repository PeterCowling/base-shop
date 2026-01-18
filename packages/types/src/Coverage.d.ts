import { z } from "zod";
export declare const coverageCodeSchema: z.ZodEnum<["scuff", "tear", "lost"]>;
export declare const coverageRuleSchema: z.ZodObject<{
    fee: z.ZodNumber;
    waiver: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    fee: number;
    waiver: number;
}, {
    fee: number;
    waiver: number;
}>;
export declare const coverageSchema: z.ZodRecord<z.ZodEnum<["scuff", "tear", "lost"]>, z.ZodObject<{
    fee: z.ZodNumber;
    waiver: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    fee: number;
    waiver: number;
}, {
    fee: number;
    waiver: number;
}>>;
export type CoverageCode = z.infer<typeof coverageCodeSchema>;
export type CoverageRule = z.infer<typeof coverageRuleSchema>;
export type CoverageMatrix = z.infer<typeof coverageSchema>;
//# sourceMappingURL=Coverage.d.ts.map