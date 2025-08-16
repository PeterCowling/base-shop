/**
 * Scan inventory nightly and log items that require maintenance or retirement.
 */
export declare function runMaintenanceScan(dataRoot?: string): Promise<void>;
/**
 * Start nightly maintenance scheduler.
 */
export declare function startMaintenanceScheduler(): NodeJS.Timeout;
