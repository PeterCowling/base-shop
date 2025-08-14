import { z } from "zod";
export declare const coverageTypeSchema: z.ZodEnum<["scuff", "tear", "lost"]>;
export type CoverageType = z.infer<typeof coverageTypeSchema>;
export declare const coverageRuleSchema: z.ZodObject<{
    fee: z.ZodNumber;
    waiver: z.ZodUnion<[z.ZodNumber, z.ZodLiteral<"deposit">]>;
}, "strip", z.ZodTypeAny, {
    fee: number;
    waiver: number | "deposit";
}, {
    fee: number;
    waiver: number | "deposit";
}>;
export type CoverageRule = z.infer<typeof coverageRuleSchema>;
export declare const defaultCoverage: Record<CoverageType, CoverageRule>;
//# sourceMappingURL=Coverage.d.ts.map
