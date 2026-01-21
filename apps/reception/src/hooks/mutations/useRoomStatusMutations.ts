/* File: src/hooks/mutations/useRoomStatusMutations.ts */
import { ref, remove, update } from "firebase/database";
import { useCallback, useState } from "react";

import { useFirebaseDatabase } from "../../services/useFirebase";
import type { SingleRoomStatus } from "../../types/hooks/data/roomStatusData";

/**
 * Mutation Hook: Manages updates and removals in /roomStatus.
 *
 * - saveRoomStatus: Partially updates a single room's record
 * - removeRoomStatus: Removes the entire record for a given room
 */
export default function useRoomStatusMutations() {
  const database = useFirebaseDatabase();
  const [error, setError] = useState<unknown>(null);

  /**
   * Partially update one room's status at /roomStatus/<roomNumber>.
   * Example usage:
   * saveRoomStatus("index_4", { clean: "false" });
   */
  const saveRoomStatus = useCallback(
    async (roomNumber: string, statusData: Partial<SingleRoomStatus>) => {
      const statusRef = ref(database, `roomStatus/${roomNumber}`);
      try {
        await update(statusRef, statusData);
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    [database]
  );

  /**
   * Removes the entire record for a given room at /roomStatus/<roomNumber>.
   *
   * @param roomNumber - The room's identifier.
   */
  const removeRoomStatus = useCallback(
    async (roomNumber: string) => {
      const statusRef = ref(database, `roomStatus/${roomNumber}`);
      try {
        await remove(statusRef);
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    [database]
  );

  return {
    saveRoomStatus,
    removeRoomStatus,
    error,
  };
}
