// src/hooks/useCreditSlipsMutations.ts
import { push, ref, set } from "firebase/database";
import { useCallback, useMemo } from "react";

import { useAuth } from "../../../context/AuthContext";
import { useFirebaseDatabase } from "../../../services/useFirebase";
import { CreditSlip } from "../../../types/component/Till";
import { getItalyIsoString } from "../../../utils/dateUtils";

/**
 * Provides mutation helpers for the `/creditSlips` node.
 */
export function useCreditSlipsMutations() {
  const database = useFirebaseDatabase();
  const { user } = useAuth();

  /**
   * Adds a new credit slip to the database.
   */
  const addCreditSlip = useCallback(
    async (slip: Omit<CreditSlip, "timestamp" | "user">) => {
      if (!user) {
        console.error("No user logged in; cannot add credit slip.");
        return;
      }
      const newRef = push(ref(database, "creditSlips"));
      const slipData: CreditSlip = {
        ...slip,
        timestamp: getItalyIsoString(),
        user: user.user_name,
      };
      try {
        await set(newRef, slipData);
      } catch (err) {
        console.error("Error writing credit slip:", err);
      }
    },
    [database, user]
  );

  return useMemo(() => ({ addCreditSlip }), [addCreditSlip]);
}
