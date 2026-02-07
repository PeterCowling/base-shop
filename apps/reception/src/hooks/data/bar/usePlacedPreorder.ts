// src/hooks/data/usePlacedPreorder.ts
import { useEffect, useState } from "react";
import { get, ref } from "firebase/database";

import { placedPreorderSchema } from "../../../schemas/placedPreorderSchema";
import { useFirebaseDatabase } from "../../../services/useFirebase";
import type { PlacedPreorder } from "../../../types/bar/BarTypes";
/**
 * Provides a simplified way to fetch an existing placed preorder from either:
 *   - barOrders/breakfastPreorders/<monthName>/<dayStr>/<txnId>
 *   - barOrders/evDrinkPreorders/<monthName>/<dayStr>/<txnId>
 *
 * In real code, you’ll want more robust parameter handling (you need monthName, dayStr, etc.).
 * For demonstration, we assume you already know them or pass them in.
 */
export interface UsePlacedPreorderReturn {
  data: PlacedPreorder | null;
  loading: boolean;
  error: string | null;
}

export function usePlacedPreorder(
  type: "breakfast" | "evDrink",
  monthName: string,
  dayStr: string,
  txnId: string | null
): UsePlacedPreorderReturn {
  const [data, setData] = useState<PlacedPreorder | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const database = useFirebaseDatabase();

  useEffect(() => {
    if (!txnId || !monthName || !dayStr) {
      setLoading(false);
      setData(null);
      return;
    }
    setLoading(true);

    const basePath =
      type === "breakfast"
        ? `barOrders/breakfastPreorders`
        : `barOrders/evDrinkPreorders`;
    const path = `${basePath}/${monthName}/${dayStr}/${txnId}`;

    const fetchData = async () => {
      try {
        const snap = await get(ref(database, path));
        if (snap.exists()) {
          const res = placedPreorderSchema.safeParse(snap.val());
          if (res.success) {
            setData(res.data as PlacedPreorder);
            setError(null);
          } else {
            setError(res.error.message);
            setData(null);
          }
        } else {
          setData(null);
          setError(null);
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Error fetching preorder detail";
        setError(message);
      }
      setLoading(false);
    };

    fetchData();
  }, [txnId, monthName, dayStr, type, database]);

  return { data, loading, error };
}
