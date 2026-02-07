import { useCallback, useMemo } from "react";
import { ref, set, update } from "firebase/database";

import { useAuth } from "../../context/AuthContext";
import { tillShiftSchema } from "../../schemas/tillShiftSchema";
import { useFirebaseDatabase } from "../../services/useFirebase";
import type { TillShift } from "../../types/hooks/data/tillShiftData";
import { getItalyIsoString } from "../../utils/dateUtils";
import { getErrorMessage } from "../../utils/errorMessage";
import { showToast } from "../../utils/toastUtils";

export function useTillShiftsMutations() {
  const database = useFirebaseDatabase();
  const { user } = useAuth();

  const recordShiftOpen = useCallback(
    async (
      shiftId: string,
      params: {
        openingCash: number;
        openingKeycards: number;
        openedAt?: string;
        openedBy?: string;
      }
    ): Promise<void> => {
      if (!user) {
        showToast("Not authorized. Please log in.", "error");
        return;
      }
      const payload: TillShift = {
        shiftId,
        status: "open",
        openedAt: params.openedAt ?? getItalyIsoString(),
        openedBy: params.openedBy ?? user.user_name,
        openingCash: params.openingCash,
        openingKeycards: params.openingKeycards,
      };
      const result = tillShiftSchema.safeParse(payload);
      if (!result.success) {
        showToast(getErrorMessage(result.error), "error");
        return;
      }
      try {
        await set(ref(database, `tillShifts/${shiftId}`), result.data);
      } catch (error) {
        console.error("Error writing till shift open:", error);
        showToast("Failed to record shift opening.", "error");
      }
    },
    [database, user]
  );

  const recordShiftClose = useCallback(
    async (
      shiftId: string,
      params: {
        closingCash: number;
        closingKeycards: number;
        closeDifference: number;
        closeType: "close" | "reconcile";
        varianceSignoffRequired?: boolean;
        signedOffBy?: string;
        signedOffByUid?: string;
        signedOffAt?: string;
        varianceNote?: string;
      }
    ): Promise<void> => {
      if (!user) {
        showToast("Not authorized. Please log in.", "error");
        return;
      }
      const payload: Partial<TillShift> = {
        status: "closed",
        closedAt: getItalyIsoString(),
        closedBy: user.user_name,
        closingCash: params.closingCash,
        closingKeycards: params.closingKeycards,
        closeDifference: params.closeDifference,
        closeType: params.closeType,
        ...(params.varianceSignoffRequired !== undefined
          ? { varianceSignoffRequired: params.varianceSignoffRequired }
          : {}),
        ...(params.signedOffBy ? { signedOffBy: params.signedOffBy } : {}),
        ...(params.signedOffByUid ? { signedOffByUid: params.signedOffByUid } : {}),
        ...(params.signedOffAt ? { signedOffAt: params.signedOffAt } : {}),
        ...(params.varianceNote ? { varianceNote: params.varianceNote } : {}),
      };
      try {
        await update(ref(database, `tillShifts/${shiftId}`), payload);
      } catch (error) {
        console.error("Error writing till shift close:", error);
        showToast("Failed to record shift close.", "error");
      }
    },
    [database, user]
  );

  return useMemo(
    () => ({
      recordShiftOpen,
      recordShiftClose,
    }),
    [recordShiftOpen, recordShiftClose]
  );
}
