interface DepositReleaseConfig {
    enabled: boolean;
    intervalMs: number;
}
export declare function releaseDepositsOnce(shop?: string): Promise<void>;
export declare function startDepositReleaseService(overrides?: Record<string, Partial<DepositReleaseConfig>>): () => void;

