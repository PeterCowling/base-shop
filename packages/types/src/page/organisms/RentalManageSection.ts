import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface RentalManageSectionComponent extends PageComponentBase {
  type: "RentalManageSection";
  rentalId?: string;
}

export const rentalManageSectionComponentSchema = baseComponentSchema.extend({
  type: z.literal("RentalManageSection"),
  rentalId: z.string().optional(),
});

