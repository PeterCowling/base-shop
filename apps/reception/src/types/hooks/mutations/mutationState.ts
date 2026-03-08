/**
 * Shared return-type contract for standardised mutation hooks.
 *
 * `T` is the data type surfaced by the hook (defaults to `void` for hooks
 * that return no meaningful result). `error` is typed as `unknown` — the
 * correct TypeScript type for values captured in a `catch` block.
 *
 * Hooks that expose additional fields (e.g. `success`, domain result types)
 * use this as an intersection base:
 *   `MutationState<void> & { mutationFn: ...; success: string | null }`
 */
export interface MutationState<T = void> {
  loading: boolean;
  error: unknown;
  /** Optional typed result surface. Hooks that return `void` omit this field. */
  data?: T;
}
