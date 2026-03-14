import { z } from "zod";

export const returnsRequestSchema = z.object({
  orderReference: z.string().trim().min(1, "Order reference is required"),
  email: z.string().trim().email("A valid email is required"),
  requestType: z.enum(["cancellation", "return", "exchange", "faulty"]),
  message: z.string().trim().min(10, "Please provide more detail").max(2000),
});

export type ReturnsRequestInput = z.infer<typeof returnsRequestSchema>;
