import { useCallback, useMemo } from "react";
import { push, ref, set } from "firebase/database";

import { useAuth } from "../../context/AuthContext";
import { useFirebaseDatabase } from "../../services/useFirebase";
import { getItalyIsoString } from "../../utils/dateUtils";
import { getStoredShiftId } from "../../utils/shiftId";

export function useDrawerAlertsMutations() {
  const database = useFirebaseDatabase();
  const { user } = useAuth();

  const logDrawerAlert = useCallback(
    async (amount: number, limit: number): Promise<void> => {
      if (!user) return;

      const entry = {
        user: user.user_name,
        shiftId: getStoredShiftId() ?? undefined,
        amount,
        limit,
        timestamp: getItalyIsoString(),
      };

      try {
        const newRef = push(ref(database, "drawerAlerts"));
        await set(newRef, entry);
      } catch {
        // Alert logging is non-critical; swallow errors silently
      }
    },
    [database, user]
  );

  return useMemo(() => ({ logDrawerAlert }), [logDrawerAlert]);
}
