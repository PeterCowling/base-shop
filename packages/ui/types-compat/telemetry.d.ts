// i18n-exempt file -- DS-1234 [ttl=2025-11-30] — type declarations only; no user-facing copy
declare module "@acme/telemetry" {
  export function track(
    name: string,
    payload?: Record<string, unknown>
  ): void;
  export function captureError(
    error: unknown,
    context?: Record<string, unknown>
  ): Promise<void>;
}
