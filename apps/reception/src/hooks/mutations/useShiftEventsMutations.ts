/* src/hooks/mutations/useShiftEventsMutations.ts */

import { push, ref, set } from "firebase/database";
import { useCallback, useMemo } from "react";

import { useAuth } from "../../context/AuthContext";
import { useFirebaseDatabase } from "../../services/useFirebase";
import type { ShiftEventData } from "../../types/hooks/data/shiftEventData";
import { getItalyIsoString } from "../../utils/dateUtils";
import { showToast } from "../../utils/toastUtils";

/**
 * Hook providing mutations for recording till shift events.
 */
export function useShiftEventsMutations() {
  const database = useFirebaseDatabase();
  const { user } = useAuth();

  const addShiftEvent = useCallback(
    async (
      action: ShiftEventData["action"],
      cashCount: number,
      keycardCount: number,
      difference?: number
    ): Promise<void> => {
      if (!user) {
        console.error("No user is logged in; cannot add shift event.");
        return;
      }

      try {
        const newRef = push(ref(database, "tillEvents"));
        await set(newRef, {
          user: user.user_name,
          timestamp: getItalyIsoString(),
          action,
          cashCount,
          keycardCount,
          difference,
        } as ShiftEventData);
      } catch (error) {
        console.error("Error writing shift event:", error);
        showToast("Failed to save shift event.", "error");
      }
    },
    [database, user]
  );

  return useMemo(() => ({ addShiftEvent }), [addShiftEvent]);
}

