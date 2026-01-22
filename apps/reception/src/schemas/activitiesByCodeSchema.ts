import { z } from "zod";

export const activityByCodeDataSchema = z.object({
  timestamp: z.string().optional(),
  who: z.string(),
});

export const occupantActivitiesByCodeSchema = z.record(activityByCodeDataSchema);

export const activitiesByCodeForOccupantSchema = z.record(
  occupantActivitiesByCodeSchema
);
