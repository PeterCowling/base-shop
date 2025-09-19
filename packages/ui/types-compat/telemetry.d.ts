declare module "@acme/telemetry" {
  export function track(
    name: string,
    payload?: Record<string, unknown>
  ): void;
}

