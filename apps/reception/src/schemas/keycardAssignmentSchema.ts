import { z } from "zod";

export const keycardAssignmentStatusSchema = z.enum([
  "issued",
  "returned",
  "lost",
  "replaced",
]);

export const keycardAssignmentSchema = z.object({
  keycardNumber: z.string(),
  isMasterKey: z.boolean(),
  // Guest key fields
  occupantId: z.string().optional(),
  bookingRef: z.string().optional(),
  roomNumber: z.string().optional(),
  depositMethod: z.string().optional(),
  depositAmount: z.number().optional(),
  // Master key fields
  assignedToStaff: z.string().optional(),
  // Common fields
  assignedAt: z.string(),
  assignedBy: z.string(),
  returnedAt: z.string().optional(),
  returnedBy: z.string().optional(),
  status: keycardAssignmentStatusSchema,
  replacedByAssignmentId: z.string().optional(),
  replacesAssignmentId: z.string().optional(),
  loanTxnId: z.string().optional(),
  shiftId: z.string().optional(),
});

export const keycardAssignmentsSchema = z.record(keycardAssignmentSchema);

export type KeycardAssignmentInput = z.infer<typeof keycardAssignmentSchema>;
