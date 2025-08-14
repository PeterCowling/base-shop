import { z } from "zod";

/**
 * Represents a return authorization issued for an order.
 */
export const returnAuthorizationSchema = z
  .object({
    raId: z.string(),
    orderId: z.string(),
    status: z.string(),
    inspectionNotes: z.string().optional(),
  })
  .strict();

export type ReturnAuthorization = z.infer<typeof returnAuthorizationSchema>;
