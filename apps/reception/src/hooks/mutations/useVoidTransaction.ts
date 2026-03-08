import { useCallback } from "react";
import { get, ref, update } from "firebase/database";

import { useAuth } from "../../context/AuthContext";
import { useFirebaseDatabase } from "../../services/useFirebase";
import { type FinancialTransaction } from "../../types/hooks/data/allFinancialTransaction";
import { type RoomTransaction } from "../../types/hooks/mutations/fiancialsRoomMutation";
import type { MutationState } from "../../types/hooks/mutations/mutationState";
import { getItalyIsoString } from "../../utils/dateUtils";
import { getStoredShiftId } from "../../utils/shiftId";
import { showToast } from "../../utils/toastUtils";

import useFinancialsRoomMutations from "./useFinancialsRoomMutations";
import useMutationState from "./useMutationState";

interface UseVoidTransactionReturn extends MutationState<void> {
  voidTransaction: (txnId: string, reason: string) => Promise<void>;
}

export default function useVoidTransaction(): UseVoidTransactionReturn {
  const database = useFirebaseDatabase();
  const { user } = useAuth();
  const { saveFinancialsRoom } = useFinancialsRoomMutations();
  const { loading, error, run } = useMutationState();

  const voidTransaction = useCallback(
    async (txnId: string, reason: string): Promise<void> => {
      if (!database) {
        throw new Error("Database not initialized.");
      }
      if (!user) {
        showToast("Not authorized. Please log in.", "error");
        return;
      }
      if (!reason.trim()) {
        showToast("Void reason is required.", "error");
        return;
      }

      await run(async () => {
        const txnRef = ref(database, `allFinancialTransactions/${txnId}`);
        const txnSnap = await get(txnRef);
        if (!txnSnap.exists()) {
          return;
        }
        const txn = txnSnap.val() as FinancialTransaction;
        if (txn.voidedAt || txn.voidedBy || txn.voidReason) {
          showToast("Transaction is already voided.", "info");
          return;
        }

        const voidedAt = getItalyIsoString();
        const voidedBy = user.user_name ?? "unknown";
        const voidedByUid = user.uid ?? undefined;
        const voidReason = reason.trim();
        const voidedShiftId = getStoredShiftId() ?? undefined;

        await update(ref(database), {
          [`allFinancialTransactions/${txnId}/voidedAt`]: voidedAt,
          [`allFinancialTransactions/${txnId}/voidedBy`]: voidedBy,
          [`allFinancialTransactions/${txnId}/voidedByUid`]: voidedByUid,
          [`allFinancialTransactions/${txnId}/voidReason`]: voidReason,
          [`allFinancialTransactions/${txnId}/voidedShiftId`]: voidedShiftId,
        });

        if (txn.bookingRef) {
          const roomTxnSnap = await get(
            ref(database, `financialsRoom/${txn.bookingRef}/transactions/${txnId}`)
          );
          if (roomTxnSnap.exists()) {
            const roomTxn = roomTxnSnap.val() as RoomTransaction;
            await saveFinancialsRoom(txn.bookingRef, {
              transactions: {
                [txnId]: {
                  ...roomTxn,
                  voidedAt,
                  voidedBy,
                  voidedByUid,
                  voidReason,
                  voidedShiftId,
                },
              },
            });
          }
        }
      });
    },
    [database, user, saveFinancialsRoom, run]
  );

  return { voidTransaction, loading, error };
}
