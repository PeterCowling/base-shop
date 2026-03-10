// Canonical refetch type for all React Query–backed pureData hooks.
// Replace per-hook async wrappers with: `refetch: rqRefetch as unknown as PureDataRefetch`
export type PureDataRefetch = () => Promise<void>;
