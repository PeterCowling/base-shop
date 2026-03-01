/* src/hooks/mutations/useEodClosureMutations.ts */

import { useCallback, useMemo } from "react";
import { ref, set } from "firebase/database";

import { useAuth } from "../../context/AuthContext";
import type { EodOverrideSignoff } from "../../schemas/eodClosureSchema";
import { eodClosureSchema } from "../../schemas/eodClosureSchema";
import { useFirebaseDatabase } from "../../services/useFirebase";
import { extractItalyDate, getItalyIsoString } from "../../utils/dateUtils";
import { getErrorMessage } from "../../utils/errorMessage";
import { showToast } from "../../utils/toastUtils";

/**
 * Snapshot of variance figures computed at the moment of EOD confirmation.
 * Both fields are optional — callers that do not compute variance can omit
 * the snapshot and the written record will not include these fields.
 *
 * - `cashVariance`: signed sum of per-shift closeDifference for the day.
 *   Positive = cash over, negative = cash short.
 * - `stockItemsCounted`: count of distinct inventory item IDs with a count
 *   ledger entry on today's Italy date.
 */
export interface EodClosureSnapshot {
  cashVariance?: number;
  stockItemsCounted?: number;
}

/**
 * Provides mutations for the eodClosures node in Firebase RTDB.
 *
 * Returns:
 * - `confirmDayClosed`: writes a date-keyed EOD closure record for today.
 *   Accepts an optional `EodClosureSnapshot` to persist variance figures.
 *   Uses `set()` for an idempotent overwrite — re-confirming the same day
 *   is safe and updates confirmedBy/timestamp to the most recent confirmation.
 * - `confirmDayClosedWithOverride`: writes an EOD closure record including
 *   manager override signoff when one or more checklist steps could not be
 *   completed.
 */
export function useEodClosureMutations(): {
  confirmDayClosed: (snapshot?: EodClosureSnapshot) => Promise<void>;
  confirmDayClosedWithOverride: (signoff: EodOverrideSignoff) => Promise<void>;
} {
  const database = useFirebaseDatabase();
  const { user } = useAuth();

  const confirmDayClosed = useCallback(
    async (snapshot?: EodClosureSnapshot): Promise<void> => {
      if (!user) {
        return;
      }

      const dateKey = extractItalyDate(getItalyIsoString());
      const timestamp = getItalyIsoString();

      // Conditionally include snapshot fields to avoid spreading undefined-valued
      // keys into the payload. Firebase RTDB silently drops undefined keys, but
      // making the guard explicit keeps the safeParse payload consistent with the
      // stored record regardless of SDK version.
      const payload = {
        date: dateKey,
        timestamp,
        confirmedBy: user.user_name,
        uid: user.uid ?? undefined,
        ...(snapshot?.cashVariance !== undefined
          ? { cashVariance: snapshot.cashVariance }
          : {}),
        ...(snapshot?.stockItemsCounted !== undefined
          ? { stockItemsCounted: snapshot.stockItemsCounted }
          : {}),
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
    },
    [database, user]
  );

  const confirmDayClosedWithOverride = useCallback(
    async (signoff: EodOverrideSignoff): Promise<void> => {
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
        overrideReason: signoff.overrideReason,
        overrideManagerName: signoff.overrideManagerName,
        overrideManagerUid: signoff.overrideManagerUid,
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
    },
    [database, user]
  );

  return useMemo(
    () => ({ confirmDayClosed, confirmDayClosedWithOverride }),
    [confirmDayClosed, confirmDayClosedWithOverride]
  );
}
