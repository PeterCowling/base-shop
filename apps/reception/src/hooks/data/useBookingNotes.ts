import { useEffect, useMemo, useState } from "react";

import { bookingNotesSchema } from "../../schemas/bookingNoteSchema";
import { type BookingNotes } from "../../types/hooks/data/bookingNotesData";

import useFirebaseSubscription from "./useFirebaseSubscription";

export interface UseBookingNotesResult {
  notes: BookingNotes;
  loading: boolean;
  error: unknown;
}

export default function useBookingNotes(
  bookingRef: string
): UseBookingNotesResult {
  const {
    data,
    loading,
    error: subError,
  } = useFirebaseSubscription<Record<string, unknown>>(
    `bookings/${bookingRef}/__notes`
  );

  const [notes, setNotes] = useState<BookingNotes>({});
  const [error, setError] = useState<unknown>(subError);
  useEffect(() => {
    if (!data) {
      setNotes({});
      return;
    }
    const result = bookingNotesSchema.safeParse(data);
    if (result.success) {
      setNotes(result.data);
    } else {
      setNotes({});
      setError(result.error);
    }
  }, [data]);

  return { notes: useMemo(() => notes, [notes]), loading, error };
}
