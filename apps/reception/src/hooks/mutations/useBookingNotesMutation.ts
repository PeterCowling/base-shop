import { useCallback } from "react";
import { getDatabase, ref, remove, set, update } from "firebase/database";

import { useAuth } from "../../context/AuthContext";
import { getItalyIsoString } from "../../utils/dateUtils";

export default function useBookingNotesMutation() {
  const { user } = useAuth();
  const db = getDatabase();

  const addNote = useCallback(
    async (bookingRef: string, text: string) => {
      const nowIso = getItalyIsoString();
      const safeText = text.trim();
      if (!safeText) return;
      const id = `note_${nowIso.replace(/[:.-]/g, "")}`;
      await set(ref(db, `bookings/${bookingRef}/__notes/${id}`), {
        text: safeText,
        timestamp: nowIso,
        user: user?.user_name || "Unknown",
      });
    },
    [db, user?.user_name]
  );

  const updateNote = useCallback(
    async (bookingRef: string, id: string, text: string) => {
      const safeText = text.trim();
      if (!safeText) return;
      await update(ref(db, `bookings/${bookingRef}/__notes/${id}`), {
        text: safeText,
      });
    },
    [db]
  );

  const deleteNote = useCallback(
    async (bookingRef: string, id: string) => {
      await remove(ref(db, `bookings/${bookingRef}/__notes/${id}`));
    },
    [db]
  );

  return { addNote, updateNote, deleteNote };
}
