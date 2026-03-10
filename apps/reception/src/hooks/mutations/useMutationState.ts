import { type Dispatch, type SetStateAction, useState } from "react";

import type { MutationState } from "../../types/hooks/mutations/mutationState";

/**
 * useMutationState
 *
 * Shared hook that manages `loading` and `error` state for Firebase mutation hooks.
 * Exposes:
 *  - `loading`    — boolean, true while the mutation is in-flight
 *  - `error`      — unknown, set to the caught error on failure (null otherwise)
 *  - `run<T>(fn)` — wrapper: sets loading=true, clears error, awaits fn,
 *                   catches any thrown error into state (re-throws), clears loading in finally
 *  - `setLoading` / `setError` — raw state dispatchers for hooks that cannot use run()
 *                                (e.g. hooks whose mutation functions return structured results
 *                                 instead of throwing, such as useBleeperMutations)
 */
export default function useMutationState(): MutationState<void> & {
  run: <T>(fn: () => Promise<T>) => Promise<T>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<unknown>>;
} {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<unknown>(null);

  async function run<T>(fn: () => Promise<T>): Promise<T> {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, run, setLoading, setError };
}
