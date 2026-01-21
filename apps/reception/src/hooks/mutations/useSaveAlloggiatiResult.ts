/* File: /src/hooks/mutations/useSaveAlloggiatiResult.ts */

import { ref, set } from "firebase/database";
import { useCallback, useState } from "react";

import { useFirebaseDatabase } from "../../services/useFirebase";

/**
 * Optional error data if status is "error."
 * We never use 'any', so fields must be explicitly typed.
 */
interface AlloggiatiErrorData {
  erroreCod?: string;
  erroreDes?: string;
  erroreDettaglio?: string;
  occupantRecord?: string;
  occupantRecordLength?: number;
}

/**
 * Shape of the hook's return object for saving Alloggiati results.
 */
export interface UseSaveAlloggiatiResult {
  saveAlloggiatiResult: (
    dateKey: string,
    occupantId: string,
    status: string,
    timestamp: string,
    errorData?: AlloggiatiErrorData
  ) => Promise<void>;
  error: unknown;
}

/**
 * A hook that sets the "allogharti/<date_key>/<occupant_id>" path in Firebase.
 * Using 'set' completely overwrites old data with new data, ensuring that
 * previous error fields are removed if a new success or a new error arrives.
 *
 * The occupant data stored looks like:
 *  {
 *    result: <string>,            // "ok" or "error"
 *    timestamp: <ISO 8601 string>,
 *    erroreCod?: string,          // present only if result is "error"
 *    erroreDes?: string,
 *    erroreDettaglio?: string,
 *    occupantRecord?: string,
 *    occupantRecordLength?: number
 *  }
 *
 * To avoid breaking other code:
 * - The first four parameters remain as before.
 * - The optional `errorData` parameter holds failure details if any.
 * - We never partially merge; we overwrite entirely to remove stale error data.
 */
export default function useSaveAlloggiatiResult(): UseSaveAlloggiatiResult {
  const database = useFirebaseDatabase();
  const [error, setError] = useState<unknown>(null);

  /**
   * Memoized function that overwrites the occupant data in Firebase.
   * If `status` is "ok", old error fields are removed because we're using 'set'.
   * If `status` is "error", any old error fields are replaced with new ones.
   */
  const saveAlloggiatiResult = useCallback(
    async (
      dateKey: string,
      occupantId: string,
      status: string,
      timestamp: string,
      errorData?: AlloggiatiErrorData
    ) => {
      try {
        const path = `allogharti/${dateKey}/${occupantId}`;

        // Build the occupant data to be saved
        const occupantData: {
          result: string;
          timestamp: string;
          erroreCod?: string;
          erroreDes?: string;
          erroreDettaglio?: string;
          occupantRecord?: string;
          occupantRecordLength?: number;
        } = {
          result: status,
          timestamp,
        };

        // Append error data if present
        if (errorData) {
          occupantData.erroreCod = errorData.erroreCod;
          occupantData.erroreDes = errorData.erroreDes;
          occupantData.erroreDettaglio = errorData.erroreDettaglio;
          occupantData.occupantRecord = errorData.occupantRecord;
          occupantData.occupantRecordLength = errorData.occupantRecordLength;
        }

        // 'set' overwrites any existing data, removing stale fields
        await set(ref(database, path), occupantData);
      } catch (err) {
        setError(err);
        throw err; // re-throw to allow external handling
      }
    },
    [database]
  );

  return { saveAlloggiatiResult, error };
}
