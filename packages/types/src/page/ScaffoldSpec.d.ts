import { z } from "zod";
export declare const scaffoldSpecSchema: z.ZodObject<{
    layout: z.ZodDefault<z.ZodEnum<["default", "sidebar"]>>;
    sections: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    hero: z.ZodOptional<z.ZodString>;
    cta: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    layout: "default" | "sidebar";
    sections: string[];
    hero?: string | undefined;
    cta?: string | undefined;
}, {
    layout?: "default" | "sidebar" | undefined;
    sections?: string[] | undefined;
    hero?: string | undefined;
    cta?: string | undefined;
}>;
export type ScaffoldSpec = z.infer<typeof scaffoldSpecSchema>;
//# sourceMappingURL=ScaffoldSpec.d.ts.map