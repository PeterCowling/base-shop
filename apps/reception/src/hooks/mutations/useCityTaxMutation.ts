/* File: /src/hooks/mutations/useCityTaxMutation.ts */

import { useCallback } from "react";
import { ref, update } from "firebase/database";

import { useFirebaseDatabase } from "../../services/useFirebase";
import { type CityTaxRecord } from "../../types/hooks/data/cityTaxData";
import type { MutationState } from "../../types/hooks/mutations/mutationState";

import useMutationState from "./useMutationState";

interface UseCityTaxMutationResult extends MutationState<void> {
  saveCityTax: (
    bookingRef: string,
    occupantId: string,
    taxData: Partial<CityTaxRecord>
  ) => Promise<void>;
}

/**
 * Mutation hook to update an occupant's city tax record in Firebase.
 * - Accepts a partial CityTaxRecord, allowing you to update one or more fields.
 */
export default function useCityTaxMutation(): UseCityTaxMutationResult {
  const database = useFirebaseDatabase();
  const { loading, error, run } = useMutationState();

  const saveCityTax = useCallback(
    async (
      bookingRef: string,
      occupantId: string,
      taxData: Partial<CityTaxRecord>
    ) => {
      const cityTaxRef = ref(database, `cityTax/${bookingRef}/${occupantId}`);

      await run(async () => {
        await update(cityTaxRef, taxData);
      });
    },
    [database, run]
  );

  return { saveCityTax, loading, error };
}
