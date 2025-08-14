import { z } from "zod";
export declare const reverseLogisticsEventSchema: z.ZodObject<{
    id: z.ZodString;
    shop: z.ZodString;
    sessionId: z.ZodString;
    event: z.ZodEnum<["received", "cleaned", "qaPassed"]>;
    at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    shop: string;
    sessionId: string;
    event: "received" | "cleaned" | "qaPassed";
    at: string;
}, {
    id: string;
    shop: string;
    sessionId: string;
    event: "received" | "cleaned" | "qaPassed";
    at: string;
}>;
export type ReverseLogisticsEvent = z.infer<typeof reverseLogisticsEventSchema>;
//# sourceMappingURL=ReverseLogisticsEvent.d.ts.map
