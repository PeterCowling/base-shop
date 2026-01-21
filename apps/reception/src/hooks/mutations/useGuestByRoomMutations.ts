import { get, ref, update } from "firebase/database";
import { useCallback, useState } from "react";

import { useFirebaseDatabase } from "../../services/useFirebase";
import type { GuestByRoomRecord } from "../../types/hooks/data/guestByRoomData";

/**
 * Provides mutations for guest/room data
 */
export default function useGuestByRoomMutations() {
  const database = useFirebaseDatabase();
  const [error, setError] = useState<unknown>(null);

  /**
   * Saves partial guest-room data to the DB, then re-reads it
   * to confirm the final record.
   */
  const saveGuestByRoom = useCallback(
    (occupantId: string, partialData: Partial<GuestByRoomRecord>) => {
      const occupantRef = ref(database, `guestByRoom/${occupantId}`);

      return update(occupantRef, partialData)
        .then(() => {
          return get(occupantRef).then((snapshot) => {
            if (!snapshot.exists()) {
              throw new Error("Occupant record not found after update.");
            }
            return snapshot.val() as GuestByRoomRecord;
          });
        })
        .catch((err) => {
          setError(err);
          throw err; // re-throw for external handling
        });
    },
    [database]
  );

  return { saveGuestByRoom, error };
}
