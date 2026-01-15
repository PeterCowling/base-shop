import { z } from "zod";

export const activityByCodeDataSchema = z.object({
  timestamp: z.string().optional(),
  who: z.string(),
});

export const occupantActivitiesByCodeSchema = z.record(
  activityByCodeDataSchema
);

export const activitiesByCodeForOccupantSchema = z.record(
  occupantActivitiesByCodeSchema
);

export type ActivityByCodeData = z.infer<typeof activityByCodeDataSchema>;
export type OccupantActivitiesByCode = z.infer<
  typeof occupantActivitiesByCodeSchema
>;
export type ActivitiesByCodeForOccupant = z.infer<
  typeof activitiesByCodeForOccupantSchema
>;
