/* File: src/hooks/components/checkin/useKeycardData.ts */

import { useMemo } from "react";

import {
  type SimpleTransaction,
  simpleTransactionSchema,
} from "../../schemas/simpleTransactionSchema";

import useFirebaseSubscription from "./useFirebaseSubscription";

export default function useKeycardData(bookingRef: string, occupantId: string) {
  const path = `loans/${bookingRef}/${occupantId}/txns`;
  const { data } = useFirebaseSubscription<Record<string, unknown>>(path);

  const { keycardCount, totalCashDeposits } = useMemo(() => {
    if (!data) return { keycardCount: 0, totalCashDeposits: 0 };
    let count = 0;
    let totalCash = 0;

    Object.values(data).forEach((raw) => {
      const parsed = simpleTransactionSchema.safeParse(raw);
      if (!parsed.success) return;
      const txn: SimpleTransaction = parsed.data;
      if (txn.item.toLowerCase() === "keycard") {
        if (txn.deposit >= 0) {
          count += txn.count;
          if (txn.method === "CASH") totalCash += txn.deposit;
        } else {
          count -= txn.count;
          if (txn.method === "CASH") totalCash += txn.deposit;
        }
      }
    });
    return {
      keycardCount: count < 0 ? 0 : count,
      totalCashDeposits: totalCash < 0 ? 0 : totalCash,
    };
  }, [data]);

  return { keycardCount, totalCashDeposits };
}
