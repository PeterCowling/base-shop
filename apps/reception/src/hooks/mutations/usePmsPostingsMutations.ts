import { useCallback, useMemo } from "react";
import { push, ref, set } from "firebase/database";

import { useAuth } from "../../context/AuthContext";
import { manualPmsPostingSchema } from "../../schemas/reconciliationManualSchema";
import { useFirebaseDatabase } from "../../services/useFirebase";
import { getItalyIsoString } from "../../utils/dateUtils";
import { getErrorMessage } from "../../utils/errorMessage";
import { showToast } from "../../utils/toastUtils";

export function usePmsPostingsMutations() {
  const database = useFirebaseDatabase();
  const { user } = useAuth();

  const addPmsPosting = useCallback(
    async (amount: number, method: "CASH" | "CC", note?: string): Promise<void> => {
      if (!user) {
        showToast("No user logged in", "error");
        return;
      }

      const entry = {
        amount,
        method,
        createdAt: getItalyIsoString(),
        createdBy: user.user_name,
        ...(note ? { note } : {}),
      };

      const result = manualPmsPostingSchema.safeParse(entry);
      if (!result.success) {
        showToast(getErrorMessage(result.error), "error");
        return Promise.reject(result.error);
      }

      try {
        const newRef = push(ref(database, "reconciliation/pmsPostings"));
        await set(newRef, result.data);
        showToast("PMS posting added", "success");
      } catch {
        showToast("Failed to save PMS posting", "error");
      }
    },
    [database, user]
  );

  return useMemo(() => ({ addPmsPosting }), [addPmsPosting]);
}
