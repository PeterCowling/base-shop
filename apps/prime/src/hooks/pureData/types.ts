/**
 * Canonical refetch type for all React Query–backed pureData hooks.
 *
 * `rqRefetch` returns `Promise<QueryObserverResult<...>>` which callers don't
 * need. Use `rqRefetch as unknown as PureDataRefetch` to satisfy this interface
 * — the cast is safe because the extra result data is simply discarded.
 */
export type PureDataRefetch = () => Promise<void>;
