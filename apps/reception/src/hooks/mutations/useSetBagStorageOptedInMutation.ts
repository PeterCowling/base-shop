// File: /src/hooks/mutations/useSetBagStorageOptedInMutation.ts

import { ref, update } from "firebase/database";

import { useFirebaseDatabase } from "../../services/useFirebase";

/**
 * Mutation hook for writing the bag-storage opted-in flag for a single occupant.
 *
 * Returns a single `setBagStorageOptedIn` function. The caller is responsible
 * for managing pending state and error handling.
 */
function useSetBagStorageOptedInMutation() {
  const database = useFirebaseDatabase();

  /**
   * Writes `{ optedIn: <value> }` to `bagStorage/<occupantId>` in Firebase.
   * Throws on failure; the caller must catch.
   */
  async function setBagStorageOptedIn(occupantId: string, optedIn: boolean): Promise<void> {
    if (!database) {
      throw new Error("Database not initialized.");
    }
    await update(ref(database, `bagStorage/${occupantId}`), { optedIn });
  }

  return { setBagStorageOptedIn };
}

export default useSetBagStorageOptedInMutation;
