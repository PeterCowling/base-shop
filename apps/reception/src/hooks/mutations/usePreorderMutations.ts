/* src/hook/mutations/usePreorderMutations.ts */
import { ref, remove, update } from "firebase/database";
import { useCallback, useState } from "react";

import { useFirebaseDatabase } from "../../services/useFirebase";
import type { PreorderEntry } from "../../types/hooks/data/preorderData";

/**
 * Mutation Hook: Provides methods for updating and removing preorder data.
 *
 * - savePreorder: Creates or updates a preorder entry for a specific occupant and night.
 * - removePreorderEntry: Deletes a preorder entry for a given occupant and night.
 */
export default function usePreorderMutations() {
  const database = useFirebaseDatabase();
  const [error, setError] = useState<unknown>(null);

  /**
   * Save or update a preorder entry.
   *
   * @param occupantId - The unique identifier for the occupant (e.g., "occ_1741690203417").
   * @param nightKey - A key representing the night (e.g., "night1").
   * @param preorderData - The preorder details for that night.
   */
  const savePreorder = useCallback(
    async (
      occupantId: string,
      nightKey: string,
      preorderData: PreorderEntry
    ) => {
      try {
        const preorderRef = ref(database, `preorder/${occupantId}/${nightKey}`);
        await update(preorderRef, preorderData);
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    [database]
  );

  /**
   * Remove a specific preorder entry.
   *
   * @param occupantId - The unique identifier for the occupant.
   * @param nightKey - The key for the night to be removed.
   */
  const removePreorderEntry = useCallback(
    async (occupantId: string, nightKey: string) => {
      try {
        const entryRef = ref(database, `preorder/${occupantId}/${nightKey}`);
        await remove(entryRef);
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    [database]
  );

  return {
    savePreorder,
    removePreorderEntry,
    error,
  };
}
