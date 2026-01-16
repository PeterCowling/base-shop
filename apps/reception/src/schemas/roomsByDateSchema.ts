import { z } from "zod";

// Allow additional booking properties beyond guestIds so that hooks can
// preserve extra information like occupantId and bookingRef.
export const roomByDateBookingSchema = z
  .object({
    guestIds: z.array(z.string()),
  })
  .passthrough();

export const roomByDateRoomSchema = z.union([
  z.record(roomByDateBookingSchema),
  z.array(roomByDateBookingSchema),
]);

export const roomsByDateDateSchema = z.record(roomByDateRoomSchema);

export const roomsByDateSchema = z.record(roomsByDateDateSchema);

export type RoomByDateBooking = z.infer<typeof roomByDateBookingSchema>;
export type RoomByDateRoom = z.infer<typeof roomByDateRoomSchema>;
export type RoomsByDateDate = z.infer<typeof roomsByDateDateSchema>;
export type RoomsByDate = z.infer<typeof roomsByDateSchema>;
