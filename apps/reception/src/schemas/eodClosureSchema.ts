/* src/schemas/eodClosureSchema.ts */

import { z } from "zod";

/**
 * Schema for the EOD closure record stored in Firebase RTDB at eodClosures/<date>.
 *
 * Optional variance fields (added for manager-facing review):
 * - `cashVariance`: signed sum of per-shift closeDifference for the day.
 *   Positive = cash over, negative = cash short.
 * - `stockItemsCounted`: count of distinct inventory item IDs with a count
 *   ledger entry on today's Italy date.
 *
 * Optional override fields (added for exception override path):
 * - `overrideReason`, `overrideManagerName`, `overrideManagerUid`
 *
 * All optional fields default to absent for backward compatibility with
 * closure records written before these fields were introduced.
 */
export const eodClosureSchema = z.object({
  date: z.string(),
  timestamp: z.string(),
  confirmedBy: z.string(),
  uid: z.string().optional(),
  overrideReason: z.string().optional(),
  overrideManagerName: z.string().optional(),
  overrideManagerUid: z.string().optional(),
  cashVariance: z.number().optional(),
  stockItemsCounted: z.number().int().optional(),
});

export type EodClosure = z.infer<typeof eodClosureSchema>;

/**
 * Signoff payload for EOD exception override.
 * Passed from EodOverrideModal to EodChecklistContent
 * and forwarded to confirmDayClosedWithOverride.
 */
export interface EodOverrideSignoff {
  overrideManagerName: string;
  overrideManagerUid?: string;
  overrideReason: string;
}
