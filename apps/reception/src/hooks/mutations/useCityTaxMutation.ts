/* File: /src/hooks/mutations/useCityTaxMutation.ts */

import { ref, update } from "firebase/database";
import { useCallback, useState } from "react";

import { useFirebaseDatabase } from "../../services/useFirebase";
import { CityTaxRecord } from "../../types/hooks/data/cityTaxData";

interface UseCityTaxMutationResult {
  saveCityTax: (
    bookingRef: string,
    occupantId: string,
    taxData: Partial<CityTaxRecord>
  ) => Promise<void>;
  loading: boolean;
  error: unknown;
}

/**
 * Mutation hook to update an occupant's city tax record in Firebase.
 * - Accepts a partial CityTaxRecord, allowing you to update one or more fields.
 */
export default function useCityTaxMutation(): UseCityTaxMutationResult {
  const database = useFirebaseDatabase();
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const saveCityTax = useCallback(
    async (
      bookingRef: string,
      occupantId: string,
      taxData: Partial<CityTaxRecord>
    ) => {
      setLoading(true);
      setError(null);

      const cityTaxRef = ref(database, `cityTax/${bookingRef}/${occupantId}`);

      try {
        await update(cityTaxRef, taxData);
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [database]
  );

  return { saveCityTax, loading, error };
}
