import { z } from "zod";

export const tillShiftSchema = z.object({
  shiftId: z.string(),
  status: z.enum(["open", "closed"]).optional(),
  openedAt: z.string(),
  openedBy: z.string(),
  openingCash: z.number().optional(),
  openingKeycards: z.number().optional(),
  closedAt: z.string().optional(),
  closedBy: z.string().optional(),
  closingCash: z.number().optional(),
  closingKeycards: z.number().optional(),
  closeDifference: z.number().optional(),
  closeType: z.enum(["close", "reconcile"]).optional(),
});

export const tillShiftsSchema = z.record(tillShiftSchema);

export type TillShift = z.infer<typeof tillShiftSchema>;
export type TillShifts = z.infer<typeof tillShiftsSchema>;