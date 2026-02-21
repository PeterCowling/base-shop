// Minimal TelemetryEvent type that matches packages/telemetry's real interface
export interface TelemetryEvent {
  name: string;
  payload?: Record<string, unknown>;
  ts: number;
}

export function track(_name: string, _payload: Record<string, unknown> = {}) {}
