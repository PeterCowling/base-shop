export declare function chargeLateFeesOnce(shopId?: string, dataRoot?: string): Promise<void>;
type LateFeeConfig = {
    enabled: boolean;
    /** Interval in minutes between service runs */
    intervalMinutes: number;
};
export declare function startLateFeeService(configs?: Record<string, Partial<LateFeeConfig>>, dataRoot?: string): Promise<() => void>;
export {};
