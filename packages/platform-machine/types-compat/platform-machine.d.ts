// Types-compat declarations for @acme/platform-machine paths

declare module "@acme/platform-machine" {
  export interface ReverseLogisticsConfig {
    shopId: string;
    pollInterval?: number;
    enabled?: boolean;
    [k: string]: any;
  }

  export interface ReleaseDepositsConfig {
    shopId: string;
    daysAfterReturn?: number;
    enabled?: boolean;
    [k: string]: any;
  }

  export interface LateFeeConfig {
    shopId: string;
    gracePeriodDays?: number;
    dailyRate?: number;
    enabled?: boolean;
    [k: string]: any;
  }

  export function resolveConfig(dataRoot?: string): Promise<any>;
  export function startReverseLogisticsService(config: any, dataRoot?: string, processor?: (shopId: string) => Promise<void>): Promise<() => void>;
  export function stopReverseLogisticsService(): Promise<void>;
  export function processReverseLogisticsEventsOnce(shopId?: string, dataRoot?: string): Promise<number>;
  export function writeReverseLogisticsEvent(shopId: string, sessionId: string, eventType: string, dataRoot?: string): Promise<void>;
  export function releaseDepositsOnce(shopId?: string, dataRoot?: string): Promise<number>;
  export function startReleaseDepositsService(config: ReleaseDepositsConfig): Promise<void>;
  export function stopReleaseDepositsService(): Promise<void>;
  export function startDepositReleaseService(config?: any, dataRoot?: string, processor?: (...args: any[]) => any, options?: any): Promise<() => void>;
  export function chargeLateFees(shopId: string): Promise<number>;
  export function startLateFeeService(config: LateFeeConfig): Promise<void>;
  export function stopLateFeeService(): Promise<void>;
}

declare module "@acme/platform-machine/src/startReverseLogisticsService" {
  export function startReverseLogisticsService(config: any, dataRoot?: string, processor?: (shopId: string) => Promise<void>): Promise<() => void>;
  export function stopReverseLogisticsService(): Promise<void>;
  export default startReverseLogisticsService;
}

declare module "@acme/platform-machine/releaseDepositsService" {
  export function releaseDepositsOnce(shopId: string): Promise<number>;
  export function startReleaseDepositsService(config: any): Promise<void>;
  export function stopReleaseDepositsService(): Promise<void>;
  export default releaseDepositsOnce;
}

declare module "@acme/platform-machine/maintenanceScheduler" {
  export interface MaintenanceConfig {
    shopId: string;
    checkInterval?: number;
    enabled?: boolean;
    [k: string]: any;
  }

  export interface MaintenanceSchedule {
    productId: string;
    nextMaintenanceDate: string;
    maintenanceType: string;
    [k: string]: any;
  }

  export function scheduleMaintenanceCheck(shopId: string): Promise<MaintenanceSchedule[]>;
  export function runMaintenanceScan(dataRoot?: string): Promise<void>;
  export function runMaintenanceScheduler(config: MaintenanceConfig): Promise<void>;
  export function startMaintenanceScheduler(dataRoot?: string): NodeJS.Timeout;
  export function stopMaintenanceScheduler(): Promise<void>;
  export function getMaintenanceSchedule(shopId: string): Promise<MaintenanceSchedule[]>;
  export default scheduleMaintenanceCheck;
}
