// src/hooks/data/bar/useCompletedOrder.ts

import { useEffect, useState } from "react";
import { get, ref } from "firebase/database";

import { salesOrderSchema } from "../../../schemas/salesOrderSchema";
import { useFirebaseDatabase } from "../../../services/useFirebase";
import type { SalesOrder } from "../../../types/bar/BarTypes";

type UseCompletedOrderReturn = {
  data: SalesOrder | null;
  loading: boolean;
  error: unknown;
};

/**
 * Fetches a single completed order by transaction ID from
 * `barOrders/completed/<txnId>`.
 */
export function useCompletedOrder(
  txnId: string | null
): UseCompletedOrderReturn {
  const database = useFirebaseDatabase();
  const [data, setData] = useState<SalesOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!txnId) {
      setLoading(false);
      setData(null);
      return;
    }

    setLoading(true);

    const fetchData = async (): Promise<void> => {
      try {
        const snap = await get(ref(database, `barOrders/completed/${txnId}`));
        if (snap.exists()) {
          const res = salesOrderSchema.safeParse(snap.val());
          if (res.success) {
            setData(res.data as SalesOrder);
          } else {
            setError(res.error);
            setData(null);
          }
        } else {
          setData(null);
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [txnId, database]);

  return { data, loading, error };
}
