import { z } from "zod";
export declare const reverseLogisticsEventSchema: z.ZodObject<{
    sessionId: z.ZodString;
    event: z.ZodEnum<["received", "cleaned", "qaPassed"]>;
    at: z.ZodString;
}, "strict", z.ZodTypeAny, {
    at?: string;
    event?: "received" | "cleaned" | "qaPassed";
    sessionId?: string;
}, {
    at?: string;
    event?: "received" | "cleaned" | "qaPassed";
    sessionId?: string;
}>;
export type ReverseLogisticsEvent = z.infer<typeof reverseLogisticsEventSchema>;
