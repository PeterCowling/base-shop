import { z } from "zod";

export const cityTaxRecordSchema = z.object({
  balance: z.number(),
  totalDue: z.number(),
  totalPaid: z.number(),
});

export const cityTaxByOccupantSchema = z.record(cityTaxRecordSchema);
export const cityTaxDataSchema = z.record(cityTaxByOccupantSchema);

export type CityTaxRecord = z.infer<typeof cityTaxRecordSchema>;
export type CityTaxData = z.infer<typeof cityTaxDataSchema>;
