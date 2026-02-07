// apps/telemetry-worker/src/types.ts

export interface TelemetryEvent {
  id?: string;
  name: string;
  payload?: Record<string, unknown>;
  ts: number;

  // Error tracking fields
  kind?: "event" | "error";
  level?: "info" | "warning" | "error" | "fatal";
  fingerprint?: string;
  message?: string;
  stack?: string;

  // Context fields
  app?: string;
  env?: string;
  requestId?: string;
  shopId?: string;
  url?: string;
}

export interface QueryParams {
  kind?: string;
  name?: string;
  app?: string;
  level?: string;
  start?: number;
  end?: number;
  limit: number;
  cursor?: string;
}
