import { push, ref, set } from "firebase/database";
import { useCallback, useMemo } from "react";

import { useAuth } from "../../context/AuthContext";
import { useFirebaseDatabase } from "../../services/useFirebase";
import { CCReceiptIrregularity } from "../../types/hooks/data/ccIrregularityData";
import { getItalyIsoString } from "../../utils/dateUtils";

export function useCCIrregularitiesMutations() {
  const database = useFirebaseDatabase();
  const { user } = useAuth();

  const addCCIrregularity = useCallback(
    async (action: "reconcile" | "close", missingCount: number) => {
      if (!user) {
        console.error("No user logged in; cannot add irregularity record.");
        return;
      }
      try {
        const newRef = push(ref(database, "ccIrregularities"));
        const data: CCReceiptIrregularity = {
          user: user.user_name,
          timestamp: getItalyIsoString(),
          action,
          missingCount,
        };
        await set(newRef, data);
      } catch (err) {
        console.error("Error writing cc irregularity:", err);
      }
    },
    [database, user]
  );

  return useMemo(() => ({ addCCIrregularity }), [addCCIrregularity]);
}
