// src/hooks/orchestrations/data/useAddRoomPaymentTransaction.ts
import { useCallback, useState } from "react";
import { ref, update } from "firebase/database";

import { useAuth } from "../../../context/AuthContext";
import { useFirebaseDatabase } from "../../../services/useFirebase";
import {
  type FinancialsRoom,
  type FinancialsRoomData,
} from "../../../types/hooks/data/financialsRoomData";
import { type RoomTransaction } from "../../../types/hooks/mutations/fiancialsRoomMutation";
import { getCurrentIsoTimestamp } from "../../../utils/dateUtils";
import { generateTransactionId } from "../../../utils/generateTransactionId";
import { getStoredShiftId } from "../../../utils/shiftId";
import useAllTransactions from "../../mutations/useAllTransactionsMutations";

/**
 * This hook adds a payment (or refund) transaction to both "/financialsRoom"
 * and "/allFinancialTransactions" in Firebase. It expects `financialsRoom`
 * to be a potentially null object of type:
 *
 *   type FinancialsRoom = Record<string, FinancialsRoomData> | null;
 *
 * We must therefore check for `null` before indexing into `financialsRoom`.
 */
export default function useAddRoomPaymentTransaction(
  financialsRoom: FinancialsRoom | null
) {
  const database = useFirebaseDatabase();
  const [error, setError] = useState<unknown>(null);
  const { user } = useAuth();
  const { addToAllTransactions } = useAllTransactions();

  /**
   * Main orchestration method to add a payment (or refund) transaction
   * for a specific booking reference. Also updates "allFinancialTransactions".
   */
  const addPaymentTransaction = useCallback(
    async (
      bookingRef: string,
      amount: number,
      options?: {
        occupantId?: string;
        nonRefundable?: boolean;
        type?: string; // "payment" | "refund" | "charge"
        description?: string;
        method?: "CASH" | "CC" | string;
        docType?: string;
      }
    ) => {
      const {
        occupantId,
        nonRefundable = true,
        type,
        description,
        method = "CC",
        docType = "",
      } = options || {};

      try {
        // If financialsRoom is null, treat it as an empty object
        // so we can safely do indexing without TypeScript errors.
        const safeFinancialsRoom = financialsRoom ?? {};

        // Access the current booking data or prepare a default.
        // Using optional chaining (?.) + fallback with ?? lets us avoid multiple checks.
        const bookingFin: FinancialsRoomData = safeFinancialsRoom[
          bookingRef
        ] ?? {
          totalDue: 0,
          totalPaid: 0,
          totalAdjust: 0,
          balance: 0,
          transactions: {},
        };

        // Generate a unique transaction ID (via shared utility)
        const txnId = generateTransactionId();

        // Calculate new totals for financialsRoom
        const { totalDue = 0, totalPaid = 0 } = bookingFin;
        const newTotalPaid = totalPaid + amount;
        const newBalance = totalDue - newTotalPaid;

        // Prepare the transaction object for financialsRoom
        const transactionObj: RoomTransaction = {
          occupantId,
          amount,
          timestamp: getCurrentIsoTimestamp(),
          type: type || (amount >= 0 ? "payment" : "refund"),
          nonRefundable,
          shiftId: getStoredShiftId() ?? undefined,
        };

        // Prepare the updates for Firebase under "/financialsRoom"
        const updates: Record<string, unknown> = {
          [`financialsRoom/${bookingRef}/transactions/${txnId}`]:
            transactionObj,
          [`financialsRoom/${bookingRef}/totalPaid`]: newTotalPaid,
          [`financialsRoom/${bookingRef}/balance`]: newBalance,
        };

        // Update "/financialsRoom"
        await update(ref(database), updates);

        // Mirror the transaction in "/allFinancialTransactions"
        const finalType = transactionObj.type;
        await addToAllTransactions(txnId, {
          bookingRef,
          occupantId: occupantId || "",
          amount,
          type: finalType,
          method,
          itemCategory: "roomCharge",
          count: 1,
          nonRefundable,
          docType,
          description:
            description ||
            (finalType === "refund" ? "Room refund" : "Room payment"),
          user_name: user?.user_name ?? "unknown",
        });
      } catch (err) {
        console.error("addPaymentTransaction error:", err);
        setError(err);
        throw err;
      }
    },
    [database, financialsRoom, user, addToAllTransactions]
  );

  return {
    addPaymentTransaction,
    error,
  };
}
