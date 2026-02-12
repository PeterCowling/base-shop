import { useCallback, useMemo } from "react";
import { push, ref, set } from "firebase/database";

import { useAuth } from "../../context/AuthContext";
import { manualTerminalBatchSchema } from "../../schemas/reconciliationManualSchema";
import { useFirebaseDatabase } from "../../services/useFirebase";
import { getItalyIsoString } from "../../utils/dateUtils";
import { getErrorMessage } from "../../utils/errorMessage";
import { showToast } from "../../utils/toastUtils";

export function useTerminalBatchesMutations() {
  const database = useFirebaseDatabase();
  const { user } = useAuth();

  const addTerminalBatch = useCallback(
    async (amount: number, note?: string): Promise<void> => {
      if (!user) {
        showToast("No user logged in", "error");
        return;
      }

      const entry = {
        amount,
        createdAt: getItalyIsoString(),
        createdBy: user.user_name,
        ...(note ? { note } : {}),
      };

      const result = manualTerminalBatchSchema.safeParse(entry);
      if (!result.success) {
        showToast(getErrorMessage(result.error), "error");
        return Promise.reject(result.error);
      }

      try {
        const newRef = push(ref(database, "reconciliation/terminalBatches"));
        await set(newRef, result.data);
        showToast("Terminal batch added", "success");
      } catch {
        showToast("Failed to save terminal batch", "error");
      }
    },
    [database, user]
  );

  return useMemo(() => ({ addTerminalBatch }), [addTerminalBatch]);
}
