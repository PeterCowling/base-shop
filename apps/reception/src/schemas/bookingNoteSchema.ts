import { z } from "zod";

export const bookingNoteSchema = z.object({
  text: z.string(),
  timestamp: z.string(),
  user: z.string(),
});

export const bookingNotesSchema = z.record(bookingNoteSchema);

export type BookingNote = z.infer<typeof bookingNoteSchema>;
export type BookingNotes = z.infer<typeof bookingNotesSchema>;
