import { z } from "zod";

export declare const segmentSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    filters: z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        value: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        value: string;
        field: string;
    }, {
        value: string;
        field: string;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    id: string;
    filters: {
        value: string;
        field: string;
    }[];
    name?: string | undefined;
}, {
    id: string;
    filters: {
        value: string;
        field: string;
    }[];
    name?: string | undefined;
}>;
export type Segment = z.infer<typeof segmentSchema>;
//# sourceMappingURL=Segment.d.ts.map