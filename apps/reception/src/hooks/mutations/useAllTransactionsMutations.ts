/* src/hooks/mutations/useAllTransactionsMutations.ts */
import { useCallback, useState } from "react";
import { get, ref, update } from "firebase/database";

import { useAuth } from "../../context/AuthContext";
import { useFirebaseDatabase } from "../../services/useFirebase";
import { type FinancialTransaction } from "../../types/hooks/data/allFinancialTransaction";
import { getItalyIsoString } from "../../utils/dateUtils";
import { getStoredShiftId } from "../../utils/shiftId";

/**
 * A hook for writing/updating financial transaction records in:
 * "allFinancialTransactions/<transactionId>".
 */
export default function useAllTransactions() {
  const database = useFirebaseDatabase();
  const { user } = useAuth();
  const [error, setError] = useState<unknown>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * Write or update a transaction record to "allFinancialTransactions/<transactionId>".
   * - Checks if the user is logged in before attempting to write.
   * - Always sets the `timestamp` using `getItalyIsoString()`.
   * - Adds a `user_name` field based on the logged-in user (defaults to "system").
   * - Stores any caught errors in local state and also sets success state on completion.
   */
  const addToAllTransactions = useCallback(
    async (
      transactionId: string,
      transactionData: Partial<FinancialTransaction>
    ): Promise<void> => {
      setError(null);
      setSuccess(null);

      // Ensure the user is logged in
      if (!user) {
        const errMsg =
          "User is not logged in; cannot write to allFinancialTransactions.";
        console.error(errMsg);
        setError(errMsg);
        return;
      }

      try {
        const existingSnap = await get(
          ref(database, `allFinancialTransactions/${transactionId}`)
        );
        if (existingSnap.exists()) {
          const allowedFields = new Set([
            "voidedAt",
            "voidedBy",
            "voidedByUid",
            "voidReason",
            "voidedShiftId",
          ]);
          const payloadEntries = Object.entries(transactionData);
          const hasDisallowed = payloadEntries.some(
            ([key]) => !allowedFields.has(key)
          );
          if (hasDisallowed) {
            const errMsg =
              "Refusing to overwrite existing transaction. Use void/correction flows.";
            console.error(errMsg);
            setError(errMsg);
            return;
          }
          if (payloadEntries.length === 0) {
            return;
          }
          const updatePayload: Record<string, unknown> = {};
          payloadEntries.forEach(([key, value]) => {
            updatePayload[`allFinancialTransactions/${transactionId}/${key}`] =
              value;
          });
          await update(ref(database), updatePayload);
          const successMsg = `Updated void fields on allFinancialTransactions/${transactionId}`;
          console.log(successMsg, updatePayload);
          setSuccess(successMsg);
          return;
        } else {
          // Build a Partial<FinancialTransaction> so optional fields are not strictly required
          const payload: Partial<FinancialTransaction> = {
            ...transactionData,
            user_name: user.user_name ?? "system",
            timestamp: getItalyIsoString(),
            shiftId: transactionData.shiftId ?? getStoredShiftId() ?? undefined,
          };
          await update(ref(database), {
            [`allFinancialTransactions/${transactionId}`]: payload,
          });
          const successMsg = `Successfully wrote to allFinancialTransactions/${transactionId}`;
          console.log(successMsg, payload);
          setSuccess(successMsg);
        }
      } catch (err) {
        console.error(
          "Failed to write transaction to allFinancialTransactions:",
          err
        );
        setError(err);
        throw err;
      }
    },
    [database, user]
  );

  return {
    addToAllTransactions,
    error,
    success,
  };
}
