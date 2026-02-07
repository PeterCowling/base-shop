// File: /src/hooks/data/useGuestByRoom.ts

import { useEffect, useState } from "react";
import {
  type DataSnapshot,
  endAt,
  limitToFirst,
  onValue,
  orderByKey,
  query,
  ref,
  startAt,
} from "firebase/database";

import { guestByRoomRecordSchema } from "../../schemas/guestByRoomSchema";
import { useFirebaseDatabase } from "../../services/useFirebase";
import type { GuestByRoomData } from "../../types/hooks/data/guestByRoomData";

// Shape of the raw data retrieved from Firebase before normalizing.
type FirebaseGuestRoom = {
  allocated?: string;
  booked?: string;
};

type FirebaseGuestByRoom = Record<string, FirebaseGuestRoom>;

/**
 * Data Hook (Pure Data): Subscribes to /guestByRoom in Firebase and returns the normalized data.
 *
 * This hook:
 * - Reads occupant room allocations under /guestByRoom
 * - Normalizes data so that `allocated` and `booked` are always strings
 * - Manages loading and error states
 *
 * Returns: { guestByRoom, loading, error }
 */
export interface UseGuestByRoomParams {
  startAt?: string;
  endAt?: string;
  limitToFirst?: number;
}

export default function useGuestByRoom(params: UseGuestByRoomParams = {}) {
  const database = useFirebaseDatabase();
  const { startAt: startKey, endAt: endKey, limitToFirst: limit } = params;

  // Explicitly type state as GuestByRoomData | null to match expected types.
  const [guestByRoom, setGuestByRoom] = useState<GuestByRoomData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const guestByRoomRef = ref(database, "guestByRoom");
    let q = query(guestByRoomRef, orderByKey());
    if (startKey) q = query(q, startAt(startKey));
    if (endKey) q = query(q, endAt(endKey));
    if (limit !== undefined) q = query(q, limitToFirst(limit));

    const handleSnapshot = (snapshot: DataSnapshot) => {
      try {
        if (snapshot.exists()) {
          const data = snapshot.val() as FirebaseGuestByRoom;

          const normalized: GuestByRoomData = {};
          Object.entries(data).forEach(([key, roomData]) => {
            const result = guestByRoomRecordSchema.safeParse({
              allocated: roomData?.allocated ?? "",
              booked: roomData?.booked ?? "",
            });
            if (result.success) {
              normalized[key] = result.data;
            } else {
              setError(result.error);
            }
          });

          setGuestByRoom(normalized);
        } else {
          setGuestByRoom(null);
        }
      } catch (e) {
        console.error("Error processing guestByRoom snapshot:", e);
        setError(
          e instanceof Error
            ? e
            : new Error("Failed to process guestByRoom data")
        );
        setGuestByRoom(null);
      } finally {
        setLoading(false);
      }
    };

    const handleError = (err: Error) => {
      console.error("Firebase error fetching guestByRoom:", err);
      setError(err);
      setLoading(false);
      setGuestByRoom(null);
    };

    const unsubscribe = onValue(q, handleSnapshot, handleError);

    return unsubscribe;
  }, [database, startKey, endKey, limit]);

  return {
    guestByRoom,
    loading,
    error,
  };
}
