/* src/types/hooks/data/checkoutsData.ts */

import { type z } from "zod";

import type {
  checkoutDataSchema,
  checkoutRecordSchema,
  checkoutsSchema,
} from "../../../schemas/checkoutSchema";

export type CheckoutRecord = z.infer<typeof checkoutRecordSchema>;
export type CheckoutData = z.infer<typeof checkoutDataSchema>;
export type Checkouts = z.infer<typeof checkoutsSchema> | null;
