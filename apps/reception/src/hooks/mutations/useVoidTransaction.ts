import { useCallback, useState } from "react";
import { get, ref, update } from "firebase/database";

import { useAuth } from "../../context/AuthContext";
import { useFirebaseDatabase } from "../../services/useFirebase";
import { type FinancialTransaction } from "../../types/hooks/data/allFinancialTransaction";
import { type RoomTransaction } from "../../types/hooks/mutations/fiancialsRoomMutation";
import { getItalyIsoString } from "../../utils/dateUtils";
import { getStoredShiftId } from "../../utils/shiftId";
import { showToast } from "../../utils/toastUtils";

import useFinancialsRoomMutations from "./useFinancialsRoomMutations";

export default function useVoidTransaction() {
  const database = useFirebaseDatabase();
  const { user } = useAuth();
  const { saveFinancialsRoom } = useFinancialsRoomMutations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const voidTransaction = useCallback(
    async (txnId: string, reason: string): Promise<void> => {
      if (!database) {
        setError("Database not initialized.");
        return;
      }
      if (!user) {
        showToast("Not authorized. Please log in.", "error");
        return;
      }
      if (!reason.trim()) {
        showToast("Void reason is required.", "error");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const txnRef = ref(database, `allFinancialTransactions/${txnId}`);
        const txnSnap = await get(txnRef);
        if (!txnSnap.exists()) {
          setLoading(false);
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
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [database, user, saveFinancialsRoom]
  );

  return { voidTransaction, loading, error };
}
