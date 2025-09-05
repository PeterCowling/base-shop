import { z } from "zod";
export declare const reverseLogisticsEventNameSchema: z.ZodEnum<[
    "received",
    "cleaning",
    "repair",
    "qa",
    "available"
]>;
export type ReverseLogisticsEventName = z.infer<typeof reverseLogisticsEventNameSchema>;
export declare const reverseLogisticsEventSchema: z.ZodObject<{
    id: z.ZodString;
    shop: z.ZodString;
    sessionId: z.ZodString;
    event: z.ZodEnum<["received", "cleaning", "repair", "qa", "available"]>;
    createdAt: z.ZodString;
}, "strict", z.ZodTypeAny, {
    id: string;
    shop: string;
    sessionId: string;
    event: "received" | "cleaning" | "repair" | "qa" | "available";
    createdAt: string;
}, {
    id: string;
    shop: string;
    sessionId: string;
    event: "received" | "cleaning" | "repair" | "qa" | "available";
    createdAt: string;
}>;
export type ReverseLogisticsEvent = z.infer<typeof reverseLogisticsEventSchema>;

