// File: /src/hooks/mutations/useSetFridgeUsedMutation.ts

import { ref, update } from "firebase/database";

import { useFirebaseDatabase } from "../../services/useFirebase";

/**
 * Mutation hook for writing the fridge-used flag for a single occupant.
 *
 * Returns a single `setFridgeUsed` function. The caller is responsible
 * for managing pending state and error handling.
 */
function useSetFridgeUsedMutation() {
  const database = useFirebaseDatabase();

  /**
   * Writes `{ used: <value> }` to `fridgeStorage/<occupantId>` in Firebase.
   * Throws on failure; the caller must catch.
   */
  async function setFridgeUsed(occupantId: string, used: boolean): Promise<void> {
    if (!database) {
      throw new Error("Database not initialized.");
    }
    await update(ref(database, `fridgeStorage/${occupantId}`), { used });
  }

  return { setFridgeUsed };
}

export default useSetFridgeUsedMutation;
