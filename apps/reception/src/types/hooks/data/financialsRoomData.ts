// File: src/types/hooks/data/financialsRoomData.ts

import { z } from "zod";

import {
  financialsRoomDataSchema,
  financialsRoomSchema,
  roomTransactionSchema,
} from "../../../schemas/financialsRoomSchema";

export type RoomTransaction = z.infer<typeof roomTransactionSchema>;
export type FinancialsRoomData = z.infer<typeof financialsRoomDataSchema>;
export type FinancialsRoom = z.infer<typeof financialsRoomSchema>;
