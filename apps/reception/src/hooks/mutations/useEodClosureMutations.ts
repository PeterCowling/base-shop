/* src/hooks/mutations/useEodClosureMutations.ts */

import { useCallback, useMemo } from "react";
import { ref, set } from "firebase/database";

import { useAuth } from "../../context/AuthContext";
import { eodClosureSchema } from "../../schemas/eodClosureSchema";
import { useFirebaseDatabase } from "../../services/useFirebase";
import { extractItalyDate, getItalyIsoString } from "../../utils/dateUtils";
import { getErrorMessage } from "../../utils/errorMessage";
import { showToast } from "../../utils/toastUtils";

/**
 * Provides mutations for the eodClosures node in Firebase RTDB.
 *
 * Returns:
 * - `confirmDayClosed`: writes a date-keyed EOD closure record for today.
 *   Uses `set()` for an idempotent overwrite — re-confirming the same day
 *   is safe and updates confirmedBy/timestamp to the most recent confirmation.
 */
export function useEodClosureMutations(): {
  confirmDayClosed: () => Promise<void>;
} {
  const database = useFirebaseDatabase();
  const { user } = useAuth();

  const confirmDayClosed = useCallback(async (): Promise<void> => {
    if (!user) {
      return;
    }

    const dateKey = extractItalyDate(getItalyIsoString());
    const timestamp = getItalyIsoString();

    const payload = {
      date: dateKey,
      timestamp,
      confirmedBy: user.user_name,
      uid: user.uid ?? undefined,
    };

    const result = eodClosureSchema.safeParse(payload);
    if (!result.success) {
      showToast(getErrorMessage(result.error), "error");
      return;
    }

    try {
      await set(ref(database, `eodClosures/${dateKey}`), result.data);
    } catch {
      showToast("Failed to confirm day closed.", "error");
    }
  }, [database, user]);

  return useMemo(() => ({ confirmDayClosed }), [confirmDayClosed]);
}
