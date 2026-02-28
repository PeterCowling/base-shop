import { useCallback } from "react";
import { getDatabase, ref, remove, set, update } from "firebase/database";

import { useAuth } from "../../context/AuthContext";
import { queueOfflineWrite } from "../../lib/offline/syncManager";
import { useOnlineStatus } from "../../lib/offline/useOnlineStatus";
import { getItalyIsoString } from "../../utils/dateUtils";

export default function useBookingNotesMutation() {
  const { user } = useAuth();
  const db = getDatabase();
  const online = useOnlineStatus();

  const addNote = useCallback(
    async (bookingRef: string, text: string) => {
      const nowIso = getItalyIsoString();
      const safeText = text.trim();
      if (!safeText) return;
      const id = `note_${nowIso.replace(/[:.-]/g, "")}`;
      const notePayload = {
        text: safeText,
        timestamp: nowIso,
        user: user?.user_name || "Unknown",
      };

      if (!online) {
        const queued = await queueOfflineWrite(`bookings/${bookingRef}/__notes/${id}`, "set", notePayload, {
          idempotencyKey: crypto.randomUUID(),
          conflictPolicy: "last-write-wins",
          domain: "notes",
        });
        if (queued !== null) return;
        // IDB unavailable — fall through to direct write
      }

      await set(ref(db, `bookings/${bookingRef}/__notes/${id}`), notePayload);
    },
    [db, online, user?.user_name]
  );

  const updateNote = useCallback(
    async (bookingRef: string, id: string, text: string) => {
      const safeText = text.trim();
      if (!safeText) return;

      if (!online) {
        const queued = await queueOfflineWrite(`bookings/${bookingRef}/__notes/${id}`, "update", { text: safeText }, {
          idempotencyKey: crypto.randomUUID(),
          conflictPolicy: "last-write-wins",
          domain: "notes",
        });
        if (queued !== null) return;
        // IDB unavailable — fall through to direct write
      }

      await update(ref(db, `bookings/${bookingRef}/__notes/${id}`), {
        text: safeText,
      });
    },
    [db, online]
  );

  const deleteNote = useCallback(
    async (bookingRef: string, id: string) => {
      if (!online) {
        const queued = await queueOfflineWrite(`bookings/${bookingRef}/__notes/${id}`, "remove", undefined, {
          idempotencyKey: crypto.randomUUID(),
          conflictPolicy: "last-write-wins",
          domain: "notes",
        });
        if (queued !== null) return;
        // IDB unavailable — fall through to direct write
      }

      await remove(ref(db, `bookings/${bookingRef}/__notes/${id}`));
    },
    [db, online]
  );

  return { addNote, updateNote, deleteNote };
}
