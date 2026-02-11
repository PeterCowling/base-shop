import { z } from "zod";

export const primeRequestTypeSchema = z.enum([
  "extension",
  "bag_drop",
  "meal_change_exception",
]);

export const primeRequestStatusSchema = z.enum([
  "pending",
  "approved",
  "declined",
  "completed",
]);

export const primeRequestResolutionSchema = z.object({
  operatorId: z.string(),
  operatorName: z.string(),
  resolvedAt: z.number(),
  note: z.string().optional(),
});

export const primeRequestRecordSchema = z.object({
  requestId: z.string(),
  type: primeRequestTypeSchema,
  status: primeRequestStatusSchema,
  bookingId: z.string(),
  guestUuid: z.string(),
  guestName: z.string(),
  submittedAt: z.number(),
  updatedAt: z.number(),
  note: z.string().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  resolution: primeRequestResolutionSchema.optional(),
});

export const primeRequestsByIdSchema = z.record(primeRequestRecordSchema);
