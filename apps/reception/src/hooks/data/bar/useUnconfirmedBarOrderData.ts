// File: /src/hooks/data/barOrder/useUnconfirmedBarOrderData.ts

import { useEffect, useMemo, useState } from "react";

import { barOrderSchema, type BarOrder } from "../../../schemas/barOrderSchema";
import type { UnconfirmedSalesOrder } from "../../../types/bar/BarTypes";
import useFirebaseSubscription from "../useFirebaseSubscription";

/**
 * useUnconfirmedBarOrderData:
 * Subscribes to /barOrders/unconfirmed for read-only data.
 */
export function useUnconfirmedBarOrderData(): {
  unconfirmedOrder: UnconfirmedSalesOrder | null;
  loading: boolean;
  error: unknown;
} {
  const {
    data,
    loading,
    error: subError,
  } = useFirebaseSubscription<BarOrder>("barOrders/unconfirmed");

  const [error, setError] = useState<unknown>(subError);

  useEffect(() => {
    if (subError) setError(subError);
  }, [subError]);

  const unconfirmedOrder = useMemo(() => {
    if (!data) return null;
    const res = barOrderSchema.safeParse(data);
    if (res.success) {
      return res.data;
    }
    setError(res.error);
    return null;
  }, [data]);

  return useMemo(
    () => ({ unconfirmedOrder, loading, error }),
    [unconfirmedOrder, loading, error]
  );
}
