import { z } from "zod";
import { baseComponentSchema, type PageComponentBase } from "../base";

export interface FinancingBadgeComponent extends PageComponentBase {
  type: "FinancingBadge";
  provider?: "affirm" | "klarna" | "afterpay" | "custom";
  apr?: number;
  termMonths?: number;
  price?: number;
  currency?: string;
  label?: string;
}

export const financingBadgeComponentSchema = baseComponentSchema.extend({
  type: z.literal("FinancingBadge"),
  provider: z.enum(["affirm", "klarna", "afterpay", "custom"]).optional(),
  apr: z.number().optional(),
  termMonths: z.number().int().positive().optional(),
  price: z.number().positive().optional(),
  currency: z.string().optional(),
  label: z.string().optional(),
});

