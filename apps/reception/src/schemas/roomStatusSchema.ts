import { z } from "zod";

export const singleRoomStatusSchema = z
  .object({
    checkedout: z.union([z.string(), z.literal(false)]).optional(),
    clean: z.union([z.string(), z.literal(false)]).optional(),
    cleaned: z.union([z.string(), z.literal(false)]).optional(),
  })
  .strict();

export const roomStatusSchema = z.record(singleRoomStatusSchema);

export type SingleRoomStatus = z.infer<typeof singleRoomStatusSchema>;
export type RoomStatus = z.infer<typeof roomStatusSchema>;
