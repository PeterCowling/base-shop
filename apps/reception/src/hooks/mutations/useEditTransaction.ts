import { get, ref, update } from "firebase/database";
import { useCallback, useState } from "react";
import { flushSync } from "react-dom";

import { useFirebaseDatabase } from "../../services/useFirebase";
import { FinancialTransaction } from "../../types/hooks/data/allFinancialTransaction";

export default function useEditTransaction() {
  const database = useFirebaseDatabase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const editTransaction = useCallback(
    async (
      txnId: string,
      updates: Partial<FinancialTransaction>
    ): Promise<void> => {
      if (!database) {
        setError("Database not initialized.");
        return;
      }

      flushSync(() => {
        setLoading(true);
      });
      setError(null);
      try {
        const txnRef = ref(database, `allFinancialTransactions/${txnId}`);
        const snap = await get(txnRef);
        if (!snap.exists()) {
          setLoading(false);
          return;
        }
        const existing = snap.val() as FinancialTransaction;
        const newTxn = { ...existing, ...updates };
        await update(ref(database), {
          [`allFinancialTransactions/${txnId}`]: newTxn,
        });
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [database]
  );

  return { editTransaction, loading, error };
}
