/* src/types/hooks/data/roomsByDateData.ts */

import { z } from "zod";

import type {
  roomByDateBookingSchema,
  roomByDateRoomSchema,
  roomsByDateDateSchema,
  roomsByDateSchema,
} from "../../../schemas/roomsByDateSchema";

export type RoomByDateBooking = z.infer<typeof roomByDateBookingSchema>;
export type RoomByDateRoom = z.infer<typeof roomByDateRoomSchema>;
export type RoomsByDateDate = z.infer<typeof roomsByDateDateSchema>;
export type RoomsByDate = z.infer<typeof roomsByDateSchema> | null;
