export interface TelemetryEvent {
    name: string;
    payload?: Record<string, unknown>;
    ts: number;
}
declare function stripPII(payload: Record<string, unknown>): Record<string, unknown>;
declare function flush(): Promise<void>;
export declare function track(name: string, payload?: Record<string, unknown>): void;
/**
 * Capture and report an error to telemetry
 * @param error - The error to capture
 * @param context - Optional context about where/why the error occurred
 */
export declare function captureError(error: unknown, context?: {
    scope?: string;
    event?: string;
    metadata?: Record<string, unknown>;
    app?: string;
    [key: string]: unknown;
}): void;
export declare const __buffer: TelemetryEvent[];
export declare const __flush: typeof flush;
export declare const __stripPII: typeof stripPII;
export {};
//# sourceMappingURL=index.d.ts.map