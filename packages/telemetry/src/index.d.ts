export interface TelemetryEvent {
    name: string;
    payload?: Record<string, unknown>;
    ts: number;
}
declare function stripPII(payload: Record<string, unknown>): Record<string, unknown>;
declare function flush(): Promise<void>;
export declare function track(name: string, payload?: Record<string, unknown>): void;
export declare const __buffer: TelemetryEvent[];
export declare const __flush: typeof flush;
export declare const __stripPII: typeof stripPII;
export {};
