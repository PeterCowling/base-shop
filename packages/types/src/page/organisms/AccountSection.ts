import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface AccountSectionComponent extends PageComponentBase {
  type: "AccountSection";
  showDashboard?: boolean;
  showOrders?: boolean;
  showRentals?: boolean;
  showAddresses?: boolean;
  showPayments?: boolean;
}

export const accountSectionComponentSchema = baseComponentSchema.extend({
  type: z.literal("AccountSection"),
  showDashboard: z.boolean().optional(),
  showOrders: z.boolean().optional(),
  showRentals: z.boolean().optional(),
  showAddresses: z.boolean().optional(),
  showPayments: z.boolean().optional(),
});

