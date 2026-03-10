// File: /src/hooks/mutations/useFinancialsRoomMutations.ts
import { useCallback } from "react";
import { ref, runTransaction } from "firebase/database";

import { useFirebaseDatabase } from "../../services/useFirebase";
import {
  type FinancialsRoomData,
  type RoomTransaction,
} from "../../types/hooks/data/financialsRoomData";
import type { MutationState } from "../../types/hooks/mutations/mutationState";

import useMutationState from "./useMutationState";

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

function normalizeFinancialsRoomData(current: unknown): FinancialsRoomData {
  const fallback: FinancialsRoomData = {
    balance: 0,
    totalDue: 0,
    totalPaid: 0,
    totalAdjust: 0,
    transactions: {},
  };

  if (!current || typeof current !== "object") {
    return fallback;
  }

  const record = current as Partial<FinancialsRoomData>;
  return {
    balance: record.balance ?? 0,
    totalDue: record.totalDue ?? 0,
    totalPaid: record.totalPaid ?? 0,
    totalAdjust: record.totalAdjust ?? 0,
    transactions: record.transactions ?? {},
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
    if (txn.voidedAt || txn.voidedBy || txn.voidReason) {
      return;
    }
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

interface UseFinancialsRoomMutationsReturn extends MutationState<void> {
  saveFinancialsRoom: (
    bookingRef: string,
    partial: Partial<FinancialsRoomData>
  ) => Promise<void>;
}

/**
 * Mutator Hook
 * Provides a function that merges partial data into existing `financialsRoom/{bookingRef}`,
 * then recalculates the top-level fields from the transactions.
 */
export default function useFinancialsRoomMutations(): UseFinancialsRoomMutationsReturn {
  const database = useFirebaseDatabase();
  const { loading, error, run } = useMutationState();

  /**
   * saveFinancialsRoom
   * Uses a Firebase transaction to avoid lost updates during concurrent writes.
   */
  const saveFinancialsRoom = useCallback(
    async (bookingRef: string, partial: Partial<FinancialsRoomData>) => {
      if (!database) {
        throw new Error("Firebase database is not initialized.");
      }

      await run(async () => {
        const nodeRef = ref(database, `financialsRoom/${bookingRef}`);

        const result = await runTransaction(nodeRef, (currentValue) => {
          const existingData = normalizeFinancialsRoomData(currentValue);

          // 1) Merge partial data into existing
          const merged = mergeFinancials(existingData, partial);

          // 2) Calculate derived fields from merged transactions
          const recalculated = calculateFinancials(merged.transactions);

          // 3) Final updated object
          return {
            ...merged,
            ...recalculated,
          } as FinancialsRoomData;
        });

        if (!result.committed) {
          throw new Error("Financials transaction was not committed");
        }
      });
    },
    [database, run]
  );

  return { saveFinancialsRoom, error, loading };
}
