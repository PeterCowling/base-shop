/* src/hooks/mutations/useCashDiscrepanciesMutations.ts */

import { useCallback, useMemo } from "react";
import { push, ref, set } from "firebase/database";

import { useAuth } from "../../context/AuthContext";
import { useFirebaseDatabase } from "../../services/useFirebase";
import { type CashDiscrepancy } from "../../types/hooks/data/cashDiscrepancyData";
import { getItalyIsoString } from "../../utils/dateUtils";

/**
 * Mutation helpers for `/cashDiscrepancies`.
 */
export function useCashDiscrepanciesMutations() {
  const database = useFirebaseDatabase();
  const { user } = useAuth();

  const addCashDiscrepancy = useCallback(
    async (amount: number) => {
      if (!user) {
        console.error("No user logged in; cannot add discrepancy record.");
        return;
      }
      try {
        const newRef = push(ref(database, "cashDiscrepancies"));
        const data: CashDiscrepancy = {
          user: user.user_name,
          timestamp: getItalyIsoString(),
          amount,
        };
        await set(newRef, data);
      } catch (err) {
        console.error("Error writing discrepancy record:", err);
      }
    },
    [database, user]
  );

  return useMemo(() => ({ addCashDiscrepancy }), [addCashDiscrepancy]);
}
