// /src/hooks/data/useCityTax.ts

import { useEffect, useMemo, useState } from "react";
import {
  type DataSnapshot,
  endAt,
  limitToFirst,
  onValue,
  orderByKey,
  query,
  ref,
  startAt,
} from "firebase/database";

import { cityTaxDataSchema } from "../../schemas/cityTaxSchema";
import { useFirebaseDatabase } from "../../services/useFirebase";
import { type UseCityTaxResult } from "../../types/domains/cityTaxDomain";
import { type CityTaxData } from "../../types/hooks/data/cityTaxData";

export interface UseCityTaxParams {
  startAt?: string;
  endAt?: string;
  limitToFirst?: number;
}
/**
 * Data hook to listen to the full "cityTax" node from Firebase.
 * - Reads data from: cityTax -> bookingRef -> occupantId -> { balance, totalDue, totalPaid }
 * - No transformations or mutations are performed here.
 */
export default function useCityTax(
  params: UseCityTaxParams = {}
): UseCityTaxResult {
  const database = useFirebaseDatabase();
  const { startAt: startKey, endAt: endKey, limitToFirst: limit } = params;

  const [cityTax, setCityTax] = useState<CityTaxData>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const baseRef = ref(database, "cityTax");
    let q = query(baseRef, orderByKey());
    if (startKey) q = query(q, startAt(startKey));
    if (endKey) q = query(q, endAt(endKey));
    if (limit !== undefined) q = query(q, limitToFirst(limit));

    const handleSnapshot = (snap: DataSnapshot) => {
      if (!snap.exists()) {
        setCityTax({});
        setLoading(false);
        return;
      }
      const raw = snap.val() as Record<string, unknown>;
      const result = cityTaxDataSchema.safeParse(raw);
      if (result.success) {
        setCityTax(result.data);
      } else {
        setError(result.error);
        setCityTax({});
      }
      setLoading(false);
    };

    const handleError = (err: unknown) => {
      setError(err);
      setLoading(false);
    };

    const unsubscribe = onValue(q, handleSnapshot, handleError);
    return () => unsubscribe();
  }, [database, startKey, endKey, limit]);

  const memoCityTax = useMemo(() => cityTax, [cityTax]);

  return { cityTax: memoCityTax, loading, error };
}
