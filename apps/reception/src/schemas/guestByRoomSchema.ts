import { z } from "zod";

export const guestByRoomRecordSchema = z.object({
  allocated: z.string(),
  booked: z.string(),
});

export type GuestByRoomRecord = z.infer<typeof guestByRoomRecordSchema>;
