import { z } from "zod";

export const roomTransactionSchema = z.object({
  occupantId: z.string().optional(),
  bookingRef: z.string().optional(),
  amount: z.number(),
  nonRefundable: z.boolean(),
  timestamp: z.string(),
  type: z.string(),
});

export const financialsRoomDataSchema = z.object({
  balance: z.number().default(0),
  totalDue: z.number().default(0),
  totalPaid: z.number().default(0),
  totalAdjust: z.number().default(0),
  transactions: z.record(roomTransactionSchema).default({}),
});

export const financialsRoomSchema = z.record(financialsRoomDataSchema);

export type RoomTransaction = z.infer<typeof roomTransactionSchema>;
export type FinancialsRoomData = z.infer<typeof financialsRoomDataSchema>;
export type FinancialsRoom = z.infer<typeof financialsRoomSchema>;
