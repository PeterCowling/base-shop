/* src/hooks/data/useEodClosureData.ts */

import { type EodClosure, eodClosureSchema } from "../../schemas/eodClosureSchema";
import { extractItalyDate, getItalyIsoString } from "../../utils/dateUtils";

import useFirebaseSubscription from "./useFirebaseSubscription";

/**
 * Subscribes to today's EOD closure record in Firebase RTDB.
 *
 * Returns:
 * - `closure`: the EodClosure record for today, or null if none exists.
 * - `loading`: true until the first Firebase response is received.
 * - `error`: any subscription or schema-validation error.
 *
 * The path is `eodClosures/<YYYY-MM-DD>` in Italy timezone.
 */
export function useEodClosureData(): {
  closure: EodClosure | null;
  loading: boolean;
  error: unknown;
} {
  const dateKey = extractItalyDate(getItalyIsoString());
  const { data, loading, error } = useFirebaseSubscription<EodClosure>(
    `eodClosures/${dateKey}`,
    eodClosureSchema
  );

  return { closure: data, loading, error };
}
