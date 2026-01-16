// File: /src/hooks/mutations/useFinancialsRoomMutations.ts
import { get, ref, set } from "firebase/database";
import { useCallback, useState } from "react";

import { useFirebaseDatabase } from "../../services/useFirebase";
import {
  FinancialsRoomData,
  RoomTransaction,
} from "../../types/hooks/data/financialsRoomData";

/**
 * Merges existing data with a partial update, preserving old transactions
 * and adding/overwriting new ones.
 */
function mergeFinancials(
  existing: FinancialsRoomData,
  partial: Partial<FinancialsRoomData>
): FinancialsRoomData {
  return {
    balance: partial.balance ?? existing.balance,
    totalDue: partial.totalDue ?? existing.totalDue,
    totalPaid: partial.totalPaid ?? existing.totalPaid,
    totalAdjust: partial.totalAdjust ?? existing.totalAdjust,
    transactions: {
      ...existing.transactions,
      ...partial.transactions,
    },
  };
}

/**
 * Recalculates top-level fields from transaction details.
 * - "charge"   => increases totalDue
 * - "payment"  => increases totalPaid
 * - "refund"   => decreases totalPaid (like negative payment)
 * - "adjust"   => tracked separately in totalAdjust
 */
function calculateFinancials(
  transactions: Record<string, RoomTransaction>
): Pick<
  FinancialsRoomData,
  "balance" | "totalDue" | "totalPaid" | "totalAdjust"
> {
  let totalDue = 0;
  let totalPaid = 0;
  let totalAdjust = 0;

  Object.values(transactions).forEach((txn) => {
    switch (txn.type) {
      case "charge":
        totalDue += txn.amount;
        break;
      case "payment":
        totalPaid += txn.amount;
        break;
      case "refund":
        totalPaid -= txn.amount;
        break;
      case "adjust":
        totalAdjust += txn.amount;
        break;
      default:
        break; // Unknown type (ignore or handle differently)
    }
  });

  // We define the "balance" as totalDue - totalPaid - totalAdjust
  const balance = totalDue - totalPaid - totalAdjust;
  return { totalDue, totalPaid, totalAdjust, balance };
}

/**
 * Mutator Hook
 * Provides a function that merges partial data into existing `financialsRoom/{bookingRef}`,
 * then recalculates the top-level fields from the transactions.
 */
export default function useFinancialsRoomMutations() {
  const database = useFirebaseDatabase();
  const [error, setError] = useState<unknown>(null);

  /**
   * saveFinancialsRoom
   * 1) Reads existing data or uses defaults if none
   * 2) Merges partial data
   * 3) Recalculates top-level fields (balance, totalDue, totalPaid, totalAdjust)
   * 4) Writes final data back to Firebase
   */
  const saveFinancialsRoom = useCallback(
    async (bookingRef: string, partial: Partial<FinancialsRoomData>) => {
      if (!database) {
        const dbErr = new Error("Firebase database is not initialized.");
        setError(dbErr);
        return Promise.reject(dbErr);
      }

      const nodeRef = ref(database, `financialsRoom/${bookingRef}`);

      try {
        const snapshot = await get(nodeRef);
        const existingData: FinancialsRoomData = snapshot.exists()
          ? (snapshot.val() as FinancialsRoomData)
          : {
              balance: 0,
              totalDue: 0,
              totalPaid: 0,
              totalAdjust: 0,
              transactions: {},
            };

        // 1) Merge partial data into existing
        const merged = mergeFinancials(existingData, partial);

        // 2) Calculate derived fields from merged transactions
        const recalculated = calculateFinancials(merged.transactions);

        // 3) Final updated object
        const updatedData: FinancialsRoomData = {
          ...merged,
          ...recalculated,
        };

        // 4) Write to Firebase
        await set(nodeRef, updatedData);
      } catch (err) {
        setError(err);
        return Promise.reject(err);
      }
    },
    [database]
  );

  return { saveFinancialsRoom, error };
}
