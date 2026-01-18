import { z } from "zod";
export declare const formFieldOptionSchema: z.ZodObject<{
    label: z.ZodString;
    value: z.ZodString;
}, "strict", z.ZodTypeAny, {
    value: string;
    label: string;
}, {
    value: string;
    label: string;
}>;
export type FormFieldOption = z.infer<typeof formFieldOptionSchema>;
export declare const formFieldSchema: z.ZodObject<{
    type: z.ZodEnum<["text", "email", "select"]>;
    name: z.ZodOptional<z.ZodString>;
    label: z.ZodOptional<z.ZodString>;
    options: z.ZodOptional<z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        value: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        value: string;
        label: string;
    }, {
        value: string;
        label: string;
    }>, "many">>;
}, "strict", z.ZodTypeAny, {
    type: "email" | "text" | "select";
    options?: {
        value: string;
        label: string;
    }[] | undefined;
    name?: string | undefined;
    label?: string | undefined;
}, {
    type: "email" | "text" | "select";
    options?: {
        value: string;
        label: string;
    }[] | undefined;
    name?: string | undefined;
    label?: string | undefined;
}>;
export type FormField = z.infer<typeof formFieldSchema>;
//# sourceMappingURL=forms.d.ts.map