// File: /src/hooks/data/useSalesOrders.ts

import { useEffect, useState } from "react";

import { salesOrderSchema } from "../../../schemas/salesOrderSchema";
import { SalesOrder } from "../../../types/bar/BarTypes";
import useFirebaseSubscription from "../useFirebaseSubscription";

export function useSalesOrders() {
  const {
    data,
    loading,
    error: subError,
  } = useFirebaseSubscription<
    Record<string, Omit<SalesOrder, "orderKey"> | { unconfirmed?: unknown }>
  >("barOrders/sales/");

  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [error, setError] = useState<unknown>(subError);

  useEffect(() => {
    if (subError) {
      setError(subError);
      return;
    }
    if (!data) {
      setOrders([]);
      return;
    }
    const loaded: SalesOrder[] = [];
    Object.entries(data).forEach(([key, value]) => {
      if (key === "unconfirmed") return;
      const orderData = value as Omit<SalesOrder, "orderKey">;

      // Only validate confirmed orders to avoid errors from
      // in–progress objects that may not match the schema.
      if (!orderData.confirmed) return;

      const res = salesOrderSchema.safeParse({ ...orderData, orderKey: key });
      if (res.success) {
        loaded.push(res.data);
      } else {
        setError(res.error);
      }
    });
    setOrders(loaded);
  }, [data, subError]);

  return { orders, loading, error };
}
