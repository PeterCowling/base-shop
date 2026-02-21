// File: /src/hooks/data/barOrder/useUnconfirmedBarOrderData.ts

import { useMemo } from "react";

import { barOrderSchema } from "../../../schemas/barOrderSchema";
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
  } = useFirebaseSubscription<UnconfirmedSalesOrder>("barOrders/unconfirmed");

  const parsed: { unconfirmedOrder: UnconfirmedSalesOrder | null; parseError: unknown | null } = useMemo(() => {
    if (!data) {
      return { unconfirmedOrder: null, parseError: null };
    }

    const res = barOrderSchema.safeParse(data);
    if (res.success) {
      return { unconfirmedOrder: res.data as UnconfirmedSalesOrder, parseError: null };
    }

    return { unconfirmedOrder: null, parseError: res.error };
  }, [data]);

  const error = subError ?? parsed.parseError;

  return useMemo(() => {
    return { unconfirmedOrder: parsed.unconfirmedOrder, loading, error };
  }, [parsed.unconfirmedOrder, loading, error]);
}
