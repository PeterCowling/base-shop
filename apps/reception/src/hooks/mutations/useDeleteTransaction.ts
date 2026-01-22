import { useCallback, useState } from "react";
import { get, ref, update } from "firebase/database";

import { useFirebaseDatabase } from "../../services/useFirebase";
import { type FinancialTransaction } from "../../types/hooks/data/allFinancialTransaction";
import { type FinancialsRoomData } from "../../types/hooks/data/financialsRoomData";

import useFinancialsRoomMutations from "./useFinancialsRoomMutations";

export default function useDeleteTransaction() {
  const database = useFirebaseDatabase();
  const { saveFinancialsRoom } = useFinancialsRoomMutations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const deleteTransaction = useCallback(
    async (txnId: string): Promise<void> => {
      if (!database) {
        setError("Database not initialized.");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const txnSnap = await get(
          ref(database, `allFinancialTransactions/${txnId}`)
        );
        if (!txnSnap.exists()) {
          setLoading(false);
          return;
        }
        const txn = txnSnap.val() as FinancialTransaction;

        await update(ref(database), {
          [`allFinancialTransactions/${txnId}`]: null,
        });

        if (txn.bookingRef) {
          const finSnap = await get(
            ref(database, `financialsRoom/${txn.bookingRef}`)
          );
          if (finSnap.exists()) {
            const finData = finSnap.val() as FinancialsRoomData;
            const { [txnId]: _removed, ...remaining } =
              finData.transactions || {};
            await saveFinancialsRoom(txn.bookingRef, {
              transactions: remaining,
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
    [database, saveFinancialsRoom]
  );

  return { deleteTransaction, loading, error };
}
