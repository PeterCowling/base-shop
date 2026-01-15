/*
import { ref, update } from "firebase/database";
import { useCallback } from "react";

import { useAuth } from "../../../../../context/AuthContext";
import { useFirebaseDatabase } from "../../../../../services/useFirebase";
import { FinancialTransaction } from "../../../../../types/hooks/data/allFinancialTransaction";

// Import getItalyIsoString from the centralized date utilities.
import { getItalyIsoString } from "../../../../../utils/dateUtils";

/**
 * Hook that provides actions (mutations) for writing to the "allTransactions" node.
 *
export function useAllTransactions() {
  const database = useFirebaseDatabase();
  const { user } = useAuth();

  /**
   * Adds a transaction to 'allTransactions/<transactionId>'.
   *
  const addToAllTransactions = useCallback(
    async (
      transactionId: string,
      data: Omit<FinancialTransaction, "user_name" | "timestamp">
    ): Promise<void> => {
      if (!user) {
        console.error(
          "User is not logged in; cannot write to allTransactions."
        );
        return;
      }

      const path = `allTransactions/${transactionId}`;
      try {
        await update(ref(database), {
          [path]: {
            ...data,
            user_name: user.user_name || "system",
            // Use the centralized getItalyIsoString function.
            timestamp: getItalyIsoString(),
          },
        });
        console.log(`Successfully wrote to allTransactions at ${path}`, data);
      } catch (error) {
        console.error("Failed to write transaction to allTransactions:", error);
        throw error;
      }
    },
    [database, user]
  );

  return { addToAllTransactions };
}
*/
