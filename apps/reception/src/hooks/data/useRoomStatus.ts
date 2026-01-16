// File: src/hooks/data/useRoomStatus.ts

import { useEffect, useState } from "react";
import { roomStatusSchema } from "../../schemas/roomStatusSchema";
import type { SingleRoomStatus } from "../../types/hooks/data/roomStatusData";
import useFirebaseSubscription from "./useFirebaseSubscription";

/**
 * Returns a map of roomNumber => SingleRoomStatus, or null if loading/empty.
 */
export default function useRoomStatusData() {
  const {
    data,
    loading,
    error: subError,
  } = useFirebaseSubscription<Record<string, unknown>>("roomStatus");

  const [roomStatusMap, setRoomStatusMap] = useState<Record<
    string,
    SingleRoomStatus
  > | null>(null);
  const [error, setError] = useState<unknown>(subError);

  useEffect(() => {
    if (!data) {
      setRoomStatusMap(null);
      return;
    }
    const result = roomStatusSchema.safeParse(data);
    if (result.success) {
      setRoomStatusMap(result.data);
      setError(null);
    } else {
      setRoomStatusMap(null);
      setError(result.error);
    }
  }, [data]);

  return { roomStatusMap, loading, error };
}
