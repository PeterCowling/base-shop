// File: src/types/hooks/data/financialsRoomData.ts

import { type z } from "zod";

import {
  type financialsRoomDataSchema,
  type financialsRoomSchema,
  type roomTransactionSchema,
} from "../../../schemas/financialsRoomSchema";

export type RoomTransaction = z.infer<typeof roomTransactionSchema>;
export type FinancialsRoomData = z.infer<typeof financialsRoomDataSchema>;
export type FinancialsRoom = z.infer<typeof financialsRoomSchema>;
