/* src/hook/data/usePreorder.ts */
import { useMemo } from "react";

import type { PreorderState } from "../../types/hooks/data/preorderData";

import useFirebaseSubscription from "./useFirebaseSubscription";

/**
 * Data Hook: Retrieves the entire "preorder" node from Firebase.
 *
 * This hook does not apply any transformations. It simply reads and
 * returns the data from the "preorder" node.
 */
export default function usePreorder() {
  const { data, loading, error } =
    useFirebaseSubscription<PreorderState>("preorder");

  const preorder = useMemo(() => data ?? null, [data]);

  return { preorder, loading, error };
}
