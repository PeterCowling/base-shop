export declare function releaseDepositsOnce(shopId?: string, dataRoot?: string): Promise<void>;
type DepositReleaseConfig = {
    enabled: boolean;
    /** Interval in minutes between service runs */
    intervalMinutes: number;
};
export declare function startDepositReleaseService(configs?: Record<string, Partial<DepositReleaseConfig>>, dataRoot?: string): Promise<() => void>;
export {};
