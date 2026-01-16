import { push, ref, set } from "firebase/database";
import { useCallback, useMemo } from "react";

import { useAuth } from "../../context/AuthContext";
import { useFirebaseDatabase } from "../../services/useFirebase";
import { KeycardDiscrepancy } from "../../types/hooks/data/keycardDiscrepancyData";
import { getItalyIsoString } from "../../utils/dateUtils";

export function useKeycardDiscrepanciesMutations() {
  const database = useFirebaseDatabase();
  const { user } = useAuth();

  const addKeycardDiscrepancy = useCallback(
    async (amount: number) => {
      if (!user) {
        console.error(
          "No user logged in; cannot add keycard discrepancy record."
        );
        return;
      }
      try {
        const newRef = push(ref(database, "keycardDiscrepancies"));
        const data: KeycardDiscrepancy = {
          user: user.user_name,
          timestamp: getItalyIsoString(),
          amount,
        };
        await set(newRef, data);
      } catch (err) {
        console.error("Error writing keycard discrepancy record:", err);
      }
    },
    [database, user]
  );

  return useMemo(() => ({ addKeycardDiscrepancy }), [addKeycardDiscrepancy]);
}
