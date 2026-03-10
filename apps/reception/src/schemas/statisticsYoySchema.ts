import { z } from "zod";

export const revenueModeSchema = z.enum(["room-only", "room-plus-bar"]);

export const statisticsYoyMonthlyRowSchema = z.object({
  month: z.string().regex(/^\d{2}$/),
  currentValue: z.number(),
  previousValue: z.number(),
  delta: z.number(),
  deltaPct: z.number().nullable(),
});

export const statisticsYoySummarySchema = z.object({
  currentYtd: z.number(),
  previousYtd: z.number(),
  ytdDelta: z.number(),
  ytdDeltaPct: z.number().nullable(),
});

export const statisticsYoyRulesSchema = z.object({
  timezone: z.literal("UTC"),
  monthBoundary: z.literal("utc-calendar-month"),
  ytdWindow: z.literal("january-through-current-utc-month"),
  excludeVoidedTransactions: z.literal(true),
  roomOnlyExcludesBarTransactions: z.literal(true),
  roomPlusBarIncludesEligibleBarTransactions: z.literal(true),
});

export const statisticsYoySourceDescriptorSchema = z.object({
  database: z.enum(["current-db", "archive-db"]),
  path: z.string().min(1),
  availability: z.enum(["available", "empty"]),
});

export const statisticsYoyPreviousSourceDescriptorSchema =
  statisticsYoySourceDescriptorSchema.extend({
    sourceKind: z.enum(["dedicated-archive-db", "archive-mirror"]),
    fallbackUsed: z.boolean(),
  });

export const statisticsYoySourceLabelsSchema = z.object({
  current: z.string().min(1),
  previous: z.string().min(1),
});

export const statisticsYoyProvenanceSchema = z.object({
  rules: statisticsYoyRulesSchema,
  currentSource: statisticsYoySourceDescriptorSchema,
  previousSource: statisticsYoyPreviousSourceDescriptorSchema,
});

export const statisticsYoyResponseSchema = z.object({
  success: z.literal(true),
  mode: revenueModeSchema,
  year: z.number().int(),
  previousYear: z.number().int(),
  monthly: z.array(statisticsYoyMonthlyRowSchema).length(12),
  summary: statisticsYoySummarySchema,
  source: statisticsYoySourceLabelsSchema,
  provenance: statisticsYoyProvenanceSchema,
});

export type RevenueMode = z.infer<typeof revenueModeSchema>;
export type StatisticsYoyMonthlyRow = z.infer<typeof statisticsYoyMonthlyRowSchema>;
export type StatisticsYoySummary = z.infer<typeof statisticsYoySummarySchema>;
export type StatisticsYoyRules = z.infer<typeof statisticsYoyRulesSchema>;
export type StatisticsYoySourceDescriptor = z.infer<typeof statisticsYoySourceDescriptorSchema>;
export type StatisticsYoyPreviousSourceDescriptor = z.infer<
  typeof statisticsYoyPreviousSourceDescriptorSchema
>;
export type StatisticsYoySourceLabels = z.infer<typeof statisticsYoySourceLabelsSchema>;
export type StatisticsYoyProvenance = z.infer<typeof statisticsYoyProvenanceSchema>;
export type StatisticsYoyResponse = z.infer<typeof statisticsYoyResponseSchema>;
